export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export type BookingStatus =
  | 'PENDING'
  | 'QUOTE_SENT'
  | 'CONFIRMED'
  | 'PROVIDER_ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type QuotationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ComplaintStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  preferredLanguage: 'en' | 'te';
}

export interface ProviderProfile {
  id: string;
  userId: string;
  businessName: string;
  bio: string;
  yearsExperience: number;
  ratingAvg: number;
  reviewCount: number;
  completedJobsCount: number;
  isVerified: boolean;
  emergencyAvailable: boolean;
  baseHourlyRate: number;
  profileImageUrl: string;
  phone: string;
  email: string;
  fullName: string;
  serviceCategories: string[];
  city: string;
  localities: string[];
}

export interface ServiceCategory {
  id: string;
  code: string;
  nameEn: string;
  nameTe: string;
  description: string;
  iconName: string;
  baseEstimate: number;
  imageUrl: string;
}

export interface ProviderService {
  id: string;
  providerId: string;
  categoryId: string;
  serviceTitle: string;
  description: string;
  priceType: 'FIXED' | 'HOURLY';
  price: number;
  isActive: boolean;
}

export interface ProviderAvailability {
  id: string;
  providerId: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  bookingReference: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  providerId: string;
  providerName: string;
  providerBusiness: string;
  serviceId: string;
  serviceTitle: string;
  categoryId: string;
  categoryName: string;
  problemDescription: string;
  serviceAddress: string;
  city: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  status: BookingStatus;
  isEmergency: boolean;
  estimatedTotal: number;
  finalTotal?: number;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: BookingStatusHistory[];
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  fromStatus: BookingStatus | 'INITIAL';
  toStatus: BookingStatus;
  changeReason: string;
  changedByUserId: string;
  changedByName: string;
  changedAt: string;
}

export interface Quotation {
  id: string;
  bookingId: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  providerExperience: number;
  laborCost: number;
  materialCost: number;
  additionalCharges: number;
  totalQuotedAmount: number;
  estimatedDurationHours: number;
  validityUntil: string;
  notesExclusions: string;
  status: QuotationStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  providerId: string;
  rating: number; // 1-5
  comment: string;
  punctualityRating: number;
  qualityRating: number;
  valueRating: number;
  providerResponse?: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  customerId: string;
  providerId: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'QUOTATION' | 'STATUS_CHANGE' | 'REVIEW' | 'VERIFICATION' | 'SYSTEM';
  relatedBookingId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  providerId: string;
  providerName: string;
  businessName: string;
  documentType: 'TRADE_LICENSE' | 'AADHAAR' | 'GOVT_ID' | 'CERTIFICATE';
  documentNumber: string;
  documentFileUrl: string;
  status: VerificationStatus;
  reviewerNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface Complaint {
  id: string;
  bookingId: string;
  bookingReference: string;
  filedByUserId: string;
  filedByName: string;
  againstUserId: string;
  againstName: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  adminResolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  customerName: string;
  providerBusiness: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  issuedAt: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  adminName: string;
  actionType: string;
  entityName: string;
  entityId: string;
  changeSummary: string;
  ipAddress: string;
  createdAt: string;
}

export interface AIScoringBreakdown {
  totalScore: number; // 0 - 100
  serviceRelevanceScore: number; // 30% weight
  locationScore: number;         // 20% weight
  availabilityScore: number;     // 20% weight
  priceScore: number;            // 15% weight
  ratingScore: number;           // 10% weight
  experienceScore: number;       // 5% weight
  matchReasons: string[];
}
