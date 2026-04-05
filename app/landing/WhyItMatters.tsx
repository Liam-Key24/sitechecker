"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check } from "phosphor-react";
import { LandingDotGrid } from "@/components/landing/LandingDotGrid";

function useCountUp(
  target: number,
  options?: { durationMs?: number; flicker?: boolean; start?: boolean }
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const startCounting = options?.start ?? true;
    if (!startCounting) {
      setValue(0);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const durationMs = options?.durationMs ?? 900;
    const flicker = options?.flicker ?? false;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const base = Math.round(target * eased);

      if (!flicker || t >= 1) {
        setValue(base);
      } else {
        const maxJitter = Math.max(8, Math.round(target * 0.03));
        const jitter = Math.round((Math.random() - 0.5) * 2 * maxJitter * (1 - t));
        const next = Math.min(target, Math.max(0, base + jitter));
        setValue(next);
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [options?.durationMs, options?.flicker, options?.start, target]);

  return value;
}

function SpringDecoration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="140"
      viewBox="0 0 32 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M16 2 C24 12 8 22 16 32 C24 42 8 52 16 62 C24 72 8 82 16 92 C24 102 8 112 16 122 C20 128 12 134 16 138"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FloatingLimeOrbs() {
  return (
    <>
      <div
        className="pointer-events-none absolute -right-4 top-[8%] h-24 w-24 rounded-full bg-primary/35 blur-[1px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[12%] top-[28%] h-14 w-14 rounded-full bg-primary/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[4%] top-[48%] h-8 w-8 rounded-full bg-primary/30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-2 bottom-[18%] h-20 w-20 rounded-full border-2 border-primary/40 bg-primary/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[22%] bottom-[8%] h-5 w-5 rounded-full bg-primary/45"
        aria-hidden
      />
    </>
  );
}

function WeeklyActivityCard() {
  return (
    <div
      className="pointer-events-none relative z-10 w-[min(100%,280px)] rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xl shadow-black/8"
      aria-hidden
    >
      <p className="text-sm font-bold text-emerald-950">Scans &amp; signals</p>
      <div className="relative mt-3 flex gap-2">
        <div className="flex w-5 shrink-0 flex-col justify-between py-1 text-right text-[10px] font-medium tabular-nums text-gray-400">
          <span>4</span>
          <span>3</span>
          <span>2</span>
          <span>1</span>
          <span>0</span>
        </div>
        <div className="relative h-30 min-w-0 flex-1">
          <div
            className="absolute inset-0 rounded-lg bg-[linear-gradient(to_bottom,var(--color-gray-200)_1px,transparent_1px)] bg-size-[100%_30px] bg-top"
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-lg bg-[linear-gradient(to_right,var(--color-gray-100)_1px,transparent_1px)] bg-size-[14.28%_100%] opacity-60"
            aria-hidden
          />
          <svg
            className="relative z-1 h-full w-full text-emerald-950/85"
            viewBox="0 0 200 120"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points="4,95 32,88 60,72 88,40 116,52 144,28 172,38 196,32"
            />
          </svg>
          {/* Peak marker + tooltip */}
          <div className="absolute left-[42%] top-[26%] z-2 flex -translate-x-1/2 flex-col items-center">
            <div className="mb-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-gray-900 shadow-sm">
              2.8k
            </div>
            <div className="h-2 w-2 rounded-full border-2 border-white bg-emerald-950 shadow ring-1 ring-gray-300" />
          </div>
        </div>
      </div>
      <div className="mt-1 flex justify-between pl-7 pr-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
        <span>S</span>
      </div>
      <p className="mt-2 text-[10px] text-gray-400">Index · thousands of checks</p>
    </div>
  );
}

function WhyIllustrationCluster() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="relative min-h-[min(420px,50vh)] overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-100/80 p-6 md:min-h-110 md:p-10">
        <LandingDotGrid />
        <SpringDecoration className="absolute left-6 top-1/2 hidden -translate-y-1/2 text-emerald-950/80 md:left-10 md:block" />
        <FloatingLimeOrbs />
        <div className="relative flex h-full min-h-90 items-end justify-end md:min-h-95 md:items-center md:justify-end md:pr-4 md:pt-0">
          <WeeklyActivityCard />
        </div>
      </div>
    </div>
  );
}

export default function WhyItMattersSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (hasEnteredView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEnteredView]);

  const noWebsiteTarget = 1284000;
  const outdatedTarget = 762000;
  const potentialProfitTarget = 1200;

  const noWebsite = useCountUp(noWebsiteTarget, { start: hasEnteredView });
  const outdated = useCountUp(outdatedTarget, { flicker: true, start: hasEnteredView });
  const potentialProfit = useCountUp(potentialProfitTarget, { start: hasEnteredView });

  const noWebsiteText = useMemo(() => noWebsite.toLocaleString(), [noWebsite]);
  const outdatedText = useMemo(() => outdated.toLocaleString(), [outdated]);
  const potentialProfitText = useMemo(
    () => `£${(potentialProfit / 1000).toFixed(1)}B`,
    [potentialProfit]
  );

  return (
    <section
      ref={sectionRef}
      className={[
        "mx-auto w-[min(80rem,calc(100%-2rem))] py-20 md:py-28 transition-all duration-700 ease-out",
        hasEnteredView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      ].join(" ")}
    >
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl lg:max-w-none">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl md:text-[2.75rem] md:leading-tight">
            Outdated sites hurt{" "}
            <span className="relative inline-block">
              <span className="relative z-10 px-1">businesses</span>
              <span
                className="absolute inset-x-0 bottom-0.5 z-0 h-[0.5em] rounded-sm bg-primary"
                aria-hidden
              />
            </span>{" "}
            and the people who rely on them.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">
            Fresh Leaf surfaces where the web is falling behind—so teams can prioritize fixes that
            actually matter.
          </p>

          <ul className="mt-10 space-y-6">
            <li className="flex gap-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-emerald-950">
                <Check className="h-5 w-5" weight="bold" aria-hidden />
              </span>
              <div>
                <p className="text-2xl font-bold tabular-nums tracking-tight text-emerald-950 md:text-3xl">
                  {noWebsiteText}
                </p>
                <p className="mt-1 text-gray-600">
                  Businesses found with <span className="font-semibold text-gray-800">no website</span>.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-emerald-950">
                <Check className="h-5 w-5" weight="bold" aria-hidden />
              </span>
              <div>
                <p className="text-2xl font-bold tabular-nums tracking-tight text-emerald-950 md:text-3xl">
                  {outdatedText}
                </p>
                <p className="mt-1 text-gray-600">
                  Sites that <span className="font-semibold text-gray-800">don’t meet</span> modern web
                  standards.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-emerald-950">
                <Check className="h-5 w-5" weight="bold" aria-hidden />
              </span>
              <div>
                <p className="text-2xl font-bold tabular-nums tracking-tight text-emerald-950 md:text-3xl">
                  {potentialProfitText}
                </p>
                <p className="mt-1 text-gray-600">
                  Room for <span className="font-semibold text-gray-800">real upside</span> for
                  businesses and builders.
                </p>
              </div>
            </li>
          </ul>

          <div className="mt-10">
            <Link
              href="/search"
              className="group inline-flex items-center gap-3 rounded-full bg-emerald-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-900"
            >
              Get started
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition group-hover:bg-white/25">
                <ArrowRight className="h-4 w-4" weight="bold" aria-hidden />
              </span>
            </Link>
          </div>
        </div>

        <WhyIllustrationCluster />
      </div>
    </section>
  );
}
