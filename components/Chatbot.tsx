"use client";

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "When should finerenone be chosen over spironolactone?",
  "What SBP target is recommended in HFpEF?",
  "Which incretin-based therapy has HFpEF outcome data at what BMI cutoff?",
  "Why avoid beta-blockers in HFpEF?",
];

export default function Chatbot() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="rounded-xl border border-pathway-line bg-white shadow-sm flex flex-col h-[70vh]">
      <div className="px-5 py-4 border-b border-pathway-line">
        <p className="font-display text-lg text-ink">Ask about HFpEF</p>
        <p className="text-xs text-ink/50">
          Grounded in the 2026 ACC ECDP. Answers require a configured API key (LLM_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, or CLAUDE_API_KEY) — see README.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-ink/50">Try asking:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full text-left rounded-md border border-pathway-line px-3 py-2 text-sm text-ink/75 hover:bg-pathway-bg focus-ring"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-pathway-teal text-white"
                : "mr-auto bg-pathway-bg text-ink border border-pathway-line"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="mr-auto text-sm text-ink/40">Thinking…</div>}
        {error && (
          <div className="mr-auto max-w-[90%] rounded-lg px-3 py-2 text-sm bg-pathway-crimsonSoft border border-pathway-crimson/30 text-pathway-crimson">
            {error}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-pathway-line p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about HFpEF diagnosis or management…"
          className="flex-1 rounded-md border border-pathway-line px-3 py-2 text-sm focus-ring"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-pathway-teal px-4 py-2 text-sm font-medium text-white hover:bg-pathway-tealDeep transition-colors disabled:opacity-50 focus-ring"
        >
          Send
        </button>
      </form>
    </div>
  );
}
