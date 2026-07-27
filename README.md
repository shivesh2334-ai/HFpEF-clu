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
   describing the pathway content, backed by any OpenAI-compatible LLM endpoint (see below).
6. **Research portal** — clinician-defined data collection: build a study's parameter list (label,
   type, required), provision a formatted Google Sheet with one click, and record data that syncs
   to the sheet in real time with duplicate-record prevention. Supports two sync paths in parallel:
   direct browser calls to the Google Sheets API (via Google Sign-In), or a Google Apps Script
   Web App webhook — see "Research Portal setup" below.

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

## Configure the chatbot (free-tier LLM)

The `/api/chat` route calls any **OpenAI-compatible** `chat/completions` endpoint, so you can
point it at whichever free tier you have access to. Set these as Vercel Environment Variables
(Project → Settings → Environment Variables) — see `.env.example` for the exact values per
provider:

| Provider | LLM_BASE_URL | LLM_MODEL | Notes |
|---|---|---|---|
| OpenRouter | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.3-70b-instruct:free` | Many `:free`-suffixed models |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | Fast, generous free tier |
| Mistral | `https://api.mistral.ai/v1` | `mistral-small-latest` | Free tier available |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-1.5-flash` | Uses Gemini's OpenAI-compatible endpoint |

Always set `LLM_API_KEY` to the API key from whichever provider you choose. Without it, the
other four tabs still work fully — only the chat tab needs this key.

**Never commit an API key.** `.env.local` is gitignored; use Vercel's Environment Variables UI
for production.

## Research Portal setup

The Research Portal lets a clinician define study parameters, provision a Google Sheet, and
stream records into it with duplicate prevention. Two independent sync engines are available —
set one or both up depending on your needs.

### Option A — Direct Google Sheets API (Google Sign-In)

1. Create a project at console.firebase.google.com → **Authentication → Sign-in method → Google**
   → enable it.
2. In **Project settings → General**, copy the Web app config values into these Vercel
   environment variables: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
3. In the linked Google Cloud project (console.cloud.google.com, same project ID) → **APIs &
   Services → Library**: enable the **Google Sheets API** and **Google Drive API**.
4. Under **APIs & Services → OAuth consent screen**, add scopes
   `https://www.googleapis.com/auth/spreadsheets` and
   `https://www.googleapis.com/auth/drive.file`, and add your clinical team's Google accounts as
   test users while the app is in "Testing" mode (fine for internal registry use; submit for
   verification only if you need external users).
5. Under **Authentication → Settings → Authorized domains** in Firebase, add your Vercel domain.
6. Redeploy. In the app: Research Portal tab → **Sign in with Google** → **Create Google Sheet for
   this study**. The sheet is created in the signed-in clinician's own Drive, with a formatted,
   frozen header row matching the study's parameters.

### Option B — Google Apps Script Webhook

No Firebase/OAuth setup needed — useful as a fallback or if you'd rather the spreadsheet stay
under one shared Google account rather than per-clinician OAuth.

1. Open (or create) the target Google Sheet.
2. **Extensions → Apps Script**, paste the contents of `appsscript/Code.gs` (also shown with a
   copy button inside the Research Portal tab).
3. **Deploy → New deployment → Web app**. Execute as **Me**, access **Anyone**. Copy the `/exec`
   URL.
4. In the Research Portal tab, select **Apps Script Webhook** as the sync mode and paste that URL.

Both paths write to a `Records` sheet/tab with `RecordID`, `Timestamp`, `Recorded by`, then one
column per study parameter, and both refuse to insert a row whose `RecordID` is already present —
the direct-API path checks column A client-side before appending; the Apps Script path re-checks
server-side inside a script lock, which is the more race-condition-safe option if multiple
clinicians may submit at the same moment.

## Editing clinical content

All decision-tree logic, mimic clues/work-up, drug doses, contraindications, and comorbidity
guidance live in a single typed file: `lib/data.ts`. Update the source arrays there to reflect
future guideline revisions — the UI re-renders from that file automatically.

## Disclaimer

For clinician reference only. This tool encodes content from a single consensus pathway and does
not replace the full guideline, package inserts, or individualized clinical judgment.
