import React, { useState } from 'react';
import { ProviderProfile, User } from '../types';
import { Language } from '../data/translations';
import { dbService } from '../services/storage';
import { X, Calendar, Clock, MapPin, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingModalProps {
  provider: ProviderProfile | null;
  currentUser: User;
  lang: Language;
  onClose: () => void;
  onBookingCreated: () => void;
}

export default function BookingModal({
  provider,
  currentUser,
  lang,
  onClose,
  onBookingCreated,
}: BookingModalProps) {
  if (!provider) return null;

  const [serviceTitle, setServiceTitle] = useState('Standard Inspection & Diagnostics');
  const [problemDescription, setProblemDescription] = useState('');
  const [serviceAddress, setServiceAddress] = useState('Benz Circle, Vijayawada');
  const [city, setCity] = useState(provider.city);
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [isEmergency, setIsEmergency] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const estimatedTotal = isEmergency
    ? provider.baseHourlyRate * 2 + 300
    : provider.baseHourlyRate * 1.5;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDescription.trim()) {
      setErrorMsg('Please describe the issue or service requirements.');
      return;
    }
    if (!serviceAddress.trim()) {
      setErrorMsg('Service address is required.');
      return;
    }

    const res = dbService.createBooking({
      customerId: currentUser.id,
      customerName: currentUser.fullName,
      customerPhone: currentUser.phone,
      providerId: provider.id,
      serviceTitle,
      categoryId: provider.serviceCategories[0] || 'ELECTRICIAN',
      problemDescription,
      serviceAddress,
      city,
      scheduledDate,
      scheduledTimeSlot: isEmergency ? 'Immediate Emergency Dispatch (Within 45 min)' : scheduledTimeSlot,
      isEmergency,
      estimatedTotal,
      photoUrl: photoPreview || undefined,
    });

    if (res.success) {
      setBookingRef(res.booking.bookingReference);
      setIsSuccess(true);
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
      onBookingCreated();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#173D32]/10 text-[#173D32] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold font-serif-heading text-[#173D32] mb-2">
              Booking Successfully Dispatched!
            </h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Your request has been registered in the database with reference{' '}
              <strong className="text-[#173D32] font-mono-code">{bookingRef}</strong>.
              {isEmergency
                ? ' The emergency technician has been alerted for priority arrival.'
                : ` ${provider.fullName} has received your booking details and will confirm your slot.`}
            </p>
            <div className="p-4 rounded-xl bg-[#F7F5EF] border border-[#173D32]/10 text-xs text-left max-w-sm mx-auto mb-6 space-y-1">
              <div><strong>Provider:</strong> {provider.fullName} ({provider.businessName})</div>
              <div><strong>Service:</strong> {serviceTitle}</div>
              <div><strong>Estimated Cost:</strong> ₹{estimatedTotal}</div>
              <div><strong>Date & Time:</strong> {isEmergency ? 'Immediate SOS (45 min)' : `${scheduledDate} (${scheduledTimeSlot})`}</div>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[#173D32] rounded-xl hover:bg-[#102B25] transition-all"
            >
              Go to Bookings Dashboard
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="text-xs font-semibold text-[#173D32] uppercase tracking-wider mb-1">
                Direct Appointment Booking
              </div>
              <h2 className="text-xl font-bold font-serif-heading text-[#173D32]">
                Book with {provider.fullName}
              </h2>
              <p className="text-xs text-gray-500">{provider.businessName} · ₹{provider.baseHourlyRate}/hr</p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Emergency SOS Toggle */}
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <div className="font-bold text-red-900">Mark as Emergency SOS Request</div>
                    <div className="text-[11px] text-red-700">Priority 45-minute dispatch (Standard emergency fee applies)</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded"
                />
              </div>

              {/* Service Selection */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Service Type</label>
                <select
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] bg-white text-xs"
                >
                  <option value="Standard Inspection & Diagnostics">Standard Inspection & Diagnostics</option>
                  <option value="Complete Circuit & MCB Overhaul">Complete Circuit & MCB Overhaul</option>
                  <option value="Wiring Repair & Replacement">Wiring Repair & Replacement</option>
                  <option value="Specialized Installation / Fitting">Specialized Installation / Fitting</option>
                  <option value="Urgent Fault Isolation">Urgent Fault Isolation</option>
                </select>
              </div>

              {/* Problem Description */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Problem Description & Instructions <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe what needs repair, symptoms, noise, or special access instructions..."
                  className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-[#173D32] focus:ring-1 focus:ring-[#173D32] text-xs"
                />
              </div>

              {/* Location & City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-[#173D32] text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Street Address / Flat No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={serviceAddress}
                    onChange={(e) => setServiceAddress(e.target.value)}
                    placeholder="e.g. Flat 302, Sai Heights, Benz Circle"
                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-[#173D32] text-xs"
                  />
                </div>
              </div>

              {/* Date & Time Slot (if not emergency) */}
              {!isEmergency && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-[#173D32] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Preferred Time Window</label>
                    <select
                      value={scheduledTimeSlot}
                      onChange={(e) => setScheduledTimeSlot(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 focus:border-[#173D32] bg-white text-xs"
                    >
                      <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                      <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                      <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                      <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                      <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Photo Upload Attachment */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Optional Photo of Problem Area
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#173D32]/10 file:text-[#173D32] hover:file:bg-[#173D32]/20"
                  />
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Upload preview"
                      className="w-10 h-10 rounded-lg object-cover border border-gray-300"
                    />
                  )}
                </div>
              </div>

              {/* Price Estimate Summary */}
              <div className="p-3 rounded-xl bg-[#F7F5EF] border border-[#173D32]/10 flex items-center justify-between">
                <div>
                  <span className="text-gray-500">Estimated Total:</span>
                  <div className="text-[11px] text-gray-400">Final price confirmed upon technician diagnosis</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono-code text-[#173D32] tabular-nums">
                    ₹{estimatedTotal}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  className="px-6 py-2.5 font-semibold text-white bg-[#173D32] hover:bg-[#102B25] rounded-xl shadow-sm transition-transform active:scale-95"
                >
                  Confirm & Submit Request
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
