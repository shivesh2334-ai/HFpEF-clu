"use client";

import { useEffect, useMemo, useState } from "react";
import { signInWithGoogle, signOutOfGoogle, isFirebaseConfigured } from "@/lib/firebase";
import { provisionResearchSheet, appendRecordIfNew } from "@/lib/googleSheets";
import { APPS_SCRIPT_SOURCE } from "@/lib/appsScriptSource";

type FieldType = "text" | "number" | "date" | "select" | "boolean";

type Param = {
  id: string;
  label: string;
  type: FieldType;
  options?: string;
  required: boolean;
};

type SyncMode = "direct" | "webhook";

type LogEntry = {
  id: string;
  time: string;
  summary: string;
  status: "inserted" | "duplicate" | "error" | "pending";
  detail?: string;
};

const STORAGE_KEY = "hfpef-research-portal-v1";

function loadSaved() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ResearchPortal() {
  const saved = useMemo(loadSaved, []);

  const [studyName, setStudyName] = useState<string>(saved?.studyName ?? "HFpEF Registry");
  const [parameters, setParameters] = useState<Param[]>(
    saved?.parameters ?? [
      { id: uid(), label: "Age", type: "number", required: true },
      { id: uid(), label: "LVEF (%)", type: "number", required: true },
      { id: uid(), label: "NYHA class", type: "select", options: "I,II,III,IV", required: true },
      { id: uid(), label: "H2FPEF score", type: "number", required: false },
    ]
  );
  const [spreadsheetId, setSpreadsheetId] = useState<string>(saved?.spreadsheetId ?? "");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(saved?.spreadsheetUrl ?? "");
  const [syncMode, setSyncMode] = useState<SyncMode>(saved?.syncMode ?? "direct");
  const [webhookUrl, setWebhookUrl] = useState<string>(saved?.webhookUrl ?? "");

  const [session, setSession] = useState<{ email: string; accessToken: string } | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [recordId, setRecordId] = useState(uid());
  const [log, setLog] = useState<LogEntry[]>([]);
  const [scriptCopied, setScriptCopied] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ studyName, parameters, spreadsheetId, spreadsheetUrl, syncMode, webhookUrl })
    );
  }, [studyName, parameters, spreadsheetId, spreadsheetUrl, syncMode, webhookUrl]);

  const headers = useMemo(() => ["RecordID", "Timestamp", "Recorded by", ...parameters.map((p) => p.label)], [parameters]);

  function addParam() {
    setParameters((p) => [...p, { id: uid(), label: "", type: "text", required: false }]);
  }
  function updateParam(id: string, patch: Partial<Param>) {
    setParameters((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function removeParam(id: string) {
    setParameters((p) => p.filter((x) => x.id !== id));
  }

  async function handleSignIn() {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { user, accessToken } = await signInWithGoogle();
      setSession({ email: user.email ?? "connected account", accessToken });
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    await signOutOfGoogle();
    setSession(null);
  }

  async function handleProvision() {
    if (!session) return;
    setProvisioning(true);
    setAuthError(null);
    try {
      const result = await provisionResearchSheet(session.accessToken, studyName, headers);
      setSpreadsheetId(result.spreadsheetId);
      setSpreadsheetUrl(result.spreadsheetUrl);
    } catch (e: any) {
      setAuthError(e.message);
    } finally {
      setProvisioning(false);
    }
  }

  function resetForm() {
    setFormValues({});
    setRecordId(uid());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!spreadsheetId) {
      setAuthError("Create or link a Google Sheet before saving records.");
      return;
    }
    const missing = parameters.filter((p) => p.required && !formValues[p.id]);
    if (missing.length) {
      setAuthError(`Missing required field(s): ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setAuthError(null);

    const timestamp = new Date().toISOString();
    const row = [recordId, timestamp, session?.email ?? "unauthenticated", ...parameters.map((p) => formValues[p.id] ?? "")];
    const summary = parameters
      .slice(0, 3)
      .map((p) => `${p.label}: ${formValues[p.id] ?? "—"}`)
      .join(" · ");

    setLog((l) => [{ id: recordId, time: timestamp, summary, status: "pending" }, ...l]);

    try {
      if (syncMode === "direct") {
        if (!session) throw new Error("Sign in with Google to sync directly to Sheets.");
        const status = await appendRecordIfNew(session.accessToken, spreadsheetId, recordId, row);
        setLog((l) => l.map((entry) => (entry.id === recordId ? { ...entry, status } : entry)));
      } else {
        if (!webhookUrl) throw new Error("Enter the Apps Script Webhook URL first.");
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ spreadsheetId, recordId, row, headers, sheetName: "Records" }),
        });
        const data = await res.json();
        setLog((l) => l.map((entry) => (entry.id === recordId ? { ...entry, status: data.status ?? "error", detail: data.message } : entry)));
      }
      resetForm();
    } catch (err: any) {
      setLog((l) => l.map((entry) => (entry.id === recordId ? { ...entry, status: "error", detail: err.message } : entry)));
    }
  }

  function copyScript() {
    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 1800);
  }

  const statusStyles: Record<LogEntry["status"], string> = {
    inserted: "bg-pathway-tealSoft text-pathway-tealDeep border-pathway-teal/40",
    duplicate: "bg-pathway-amberSoft text-pathway-amber border-pathway-amber/40",
    error: "bg-pathway-crimsonSoft text-pathway-crimson border-pathway-crimson/40",
    pending: "bg-pathway-bg text-ink/50 border-pathway-line",
  };

  return (
    <div className="space-y-8">
      {!isFirebaseConfigured() && (
        <div className="rounded-md bg-pathway-amberSoft border border-pathway-amber/40 px-4 py-3 text-sm text-pathway-amber">
          Google sign-in isn't configured yet (missing <code className="font-mono">NEXT_PUBLIC_FIREBASE_*</code>{" "}
          environment variables) — see README. The Apps Script Webhook sync mode below works without it.
        </div>
      )}

      {/* Study setup */}
      <section className="rounded-xl border border-pathway-line bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-3">1 · Study parameters</p>
        <label className="block text-sm text-ink/70 mb-4">
          Study / registry name
          <input
            value={studyName}
            onChange={(e) => setStudyName(e.target.value)}
            className="mt-1 w-full rounded-md border border-pathway-line px-3 py-2 text-sm focus-ring"
          />
        </label>

        <div className="space-y-2">
          {parameters.map((p) => (
            <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
              <input
                placeholder="Field label (e.g. Age)"
                value={p.label}
                onChange={(e) => updateParam(p.id, { label: e.target.value })}
                className="col-span-4 rounded-md border border-pathway-line px-2 py-1.5 text-sm focus-ring"
              />
              <select
                value={p.type}
                onChange={(e) => updateParam(p.id, { type: e.target.value as FieldType })}
                className="col-span-2 rounded-md border border-pathway-line px-2 py-1.5 text-sm focus-ring"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Dropdown</option>
                <option value="boolean">Yes / No</option>
              </select>
              {p.type === "select" ? (
                <input
                  placeholder="Options, comma separated"
                  value={p.options ?? ""}
                  onChange={(e) => updateParam(p.id, { options: e.target.value })}
                  className="col-span-4 rounded-md border border-pathway-line px-2 py-1.5 text-sm focus-ring"
                />
              ) : (
                <div className="col-span-4" />
              )}
              <label className="col-span-1 flex items-center gap-1 text-xs text-ink/60">
                <input type="checkbox" className="accent-pathway-teal" checked={p.required} onChange={(e) => updateParam(p.id, { required: e.target.checked })} />
                Req.
              </label>
              <button onClick={() => removeParam(p.id)} className="col-span-1 text-pathway-crimson text-sm hover:underline focus-ring">
                Remove
              </button>
            </div>
          ))}
        </div>
        <button onClick={addParam} className="mt-3 rounded-md border border-pathway-teal text-pathway-teal px-3 py-1.5 text-sm hover:bg-pathway-tealSoft focus-ring">
          + Add parameter
        </button>
      </section>

      {/* Google connection */}
      <section className="rounded-xl border border-pathway-line bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-3">2 · Connect Google Sheets</p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {session ? (
            <>
              <span className="text-sm text-ink/70">Connected as <strong>{session.email}</strong></span>
              <button onClick={handleSignOut} className="rounded-md border border-pathway-line px-3 py-1.5 text-sm hover:bg-pathway-bg focus-ring">
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={authLoading}
              className="rounded-md bg-pathway-teal px-4 py-2 text-sm font-medium text-white hover:bg-pathway-tealDeep disabled:opacity-50 focus-ring"
            >
              {authLoading ? "Connecting…" : "Sign in with Google"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleProvision}
            disabled={!session || provisioning}
            className="rounded-md bg-pathway-tealDeep px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 focus-ring"
          >
            {provisioning ? "Creating…" : "Create Google Sheet for this study"}
          </button>
          <span className="text-sm text-ink/50">or</span>
          <input
            placeholder="Paste an existing Spreadsheet ID"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            className="rounded-md border border-pathway-line px-3 py-1.5 text-sm w-72 focus-ring"
          />
        </div>

        {spreadsheetUrl && (
          <a href={spreadsheetUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-pathway-teal underline">
            Open connected spreadsheet in Google Drive →
          </a>
        )}

        <div className="mt-5 border-t border-pathway-line pt-4">
          <p className="text-sm font-medium text-ink mb-2">Sync mode</p>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="syncMode" className="accent-pathway-teal" checked={syncMode === "direct"} onChange={() => setSyncMode("direct")} />
              Direct Google Sheets API (needs Google sign-in above)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="syncMode" className="accent-pathway-teal" checked={syncMode === "webhook"} onChange={() => setSyncMode("webhook")} />
              Apps Script Webhook
            </label>
          </div>
          {syncMode === "webhook" && (
            <input
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="mt-2 w-full rounded-md border border-pathway-line px-3 py-2 text-sm focus-ring"
            />
          )}
        </div>

        {authError && <p className="mt-3 text-sm text-pathway-crimson">{authError}</p>}
      </section>

      {/* Data entry */}
      <section className="rounded-xl border border-pathway-line bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-3">3 · Record data</p>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {parameters.map((p) => (
            <label key={p.id} className="text-sm text-ink/70">
              {p.label || "(unlabeled field)"} {p.required && <span className="text-pathway-crimson">*</span>}
              {p.type === "select" ? (
                <select
                  value={formValues[p.id] ?? ""}
                  onChange={(e) => setFormValues((v) => ({ ...v, [p.id]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-pathway-line px-3 py-2 text-sm focus-ring"
                >
                  <option value="">Select…</option>
                  {(p.options ?? "").split(",").map((o) => o.trim()).filter(Boolean).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : p.type === "boolean" ? (
                <select
                  value={formValues[p.id] ?? ""}
                  onChange={(e) => setFormValues((v) => ({ ...v, [p.id]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-pathway-line px-3 py-2 text-sm focus-ring"
                >
                  <option value="">Select…</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : (
                <input
                  type={p.type}
                  value={formValues[p.id] ?? ""}
                  onChange={(e) => setFormValues((v) => ({ ...v, [p.id]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-pathway-line px-3 py-2 text-sm focus-ring"
                />
              )}
            </label>
          ))}
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" className="rounded-md bg-pathway-teal px-4 py-2 text-sm font-medium text-white hover:bg-pathway-tealDeep focus-ring">
              Save record to sheet
            </button>
            <span className="font-mono text-xs text-ink/40">Record ID: {recordId.slice(0, 8)}…</span>
          </div>
        </form>
      </section>

      {/* Log */}
      {log.length > 0 && (
        <section className="rounded-xl border border-pathway-line bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal mb-3">Recent submissions</p>
          <div className="space-y-2">
            {log.map((entry) => (
              <div key={entry.id + entry.time} className={`rounded-md border px-3 py-2 text-sm flex items-center justify-between gap-3 ${statusStyles[entry.status]}`}>
                <span>{entry.summary || "(no fields shown)"}</span>
                <span className="font-mono text-xs uppercase shrink-0">{entry.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Apps Script reference */}
      <section className="rounded-xl border border-pathway-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-pathway-teal">Apps Script webhook source</p>
          <button onClick={copyScript} className="text-xs rounded-md border border-pathway-line px-2 py-1 hover:bg-pathway-bg focus-ring">
            {scriptCopied ? "Copied" : "Copy script"}
          </button>
        </div>
        <p className="text-sm text-ink/60 mb-3">
          Paste into Extensions → Apps Script on the target sheet, then deploy as a Web App (execute as Me, access
          Anyone). Also saved at <code className="font-mono">/appsscript/Code.gs</code> in the repo.
        </p>
        <pre className="rounded-md bg-slate-950 text-slate-100 text-xs p-4 overflow-x-auto max-h-72 font-mono">
{APPS_SCRIPT_SOURCE}
        </pre>
      </section>
    </div>
  );
}
