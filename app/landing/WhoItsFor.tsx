"use client";

import { Code, Storefront, UsersThree } from "phosphor-react";

const audiences = [
  {
    title: "Developers & freelancers",
    body: "Prospect with context: scores, breakdowns, and a respectful path to outreach.",
    Icon: Code,
  },
  {
    title: "Business owners",
    body: "See how your site stacks up—and what “good” looks like for customers on any device.",
    Icon: Storefront,
  },
  {
    title: "Teams & agencies",
    body: "Prioritize fixes, bundle insights, and grow relationships without spammy tactics.",
    Icon: UsersThree,
  },
] as const;

export default function WhoItsForSection() {
  return (
    <section className="relative mx-auto w-[min(80rem,calc(100%-2rem))] py-20 md:py-28">
      <div
        className="pointer-events-none absolute right-[8%] top-24 hidden h-20 w-20 rounded-full bg-primary/30 md:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-32 left-[5%] hidden h-10 w-10 rounded-full border-2 border-primary/35 md:block"
        aria-hidden
      />

      <div className="relative z-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-900/70">
          Who it’s for
        </p>
        <h2 className="mx-auto mt-3 max-w-3xl text-balance text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
          Built for people who want a{" "}
          <span className="relative inline-block">
            <span className="relative z-10 px-1">better web</span>
            <span
              className="absolute inset-x-0 bottom-0.5 z-0 h-[0.5em] rounded-sm bg-primary"
              aria-hidden
            />
          </span>
          , together
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-gray-600">
          Same product, different goals—whether you’re building, running, or improving sites at scale.
        </p>
      </div>

      <div className="relative z-10 mt-12 grid gap-6 md:grid-cols-3">
        {audiences.map(({ title, body, Icon }) => (
          <div
            key={title}
            className="flex flex-col rounded-2xl border border-gray-200/90 bg-white p-8 text-left shadow-lg shadow-black/6"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-emerald-950">
              <Icon className="h-7 w-7" weight="duotone" aria-hidden />
            </span>
            <h3 className="mt-5 text-lg font-bold text-emerald-950">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
