"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

const navLinks = [
  { label: "Search", href: "/search" },
  { label: "Contact me", href: "#" },
] as const;

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-110 h-0">
      <nav
        aria-label="Primary"
        className={[
          "absolute left-0 right-0 top-6 mx-auto w-[min(80rem,calc(100%-2rem))] rounded-2xl border px-4 py-3 shadow-lg shadow-black/8 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-300 ease-out",
          isScrolled
            ? "border-stone-200/80 bg-white/80 ring-1 ring-white/60"
            : "border-white/50 bg-white/65 ring-1 ring-white/40",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold tracking-tight text-emerald-950">
              FreshLeaf
            </Link>

            <div className="hidden items-center gap-1 sm:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-950/80 transition hover:bg-stone-100 hover:text-emerald-950"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="#"
              className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-emerald-950 transition hover:bg-stone-50"
            >
              Account
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls={menuId}
            onClick={() => setIsOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white p-2 text-emerald-950 transition hover:bg-stone-50 sm:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {isOpen ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </>
              ) : (
                <>
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </>
              )}
            </svg>
          </button>
        </div>

        {isOpen ? (
          <div id={menuId} className="mt-3 space-y-2 border-t border-stone-200 pt-3 sm:hidden">
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-2 py-2 text-sm font-medium text-emerald-950/90 transition hover:bg-stone-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-emerald-950 transition hover:bg-stone-50"
              >
                Account
              </Link>
              <Link
                href="/search"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                Get started
              </Link>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
