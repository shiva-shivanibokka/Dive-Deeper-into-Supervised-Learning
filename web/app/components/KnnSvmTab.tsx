"use client";

import { useEffect, useRef, useState } from "react";

type Cfg = { label: string; grid: number[] };
type KsData = { x: number[]; y: number[]; G: number; points: [number, number, number][]; configs: Record<string, Cfg> };

const SIZE = 520;

export default function KnnSvmTab() {
  const [data, setData] = useState<KsData | null>(null);
  const [cfg, setCfg] = useState("knn_k5");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetch("/knnsvm.json").then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => {
    if (!data) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { G, x, y } = data;
    const grid = data.configs[cfg].grid;
    const cell = SIZE / G;
    for (let iy = 0; iy < G; iy++)
      for (let ix = 0; ix < G; ix++) {
        ctx.fillStyle = grid[iy * G + ix] === 1 ? "rgba(56,189,248,0.34)" : "rgba(251,191,36,0.30)";
        ctx.fillRect(ix * cell, (G - 1 - iy) * cell, cell + 1, cell + 1);
      }
    const x0 = x[0], x1 = x[x.length - 1], y0 = y[0], y1 = y[y.length - 1];
    for (const [px, py, cl] of data.points) {
      const cx = ((px - x0) / (x1 - x0)) * SIZE;
      const cy = (1 - (py - y0) / (y1 - y0)) * SIZE;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = cl === 1 ? "#38bdf8" : "#fbbf24";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.stroke();
    }
  }, [data, cfg]);

  if (!data) return <p className="note">loading…</p>;
  const keys = Object.keys(data.configs);
  const knn = keys.filter((k) => k.startsWith("knn"));
  const svm = keys.filter((k) => k.startsWith("svm"));

  return (
    <div className="demo">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <div>
          <p className="section-label">k-Nearest Neighbors — vary k</p>
          <div className="seg">
            {knn.map((k) => (<button key={k} aria-pressed={cfg === k} onClick={() => setCfg(k)}>{data.configs[k].label}</button>))}
          </div>
        </div>
        <div>
          <p className="section-label">Support Vector Machine — vary kernel · C · gamma</p>
          <div className="seg">
            {svm.map((k) => (<button key={k} aria-pressed={cfg === k} onClick={() => setCfg(k)}>{data.configs[k].label}</button>))}
          </div>
        </div>
      </div>

      <div className="results" style={{ justifyItems: "center" }}>
        <div style={{ maxWidth: SIZE, width: "100%" }}>
          <canvas ref={canvasRef} width={SIZE} height={SIZE} />
          <p className="note" style={{ textAlign: "center", marginTop: ".5rem" }}>
            <span style={{ color: "var(--pos)" }}>● class 1</span> &nbsp; <span style={{ color: "var(--neg)" }}>● class 0</span>
            &nbsp;· shaded areas are the decision regions
          </p>
        </div>
        <div className="callout note" style={{ maxWidth: 720 }}>
          <strong>How to read the picture.</strong> The two shaded areas are the regions each model assigns to a
          class; the dots are the actual training points. A dot sitting on the <em>opposite</em>-colored shade is
          a point the model gets wrong. So a good boundary is one where the shading matches the dots underneath it.
        </div>

        <div className="callout note" style={{ maxWidth: 720 }}>
          <strong>What to try:</strong> two interleaving half-moons — no straight line can split them. A{" "}
          <strong>tiny k</strong> (k=1) makes jagged islands around single points (overfitting) while a large k
          over-smooths. A <strong>linear SVM</strong> fails outright, but an <strong>RBF</strong> kernel curves
          around the moons; crank <strong>gamma</strong> up and the boundary shatters into little bubbles. This is
          the picture behind Notebook 05.
        </div>
      </div>
    </div>
  );
}
