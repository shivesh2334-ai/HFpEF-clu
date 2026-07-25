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

type ChatMessage = { role: "user" | "assistant"; content: string };
type Provider = "claude" | "gemini" | "groq";

function toProvider(value?: string): Provider {
  const provider = (value || "groq").trim().toLowerCase();
  if (provider === "claude" || provider === "gemini" || provider === "groq") {
    return provider;
  }
  throw new Error("Unsupported LLM_PROVIDER. Use claude, gemini, or groq.");
}

async function callGroq(messages: ChatMessage[]) {
  const apiKey = process.env.GROQ_API_KEY?.trim() || process.env.LLM_API_KEY?.trim();
  const model = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY (or fallback LLM_API_KEY) for LLM_PROVIDER=groq.");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
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
    throw new Error(`Groq error (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "No response generated.";
}

async function callClaude(messages: ChatMessage[]) {
  const apiKey = process.env.CLAUDE_API_KEY?.trim() || process.env.LLM_API_KEY?.trim();
  const model = (process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest").trim();

  if (!apiKey) {
    throw new Error("Missing CLAUDE_API_KEY (or fallback LLM_API_KEY) for LLM_PROVIDER=claude.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude error (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.content?.find((part: { type?: string; text?: string }) => part.type === "text")?.text ?? "No response generated.";
}

async function callGemini(messages: ChatMessage[]) {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.LLM_API_KEY?.trim();
  const model = (process.env.GEMINI_MODEL || "gemini-1.5-flash").trim();

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY (or fallback LLM_API_KEY) for LLM_PROVIDER=gemini.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 600,
      },
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("")
      .trim() || "No response generated."
  );
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const safeMessages: ChatMessage[] = Array.isArray(messages)
    ? messages
        .filter(
          (message): message is ChatMessage =>
            message &&
            (message.role === "user" || message.role === "assistant") &&
            typeof message.content === "string"
        )
        .slice(-12)
    : [];

  if (safeMessages.length === 0) {
    return NextResponse.json({ error: "No valid messages provided." }, { status: 400 });
  }

  try {
    const provider = toProvider(process.env.LLM_PROVIDER);
    let reply = "No response generated.";

    if (provider === "claude") {
      reply = await callClaude(safeMessages);
    } else if (provider === "gemini") {
      reply = await callGemini(safeMessages);
    } else if (provider === "groq") {
      reply = await callGroq(safeMessages);
    }

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: `Request failed: ${err.message}` }, { status: 500 });
  }
}
