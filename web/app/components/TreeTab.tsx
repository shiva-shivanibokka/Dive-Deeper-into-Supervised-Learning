"use client";

import { useEffect, useMemo, useState } from "react";
import { Col, FeatMeta, FeatureForm, buildModelRow, defaultRow, pretty } from "../lib/form";

type Node = { leaf: true; p: number } | { leaf: false; f: number; thr: number; L: Node; R: Node };
type TreeData = { form: FeatMeta[]; cols: Col[]; trees: Record<string, { root: Node; acc: number }> };

type Step =
  | { kind: "num"; name: string; thr: number; value: number; goLeft: boolean }
  | { kind: "cat"; name: string; label: string; isThis: boolean; goLeft: boolean };

function idxOf(form: FeatMeta[], name: string) {
  return form.findIndex((f) => f.name === name);
}

function walk(root: Node, modelRow: number[], cols: Col[], form: FeatMeta[], formRow: number[]) {
  const path: Step[] = [];
  let n = root;
  while (!n.leaf) {
    const col = cols[n.f];
    const goLeft = modelRow[n.f] <= n.thr;
    if (col.cat === null) {
      path.push({ kind: "num", name: col.name, thr: n.thr, value: formRow[idxOf(form, col.name)], goLeft });
    } else {
      const meta = form[idxOf(form, col.name)];
      const label = meta.kind === "cat" ? meta.levels[col.cat] : String(col.cat);
      path.push({ kind: "cat", name: col.name, label, isThis: modelRow[n.f] === 1, goLeft });
    }
    n = goLeft ? n.L : n.R;
  }
  return { p: n.p, path };
}

function usedNames(node: Node, cols: Col[], acc = new Set<string>()): Set<string> {
  if (!node.leaf) {
    acc.add(cols[node.f].name);
    usedNames(node.L, cols, acc);
    usedNames(node.R, cols, acc);
  }
  return acc;
}

export default function TreeTab() {
  const [data, setData] = useState<TreeData | null>(null);
  const [depth, setDepth] = useState("3");
  const [formRow, setFormRow] = useState<number[]>([]);

  useEffect(() => {
    fetch("/tree.json").then((r) => r.json()).then((d: TreeData) => {
      setData(d);
      setFormRow(defaultRow(d.form));
    });
  }, []);

  const used = useMemo(() => (data ? usedNames(data.trees[depth].root, data.cols) : new Set<string>()), [data, depth]);
  const result = useMemo(() => {
    if (!data || !formRow.length) return null;
    const modelRow = buildModelRow(formRow, data.form, data.cols);
    return walk(data.trees[depth].root, modelRow, data.cols, data.form, formRow);
  }, [data, depth, formRow]);

  if (!data || !result) return <p className="note">loading…</p>;
  const pct = Math.round(result.p * 100);
  const isPos = result.p >= 0.5;

  return (
    <div className="demo">
      <div>
        <p className="section-label">Configure a person · controls tagged “on path” are the ones this tree actually asks about</p>
        <FeatureForm features={data.form} values={formRow} used={used} onChange={(i, v) => setFormRow((r) => r.map((x, j) => (j === i ? v : x)))} />
        <div className="field" style={{ maxWidth: 420, marginTop: "1.1rem" }}>
          <label>
            <span className="lname">Tree depth</span>
            <b>{depth}</b>
          </label>
          <input type="range" min={2} max={5} step={1} value={Number(depth)} onChange={(e) => setDepth(e.target.value)} />
          <span className="note">Deeper trees ask more questions ({(data.trees[depth].acc * 100).toFixed(1)}% test accuracy) and use more of the controls.</span>
        </div>
      </div>

      <div className="results">
        <div className="readout">
          <div className="lbl">Predicted probability of earning &gt;$50K</div>
          <div className="big">{pct}%</div>
          <div className="probbar"><div style={{ width: `${pct}%` }} /></div>
          <div style={{ marginTop: ".6rem" }}>
            <span className={`pill ${isPos ? "pos" : "neg"}`}>{isPos ? "Predicts >$50K" : "Predicts ≤$50K"}</span>
          </div>
        </div>

        <div className="callout note">
          <strong>Only the “on path” controls change the answer — and that's correct.</strong> A decision tree
          follows one chain of yes/no questions, so it only looks at the features on that path. Changing a
          feature it never asks about can't move the prediction; raise the depth and it asks about more.
        </div>

        <div>
          <p className="section-label">Decision path — {result.path.length} question{result.path.length === 1 ? "" : "s"} asked</p>
          <div className="bars">
            {result.path.map((s, i) => (
              <div key={i} className="note" style={{ padding: ".6rem .85rem", background: "var(--panel-2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                {s.kind === "num" ? (
                  <>
                    <strong>{pretty(s.name)}</strong> is {Math.round(s.value)} · is it ≤ {s.thr.toFixed(1)}?{" "}
                    <span style={{ color: s.goLeft ? "var(--lime)" : "var(--cyan)", fontWeight: 700 }}>{s.goLeft ? "Yes → left" : "No → right"}</span>
                  </>
                ) : (
                  <>
                    Is <strong>{pretty(s.name)}</strong> = <strong>{s.label}</strong>?{" "}
                    <span style={{ color: s.isThis ? "var(--cyan)" : "var(--lime)", fontWeight: 700 }}>{s.isThis ? "Yes → right" : "No → left"}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="callout note">
          <strong>Why does “unmarried” lower the prediction?</strong> It's a pattern the model learned from the
          1994 data, not a value judgment: in that census, being a husband or wife (~45% earn &gt;$50K) tracked
          much higher household income than being unmarried, a child, or living alone (1.5–10%). The model simply
          reflects that. Note there are <em>two</em> related controls — <strong>marital status</strong> (legal
          status) and <strong>relationship</strong> (role in the household) — both real census fields.
        </div>
      </div>
    </div>
  );
}
