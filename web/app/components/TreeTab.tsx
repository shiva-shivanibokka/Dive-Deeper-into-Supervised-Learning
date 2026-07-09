"use client";

import { useEffect, useMemo, useState } from "react";
import { FeatMeta, FeatureForm, defaultRow, pretty } from "../lib/form";

type Node = { leaf: true; p: number } | { leaf: false; f: number; thr: number; L: Node; R: Node };
type TreeData = { features: FeatMeta[]; trees: Record<string, { root: Node; acc: number }> };

type Step = { feature: string; thr: number; value: number; goLeft: boolean };

function walk(node: Node, row: number[], feats: FeatMeta[]): { p: number; path: Step[] } {
  const path: Step[] = [];
  let n = node;
  while (!n.leaf) {
    const goLeft = row[n.f] <= n.thr;
    path.push({ feature: feats[n.f].name, thr: n.thr, value: row[n.f], goLeft });
    n = goLeft ? n.L : n.R;
  }
  return { p: n.p, path };
}

export default function TreeTab() {
  const [data, setData] = useState<TreeData | null>(null);
  const [depth, setDepth] = useState("3");
  const [row, setRow] = useState<number[]>([]);

  useEffect(() => {
    fetch("/tree.json")
      .then((r) => r.json())
      .then((d: TreeData) => {
        setData(d);
        setRow(defaultRow(d.features));
      });
  }, []);

  const result = useMemo(() => {
    if (!data || row.length === 0) return null;
    return walk(data.trees[depth].root, row, data.features);
  }, [data, depth, row]);

  if (!data || !result) return <p className="note">loading…</p>;
  const pct = Math.round(result.p * 100);
  const isPos = result.p >= 0.5;

  return (
    <div className="grid2">
      <div>
        <p className="section-label">Configure a person</p>
        <FeatureForm
          features={data.features}
          values={row}
          onChange={(i, v) => setRow((r) => r.map((x, j) => (j === i ? v : x)))}
        />
        <div className="field" style={{ marginTop: "1rem" }}>
          <label>
            Tree depth <b>{depth}</b>
          </label>
          <input type="range" min={2} max={5} step={1} value={Number(depth)} onChange={(e) => setDepth(e.target.value)} />
          <span className="note">Test accuracy at this depth: {(data.trees[depth].acc * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div>
        <div className="readout">
          <div className="lbl">Predicted probability of earning &gt;$50K</div>
          <div className="big">{pct}%</div>
          <div className="probbar">
            <div style={{ width: `${pct}%` }} />
          </div>
          <span className={`pill ${isPos ? "pos" : "neg"}`}>{isPos ? "Predicts >$50K" : "Predicts ≤$50K"}</span>
        </div>

        <p className="section-label" style={{ marginTop: "1.25rem" }}>
          Decision path ({result.path.length} splits)
        </p>
        <div className="bars">
          {result.path.map((s, i) => (
            <div key={i} className="note" style={{ padding: ".4rem .6rem", background: "var(--panel-2)", borderRadius: 8 }}>
              <strong>{pretty(s.feature)}</strong> = {Math.round(s.value)} &nbsp;→&nbsp; is it ≤ {s.thr.toFixed(1)}?{" "}
              <span style={{ color: s.goLeft ? "var(--accent)" : "var(--accent-2)" }}>
                {s.goLeft ? "Yes → go left" : "No → go right"}
              </span>
            </div>
          ))}
        </div>
        <p className="note" style={{ marginTop: ".75rem" }}>
          The tree asks one yes/no question per row, following the branches until it reaches a leaf — exactly
          what Notebook 01 visualizes. Deeper trees ask more questions (and risk overfitting).
        </p>
      </div>
    </div>
  );
}
