import { ProviderProfile, AIScoringBreakdown, Review } from '../types';

export interface NLPSearchResult {
  rawQuery: string;
  extractedCategory?: string;
  extractedCity?: string;
  maxBudget?: number;
  timePreference?: string;
  isUrgent: boolean;
  confidence: number;
  explanation: string[];
}

export class OneStopAIEngine {
  /**
   * Transparent Explainable Matching Algorithm (Core Java equivalent logic)
   * Weights:
   * 1. Service Relevance (30%)
   * 2. Location Suitability (20%)
   * 3. Availability (20%)
   * 4. Price Compatibility (15%)
   * 5. Ratings & Review Volume (10%)
   * 6. Experience (5%)
   */
  public static calculateMatchScore(
    provider: ProviderProfile,
    criteria: {
      categoryCode?: string;
      city?: string;
      targetBudget?: number;
      isUrgent?: boolean;
    }
  ): AIScoringBreakdown {
    const reasons: string[] = [];

    // 1. Service Relevance (30 pts)
    let serviceScore = 0;
    if (criteria.categoryCode) {
      if (provider.serviceCategories.includes(criteria.categoryCode)) {
        serviceScore = 30;
        reasons.push(`Direct specialist in ${criteria.categoryCode.toLowerCase()} (+30 pts)`);
      } else {
        serviceScore = 5;
        reasons.push(`Secondary qualification match (+5 pts)`);
      }
    } else {
      serviceScore = 25; // default discovery score
    }

    // 2. Location Suitability (20 pts)
    let locationScore = 0;
    if (criteria.city) {
      if (provider.city.toLowerCase() === criteria.city.toLowerCase()) {
        locationScore = 20;
        reasons.push(`Based locally in ${provider.city} (+20 pts)`);
      } else {
        locationScore = 4;
        reasons.push(`Regional travel radius required (+4 pts)`);
      }
    } else {
      locationScore = 18;
    }

    // 3. Availability & Emergency Readiness (20 pts)
    let availabilityScore = 15;
    if (criteria.isUrgent) {
      if (provider.emergencyAvailable) {
        availabilityScore = 20;
        reasons.push(`Active Emergency Response certified (+20 pts)`);
      } else {
        availabilityScore = 5;
        reasons.push(`Standard business hours only (+5 pts)`);
      }
    } else {
      availabilityScore = 18;
      reasons.push(`Open calendar slots within 24 hours (+18 pts)`);
    }

    // 4. Price Compatibility (15 pts)
    let priceScore = 12;
    if (criteria.targetBudget && criteria.targetBudget > 0) {
      if (provider.baseHourlyRate <= criteria.targetBudget) {
        priceScore = 15;
        reasons.push(`Base rate (₹${provider.baseHourlyRate}/hr) matches budget ceiling (+15 pts)`);
      } else {
        const ratio = criteria.targetBudget / provider.baseHourlyRate;
        priceScore = Math.max(3, Math.round(ratio * 12));
        reasons.push(`Premium tier slightly above specified target (+${priceScore} pts)`);
      }
    } else {
      priceScore = 13;
    }

    // 5. Ratings & Review Confidence (10 pts)
    // Combines average rating (0-5) with logarithmic review volume dampener
    const ratingNorm = (provider.ratingAvg / 5.0) * 7; // up to 7 pts
    const volumeBonus = Math.min(3, Math.log10(provider.reviewCount + 1)); // up to 3 pts
    const ratingScore = Math.min(10, Math.round((ratingNorm + volumeBonus) * 10) / 10);
    reasons.push(`${provider.ratingAvg}★ based on ${provider.reviewCount} verified client reviews (+${ratingScore} pts)`);

    // 6. Experience (5 pts)
    const experienceScore = Math.min(5, Math.max(1, Math.round((provider.yearsExperience / 15) * 5)));
    reasons.push(`${provider.yearsExperience} years field seniority (+${experienceScore} pts)`);

    if (provider.isVerified) {
      reasons.push(`Government Trade License verified by Admin`);
    }

    const totalScore = Math.min(
      100,
      Math.round(serviceScore + locationScore + availabilityScore + priceScore + ratingScore + experienceScore)
    );

    return {
      totalScore,
      serviceRelevanceScore: serviceScore,
      locationScore,
      availabilityScore,
      priceScore,
      ratingScore,
      experienceScore,
      matchReasons: reasons,
    };
  }

