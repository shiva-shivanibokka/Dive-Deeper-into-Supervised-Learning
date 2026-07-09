import { Tip } from "./tip";

// Shared types + input form used by the Tree, Boosting, and Interpretability demos.
export type FeatMeta =
  | { name: string; kind: "num"; min: number; max: number; default: number }
  | { name: string; kind: "cat"; levels: string[]; default: number };

// Plain-English help for each Adult feature.
export const FEATURE_HELP: Record<string, string> = {
  age: "The person's age, in years.",
  "education-num": "Years of schooling completed — higher means more education (e.g. 9 ≈ high-school, 13 ≈ bachelor's).",
  "hours-per-week": "How many hours the person works in a typical week.",
  "capital-gain": "Profit from selling investments like stocks or property. Large gains strongly signal higher income.",
  "marital-status": "Legal marital status (married, divorced, never-married…). Related to but not the same as 'relationship'.",
  occupation: "The person's job category. These are the exact 14 categories from the census — the model can only score jobs it was trained on, so the list is fixed.",
  relationship: "The person's role in their household (husband, wife, own-child, unmarried, not-in-family…). It overlaps with marital status but describes household position, not legal status.",
  sex: "The person's sex as recorded in the 1994 census. The boosting model barely relies on it.",
};

// A model input column: a numeric feature (cat=null) or one one-hot category level.
export type Col = { name: string; cat: number | null };

// Turn the 8 human control values into the model's actual input vector.
// For the one-hot tree, each category level becomes its own 0/1 column.
export function buildModelRow(formRow: number[], form: FeatMeta[], cols: Col[]): number[] {
  const idxOf = (name: string) => form.findIndex((f) => f.name === name);
  return cols.map((c) => {
    const fi = idxOf(c.name);
    if (c.cat === null) return formRow[fi];
    return formRow[fi] === c.cat ? 1 : 0;
  });
}

export function pretty(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function defaultRow(features: FeatMeta[]): number[] {
  return features.map((f) => f.default);
}

export function FeatureForm({
  features,
  values,
  onChange,
  used,
}: {
  features: FeatMeta[];
  values: number[];
  onChange: (i: number, v: number) => void;
  used?: Set<string>; // features the current model actually branches on (Tree demo)
}) {
  return (
    <div className="control-row">
      {features.map((f, i) => (
        <div className="field" key={f.name}>
          <label>
            <span className="lname">
              {pretty(f.name)}
              <Tip text={FEATURE_HELP[f.name] ?? f.name} />
              {used && (used.has(f.name) ? <span className="badge-used">on path</span> : null)}
            </span>
            {f.kind === "num" && <b>{Math.round(values[i])}</b>}
          </label>
          {f.kind === "num" ? (
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={1}
              value={values[i]}
              onChange={(e) => onChange(i, Number(e.target.value))}
            />
          ) : (
            <select value={values[i]} onChange={(e) => onChange(i, Number(e.target.value))}>
              {f.levels.map((lv, code) => (
                <option key={lv} value={code}>
                  {lv}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
