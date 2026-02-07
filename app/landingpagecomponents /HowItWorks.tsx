export default function HowItWorksSection() {
  return (
    <section className="mx-auto w-[min(80rem,calc(100%-2rem))] py-20 md:py-24">
      <h2 className="text-3xl font-semibold tracking-tight text-gray-900 text-center">
        How it works
      </h2>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-primary/25 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Scan an area</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            We find businesses and check whether they have a website and rate them.
          </p>
        </div> 

        <div className="rounded-2xl border border-black/10 bg-blue-100 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Analyze quality
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Accessibility, performance, mobile readiness, and modern standards.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-primary/25 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Take action</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Contact the business and offer your services.
          </p>
        </div>
      </div>
    </section>
  );
}

