"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CaretDown } from "phosphor-react";
import { LocationField } from "./LocationField";
import { clampSearchLimitFromString, MAX_KEYWORDS_LENGTH } from "@/lib/searchLimits";

type Tab = "local" | "url";

const categoryOptions = [
  { value: "", label: "All types" },
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail" },
  { value: "professional", label: "Professional services" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
] as const;

const limitOptions = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
] as const;

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-emerald-950/90">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-emerald-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {options.map((opt) => (
            <option key={opt.value || id + "-all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <CaretDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
          aria-hidden
        />
      </div>
    </div>
  );
}

export default function SearchForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("local");
  const [loading, setLoading] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [limit, setLimit] = useState("20");
  const [urlNotice, setUrlNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "url") {
      setUrlNotice("URL search is not available yet. Use Local search to find businesses.");
      return;
    }
    setUrlNotice(null);

    setLoading(true);
    try {
      const params = new URLSearchParams({
        location,
        ...(category && { category }),
        ...(keywords && { keywords }),
        limit: String(clampSearchLimitFromString(limit, 20)),
      });
      router.push(`/results?${params.toString()}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col gap-5">
      <h2 className="shrink-0 text-2xl font-bold tracking-tight text-emerald-950">Find businesses</h2>

      <div
        role="tablist"
        aria-label="Search mode"
        className="grid shrink-0 grid-cols-2 gap-1 rounded-full border border-stone-200/90 bg-stone-100/80 p-1"
      >
        {(
          [
            ["local", "Local search"],
            ["url", "URL"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              setMoreOpen(false);
              setUrlNotice(null);
            }}
            className={`rounded-full px-3 py-2.5 text-center text-sm font-semibold transition ${
              tab === id
                ? "bg-primary text-emerald-950 shadow-sm"
                : "text-gray-600 hover:text-emerald-950"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto flex justify-center items-center w-full">
        {tab === "local" ? (
          <div className="flex flex-col gap-5 pb-1">
            <LocationField value={location} onChange={setLocation} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                id="category"
                label="Type"
                value={category}
                onChange={setCategory}
                options={categoryOptions}
              />
              <SelectField
                id="limit"
                label="Results"
                value={limit}
                onChange={setLimit}
                options={limitOptions}
              />
            </div>

            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: moreOpen ? "1fr" : "0fr" }}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="space-y-4 pt-1">
                  <label htmlFor="keywords" className="mb-1.5 block text-sm font-medium text-emerald-950/90">
                    Keywords (optional)
                  </label>
                  <input
                    id="keywords"
                    type="text"
                    maxLength={MAX_KEYWORDS_LENGTH}
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., organic, vegan, 24/7"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-emerald-950 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="site-url" className="mb-1.5 block text-sm font-medium text-emerald-950/90">
              Website URL
            </label>
            <input
              id="site-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-emerald-950 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}
      </div>

      {urlNotice && (
        <p className="shrink-0 text-center text-sm text-amber-800" role="status">
          {urlNotice}
        </p>
      )}

      <div className="relative flex min-h-12 shrink-0 flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-0">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-primary px-10 py-3 font-semibold text-emerald-950 shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
        {tab === "local" && (
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            className="flex cursor-pointer items-center gap-1 self-end text-sm font-medium text-emerald-950/80 hover:text-emerald-950 sm:absolute sm:end-0 sm:top-1/2 sm:-translate-y-1/2 sm:self-auto"
          >
            More search options
            <CaretDown
              className={`h-4 w-4 shrink-0 transition duration-300 ${moreOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        )}
      </div>
    </form>
  );
}
