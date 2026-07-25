"use client";

import { useMemo, useState } from "react";
import { beta2FpefComponents } from "@/lib/data";

function interpretH2FPEF(points: number) {
  if (points >= 6) return { label: "High probability of HFpEF", tone: "teal" as const };
  if (points <= 1) return { label: "Low probability — consider other diagnoses", tone: "crimson" as const };
  return { label: "Intermediate — further testing (diastolic stress test / invasive hemodynamics) or HFA-PEFF", tone: "amber" as const };
}

function abaProbability(age: number, bmi: number, af: boolean) {
  const y = -7.79 + 0.063 * age + 0.14 * bmi + 2.04 * (af ? 1 : 0);
  const z = Math.exp(y);
  return (z / (1 + z)) * 100;
}

export default function ScoreCalculators() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [age, setAge] = useState<string>("68");
  const [bmi, setBmi] = useState<string>("30");
  const [af, setAf] = useState(false);

  const total = useMemo(
    () => beta2FpefComponents.filter((c) => selected.has(c.key)).reduce((sum, c) => sum + c.points, 0),
    [selected]
  );
  const result = interpretH2FPEF(total);

  const toneClasses: Record<string, string> = {
    teal: "bg-pathway-tealSoft border-pathway-teal text-pathway-tealDeep",
    amber: "bg-pathway-amberSoft border-pathway-amber text-pathway-amber",
    crimson: "bg-pathway-crimsonSoft border-pathway-crimson text-pathway-crimson",
  };

  const abaResult = useMemo(() => {
    const a = parseFloat(age);
    const b = parseFloat(bmi);
    if (isNaN(a) || isNaN(b)) return null;
    return abaProbability(a, b, af);
  }, [age, bmi, af]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* H2FPEF */}
      <div className="rounded-xl border border-pathway-line bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-1">H₂FPEF score</p>
        <p className="text-sm text-ink/60 mb-4">Derived from invasive exercise hemodynamics — best for cardiology / specialist settings.</p>
        <div className="space-y-2">
          {beta2FpefComponents.map((c) => (
            <label key={c.key} className="flex items-center justify-between gap-3 rounded-md border border-pathway-line px-3 py-2 text-sm cursor-pointer hover:bg-pathway-bg">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-pathway-teal"
                  checked={selected.has(c.key)}
                  onChange={() =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      next.has(c.key) ? next.delete(c.key) : next.add(c.key);
                      return next;
                    })
                  }
                />
                {c.label}
              </span>
              <span className="font-mono text-xs text-ink/50">+{c.points}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-ink/60">Total points</span>
          <span className="font-display text-2xl text-ink">{total} / 9</span>
        </div>
        <div className={`mt-3 rounded-md border px-3 py-2 text-sm font-medium ${toneClasses[result.tone]}`}>
          {result.label}
        </div>
      </div>

      {/* HFpEF-ABA */}
      <div className="rounded-xl border border-pathway-line bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-1">HFpEF-ABA score</p>
        <p className="text-sm text-ink/60 mb-4">
          Age, BMI, atrial fibrillation only — no echo required. Best as a primary-care / EMR screening tool.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-ink/70">
            Age (years)
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1 w-full rounded-md border border-pathway-line px-3 py-2 text-sm focus-ring"
            />
          </label>
          <label className="text-sm text-ink/70">
            BMI (kg/m²)
            <input
              type="number"
              value={bmi}
              onChange={(e) => setBmi(e.target.value)}
              className="mt-1 w-full rounded-md border border-pathway-line px-3 py-2 text-sm focus-ring"
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink/70 cursor-pointer">
          <input type="checkbox" className="accent-pathway-teal" checked={af} onChange={() => setAf((v) => !v)} />
          Atrial fibrillation
        </label>

        {abaResult !== null && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink/60">Probability of HFpEF</span>
              <span className="font-display text-2xl text-ink">{abaResult.toFixed(0)}%</span>
            </div>
            <div
              className={`mt-2 rounded-md border px-3 py-2 text-sm font-medium ${
                abaResult < 25
                  ? toneClasses.crimson
                  : abaResult > 80
                  ? toneClasses.teal
                  : toneClasses.amber
              }`}
            >
              {abaResult < 25
                ? "Low probability — consider other diagnoses"
                : abaResult > 80
                ? "High probability — proceed with echo, natriuretic peptides, cardiology consult"
                : "Intermediate — echocardiography, natriuretic peptides, and cardiology consultation recommended"}
            </div>
          </div>
        )}
        <p className="mt-4 text-xs text-ink/40">
          Probability thresholds are not formally validated: &lt;25% low, 25–80% intermediate, &gt;80% high have
          been used in practice.
        </p>
      </div>
    </div>
  );
}
