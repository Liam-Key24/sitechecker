const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY;

if (!PAGESPEED_API_KEY) {
  console.warn('PAGESPEED_API_KEY is not set');
}

export interface PageSpeedResult {
  performance: number;
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
  mobileFriendly: boolean;
  coreWebVitals?: {
    lcp?: number;
    inp?: number;
    cls?: number;
  };
}

export async function analyzePageSpeed(url: string): Promise<PageSpeedResult | null> {
  if (!PAGESPEED_API_KEY) {
    return null;
  }

  try {
    // Analyze mobile version
    const mobileParams = new URLSearchParams({
      url,
      key: PAGESPEED_API_KEY,
      strategy: 'mobile',
      category: 'performance',
    });

    const mobileResponse = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${mobileParams.toString()}`
    );

    if (!mobileResponse.ok) {
      console.error(`PageSpeed API error: ${mobileResponse.statusText}`);
      return null;
    }

    const mobileData = await mobileResponse.json();

    const performance = mobileData.lighthouseResult?.categories?.performance?.score
      ? Math.round(mobileData.lighthouseResult.categories.performance.score * 100)
      : 0;

    const mobileFriendly =
      mobileData.lighthouseResult?.audits?.['viewport']?.score === 1 &&
      mobileData.lighthouseResult?.audits?.['uses-responsive-images']?.score === 1;

    const lcp = mobileData.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue;
    const cls = mobileData.lighthouseResult?.audits?.['cumulative-layout-shift']?.numericValue;
    const inp = mobileData.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile;

    return {
      performance,
      mobileFriendly: mobileFriendly || false,
      coreWebVitals: {
        lcp: lcp ? Math.round(lcp) : undefined,
        cls: cls ? Math.round(cls * 100) / 100 : undefined,
        inp: inp ? Math.round(inp) : undefined,
      },
    };
  } catch (error) {
    console.error('PageSpeed analysis error:', error);
    return null;
  }
}

