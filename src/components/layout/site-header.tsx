import Link from "next/link";
import { getIsAdmin, getUser } from "@/lib/supabase/helpers";
import { SignOutButton } from "@/components/auth/sign-out-button";

export async function SiteHeader() {
  const user = await getUser();
  const isAdmin = user ? await getIsAdmin() : false;

  return (
    <header className="sticky top-0 z-[1100] border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-5 px-4">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="display rounded bg-pitch-deep px-1.5 py-0.5 text-sm leading-none text-paper">
            WC26
          </span>
          <span className="display text-sm tracking-wide text-ink">
            Screenings
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-ink-soft">
          <Link href="/" className="transition hover:text-pitch-deep">
            Venues
          </Link>
          <Link href="/matches" className="transition hover:text-pitch-deep">
            Matches
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-gold-deep transition hover:text-ink"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm">
          <Link
            href="/submit"
            className="rounded-full bg-pitch px-3.5 py-1.5 font-semibold text-paper transition hover:bg-pitch-deep"
          >
            + Add a venue
          </Link>
          {user ? (
            <>
              <Link
                href="/me"
                className="hidden font-medium text-ink-soft transition hover:text-pitch-deep sm:block"
              >
                My venues
              </Link>
              <SignOutButton className="cursor-pointer font-medium text-ink-faint transition hover:text-ink" />
            </>
          ) : (
            <Link
              href="/login"
              className="font-medium text-ink-soft transition hover:text-pitch-deep"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
