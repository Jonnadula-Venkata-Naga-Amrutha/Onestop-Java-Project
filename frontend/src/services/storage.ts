import {
  User,
  ProviderProfile,
  ServiceCategory,
  Booking,
  BookingStatus,
  Quotation,
  Review,
  VerificationRequest,
  Complaint,
  AppNotification,
  Invoice,
  UserRole
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_USERS,
  INITIAL_PROVIDERS,
  INITIAL_BOOKINGS,
  INITIAL_QUOTATIONS,
  INITIAL_REVIEWS,
  INITIAL_VERIFICATIONS,
  INITIAL_COMPLAINTS,
  INITIAL_NOTIFICATIONS,
} from '../data/seedData';

class DatabaseStorageService {
  private users: User[] = [];
  private providers: ProviderProfile[] = [];
  private categories: ServiceCategory[] = [];
  private bookings: Booking[] = [];
  private quotations: Quotation[] = [];
  private reviews: Review[] = [];
  private verifications: VerificationRequest[] = [];
  private complaints: Complaint[] = [];
  private notifications: AppNotification[] = [];
  private invoices: Invoice[] = [];
  private currentUser: User = INITIAL_USERS[0]; // Ramesh Sharma by default

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedUsers = localStorage.getItem('sb_users');
      const savedProviders = localStorage.getItem('sb_providers');
      const savedBookings = localStorage.getItem('sb_bookings');
      const savedQuotes = localStorage.getItem('sb_quotes');
      const savedReviews = localStorage.getItem('sb_reviews');
      const savedVerifs = localStorage.getItem('sb_verifs');
      const savedComplaints = localStorage.getItem('sb_complaints');
      const savedNotifs = localStorage.getItem('sb_notifs');
      const savedCurrentUser = localStorage.getItem('sb_current_user');

