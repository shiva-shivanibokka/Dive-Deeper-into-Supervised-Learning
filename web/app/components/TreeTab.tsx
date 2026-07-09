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

// Every feature this tree can branch on (so we can badge the controls that matter).
function usedFeatures(node: Node, feats: FeatMeta[], acc = new Set<string>()): Set<string> {
  if (!node.leaf) {
    acc.add(feats[node.f].name);
    usedFeatures(node.L, feats, acc);
    usedFeatures(node.R, feats, acc);
  }
  return acc;
}

export default function TreeTab() {
  const [data, setData] = useState<TreeData | null>(null);
  const [depth, setDepth] = useState("3");
  const [row, setRow] = useState<number[]>([]);

  useEffect(() => {
    fetch("/tree.json").then((r) => r.json()).then((d: TreeData) => {
      setData(d);
      setRow(defaultRow(d.features));
    });
  }, []);

  const used = useMemo(() => (data ? usedFeatures(data.trees[depth].root, data.features) : new Set<string>()), [data, depth]);
  const result = useMemo(() => (data && row.length ? walk(data.trees[depth].root, row, data.features) : null), [data, depth, row]);

  if (!data || !result) return <p className="note">loading…</p>;
  const pct = Math.round(result.p * 100);
  const isPos = result.p >= 0.5;

  return (
    <div className="demo">
      <div>
        <p className="section-label">Configure a person · controls with the “on path” tag are the ones this tree actually asks about</p>
        <FeatureForm features={data.features} values={row} used={used} onChange={(i, v) => setRow((r) => r.map((x, j) => (j === i ? v : x)))} />
        <div className="field" style={{ maxWidth: 420, marginTop: "1.1rem" }}>
          <label>
            <span className="lname">Tree depth</span>
            <b>{depth}</b>
          </label>
          <input type="range" min={2} max={5} step={1} value={Number(depth)} onChange={(e) => setDepth(e.target.value)} />
          <span className="note">Deeper trees ask more questions ({(data.trees[depth].acc * 100).toFixed(1)}% test accuracy) — and use more of the controls.</span>
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
          <strong>Only some controls change the answer — and that's correct.</strong> A decision tree follows a
          single path of yes/no questions, so it only ever looks at the features on that path (tagged{" "}
          <span className="badge-used">on path</span> above). Changing a feature the tree never asks about can't
          move the prediction. Increase the depth and the tree asks about more features.
        </div>

        <div>
          <p className="section-label">Decision path — {result.path.length} question{result.path.length === 1 ? "" : "s"} asked</p>
          <div className="bars">
            {result.path.map((s, i) => (
              <div key={i} className="note" style={{ padding: ".55rem .8rem", background: "var(--panel-2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <strong>{pretty(s.feature)}</strong> = {Math.round(s.value)} &nbsp;·&nbsp; is it ≤ {s.thr.toFixed(1)}?{" "}
                <span style={{ color: s.goLeft ? "var(--lime)" : "var(--cyan)", fontWeight: 600 }}>
                  {s.goLeft ? "Yes → go left" : "No → go right"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
