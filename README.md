# Dive Deeper into Supervised Learning

A hands-on, from-first-principles tour of **classical supervised machine learning** — seven self-contained
notebooks that build every major model family and the full workflow around them (tuning, interpreting,
evaluating), each with plain-language explanations and a **"How to Read This Chart"** guide for every
visualization.

Built for two audiences at once: a complete beginner who wants the *why* behind each method, and a working
practitioner who wants a clean, correct reference.

### ▶ [**Live demo → dive-deeper-supervised-learning.vercel.app**](https://dive-deeper-supervised-learning.vercel.app)

A browser-based playground where six of these models run **live, entirely client-side** — no install, no
backend. Walk a decision tree, run a real 80-tree LightGBM as you change a person's features, reshape SVM
boundaries, and drag a classification threshold while the confusion matrix and ROC/PR curves update in
real time.

---

## The Notebooks

| # | Notebook | What It Covers | Dataset(s) |
|---|----------|----------------|------------|
| 01 | [Decision Trees](01_decision_trees.ipynb) | Gini/entropy, recursive splitting, feature vs permutation importance, the bias-variance tradeoff, overfitting, cost-complexity pruning | Adult Income, Ames Housing |
| 02 | [Boosting Models](02_boosting_models.ipynb) | AdaBoost, LightGBM, CatBoost (native categoricals), XGBoost, class imbalance (SMOTE / `class_weight`), **SHAP**, probability calibration, learning curves | Adult Income, Ames Housing |
| 03 | [Ensemble Strategies](03_ensemble_strategies.ipynb) | Why diversity works, prediction correlation, bagging, random forests, hard/soft voting, **stacking** with out-of-fold predictions, production pipelines | Adult Income, Ames Housing |
| 04 | [Hyperparameter Optimization](04_hyperparameter_optimization.ipynb) | Grid vs random vs **Bayesian (Optuna/TPE)** search, search-space design, trial pruning, parameter importance | Adult Income, Ames Housing |
| 05 | [k-NN & SVM](05_knn_and_svm.ipynb) | The non-tree classics: distance & scaling, choosing *k*, the **kernel trick**, the C and gamma knobs, decision-boundary visualizations, SVR | Adult Income, Ames Housing, 2D synthetic |
| 06 | [Interpretability](06_interpretability.ipynb) | Explainable AI: permutation importance, **PDP & ICE**, **SHAP** (global + local), **LIME**, and surrogate models | Adult Income, Ames Housing |
| 07 | [Evaluation & Threshold Selection](07_evaluation_and_threshold_selection.ipynb) | Why accuracy lies, the confusion matrix, **ROC vs precision-recall**, sweeping the decision threshold, **cost-sensitive** thresholds | Adult Income |

They're ordered as a learning arc: **build models** (01–03) → **tune them** (04) → **round out the algorithm
zoo** (05) → **explain them** (06) → **turn them into good decisions** (07). Together they cover the full
lifecycle of a supervised-learning model.

---

## What Makes These Different

- **Every chart is explained.** No unlabeled plots. Each visualization has a dedicated *"How to Read This
  Chart"* section that walks through the axes, the colors, and what to actually conclude.
- **Plain English first, then code.** Every section opens with an everyday-language explanation and an analogy
  before any code appears. Code is heavily commented in the same layman voice.
- **Honest results.** When tuning barely beats the default, the notebook says so. When an ensemble doesn't help,
  it shows why. The goal is understanding, not a highlight reel.
- **Real datasets, one coherent story.** Instead of a different toy set per notebook, the whole series uses two
  real datasets — **Adult Census Income** (classification) and **Ames Housing** (regression) — so you see the
  same data through every lens.
- **Concepts demonstrated for real.** CatBoost's native categorical handling actually runs on raw categorical
  columns; SHAP explanations use human-readable feature names; imbalance handling is shown on genuinely
  imbalanced data.

---

## The Datasets

| Dataset | Task | Why it's used |
|---------|------|---------------|
| **[Adult Census Income](https://www.openml.org/d/1590)** (~48.8k rows) | Binary classification — predict whether a person earns >\$50K | Real mix of numeric + categorical features and a natural ~24% class imbalance — ideal for CatBoost's categoricals, SHAP's readability, and imbalance/threshold lessons |
| **[Ames Housing](https://www.openml.org/d/42165)** (~1.5k rows, 79 features) | Regression — predict a house's sale price in dollars | A rich, realistic regression problem that replaces the overused toy housing datasets |
| **2D synthetic** (`make_moons`, `make_classification`) | — | Only for *drawing* decision boundaries, which need two dimensions |

Some notebooks use a stratified **sample** of Adult where an algorithm scales poorly to tens of thousands of
rows (e.g. SVM and k-NN in notebooks 03 and 05); this is called out explicitly wherever it happens, and never
changes the conclusions. Datasets download automatically from OpenML on first run.

---

## Interactive Web Demo

**Live:** https://dive-deeper-supervised-learning.vercel.app

The [`web/`](web/) directory is a **Next.js** app that runs six of the notebooks' models **entirely in your
browser** — every prediction is computed client-side from precomputed model artifacts (no server, no upload,
nothing leaves your machine). Deployed on **Vercel**.

| Demo | What you can do |
|------|-----------------|
| **Decision Tree** | Configure a person, pick a tree depth, and watch it walk the decision path to a prediction |
| **Boosting (LightGBM)** | A real 80-tree LightGBM runs live — change a feature and watch the income probability move (a "what-if" explanation) |
| **Ensembles** | Toggle base models in/out of a soft-voting ensemble and see accuracy and diversity respond |
| **k-NN & SVM** | Switch *k*, kernel, C, and gamma and watch the 2D decision boundary reshape |
| **Interpretability** | Partial-dependence curves and per-person SHAP explanations |
| **Threshold Selector** | Drag the decision threshold; the confusion matrix, precision/recall, and ROC/PR operating points update live |

```bash
cd web
npm install
npm run dev     # then open http://localhost:3000
```

---

## Quickstart

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Launch Jupyter
jupyter notebook

# 3. Open any notebook and run all cells — datasets download automatically on first run.
```

A GPU is **not** required; every notebook runs on CPU in a few minutes.

---

## Tech Stack

- **scikit-learn** — trees, ensembles, k-NN, SVM, metrics, pipelines, inspection tools
- **LightGBM · CatBoost · XGBoost** — gradient boosting
- **Optuna** — Bayesian hyperparameter optimization
- **SHAP · LIME** — model interpretability
- **imbalanced-learn** — SMOTE and imbalance handling
- **matplotlib · seaborn** — visualization

---

## Repository Structure

```
.
├── 01_decision_trees.ipynb
├── 02_boosting_models.ipynb
├── 03_ensemble_strategies.ipynb
├── 04_hyperparameter_optimization.ipynb
├── 05_knn_and_svm.ipynb
├── 06_interpretability.ipynb
├── 07_evaluation_and_threshold_selection.ipynb
├── requirements.txt
├── LICENSE
└── README.md
```

---

## License

Released under the [MIT License](LICENSE).

---

*By Shivani Bokka — part of a broader "Dive Deeper" series spanning linear models, deep learning, and
unsupervised learning.*
