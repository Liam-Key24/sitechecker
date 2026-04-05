"use client";

import { HeartStraight, GlobeHemisphereWest } from "phosphor-react";
import { LandingDotGrid } from "@/components/landing/LandingDotGrid";

const notes = [
  {
    title: "Ethical outreach",
    body: "We encourage respectful, helpful outreach—not spam. The goal is collaboration, not pressure.",
    Icon: HeartStraight,
  },
  {
    title: "A better web for everyone",
    body: "When local sites work well, customers win, businesses win, and the open web stays worth building on.",
    Icon: GlobeHemisphereWest,
  },
] as const;

export default function EthicalNoteSection() {
  return (
    <section className="mx-auto w-[min(80rem,calc(100%-2rem))] py-20 md:py-28">
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-linear-to-br from-white via-stone-50/80 to-primary/15 px-6 py-12 md:px-10 md:py-14">
        <LandingDotGrid />
        <div
          className="pointer-events-none absolute -right-8 top-1/2 hidden h-32 w-32 -translate-y-1/2 rounded-full bg-primary/20 blur-2xl md:block"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-2xl text-center md:max-w-none">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-900/70">
            Principles
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
            Do good work,{" "}
            <span className="relative inline-block">
              <span className="relative z-10 px-1">the right way</span>
              <span
                className="absolute inset-x-0 bottom-0.5 z-0 h-[0.5em] rounded-sm bg-primary"
                aria-hidden
              />
            </span>
          </h2>
        </div>

        <div className="relative z-10 mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
          {notes.map(({ title, body, Icon }) => (
            <div
              key={title}
              className="flex gap-5 rounded-2xl border border-gray-200/90 bg-white/90 p-8 shadow-lg shadow-black/6 backdrop-blur-sm"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/25 text-emerald-950">
                <Icon className="h-7 w-7" weight="duotone" aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-bold text-emerald-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
