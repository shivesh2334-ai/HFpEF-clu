import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPT = `You are a clinical reference assistant embedded in an HFpEF (heart failure with
preserved ejection fraction) decision-support tool for cardiologists, built on the 2026 ACC Expert
Consensus Decision Pathway (Kittleson et al., JACC 2026). Answer questions about HFpEF diagnosis
(H2FPEF, HFA-PEFF, HFpEF-ABA scores), mimics, optimal medical therapy (SGLT2 inhibitors, nonsteroidal
MRAs/finerenone, incretin-based therapies, ARNI, ARB), nonpharmacologic management, device therapy,
and comorbidity management (hypertension, diabetes, obesity, AF, CAD, CKD) concisely and precisely,
citing the relevant trial or section when useful (e.g. "per DELIVER", "per FINEARTS-HF"). This is a
reference tool for a practicing clinician, not a patient-facing chatbot — you may use standard medical
terminology. Always add a brief note that final decisions require clinical judgment and the full source
guideline. Keep answers focused and under ~200 words unless asked to go deeper.`;

export async function POST(req: NextRequest) {
  const apiKey = (process.env.LLM_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.CLAUDE_API_KEY)?.trim();
  const baseUrl = (process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1").trim();
  const model = (process.env.LLM_MODEL || "meta-llama/llama-3.3-70b-instruct:free").trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No LLM_API_KEY (or GROQ_API_KEY/GEMINI_API_KEY/CLAUDE_API_KEY) configured. Add it (and optionally LLM_BASE_URL / LLM_MODEL) as environment variables in Vercel — see README for free-tier provider options.",
      },
      { status: 500 }
    );
  }

  const { messages } = await req.json();

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Provider error (${res.status}): ${text.slice(0, 300)}` }, { status: 502 });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "No response generated.";
    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: `Request failed: ${err.message}` }, { status: 500 });
  }
}
