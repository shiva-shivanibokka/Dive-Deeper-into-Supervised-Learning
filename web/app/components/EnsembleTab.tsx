"use client";

import { useEffect, useMemo, useState } from "react";

type EnsData = {
  individual: Record<string, number>;
  subsets: Record<string, number>;
  corr: Record<string, number>;
  models: string[];
};

export default function EnsembleTab() {
  const [data, setData] = useState<EnsData | null>(null);
  const [on, setOn] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/ensembles.json").then((r) => r.json()).then((d: EnsData) => {
      setData(d);
      setOn(Object.fromEntries(d.models.map((m) => [m, true])));
    });
  }, []);

  const chosen = useMemo(() => (data ? data.models.filter((m) => on[m]) : []), [data, on]);
  const key = chosen.join("|");
  if (!data) return <p className="note">loading…</p>;

  const ensAcc = data.subsets[key];
  const bestIndiv = chosen.length ? Math.max(...chosen.map((m) => data.individual[m])) : 0;
  const beatsBest = ensAcc !== undefined && ensAcc >= bestIndiv;

  let avgCorr = 0, n = 0;
  for (let i = 0; i < chosen.length; i++)
    for (let j = i + 1; j < chosen.length; j++) { avgCorr += data.corr[chosen[i] + "|" + chosen[j]]; n++; }
  avgCorr = n ? avgCorr / n : 0;

  const maxAcc = Math.max(...data.models.map((m) => data.individual[m]), ensAcc ?? 0);

  return (
    <div className="demo">
      <div>
        <p className="section-label">Include these base models in the soft-voting ensemble</p>
        <div className="seg">
          {data.models.map((m) => (
            <button key={m} aria-pressed={!!on[m]} onClick={() => setOn((s) => ({ ...s, [m]: !s[m] }))}>{m}</button>
          ))}
        </div>
      </div>

      <div className="results">
        <div className="readout">
          <div className="lbl">Ensemble accuracy · {chosen.length || "no"} model{chosen.length === 1 ? "" : "s"} voting</div>
          <div className="big">{ensAcc !== undefined ? (ensAcc * 100).toFixed(1) + "%" : "—"}</div>
          {chosen.length > 0 && (
            <div style={{ marginTop: ".6rem" }}>
              <span className={`pill ${beatsBest ? "pos" : "neg"}`}>
                {beatsBest ? "≥ best individual" : "below best individual"} ({(bestIndiv * 100).toFixed(1)}%)
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem", alignItems: "start" }}>
          <div>
            <p className="section-label">Individual accuracies</p>
            <div className="bars">
              {data.models.map((m) => (
                <div className="bar-row" key={m}>
                  <span className="name">{m}</span>
                  <div className="bar-track">
                    <div className="fill" style={{ left: 0, width: `${(data.individual[m] / maxAcc) * 100}%`, background: on[m] ? "var(--cyan)" : "var(--border)", boxShadow: on[m] ? "0 0 12px -2px var(--cyan)" : "none" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {chosen.length >= 2 && (
            <div className="tiles">
              <div className="tile"><div className="v">{avgCorr.toFixed(2)}</div><div className="k">avg agreement</div></div>
              <div className="tile"><div className="v">{chosen.length}</div><div className="k">models</div></div>
            </div>
          )}
        </div>

        <div className="callout note">
          <strong>How to read this.</strong> The big number is the accuracy of the <em>combined</em> vote; the
          bars below are each model on its own (lit bars are the ones you've switched on). <strong>Avg
          agreement</strong> measures how alike the chosen models' predictions are — 1.0 means they're
          near-identical. The pill tells you whether the ensemble beat its own best member.
        </div>

        <div className="callout note">
          <strong>The takeaway:</strong> ensembles only help when models <strong>disagree</strong>. Turn on
          similar models (high agreement) and the vote barely moves; combine <strong>diverse</strong> ones — a
          linear model, a forest, an SVM, a k-NN — and voting can beat every individual. That's the whole lesson
          of Notebook 03.
        </div>
      </div>
    </div>
  );
}
