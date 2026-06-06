import Link from "next/link";
import { getIsAdmin, getUser } from "@/lib/supabase/helpers";
import { SignOutButton } from "@/components/auth/sign-out-button";

/** Wordmark: the three Bauhaus primitives ● ▲ ■ (see docs/DESIGN.md §4). */
function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span aria-hidden className="flex items-center gap-1">
        <span className="h-3.5 w-3.5 rounded-full bg-red" />
        <span
          className="h-0 w-0 border-x-[7px] border-b-[13px] border-x-transparent"
          style={{ borderBottomColor: "var(--yellow)" }}
        />
        <span className="h-3.5 w-3.5 bg-blue" />
      </span>
      <span className="display text-sm tracking-wider text-ink">
        WC26 Screenings
      </span>
    </Link>
  );
}

export async function SiteHeader() {
  const user = await getUser();
  const isAdmin = user ? await getIsAdmin() : false;

  return (
    <header className="sticky top-0 z-[1100] border-b-2 border-ink bg-paper">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Wordmark />

        <nav className="flex items-center gap-4 text-sm font-medium text-ink-soft">
          <Link href="/" className="transition hover:text-blue">
            Venues
          </Link>
          <Link href="/matches" className="transition hover:text-blue">
            Matches
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-blue transition hover:text-ink">
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3 whitespace-nowrap text-sm">
          <Link
            href="/submit"
            className="press border-2 border-ink bg-red px-3.5 py-1.5 font-semibold text-paper"
          >
            + Add a venue
          </Link>
          {user ? (
            <>
              <Link
                href="/me"
                className="hidden font-medium text-ink-soft transition hover:text-blue sm:block"
              >
                My venues
              </Link>
              <SignOutButton className="cursor-pointer font-medium text-ink-faint transition hover:text-ink" />
            </>
          ) : (
            <Link
              href="/login"
              className="font-medium text-ink-soft transition hover:text-blue"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
