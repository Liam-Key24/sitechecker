"use client";

import { useEffect, useRef, useState } from "react";
import { LandingDotGrid } from "@/components/landing/LandingDotGrid";

const sentences = [
  "Millions of business websites are outdated or inaccessible.",
  "Small businesses lose customers without knowing why.",
  "Developers can help — if they know where to look.",
] as const;

export default function MissionSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isInView) return;

    setVisibleCount(0);
    intervalRef.current = window.setInterval(() => {
      setVisibleCount((c) => {
        const next = c + 1;
        if (next >= sentences.length && intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return Math.min(sentences.length, next);
      });
    }, 520);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isInView]);

  return (
    <section
      ref={sectionRef}
      className="mx-auto w-[min(80rem,calc(100%-2rem))] py-20 md:py-28"
    >
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-100/70 px-6 py-14 md:px-12 md:py-20">
        <LandingDotGrid />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-2 pb-14 pt-10 text-center md:px-4 md:pb-16 md:pt-12">
          {/* Soft glow + ring behind the copy (no placeholder bars) */}
          <div
            className="pointer-events-none absolute left-1/2 top-8 h-44 w-[min(100%,36rem)] -translate-x-1/2 md:top-10 md:h-52"
            aria-hidden
          >
            <div className="absolute inset-0 rounded-[100%] bg-primary/35 blur-3xl" />
            <div className="absolute right-[8%] top-2 h-11 w-11 rounded-full border-2 border-primary/50 md:right-[12%]" />
            <div className="absolute bottom-4 left-[14%] h-20 w-20 rounded-full bg-emerald-400/20 blur-2xl" />
          </div>

          <p className="relative z-10 text-sm font-semibold uppercase tracking-widest text-emerald-900/70">
            Our mission
          </p>
          <p className="relative z-10 mt-6 text-2xl font-medium leading-snug text-emerald-950 sm:text-3xl sm:leading-snug md:leading-relaxed lg:text-4xl lg:leading-relaxed">
            {sentences.map((s, idx) => {
              const isVisible = idx < visibleCount;
              return (
                <span
                  key={s}
                  className={[
                    "inline transition-all duration-700 ease-out",
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                  ].join(" ")}
                  style={{ transitionDelay: `${idx * 60}ms` }}
                >
                  {s}
                  {idx < sentences.length - 1 ? " " : ""}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
