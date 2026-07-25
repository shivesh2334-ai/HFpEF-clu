# HFpEF Pathway

Interactive diagnosis-to-treatment decision support for heart failure with preserved ejection
fraction (HFpEF), built on the **2026 ACC Expert Consensus Decision Pathway** (Kittleson MM,
Panjrath GS, Bates K, et al. *J Am Coll Cardiol*. 2026).

Stack: Next.js 14 (App Router) · TypeScript · Tailwind CSS. No database required.

## What's in it

1. **Decision tree** — stepwise Figure 4 logic (entry → noncardiac mimics → cardiac mimics →
   HFpEF confirmed). Each mimic is a box with checkbox "branch" inputs for its clinical clues;
   checking any clue reveals the recommended work-up for that mimic (Table 2).
2. **Diagnostic scores** — interactive H₂FPEF calculator (point system + probability band) and
   HFpEF-ABA calculator (age/BMI/AF → logistic probability, per Reddy et al.).
3. **Treatment & follow-up** — the optimal-medical-therapy algorithm (SGLT2i + nonsteroidal MRA
   as foundation, phenotype-directed add-ons, diuretics, beta-blocker cautions) plus
   comorbidity-specific guidance (hypertension, T2DM, obesity, CKD, AF, CAD) and a follow-up
   checklist.
4. **Medications** — indications, starting/target doses, contraindications, and cautions for each
   drug class (SGLT2i, nonsteroidal and steroidal MRA, incretin-based therapy, ARNI, ARB).
5. **Ask HFpEF** — a chat interface answering free-text questions, grounded by a system prompt
   describing the pathway content, backed by direct provider APIs for Groq, Gemini, or Claude.

This is a reference/decision-support tool for a practicing clinician — it does not store patient
data and makes no determination on its own; all outputs require clinical judgment.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy — GitHub

1. Create a new repository at github.com/shivesh2334-ai (or via the GitHub app/Working Copy on
   iPad): **New repository → hfpef-pathway → Private or Public**.
2. Push this project's contents to it. From Working Copy: add this folder as the repo's working
   copy, commit all files, and push to `main`. From a desktop shell:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — HFpEF pathway app"
   git branch -M main
   git remote add origin https://github.com/shivesh2334-ai/hfpef-pathway.git
   git push -u origin main
   ```

## Deploy — Vercel

1. Go to vercel.com → **Add New → Project** → import the `hfpef-pathway` GitHub repo.
2. Framework preset: Next.js (auto-detected). No build settings need changing.
3. Under **Environment Variables**, add the chatbot's LLM credentials (see below) before the
   first deploy, or add them afterward and redeploy.
4. Deploy. `vercel.json` pins the deployment region to `bom1` (Mumbai) to match existing
   projects.

## Configure the chatbot (direct provider APIs)

The `/api/chat` route now calls provider APIs directly (no generic OpenAI-compatible base URL).
Set these as Vercel Environment Variables (Project → Settings → Environment Variables):

- `LLM_PROVIDER` = `groq`, `gemini`, or `claude`
- For API key, set the provider-specific key (`GROQ_API_KEY`, `GEMINI_API_KEY`, or `CLAUDE_API_KEY`)
  or set `LLM_API_KEY` as a shared fallback key.
- Optional model override variables:
  - `GROQ_MODEL` (default `llama-3.3-70b-versatile`)
  - `GEMINI_MODEL` (default `gemini-1.5-flash`)
  - `CLAUDE_MODEL` (default `claude-3-5-sonnet-latest`)

Without valid provider credentials, the other four tabs still work fully — only the chat tab
needs these keys.

**Never commit an API key.** `.env.local` is gitignored; use Vercel's Environment Variables UI
for production.

## Editing clinical content

All decision-tree logic, mimic clues/work-up, drug doses, contraindications, and comorbidity
guidance live in a single typed file: `lib/data.ts`. Update the source arrays there to reflect
future guideline revisions — the UI re-renders from that file automatically.

## Disclaimer

For clinician reference only. This tool encodes content from a single consensus pathway and does
not replace the full guideline, package inserts, or individualized clinical judgment.
