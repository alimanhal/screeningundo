"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

function Wordmark() {
  return (
    <Link href="/" className="wordmark-ml display text-[17px] leading-tight text-ink sm:text-[18px]">
      സ്ക്രീനിംഗ് ഉണ്ടോ..
    </Link>
  );
}

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export function SiteHeaderNav({
  isLoggedIn,
}: {
  isLoggedIn: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  const navLinks = (
    <>
      <Link
        href="/"
        onClick={closeMenu}
        className="py-1 transition hover:text-blue-deep"
      >
        Venues
      </Link>
      <Link
        href="/matches"
        onClick={closeMenu}
        className="py-1 transition hover:text-blue-deep"
      >
        Matches
      </Link>
    </>
  );

  const authLinks = isLoggedIn ? (
    <>
      <Link
        href="/me"
        onClick={closeMenu}
        className="font-medium text-ink-soft transition hover:text-ink"
      >
        My venues
      </Link>
      <SignOutButton className="cursor-pointer text-left font-medium text-ink-faint transition hover:text-ink" />
    </>
  ) : (
    <Link
      href="/login"
      onClick={closeMenu}
      className="font-medium text-ink-soft transition hover:text-ink"
    >
      Sign in
    </Link>
  );

  return (
    <header className="header-accent sticky top-0 z-[1100] bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
        <Wordmark />

        {/* Desktop nav */}
        <nav className="ml-4 hidden items-center gap-5 text-sm font-semibold text-ink-soft min-[671px]:flex">
          {navLinks}
        </nav>

        <div className="ml-auto flex items-center gap-3 whitespace-nowrap text-sm">
          <Link
            href="/submit"
            className="btn-primary press rounded-full px-3 py-2 text-sm min-[671px]:px-4"
          >
            <span className="max-[670px]:hidden">Add a venue</span>
            <span className="min-[671px]:hidden">Add</span>
          </Link>
          <div className="hidden items-center gap-4 min-[671px]:flex">
            {authLinks}
          </div>

          {/* Mobile burger — screens up to 670px */}
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:border-blue/40 max-[670px]:flex min-[671px]:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <BurgerIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          className="fixed inset-y-0 right-0 z-[1100] flex w-fit min-w-[200px] flex-col gap-1 border-l border-line bg-surface px-5 py-6 shadow-[var(--shadow-raised)] min-[671px]:hidden"
        >
          <button
            type="button"
            aria-label="Close menu"
            className="mb-4 flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-ink/10"
            onClick={closeMenu}
          >
            <svg
              aria-hidden
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-ink-faint">
            Menu
          </p>
          <div className="flex flex-col gap-4 text-base font-semibold text-ink-soft">
            {navLinks}
          </div>
          <div className="rule my-5" />
          <div className="flex flex-col gap-4 text-base">{authLinks}</div>
        </nav>
      )}
    </header>
  );
}
