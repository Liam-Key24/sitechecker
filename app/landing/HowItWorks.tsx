"use client";

import { MagnifyingGlass, ChartLineUp, PaperPlaneRight } from "phosphor-react";
import { LandingDotGrid } from "@/components/landing/LandingDotGrid";

const steps = [
  {
    title: "Scan an area",
    body: "Find businesses in a place you care about and see who has a site—and who doesn’t.",
    Icon: MagnifyingGlass,
  },
  {
    title: "Analyze quality",
    body: "Accessibility, performance, mobile readiness, and modern standards in one view.",
    Icon: ChartLineUp,
  },
  {
    title: "Take action",
    body: (
      <>
        Reach out respectfully and offer help. That’s how we turn over a{" "}
        <span className="font-semibold text-emerald-950">fresh leaf</span>.
      </>
    ),
    Icon: PaperPlaneRight,
  },
] as const;

type HowItWorksSectionProps = {
  /** Nested inside another section; drops outer width/padding shell */
  embedded?: boolean;
};

export default function HowItWorksSection({ embedded = false }: HowItWorksSectionProps) {
  const inner = (
    <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-linear-to-b from-stone-50/90 via-white to-primary/10 px-6 py-14 md:px-12 md:py-16">
        <LandingDotGrid />
        <div className="relative z-10">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-emerald-900/70">
            How it works
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-balance text-center text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">
            From <span className="relative inline-block px-1">
              <span className="relative z-10">first search</span>
              <span
                className="absolute inset-x-0 bottom-0.5 z-0 h-[0.45em] rounded-sm bg-primary"
                aria-hidden
              />
            </span>{" "}
            to meaningful outreach
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-gray-600">
            Three steps. Same calm, data-forward feel as the rest of your dashboard.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map(({ title, body, Icon }, i) => (
              <div
                key={title}
                className="relative flex flex-col rounded-2xl border border-gray-200/90 bg-white p-8 shadow-lg shadow-black/6"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-emerald-950">
                    <Icon className="h-6 w-6" weight="duotone" aria-hidden />
                  </span>
                  <span className="text-4xl font-bold tabular-nums leading-none text-stone-200">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-emerald-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
  );

  if (embedded) {
    return <div className="relative w-full">{inner}</div>;
  }

  return (
    <section className="relative mx-auto w-[min(80rem,calc(100%-2rem))] py-20 md:py-28">
      {inner}
    </section>
  );
}
