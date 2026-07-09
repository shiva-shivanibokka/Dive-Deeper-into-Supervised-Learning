"use client";

import { useEffect, useMemo, useState } from "react";
import { FeatMeta, FeatureForm, defaultRow } from "../lib/form";

type BNode = { v: number } | { f: number; thr: number; L: BNode; R: BNode };
type BoostData = { features: FeatMeta[]; trees: BNode[]; acc: number };

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

// Sum leaf values across every tree, then squash to a probability — this reproduces
// LightGBM's predict_proba exactly (validated in the export script to 1e-6).
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
    fetch("/boost.json")
      .then((r) => r.json())
      .then((d: BoostData) => {
        setData(d);
        setRow(defaultRow(d.features));
      });
  }, []);

  const p = useMemo(() => (data && row.length ? predict(data.trees, row) : null), [data, row]);
  if (!data || p === null) return <p className="note">loading model…</p>;

  const pct = Math.round(p * 100);
  const isPos = p >= 0.5;

  return (
    <div className="grid2">
      <div>
        <p className="section-label">Configure a person — the model re-scores instantly</p>
        <FeatureForm
          features={data.features}
          values={row}
          onChange={(i, v) => setRow((r) => r.map((x, j) => (j === i ? v : x)))}
        />
      </div>
      <div>
        <div className="readout">
          <div className="lbl">LightGBM probability of earning &gt;$50K</div>
          <div className="big">{pct}%</div>
          <div className="probbar">
            <div style={{ width: `${pct}%` }} />
          </div>
          <span className={`pill ${isPos ? "pos" : "neg"}`}>{isPos ? "Predicts >$50K" : "Predicts ≤$50K"}</span>
        </div>
        <p className="note" style={{ marginTop: "1rem" }}>
          This is a genuine <strong>80-tree LightGBM</strong> ({(data.acc * 100).toFixed(1)}% test accuracy),
          exported from Notebook 02 and traversed tree-by-tree right here in your browser — no server call. Try
          flipping <strong>marital status</strong> to “Married-civ-spouse” or raising{" "}
          <strong>capital gain</strong>, and watch the probability jump: that is a live “what-if” explanation of
          the model.
        </p>
      </div>
    </div>
  );
}
