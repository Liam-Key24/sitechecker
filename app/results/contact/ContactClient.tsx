'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  EnvelopeSimple,
  Cardholder,
  ChartBar,
  Lightbulb,
  Globe,
  Phone,
  MapPin,
  Buildings,
} from 'phosphor-react';
import Breakdown from '@/components/Breakdown';
import type { AnalysisBreakdown } from '@/lib/contracts';

interface Business {
  id: string;
  place_id: string;
  name: string;
  website: string | null;
  address: string | null;
  phone: string | null;
  categories: string[];
  google_rating: number | null;
  google_review_count: number | null;
  foursquare_rating: number | null;
  final_score: number | null;
  checked: boolean;
  breakdown?: AnalysisBreakdown | null;
}

function buildColdEmail(business: Business): string {
  const name = business.name;
  const score = business.final_score ?? business.breakdown?.web_standards_score ?? null;
  const weaknesses = business.breakdown?.weakness_notes ?? [];
  const firstWeakness = weaknesses[0] || 'there may be some quick wins for your online presence';
  const scoreLine =
    score !== null
      ? `Your current site scores around ${Math.round(score)}% on key web standards.`
      : '';

  return `Subject: Quick idea for ${name}

Hi there,

I came across ${name} and wanted to reach out. ${scoreLine}

In particular, ${firstWeakness}. We help local businesses like yours improve visibility and win more customers online.

Would you be open to a short call this week to explore whether we could help?

Best regards`;
}

/** Ready-to-paste sentences for the email, built from the breakdown. User copies and drops into the draft. */
function getBreakdownSentences(business: Business): string[] {
  const name = business.name;
  const score = business.final_score ?? business.breakdown?.web_standards_score ?? null;
  const weaknesses = business.breakdown?.weakness_notes ?? [];
  const firstWeakness = weaknesses[0];
  const desktop =
    business.breakdown?.pagespeed?.desktopPerformance ?? business.breakdown?.pagespeed_score ?? null;
  const mobile =
    business.breakdown?.pagespeed?.performance ?? business.breakdown?.pagespeed_score ?? null;
  const noWebsite = weaknesses.some((n) => n.toLowerCase().includes('no website'));

  const sentences: string[] = [];

  if (score !== null) {
    sentences.push(
      `Your site scores around ${Math.round(score)}% on key web standards — there's room to improve visibility and conversions.`
    );
  }
  if (firstWeakness) {
    sentences.push(
      `I had a quick look at your online presence and noticed that ${firstWeakness.toLowerCase()} — we could tackle that first.`
    );
    sentences.push(
      `There's a clear quick win around this: ${firstWeakness}. I'd be happy to run a free check and send you a short report.`
    );
  }
  if (desktop !== null || mobile !== null) {
    const parts = [];
    if (desktop !== null) parts.push(`desktop (${Math.round(desktop)}%)`);
    if (mobile !== null) parts.push(`mobile (${Math.round(mobile)}%)`);
    sentences.push(
      `Your current performance is ${parts.join(' and ')}. We help local businesses like ${name} improve speed and win more customers.`
    );
  }
  sentences.push(
    `I can run a free, no-obligation audit and send you a one-page report with the top 3 things to fix.`
  );
  sentences.push(
    `We've helped other local businesses improve their web presence and visibility — I'd be glad to see if we could do the same for ${name}.`
  );
  if (noWebsite) {
    sentences.push(
      `A simple website could make it much easier for customers to find you, see your services, and get in touch.`
    );
  }
  sentences.push(
    `Would you be open to a short call this week to explore whether we could help?`
  );
  sentences.push(
    `If you'd like, I can put together a free checklist of quick wins for your site and send it over.`
  );

  return sentences;
}


export default function ContactClient({
  businessId,
  locationParam,
}: {
  businessId: string;
  locationParam: string | null;
}) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [coldEmailText, setColdEmailText] = useState('');

  const backHref = locationParam ? `/results?location=${encodeURIComponent(locationParam)}` : '/results';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/business/${encodeURIComponent(businessId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Business not found' : 'Failed to load');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setBusiness(data);
          setColdEmailText(buildColdEmail(data));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-800">{error ?? 'Business not found'}</p>
        <Link
          href={backHref}
          className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to results
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to results
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Contact {business.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:grid-cols-[1fr,380px]">
        {/* Left column: Cold email (editable) + Prompts */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-black/5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <EnvelopeSimple className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Cold email</h2>
                <p className="text-sm text-gray-500">Edit below, then copy into your email client</p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(coldEmailText, 'email')}
                aria-label={copiedId === 'email' ? 'Copied' : 'Copy email to clipboard'}
                className="ml-auto flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                {copiedId === 'email' ? (
                  <Check className="h-4 w-4 text-green-600" weight="bold" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden />
                )}
                Copy email
              </button>
            </div>
            <textarea
              value={coldEmailText}
              onChange={(e) => setColdEmailText(e.target.value)}
              className="min-h-70 w-full resize-y rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Cold email draft…"
              spellCheck={true}
            />
          </div>

          {/* Prompts card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-black/5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Lightbulb className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Ready-to-paste sentences</h2>
                <p className="text-sm text-gray-500">Copy any line below into your email to speed up writing</p>
              </div>
            </div>
            <ul className="space-y-3">
              {getBreakdownSentences(business).map((sentence, i) => (
                <li
                  key={i}
                  className="group flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition hover:border-gray-200 hover:bg-gray-50"
                >
                  <p className="flex-1 text-sm text-gray-900">{sentence}</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(sentence, `sentence-${i}`)}
                    aria-label={copiedId === `sentence-${i}` ? 'Copied' : 'Copy sentence to clipboard'}
                    className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-gray-700"
                  >
                    {copiedId === `sentence-${i}` ? (
                      <Check className="h-4 w-4 text-green-600" weight="bold" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column: Contact sheet on top, Breakdown below */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-black/5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Cardholder className="h-5 w-5" weight="duotone" />
              </div>
              <h2 className="font-semibold text-gray-900">Contact sheet</h2>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <Buildings className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" weight="duotone" />
                <span className="font-medium text-gray-900">{business.name}</span>
              </li>
              {business.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" weight="duotone" />
                  <span>{business.address}</span>
                </li>
              )}
              {business.website && (
                <li className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" weight="duotone" />
                  <a
                    href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {business.website}
                  </a>
                </li>
              )}
              {business.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" weight="duotone" />
                  <a href={`tel:${business.phone}`} className="text-primary hover:underline">
                    {business.phone}
                  </a>
                </li>
              )}
              {business.categories.length > 0 && (
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-gray-400">Category</span>
                  <span>{business.categories.slice(0, 3).join(', ')}</span>
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-black/5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <ChartBar className="h-5 w-5" weight="duotone" />
              </div>
              <h2 className="font-semibold text-gray-900">Breakdown</h2>
            </div>
            {business.breakdown ? (
              <Breakdown data={business.breakdown} initialOpen />
            ) : (
              <p className="text-sm text-gray-500">No analysis yet. Run Analyze from the results page.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