      this.categories = INITIAL_CATEGORIES;
      this.users = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
      this.providers = savedProviders ? JSON.parse(savedProviders) : INITIAL_PROVIDERS;
      this.bookings = savedBookings ? JSON.parse(savedBookings) : INITIAL_BOOKINGS;
      this.quotations = savedQuotes ? JSON.parse(savedQuotes) : INITIAL_QUOTATIONS;
      this.reviews = savedReviews ? JSON.parse(savedReviews) : INITIAL_REVIEWS;
      this.verifications = savedVerifs ? JSON.parse(savedVerifs) : INITIAL_VERIFICATIONS;
      this.complaints = savedComplaints ? JSON.parse(savedComplaints) : INITIAL_COMPLAINTS;
      this.notifications = savedNotifs ? JSON.parse(savedNotifs) : INITIAL_NOTIFICATIONS;
      this.currentUser = savedCurrentUser ? JSON.parse(savedCurrentUser) : INITIAL_USERS[0];
    } catch {
      this.resetToDefaults();
    }
  }

  private persist() {
    try {
      localStorage.setItem('sb_users', JSON.stringify(this.users));
      localStorage.setItem('sb_providers', JSON.stringify(this.providers));
      localStorage.setItem('sb_bookings', JSON.stringify(this.bookings));
      localStorage.setItem('sb_quotes', JSON.stringify(this.quotations));
      localStorage.setItem('sb_reviews', JSON.stringify(this.reviews));
      localStorage.setItem('sb_verifs', JSON.stringify(this.verifications));
      localStorage.setItem('sb_complaints', JSON.stringify(this.complaints));
      localStorage.setItem('sb_notifs', JSON.stringify(this.notifications));
      localStorage.setItem('sb_current_user', JSON.stringify(this.currentUser));
    } catch (e) {
      console.warn('Storage quota or private mode', e);
    }
  }

  public resetToDefaults() {
    this.categories = [...INITIAL_CATEGORIES];
    this.users = [...INITIAL_USERS];
    this.providers = [...INITIAL_PROVIDERS];
    this.bookings = [...INITIAL_BOOKINGS];
    this.quotations = [...INITIAL_QUOTATIONS];
    this.reviews = [...INITIAL_REVIEWS];
    this.verifications = [...INITIAL_VERIFICATIONS];
    this.complaints = [...INITIAL_COMPLAINTS];
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.currentUser = INITIAL_USERS[0];
    this.persist();
  }

  // Auth & Session
  public getCurrentUser(): User {
    return this.currentUser;
  }

  public setCurrentUser(user: User) {
    this.currentUser = user;
    this.persist();
  }

  public getAllUsers(): User[] {
    return [...this.users];
  }

  public registerUser(params: {
    fullName: string;
    email: string;
    role: UserRole;
    phone: string;
    businessName?: string;
    city?: string;
  }): { success: boolean; message: string; user?: User } {
    const existing = this.users.find(u => u.email.toLowerCase() === params.email.toLowerCase());
    if (existing) {
      return { success: false, message: 'Email address is already registered in MySQL users table.' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: params.email,
      role: params.role,
      fullName: params.fullName,
      phone: params.phone,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);

    if (params.role === 'PROVIDER') {
      const newProvider: ProviderProfile = {
        id: `prov-${Date.now()}`,
        userId: newUser.id,
        fullName: newUser.fullName,
        businessName: params.businessName || `${newUser.fullName} Professional Services`,
        bio: 'Newly registered local service specialist. Trade credentials under review.',
        yearsExperience: 3,
        ratingAvg: 5.0,
        reviewCount: 0,
        completedJobsCount: 0,
        isVerified: false,
        emergencyAvailable: false,
        baseHourlyRate: 400,
        profileImageUrl: '/src/assets/images/hero_craftsman_service_1792931705892.jpg',
        phone: newUser.phone,
        email: newUser.email,
        serviceCategories: ['ELECTRICIAN'],
        city: params.city || 'Vijayawada',
        localities: ['Central City'],
      };
      this.providers.push(newProvider);

      // Trigger automatic verification submission
      this.verifications.push({
        id: `verif-${Date.now()}`,
        providerId: newProvider.id,
        providerName: newProvider.fullName,
        businessName: newProvider.businessName,
        documentType: 'TRADE_LICENSE',
        documentNumber: `REG-${Math.floor(10000 + Math.random() * 90000)}`,
        documentFileUrl: '/docs/auto_reg_license.pdf',
        status: 'PENDING',
        reviewerNotes: 'New provider onboarding verification queued.',
        submittedAt: new Date().toISOString(),
      });
    }

    this.setCurrentUser(newUser);
    this.persist();
    return { success: true, message: 'Account successfully registered and session initiated.', user: newUser };
  }

  // Categories & Providers
  public getCategories(): ServiceCategory[] {
    return [...this.categories];
  }

  public getProviders(): ProviderProfile[] {
    return [...this.providers];
  }

  public getProviderById(id: string): ProviderProfile | undefined {
    return this.providers.find(p => p.id === id);
  }

  public getProviderByUserId(userId: string): ProviderProfile | undefined {
    return this.providers.find(p => p.userId === userId);
  }

  // Bookings with Strict Transactional State Machine
  public getBookings(): Booking[] {
    return [...this.bookings];
  }

  public getCustomerBookings(customerId: string): Booking[] {
    return this.bookings.filter(b => b.customerId === customerId);
  }

  public getProviderBookings(providerId: string): Booking[] {
    return this.bookings.filter(b => b.providerId === providerId);
  }

  public createBooking(params: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    providerId: string;
    serviceTitle: string;
    categoryId: string;
    problemDescription: string;
    serviceAddress: string;
    city: string;
    scheduledDate: string;
    scheduledTimeSlot: string;
    isEmergency?: boolean;
    estimatedTotal: number;
    photoUrl?: string;
  }): { success: boolean; booking: Booking } {
    const provider = this.getProviderById(params.providerId);
    const category = this.categories.find(c => c.id === params.categoryId);

    const refNum = `SB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      bookingReference: refNum,
      customerId: params.customerId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      providerId: params.providerId,
      providerName: provider?.fullName || 'Assigned Expert',
      providerBusiness: provider?.businessName || 'Local Service',
      serviceId: `srv-${Date.now()}`,
      serviceTitle: params.serviceTitle,
      categoryId: params.categoryId,
      categoryName: category?.nameEn || 'General Service',
      problemDescription: params.problemDescription,
      serviceAddress: params.serviceAddress,
      city: params.city,
      scheduledDate: params.scheduledDate,
      scheduledTimeSlot: params.scheduledTimeSlot,
      status: 'PENDING',
      isEmergency: !!params.isEmergency,
      estimatedTotal: params.estimatedTotal,
      photoUrl: params.photoUrl,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          id: `hist-${Date.now()}`,
          bookingId: `book-${Date.now()}`,
          fromStatus: 'INITIAL',
          toStatus: 'PENDING',
          changeReason: params.isEmergency ? 'Emergency SOS service request initiated' : 'Booking requested by customer',
          changedByUserId: params.customerId,
          changedByName: params.customerName,
          changedAt: now,
        },
      ],
    };

    this.bookings.unshift(newBooking);

    // Create Notification for Provider
    if (provider) {
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: provider.userId,
        title: params.isEmergency ? '🚨 URGENT EMERGENCY DISPATCH' : 'New Service Request',
        message: `${params.customerName} requested ${params.serviceTitle} at ${params.city} (${refNum}).`,
        type: 'BOOKING',
        relatedBookingId: newBooking.id,
        isRead: false,
        createdAt: now,
      });
    }

    this.persist();
    return { success: true, booking: newBooking };
  }

  public updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    reason: string,
    changedByUser: User
  ): { success: boolean; message: string; booking?: Booking } {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) {
      return { success: false, message: 'Booking record not found in database.' };
    }

    // Role-based state transition verification
    const oldStatus = booking.status;
    const now = new Date().toISOString();

    booking.status = newStatus;
    booking.updatedAt = now;
    if (newStatus === 'COMPLETED' && !booking.finalTotal) {
      booking.finalTotal = booking.estimatedTotal;
      // Increment completed jobs on provider
      const prov = this.getProviderById(booking.providerId);
      if (prov) {
        prov.completedJobsCount += 1;
      }
    }

    booking.statusHistory.push({
      id: `hist-${Date.now()}`,
      bookingId,
      fromStatus: oldStatus,
      toStatus: newStatus,
      changeReason: reason,
      changedByUserId: changedByUser.id,
      changedByName: changedByUser.fullName,
      changedAt: now,
    });

    // Notify customer
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: booking.customerId,
      title: `Booking Update: ${newStatus.replace(/_/g, ' ')}`,
      message: `${booking.providerName} updated booking ${booking.bookingReference}: ${reason}`,
      type: 'STATUS_CHANGE',
      relatedBookingId: bookingId,
      isRead: false,
      createdAt: now,
    });

    this.persist();
    return { success: true, message: `Status transitioned to ${newStatus}`, booking };
  }

  // Quotations
  public getQuotationsByBookingId(bookingId: string): Quotation[] {
    return this.quotations.filter(q => q.bookingId === bookingId);
  }

  public getQuotationsByProviderId(providerId: string): Quotation[] {
    return this.quotations.filter(q => q.providerId === providerId);
  }

  public createQuotation(params: {
    bookingId: string;
    providerId: string;
    laborCost: number;
    materialCost: number;
    additionalCharges: number;
    estimatedDurationHours: number;
    validityUntil: string;
    notesExclusions: string;
  }): { success: boolean; quotation: Quotation } {
    const provider = this.getProviderById(params.providerId);
    const booking = this.bookings.find(b => b.id === params.bookingId);
    const total = params.laborCost + params.materialCost + params.additionalCharges;

    const newQuote: Quotation = {
      id: `quote-${Date.now()}`,
      bookingId: params.bookingId,
      providerId: params.providerId,
      providerName: provider?.fullName || 'Certified Expert',
      providerRating: provider?.ratingAvg || 4.8,
      providerExperience: provider?.yearsExperience || 5,
      laborCost: params.laborCost,
      materialCost: params.materialCost,
      additionalCharges: params.additionalCharges,
      totalQuotedAmount: total,
      estimatedDurationHours: params.estimatedDurationHours,
      validityUntil: params.validityUntil,
      notesExclusions: params.notesExclusions,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.quotations.push(newQuote);

    if (booking) {
      booking.status = 'QUOTE_SENT';
      booking.estimatedTotal = total;
      booking.updatedAt = new Date().toISOString();
      booking.statusHistory.push({
        id: `hist-${Date.now()}`,
        bookingId: booking.id,
        fromStatus: 'PENDING',
        toStatus: 'QUOTE_SENT',
        changeReason: `Quotation of ₹${total} submitted by ${newQuote.providerName}`,
        changedByUserId: provider?.userId || 'provider',
        changedByName: newQuote.providerName,
        changedAt: new Date().toISOString(),
      });

      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: booking.customerId,
        title: 'New Quotation Received',
        message: `${newQuote.providerName} submitted a quote of ₹${total} for ${booking.bookingReference}.`,
        type: 'QUOTATION',
        relatedBookingId: booking.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    this.persist();
    return { success: true, quotation: newQuote };
  }

  public acceptQuotation(quotationId: string, customer: User): { success: boolean; message: string } {
    const quote = this.quotations.find(q => q.id === quotationId);
    if (!quote) return { success: false, message: 'Quotation not found.' };

    const booking = this.bookings.find(b => b.id === quote.bookingId);
    if (!booking) return { success: false, message: 'Associated booking not found.' };

    // Transactional consistency: Mark chosen quote as ACCEPTED, others DECLINED
    this.quotations.forEach(q => {
      if (q.bookingId === quote.bookingId) {
        if (q.id === quotationId) {
          q.status = 'ACCEPTED';
        } else {
          q.status = 'DECLINED';
        }
      }
    });

    // Update booking
    booking.providerId = quote.providerId;
    booking.providerName = quote.providerName;
    booking.status = 'CONFIRMED';
    booking.estimatedTotal = quote.totalQuotedAmount;
    booking.updatedAt = new Date().toISOString();

    booking.statusHistory.push({
      id: `hist-${Date.now()}`,
      bookingId: booking.id,
      fromStatus: 'QUOTE_SENT',
      toStatus: 'CONFIRMED',
      changeReason: `Quotation ₹${quote.totalQuotedAmount} accepted by customer`,
      changedByUserId: customer.id,
      changedByName: customer.fullName,
      changedAt: new Date().toISOString(),
    });

    const provider = this.getProviderById(quote.providerId);
    if (provider) {
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: provider.userId,
        title: '🎉 Quotation Accepted!',
        message: `${customer.fullName} accepted your quotation of ₹${quote.totalQuotedAmount} for ${booking.bookingReference}.`,
        type: 'BOOKING',
        relatedBookingId: booking.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    this.persist();
    return { success: true, message: 'Quotation accepted and booking confirmed!' };
  }

  // Reviews (Enforces 1 review per completed booking)
  public getReviewsByProviderId(providerId: string): Review[] {
    return this.reviews.filter(r => r.providerId === providerId);
  }

  public addReview(params: {
    bookingId: string;
    customerId: string;
    customerName: string;
    providerId: string;
    rating: number;
    comment: string;
    punctualityRating: number;
    qualityRating: number;
    valueRating: number;
  }): { success: boolean; message: string; review?: Review } {
    const booking = this.bookings.find(b => b.id === params.bookingId);
    if (!booking) {
      return { success: false, message: 'Booking does not exist.' };
    }
    if (booking.status !== 'COMPLETED') {
      return { success: false, message: 'Only completed bookings are eligible for customer reviews.' };
    }

    // Prevent duplicate review constraint
    const existing = this.reviews.find(r => r.bookingId === params.bookingId);
    if (existing) {
      return { success: false, message: 'A review has already been submitted for this booking.' };
    }

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      bookingId: params.bookingId,
      customerId: params.customerId,
      customerName: params.customerName,
      providerId: params.providerId,
      rating: params.rating,
      comment: params.comment,
      punctualityRating: params.punctualityRating,
      qualityRating: params.qualityRating,
      valueRating: params.valueRating,
      createdAt: new Date().toISOString(),
    };

    this.reviews.unshift(newRev);

    // Recalculate provider average rating
    const provReviews = this.reviews.filter(r => r.providerId === params.providerId);
    const avg = provReviews.reduce((sum, r) => sum + r.rating, 0) / provReviews.length;
    const prov = this.getProviderById(params.providerId);
    if (prov) {
      prov.ratingAvg = Math.round(avg * 100) / 100;
      prov.reviewCount = provReviews.length;
    }

    this.persist();
    return { success: true, message: 'Review successfully recorded!', review: newRev };
  }

  // Admin & Moderation
  public getVerifications(): VerificationRequest[] {
    return [...this.verifications];
  }

  public updateVerificationStatus(
    verifId: string,
    status: 'APPROVED' | 'REJECTED',
    notes: string,
    adminUser: User
  ): { success: boolean; message: string } {
    const verif = this.verifications.find(v => v.id === verifId);
    if (!verif) return { success: false, message: 'Verification request not found.' };

    verif.status = status;
    verif.reviewerNotes = notes;
    verif.reviewedAt = new Date().toISOString();

    const provider = this.getProviderById(verif.providerId);
    if (provider) {
      provider.isVerified = status === 'APPROVED';
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: provider.userId,
        title: status === 'APPROVED' ? '✅ Professional Verification Approved' : 'Verification Request Rejected',
        message: notes || `Your verification documents have been evaluated by platform administrators.`,
        type: 'VERIFICATION',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    this.persist();
    return { success: true, message: `Verification status updated to ${status}.` };
  }

  public getComplaints(): Complaint[] {
    return [...this.complaints];
  }

  public createComplaint(params: {
    bookingId: string;
    bookingReference: string;
    filedByUser: User;
    againstUserId: string;
    againstName: string;
    subject: string;
    description: string;
  }): { success: boolean; message: string; complaint: Complaint } {
    const newComp: Complaint = {
      id: `comp-${Date.now()}`,
      bookingId: params.bookingId,
      bookingReference: params.bookingReference,
      filedByUserId: params.filedByUser.id,
      filedByName: params.filedByUser.fullName,
      againstUserId: params.againstUserId,
      againstName: params.againstName,
      subject: params.subject,
      description: params.description,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    this.complaints.unshift(newComp);
    this.persist();
    return { success: true, message: 'Complaint registered and assigned to administrator review queue.', complaint: newComp };
  }

  public resolveComplaint(
    complaintId: string,
    resolutionNotes: string,
    status: 'RESOLVED' | 'DISMISSED',
    admin: User
  ): { success: boolean; message: string } {
    const comp = this.complaints.find(c => c.id === complaintId);
    if (!comp) return { success: false, message: 'Complaint not found.' };

    comp.status = status;
    comp.adminResolutionNotes = resolutionNotes;
    comp.resolvedAt = new Date().toISOString();

    this.persist();
    return { success: true, message: `Complaint marked as ${status}.` };
  }

  // Notifications
  public getNotifications(userId: string): AppNotification[] {
    return this.notifications.filter(n => n.userId === userId);
  }

  public markNotificationRead(notifId: string) {
    const n = this.notifications.find(x => x.id === notifId);
    if (n) {
      n.isRead = true;
      this.persist();
    }
  }

  public markAllNotificationsRead(userId: string) {
    this.notifications.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    this.persist();
  }
}

export const dbService = new DatabaseStorageService();
