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
  const W = 560, H = 240, pad = 40;
  const ymin = Math.min(...y), ymax = Math.max(...y);
  const sx = (i: number) => pad + (i / (x.length - 1)) * (W - 2 * pad);
  const sy = (v: number) => H - pad - ((v - ymin) / (ymax - ymin || 1)) * (H - 2 * pad);
  const line = x.map((_, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(y[i]).toFixed(1)}`).join(" ");
  const area = `${line} L${sx(x.length - 1)},${H - pad} L${sx(0)},${H - pad} Z`;
  return (
    <div className="chart-box">
      <svg viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="pdpfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--border)" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--border)" />
        <path d={area} fill="url(#pdpfill)" />
        <path d={line} fill="none" stroke="var(--cyan)" strokeWidth={2.5} />
        <text x={pad} y={H - 12} fill="var(--muted)" fontSize={11}>{x[0].toFixed(0)}</text>
        <text x={W - pad} y={H - 12} fill="var(--muted)" fontSize={11} textAnchor="end">{x[x.length - 1].toFixed(0)}</text>
        <text x={8} y={pad + 4} fill="var(--muted)" fontSize={11}>{ymax.toFixed(2)}</text>
        <text x={8} y={H - pad} fill="var(--muted)" fontSize={11}>{ymin.toFixed(2)}</text>
      </svg>
    </div>
  );
}

export default function InterpTab() {
  const [data, setData] = useState<InterpData | null>(null);
  const [feat, setFeat] = useState("");
  const [ex, setEx] = useState(0);

  useEffect(() => {
    fetch("/interp.json").then((r) => r.json()).then((d: InterpData) => {
      setData(d);
      setFeat(Object.keys(d.pdp)[0]);
    });
  }, []);

  if (!data) return <p className="note">loading…</p>;
  const example = data.examples[ex];
  const maxAbs = Math.max(...example.contribs.map((c) => Math.abs(c.shap))) || 1;

  return (
    <div className="demo">
      <div style={{ display: "grid", gap: "1.25rem" }}>
        <div>
          <p className="section-label">Partial dependence — pick a feature to see its average effect on the prediction</p>
          <div className="seg">
            {Object.keys(data.pdp).map((f) => (<button key={f} aria-pressed={feat === f} onClick={() => setFeat(f)}>{pretty(f)}</button>))}
          </div>
        </div>
        <div>
          <p className="section-label">SHAP — pick a person (sorted low → high predicted income) to explain their score</p>
          <div className="seg">
            {data.examples.map((e, i) => (
              <button key={i} aria-pressed={ex === i} onClick={() => setEx(i)}>P{i + 1} · {Math.round(e.p * 100)}%</button>
            ))}
          </div>
        </div>
      </div>

      <div className="results" style={{ gridTemplateColumns: "1fr 1fr", display: "grid", gap: "1.5rem", alignItems: "start" }}>
        <div>
          <p className="section-label">Average effect of {pretty(feat)}</p>
          <PdpChart x={data.pdp[feat].x} y={data.pdp[feat].y} />
          <p className="note" style={{ marginTop: ".5rem" }}>
            As <strong>{pretty(feat)}</strong> increases (x-axis), the model's average predicted probability of
            &gt;$50K moves along the curve. Rising = pushes income up; flat = little effect.
          </p>
        </div>
        <div>
          <p className="section-label">Why person {ex + 1} scored {Math.round(example.p * 100)}%</p>
          <div className="bars">
            {example.contribs.map((c) => {
              const w = (Math.abs(c.shap) / maxAbs) * 50;
              const pos = c.shap >= 0;
              return (
                <div className="bar-row" key={c.f}>
                  <span className="name">{pretty(c.f)}</span>
                  <div className="bar-track">
                    <div className="zero" style={{ left: "50%" }} />
                    <div className={`fill ${pos ? "pos" : "neg"}`} style={{ left: pos ? "50%" : `${50 - w}%`, width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="note" style={{ marginTop: ".5rem" }}>
            <span style={{ color: "var(--pos)" }}>Blue</span> pushed this prediction up toward &gt;$50K;{" "}
            <span style={{ color: "var(--neg)" }}>amber</span> pushed it down. Bars start from the model's
            average and add up to the final score (Notebook 06).
          </p>
        </div>
      </div>
    </div>
  );
}
