"use client";

import { useEffect, useRef, useState } from "react";

const sentences = [
  "Millions of business websites are outdated or inaccessible.",
  "Small businesses lose customers without knowing why.",
  "Developers can help — if they know where to look.",
] as const;

export default function MissionSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

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

  useEffect(() => {
    if (!hasEnteredView) return;

    setVisibleCount(0);
    const interval = window.setInterval(() => {
      setVisibleCount((c) => {
        const next = c + 1;
        if (next >= sentences.length) window.clearInterval(interval);
        return Math.min(sentences.length, next);
      });
    }, 520);

    return () => window.clearInterval(interval);
  }, [hasEnteredView]);

  return (
    <section
      ref={sectionRef}
      className="mx-auto w-[min(80rem,calc(100%-2rem))] py-20 md:py-24"
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xl leading-relaxed text-gray-900 md:text-2xl">
          {sentences.map((s, idx) => {
            const isVisible = idx < visibleCount;
            return (
              <span
                key={s}
                className={[
                  "inline-block transition-all duration-700 ease-out",
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0",
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
    </section>
  );
}
