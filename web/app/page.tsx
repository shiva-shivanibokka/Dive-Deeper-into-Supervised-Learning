"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MODEL_TABS } from "./models";
import { Tip } from "./lib/tip";

const load = (p: () => Promise<{ default: React.ComponentType }>) =>
  dynamic(p, { ssr: false, loading: () => <p className="note">loading demo…</p> });

const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  tree: load(() => import("./components/TreeTab")),
  boost: load(() => import("./components/BoostTab")),
  ensemble: load(() => import("./components/EnsembleTab")),
  knnsvm: load(() => import("./components/KnnSvmTab")),
  interp: load(() => import("./components/InterpTab")),
  threshold: load(() => import("./components/ThresholdTab")),
  about: load(() => import("./components/AboutTab")),
};

export default function Home() {
  const [active, setActive] = useState(MODEL_TABS[0].id);
  const tab = MODEL_TABS.find((t) => t.id === active)!;
  const Comp = TAB_COMPONENTS[tab.id];

  return (
    <main className="wrap">
      <header className="hero">
        <h1>Supervised Learning Playground</h1>
        <p>
          Poke at classic machine-learning models — decision trees, gradient boosting, ensembles, k-NN and SVM —
          built from scratch across the companion notebooks and running <strong>entirely in your browser</strong>.
          Every prediction is computed on your own machine from precomputed models, trained on the{" "}
          <a href="https://www.openml.org/d/1590" target="_blank" rel="noreferrer">Adult Census Income</a> dataset.
        </p>
        <span className="live">
          <b>●</b> live · no server · nothing leaves your machine
        </span>
      </header>

      <nav className="tabs" role="tablist" aria-label="Demos">
        {MODEL_TABS.map((t) => (
          <button key={t.id} className="tab" role="tab" aria-selected={t.id === active} onClick={() => setActive(t.id)}>
            {t.title}
          </button>
        ))}
      </nav>

      <section className="panel" role="tabpanel">
        <div className="panel-head">
          <div className="htitle">
            <h2>{tab.title}</h2>
            <Tip text={tab.help} />
          </div>
          <span className="chip">
            {tab.nb === "—" ? "Overview" : `Notebook ${tab.nb}`} · {tab.dataset}
          </span>
        </div>
        <p className="panel-tagline">{tab.tagline}</p>
        {Comp ? <Comp /> : null}
      </section>

      <p className="footer">
        Built by Shivani Bokka · scikit-learn / LightGBM · served client-side on Vercel
      </p>
    </main>
  );
}
