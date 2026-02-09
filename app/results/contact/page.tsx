import ContactClient from './ContactClient';

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string; location?: string }>;
}) {
  const params = await searchParams;
  const businessId = params.businessId ?? '';
  const locationParam = params.location ?? null;

  if (!businessId) {
    return (
      <div className="min-h-screen bg-gray-50 mt-30">
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-amber-800">
              No business selected. Go back to results and click Contact on a card.
            </p>
            <a href="/results" className="mt-4 inline-block text-primary hover:underline">
              Back to results
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-30">
      <div className="container mx-auto px-4 py-8">
        <ContactClient businessId={businessId} locationParam={locationParam} />
      </div>
    </div>
  );
}
