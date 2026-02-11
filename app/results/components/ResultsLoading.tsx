export default function ResultsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
        <p className="text-gray-600">Searching businesses...</p>
      </div>
    </div>
  );
}
