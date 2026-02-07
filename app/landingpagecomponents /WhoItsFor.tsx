export default function WhoItsForSection() {
  return (
    <section className="mx-auto w-[min(80rem,calc(100%-2rem))] py-20 md:py-24">
      <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
        Who it’s for
      </h2>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          "Freelance developers",
          "Business owners",
          "Anyone who wants a more modern, usable internet",
        ].map((label) => (
          <div
            key={label}
            className="rounded-2xl border border-black/10 bg-white p-8 text-sm leading-relaxed text-gray-700"
          >
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

