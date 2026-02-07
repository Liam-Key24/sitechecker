export interface WebsiteAnalysis {
  hasHttps: boolean;
  hasTitle: boolean;
  hasMetaDescription: boolean;
  hasH1: boolean;
  hasSchema: boolean;
  hasLocalBusinessSchema: boolean;
  hasViewportMeta?: boolean;
  hasCanonical?: boolean;
  hasLangAttribute?: boolean;
  hasFavicon?: boolean;
  hasOpenGraph?: boolean;
  hasTwitterCard?: boolean;
  hasCTA: boolean;
  hasContactForm: boolean;
  hasReviews: boolean;
  weaknessNotes: string[];
}

export interface PageSpeedResult {
  performance: number;
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
  mobileFriendly: boolean;
  desktopPerformance?: number;
  coreWebVitals?: {
    lcp?: number; // ms
    inp?: number; // ms (field data percentile, if available)
    cls?: number; // unitless
  };
}

export interface AnalysisBreakdown {
  pagespeed_score: number | null;
  foursquare_score: number | null;
  final_score: number | null;
  web_standards_score?: number | null;
  weakness_notes: string[];

  // Optional richer payload for UI.
  pagespeed?: PageSpeedResult | null;
  website?: WebsiteAnalysis;
  foursquare?: {
    fsq_id?: string;
    rating?: number | null;
    popularity?: number | null;
    match_confidence?: number | null;
  };
}

