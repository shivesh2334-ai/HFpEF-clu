"use client";

import { useMemo, useState } from "react";
import { mimics, Mimic } from "@/lib/data";

type Phase = "entry" | "noncardiac" | "cardiac" | "confirmed";

function MimicCard({
  mimic,
  checked,
  onToggle,
}: {
  mimic: Mimic;
  checked: Set<string>;
  onToggle: (clue: string) => void;
}) {
  const hit = mimic.clues.some((c) => checked.has(c));
  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        hit ? "border-pathway-amber bg-pathway-amberSoft" : "border-pathway-line bg-white"
      }`}
    >
      <p className="font-medium text-sm text-ink">{mimic.name}</p>
      <div className="mt-3 space-y-2">
        {mimic.clues.map((clue) => (
          <label key={clue} className="flex items-start gap-2 text-sm text-ink/80 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 accent-pathway-teal"
              checked={checked.has(clue)}
              onChange={() => onToggle(clue)}
            />
            <span>{clue}</span>
          </label>
        ))}
      </div>
      {hit && (
        <div className="mt-3 rounded-md bg-white/70 border border-pathway-amber/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-pathway-amber mb-1">
            Recommended evaluation
          </p>
          <ul className="text-xs text-ink/80 list-disc list-inside space-y-0.5">
            {mimic.workup.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function DecisionTree() {
  const [phase, setPhase] = useState<Phase>("entry");
  const [checkedClues, setCheckedClues] = useState<Set<string>>(new Set());

  const noncardiac = mimics.filter((m) => m.category === "Noncardiac");
  const cardiac = mimics.filter((m) => m.category === "Cardiac");

  const toggle = (clue: string) => {
    setCheckedClues((prev) => {
      const next = new Set(prev);
      next.has(clue) ? next.delete(clue) : next.add(clue);
      return next;
    });
  };

  const activeNoncardiac = useMemo(
    () => noncardiac.filter((m) => m.clues.some((c) => checkedClues.has(c))),
    [checkedClues]
  );
  const activeCardiac = useMemo(
    () => cardiac.filter((m) => m.clues.some((c) => checkedClues.has(c))),
    [checkedClues]
  );

  return (
    <div className="space-y-6">
      {/* Step 1 — entry box */}
      <div className="rounded-xl border border-pathway-line bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-2">Step 1 · Entry criteria</p>
        <p className="font-display text-lg text-ink mb-4">
          Patient presents with dyspnea, edema, or both — and LVEF ≥50%. Apply the Universal Definition of HF
          (symptoms/signs + elevated natriuretic peptides <em>or</em> objective congestion).
        </p>
        {phase === "entry" && (
          <button
            onClick={() => setPhase("noncardiac")}
            className="rounded-md bg-pathway-teal px-4 py-2 text-sm font-medium text-white hover:bg-pathway-tealDeep transition-colors focus-ring"
          >
            Criteria met — assess for noncardiac mimics →
          </button>
        )}
      </div>

      {/* Step 2 — noncardiac mimics */}
      {phase !== "entry" && (
        <div className="rounded-xl border border-pathway-line bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-2">
            Step 2 · Noncardiac mimics
          </p>
          <p className="text-sm text-ink/70 mb-4">
            Check any supporting clinical clues. Each checked box reveals the recommended work-up for that mimic
            (branch input).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {noncardiac.map((m) => (
              <MimicCard key={m.name} mimic={m} checked={checkedClues} onToggle={toggle} />
            ))}
          </div>
          {activeNoncardiac.length > 0 && (
            <div className="mt-4 rounded-md bg-pathway-amberSoft border border-pathway-amber/40 p-3 text-sm text-ink/80">
              <strong>Symptoms primarily from:</strong> {activeNoncardiac.map((m) => m.name).join("; ")}. Manage the
              primary condition; reconsider HFpEF work-up if symptoms persist after treatment.
            </div>
          )}
          {phase === "noncardiac" && (
            <button
              onClick={() => setPhase("cardiac")}
              className="mt-5 rounded-md bg-pathway-teal px-4 py-2 text-sm font-medium text-white hover:bg-pathway-tealDeep transition-colors focus-ring"
            >
              No dominant noncardiac mimic — assess cardiac mimics →
            </button>
          )}
        </div>
      )}

      {/* Step 3 — cardiac mimics */}
      {(phase === "cardiac" || phase === "confirmed") && (
        <div className="rounded-xl border border-pathway-line bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-2">
            Step 3 · Cardiac mimics
          </p>
          <p className="text-sm text-ink/70 mb-4">
            HFpEF is a diagnosis of exclusion after considering valvular, pericardial, myocardial (infiltrative /
            restrictive), and ischemic disease.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {cardiac.map((m) => (
              <MimicCard key={m.name} mimic={m} checked={checkedClues} onToggle={toggle} />
            ))}
          </div>
          {activeCardiac.length > 0 && (
            <div className="mt-4 rounded-md bg-pathway-crimsonSoft border border-pathway-crimson/30 p-3 text-sm text-ink/80">
              <strong>HF attributed to:</strong> {activeCardiac.map((m) => m.name).join("; ")}. Pursue the specific
              diagnostic and therapeutic pathway for this condition rather than standard HFpEF therapy alone.
            </div>
          )}
          {phase === "cardiac" && (
            <button
              onClick={() => setPhase("confirmed")}
              className="mt-5 rounded-md bg-pathway-teal px-4 py-2 text-sm font-medium text-white hover:bg-pathway-tealDeep transition-colors focus-ring"
            >
              No cardiac mimic identified — confirm HFpEF →
            </button>
          )}
        </div>
      )}

      {/* Step 4 — confirmed */}
      {phase === "confirmed" && (
        <div className="rounded-xl border border-pathway-teal bg-pathway-tealSoft p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-pathway-tealDeep mb-2">
            Step 4 · HFpEF associated with…
          </p>
          <p className="font-display text-lg text-pathway-tealDeep mb-3">
            No noncardiac or cardiac mimic dominates the picture — HFpEF is established. Identify comorbidities
            driving the phenotype (coronary artery disease, atrial fibrillation, hypertension, chronic kidney
            disease, diabetes, obesity) and proceed to optimal medical therapy.
          </p>
          <p className="text-sm text-pathway-tealDeep/80">
            Continue to the <strong>Treatment &amp; Follow-up</strong> and <strong>Medications</strong> tabs above.
          </p>
        </div>
      )}
    </div>
  );
}
