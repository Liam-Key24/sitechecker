"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CurrencyDollar } from "phosphor-react";

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
        "inline-flex h-10 w-10 items-center justify-center  text-lg font-semibold text-primary/80",
        className,
      ].join(" ")}
      aria-hidden="true"
    >
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
  const potentialProfitTarget = 1200; // display as £1.2B (from no-website segment)

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
        "mx-auto w-[min(80rem,calc(100%-2rem))] py-20 md:py-24 transition-all duration-700 ease-out",
        hasEnteredView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      ].join(" ")}
    >

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-8 flex flex-col justify-center items-center min-h-96  shadow-lg shadow-black/10">

          <div className="text-7xl font-semibold tracking-tight text-primary">
            
            {noWebsiteText}
          </div>
          <p className="mt-2 text-xl leading-6 text-gray-600 text-center">
            Businesses found with <span className="font-bold">no website</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-8 flex flex-col justify-center items-center min-h-96  shadow-lg shadow-black/10">
          <div className="text-7xl font-semibold tracking-tight text-primary">
            {outdatedText}
          </div>
          <p className="mt-2 text-xl leading-6 text-gray-600 text-center">
            Websites that <span className="font-bold"> don’t meet </span> modern web standards.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-8 flex flex-col justify-center items-center min-h-96  shadow-lg shadow-black/10">
          <div className="text-7xl font-semibold tracking-tight text-primary">
            {potentialProfitText}
          </div>
          <p className="mt-2 text-xl leading-6 text-gray-600 text-center">
            Potential profit for both businesses and developers.
          </p>
        </div>
      </div>



    </section>
  );
}

