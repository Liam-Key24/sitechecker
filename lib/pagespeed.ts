const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_API_KEY) {
  console.warn('GOOGLE_API_KEY (or legacy GOOGLE_MAPS_API_KEY) is not set');
}

import type { PageSpeedResult } from '@/lib/contracts';

export async function analyzePageSpeed(url: string): Promise<PageSpeedResult | null> {
  if (!GOOGLE_API_KEY) {
    return null;
  }

  try {
    const fetchStrategy = async (
      strategy: 'mobile' | 'desktop'
    ): Promise<PageSpeedResult | null> => {
      const params = new URLSearchParams({
        url,
        key: GOOGLE_API_KEY,
        strategy,
      });
      params.append('category', 'performance');
      params.append('category', 'accessibility');
      params.append('category', 'best-practices');
      params.append('category', 'seo');

      const response = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`
      );

      if (!response.ok) {
        console.error(`PageSpeed API error (${strategy}): ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      const cats = data.lighthouseResult?.categories;

      const perfScore = cats?.performance?.score;
      const accScore = cats?.accessibility?.score;
      const bpScore = cats?.['best-practices']?.score;
      const seoScore = cats?.seo?.score;

      const audits = data.lighthouseResult?.audits;
      const viewportOk = audits?.['viewport']?.score === 1;
      const responsiveImagesOk = audits?.['uses-responsive-images']?.score === 1;

      const lcp = audits?.['largest-contentful-paint']?.numericValue;
      const cls = audits?.['cumulative-layout-shift']?.numericValue;
      const inp = data.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile;

      return {
        performance: perfScore ? Math.round(perfScore * 100) : 0,
        accessibility: accScore ? Math.round(accScore * 100) : undefined,
        bestPractices: bpScore ? Math.round(bpScore * 100) : undefined,
        seo: seoScore ? Math.round(seoScore * 100) : undefined,
        mobileFriendly: strategy === 'mobile' ? Boolean(viewportOk && responsiveImagesOk) : false,
        coreWebVitals: {
          lcp: lcp ? Math.round(lcp) : undefined,
          cls: typeof cls === 'number' ? Math.round(cls * 100) / 100 : undefined,
          inp: typeof inp === 'number' ? Math.round(inp) : undefined,
        },
      };
    };

    const [mobile, desktop] = await Promise.all([
      fetchStrategy('mobile'),
      fetchStrategy('desktop'),
    ]);

    if (!mobile && !desktop) return null;

    // Prefer mobile as the primary score; attach desktop perf if available.
    const primary = mobile ?? desktop!;
    return {
      ...primary,
      desktopPerformance: desktop?.performance,
    };
  } catch (error) {
    console.error('PageSpeed analysis error:', error);
    return null;
  }
}

