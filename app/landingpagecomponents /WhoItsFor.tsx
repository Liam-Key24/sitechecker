export default function WhoItsForSection() {
  return (
    <section className="mx-auto w-[min(80rem,calc(100%-2rem))] py-24 md:py-32">
      <h2 className="text-3xl font-semibold tracking-tight text-gray-900 text-center">
        Built for Developers and Business Owners
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:grid-rows-2">
        {[
          "Developers who want to help businesses",
          "Business owners who want to improve their website",
          "Anyone who wants a more modern, usable internet. Help us make the web a better place. Drive more people to your business. .",
        ].map((label, i) => (
          <div
            key={label}
            className={`rounded-2xl border border-black/10 bg-white p-8 text-lg leading-relaxed text-gray-700 text-center min-h-50 flex flex-col justify-center ${
              i === 2 ? "md:col-start-2 md:row-start-1 md:row-span-2 md:min-h-105" : ""
            }`}
          >
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

