"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiltersDropdown } from "./FiltersDropdown";
import { LocationField } from "./LocationField";

type SearchFormData = {
  location: string;
  category: string;
  keywords: string;
  limit: string;
};

export default function SearchForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SearchFormData>({
    location: "",
    category: "",
    keywords: "",
    limit: "20",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const params = new URLSearchParams({
        location: formData.location,
        ...(formData.category && { category: formData.category }),
        ...(formData.keywords && { keywords: formData.keywords }),
        limit: formData.limit,
      });

      router.push(`/results?${params.toString()}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <LocationField
          value={formData.location}
          onChange={(location) => setFormData((prev) => ({ ...prev, location }))}
        />

        <FiltersDropdown
          category={formData.category}
          keywords={formData.keywords}
          limit={formData.limit}
          onChangeCategory={(category) => setFormData((p) => ({ ...p, category }))}
          onChangeKeywords={(keywords) => setFormData((p) => ({ ...p, keywords }))}
          onChangeLimit={(limit) => setFormData((p) => ({ ...p, limit }))}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer rounded-lg bg-primary px-6 py-3.5 font-medium text-gray-900 transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}

