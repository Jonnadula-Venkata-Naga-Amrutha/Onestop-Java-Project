import { useState } from 'react';
import { Booking, Quotation, User, Review } from '../types';
import { Language } from '../data/translations';
import { dbService } from '../services/storage';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Star,
  FileWarning,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomerDashboardProps {
  currentUser: User;
  bookings: Booking[];
  quotations: Quotation[];
  reviews: Review[];
  lang: Language;
  onOpenCompareQuotes: (bookingId: string) => void;
  onExploreServices: () => void;
  onRefreshData: () => void;
}

export default function CustomerDashboard({
  currentUser,
  bookings,
  quotations,
  reviews,
  lang,
  onOpenCompareQuotes,
  onExploreServices,
  onRefreshData,
}: CustomerDashboardProps) {
  const customerBookings = bookings.filter(b => b.customerId === currentUser.id);
  const activeBookings = customerBookings.filter(b => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status));
  const pastBookings = customerBookings.filter(b => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status));

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Complaint modal state
  const [complaintBooking, setComplaintBooking] = useState<Booking | null>(null);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState('');

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;

    const res = dbService.addReview({
      bookingId: reviewBooking.id,
      customerId: currentUser.id,
      customerName: currentUser.fullName,
      providerId: reviewBooking.providerId,
      rating,
      comment,
      punctualityRating: rating,
      qualityRating: rating,
      valueRating: rating,
    });

    if (res.success) {
      setReviewSuccess('Review published successfully!');
      try {
        confetti({ particleCount: 40, spread: 50 });
      } catch {
        // ignore
      }
      setTimeout(() => {
        setReviewBooking(null);
        setReviewSuccess('');
        setComment('');
        onRefreshData();
      }, 1500);
    } else {
      alert(res.message);
    }
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintBooking) return;

    const res = dbService.createComplaint({
      bookingId: complaintBooking.id,
      bookingReference: complaintBooking.bookingReference,
      filedByUser: currentUser,
      againstUserId: complaintBooking.providerId,
      againstName: complaintBooking.providerName,
      subject: complaintSubject,
      description: complaintDesc,
    });

    if (res.success) {
      setComplaintSuccess('Issue report filed and assigned to administrator!');
      setTimeout(() => {
        setComplaintBooking(null);
        setComplaintSuccess('');
        setComplaintSubject('');
        setComplaintDesc('');
        onRefreshData();
      }, 1500);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-xs font-semibold">Pending Confirmation</span>;
      case 'QUOTE_SENT':
        return <span className="bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full text-xs font-semibold">Quotations Ready</span>;
      case 'CONFIRMED':
        return <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full text-xs font-semibold">Booking Confirmed</span>;
      case 'PROVIDER_ON_THE_WAY':
        return <span className="bg-indigo-100 text-indigo-900 px-2.5 py-0.5 rounded-full text-xs font-semibold">Expert En Route</span>;
      case 'IN_PROGRESS':
        return <span className="bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full text-xs font-semibold">Work in Progress</span>;
      case 'COMPLETED':
        return <span className="bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-full text-xs font-semibold">Completed</span>;
      case 'CANCELLED':
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="py-10 bg-[#F7F5EF] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#173D32]/10 gap-4">
          <div>
            <div className="text-xs font-semibold text-[#173D32] uppercase tracking-wider mb-1">
              Customer Portal
            </div>
            <h1 className="text-3xl font-bold font-serif-heading text-[#173D32]">
              Welcome back, {currentUser.fullName}
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Manage your service bookings, quotations, and verified craftsmanship records.
            </p>
          </div>
          <button
            onClick={onExploreServices}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#173D32] hover:bg-[#102B25] rounded-xl shadow-sm transition-transform active:scale-95 flex items-center gap-2 self-start sm:self-auto"
          >
            <span>Book New Service</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Active Bookings & Timeline */}
        <div className="mb-12">
          <h2 className="text-xl font-bold font-serif-heading text-[#173D32] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D6B779]" />
            <span>Active Service Appointments ({activeBookings.length})</span>
          </h2>

          {activeBookings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-[#173D32]/10 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-700">No Active Bookings</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                You don't have any pending or ongoing appointments at this moment.
              </p>
              <button
                onClick={onExploreServices}
                className="px-4 py-2 text-xs font-semibold text-[#173D32] bg-[#A7BDA9]/20 rounded-lg hover:bg-[#A7BDA9]/30"
              >
                Browse Verified Providers
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((b) => {
                const bookingQuotes = quotations.filter(q => q.bookingId === b.id);

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl bg-white border border-[#173D32]/15 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono-code font-bold text-xs text-[#173D32]">
                            {b.bookingReference}
                          </span>
                          {b.isEmergency && (
                            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              🚨 Emergency SOS
                            </span>
                          )}
                          {getStatusBadge(b.status)}
                        </div>
                        <h3 className="font-bold text-base text-gray-900">{b.serviceTitle}</h3>
                        <p className="text-xs text-gray-500">
                          Provider: <strong>{b.providerName}</strong> ({b.providerBusiness})
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500">Estimated Total</div>
                        <div className="text-xl font-bold font-mono-code text-[#173D32] tabular-nums">
                          ₹{b.estimatedTotal}
                        </div>
                      </div>
                    </div>

                    {/* Problem Description & Location */}
                    <div className="p-3 rounded-xl bg-[#F7F5EF] text-xs text-gray-700 mb-4 space-y-1">
                      <div><strong>Requirements:</strong> {b.problemDescription}</div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-[#173D32]" />
                        <span>{b.serviceAddress}, {b.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-[#173D32]" />
                        <span>Scheduled: {b.scheduledDate} ({b.scheduledTimeSlot})</span>
                      </div>
                    </div>

                    {/* Timeline visualization */}
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Audit Status History
                      </div>
                      <div className="space-y-1 text-xs">
                        {b.statusHistory.map((hist, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#173D32]" />
                            <span className="font-semibold text-gray-800">{hist.toStatus}:</span>
                            <span>{hist.changeReason}</span>
                            <span className="text-[11px] text-gray-400 ml-auto font-mono-code">
                              {new Date(hist.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      {bookingQuotes.length > 0 && (
                        <button
                          onClick={() => onOpenCompareQuotes(b.id)}
                          className="px-4 py-2 font-semibold text-[#173D32] bg-[#A7BDA9]/20 hover:bg-[#A7BDA9]/30 rounded-lg flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Compare Quotations ({bookingQuotes.length})</span>
                        </button>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => setComplaintBooking(b)}
                          className="text-gray-500 hover:text-red-700 px-3 py-1.5"
                        >
                          Report Issue
                        </button>
                        {b.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              dbService.updateBookingStatus(b.id, 'CANCELLED', 'Cancelled by customer', currentUser);
                              onRefreshData();
                            }}
                            className="px-3 py-1.5 text-red-700 hover:bg-red-50 rounded-lg font-medium"
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Completed Bookings & Reviews */}
        <div>
          <h2 className="text-xl font-bold font-serif-heading text-[#173D32] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-700" />
            <span>Completed Service History ({pastBookings.length})</span>
          </h2>

          {pastBookings.length === 0 ? (
            <p className="text-xs text-gray-500 italic p-4 bg-white rounded-xl border border-gray-100">
              No historical services recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {pastBookings.map((b) => {
                const existingReview = reviews.find(r => r.bookingId === b.id);

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono-code font-bold text-[#173D32]">
                          {b.bookingReference}
                        </span>
                        {getStatusBadge(b.status)}
                      </div>
                      <h4 className="font-bold text-sm text-gray-900">{b.serviceTitle}</h4>
                      <p className="text-gray-500">
                        {b.providerName} · {b.scheduledDate} · Final: ₹{b.finalTotal || b.estimatedTotal}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {b.status === 'COMPLETED' && !existingReview && (
                        <button
                          onClick={() => setReviewBooking(b)}
                          className="px-4 py-2 font-semibold text-white bg-[#173D32] hover:bg-[#102B25] rounded-xl flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 fill-[#D6B779] text-[#D6B779]" />
                          <span>Leave Review</span>
                        </button>
                      )}
                      {existingReview && (
                        <div className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Reviewed ({existingReview.rating}★)</span>
                        </div>
                      )}
                      <button
                        onClick={() => alert(`Invoice #${b.bookingReference}-INV generated.\nTotal: ₹${b.finalTotal || b.estimatedTotal}\nPayment: Settled via UPI.`)}
                        className="px-3 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Write Review */}
        {reviewBooking && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setReviewBooking(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold font-serif-heading text-[#173D32] mb-1">
                Rate Service by {reviewBooking.providerName}
              </h3>
              <p className="text-gray-500 mb-4">
                Ref: {reviewBooking.bookingReference} · {reviewBooking.serviceTitle}
              </p>

              {reviewSuccess ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl font-medium text-center">
                  {reviewSuccess}
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Overall Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= rating
                                ? 'fill-[#D6B779] text-[#D6B779]'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Written Feedback & Workmanship Quality
                    </label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Comment on punctuality, diagnosis accuracy, tool precision, and polite behavior..."
                      className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-[#173D32]"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setReviewBooking(null)}
                      className="px-4 py-2 font-medium text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-semibold text-white bg-[#173D32] rounded-xl hover:bg-[#102B25]"
                    >
                      Publish Review
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Report Complaint */}
        {complaintBooking && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setComplaintBooking(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold font-serif-heading text-[#C84C4C] mb-1">
                Report Issue / File Complaint
              </h3>
              <p className="text-gray-500 mb-4">
                Ref: {complaintBooking.bookingReference} with {complaintBooking.providerName}
              </p>

              {complaintSuccess ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl font-medium text-center">
                  {complaintSuccess}
                </div>
              ) : (
                <form onSubmit={handleComplaintSubmit} className="space-y-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={complaintSubject}
                      onChange={(e) => setComplaintSubject(e.target.value)}
                      placeholder="e.g. Unexplained pricing surge, delay, or faulty part"
                      className="w-full p-2.5 rounded-lg border border-gray-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Detailed Explanation</label>
                    <textarea
                      rows={3}
                      value={complaintDesc}
                      onChange={(e) => setComplaintDesc(e.target.value)}
                      placeholder="Explain what occurred and how you would like platform administrators to resolve it..."
                      className="w-full p-2.5 rounded-lg border border-gray-300"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setComplaintBooking(null)}
                      className="px-4 py-2 font-medium text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-semibold text-white bg-[#C84C4C] rounded-xl hover:bg-[#b03b3b]"
                    >
                      Submit Complaint to Admin
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
