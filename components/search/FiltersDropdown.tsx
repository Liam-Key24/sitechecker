type Props = {
  category: string;
  keywords: string;
  limit: string;
  onChangeCategory: (value: string) => void;
  onChangeKeywords: (value: string) => void;
  onChangeLimit: (value: string) => void;
};

export function FiltersDropdown({
  category,
  keywords,
  limit,
  onChangeCategory,
  onChangeKeywords,
  onChangeLimit,
}: Props) {
  return (
    <details className="relative shrink-0">
      <summary className="list-none cursor-pointer select-none rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
        Filters
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <div className="space-y-3">
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
              Industry/Category (Optional)
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => onChangeCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., restaurant, dentist, plumber"
            />
          </div>

          <div>
            <label htmlFor="keywords" className="mb-1 block text-sm font-medium text-gray-700">
              Keywords (Optional)
            </label>
            <input
              type="text"
              id="keywords"
              value={keywords}
              onChange={(e) => onChangeKeywords(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., organic, vegan, 24/7"
            />
          </div>

          <div>
            <label htmlFor="limit" className="mb-1 block text-sm font-medium text-gray-700">
              Number of Results
            </label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => onChangeLimit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>
    </details>
  );
}

