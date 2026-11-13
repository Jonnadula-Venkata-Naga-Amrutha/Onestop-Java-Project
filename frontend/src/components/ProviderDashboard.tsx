import React, { useState } from 'react';
import { Booking, ProviderProfile, Quotation, User } from '../types';
import { Language } from '../data/translations';
import { dbService } from '../services/storage';
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User as UserIcon,
  MapPin,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProviderDashboardProps {
  currentUser: User;
  provider: ProviderProfile;
  bookings: Booking[];
  quotations: Quotation[];
  lang: Language;
  onRefreshData: () => void;
}

export default function ProviderDashboard({
  currentUser,
  provider,
  bookings,
  quotations,
  lang,
  onRefreshData,
}: ProviderDashboardProps) {
  const providerBookings = bookings.filter(b => b.providerId === provider.id);
  const pendingRequests = providerBookings.filter(b => b.status === 'PENDING');
  const inProgressBookings = providerBookings.filter(b =>
    ['CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS'].includes(b.status)
  );
  const completedJobs = providerBookings.filter(b => b.status === 'COMPLETED');

  // Calculate gross earnings from completed jobs
  const totalEarnings = completedJobs.reduce((sum, b) => sum + (b.finalTotal || b.estimatedTotal), 0);

  // Quote drafting modal state
  const [quoteBooking, setQuoteBooking] = useState<Booking | null>(null);
  const [laborCost, setLaborCost] = useState(500);
  const [materialCost, setMaterialCost] = useState(300);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [estHours, setEstHours] = useState(2);
  const [validDays, setValidDays] = useState(7);
  const [notes, setNotes] = useState('Standard electrical diagnostics & branded breaker replacement included.');
  const [quoteSuccess, setQuoteSuccess] = useState('');

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteBooking) return;

    const validity = new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0];

    const res = dbService.createQuotation({
      bookingId: quoteBooking.id,
      providerId: provider.id,
      laborCost: Number(laborCost),
      materialCost: Number(materialCost),
      additionalCharges: Number(additionalCharges),
      estimatedDurationHours: Number(estHours),
      validityUntil: validity,
      notesExclusions: notes,
    });

    if (res.success) {
      setQuoteSuccess('Official Quotation sent to customer for review!');
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {
        // ignore
      }
      setTimeout(() => {
        setQuoteBooking(null);
        setQuoteSuccess('');
        onRefreshData();
      }, 1500);
    }
  };

  const handleStatusTransition = (bookingId: string, nextStatus: any, reason: string) => {
    dbService.updateBookingStatus(bookingId, nextStatus, reason, currentUser);
    onRefreshData();
  };

  return (
    <div className="py-10 bg-[#F7F5EF] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Provider Profile Header */}
        <div className="p-6 rounded-3xl bg-[#173D32] text-white shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={provider.profileImageUrl}
              alt={provider.fullName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#D6B779]"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold font-serif-heading">{provider.fullName}</h1>
                {provider.isVerified ? (
                  <span className="bg-[#D6B779]/20 text-[#D6B779] text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#D6B779]/40">
                    Verified Contractor
                  </span>
                ) : (
                  <span className="bg-amber-400/20 text-amber-200 text-xs px-2.5 py-0.5 rounded-full">
                    Verification In Progress
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300">{provider.businessName} · {provider.city}</p>
              <div className="flex items-center gap-3 text-xs text-stone-300 mt-2">
                <span>Base Rate: <strong>₹{provider.baseHourlyRate}/hr</strong></span>
                <span>·</span>
                <span>Experience: <strong>{provider.yearsExperience} Years</strong></span>
                <span>·</span>
                <span>Rating: <strong>{provider.ratingAvg}★</strong> ({provider.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-white/10 p-4 rounded-2xl border border-white/10 text-center text-xs">
            <div>
              <div className="text-stone-300">Total Revenue</div>
              <div className="text-lg font-bold font-mono-code text-[#D6B779] tabular-nums">
                ₹{totalEarnings}
              </div>
            </div>
            <div>
              <div className="text-stone-300">Jobs Delivered</div>
              <div className="text-lg font-bold font-mono-code text-white tabular-nums">
                {completedJobs.length}
              </div>
            </div>
            <div>
              <div className="text-stone-300">Active Jobs</div>
              <div className="text-lg font-bold font-mono-code text-white tabular-nums">
                {inProgressBookings.length}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Pending Requests & Quotation Dispatch */}
        <div className="mb-10">
          <h2 className="text-xl font-bold font-serif-heading text-[#173D32] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D6B779]" />
            <span>New Customer Booking Requests ({pendingRequests.length})</span>
          </h2>

          {pendingRequests.length === 0 ? (
            <p className="p-6 bg-white rounded-2xl border border-gray-200 text-xs text-gray-500 italic">
              No new pending service requests currently awaiting quotation or confirmation.
            </p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-white border border-[#173D32]/15 shadow-sm hover:shadow-md transition-shadow text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono-code font-bold text-[#173D32]">
                          {b.bookingReference}
                        </span>
                        {b.isEmergency && (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            🚨 URGENT EMERGENCY DISPATCH
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-gray-900">{b.serviceTitle}</h3>
                      <p className="text-gray-600">
                        Client: <strong>{b.customerName}</strong> ({b.customerPhone})
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-gray-400">Target Schedule</div>
                      <div className="font-semibold text-gray-800">
                        {b.scheduledDate} ({b.scheduledTimeSlot})
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F7F5EF] rounded-xl mb-4 text-gray-700">
                    <strong>Problem Description:</strong> {b.problemDescription}
                    <div className="mt-1 flex items-center gap-1.5 text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-[#173D32]" />
                      <span>{b.serviceAddress}, {b.city}</span>
                    </div>
                  </div>

                  {/* Actions: Confirm Directly or Submit Itemized Quotation */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleStatusTransition(b.id, 'REJECTED', 'Provider unavailable for requested slot')}
                      className="px-3 py-1.5 text-gray-500 hover:text-red-700 font-medium"
                    >
                      Decline Request
                    </button>
                    <button
                      onClick={() => setQuoteBooking(b)}
                      className="px-4 py-2 font-semibold text-[#173D32] bg-[#A7BDA9]/20 hover:bg-[#A7BDA9]/35 rounded-xl flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Submit Quotation</span>
                    </button>
                    <button
                      onClick={() => handleStatusTransition(b.id, 'CONFIRMED', 'Provider accepted and locked appointment')}
                      className="px-4 py-2 font-semibold text-white bg-[#173D32] hover:bg-[#102B25] rounded-xl shadow-sm"
                    >
                      Accept & Confirm Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Active / Ongoing Jobs */}
        <div className="mb-10">
          <h2 className="text-xl font-bold font-serif-heading text-[#173D32] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-700" />
            <span>Active Confirmed Jobs ({inProgressBookings.length})</span>
          </h2>

          {inProgressBookings.length === 0 ? (
            <p className="p-6 bg-white rounded-2xl border border-gray-200 text-xs text-gray-500 italic">
              No active in-progress jobs currently scheduled.
            </p>
          ) : (
            <div className="space-y-4">
              {inProgressBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono-code font-bold text-[#173D32]">
                          {b.bookingReference}
                        </span>
                        <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-semibold text-[11px]">
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900">{b.serviceTitle}</h3>
                      <p className="text-gray-600">
                        Customer: {b.customerName} · {b.customerPhone}
                      </p>
                      <p className="text-gray-500">{b.serviceAddress}, {b.city}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-gray-400">Total Quoted</div>
                      <div className="text-xl font-bold font-mono-code text-[#173D32] tabular-nums">
                        ₹{b.finalTotal || b.estimatedTotal}
                      </div>
                    </div>
                  </div>

                  {/* Operational Status Transitions */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-gray-500">Live Transition State:</span>
                    <div className="flex items-center gap-2">
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleStatusTransition(b.id, 'PROVIDER_ON_THE_WAY', 'Technician is en route to customer location')}
                          className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                        >
                          Mark: On The Way
                        </button>
                      )}
                      {b.status === 'PROVIDER_ON_THE_WAY' && (
                        <button
                          onClick={() => handleStatusTransition(b.id, 'IN_PROGRESS', 'Arrived on-site and commenced service')}
                          className="px-4 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl"
                        >
                          Mark: Work In Progress
                        </button>
                      )}
                      {b.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusTransition(b.id, 'COMPLETED', 'Job completed and validated with customer')}
                          className="px-5 py-2 font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
                        >
                          Mark: Job Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Draft Quotation */}
        {quoteBooking && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setQuoteBooking(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 text-xs my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold font-serif-heading text-[#173D32] mb-1">
                Draft Quotation for {quoteBooking.customerName}
              </h3>
              <p className="text-gray-500 mb-4">
                Booking: {quoteBooking.bookingReference} · {quoteBooking.serviceTitle}
              </p>

              {quoteSuccess ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl font-medium text-center">
                  {quoteSuccess}
                </div>
              ) : (
                <form onSubmit={handleCreateQuotation} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Labor Cost (₹)</label>
                      <input
                        type="number"
                        value={laborCost}
                        onChange={(e) => setLaborCost(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-gray-300 font-mono-code"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Estimated Materials (₹)</label>
                      <input
                        type="number"
                        value={materialCost}
                        onChange={(e) => setMaterialCost(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-gray-300 font-mono-code"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Logistics / Misc (₹)</label>
                      <input
                        type="number"
                        value={additionalCharges}
                        onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-gray-300 font-mono-code"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Estimated Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        value={estHours}
                        onChange={(e) => setEstHours(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-gray-300 font-mono-code"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Scope of Work & Exclusions</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-300"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F5EF] flex items-center justify-between font-bold text-sm">
                    <span className="text-[#173D32]">Total Quoted Amount</span>
                    <span className="font-mono-code text-[#173D32] tabular-nums text-lg">
                      ₹{Number(laborCost) + Number(materialCost) + Number(additionalCharges)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setQuoteBooking(null)}
                      className="px-4 py-2 font-medium text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-semibold text-white bg-[#173D32] rounded-xl hover:bg-[#102B25] flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Quotation</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
