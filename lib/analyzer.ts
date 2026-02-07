import * as cheerio from 'cheerio';

import type { WebsiteAnalysis } from '@/lib/contracts';

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  const analysis: WebsiteAnalysis = {
    hasHttps: url.startsWith('https://'),
    hasTitle: false,
    hasMetaDescription: false,
    hasH1: false,
    hasSchema: false,
    hasLocalBusinessSchema: false,
    hasViewportMeta: false,
    hasCanonical: false,
    hasLangAttribute: false,
    hasFavicon: false,
    hasOpenGraph: false,
    hasTwitterCard: false,
    hasCTA: false,
    hasContactForm: false,
    hasReviews: false,
    weaknessNotes: [],
  };

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      analysis.weaknessNotes.push('Website returned error status');
      return analysis;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Modern-web basics
    analysis.hasViewportMeta = $('meta[name="viewport"]').length > 0;
    if (!analysis.hasViewportMeta) {
      analysis.weaknessNotes.push('Missing viewport meta tag (mobile)');
    }

    analysis.hasCanonical = $('link[rel="canonical"]').length > 0;
    if (!analysis.hasCanonical) {
      analysis.weaknessNotes.push('Missing canonical link');
    }

    const lang = $('html').attr('lang')?.trim();
    analysis.hasLangAttribute = Boolean(lang);
    if (!analysis.hasLangAttribute) {
      analysis.weaknessNotes.push('Missing <html lang> attribute');
    }

    analysis.hasFavicon =
      $('link[rel="icon"]').length > 0 ||
      $('link[rel="shortcut icon"]').length > 0 ||
      $('link[rel="apple-touch-icon"]').length > 0;
    if (!analysis.hasFavicon) {
      analysis.weaknessNotes.push('Missing favicon');
    }

    const hasOgTitle = $('meta[property="og:title"]').attr('content');
    const hasOgDesc = $('meta[property="og:description"]').attr('content');
    analysis.hasOpenGraph = Boolean(hasOgTitle || hasOgDesc);
    if (!analysis.hasOpenGraph) {
      analysis.weaknessNotes.push('Missing Open Graph tags (social sharing)');
    }

    analysis.hasTwitterCard = $('meta[name="twitter:card"]').length > 0;
    if (!analysis.hasTwitterCard) {
      analysis.weaknessNotes.push('Missing Twitter Card meta');
    }

    // Check title
    const title = $('title').text().trim();
    analysis.hasTitle = title.length > 0;
    if (!analysis.hasTitle) {
      analysis.weaknessNotes.push('No page title found');
    }

    // Check meta description
    const metaDesc = $('meta[name="description"]').attr('content');
    analysis.hasMetaDescription = !!metaDesc && metaDesc.length > 0;
    if (!analysis.hasMetaDescription) {
      analysis.weaknessNotes.push('No meta description found');
    }

    // Check H1
    const h1 = $('h1').first().text().trim();
    analysis.hasH1 = h1.length > 0;
    if (!analysis.hasH1) {
      analysis.weaknessNotes.push('No H1 heading found');
    }

    // Check schema markup
    const schemaScripts = $('script[type="application/ld+json"]');
    analysis.hasSchema = schemaScripts.length > 0;

    if (analysis.hasSchema) {
      schemaScripts.each((_, el) => {
        try {
          const schemaText = $(el).html();
          if (schemaText) {
            const schema = JSON.parse(schemaText);
            if (
              schema['@type'] === 'LocalBusiness' ||
              schema['@type'] === 'Restaurant' ||
              schema['@type'] === 'Store' ||
              (Array.isArray(schema['@type']) &&
                schema['@type'].some(
                  (t: string) => t === 'LocalBusiness' || t === 'Restaurant' || t === 'Store'
                ))
            ) {
              analysis.hasLocalBusinessSchema = true;
            }
          }
        } catch {
          // Invalid JSON, skip
        }
      });
    }

    if (!analysis.hasSchema) {
      analysis.weaknessNotes.push('No schema markup found');
    } else if (!analysis.hasLocalBusinessSchema) {
      analysis.weaknessNotes.push('No LocalBusiness schema markup found');
    }

    // Check for CTA elements
    const ctaKeywords = ['contact', 'book', 'call', 'email', 'get quote', 'request', 'schedule'];
    const pageText = $('body').text().toLowerCase();
    const hasCTAText = ctaKeywords.some((keyword) => pageText.includes(keyword));
    analysis.hasCTA = hasCTAText;

    // Check for contact form
    const hasForm = $('form').length > 0;
    const hasMailto = $('a[href^="mailto:"]').length > 0;
    analysis.hasContactForm = hasForm || hasMailto;

    if (!analysis.hasCTA && !analysis.hasContactForm) {
      analysis.weaknessNotes.push('No clear call-to-action or contact form found');
    }

    // Check for reviews/testimonials
    const reviewKeywords = ['review', 'testimonial', 'rating', 'customer', 'client'];
    const hasReviewText = reviewKeywords.some((keyword) => pageText.includes(keyword));
    analysis.hasReviews = hasReviewText;

    if (!analysis.hasReviews) {
      analysis.weaknessNotes.push('No reviews or testimonials found on site');
    }

    // HTTPS check
    if (!analysis.hasHttps) {
      analysis.weaknessNotes.push('Website does not use HTTPS');
    }

    return analysis;
  } catch (error) {
    console.error('Website analysis error:', error);
    analysis.weaknessNotes.push('Failed to analyze website');
    return analysis;
  }
}

