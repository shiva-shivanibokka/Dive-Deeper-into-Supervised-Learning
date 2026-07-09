"use client";

import { useEffect, useRef, useState } from "react";

type Cfg = { label: string; grid: number[] };
type KsData = {
  x: number[];
  y: number[];
  G: number;
  points: [number, number, number][];
  configs: Record<string, Cfg>;
};

const SIZE = 380;

export default function KnnSvmTab() {
  const [data, setData] = useState<KsData | null>(null);
  const [cfg, setCfg] = useState("knn_k5");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetch("/knnsvm.json").then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => {
    if (!data) return;
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    const { G, x, y } = data;
    const grid = data.configs[cfg].grid;
    const cell = SIZE / G;

    // decision regions
    for (let iy = 0; iy < G; iy++) {
      for (let ix = 0; ix < G; ix++) {
        const c = grid[iy * G + ix];
        ctx.fillStyle = c === 1 ? "rgba(96,165,250,0.35)" : "rgba(245,158,11,0.30)";
        ctx.fillRect(ix * cell, (G - 1 - iy) * cell, cell + 1, cell + 1);
      }
    }
    // training points
    const x0 = x[0],
      x1 = x[x.length - 1],
      y0 = y[0],
      y1 = y[y.length - 1];
    for (const [px, py, cl] of data.points) {
      const cx = ((px - x0) / (x1 - x0)) * SIZE;
      const cy = (1 - (py - y0) / (y1 - y0)) * SIZE;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = cl === 1 ? "#60a5fa" : "#f59e0b";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.stroke();
    }
  }, [data, cfg]);

  if (!data) return <p className="note">loading…</p>;
  const keys = Object.keys(data.configs);
  const knn = keys.filter((k) => k.startsWith("knn"));
  const svm = keys.filter((k) => k.startsWith("svm"));

  return (
    <div className="grid2">
      <div>
        <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ maxWidth: SIZE }} />
      </div>
      <div>
        <p className="section-label">k-Nearest Neighbors</p>
        <div className="seg">
          {knn.map((k) => (
            <button key={k} aria-pressed={cfg === k} onClick={() => setCfg(k)}>
              {data.configs[k].label}
            </button>
          ))}
        </div>
        <p className="section-label" style={{ marginTop: "1rem" }}>
          Support Vector Machine
        </p>
        <div className="seg">
          {svm.map((k) => (
            <button key={k} aria-pressed={cfg === k} onClick={() => setCfg(k)}>
              {data.configs[k].label}
            </button>
          ))}
        </div>
        <p className="note" style={{ marginTop: "1.25rem" }}>
          Two interleaving half-moons — a boundary no straight line can separate. Watch how a{" "}
          <strong>tiny k</strong> (k=1) makes jagged islands (overfitting) while a large k over-smooths; how a{" "}
          <strong>linear SVM</strong> fails but an <strong>RBF</strong> kernel curves around the moons; and how
          large <strong>gamma</strong> shrinks influence into little bubbles. This is the picture behind Notebook
          05.
        </p>
      </div>
    </div>
  );
}
