import { useState } from 'react';
import { ProviderProfile } from '../types';
import { Language } from '../data/translations';
import { OneStopAIEngine } from '../services/aiEngine';
import Card3D from './Card3D';
import {
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Info,
  Calendar,
  FileText
} from 'lucide-react';

interface ProviderCardProps {
  provider: ProviderProfile;
  lang: Language;
  onBook: (provider: ProviderProfile) => void;
  onRequestQuote: (provider: ProviderProfile) => void;
  onViewProfile: (provider: ProviderProfile) => void;
  filterCriteria?: {
    categoryCode?: string;
    city?: string;
    targetBudget?: number;
    isUrgent?: boolean;
  };
}

export default function ProviderCard({
  provider,
  lang,
  onBook,
  onRequestQuote,
  onViewProfile,
  filterCriteria = {},
}: ProviderCardProps) {
  const [showScoreModal, setShowScoreModal] = useState(false);

  const scoring = OneStopAIEngine.calculateMatchScore(provider, filterCriteria);

  return (
    <Card3D className="bg-white rounded-2xl border border-[#173D32]/10 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Card Header with Photo and Verification Status */}
        <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
          <img
            src={provider.profileImageUrl}
            alt={provider.fullName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            {provider.isVerified ? (
              <span className="inline-flex items-center gap-1 bg-[#173D32]/90 backdrop-blur-xs text-[#D6B779] px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#D6B779]/30 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D6B779]" />
                <span>Verified License</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-900/80 backdrop-blur-xs text-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                Pending Verification
              </span>
            )}

            {provider.emergencyAvailable && (
              <span className="inline-flex items-center gap-1 bg-[#C84C4C] text-white px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm">
                🚨 Emergency Ready
              </span>
            )}
          </div>

          {/* AI Match Score Pill & Explainability Trigger */}
          <div className="absolute bottom-3 right-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowScoreModal(true);
              }}
              className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold border border-white/20 transition-colors shadow-sm"
              title="Click to view transparent weighted AI matching breakdown"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D6B779]" />
              <span className="tabular-nums font-mono-code font-bold text-[#D6B779]">
                {scoring.totalScore}%
              </span>
              <span className="text-[10px] text-gray-300">Match</span>
              <Info className="w-3 h-3 text-gray-400 ml-0.5" />
            </button>
          </div>

          {/* Name & Title on Image */}
          <div className="absolute bottom-3 left-3 right-24 text-white">
            <h3 className="font-bold text-lg leading-tight truncate">
              {provider.fullName}
            </h3>
            <p className="text-xs text-[#D6B779] font-medium truncate">
              {provider.businessName}
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4">
          {/* Metadata Row (Clean unboxed text with separators) */}
          <div className="flex items-center gap-2 text-xs text-[#252A28]/70 mb-3">
            <div className="flex items-center gap-1 font-semibold text-amber-900">
              <Star className="w-3.5 h-3.5 fill-[#D6B779] text-[#D6B779]" />
              <span className="tabular-nums font-bold">{provider.ratingAvg.toFixed(1)}</span>
              <span className="text-gray-400 font-normal">({provider.reviewCount})</span>
            </div>
            <span aria-hidden="true">·</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{provider.yearsExperience} yrs exp</span>
            </div>
            <span aria-hidden="true">·</span>
            <div className="flex items-center gap-1">
              <span>{provider.completedJobsCount} jobs</span>
            </div>
          </div>

          {/* Location & City */}
          <div className="flex items-center gap-1.5 text-xs text-[#777F79] mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#173D32] shrink-0" />
            <span className="truncate">
              {provider.city} ({provider.localities.slice(0, 2).join(', ')})
            </span>
          </div>

          {/* Bio Preview */}
          <p className="text-xs text-[#252A28]/80 line-clamp-2 leading-relaxed mb-4">
            {provider.bio}
          </p>

          {/* Hourly Rate & Pricing */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500">Service Fee:</span>{' '}
              <strong className="text-[#173D32] text-sm tabular-nums">
                ₹{provider.baseHourlyRate}/hr
              </strong>
            </div>
            <button
              onClick={() => onViewProfile(provider)}
              className="text-[#173D32] hover:underline font-semibold text-xs"
            >
              Full Profile
            </button>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
        <button
          onClick={() => onRequestQuote(provider)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#173D32] bg-[#A7BDA9]/20 hover:bg-[#A7BDA9]/35 rounded-lg border border-[#173D32]/10 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'Get Quote' : 'కొటేషన్'}</span>
        </button>
        <button
          onClick={() => onBook(provider)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-[#173D32] hover:bg-[#102B25] rounded-lg shadow-sm transition-transform active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'Book Now' : 'బుకింగ్'}</span>
        </button>
      </div>

      {/* Transparent AI Score Explanation Modal */}
      {showScoreModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowScoreModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#173D32] flex items-center justify-center text-[#D6B779]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-[#173D32] text-base">
                    Explainable AI Match
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Transparent Core Java Weighted Recommendation Engine
                  </p>
                </div>
              </div>
              <div className="text-xl font-bold font-mono-code text-[#173D32]">
                {scoring.totalScore}%
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Service Specialization (30% weight)</span>
                  <span className="font-mono-code font-bold">{scoring.serviceRelevanceScore}/30 pts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-[#173D32] h-1.5 rounded-full"
                    style={{ width: `${(scoring.serviceRelevanceScore / 30) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Locality & Travel Distance (20% weight)</span>
                  <span className="font-mono-code font-bold">{scoring.locationScore}/20 pts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-[#173D32] h-1.5 rounded-full"
                    style={{ width: `${(scoring.locationScore / 20) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Availability & Dispatch (20% weight)</span>
                  <span className="font-mono-code font-bold">{scoring.availabilityScore}/20 pts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-[#173D32] h-1.5 rounded-full"
                    style={{ width: `${(scoring.availabilityScore / 20) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Price Compatibility (15% weight)</span>
                  <span className="font-mono-code font-bold">{scoring.priceScore}/15 pts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-[#173D32] h-1.5 rounded-full"
                    style={{ width: `${(scoring.priceScore / 15) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Ratings & Review Confidence (10% weight)</span>
                  <span className="font-mono-code font-bold">{scoring.ratingScore}/10 pts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-[#173D32] h-1.5 rounded-full"
                    style={{ width: `${(scoring.ratingScore / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Experience Seniority (5% weight)</span>
                  <span className="font-mono-code font-bold">{scoring.experienceScore}/5 pts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-[#173D32] h-1.5 rounded-full"
                    style={{ width: `${(scoring.experienceScore / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Contributing Factors */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                Ranking Factors
              </div>
              <ul className="space-y-1 text-xs text-gray-600">
                {scoring.matchReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#173D32] font-bold">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setShowScoreModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#173D32] rounded-lg hover:bg-[#102B25]"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </Card3D>
  );
}
