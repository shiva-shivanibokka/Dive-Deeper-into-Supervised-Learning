# -*- coding: utf-8 -*-
"""Train models and export compact JSON artifacts for the client-side web demos.
No ONNX: every demo runs from precomputed arrays or a small JSON model traversed in JS.
Outputs go to web/public/."""
import json, os, numpy as np, warnings
warnings.filterwarnings('ignore')
from sklearn.datasets import fetch_openml, make_moons
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.svm import SVC, SVC as _SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.inspection import partial_dependence
from sklearn.metrics import accuracy_score, roc_curve, precision_recall_curve
from lightgbm import LGBMClassifier
import shap
from itertools import combinations

OUT = os.path.join("web", "public")
os.makedirs(OUT, exist_ok=True)
def dump(name, obj):
    with open(os.path.join(OUT, name), "w") as f:
        json.dump(obj, f, separators=(",", ":"))
    print(f"  wrote {name} ({os.path.getsize(os.path.join(OUT,name))//1024} KB)")

print("Loading Adult...")
adult = fetch_openml('adult', version=2, as_frame=True).frame.drop(columns=['fnlwgt', 'education'])
y = (adult['class'].astype(str) == '>50K').astype(int).values
raw = adult.drop(columns=['class']).copy()

# ---- Interactive form features (interpretable mix of numeric + categorical) ----
NUM = ['age', 'education-num', 'hours-per-week', 'capital-gain']
CAT = ['marital-status', 'occupation', 'relationship', 'sex']
FEATURES = NUM + CAT

# Build fixed category orderings so codes are stable and we can map label<->code in JS.
cat_levels = {}
enc = {}
for c in NUM:
    enc[c] = raw[c].astype(float).values
for c in CAT:
    cats = sorted([str(x) for x in raw[c].dropna().unique()])
    cat_levels[c] = cats
    code = {lab: i for i, lab in enumerate(cats)}
    enc[c] = raw[c].astype(str).map(code).fillna(0).astype(int).values

import pandas as pd
Xf = pd.DataFrame({c: enc[c] for c in FEATURES})

# feature metadata for building input forms
feat_meta = []
for c in FEATURES:
    if c in NUM:
        col = raw[c].astype(float)
        feat_meta.append({"name": c, "kind": "num",
                          "min": float(np.floor(col.min())), "max": float(np.ceil(col.quantile(0.99))),
                          "default": float(round(col.median(), 0))})
    else:
        feat_meta.append({"name": c, "kind": "cat", "levels": cat_levels[c],
                          "default": int(pd.Series(enc[c]).mode()[0])})

Xtr, Xte, ytr, yte = train_test_split(Xf, y, test_size=0.2, random_state=42, stratify=y)

# ============================================================ 01 TREES (one-hot -> readable splits)
print("01 trees (one-hot categoricals for meaningful splits)...")
# Model input columns: numerics as-is, one binary column per category level.
COLS = [{"name": c, "cat": None} for c in NUM]
for c in CAT:
    for code in range(len(cat_levels[c])):
        COLS.append({"name": c, "cat": code})
oh = {c: Xf[c].values.astype(float) for c in NUM}
for c in CAT:
    for code in range(len(cat_levels[c])):
        oh[f"{c}__{code}"] = (Xf[c].values == code).astype(float)
X_oh = pd.DataFrame(oh)  # column order matches COLS exactly
Xoh_tr, Xoh_te, yoh_tr, yoh_te = train_test_split(X_oh, y, test_size=0.2, random_state=42, stratify=y)

def tree_to_json(clf):
    t = clf.tree_
    def node(i):
        if t.children_left[i] == t.children_right[i]:
            v = t.value[i][0]
            return {"leaf": True, "p": float(v[1] / v.sum())}
        return {"leaf": False, "f": int(t.feature[i]), "thr": float(t.threshold[i]),
                "L": node(t.children_left[i]), "R": node(t.children_right[i])}
    return node(0)

trees = {}
for d in [2, 3, 4, 5]:
    clf = DecisionTreeClassifier(max_depth=d, random_state=42).fit(Xoh_tr, yoh_tr)
    trees[str(d)] = {"root": tree_to_json(clf), "acc": round(accuracy_score(yoh_te, clf.predict(Xoh_te)), 4)}
