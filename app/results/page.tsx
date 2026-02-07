import { Suspense } from 'react';
import ResultsClient from '@/app/results/results-client';

function ResultsFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading results...</p>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsFallback />}>
      <ResultsClient />
    </Suspense>
  );
}

