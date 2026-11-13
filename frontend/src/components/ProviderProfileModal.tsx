import { ProviderProfile, Review } from '../types';
import { Language } from '../data/translations';
import { OneStopAIEngine } from '../services/aiEngine';
import {
  X,
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2
} from 'lucide-react';

interface ProviderProfileModalProps {
  provider: ProviderProfile | null;
  reviews: Review[];
  lang: Language;
  onClose: () => void;
  onBook: (provider: ProviderProfile) => void;
  onRequestQuote: (provider: ProviderProfile) => void;
}

export default function ProviderProfileModal({
  provider,
  reviews,
  lang,
  onClose,
  onBook,
  onRequestQuote,
}: ProviderProfileModalProps) {
  if (!provider) return null;

  const providerReviews = reviews.filter(r => r.providerId === provider.id);
  const insights = OneStopAIEngine.analyzeReviewThemes(providerReviews);
  const priceGuide = OneStopAIEngine.getPriceGuidance(provider.serviceCategories[0] || 'ELECTRICIAN');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Cover Banner */}
        <div className="relative h-48 bg-[#173D32] overflow-hidden">
          <img
            src={provider.profileImageUrl}
            alt={provider.fullName}
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#173D32] via-[#173D32]/60 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Verification Badge */}
          {provider.isVerified && (
            <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-[#D6B779]/40 text-[#D6B779] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#D6B779]" />
              <span>Government Trade License Verified</span>
            </div>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-6 pb-6 relative -mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div className="flex items-end gap-4">
              <img
                src={provider.profileImageUrl}
                alt={provider.fullName}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg bg-white"
              />
              <div className="mb-1">
                <h2 className="text-2xl font-bold font-serif-heading text-[#173D32]">
                  {provider.fullName}
                </h2>
                <div className="text-sm text-[#777F79] font-medium">
                  {provider.businessName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onRequestQuote(provider);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#173D32] bg-[#A7BDA9]/25 hover:bg-[#A7BDA9]/40 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Request Quotation</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onBook(provider);
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#173D32] hover:bg-[#102B25] rounded-xl shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Now</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#F7F5EF] border border-[#173D32]/10 mb-6 text-xs">
            <div>
              <div className="text-gray-500">Rating</div>
              <div className="text-base font-bold text-[#173D32] flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#D6B779] text-[#D6B779]" />
                <span className="tabular-nums">{provider.ratingAvg.toFixed(1)}</span>
                <span className="text-xs text-gray-400 font-normal">({provider.reviewCount})</span>
              </div>
            </div>
            <div>
              <div className="text-gray-500">Experience</div>
              <div className="text-base font-bold text-[#173D32] tabular-nums">
                {provider.yearsExperience} Years
              </div>
            </div>
            <div>
              <div className="text-gray-500">Jobs Delivered</div>
              <div className="text-base font-bold text-[#173D32] tabular-nums">
                {provider.completedJobsCount} Verified
              </div>
            </div>
            <div>
              <div className="text-gray-500">Hourly Rate</div>
              <div className="text-base font-bold text-[#173D32] tabular-nums">
                ₹{provider.baseHourlyRate}/hr
              </div>
            </div>
          </div>

          {/* Bio & Description */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[#173D32] uppercase tracking-wider mb-2">
              Professional Biography
            </h3>
            <p className="text-sm text-[#252A28]/80 leading-relaxed">
              {provider.bio}
            </p>
          </div>

          {/* Service Areas & Localities */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[#173D32] uppercase tracking-wider mb-2">
              Service Areas ({provider.city})
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {provider.localities.map((loc, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-[#173D32]/5 text-[#173D32] px-3 py-1 rounded-lg border border-[#173D32]/10 font-medium"
                >
                  <MapPin className="w-3 h-3 text-[#173D32]" />
                  {loc}
                </span>
              ))}
            </div>
          </div>

          {/* AI Review Insights & Thematic Analytics */}
          <div className="mb-6 p-4 rounded-2xl bg-white border border-[#173D32]/15 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#D6B779]" />
              <h3 className="text-sm font-bold text-[#173D32]">
                AI Customer Feedback Analytics
              </h3>
            </div>
            <p className="text-xs text-[#777F79] mb-4">
              {insights.sentimentSummary}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div className="p-2.5 rounded-xl bg-[#F7F5EF]">
                <div className="text-lg font-bold font-mono-code text-[#173D32]">
                  {insights.craftsmanshipRate}%
                </div>
                <div className="text-[11px] text-gray-500">Workmanship</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F5EF]">
                <div className="text-lg font-bold font-mono-code text-[#173D32]">
                  {insights.punctualityRate}%
                </div>
                <div className="text-[11px] text-gray-500">Punctuality</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F7F5EF]">
                <div className="text-lg font-bold font-mono-code text-[#173D32]">
                  {insights.fairPricingRate}%
                </div>
                <div className="text-[11px] text-gray-500">Price Fairness</div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-gray-700">
              {insights.topHighlights.map((hl, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#173D32]" />
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Indicative Price Guidance & Transparent Costs */}
          <div className="mb-6 p-4 rounded-2xl bg-[#F7F5EF] border border-[#173D32]/10 text-xs">
            <div className="font-bold text-[#173D32] mb-1">
              Indicative Price Guidance ({provider.serviceCategories[0]})
            </div>
            <div className="text-[#777F79] mb-3">
              Standard local market pricing range derived from historical completed bookings:
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-2 bg-white rounded-lg">
                <div className="text-gray-400">Min Diagnosis</div>
                <div className="font-bold text-[#173D32]">₹{priceGuide.minPrice}</div>
              </div>
              <div className="p-2 bg-white rounded-lg">
                <div className="text-gray-400">Typical Repair</div>
                <div className="font-bold text-[#173D32]">₹{priceGuide.medianPrice}</div>
              </div>
              <div className="p-2 bg-white rounded-lg">
                <div className="text-gray-400">Comprehensive</div>
                <div className="font-bold text-[#173D32]">₹{priceGuide.maxPrice}</div>
              </div>
            </div>
            <div className="text-gray-600">
              <strong>Materials:</strong> {priceGuide.commonMaterialCost}
            </div>
          </div>

          {/* Customer Reviews List */}
          <div>
            <h3 className="text-sm font-bold text-[#173D32] uppercase tracking-wider mb-3">
              Verified Client Reviews ({providerReviews.length})
            </h3>
            {providerReviews.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No customer reviews recorded yet for this provider.
              </p>
            ) : (
              <div className="space-y-3">
                {providerReviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl border border-gray-100 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-xs text-gray-900">
                        {rev.customerName}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3.5 h-3.5 fill-[#D6B779] text-[#D6B779]" />
                        <span className="font-bold">{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed mb-2">
                      "{rev.comment}"
                    </p>
                    {rev.providerResponse && (
                      <div className="mt-2 pl-3 border-l-2 border-[#173D32] text-[11px] text-[#173D32] bg-[#173D32]/5 p-2 rounded-r-lg">
                        <strong>Provider Response:</strong> {rev.providerResponse}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
