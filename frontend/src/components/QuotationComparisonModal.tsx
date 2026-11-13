import { Quotation, User } from '../types';
import { Language } from '../data/translations';
import { dbService } from '../services/storage';
import { X, Check, Star, Clock, Calendar, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuotationComparisonModalProps {
  bookingId: string;
  quotations: Quotation[];
  currentUser: User;
  lang: Language;
  onClose: () => void;
  onQuotationAccepted: () => void;
}

export default function QuotationComparisonModal({
  bookingId,
  quotations,
  currentUser,
  lang,
  onClose,
  onQuotationAccepted,
}: QuotationComparisonModalProps) {
  const currentQuotes = quotations.filter(q => q.bookingId === bookingId);

  const handleAccept = (quoteId: string) => {
    const res = dbService.acceptQuotation(quoteId, currentUser);
    if (res.success) {
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {
        // ignore
      }
      onQuotationAccepted();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-gray-200 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="text-xs font-semibold text-[#173D32] uppercase tracking-wider mb-1">
            Competitive Bidding
          </div>
          <h2 className="text-2xl font-bold font-serif-heading text-[#173D32]">
            Compare Professional Quotations
          </h2>
          <p className="text-xs text-gray-500">
            Compare transparent labor, material cost, and job duration before awarding the contract.
          </p>
        </div>

        {currentQuotes.length === 0 ? (
          <div className="text-center py-12 border rounded-2xl bg-[#F7F5EF]/50">
            <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h4 className="font-semibold text-gray-700 text-sm">Awaiting Quotations</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Providers are analyzing your request requirements. Quotations usually arrive within 15–30 minutes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentQuotes.map((q) => {
              const isAccepted = q.status === 'ACCEPTED';
              const isDeclined = q.status === 'DECLINED';

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                    isAccepted
                      ? 'border-[#173D32] bg-[#173D32]/5 ring-2 ring-[#173D32]'
                      : isDeclined
                      ? 'border-gray-200 opacity-60 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-[#173D32]/30 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-[#173D32]">{q.providerName}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                          <span className="flex items-center text-amber-700 font-semibold">
                            <Star className="w-3 h-3 fill-[#D6B779] text-[#D6B779] mr-0.5" />
                            {q.providerRating}★
                          </span>
                          <span>·</span>
                          <span>{q.providerExperience} yrs exp</span>
                        </div>
                      </div>

                      {isAccepted && (
                        <span className="inline-flex items-center gap-1 bg-[#173D32] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3" /> Accepted
                        </span>
                      )}
                      {isDeclined && (
                        <span className="text-[10px] font-semibold text-gray-500">Declined</span>
                      )}
                    </div>

                    {/* Total Price Callout */}
                    <div className="p-3 rounded-xl bg-white border border-gray-100 mb-4 shadow-2xs">
                      <div className="text-[11px] text-gray-500">Total Quoted Estimate</div>
                      <div className="text-2xl font-bold font-mono-code text-[#173D32] tabular-nums">
                        ₹{q.totalQuotedAmount}
                      </div>
                    </div>

                    {/* Itemized Cost Breakdown */}
                    <div className="space-y-2 text-xs border-b border-gray-100 pb-3 mb-3">
                      <div className="flex justify-between text-gray-600">
                        <span>Labor Charges</span>
                        <span className="font-mono-code tabular-nums font-semibold">₹{q.laborCost}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Material & Parts</span>
                        <span className="font-mono-code tabular-nums font-semibold">₹{q.materialCost}</span>
                      </div>
                      {q.additionalCharges > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Additional Logistics</span>
                          <span className="font-mono-code tabular-nums font-semibold">₹{q.additionalCharges}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>Estimated Duration</span>
                        <span className="font-semibold">{q.estimatedDurationHours} Hours</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Valid Until</span>
                        <span className="font-medium text-gray-700">{q.validityUntil}</span>
                      </div>
                    </div>

                    {/* Notes & Exclusions */}
                    <div className="text-xs text-gray-600 mb-4">
                      <div className="font-semibold text-gray-700 mb-1">Scope & Notes:</div>
                      <p className="line-clamp-3 italic text-gray-500 text-[11px]">
                        "{q.notesExclusions}"
                      </p>
                    </div>
                  </div>

                  {/* Accept CTA Button */}
                  <div>
                    {q.status === 'PENDING' && (
                      <button
                        onClick={() => handleAccept(q.id)}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#173D32] hover:bg-[#102B25] text-white font-semibold text-xs transition-transform active:scale-95 shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & Award Booking</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
