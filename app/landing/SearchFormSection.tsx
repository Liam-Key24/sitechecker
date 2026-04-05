import SearchForm from "@/components/SearchForm";
import { LandingDotGrid } from "@/components/landing/LandingDotGrid";

export default function SearchFormSection() {
  return (
    <section className="mx-auto flex min-h-[50vh] w-[min(80rem,calc(100%-2rem))] flex-col justify-center gap-10 px-4 py-16 md:py-24">
      <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-stone-200/90 bg-linear-to-b from-stone-50/90 via-white to-primary/10 px-6 py-12 md:px-10 md:py-14">
        <LandingDotGrid />
        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-900/70">
              Search
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl md:text-5xl">
              Turn a new leaf on a{" "}
              <span className="relative inline-block">
                <span className="relative z-10 px-1">website</span>
                <span
                  className="absolute inset-x-0 bottom-0.5 z-0 h-[0.5em] rounded-sm bg-primary"
                  aria-hidden
                />
              </span>
            </h2>
          </div>
          <div className="w-full max-w-xl rounded-2xl border border-gray-200/90 bg-white p-6 shadow-lg shadow-black/6 md:p-8">
            <SearchForm />
          </div>
        </div>
      </div>
    </section>
  );
}
