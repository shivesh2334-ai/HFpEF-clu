"use client";

import { useState } from "react";
import { drugClasses } from "@/lib/data";

export default function Medications() {
  const [open, setOpen] = useState<string | null>(drugClasses[0]?.className ?? null);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-1">
        Optimal medical therapy — reference
      </p>
      {drugClasses.map((dc) => {
        const isOpen = open === dc.className;
        return (
          <div key={dc.className} className="rounded-xl border border-pathway-line bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : dc.className)}
              className="w-full flex items-center justify-between px-5 py-4 text-left focus-ring"
            >
              <span className="font-display text-lg text-ink">{dc.className}</span>
              <span className="text-pathway-teal text-sm">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 space-y-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink/50">
                      <th className="pb-1 font-medium">Agent</th>
                      <th className="pb-1 font-medium">Starting dose</th>
                      <th className="pb-1 font-medium">Target dose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dc.agents.map((a) => (
                      <tr key={a.name} className="border-t border-pathway-line">
                        <td className="py-2 pr-2 font-medium text-ink">{a.name}</td>
                        <td className="py-2 pr-2 text-ink/75">{a.start}</td>
                        <td className="py-2 text-ink/75">{a.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-pathway-tealDeep mb-1">
                    Indications
                  </p>
                  <p className="text-sm text-ink/75">{dc.indications}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md bg-pathway-crimsonSoft border border-pathway-crimson/30 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-pathway-crimson mb-1">
                      Contraindications
                    </p>
                    <ul className="text-sm text-ink/75 list-disc list-inside space-y-0.5">
                      {dc.contraindications.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md bg-pathway-amberSoft border border-pathway-amber/30 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-pathway-amber mb-1">Cautions</p>
                    <ul className="text-sm text-ink/75 list-disc list-inside space-y-0.5">
                      {dc.cautions.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <p className="text-xs text-ink/40 pt-2">
        Beta-blockers: no established mortality/HF benefit in HFpEF and may worsen exertional capacity via
        chronotropic incompetence — reserve for angina or AF rate control only, at minimal effective dose.
      </p>
    </div>
  );
}