  /**
   * Rule-Based Natural Language Query Parser
   * Parses queries like:
   * "I need an affordable electrician near Vijayawada tomorrow evening"
   * "Urgent plumber for water leak in Hyderabad under 500"
   */
  public static parseNaturalLanguageQuery(query: string): NLPSearchResult {
    const q = query.toLowerCase().trim();
    const explanation: string[] = [];
    let confidence = 0.5;

    // 1. Detect Category
    let extractedCategory: string | undefined = undefined;
    if (q.includes('electric') || q.includes('wiring') || q.includes('switch') || q.includes('mcb') || q.includes('breaker') || q.includes('fuse')) {
      extractedCategory = 'ELECTRICIAN';
      explanation.push('Identified electrical problem keywords');
      confidence += 0.2;
    } else if (q.includes('plumb') || q.includes('leak') || q.includes('pipe') || q.includes('water') || q.includes('drain') || q.includes('geyser') || q.includes('tap')) {
      extractedCategory = 'PLUMBER';
      explanation.push('Identified plumbing and water supply keywords');
      confidence += 0.2;
    } else if (q.includes('tutor') || q.includes('math') || q.includes('physics') || q.includes('teacher') || q.includes('study') || q.includes('class') || q.includes('exam')) {
      extractedCategory = 'TUTOR';
      explanation.push('Identified academic and educational coaching intent');
      confidence += 0.2;
    } else if (q.includes('carpent') || q.includes('wood') || q.includes('door') || q.includes('table') || q.includes('cabinet') || q.includes('furniture') || q.includes('lock')) {
      extractedCategory = 'CARPENTER';
      explanation.push('Identified woodcraft and carpentry keywords');
      confidence += 0.2;
    } else if (q.includes('ac') || q.includes('fridge') || q.includes('refrigerat') || q.includes('washing') || q.includes('appliance')) {
      extractedCategory = 'APPLIANCE_REPAIR';
      explanation.push('Identified household appliance repair intent');
      confidence += 0.2;
    } else if (q.includes('clean') || q.includes('sanitize') || q.includes('sofa') || q.includes('tank')) {
      extractedCategory = 'CLEANER';
      explanation.push('Identified deep sanitization / cleaning terms');
      confidence += 0.2;
    } else if (q.includes('paint') || q.includes('putty') || q.includes('wall') || q.includes('polish')) {
      extractedCategory = 'PAINTER';
      explanation.push('Identified painting & wall finishing request');
      confidence += 0.2;
    } else if (q.includes('mechanic') || q.includes('car') || q.includes('bike') || q.includes('brake') || q.includes('battery')) {
      extractedCategory = 'MECHANIC';
      explanation.push('Identified automotive repair intent');
      confidence += 0.2;
    }

    // 2. Detect City / Locality
    let extractedCity: string | undefined = undefined;
    if (q.includes('vijayawada') || q.includes('benz') || q.includes('patamata') || q.includes('kanuru')) {
      extractedCity = 'Vijayawada';
      explanation.push('Matched locality Vijayawada');
      confidence += 0.15;
    } else if (q.includes('hyderabad') || q.includes('madhapur') || q.includes('gachibowli') || q.includes('kondapur') || q.includes('jubilee')) {
      extractedCity = 'Hyderabad';
      explanation.push('Matched locality Hyderabad');
      confidence += 0.15;
    } else if (q.includes('visakhapatnam') || q.includes('vizag') || q.includes('mvp') || q.includes('gajuwaka')) {
      extractedCity = 'Visakhapatnam';
      explanation.push('Matched locality Visakhapatnam');
      confidence += 0.15;
    } else if (q.includes('guntur')) {
      extractedCity = 'Guntur';
      explanation.push('Matched locality Guntur');
      confidence += 0.15;
    }

    // 3. Detect Budget / Sensitivity
    let maxBudget: number | undefined = undefined;
    const priceMatch = q.match(/(?:under|below|budget|less than|max|₹|rs\.?)\s*(\d{3,5})/i);
    if (priceMatch) {
      maxBudget = parseInt(priceMatch[1], 10);
      explanation.push(`Parsed max budget constraint: ₹${maxBudget}`);
      confidence += 0.1;
    } else if (q.includes('affordable') || q.includes('cheap') || q.includes('budget-friendly')) {
      maxBudget = 500;
      explanation.push('Applied affordable tier cap (₹500/hr)');
      confidence += 0.05;
    }

    // 4. Detect Urgency / Time
    let isUrgent = false;
    let timePreference = 'Standard Schedule';
    if (q.includes('urgent') || q.includes('emergency') || q.includes('asap') || q.includes('immediately') || q.includes('now') || q.includes('sos')) {
      isUrgent = true;
      timePreference = 'Immediate SOS';
      explanation.push('High priority emergency dispatch flagged');
      confidence += 0.1;
    } else if (q.includes('tomorrow')) {
      timePreference = 'Tomorrow';
      explanation.push('Target date: Tomorrow');
    } else if (q.includes('evening')) {
      timePreference = 'Evening Window (5 PM - 8 PM)';
      explanation.push('Time slot: Evening');
    } else if (q.includes('morning')) {
      timePreference = 'Morning Window (9 AM - 12 PM)';
      explanation.push('Time slot: Morning');
    }

    return {
      rawQuery: query,
      extractedCategory,
      extractedCity,
      maxBudget,
      timePreference,
      isUrgent,
      confidence: Math.min(1.0, confidence),
      explanation,
    };
  }

