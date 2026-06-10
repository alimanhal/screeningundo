"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/redirect";
import { FootballLoader } from "@/components/ui/football-loader";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error" | "oauth"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const callbackUrl = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function handleMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl() },
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function handleGoogle() {
    setStatus("oauth");
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h1 className="display text-2xl text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Sign in to add screening locations. Browsing is open to everyone.
      </p>

      {callbackError && (
        <p className="mt-4 rounded-xl bg-red-wash px-3 py-2 text-sm text-red">
          Sign-in failed or the link expired. Please try again.
        </p>
      )}

      {status === "sent" ? (
        <p className="mt-6 rounded-xl bg-blue-wash px-3 py-2 text-sm text-blue-deep">
          Check your inbox — we sent a magic link to <strong>{email}</strong>.
        </p>
      ) : (
        <form onSubmit={handleMagicLink} className="mt-6 space-y-3">
          <label className="block text-sm font-semibold text-ink">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base font-normal text-ink outline-none placeholder:text-ink-faint focus:border-blue focus:ring-2 focus:ring-blue/15 sm:text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={status === "sending"}
            className="btn-primary press inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 disabled:opacity-60"
          >
            {status === "sending" && (
              <FootballLoader size="sm" variant="spin" />
            )}
            {status === "sending" ? "Sending…" : "Email me a magic link"}
          </button>
        </form>
      )}

      {status === "error" && errorMessage && (
        <p className="mt-4 rounded-xl bg-red-wash px-3 py-2 text-sm text-red">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
