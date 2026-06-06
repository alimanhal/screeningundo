"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/redirect";

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
    <div className="border-2 border-ink bg-surface p-6 sm:p-8">
      <span aria-hidden className="mb-4 flex items-center gap-1">
        <span className="h-3 w-3 rounded-full bg-red" />
        <span
          className="h-0 w-0 border-x-[6px] border-b-[11px] border-x-transparent"
          style={{ borderBottomColor: "var(--yellow)" }}
        />
        <span className="h-3 w-3 bg-blue" />
      </span>
      <h1 className="display text-2xl text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Sign in to add screening locations. Browsing is open to everyone.
      </p>

      {callbackError && (
        <p className="mt-4 border-2 border-ink bg-red-wash px-3 py-2 text-sm text-red">
          Sign-in failed or the link expired. Please try again.
        </p>
      )}

      {status === "sent" ? (
        <p className="mt-6 border-2 border-ink bg-blue-wash px-3 py-2 text-sm text-blue-deep">
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
              className="mt-1 w-full border-2 border-ink bg-paper px-3 py-2 text-base font-normal text-ink outline-none sm:text-sm placeholder:text-ink-faint"
            />
          </label>
          <button
            type="submit"
            disabled={status === "sending"}
            className="press w-full border-2 border-ink bg-red px-4 py-2 font-semibold text-paper disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Email me a magic link"}
          </button>
        </form>
      )}

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-ink-faint">
        <span className="h-0.5 flex-1 bg-ink" />
        or
        <span className="h-0.5 flex-1 bg-ink" />
      </div>

      <button
        onClick={handleGoogle}
        disabled={status === "oauth"}
        className="press w-full border-2 border-ink bg-surface px-4 py-2 font-semibold text-ink disabled:opacity-60"
      >
        {status === "oauth" ? "Redirecting…" : "Continue with Google"}
      </button>

      {status === "error" && errorMessage && (
        <p className="mt-4 border-2 border-ink bg-red-wash px-3 py-2 text-sm text-red">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
