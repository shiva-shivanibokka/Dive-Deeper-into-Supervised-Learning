"use client";

import { useEffect, useMemo, useState } from "react";
import { Tip } from "../lib/tip";

type ModelCurves = { prob: number[]; roc: { fpr: number[]; tpr: number[] }; pr: { rec: number[]; prec: number[] } };
type TData = { y: number[]; pos_rate: number; models: Record<string, ModelCurves> };

function Curve({
  xs, ys, px, py, xlabel, ylabel, diag, baseline, title,
}: {
  xs: number[]; ys: number[]; px: number; py: number;
  xlabel: string; ylabel: string; diag?: boolean; baseline?: number; title: string;
}) {
  const W = 360, H = 340, pad = 46;
  const sx = (v: number) => pad + v * (W - 2 * pad);
  const sy = (v: number) => H - pad - v * (H - 2 * pad);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${sx(x).toFixed(1)},${sy(ys[i]).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="chart-box">
      <p className="section-label" style={{ marginBottom: ".5rem" }}>{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={sx(t)} y1={pad} x2={sx(t)} y2={H - pad} stroke="var(--border)" strokeOpacity="0.4" />
            <line x1={pad} y1={sy(t)} x2={W - pad} y2={sy(t)} stroke="var(--border)" strokeOpacity="0.4" />
            <text x={sx(t)} y={H - pad + 16} fill="var(--muted)" fontSize={10} textAnchor="middle">{t}</text>
            <text x={pad - 8} y={sy(t) + 3} fill="var(--muted)" fontSize={10} textAnchor="end">{t}</text>
          </g>
        ))}
        {diag && <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="var(--muted)" strokeDasharray="4 4" strokeOpacity="0.6" />}
        {baseline !== undefined && <line x1={sx(0)} y1={sy(baseline)} x2={sx(1)} y2={sy(baseline)} stroke="var(--muted)" strokeDasharray="4 4" strokeOpacity="0.6" />}
        <path d={d} fill="none" stroke="var(--violet)" strokeWidth={2.5} />
        <circle cx={sx(px)} cy={sy(py)} r={7} fill="var(--lime)" stroke="#07101f" strokeWidth={2} />
        <text x={W / 2} y={H - 8} fill="var(--muted)" fontSize={11} textAnchor="middle">{xlabel}</text>
        <text x={14} y={H / 2} fill="var(--muted)" fontSize={11} textAnchor="middle" transform={`rotate(-90 14 ${H / 2})`}>{ylabel}</text>
      </svg>
    </div>
  );
}

export default function ThresholdTab() {
  const [data, setData] = useState<TData | null>(null);
  const [model, setModel] = useState("");
  const [t, setT] = useState(0.5);

  useEffect(() => {
    fetch("/threshold.json").then((r) => r.json()).then((d: TData) => {
      setData(d);
      setModel(Object.keys(d.models)[0]);
    });
  }, []);

  const cur = data && model ? data.models[model] : null;
  const m = useMemo(() => {
    if (!data || !cur) return null;
    let tp = 0, fp = 0, tn = 0, fn = 0;
    for (let i = 0; i < cur.prob.length; i++) {
      const pred = cur.prob[i] >= t ? 1 : 0;
      if (pred === 1 && data.y[i] === 1) tp++;
      else if (pred === 1) fp++;
      else if (data.y[i] === 1) fn++;
      else tn++;
    }
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    const fpr = fp + tn ? fp / (fp + tn) : 0;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    const acc = (tp + tn) / cur.prob.length;
    return { tp, fp, tn, fn, precision, recall, fpr, f1, acc };
  }, [data, cur, t]);

  if (!data || !cur || !m) return <p className="note">loading…</p>;

  return (
    <div className="demo">
      <div className="control-row" style={{ alignItems: "end" }}>
        <div className="field" style={{ flex: "0 0 240px" }}>
          <label>
            <span className="lname">Model <Tip text="Each model outputs its own probabilities, so the very same threshold produces a different confusion matrix and different curves. Switch models to compare." /></span>
          </label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {Object.keys(data.models).map((k) => (<option key={k} value={k}>{k}</option>))}
          </select>
        </div>
        <div className="field" style={{ flex: "1 1 320px" }}>
          <label>
            <span className="lname">Decision threshold</span>
            <b>{t.toFixed(2)}</b>
          </label>
          <input type="range" min={0.02} max={0.98} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} />
        </div>
      </div>
      <p className="note" style={{ marginTop: "-0.75rem" }}>
        Flag someone as &gt;$50K when <strong>{model}</strong>'s probability is ≥ {t.toFixed(2)}. Drag the
        threshold, or switch models to see how the same cutoff behaves on a different classifier.
      </p>

      <div className="results">
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.5rem", alignItems: "center" }}>
          <div>
            <p className="section-label">Confusion matrix · {model}</p>
            <div className="cm">
              <div className="cell ok"><div className="n">{m.tn}</div><div className="t">True ≤50K</div></div>
              <div className="cell err"><div className="n">{m.fp}</div><div className="t">False alarm</div></div>
              <div className="cell err"><div className="n">{m.fn}</div><div className="t">Missed &gt;50K</div></div>
              <div className="cell ok"><div className="n">{m.tp}</div><div className="t">Caught &gt;50K</div></div>
            </div>
          </div>
          <div className="tiles">
            <div className="tile"><div className="v">{(m.precision * 100).toFixed(0)}%</div><div className="k">Precision</div></div>
            <div className="tile"><div className="v">{(m.recall * 100).toFixed(0)}%</div><div className="k">Recall</div></div>
            <div className="tile"><div className="v">{(m.f1 * 100).toFixed(0)}%</div><div className="k">F1</div></div>
            <div className="tile"><div className="v">{(m.acc * 100).toFixed(0)}%</div><div className="k">Accuracy</div></div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          <Curve title={`ROC curve · ${model}`} xs={cur.roc.fpr} ys={cur.roc.tpr} px={m.fpr} py={m.recall} xlabel="False positive rate" ylabel="True positive rate" diag />
          <Curve title={`Precision-recall curve · ${model}`} xs={cur.pr.rec} ys={cur.pr.prec} px={m.recall} py={m.precision} xlabel="Recall" ylabel="Precision" baseline={data.pos_rate} />
        </div>

        <div className="callout note">
          <strong>The threshold applies to one model at a time</strong> — the one in the dropdown. Every model
          turns its own probabilities into a yes/no at your chosen cutoff, so switching from LightGBM to Logistic
          Regression changes the whole confusion matrix even at the same threshold. Slide{" "}
          <strong>left</strong> to catch more high earners (recall ↑, more false alarms); the model itself never
          changes — only where you draw the line (Notebook 07).
        </div>
      </div>
    </div>
  );
}
