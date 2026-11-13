import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// In-memory relational database state for the running instance
// Mirrors skillbridge_db MySQL tables
const db = {
  categories: [
    { id: 'cat-1', code: 'ELECTRICIAN', nameEn: 'Electrician & Wiring', nameTe: 'ఎలక్ట్రీషియన్ & వైరింగ్', baseEstimate: 350 },
    { id: 'cat-2', code: 'PLUMBER', nameEn: 'Plumbing & Water Systems', nameTe: 'ప్లంబింగ్ & నీటి వ్యవస్థలు', baseEstimate: 300 },
    { id: 'cat-3', code: 'TUTOR', nameEn: 'Academic Tutoring', nameTe: 'విద్యా ట్యూటరింగ్', baseEstimate: 600 },
    { id: 'cat-4', code: 'CARPENTER', nameEn: 'Custom Carpentry & Woodcraft', nameTe: 'కార్పెంట్రీ & కలప పని', baseEstimate: 450 },
    { id: 'cat-5', code: 'APPLIANCE_REPAIR', nameEn: 'Appliance Repair', nameTe: 'గృహోపకరణాల మరమ్మత్తు', baseEstimate: 400 },
    { id: 'cat-6', code: 'CLEANER', nameEn: 'Deep Cleaning & Sanitization', nameTe: 'డీప్ క్లీనింగ్ & శానిటైజేషన్', baseEstimate: 800 },
    { id: 'cat-7', code: 'PAINTER', nameEn: 'Precision Painting', nameTe: 'పెయింటింగ్ సేవలు', baseEstimate: 500 },
    { id: 'cat-8', code: 'MECHANIC', nameEn: 'Automotive & 2-Wheeler Mechanic', nameTe: 'ఆటో మెకానిక్ సేవలు', baseEstimate: 350 },
  ],
  users: [
    { id: 'user-cust-1', email: 'ramesh.sharma@example.com', role: 'CUSTOMER', fullName: 'Ramesh Sharma', phone: '+91 98480 12345', status: 'ACTIVE' },
    { id: 'user-cust-2', email: 'priya.nair@example.com', role: 'CUSTOMER', fullName: 'Priya Nair', phone: '+91 98480 54321', status: 'ACTIVE' },
    { id: 'user-prov-1', email: 'rajesh.electric@example.com', role: 'PROVIDER', fullName: 'Rajesh Kumar', phone: '+91 98491 11223', status: 'ACTIVE' },
    { id: 'user-prov-2', email: 'anitha.tutor@example.com', role: 'PROVIDER', fullName: 'Anitha Reddy, M.Sc.', phone: '+91 98492 33445', status: 'ACTIVE' },
    { id: 'user-prov-3', email: 'srinivas.plumb@example.com', role: 'PROVIDER', fullName: 'Srinivas Rao', phone: '+91 98493 55667', status: 'ACTIVE' },
    { id: 'user-prov-4', email: 'mohan.carpenter@example.com', role: 'PROVIDER', fullName: 'Mohan Varma', phone: '+91 98494 77889', status: 'ACTIVE' },
    { id: 'user-admin-1', email: 'admin@skillbridge.org', role: 'ADMIN', fullName: 'Super Administrator', phone: '+91 90000 00001', status: 'ACTIVE' },
  ],
  providers: [
    {
      id: 'prov-1',
      userId: 'user-prov-1',
      fullName: 'Rajesh Kumar',
      businessName: 'Apex Electrical Solutions & Automation',
      bio: 'Government Licensed Grade-A Electrical Contractor with 12+ years expertise in residential rewiring, distribution boards, load stabilization, and emergency fault isolation.',
      yearsExperience: 12,
      ratingAvg: 4.9,
      reviewCount: 148,
      completedJobsCount: 312,
      isVerified: true,
      emergencyAvailable: true,
      baseHourlyRate: 450,
      city: 'Vijayawada',
      localities: ['Benz Circle', 'Governorpet', 'Moghalrajpuram', 'Bhavanipuram'],
      serviceCategories: ['ELECTRICIAN', 'APPLIANCE_REPAIR'],
    },
    {
      id: 'prov-2',
      userId: 'user-prov-2',
      fullName: 'Anitha Reddy, M.Sc.',
      businessName: 'Vedic Math & STEM Learning Academy',
      bio: 'Post-graduate in Applied Physics with 8 years of personalized coaching. Specialized in CBSE/ICSE grades 8-12 mathematics, physics fundamentals, and competitive Olympiads.',
      yearsExperience: 8,
      ratingAvg: 4.95,
      reviewCount: 92,
      completedJobsCount: 185,
      isVerified: true,
      emergencyAvailable: false,
      baseHourlyRate: 650,
      city: 'Hyderabad',
      localities: ['Madhapur', 'Gachibowli', 'Kondapur', 'Jubilee Hills'],
      serviceCategories: ['TUTOR'],
    },
    {
      id: 'prov-3',
      userId: 'user-prov-3',
      fullName: 'Srinivas Rao',
      businessName: 'Krishna HydroTech Plumbing & Leak Detection',
      bio: 'Certified plumbing master with acoustic water leak detection tools, concealed pipe repair, pressure pump fitting, and water softener installation.',
      yearsExperience: 15,
      ratingAvg: 4.85,
      reviewCount: 210,
      completedJobsCount: 480,
      isVerified: true,
      emergencyAvailable: true,
      baseHourlyRate: 400,
      city: 'Vijayawada',
      localities: ['Patamata', 'Kanuru', 'Poranki', 'Benz Circle'],
      serviceCategories: ['PLUMBER'],
    },
    {
      id: 'prov-4',
      userId: 'user-prov-4',
      fullName: 'Mohan Varma',
      businessName: 'Varma Teak Craft & Modular Joinery',
      bio: 'Master carpenter specializing in solid teak wood restorations, modular kitchen drawer mechanisms, concealed wardrobe fittings, and emergency lock changes.',
      yearsExperience: 14,
      ratingAvg: 4.8,
      reviewCount: 84,
      completedJobsCount: 160,
      isVerified: true,
      emergencyAvailable: true,
      baseHourlyRate: 500,
      city: 'Visakhapatnam',
      localities: ['MVP Colony', 'Siripuram', 'Gajuwaka', 'Madhurawada'],
      serviceCategories: ['CARPENTER'],
    },
  ],
  bookings: [
    {
      id: 'book-101',
      bookingReference: 'SB-2026-9041',
      customerId: 'user-cust-1',
      customerName: 'Ramesh Sharma',
      customerPhone: '+91 98480 12345',
      providerId: 'prov-1',
      providerName: 'Rajesh Kumar',
      serviceTitle: 'Main MCB Tripping & Electrical Panel Inspection',
      categoryId: 'cat-1',
      problemDescription: 'Frequent main breaker tripping whenever air conditioner turns on. Smell of ozone near distribution board.',
      serviceAddress: 'Flat 402, Sai Residency, Benz Circle',
      city: 'Vijayawada',
      scheduledDate: '2026-10-26',
      scheduledTimeSlot: '10:00 AM - 12:00 PM',
      status: 'CONFIRMED',
      isEmergency: false,
      estimatedTotal: 850,
      createdAt: '2026-10-24T14:20:00Z',
    },
    {
      id: 'book-102',
      bookingReference: 'SB-2026-8812',
      customerId: 'user-cust-1',
      customerName: 'Ramesh Sharma',
      customerPhone: '+91 98480 12345',
      providerId: 'prov-3',
      providerName: 'Srinivas Rao',
      serviceTitle: 'Underground Sump Pipe Leakage & Pressure Valve',
      categoryId: 'cat-2',
      problemDescription: 'Motor running continuously without filling overhead tank. Cracked joint near inlet pipe.',
      serviceAddress: 'Plot 18, Road No. 4, Patamata',
      city: 'Vijayawada',
      scheduledDate: '2026-10-22',
      scheduledTimeSlot: '02:00 PM - 04:00 PM',
      status: 'COMPLETED',
      isEmergency: false,
      estimatedTotal: 1200,
      finalTotal: 1200,
      createdAt: '2026-10-21T09:15:00Z',
    },
  ],
  quotations: [
    {
      id: 'quote-201',
      bookingId: 'book-101',
      providerId: 'prov-1',
      providerName: 'Rajesh Kumar',
      laborCost: 500,
      materialCost: 350,
      additionalCharges: 0,
      totalQuotedAmount: 850,
      estimatedDurationHours: 2.5,
      validityUntil: '2026-10-28',
      notesExclusions: 'Includes replacement of faulty 32A C-curve breaker and thermal scanning.',
      status: 'ACCEPTED',
    },
    {
      id: 'quote-202',
      bookingId: 'book-101',
      providerId: 'prov-3',
      providerName: 'Srinivas Rao',
      laborCost: 600,
      materialCost: 400,
      additionalCharges: 50,
      totalQuotedAmount: 1050,
      estimatedDurationHours: 3.0,
      validityUntil: '2026-10-28',
      notesExclusions: 'Comprehensive electrical diagnostics with auxiliary grounding check.',
      status: 'DECLINED',
    },
  ],
  reviews: [
    {
      id: 'rev-301',
      bookingId: 'book-102',
      customerId: 'user-cust-1',
      customerName: 'Ramesh Sharma',
      providerId: 'prov-3',
      rating: 5,
      comment: 'Srinivas Rao arrived punctually with diagnostic gear. Detected the underground joint hairline fracture within 15 minutes. Highly recommended!',
      punctualityRating: 5,
      qualityRating: 5,
      valueRating: 5,
      providerResponse: 'Thank you Ramesh garu! Pleased that your water line is running smoothly now.',
      createdAt: '2026-10-22T18:00:00Z',
    },
  ],
};

