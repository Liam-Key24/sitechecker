export default function EthicalNoteSection() {
  return (
    <section className="mx-auto grid w-[min(80rem,calc(100%-2rem))] grid-cols-1 gap-6 py-20 md:grid-cols-2 md:gap-8 md:py-24">
      <div className="rounded-2xl border border-black/10 bg-white p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          Ethical outreach
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          We encourage respectful, helpful outreach — not spam. The goal is
          collaboration, not exploitation.
        </p>
      </div>
      <div className="rounded-2xl border border-black/10 bg-white p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          Make the web a better place
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          The goal is to make the web a better place for everyone.
        </p>
      </div>
    </section>
  );
}

