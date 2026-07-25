import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HFpEF Pathway — 2026 ACC ECDP Decision Support",
  description:
    "Interactive diagnosis-to-treatment decision support for heart failure with preserved ejection fraction, based on the 2026 ACC Expert Consensus Decision Pathway.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
