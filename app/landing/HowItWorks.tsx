export default function HowItWorksSection() {
  return (
    <section className="mx-auto w-[min(80rem,calc(100%-2rem))] py-20 md:py-24">
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex min-w-70 flex-col items-center justify-center rounded-2xl border border-black/10 bg-primary/25 p-8 text-center aspect-square md:min-w-[300px]">
          <h3 className="text-lg font-semibold text-gray-900">Scan an area</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            We find businesses and check whether they have a website and rate them.
          </p>
        </div>
        <div className="flex min-w-70 flex-col items-center justify-center rounded-2xl border border-black/10 bg-primary/25 p-8 text-center aspect-square md:min-w-[300px]">
          <h3 className="text-lg font-semibold text-gray-900">Analyze quality</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Accessibility, performance, mobile readiness, and modern standards.
          </p>
        </div>
        <div className="flex min-w-70 flex-col items-center justify-center rounded-2xl border border-black/10 bg-primary/25 p-8 text-center aspect-square md:min-w-[300px]">
          <h3 className="text-lg font-semibold text-gray-900">Take action</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Contact the business and offer your services. <br /> Help them turn over a <span className="font-bold italic">fresh leaf</span>.
          </p>
        </div>
      </div>
    </section>
  );
}

