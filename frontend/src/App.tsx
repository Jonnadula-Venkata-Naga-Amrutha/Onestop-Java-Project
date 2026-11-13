import { useState, useEffect } from 'react';
import {
  Booking,
  ProviderProfile,
  Quotation,
  Review,
  User,
  UserRole,
  VerificationRequest,
  Complaint,
  AppNotification
} from './types';
import { dbService } from './services/storage';
import { Language } from './data/translations';
import { NLPSearchResult } from './services/aiEngine';

// Components
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ServiceCategories from './components/ServiceCategories';
import ServiceDiscovery from './components/ServiceDiscovery';
import LandingSections from './components/LandingSections';
import CustomerDashboard from './components/CustomerDashboard';
import ProviderDashboard from './components/ProviderDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProviderProfileModal from './components/ProviderProfileModal';
import BookingModal from './components/BookingModal';
import QuotationComparisonModal from './components/QuotationComparisonModal';
import EmergencyBookingModal from './components/EmergencyBookingModal';
import SmartAssistantDrawer from './components/SmartAssistantDrawer';
import JavaArchitectureModal from './components/JavaArchitectureModal';
import NotificationDrawer from './components/NotificationDrawer';

export default function App() {
  // Global Platform State
  const [currentUser, setCurrentUser] = useState<User>(dbService.getCurrentUser());
  const [lang, setLang] = useState<Language>('en');
  const [activeView, setActiveView] = useState<'landing' | 'discovery' | 'dashboard'>('landing');

  // Database Records
  const [providers, setProviders] = useState<ProviderProfile[]>(dbService.getProviders());
  const [categories, setCategories] = useState(dbService.getCategories());
  const [bookings, setBookings] = useState<Booking[]>(dbService.getBookings());
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>(dbService.getVerifications());
  const [complaints, setComplaints] = useState<Complaint[]>(dbService.getComplaints());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [users, setUsers] = useState<User[]>(dbService.getAllUsers());

  // Search Filter State for Discovery
  const [discoveryCategory, setDiscoveryCategory] = useState<string>('');
  const [discoveryCity, setDiscoveryCity] = useState<string>('');
  const [discoveryBudget, setDiscoveryBudget] = useState<number | undefined>(undefined);
  const [discoveryUrgent, setDiscoveryUrgent] = useState<boolean>(false);

  // Active Modals & Drawers
  const [selectedProfileProvider, setSelectedProfileProvider] = useState<ProviderProfile | null>(null);
  const [selectedBookingProvider, setSelectedBookingProvider] = useState<ProviderProfile | null>(null);
  const [comparisonBookingId, setComparisonBookingId] = useState<string | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isJavaModalOpen, setIsJavaModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const refreshState = () => {
    setCurrentUser(dbService.getCurrentUser());
    setProviders(dbService.getProviders());
    setCategories(dbService.getCategories());
    setBookings(dbService.getBookings());
    setVerifications(dbService.getVerifications());
    setComplaints(dbService.getComplaints());
    setUsers(dbService.getAllUsers());
    
    // Refresh quotes & reviews
    const allQuotes: Quotation[] = [];
    const allReviews: Review[] = [];
    dbService.getProviders().forEach(p => {
      allQuotes.push(...dbService.getQuotationsByProviderId(p.id));
      allReviews.push(...dbService.getReviewsByProviderId(p.id));
    });
    setQuotations(allQuotes);
    setReviews(allReviews);

    const notifs = dbService.getNotifications(dbService.getCurrentUser().id);
    setNotifications(notifs);
  };

  useEffect(() => {
    refreshState();
  }, []);

  // Role switching
  const handleSelectRole = (newRole: UserRole) => {
    const all = dbService.getAllUsers();
    let target = all.find(u => u.role === newRole);
    if (!target) {
      target = all[0];
    }
    dbService.setCurrentUser(target);
    setCurrentUser(target);
    setNotifications(dbService.getNotifications(target.id));
  };

  const handleToggleLang = () => {
    setLang(lang === 'en' ? 'te' : 'en');
  };

  // Natural Language Search Handler
  const handleNLPSearch = (res: NLPSearchResult) => {
    setDiscoveryCategory(res.extractedCategory || '');
    setDiscoveryCity(res.extractedCity || '');
    setDiscoveryBudget(res.maxBudget);
    setDiscoveryUrgent(res.isUrgent);
    setActiveView('discovery');
  };

  // Direct category card click
  const handleSelectCategory = (code: string) => {
    setDiscoveryCategory(code);
    setActiveView('discovery');
  };

  const currentProviderProfile = providers.find(p => p.userId === currentUser.id) || providers[0];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EF] text-[#252A28]">
      {/* 3-Zone Navigation Header */}
      <Navbar
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
        lang={lang}
        onToggleLang={handleToggleLang}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onOpenJavaCode={() => setIsJavaModalOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view as any)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'landing' && (
          <div>
            <HeroSection
              lang={lang}
              onSearch={handleNLPSearch}
              onExplore={() => setActiveView('discovery')}
              onEmergency={() => setIsEmergencyOpen(true)}
            />

            <ServiceCategories
              categories={categories}
              lang={lang}
              onSelectCategory={handleSelectCategory}
            />

            <LandingSections
              lang={lang}
              reviews={reviews}
              onExplore={() => setActiveView('discovery')}
              onOpenJavaCode={() => setIsJavaModalOpen(true)}
            />
          </div>
        )}

        {activeView === 'discovery' && (
          <ServiceDiscovery
            providers={providers}
            categories={categories}
            lang={lang}
            initialCategory={discoveryCategory}
            initialCity={discoveryCity}
            initialBudget={discoveryBudget}
            initialUrgent={discoveryUrgent}
            onBook={(prov) => setSelectedBookingProvider(prov)}
            onRequestQuote={(prov) => setSelectedBookingProvider(prov)}
            onViewProfile={(prov) => setSelectedProfileProvider(prov)}
          />
        )}

        {activeView === 'dashboard' && (
          <div>
            {currentUser.role === 'CUSTOMER' && (
              <CustomerDashboard
                currentUser={currentUser}
                bookings={bookings}
                quotations={quotations}
                reviews={reviews}
                lang={lang}
                onOpenCompareQuotes={(bookId) => setComparisonBookingId(bookId)}
                onExploreServices={() => setActiveView('discovery')}
                onRefreshData={refreshState}
              />
            )}

            {currentUser.role === 'PROVIDER' && (
              <ProviderDashboard
                currentUser={currentUser}
                provider={currentProviderProfile}
                bookings={bookings}
                quotations={quotations}
                lang={lang}
                onRefreshData={refreshState}
              />
            )}

            {currentUser.role === 'ADMIN' && (
              <AdminDashboard
                currentUser={currentUser}
                users={users}
                providers={providers}
                bookings={bookings}
                verifications={verifications}
                complaints={complaints}
                lang={lang}
                onRefreshData={refreshState}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals & Slide-in Drawers */}
      <ProviderProfileModal
        provider={selectedProfileProvider}
        reviews={reviews}
        lang={lang}
        onClose={() => setSelectedProfileProvider(null)}
        onBook={(p) => {
          setSelectedProfileProvider(null);
          setSelectedBookingProvider(p);
        }}
        onRequestQuote={(p) => {
          setSelectedProfileProvider(null);
          setSelectedBookingProvider(p);
        }}
      />

      <BookingModal
        provider={selectedBookingProvider}
        currentUser={currentUser}
        lang={lang}
        onClose={() => setSelectedBookingProvider(null)}
        onBookingCreated={() => {
          refreshState();
          setActiveView('dashboard');
        }}
      />

      {comparisonBookingId && (
        <QuotationComparisonModal
          bookingId={comparisonBookingId}
          quotations={quotations}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setComparisonBookingId(null)}
          onQuotationAccepted={() => {
            refreshState();
            setComparisonBookingId(null);
          }}
        />
      )}

      {isEmergencyOpen && (
        <EmergencyBookingModal
          providers={providers}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setIsEmergencyOpen(false)}
          onEmergencyDispatched={() => {
            refreshState();
            setActiveView('dashboard');
          }}
        />
      )}

      <SmartAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        lang={lang}
        onSelectCategory={handleSelectCategory}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onOpenJavaCode={() => setIsJavaModalOpen(true)}
      />

      <JavaArchitectureModal
        isOpen={isJavaModalOpen}
        onClose={() => setIsJavaModalOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        userId={currentUser.id}
        onRefreshData={refreshState}
      />
    </div>
  );
}
