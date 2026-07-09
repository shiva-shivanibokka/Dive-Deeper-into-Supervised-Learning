"use client";

import { useEffect, useMemo, useState } from "react";

type TData = {
  prob: number[];
  y: number[];
  pos_rate: number;
  roc: { fpr: number[]; tpr: number[] };
  pr: { rec: number[]; prec: number[] };
};

function Curve({
  xs,
  ys,
  px,
  py,
  xlabel,
  ylabel,
  diag,
  baseline,
}: {
  xs: number[];
  ys: number[];
  px: number;
  py: number;
  xlabel: string;
  ylabel: string;
  diag?: boolean;
  baseline?: number;
}) {
  const W = 240,
    H = 200,
    pad = 30;
  const sx = (v: number) => pad + v * (W - 2 * pad);
  const sy = (v: number) => H - pad - v * (H - 2 * pad);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${sx(x).toFixed(1)},${sy(ys[i]).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 10 }}>
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--border)" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--border)" />
      {diag && <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="var(--border)" strokeDasharray="3 3" />}
      {baseline !== undefined && (
        <line x1={sx(0)} y1={sy(baseline)} x2={sx(1)} y2={sy(baseline)} stroke="var(--border)" strokeDasharray="3 3" />
      )}
      <path d={d} fill="none" stroke="var(--accent-2)" strokeWidth={2} />
      <circle cx={sx(px)} cy={sy(py)} r={5} fill="var(--accent)" stroke="#0b0e14" strokeWidth={1.5} />
      <text x={W / 2} y={H - 6} fill="var(--muted)" fontSize={9} textAnchor="middle">{xlabel}</text>
      <text x={10} y={H / 2} fill="var(--muted)" fontSize={9} textAnchor="middle" transform={`rotate(-90 10 ${H / 2})`}>{ylabel}</text>
    </svg>
  );
}

export default function ThresholdTab() {
  const [data, setData] = useState<TData | null>(null);
  const [t, setT] = useState(0.5);

  useEffect(() => {
    fetch("/threshold.json").then((r) => r.json()).then(setData);
  }, []);

  const m = useMemo(() => {
    if (!data) return null;
    let tp = 0, fp = 0, tn = 0, fn = 0;
    for (let i = 0; i < data.prob.length; i++) {
      const pred = data.prob[i] >= t ? 1 : 0;
      if (pred === 1 && data.y[i] === 1) tp++;
      else if (pred === 1) fp++;
      else if (data.y[i] === 1) fn++;
      else tn++;
    }
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    const fpr = fp + tn ? fp / (fp + tn) : 0;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    const acc = (tp + tn) / data.prob.length;
    return { tp, fp, tn, fn, precision, recall, fpr, f1, acc };
  }, [data, t]);

  if (!data || !m) return <p className="note">loading…</p>;

  return (
    <div>
      <div className="field" style={{ maxWidth: 460 }}>
        <label>
          Decision threshold <b>{t.toFixed(2)}</b>
        </label>
        <input type="range" min={0.02} max={0.98} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} />
        <span className="note">Flag as &gt;$50K when the predicted probability is ≥ {t.toFixed(2)}.</span>
      </div>

      <div className="grid2" style={{ marginTop: "1.25rem" }}>
        <div>
          <p className="section-label">Confusion matrix</p>
          <div className="cm">
            <div className="cell ok"><div className="n">{m.tn}</div><div className="t">True ≤50K</div></div>
            <div className="cell err"><div className="n">{m.fp}</div><div className="t">False alarm</div></div>
            <div className="cell err"><div className="n">{m.fn}</div><div className="t">Missed &gt;50K</div></div>
            <div className="cell ok"><div className="n">{m.tp}</div><div className="t">Caught &gt;50K</div></div>
          </div>
          <div className="tiles" style={{ marginTop: "1rem" }}>
            <div className="tile"><div className="v">{(m.precision * 100).toFixed(0)}%</div><div className="k">Precision</div></div>
            <div className="tile"><div className="v">{(m.recall * 100).toFixed(0)}%</div><div className="k">Recall</div></div>
            <div className="tile"><div className="v">{(m.f1 * 100).toFixed(0)}%</div><div className="k">F1</div></div>
            <div className="tile"><div className="v">{(m.acc * 100).toFixed(0)}%</div><div className="k">Accuracy</div></div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
          <div>
            <p className="section-label">ROC</p>
            <Curve xs={data.roc.fpr} ys={data.roc.tpr} px={m.fpr} py={m.recall} xlabel="FPR" ylabel="TPR" diag />
          </div>
          <div>
            <p className="section-label">Precision-Recall</p>
            <Curve xs={data.pr.rec} ys={data.pr.prec} px={m.recall} py={m.precision} xlabel="Recall" ylabel="Precision" baseline={data.pos_rate} />
          </div>
        </div>
      </div>

      <p className="note" style={{ marginTop: "1rem" }}>
        The green dot is your current operating point. Slide the threshold <strong>left</strong> to catch more
        high earners (recall ↑) at the cost of more false alarms (precision ↓), or <strong>right</strong> for the
        opposite. The model never changes — only the line you draw through its probabilities does. This is the
        whole story of Notebook 07.
      </p>
    </div>
  );
}
