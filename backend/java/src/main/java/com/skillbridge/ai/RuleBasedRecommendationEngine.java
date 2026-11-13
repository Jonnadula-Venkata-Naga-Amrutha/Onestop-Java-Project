package com.skillbridge.ai;

import com.skillbridge.model.ProviderProfile;
import java.util.ArrayList;
import java.util.List;

/**
 * Transparent explainable scoring engine written in Core Java.
 * Weights:
 * - Service Relevance (30%)
 * - Location (20%)
 * - Availability (20%)
 * - Price Compatibility (15%)
 * - Ratings & Review Confidence (10%)
 * - Experience Seniority (5%)
 */
public class RuleBasedRecommendationEngine {

    public static class ScoreBreakdown {
        public double totalScore;
        public double serviceScore;
        public double locationScore;
        public double availabilityScore;
        public double priceScore;
        public double ratingScore;
        public double experienceScore;
        public List<String> factors = new ArrayList<>();
    }

    public ScoreBreakdown evaluateProvider(ProviderProfile p, String targetCategory, String targetCity, double maxBudget, boolean isUrgent) {
        ScoreBreakdown sb = new ScoreBreakdown();

        // 1. Service Match (30 pts)
        if (p.getServiceCategories().contains(targetCategory)) {
            sb.serviceScore = 30.0;
            sb.factors.add("Direct specialty in " + targetCategory + " (+30 pts)");
        } else {
            sb.serviceScore = 5.0;
        }

        // 2. Location (20 pts)
        if (targetCity != null && p.getCity().equalsIgnoreCase(targetCity)) {
            sb.locationScore = 20.0;
            sb.factors.add("Locally established within " + targetCity + " (+20 pts)");
        } else {
            sb.locationScore = 5.0;
        }

        // 3. Availability (20 pts)
        if (isUrgent) {
            sb.availabilityScore = p.isEmergencyAvailable() ? 20.0 : 4.0;
            if (p.isEmergencyAvailable()) sb.factors.add("Emergency Response certified (+20 pts)");
        } else {
            sb.availabilityScore = 18.0;
        }

        // 4. Price (15 pts)
        if (maxBudget > 0) {
            if (p.getBaseHourlyRate() <= maxBudget) {
                sb.priceScore = 15.0;
                sb.factors.add("Hourly rate within budget threshold (+15 pts)");
            } else {
                sb.priceScore = Math.max(3.0, (maxBudget / p.getBaseHourlyRate()) * 12.0);
            }
        } else {
            sb.priceScore = 13.0;
        }

        // 5. Rating & Review volume dampener (10 pts)
        double ratingNorm = (p.getRatingAvg() / 5.0) * 7.0;
        double volumeBonus = Math.min(3.0, Math.log10(p.getReviewCount() + 1));
        sb.ratingScore = Math.min(10.0, ratingNorm + volumeBonus);
        sb.factors.add(p.getRatingAvg() + "★ from " + p.getReviewCount() + " reviews (+ " + Math.round(sb.ratingScore) + " pts)");

        // 6. Experience (5 pts)
        sb.experienceScore = Math.min(5.0, (p.getYearsExperience() / 15.0) * 5.0);

        sb.totalScore = Math.min(100.0, sb.serviceScore + sb.locationScore + sb.availabilityScore + sb.priceScore + sb.ratingScore + sb.experienceScore);
        return sb;
    }
}
