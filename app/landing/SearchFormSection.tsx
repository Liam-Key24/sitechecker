import SearchForm from "@/components/SearchForm";
import HowItWorksSection from "@/app/landing/HowItWorks";
import { LandingDotGrid } from "@/components/landing/LandingDotGrid";

export default function SearchFormSection() {
  return (
    <section className="mx-auto w-[min(112rem,calc(100%-1.5rem))] px-3 py-16 sm:px-5 md:py-24">
      <div className="relative isolate m-3 max-w-none overflow-hidden rounded-2xl border border-stone-200/90 bg-linear-to-b from-stone-50 via-white to-primary/20 max-md:mx-0 sm:m-5">
        <LandingDotGrid />
        <div className="relative z-10 px-5 py-12 sm:px-8 md:px-14 md:py-16 lg:px-16 lg:py-10">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:items-center lg:gap-12 xl:gap-16">
            <div className="flex w-full min-w-0 flex-col items-center justify-center px-2 text-center lg:px-4 lg:pr-8">
              <h2 className="mx-auto w-full max-w-xl text-balance text-center text-4xl font-bold tracking-tight text-emerald-950 sm:text-5xl md:text-6xl lg:text-6xl xl:max-w-2xl xl:text-7xl">
                Turn a new leaf on a{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 px-1.5">website</span>
                  <span
                    className="absolute inset-x-0 bottom-0.5 z-0 h-[0.5em] rounded-sm bg-primary sm:bottom-1"
                    aria-hidden
                  />
                </span>
              </h2>
            </div>
            <div className="w-full min-w-0">
              <div className="flex h-[32rem] flex-col rounded-2xl border border-gray-200/90 bg-white p-6 shadow-lg shadow-black/6 md:h-[34rem] md:p-8">
                <SearchForm />
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-16 border-t border-stone-200/80 pt-14 md:mt-20 md:pt-16">
            <HowItWorksSection embedded />
          </div>
        </div>
      </div>
    </section>
  );
}
