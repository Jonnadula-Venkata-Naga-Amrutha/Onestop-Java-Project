import { useState } from 'react';
import { ProviderProfile, User } from '../types';
import { Language } from '../data/translations';
import { dbService } from '../services/storage';
import { AlertTriangle, Clock, MapPin, Zap, CheckCircle2, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EmergencyBookingModalProps {
  providers: ProviderProfile[];
  currentUser: User;
  lang: Language;
  onClose: () => void;
  onEmergencyDispatched: () => void;
}

export default function EmergencyBookingModal({
  providers,
  currentUser,
  lang,
  onClose,
  onEmergencyDispatched,
}: EmergencyBookingModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'ELECTRICIAN' | 'PLUMBER' | 'CARPENTER'>('ELECTRICIAN');
  const [problemDescription, setProblemDescription] = useState('Urgent power tripping with smoke smell from main fuse box');
  const [address, setAddress] = useState('Benz Circle, Vijayawada');
  const [city, setCity] = useState('Vijayawada');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dispatchRef, setDispatchRef] = useState('');

  // Filter providers that support emergency jobs in that category
  const emergencyProviders = providers.filter(
    p => p.emergencyAvailable && p.serviceCategories.includes(selectedCategory)
  );

  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    emergencyProviders[0]?.id || providers[0]?.id || ''
  );

  const selectedProvider = providers.find(p => p.id === selectedProviderId) || emergencyProviders[0];
  const emergencyBaseFee = 350;
  const technicianFee = selectedProvider ? selectedProvider.baseHourlyRate * 1.5 : 600;
  const totalEmergencyEstimate = emergencyBaseFee + technicianFee;

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    const res = dbService.createBooking({
      customerId: currentUser.id,
      customerName: currentUser.fullName,
      customerPhone: currentUser.phone,
      providerId: selectedProvider.id,
      serviceTitle: `EMERGENCY SOS: ${selectedCategory.toLowerCase()} urgent service`,
      categoryId: selectedCategory === 'ELECTRICIAN' ? 'cat-1' : selectedCategory === 'PLUMBER' ? 'cat-2' : 'cat-4',
      problemDescription,
      serviceAddress: address,
      city,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTimeSlot: 'Immediate Emergency Dispatch (Within 45 min)',
      isEmergency: true,
      estimatedTotal: totalEmergencyEstimate,
    });

    if (res.success) {
      setDispatchRef(res.booking.bookingReference);
      setIsSubmitted(true);
      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
      } catch {
        // ignore
      }
      onEmergencyDispatched();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border-2 border-[#C84C4C]/40 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-red-100 text-[#C84C4C] flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Zap className="w-8 h-8 fill-current" />
            </div>
            <h3 className="text-2xl font-bold font-serif-heading text-[#173D32] mb-1">
              Priority SOS Dispatched
            </h3>
            <p className="text-xs font-mono-code font-bold text-[#C84C4C] mb-4">
              REF: {dispatchRef}
            </p>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-left max-w-md mx-auto mb-6 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-900">
                <Clock className="w-4 h-4 text-red-600" />
                <span>Estimated Arrival Window: 30 - 45 Minutes</span>
              </div>
              <p className="text-red-800 text-[11px] leading-relaxed">
                Emergency technician <strong>{selectedProvider?.fullName}</strong> has been notified on high priority with your location details ({address}, {city}).
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[#173D32] rounded-xl hover:bg-[#102B25]"
            >
              Close & Monitor Dispatch
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#C84C4C] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-serif-heading text-red-950">
                  Emergency Rapid Dispatch
                </h2>
                <p className="text-xs text-red-700">
                  Immediate 45-minute on-site response for urgent hazards & leaks
                </p>
              </div>
            </div>

            <form onSubmit={handleDispatch} className="space-y-4 text-xs">
              {/* Category Segmented Control */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Select Emergency Trade</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ELECTRICIAN')}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-colors ${
                      selectedCategory === 'ELECTRICIAN'
                        ? 'border-[#173D32] bg-[#173D32] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ⚡ Electrical
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('PLUMBER')}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-colors ${
                      selectedCategory === 'PLUMBER'
                        ? 'border-[#173D32] bg-[#173D32] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    🔧 Plumbing Leak
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('CARPENTER')}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-colors ${
                      selectedCategory === 'CARPENTER'
                        ? 'border-[#173D32] bg-[#173D32] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    🔨 Lock / Door Jam
                  </button>
                </div>
              </div>

              {/* Active Emergency Provider Selection */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  On-Call Emergency Technician ({emergencyProviders.length} Available)
                </label>
                {emergencyProviders.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {emergencyProviders.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProviderId(p.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedProviderId === p.id
                            ? 'border-[#C84C4C] bg-red-50/50 ring-1 ring-[#C84C4C]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.profileImageUrl}
                            alt={p.fullName}
                            className="w-9 h-9 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-bold text-gray-900">{p.fullName}</div>
                            <div className="text-[11px] text-gray-500">{p.city} · {p.yearsExperience} yrs exp</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono-code font-bold text-[#173D32]">₹{p.baseHourlyRate}/hr</div>
                          <span className="text-[10px] text-emerald-700 font-semibold">Ready</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-3 bg-amber-50 text-amber-800 rounded-lg text-xs">
                    No emergency certified providers currently available for this category. Nearest standard provider will be queued.
                  </p>
                )}
              </div>

              {/* Problem Description */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Hazard / Emergency Details</label>
                <textarea
                  rows={2}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-[#C84C4C] text-xs"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Exact Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs"
                  />
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-gray-200 space-y-1.5">
                <div className="flex justify-between text-gray-600">
                  <span>Emergency Dispatch Priority Surcharge</span>
                  <span className="font-mono-code">₹{emergencyBaseFee}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Estimated Technician Labor (1.5 hrs)</span>
                  <span className="font-mono-code">₹{technicianFee}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-sm">
                  <span>Total Indicative Estimate</span>
                  <span className="font-mono-code text-[#C84C4C] tabular-nums">
                    ₹{totalEmergencyEstimate}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 font-bold text-white bg-[#C84C4C] hover:bg-[#b03b3b] rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Dispatch Now</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
