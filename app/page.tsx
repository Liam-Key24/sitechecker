import SearchForm from '@/components/SearchForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Website Opportunity Scanner
            </h1>
            <p className="text-lg text-gray-600">
              Find local businesses with no website or low-value websites for outreach opportunities
            </p>
          </div>
          <SearchForm />
        </div>
      </div>
    </div>
  );
}
