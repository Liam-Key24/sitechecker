import HeroTrybutton from "@/components/buttons/HeroTrybutton";
import { SeehowItWorksButton } from "@/components/buttons/HeroTrybutton";
import { LandingDotGrid } from "@/components/landing/LandingDotGrid";

function HeroFloatingPanels() {
  return (
    <>
      {/* Freshness trend — echoes results/analytics */}
      <div
        className="pointer-events-none absolute left-[2%] top-[10%] z-1 hidden w-50 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg shadow-black/6 min-[1200px]:block xl:left-[6%]"
        aria-hidden
      >
        <p className="text-xs font-semibold text-emerald-950">Freshness trend</p>
        <div className="relative mt-2 h-18">
          <svg
            className="h-full w-full text-emerald-950"
            viewBox="0 0 180 60"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points="0,45 28,38 56,42 84,22 112,30 140,18 168,25 180,20"
            />
          </svg>
          <div className="absolute right-6 top-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-gray-900 shadow-sm">
            Avg. 68
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[9px] font-medium uppercase tracking-wide text-gray-400">
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
          <span>S</span>
        </div>
      </div>

      {/* Priority share — like score distribution */}
      <div
        className="pointer-events-none absolute bottom-[12%] left-[4%] z-1 hidden w-50 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg shadow-black/6 min-[1200px]:block xl:left-[7%]"
        aria-hidden
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-2xl font-bold tabular-nums text-emerald-950">42%</p>
            <p className="text-xs font-medium text-gray-600">Need attention</p>
          </div>
          <span className="rounded-md bg-emerald-950 px-2 py-1 text-[10px] font-semibold text-white">
            Details
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-snug text-gray-500">
          Share of scanned sites below a healthy freshness score.
        </p>
      </div>

      {/* Scan volume — total results vibe */}
      <div
        className="pointer-events-none absolute right-[2%] top-[12%] z-1 hidden w-50 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg shadow-black/6 min-[1200px]:block xl:right-[6%]"
        aria-hidden
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-gray-900">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <div className="min-w-0 text-left">
            <p className="text-xs font-semibold text-gray-600">Businesses scanned</p>
            <p className="text-xl font-bold tabular-nums text-emerald-950">240+</p>
          </div>
        </div>
      </div>

      {/* Breakdown-style bar — matches ResultCard progress */}
      <div
        className="pointer-events-none absolute bottom-[14%] right-[4%] z-1 hidden w-55 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg shadow-black/6 min-[1200px]:block xl:right-[7%]"
        aria-hidden
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-emerald-950">Web standards</p>
          <span className="rounded-full bg-primary/25 px-2 py-0.5 text-[10px] font-semibold text-gray-800">
            Strong
          </span>
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-950">84</p>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-gray-500">
            <span>Score</span>
            <span>100</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-[84%] rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </>
  );
}

export default function Hero() {
  return (
    <section className="relative isolate m-5 min-h-[85vh] overflow-hidden rounded-2xl bg-linear-to-b from-stone-50 via-white to-primary/20">
      <LandingDotGrid variant="hero" />
      <HeroFloatingPanels />

      <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-900/70">
          Scan · Analyze · Improve
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-emerald-950 sm:text-5xl md:text-6xl lg:text-7xl">
          Help websites turn over a{" "}
          <span className="relative inline-block">
            <span className="relative z-10 px-1.5">fresh leaf</span>
            <span
              className="absolute inset-x-0 bottom-1 z-0 h-[0.55em] rounded-sm bg-primary"
              aria-hidden
            />
          </span>
          .
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-gray-600">
          Scan local businesses, spot outdated or inaccessible websites, and give developers the tools
          to help improve them.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <HeroTrybutton />
          <SeehowItWorksButton />
        </div>
        <p className="mt-6 text-xs text-gray-500">Free to try · Example dashboard previews on wide screens</p>
      </div>
    </section>
  );
}
