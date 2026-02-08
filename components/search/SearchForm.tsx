"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CaretDown } from "phosphor-react";
import { LocationField } from "./LocationField";

type SearchFormData = {
  location: string;
  category: string;
  keywords: string;
  limit: string;
};

const CATEGORY_OPTIONS = [
  { value: "", label: "All types" },
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail" },
  { value: "professional", label: "Professional services" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
];

const LIMIT_OPTIONS = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

export default function SearchForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
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
    <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-black/5 transition-[height] duration-300 sm:p-8">
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-col gap-5"
      >
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Find businesses
        </h2>

        <div className="space-y-4">
          <LocationField
            value={formData.location}
            onChange={(location) =>
              setFormData((prev) => ({ ...prev, location }))
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Type
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, category: e.target.value }))
                }
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="limit"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Results
              </label>
              <select
                id="limit"
                value={formData.limit}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, limit: e.target.value }))
                }
                className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {LIMIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Animated more options: increases card height, duration-300 */}
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: moreOpen ? "1fr" : "0fr" }}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-4 pt-1">
              <label
                htmlFor="keywords"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Keywords (optional)
              </label>
              <input
                type="text"
                id="keywords"
                value={formData.keywords}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, keywords: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., organic, vegan, 24/7"
              />
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={loading}
            className="order-2 w-full cursor-pointer rounded-xl bg-primary px-6 py-3.5 font-medium text-gray-900 transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:order-1 sm:w-auto"
          >
            {loading ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            className="order-1 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 sm:order-2"
            aria-expanded={moreOpen}
          >
            More search options
            <CaretDown
              className={`h-4 w-4 transition duration-300 ${moreOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </form>
    </div>
  );
}
