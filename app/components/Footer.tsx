import Link from "next/link";

const navLinks = [
  { label: "App", href: "#" },
  { label: "Contact me", href: "#" },
] as const;

export default function Footer() {
  return (
    <footer className=" inset-x-0 bottom-0 z-40 border-t border-white/10 bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-white/80 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/policy"
            className="text-white/80 transition hover:text-white"
          >
            Policy
          </Link>
          <Link
            href="/terms"
            className="text-white/80 transition hover:text-white"
          >
            Terms & Conditions
          </Link>
        </div>
        <p className="mt-4 text-center text-sm text-white/60">
          © 2026 FreshLeaf. All rights reserved.
        </p>
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          FreshLeaf
        </h1>
      </div>
    </footer>
  );
}