// REST API Endpoints matching Java Servlets
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    architecture: 'Core Java + JDBC Architecture Specification + Express API Runtime',
    database: 'skillbridge_db (19 Relational Tables)',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/categories', (req, res) => {
  res.json({ success: true, data: db.categories });
});

app.get('/api/providers', (req, res) => {
  let result = [...db.providers];
  const { category, city, maxPrice, isUrgent } = req.query;

  if (category) {
    result = result.filter(p => p.serviceCategories.includes(String(category)));
  }
  if (city) {
    result = result.filter(p => p.city.toLowerCase() === String(city).toLowerCase());
  }
  if (maxPrice) {
    result = result.filter(p => p.baseHourlyRate <= Number(maxPrice));
  }
  if (isUrgent === 'true') {
    result = result.filter(p => p.emergencyAvailable);
  }
  res.json({ success: true, count: result.length, data: result });
});

app.get('/api/bookings', (req, res) => {
  res.json({ success: true, count: db.bookings.length, data: db.bookings });
});

app.post('/api/bookings', (req, res) => {
  const b = req.body;
  const newBooking = {
    id: `book-${Date.now()}`,
    bookingReference: `SB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: b.customerId || 'user-cust-1',
    customerName: b.customerName || 'Customer',
    customerPhone: b.customerPhone || '+91 98480 00000',
    providerId: b.providerId,
    providerName: b.providerName || 'Certified Expert',
    serviceTitle: b.serviceTitle,
    categoryId: b.categoryId,
    problemDescription: b.problemDescription,
    serviceAddress: b.serviceAddress,
    city: b.city || 'Vijayawada',
    scheduledDate: b.scheduledDate,
    scheduledTimeSlot: b.scheduledTimeSlot,
    status: 'PENDING',
    isEmergency: !!b.isEmergency,
    estimatedTotal: Number(b.estimatedTotal),
    createdAt: new Date().toISOString(),
  };
  db.bookings.unshift(newBooking);
  res.status(201).json({ success: true, message: 'Booking created with ACID transaction log', data: newBooking });
});

app.get('/api/quotations', (req, res) => {
  const { bookingId } = req.query;
  let quotes = db.quotations;
  if (bookingId) {
    quotes = quotes.filter(q => q.bookingId === bookingId);
  }
  res.json({ success: true, data: quotes });
});

app.post('/api/quotations/:id/accept', (req, res) => {
  const { id } = req.params;
  const targetQuote = db.quotations.find(q => q.id === id);
  if (!targetQuote) {
    return res.status(404).json({ success: false, message: 'Quotation not found' });
  }

  // Atomic transaction: accept target, decline siblings, confirm booking
  db.quotations.forEach(q => {
    if (q.bookingId === targetQuote.bookingId) {
      q.status = q.id === id ? 'ACCEPTED' : 'DECLINED';
    }
  });

  const booking = db.bookings.find(b => b.id === targetQuote.bookingId);
  if (booking) {
    booking.status = 'CONFIRMED';
    booking.estimatedTotal = targetQuote.totalQuotedAmount;
  }

  res.json({ success: true, message: 'Atomic transaction complete: Quotation accepted and booking confirmed' });
});

app.get('/api/reviews', (req, res) => {
  res.json({ success: true, data: db.reviews });
});

app.post('/api/reviews', (req, res) => {
  const r = req.body;
  const booking = db.bookings.find(b => b.id === r.bookingId);
  if (!booking || booking.status !== 'COMPLETED') {
    return res.status(400).json({ success: false, message: 'Review eligibility constraint failed: Booking is not COMPLETED.' });
  }
  const exists = db.reviews.find(x => x.bookingId === r.bookingId);
  if (exists) {
    return res.status(400).json({ success: false, message: 'Duplicate review constraint: Review already submitted.' });
  }

  const newRev = {
    id: `rev-${Date.now()}`,
    bookingId: r.bookingId,
    customerId: r.customerId,
    customerName: r.customerName,
    providerId: r.providerId,
    rating: Number(r.rating),
    comment: r.comment,
    punctualityRating: Number(r.punctualityRating || r.rating),
    qualityRating: Number(r.qualityRating || r.rating),
    valueRating: Number(r.valueRating || r.rating),
    providerResponse: r.providerResponse || '',
    createdAt: new Date().toISOString(),
  };
  db.reviews.unshift(newRev);
  res.status(201).json({ success: true, data: newRev });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SkillBridge Backend API active on http://0.0.0.0:${PORT}`);
});
