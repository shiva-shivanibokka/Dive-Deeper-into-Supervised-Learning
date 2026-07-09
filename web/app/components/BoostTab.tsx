"use client";

import { useEffect, useMemo, useState } from "react";
import { FeatMeta, FeatureForm, defaultRow } from "../lib/form";

type BNode = { v: number } | { f: number; thr: number; L: BNode; R: BNode };
type BoostData = { features: FeatMeta[]; trees: BNode[]; acc: number };

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

// Sum leaf values across every tree, then squash to a probability — reproduces
// LightGBM's predict_proba exactly (validated to 1e-6 in the export script).
function predict(trees: BNode[], row: number[]): number {
  let sum = 0;
  for (const t of trees) {
    let n = t;
    while (!("v" in n)) n = row[n.f] <= n.thr ? n.L : n.R;
    sum += n.v;
  }
  return sigmoid(sum);
}

export default function BoostTab() {
  const [data, setData] = useState<BoostData | null>(null);
  const [row, setRow] = useState<number[]>([]);

  useEffect(() => {
    fetch("/boost.json").then((r) => r.json()).then((d: BoostData) => {
      setData(d);
      setRow(defaultRow(d.features));
    });
  }, []);

  const p = useMemo(() => (data && row.length ? predict(data.trees, row) : null), [data, row]);
  if (!data || p === null) return <p className="note">loading model…</p>;
  const pct = Math.round(p * 100);
  const isPos = p >= 0.5;

  return (
    <div className="demo">
      <div>
        <p className="section-label">Configure a person · the 80-tree model re-scores instantly as you change anything</p>
        <FeatureForm features={data.features} values={row} onChange={(i, v) => setRow((r) => r.map((x, j) => (j === i ? v : x)))} />
      </div>

      <div className="results">
        <div className="readout">
          <div className="lbl">LightGBM probability of earning &gt;$50K</div>
          <div className="big">{pct}%</div>
          <div className="probbar"><div style={{ width: `${pct}%` }} /></div>
          <div style={{ marginTop: ".6rem" }}>
            <span className={`pill ${isPos ? "pos" : "neg"}`}>{isPos ? "Predicts >$50K" : "Predicts ≤$50K"}</span>
          </div>
        </div>

        <div className="callout note">
          <strong>Unlike the single decision tree, here every control matters.</strong> This is a genuine{" "}
          <strong>80-tree LightGBM</strong> ({(data.acc * 100).toFixed(1)}% test accuracy) from Notebook 02,
          traversed tree-by-tree right in your browser — no server call. Because it blends 80 trees, it uses all
          the features at once. Try flipping <strong>marital status</strong> to “Married-civ-spouse” or raising{" "}
          <strong>capital gain</strong> and watch the probability jump: that's a live “what-if” explanation.
        </div>

        <div className="callout note">
          <strong>Which levers move it most?</strong> The model weighs features unequally. <strong>Capital gain</strong>{" "}
          has the strongest pull — a large gain almost guarantees a &gt;$50K prediction — followed by{" "}
          <strong>education</strong>, <strong>age</strong>, and <strong>hours per week</strong>. <strong>Sex</strong>{" "}
          barely moves the bar, which is on purpose: the model learned to rely on it least. If a control hardly
          changes the number, that just means this model doesn't weight it heavily.
        </div>
      </div>
    </div>
  );
}
