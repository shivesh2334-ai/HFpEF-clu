"use client";

import { useState } from "react";
import DecisionTree from "@/components/DecisionTree";
import ScoreCalculators from "@/components/ScoreCalculators";
import TreatmentPlan from "@/components/TreatmentPlan";
import Medications from "@/components/Medications";
import Chatbot from "@/components/Chatbot";

const TABS = [
  { key: "tree", label: "Decision tree" },
  { key: "scores", label: "Diagnostic scores" },
  { key: "treatment", label: "Treatment & follow-up" },
  { key: "meds", label: "Medications" },
  { key: "chat", label: "Ask HFpEF" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function Page() {
  const [tab, setTab] = useState<TabKey>("tree");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pathway-teal">
          Clinical decision support
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-ink mt-1">HFpEF Pathway</h1>
        <p className="mt-2 text-sm text-ink/60 max-w-2xl">
          Diagnosis-to-treatment support for heart failure with preserved ejection fraction, structured on the
          2026 ACC Expert Consensus Decision Pathway (Kittleson et al., <em>J Am Coll Cardiol</em> 2026).
        </p>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-pathway-line mb-8">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors focus-ring ${
              tab === t.key
                ? "bg-white border border-pathway-line border-b-white text-pathway-tealDeep -mb-px"
                : "text-ink/50 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "tree" && <DecisionTree />}
      {tab === "scores" && <ScoreCalculators />}
      {tab === "treatment" && <TreatmentPlan />}
      {tab === "meds" && <Medications />}
      {tab === "chat" && <Chatbot />}

      <footer className="mt-16 border-t border-pathway-line pt-6 text-xs text-ink/40">
        For clinician reference only — not a substitute for clinical judgment or the full source guideline.
        Source: Kittleson MM, Panjrath GS, Bates K, et al. Management of Heart Failure With Preserved Ejection
        Fraction: 2026 ACC Expert Consensus Decision Pathway. <em>J Am Coll Cardiol</em>. 2026.
      </footer>
    </main>
  );
}
