import React, { useEffect, useState } from 'react';
import { Booking, BookingStatus, Invoice, ProviderAvailability, ProviderProfile, Quotation, ServiceCategory, User, VerificationRequest } from '../types';
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
  categories: ServiceCategory[];
  bookings: Booking[];
  quotations: Quotation[];
  invoices: Invoice[];
  verifications: VerificationRequest[];
  lang: Language;
  onRefreshData: () => void;
}

export default function ProviderDashboard({
  currentUser,
  provider,
  categories,
  bookings,
  quotations,
  invoices,
  verifications,
  lang,
  onRefreshData,
}: ProviderDashboardProps) {
  const providerBookings = bookings.filter(b => b.providerId === provider.id);
  const pendingRequests = providerBookings.filter(b => b.status === 'PENDING');
  const inProgressBookings = providerBookings.filter(b =>
    ['CONFIRMED', 'PROVIDER_ON_THE_WAY', 'IN_PROGRESS'].includes(b.status)
  );
  const completedJobs = providerBookings.filter(b => b.status === 'COMPLETED');

  const providerInvoices = invoices.filter(invoice => invoice.providerId === provider.id);
  const totalEarnings = providerInvoices
    .filter(invoice => invoice.paymentStatus === 'PAID')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const unpaidInvoices = providerInvoices
    .filter(invoice => invoice.paymentStatus === 'UNPAID')
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  // Quote drafting modal state
  const [quoteBooking, setQuoteBooking] = useState<Booking | null>(null);
  const [laborCost, setLaborCost] = useState(500);
  const [materialCost, setMaterialCost] = useState(300);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [estHours, setEstHours] = useState(2);
  const [validDays, setValidDays] = useState(7);
  const [notes, setNotes] = useState('Standard electrical diagnostics & branded breaker replacement included.');
  const [quoteSuccess, setQuoteSuccess] = useState('');
  const [documentType, setDocumentType] = useState<VerificationRequest['documentType']>('TRADE_LICENSE');
  const [documentNumber, setDocumentNumber] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [providerAvailability, setProviderAvailability] = useState<ProviderAvailability[]>(
    Array.from({ length: 7 }, (_, dayOfWeek) => ({
      id: `${provider.id}-${dayOfWeek}`,
      providerId: provider.id,
      dayOfWeek,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: false,
    }))
  );
  const [availabilityError, setAvailabilityError] = useState('');
  const [serviceCategories, setServiceCategories] = useState(provider.serviceCategories);
  const [localities, setLocalities] = useState(provider.localities.join(', '));

  useEffect(() => {
    void dbService.providerAvailability()
      .then(saved => {
        if (saved.length) {
          setProviderAvailability(Array.from({ length: 7 }, (_, dayOfWeek) =>
            saved.find(entry => entry.dayOfWeek === dayOfWeek) ?? {
              id: `${provider.id}-${dayOfWeek}`,
              providerId: provider.id,
              dayOfWeek,
              startTime: '09:00',
              endTime: '17:00',
              isAvailable: false,
            }
          ));
        }
      })
      .catch(reason => setAvailabilityError(reason instanceof Error ? reason.message : 'Availability could not be loaded.'));
  }, []);

  useEffect(() => {
    setServiceCategories(provider.serviceCategories);
    setLocalities(provider.localities.join(', '));
  }, [provider]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProfileError('');
    setProfileMessage('');
    try {
      await dbService.updateProviderProfile({
        fullName: form.get('fullName'),
        phone: form.get('phone'),
        businessName: form.get('businessName'),
        bio: form.get('bio'),
        yearsExperience: Number(form.get('yearsExperience')),
        baseHourlyRate: Number(form.get('baseHourlyRate')),
        city: form.get('city'),
        emergencyAvailable: form.get('emergencyAvailable') === 'on',
      });
      setProfileMessage('Provider profile saved.');
      onRefreshData();
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : 'Provider profile could not be saved.');
    }
  };

  const saveServices = async () => {
    setProfileError('');
    setProfileMessage('');
    try {
      await dbService.updateProviderServices(serviceCategories);
      setProfileMessage('Service categories saved.');
      onRefreshData();
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : 'Services could not be saved.');
    }
  };

  const saveAreas = async () => {
    setProfileError('');
    setProfileMessage('');
    try {
      await dbService.updateProviderAreas(provider.city, localities.split(',').map(value => value.trim()).filter(Boolean));
      setProfileMessage('Service areas saved.');
      onRefreshData();
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : 'Service areas could not be saved.');
    }
  };

  const saveAvailability = async () => {
    setAvailabilityError('');
    try {
      await dbService.updateProviderAvailability(providerAvailability);
      setAvailabilityError('');
      onRefreshData();
    } catch (reason) {
      setAvailabilityError(reason instanceof Error ? reason.message : 'Availability could not be saved.');
    }
  };

  const handleSubmitVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    setVerificationError('');
    setSubmittingVerification(true);
    try {
      await dbService.submitVerification(documentType, documentNumber);
      setDocumentNumber('');
      onRefreshData();
    } catch (reason) {
      setVerificationError(reason instanceof Error ? reason.message : 'Verification request could not be submitted.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteBooking) return;

    const validity = new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0];

    try {
      await dbService.createQuotation({
      bookingId: quoteBooking.id,
      laborCost: Number(laborCost),
      materialCost: Number(materialCost),
      additionalCharges: Number(additionalCharges),
      estimatedDurationHours: Number(estHours),
      validityUntil: validity,
      notesExclusions: notes,
      });
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
    } catch (reason) {
      alert(reason instanceof Error ? reason.message : 'Quotation could not be submitted.');
    }
  };

  const handleStatusTransition = async (bookingId: string, nextStatus: BookingStatus, reason: string) => {
    try {
      await dbService.updateBookingStatus(bookingId, nextStatus, reason);
      onRefreshData();
    } catch (reason) {
      alert(reason instanceof Error ? reason.message : 'Booking status could not be updated.');
    }
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/10 p-4 rounded-2xl border border-white/10 text-center text-xs">
            <div>
              <div className="text-stone-300">Recorded Revenue</div>
              <div className="text-lg font-bold font-mono-code text-[#D6B779] tabular-nums">
                ₹{totalEarnings}
              </div>
            </div>
            <div>
              <div className="text-stone-300">Unpaid Invoices</div>
              <div className="text-lg font-bold font-mono-code text-amber-200 tabular-nums">
                ₹{unpaidInvoices}
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

        <section className="mb-8 rounded-2xl bg-white border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-[#173D32] mb-2">Provider verification</h2>
          {verifications.map(request => (
            <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 border-b last:border-0 py-2 text-xs">
              <span>{request.documentType.replace(/_/g, ' ')} · {request.documentNumber}</span>
              <span className={request.status === 'APPROVED' ? 'text-emerald-700 font-semibold' : request.status === 'REJECTED' ? 'text-red-700 font-semibold' : 'text-amber-700 font-semibold'}>
                {request.status}
              </span>
              {request.reviewerNotes && <span className="w-full text-gray-500">{request.reviewerNotes}</span>}
            </div>
          ))}
          {!provider.isVerified && !verifications.some(request => request.status === 'PENDING') && (
            <form onSubmit={handleSubmitVerification} className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-xs text-gray-600">
                Document type
                <select value={documentType} onChange={event => setDocumentType(event.target.value as VerificationRequest['documentType'])}
                  className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 bg-white">
                  <option value="TRADE_LICENSE">Trade license</option>
                  <option value="CERTIFICATE">Certificate</option>
                </select>
              </label>
              <label className="flex-1 min-w-48 text-xs text-gray-600">
                Document number
                <input required value={documentNumber} onChange={event => setDocumentNumber(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2" />
              </label>
              <button disabled={submittingVerification}
                className="rounded-lg bg-[#173D32] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
                {submittingVerification ? 'Submitting...' : 'Submit for review'}
              </button>
              {verificationError && <p role="alert" className="w-full text-xs text-red-700">{verificationError}</p>}
              <p className="w-full text-[11px] text-gray-500">Only business license or professional certificate numbers are accepted. Document files are not uploaded by this form.</p>
            </form>
          )}
        </section>

        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-[#173D32]">Manage profile, services and schedule</h2>
          <form onSubmit={saveProfile} className="grid gap-3 md:grid-cols-2 text-xs">
            <label className="text-gray-600">Full name
              <input name="fullName" required maxLength={120} defaultValue={provider.fullName}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
            <label className="text-gray-600">Phone
              <input name="phone" required maxLength={32} defaultValue={provider.phone}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
            <label className="text-gray-600">Business name
              <input name="businessName" required maxLength={160} defaultValue={provider.businessName}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
            <label className="text-gray-600">City
              <input name="city" required maxLength={64} defaultValue={provider.city}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
            <label className="text-gray-600">Years of experience
              <input name="yearsExperience" type="number" min="0" max="60" required defaultValue={provider.yearsExperience}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
            <label className="text-gray-600">Base hourly rate (₹)
              <input name="baseHourlyRate" type="number" min="1" max="100000" step="0.01" required defaultValue={provider.baseHourlyRate}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
            <label className="text-gray-600 md:col-span-2">Business description
              <textarea name="bio" maxLength={2000} rows={2} defaultValue={provider.bio}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
            <label className="flex items-center gap-2 text-gray-700 md:col-span-2">
              <input type="checkbox" name="emergencyAvailable" defaultChecked={provider.emergencyAvailable} />
              Accept emergency requests
            </label>
            <button className="w-fit rounded-lg bg-[#173D32] px-4 py-2 font-semibold text-white">Save profile</button>
          </form>

          <div className="mt-6 grid gap-6 border-t border-gray-100 pt-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-bold text-[#173D32]">Services offered</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={serviceCategories.includes(category.code)}
                      onChange={() => setServiceCategories(current =>
                        current.includes(category.code)
                          ? current.filter(code => code !== category.code)
                          : [...current, category.code]
                      )} />
                    {category.nameEn}
                  </label>
                ))}
              </div>
              <button onClick={saveServices} className="mt-3 rounded-lg border border-[#173D32]/30 px-3 py-2 text-xs font-semibold text-[#173D32]">
                Save services
              </button>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-[#173D32]">Service area localities</h3>
              <label className="block text-xs text-gray-600">Comma-separated localities in {provider.city}
                <input value={localities} onChange={event => setLocalities(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
              </label>
              <button onClick={saveAreas} className="mt-3 rounded-lg border border-[#173D32]/30 px-3 py-2 text-xs font-semibold text-[#173D32]">
                Save service areas
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <h3 className="mb-3 text-sm font-bold text-[#173D32]">Weekly availability</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {providerAvailability.map((entry, index) => (
                <div key={entry.dayOfWeek} className="rounded-lg bg-[#F7F5EF] p-3 text-xs">
                  <label className="mb-2 flex items-center gap-2 font-semibold">
                    <input type="checkbox" checked={entry.isAvailable} onChange={event =>
                      setProviderAvailability(current => current.map((day, i) =>
                        i === index ? { ...day, isAvailable: event.target.checked } : day
                      ))} />
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][entry.dayOfWeek]}
                  </label>
                  <div className="flex gap-2">
                    <input aria-label="Start time" type="time" value={entry.startTime} onChange={event =>
                      setProviderAvailability(current => current.map((day, i) =>
                        i === index ? { ...day, startTime: event.target.value } : day
                      ))} className="min-w-0 rounded border px-1 py-1" />
                    <input aria-label="End time" type="time" value={entry.endTime} onChange={event =>
                      setProviderAvailability(current => current.map((day, i) =>
                        i === index ? { ...day, endTime: event.target.value } : day
                      ))} className="min-w-0 rounded border px-1 py-1" />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={saveAvailability} className="mt-3 rounded-lg bg-[#173D32] px-4 py-2 text-xs font-semibold text-white">
              Save availability
            </button>
            {availabilityError && <p role="alert" className="mt-2 text-xs text-red-700">{availabilityError}</p>}
          </div>
          {profileError && <p role="alert" className="mt-3 text-xs text-red-700">{profileError}</p>}
          {profileMessage && <p role="status" className="mt-3 text-xs text-emerald-700">{profileMessage}</p>}
        </section>

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
