"use client";

import { LoginBtn, SignupBtn } from "@/components/Buttons/NavBtns";
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav
            aria-label="Primary"
            className="bg-frost fixed left-1/2 top-3 z-50 w-[min(92%,72rem)] -translate-x-1/2 overflow-visible px-4 py-3 text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
        >
            <div className="flex items-center justify-between gap-3">
                <Link
                    href="/"
                    className="min-w-0 truncate text-base font-semibold tracking-tight sm:text-lg"
                    onClick={() => setMenuOpen(false)}
                >
                    FreshLeaf
                </Link>

                {/* Desktop */}
                <div className="hidden items-center gap-4 md:flex">
                    <ul className="flex items-center gap-4 text-sm font-medium">
                        <li>
                            <Link href="/app" className="rounded-md px-2 py-1 hover:bg-white/10">
                                App
                            </Link>
                        </li>
                        <li>
                            <Link href="/contact" className="rounded-md px-2 py-1 hover:bg-white/10">
                                Contact
                            </Link>
                        </li>
                    </ul>
                    <div className="flex items-center gap-2">
                        <LoginBtn />
                        <SignupBtn />
                    </div>
                </div>

                {/* Mobile toggle */}
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 p-2 backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:hidden"
                    aria-controls="mobile-nav"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                >
                    <span className="sr-only">Toggle menu</span>
                    {menuOpen ? (
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
                            <path d="M18 6 6 18" />
                            <path d="M6 6l12 12" />
                        </svg>
                    ) : (
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
                            <path d="M4 6h16" />
                            <path d="M4 12h16" />
                            <path d="M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div
                    id="mobile-nav"
                    className="bg-frost absolute left-0 right-0 top-full mt-2 grid gap-3 p-3 md:hidden"
                >
                    <ul className="grid gap-1 text-sm font-medium">
                        <li>
                            <Link
                                href="/app"
                                className="block rounded-lg px-3 py-2 hover:bg-white/10"
                                onClick={() => setMenuOpen(false)}
                            >
                                App
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/contact"
                                className="block rounded-lg px-3 py-2 hover:bg-white/10"
                                onClick={() => setMenuOpen(false)}
                            >
                                Contact
                            </Link>
                        </li>
                    </ul>
                    <div className="grid grid-cols-2 gap-2">
                        <LoginBtn />
                        <SignupBtn />
                    </div>
                </div>
            )}
        </nav>
    );
}