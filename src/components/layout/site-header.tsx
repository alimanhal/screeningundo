import Link from "next/link";
import { getIsAdmin, getUser } from "@/lib/supabase/helpers";
import { SignOutButton } from "@/components/auth/sign-out-button";

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span
        aria-hidden
        className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-[11px] font-extrabold tracking-tight text-surface"
      >
        26
      </span>
      <span className="display text-[15px] text-ink">screeningundo..</span>
    </Link>
  );
}

export async function SiteHeader() {
  const user = await getUser();
  const isAdmin = user ? await getIsAdmin() : false;

  return (
    <header className="sticky top-0 z-[1100] border-b border-line bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Wordmark />

        <nav className="flex items-center gap-5 text-sm font-medium text-ink-soft">
          <Link href="/" className="py-1 transition hover:text-ink">
            Venues
          </Link>
          <Link href="/matches" className="py-1 transition hover:text-ink">
            Matches
          </Link>
          {isAdmin && (
            <Link href="/admin" className="py-1 text-blue transition hover:text-blue-deep">
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-4 whitespace-nowrap text-sm">
          <Link
            href="/submit"
            className="press rounded-full bg-ink px-4 py-2 font-semibold text-surface"
          >
            Add a venue
          </Link>
          {user ? (
            <>
              <Link
                href="/me"
                className="hidden font-medium text-ink-soft transition hover:text-ink sm:block"
              >
                My venues
              </Link>
              <SignOutButton className="cursor-pointer font-medium text-ink-faint transition hover:text-ink" />
            </>
          ) : (
            <Link
              href="/login"
              className="font-medium text-ink-soft transition hover:text-ink"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
