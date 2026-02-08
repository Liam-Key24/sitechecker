import type { AnalysisBreakdown } from '@/lib/contracts';

export interface Business {
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

export interface ResultsFiltersState {
  scoreMin: string;
  scoreMax: string;
  hasWebsite: string;
  checked: string;
}