# "form" = the 8 human controls; "cols" = the 33 model columns each split refers to.
dump("tree.json", {"form": feat_meta, "cols": COLS, "trees": trees})

# ============================================================ 02 BOOSTING (LightGBM -> JSON, JS traversal)
print("02 boosting...")
lgbm = LGBMClassifier(n_estimators=80, num_leaves=16, max_depth=4, learning_rate=0.1,
                      random_state=42, verbose=-1).fit(Xtr, ytr)
booster = lgbm.booster_
dumped = booster.dump_model()
def conv(node):
    if "leaf_value" in node:
        return {"v": float(node["leaf_value"])}
    return {"f": int(node["split_feature"]), "thr": float(node["threshold"]),
            "L": conv(node["left_child"]), "R": conv(node["right_child"])}
lgb_trees = [conv(ti["tree_structure"]) for ti in dumped["tree_info"]]
# Validate: JS-equivalent traversal (sum leaf values -> sigmoid) matches predict_proba
def js_pred(row):
    s = 0.0
    for tr in lgb_trees:
        n = tr
        while "v" not in n:
            n = n["L"] if row[n["f"]] <= n["thr"] else n["R"]
        s += n["v"]
    return 1.0 / (1.0 + np.exp(-s))
mine = np.array([js_pred(r) for r in Xte.values[:500]])
skl = lgbm.predict_proba(Xte.iloc[:500])[:, 1]
err = float(np.max(np.abs(mine - skl)))
print(f"   boosting JS-traversal max prob error vs sklearn: {err:.6f}")
assert err < 1e-6, "traversal mismatch"
dump("boost.json", {"features": feat_meta, "trees": lgb_trees,
                    "acc": round(accuracy_score(yte, lgbm.predict(Xte)), 4)})

# ============================================================ 03 ENSEMBLES (precomputed accuracies)
print("03 ensembles...")
# smaller scaled sample so SVC/KNN are fast
Xs, _, ys, _ = train_test_split(Xf, y, train_size=3000, stratify=y, random_state=1)
Xs_tr, Xs_te, ys_tr, ys_te = train_test_split(Xs, ys, test_size=0.25, random_state=42, stratify=ys)
sc = StandardScaler().fit(Xs_tr); Xs_tr_s = sc.transform(Xs_tr); Xs_te_s = sc.transform(Xs_te)
base = {
    "LogReg": LogisticRegression(max_iter=1000, random_state=42),
    "RandomForest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
    "SVM": SVC(probability=True, random_state=42),
    "KNN": KNeighborsClassifier(n_neighbors=15),
}
indiv, preds = {}, {}
for name, m in base.items():
    m.fit(Xs_tr_s, ys_tr)
    p = m.predict(Xs_te_s)
    preds[name] = p
    indiv[name] = round(accuracy_score(ys_te, p), 4)
# accuracy of soft-voting over every non-empty subset (2^4-1 = 15)
subsets = {}
names = list(base.keys())
for r in range(1, len(names) + 1):
    for combo in combinations(names, r):
        vc = VotingClassifier(estimators=[(n, base[n]) for n in combo], voting='soft', n_jobs=-1)
        vc.fit(Xs_tr_s, ys_tr)
        subsets["|".join(combo)] = round(accuracy_score(ys_te, vc.predict(Xs_te_s)), 4)
# pairwise prediction correlation (diversity)
corr = {}
for a in names:
    for b in names:
        corr[a + "|" + b] = round(float(np.corrcoef(preds[a], preds[b])[0, 1]), 3)
dump("ensembles.json", {"individual": indiv, "subsets": subsets, "corr": corr, "models": names})

# ============================================================ 05 KNN/SVM 2D boundaries
print("05 knn/svm 2D...")
Xm, ym = make_moons(n_samples=350, noise=0.25, random_state=42)
xmin, xmax = Xm[:, 0].min() - 0.5, Xm[:, 0].max() + 0.5
ymin, ymax = Xm[:, 1].min() - 0.5, Xm[:, 1].max() + 0.5
G = 70
xx = np.linspace(xmin, xmax, G); yy = np.linspace(ymin, ymax, G)
grid = np.array([[a, b] for b in yy for a in xx])  # row-major: y outer, x inner
def boundary(model):
    model.fit(Xm, ym)
    return model.predict(grid).astype(int).tolist()