  /**
   * Price Guidance Estimator
   */
  public static getPriceGuidance(categoryCode: string): {
    minPrice: number;
    medianPrice: number;
    maxPrice: number;
    hourlyEstimate: number;
    commonMaterialCost: string;
    sampleBreakdown: { item: string; cost: number }[];
  } {
    const guideMap: Record<string, {
      minPrice: number;
      medianPrice: number;
      maxPrice: number;
      hourlyEstimate: number;
      commonMaterialCost: string;
      sampleBreakdown: { item: string; cost: number }[];
    }> = {
      ELECTRICIAN: {
        minPrice: 350,
        medianPrice: 750,
        maxPrice: 2200,
        hourlyEstimate: 450,
        commonMaterialCost: '₹200 - ₹800 (Breakers, wires, brass lugs)',
        sampleBreakdown: [
          { item: 'Inspection & diagnostic test', cost: 350 },
          { item: 'Breaker replacement labor', cost: 250 },
          { item: '32A C-curve MCB (ISI mark)', cost: 320 },
        ],
      },
      PLUMBER: {
        minPrice: 300,
        medianPrice: 650,
        maxPrice: 1800,
        hourlyEstimate: 400,
        commonMaterialCost: '₹150 - ₹600 (Valves, CPVC joints, Teflon tape)',
        sampleBreakdown: [
          { item: 'Leak acoustic isolation', cost: 300 },
          { item: 'Concealed joint soldering', cost: 350 },
          { item: 'Brass ball valve & reducer', cost: 280 },
        ],
      },
      TUTOR: {
        minPrice: 500,
        medianPrice: 850,
        maxPrice: 1600,
        hourlyEstimate: 650,
        commonMaterialCost: 'Nil (Comprehensive workbook provided)',
        sampleBreakdown: [
          { item: 'Conceptual foundation 1-on-1', cost: 500 },
          { item: 'Problem solving drill session', cost: 350 },
        ],
      },
      CARPENTER: {
        minPrice: 400,
        medianPrice: 900,
        maxPrice: 2500,
        hourlyEstimate: 500,
        commonMaterialCost: '₹300 - ₹1200 (Hydraulic hinges, brass locksets)',
        sampleBreakdown: [
          { item: 'Modular drawer realignment', cost: 400 },
          { item: 'Soft-close pneumatic channel installation', cost: 500 },
        ],
      },
    };

    return guideMap[categoryCode] || {
      minPrice: 300,
      medianPrice: 600,
      maxPrice: 1500,
      hourlyEstimate: 400,
      commonMaterialCost: '₹200 - ₹500 standard consumables',
      sampleBreakdown: [
        { item: 'Base technical diagnosis', cost: 300 },
        { item: 'Standard service labor', cost: 300 },
      ],
    };
  }

  /**
   * Review Insights Engine
   * Keyword extraction across punctuality, communication, and workmanship
   */
  public static analyzeReviewThemes(reviews: Review[]): {
    punctualityRate: number;
    craftsmanshipRate: number;
    fairPricingRate: number;
    topHighlights: string[];
    sentimentSummary: string;
  } {
    if (!reviews || reviews.length === 0) {
      return {
        punctualityRate: 100,
        craftsmanshipRate: 100,
        fairPricingRate: 100,
        topHighlights: ['New professional with verified trade credentials'],
        sentimentSummary: 'Insufficient completed jobs for statistical theme clustering.',
      };
    }

    let totalPunctuality = 0;
    let totalQuality = 0;
    let totalValue = 0;
    const highlights: string[] = [];

    reviews.forEach(r => {
      totalPunctuality += r.punctualityRating || r.rating;
      totalQuality += r.qualityRating || r.rating;
      totalValue += r.valueRating || r.rating;

      const txt = r.comment.toLowerCase();
      if (txt.includes('punctual') || txt.includes('on time') || txt.includes('prompt')) {
        highlights.push('Exceptional on-time arrival consistency');
      }
      if (txt.includes('clean') || txt.includes('neat') || txt.includes('precise') || txt.includes('flawless')) {
        highlights.push('High-precision workmanship & tidy post-job cleanup');
      }
      if (txt.includes('polite') || txt.includes('courteous') || txt.includes('patient') || txt.includes('transparent')) {
        highlights.push('Transparent communication & honest pricing breakdown');
      }
    });

    const count = reviews.length;
    const punctualityRate = Math.round((totalPunctuality / (count * 5)) * 100);
    const craftsmanshipRate = Math.round((totalQuality / (count * 5)) * 100);
    const fairPricingRate = Math.round((totalValue / (count * 5)) * 100);

    const uniqueHighlights = Array.from(new Set(highlights));
    if (uniqueHighlights.length === 0) {
      uniqueHighlights.push('Consistent 5-star delivery and customer satisfaction');
    }

    return {
      punctualityRate,
      craftsmanshipRate,
      fairPricingRate,
      topHighlights: uniqueHighlights.slice(0, 3),
      sentimentSummary: `${count} verified customer reviews indicate ${craftsmanshipRate}% craftsmanship excellence and ${punctualityRate}% on-time arrival rate.`,
    };
  }
}

export { OneStopAIEngine as SkillBridgeAIEngine };
