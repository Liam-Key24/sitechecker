"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
        // Small, decaying jitter for a "flicker" effect while counting.
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

function DollarIcon({ className }: { className?: string }) {
  return (
    <div
      className={[
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg font-semibold text-gray-900 shadow-sm",
        className,
      ].join(" ")}
      aria-hidden="true"
    >
      $
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
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEnteredView]);

  // Simple placeholder counters (swap to real data later)
  const noWebsiteTarget = 1284000;
  const outdatedTarget = 762000;

  const noWebsite = useCountUp(noWebsiteTarget, { start: hasEnteredView });
  const outdated = useCountUp(outdatedTarget, { flicker: true, start: hasEnteredView });

  const noWebsiteText = useMemo(() => noWebsite.toLocaleString(), [noWebsite]);
  const outdatedText = useMemo(() => outdated.toLocaleString(), [outdated]);

  return (
    <section
      ref={sectionRef}
      className={[
        "mx-auto w-[min(80rem,calc(100%-2rem))] py-20 md:py-24 transition-all duration-700 ease-out",
        hasEnteredView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      ].join(" ")}
    >
      <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
        Why it matters
      </h2>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-8">
          <div className="text-4xl font-semibold tracking-tight text-gray-900">
            {noWebsiteText}
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Businesses found with <span className="font-medium">no website</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-8">
          <div className="text-4xl font-semibold tracking-tight text-gray-900">
            {outdatedText}
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Websites that <span className="font-medium">don’t meet modern web standards</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Potential gain
              </h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Real opportunities to help businesses turn over a new leaf.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <DollarIcon />
              <DollarIcon className="opacity-90" />
              <DollarIcon className="opacity-80" />
            </div>
          </div>
        </div>
      </div>

      
      
    </section>
  );
}

