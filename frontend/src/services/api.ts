import {
  AppNotification,
  AdminAuditLog,
  Booking,
  Complaint,
  Invoice,
  ProviderProfile,
  ProviderAvailability,
  Quotation,
  Review,
  ServiceCategory,
  User,
  UserRole,
  VerificationRequest,
} from '../types';

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let payload: ApiEnvelope<T>;
  try {
    payload = await response.json() as ApiEnvelope<T>;
  } catch {
    throw new Error(`The server returned an invalid response (${response.status}).`);
  }
  if (!response.ok || !payload.success) {
    if (response.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event('onestop:session-expired'));
    }
    throw new Error(payload.message || `Request failed (${response.status}).`);
  }
  return payload.data as T;
}

export const apiService = {
  me: () => request<User>('/auth/me'),
  login: (email: string, password: string) =>
    request<User>('/auth/login', 'POST', { email, password }),
  register: (input: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: UserRole;
    businessName?: string;
    city?: string;
    serviceCategories?: string[];
  }) => request<User>('/auth/register', 'POST', input),
  logout: () => request<unknown>('/auth/logout', 'POST', {}),
  categories: () => request<ServiceCategory[]>('/categories'),
  providers: () => request<ProviderProfile[]>('/providers'),
  bookings: () => request<Booking[]>('/bookings'),
  quotations: () => request<Quotation[]>('/quotations'),
  reviews: () => request<Review[]>('/reviews'),
  verifications: () => request<VerificationRequest[]>('/admin/verifications'),
  providerVerifications: () => request<VerificationRequest[]>('/provider/verifications'),
  providerAvailability: () => request<ProviderAvailability[]>('/provider/availability'),
  updateProviderProfile: (body: Record<string, unknown>) =>
    request<unknown>('/provider/profile', 'PATCH', body),
  updateProviderServices: (serviceCategories: string[]) =>
    request<unknown>('/provider/services', 'PUT', { serviceCategories }),
  updateProviderAreas: (city: string, localities: string[]) =>
    request<unknown>('/provider/areas', 'PUT', { city, localities }),
  updateProviderAvailability: (availability: ProviderAvailability[]) =>
    request<unknown>('/provider/availability', 'PUT', { availability }),
  submitVerification: (documentType: string, documentNumber: string) =>
    request<VerificationRequest>('/provider/verifications', 'POST', { documentType, documentNumber }),
  complaints: () => request<Complaint[]>('/complaints'),
  users: () => request<User[]>('/admin/users'),
  auditLogs: () => request<AdminAuditLog[]>('/admin/audit-logs'),
  updateUserStatus: (id: string, status: User['status']) =>
    request<unknown>(`/admin/users/${encodeURIComponent(id)}`, 'PATCH', { status }),
  notifications: () => request<AppNotification[]>('/notifications'),
  invoices: () => request<Invoice[]>('/invoices'),
  createBooking: (body: Record<string, unknown>) =>
    request<Booking>('/bookings', 'POST', body),
  updateBookingStatus: (id: string, status: string, reason: string) =>
    request<Booking>(`/bookings/${encodeURIComponent(id)}/status`, 'PATCH', { status, reason }),
  createQuotation: (body: Record<string, unknown>) =>
    request<Quotation>('/quotations', 'POST', body),
  acceptQuotation: (id: string) =>
    request<unknown>(`/quotations/${encodeURIComponent(id)}/accept`, 'POST', {}),
  declineQuotation: (id: string) =>
    request<unknown>(`/quotations/${encodeURIComponent(id)}/decline`, 'POST', {}),
  addReview: (body: Record<string, unknown>) =>
    request<Review>('/reviews', 'POST', body),
  createComplaint: (body: Record<string, unknown>) =>
    request<Complaint>('/complaints', 'POST', body),
  updateVerificationStatus: (id: string, status: string, reviewerNotes: string) =>
    request<unknown>(`/admin/verifications/${encodeURIComponent(id)}`, 'PATCH', { status, reviewerNotes }),
  resolveComplaint: (id: string, status: string, notes: string) =>
    request<unknown>(`/complaints/${encodeURIComponent(id)}`, 'PATCH', {
      status,
      adminResolutionNotes: notes,
    }),
  markNotificationRead: (id: string) =>
    request<unknown>(`/notifications/${encodeURIComponent(id)}/read`, 'PATCH', {}),
  markAllNotificationsRead: () => request<unknown>('/notifications/read-all', 'PATCH', {}),
};
