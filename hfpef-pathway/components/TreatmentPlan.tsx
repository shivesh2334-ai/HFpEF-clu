"use client";

import { treatmentSteps, comorbidityGuidance } from "@/lib/data";

export default function TreatmentPlan() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-3">
          Treatment algorithm &amp; follow-up
        </p>
        <div className="space-y-3">
          {treatmentSteps.map((s) => (
            <div key={s.title} className="rounded-lg border border-pathway-line bg-white p-4 shadow-sm">
              <p className="font-medium text-sm text-pathway-tealDeep">{s.title}</p>
              <p className="mt-1 text-sm text-ink/75">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-3">
          Comorbidity-directed management
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {comorbidityGuidance.map((c) => (
            <div key={c.name} className="rounded-lg border border-pathway-line bg-white p-4 shadow-sm">
              <p className="font-medium text-sm text-ink">{c.name}</p>
              <ul className="mt-2 text-sm text-ink/75 list-disc list-inside space-y-1">
                {c.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink/40">
        Based on the 2026 ACC HFpEF Expert Consensus Decision Pathway. Clinical judgment and shared decision-making
        take precedence over any single algorithm.
      </p>
    </div>
  );
}
