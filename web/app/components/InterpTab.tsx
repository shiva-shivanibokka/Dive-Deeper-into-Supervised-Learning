"use client";

import { useEffect, useState } from "react";
import { FeatMeta, pretty } from "../lib/form";

type Contrib = { f: string; val: number; shap: number };
type InterpData = {
  pdp: Record<string, { x: number[]; y: number[] }>;
  base: number;
  examples: { p: number; contribs: Contrib[] }[];
  features: FeatMeta[];
};

function PdpChart({ x, y }: { x: number[]; y: number[] }) {
  const W = 320,
    H = 150,
    pad = 24;
  const ymin = Math.min(...y),
    ymax = Math.max(...y);
  const sx = (i: number) => pad + (i / (x.length - 1)) * (W - 2 * pad);
  const sy = (v: number) => H - pad - ((v - ymin) / (ymax - ymin || 1)) * (H - 2 * pad);
  const d = x.map((_, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(y[i]).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 10, background: "var(--panel-2)" }}>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} />
      <text x={pad} y={H - 6} fill="var(--muted)" fontSize={9}>{x[0].toFixed(0)}</text>
      <text x={W - pad} y={H - 6} fill="var(--muted)" fontSize={9} textAnchor="end">{x[x.length - 1].toFixed(0)}</text>
      <text x={4} y={pad} fill="var(--muted)" fontSize={9}>{ymax.toFixed(2)}</text>
      <text x={4} y={H - pad} fill="var(--muted)" fontSize={9}>{ymin.toFixed(2)}</text>
    </svg>
  );
}

export default function InterpTab() {
  const [data, setData] = useState<InterpData | null>(null);
  const [feat, setFeat] = useState("");
  const [ex, setEx] = useState(0);

  useEffect(() => {
    fetch("/interp.json")
      .then((r) => r.json())
      .then((d: InterpData) => {
        setData(d);
        setFeat(Object.keys(d.pdp)[0]);
      });
  }, []);

  if (!data) return <p className="note">loading…</p>;
  const example = data.examples[ex];
  const maxAbs = Math.max(...example.contribs.map((c) => Math.abs(c.shap))) || 1;

  return (
    <div className="grid2">
      <div>
        <p className="section-label">Partial dependence — a feature's average effect</p>
        <div className="seg">
          {Object.keys(data.pdp).map((f) => (
            <button key={f} aria-pressed={feat === f} onClick={() => setFeat(f)}>
              {pretty(f)}
            </button>
          ))}
        </div>
        <div style={{ marginTop: ".75rem" }}>
          <PdpChart x={data.pdp[feat].x} y={data.pdp[feat].y} />
        </div>
        <p className="note" style={{ marginTop: ".5rem" }}>
          As <strong>{pretty(feat)}</strong> increases (x-axis), the model's average predicted probability of
          &gt;$50K moves along the curve. Upward = higher income; flat = little effect (Notebook 06).
        </p>
      </div>

      <div>
        <p className="section-label">SHAP — why THIS person got their score</p>
        <div className="seg">
          {data.examples.map((_, i) => (
            <button key={i} aria-pressed={ex === i} onClick={() => setEx(i)}>
              Person {i + 1}
            </button>
          ))}
        </div>
        <div className="readout" style={{ margin: ".75rem 0" }}>
          <div className="lbl">Predicted P(&gt;$50K)</div>
          <div className="big">{Math.round(example.p * 100)}%</div>
        </div>
        <div className="bars">
          {example.contribs.map((c) => {
            const w = (Math.abs(c.shap) / maxAbs) * 50;
            const pos = c.shap >= 0;
            return (
              <div className="bar-row" key={c.f}>
                <span className="name">{pretty(c.f)}</span>
                <div className="bar-track">
                  <div className="zero" style={{ left: "50%" }} />
                  <div
                    className={`fill ${pos ? "pos" : "neg"}`}
                    style={{ left: pos ? "50%" : `${50 - w}%`, width: `${w}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="note" style={{ marginTop: ".5rem" }}>
          <span style={{ color: "var(--pos)" }}>Blue</span> bars pushed this prediction up toward &gt;$50K;{" "}
          <span style={{ color: "var(--neg)" }}>orange</span> pushed it down. The bars start from the model's
          average and add up to the final score.
        </p>
      </div>
    </div>
  );
}