configs = {}
for k in [1, 5, 25, 101]:
    configs[f"knn_k{k}"] = {"label": f"k-NN (k={k})", "grid": boundary(KNeighborsClassifier(n_neighbors=k))}
for kern, C, g in [("linear", 1, "scale"), ("rbf", 1, 0.5), ("rbf", 1, 5), ("rbf", 100, 5)]:
    key = f"svm_{kern}_C{C}_g{g}"
    lab = f"SVM {kern}" + (f", C={C}, γ={g}" if kern == "rbf" else "")
    configs[key] = {"label": lab, "grid": boundary(SVC(kernel=kern, C=C, gamma=g, random_state=42))}
dump("knnsvm.json", {
    "x": [round(float(v), 3) for v in xx], "y": [round(float(v), 3) for v in yy], "G": G,
    "points": [[round(float(a), 3), round(float(b), 3), int(c)] for (a, b), c in zip(Xm, ym)],
    "configs": configs,
})

# ============================================================ 06 INTERPRETABILITY (PDP + SHAP examples)
print("06 interpretability...")
pdp = {}
for c in ['age', 'education-num', 'hours-per-week', 'marital-status']:
    fi = FEATURES.index(c)
    r = partial_dependence(lgbm, Xtr, [fi], grid_resolution=25, kind='average')
    pdp[c] = {"x": [round(float(v), 3) for v in r["grid_values"][0]],
              "y": [round(float(v), 4) for v in r["average"][0]]}
# SHAP for a diverse set of example people, spanning low -> high predicted probability
expl = shap.TreeExplainer(lgbm)
_probs_all = lgbm.predict_proba(Xte)[:, 1]
_order = np.argsort(_probs_all)
_pick = _order[np.linspace(0, len(_order) - 1, 16).astype(int)]
ex_rows = Xte.iloc[_pick].reset_index(drop=True)
sv = expl(ex_rows)
base_val = float(np.array(sv.base_values).ravel()[0])
examples = []
for i in range(len(ex_rows)):
    contribs = [{"f": FEATURES[j], "val": float(ex_rows.iloc[i, j]), "shap": round(float(sv.values[i][j]), 4)}
                for j in range(len(FEATURES))]
    examples.append({"p": round(float(lgbm.predict_proba(ex_rows.iloc[[i]])[0, 1]), 4),
                     "contribs": sorted(contribs, key=lambda z: -abs(z["shap"]))})
dump("interp.json", {"pdp": pdp, "base": base_val, "examples": examples, "features": feat_meta})

# ============================================================ 07 THRESHOLD (multiple models)
print("07 threshold (LightGBM / Random Forest / Logistic Regression)...")
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

idx = np.random.RandomState(0).choice(len(yte), size=min(2500, len(yte)), replace=False)
def thin(a, n=140):
    a = np.asarray(a); step = max(1, len(a) // n); return [round(float(v), 4) for v in a[::step]]

th_models = {
    "LightGBM": LGBMClassifier(n_estimators=300, learning_rate=0.05, random_state=42, verbose=-1),
    "Random Forest": RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1),
    "Logistic Regression": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, random_state=42)),
}
out_m = {}
for name, m in th_models.items():
    m.fit(Xtr, ytr)
    p = m.predict_proba(Xte)[:, 1]
    fpr, tpr, _ = roc_curve(yte, p)
    prec, rec, _ = precision_recall_curve(yte, p)
    out_m[name] = {"prob": [round(float(p[i]), 4) for i in idx],
                   "roc": {"fpr": thin(fpr), "tpr": thin(tpr)},
                   "pr": {"rec": thin(rec), "prec": thin(prec)}}
    print(f"   {name}: exported")
# y is shared across models (same test rows), so confusion matrices are comparable.
dump("threshold.json", {"y": [int(yte[i]) for i in idx], "pos_rate": round(float(yte.mean()), 4), "models": out_m})

print("\nAll artifacts exported to", OUT)
