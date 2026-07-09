"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MODEL_TABS } from "./models";

const load = (p: () => Promise<{ default: React.ComponentType }>) =>
  dynamic(p, { ssr: false, loading: () => <p style={{ color: "var(--muted)" }}>loading demo…</p> });

const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  tree: load(() => import("./components/TreeTab")),
  boost: load(() => import("./components/BoostTab")),
  ensemble: load(() => import("./components/EnsembleTab")),
  knnsvm: load(() => import("./components/KnnSvmTab")),
  interp: load(() => import("./components/InterpTab")),
  threshold: load(() => import("./components/ThresholdTab")),
};

export default function Home() {
  const [active, setActive] = useState(MODEL_TABS[0].id);
  const tab = MODEL_TABS.find((t) => t.id === active)!;
  const Comp = TAB_COMPONENTS[tab.id];

  return (
    <main className="wrap">
      <div className="hero">
        <h1>Supervised Learning Playground</h1>
        <p>
          Classic supervised-ML models — built from scratch across the companion notebooks — running{" "}
          <strong>entirely in your browser</strong>. No server, no upload: every prediction is computed
          on your machine from precomputed models. Trained on the{" "}
          <a href="https://www.openml.org/d/1590" target="_blank" rel="noreferrer">Adult Census Income</a>{" "}
          dataset.
        </p>
      </div>

      <div className="tabs" role="tablist" aria-label="Demos">
        {MODEL_TABS.map((t) => (
          <button
            key={t.id}
            className="tab"
            role="tab"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
          >
            {t.title}
          </button>
        ))}
      </div>

      <section className="panel" role="tabpanel">
        <div className="panel-head">
          <h2>{tab.title}</h2>
          <span className="chip">Notebook {tab.nb} · {tab.dataset}</span>
        </div>
        <p className="panel-tagline">{tab.tagline}</p>
        {Comp ? <Comp /> : null}
      </section>

      <p className="footer">
        Built by Shivani Bokka · models trained in scikit-learn / LightGBM · served client-side on Vercel
      </p>
    </main>
  );
}
