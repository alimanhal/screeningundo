"use client";

import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-full border border-line-strong px-3 py-1.5 text-sm font-semibold text-ink-soft transition hover:border-pitch hover:text-pitch-deep"
    >
      {copied ? "Link copied ✓" : "Share"}
    </button>
  );
}
