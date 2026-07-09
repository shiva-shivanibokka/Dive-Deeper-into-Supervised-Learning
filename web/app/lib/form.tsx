// Shared types + input form used by the Tree, Boosting, and Interpretability demos.
export type FeatMeta =
  | { name: string; kind: "num"; min: number; max: number; default: number }
  | { name: string; kind: "cat"; levels: string[]; default: number };

// Pretty label for a raw feature name.
export function pretty(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// A row of feature values (indexed to match the model's feature order).
export function defaultRow(features: FeatMeta[]): number[] {
  return features.map((f) => f.default);
}

export function FeatureForm({
  features,
  values,
  onChange,
}: {
  features: FeatMeta[];
  values: number[];
  onChange: (i: number, v: number) => void;
}) {
  return (
    <div className="controls">
      {features.map((f, i) =>
        f.kind === "num" ? (
          <div className="field" key={f.name}>
            <label>
              {pretty(f.name)} <b>{Math.round(values[i])}</b>
            </label>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={1}
              value={values[i]}
              onChange={(e) => onChange(i, Number(e.target.value))}
            />
          </div>
        ) : (
          <div className="field" key={f.name}>
            <label>{pretty(f.name)}</label>
            <select value={values[i]} onChange={(e) => onChange(i, Number(e.target.value))}>
              {f.levels.map((lv, code) => (
                <option key={lv} value={code}>
                  {lv}
                </option>
              ))}
            </select>
          </div>
        )
      )}
    </div>
  );
}
