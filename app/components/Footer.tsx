import Link from "next/link";
import { LandingDotGrid } from "@/components/landing/LandingDotGrid";

const navLinks = [
  { label: "App", href: "/" },
  { label: "Search", href: "/search" },
  { label: "Contact", href: "#" },
] as const;

export default function Footer() {
  return (
    <footer className="relative z-40 mt-auto flex w-full flex-col bg-linear-to-b from-stone-50 via-white to-primary/20 text-emerald-950">
      <LandingDotGrid variant="hero" />

      {/* Constrained column; footer background is full viewport width */}
      <div className="relative z-10 w-full">
        <div className="mx-auto w-full max-w-[min(80rem,calc(100%-2rem))] px-4 pt-12 md:pt-16">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-lg font-bold tracking-tight text-emerald-950">
                FreshLeaf
              </p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-emerald-900/80">
                Scan locally. Analyze fairly. Help the web feel new again.
              </p>
            </div>
            <nav
              aria-label="Footer"
              className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-semibold md:justify-end"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-emerald-900 transition hover:text-emerald-950 hover:underline decoration-primary decoration-2 underline-offset-4"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/policy"
                className="text-emerald-900 transition hover:text-emerald-950 hover:underline decoration-primary decoration-2 underline-offset-4"
              >
                Policy
              </Link>
              <Link
                href="/terms"
                className="text-emerald-900 transition hover:text-emerald-950 hover:underline decoration-primary decoration-2 underline-offset-4"
              >
                Terms &amp; Conditions
              </Link>
            </nav>
          </div>
          <p className="mt-10 text-center text-sm text-emerald-900/65 md:text-left">
            © {new Date().getFullYear()} FreshLeaf. All rights reserved.
          </p>
        </div>
      </div>

      {/* Watermark: flush to bottom of footer, scales so the word stays on-screen */}
      <div
        className="relative z-0 mt-auto flex w-full justify-center px-3 pb-5 pt-4 md:pb-7 md:pt-6"
        aria-hidden
      >
        <p
          className="pointer-events-none select-none whitespace-nowrap bg-linear-to-b from-emerald-800/30 to-primary/20 bg-clip-text text-center font-bold leading-none tracking-tighter text-transparent text-[24em]"
        >
          FreshLeaf
        </p>
      </div>
    </footer>
  );
}
