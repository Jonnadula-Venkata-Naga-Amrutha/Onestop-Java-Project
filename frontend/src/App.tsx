import { useEffect, useState } from 'react';
import {
  AppNotification,
  AdminAuditLog,
  Booking,
  Complaint,
  Invoice,
  ProviderProfile,
  Quotation,
  Review,
  ServiceCategory,
  User,
  VerificationRequest,
} from './types';
import { dbService } from './services/storage';
import { Language } from './data/translations';
import { NLPSearchResult } from './services/aiEngine';

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
import AuthModal from './components/AuthModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [activeView, setActiveView] = useState<'landing' | 'discovery' | 'dashboard'>('landing');
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const [discoveryCategory, setDiscoveryCategory] = useState('');
  const [discoveryCity, setDiscoveryCity] = useState('');
  const [discoveryBudget, setDiscoveryBudget] = useState<number | undefined>();
  const [discoveryUrgent, setDiscoveryUrgent] = useState(false);

  const [selectedProfileProvider, setSelectedProfileProvider] = useState<ProviderProfile | null>(null);
  const [selectedBookingProvider, setSelectedBookingProvider] = useState<ProviderProfile | null>(null);
  const [comparisonBookingId, setComparisonBookingId] = useState<string | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isJavaModalOpen, setIsJavaModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const refreshState = async (user = currentUser) => {
    try {
      const [nextProviders, nextCategories, nextReviews] = await Promise.all([
        dbService.providers(),
        dbService.categories(),
        dbService.reviews(),
      ]);
      setProviders(nextProviders);
      setCategories(nextCategories);
      setReviews(nextReviews);
      if (!user) {
        setBookings([]);
        setQuotations([]);
        setVerifications([]);
        setComplaints([]);
        setNotifications([]);
        setInvoices([]);
        setUsers([]);
        setAuditLogs([]);
        setErrorMessage('');
        return;
      }

      const [nextBookings, nextQuotes, nextNotifications, nextInvoices] = await Promise.all([
        dbService.bookings(),
        dbService.quotations(),
        dbService.notifications(),
        dbService.invoices(),
      ]);
      setBookings(nextBookings);
      setQuotations(nextQuotes);
      setNotifications(nextNotifications);
      setInvoices(nextInvoices);
      if (user.role === 'ADMIN') {
        const [nextVerifications, nextComplaints, nextUsers, nextAuditLogs] = await Promise.all([
          dbService.verifications(),
          dbService.complaints(),
          dbService.users(),
          dbService.auditLogs(),
        ]);
        setVerifications(nextVerifications);
        setComplaints(nextComplaints);
        setUsers(nextUsers);
        setAuditLogs(nextAuditLogs);
      } else if (user.role === 'PROVIDER') {
        setVerifications(await dbService.providerVerifications());
        setComplaints([]);
        setUsers([]);
        setAuditLogs([]);
      } else {
        setVerifications([]);
        setComplaints([]);
        setUsers([]);
        setAuditLogs([]);
      }
      setErrorMessage('');
    } catch (reason) {
      setErrorMessage(reason instanceof Error ? reason.message : 'Unable to load application data.');
    }
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null);
      setActiveView('landing');
      setIsAuthOpen(true);
      setErrorMessage('Your session expired. Sign in again to continue.');
      void refreshState(null);
    };
    window.addEventListener('onestop:session-expired', handleSessionExpired);
    const initialize = async () => {
      try {
        const user = await dbService.me();
        setCurrentUser(user);
        await refreshState(user);
      } catch (reason) {
        if (!(reason instanceof Error) || reason.message !== 'Not signed in.') {
          setErrorMessage(reason instanceof Error ? reason.message : 'Unable to restore the current session.');
        }
        await refreshState(null);
      } finally {
        setIsInitializing(false);
      }
    };
    void initialize();
    return () => window.removeEventListener('onestop:session-expired', handleSessionExpired);
  }, []);

  const handleAuthenticated = async (user: User) => {
    setCurrentUser(user);
    setIsAuthOpen(false);
    setActiveView('dashboard');
    await refreshState(user);
  };

  const handleLogout = async () => {
    try {
      await dbService.logout();
      setCurrentUser(null);
      setActiveView('landing');
      await refreshState(null);
    } catch (reason) {
      setErrorMessage(reason instanceof Error ? reason.message : 'Sign out failed.');
    }
  };

  const handleToggleLang = () => setLang(lang === 'en' ? 'te' : 'en');

  const handleNLPSearch = (result: NLPSearchResult) => {
    setDiscoveryCategory(result.extractedCategory || '');
    setDiscoveryCity(result.extractedCity || '');
    setDiscoveryBudget(result.maxBudget);
    setDiscoveryUrgent(result.isUrgent);
    setActiveView('discovery');
  };

  const handleSelectCategory = (code: string) => {
    setDiscoveryCategory(code);
    setActiveView('discovery');
  };

  const openBooking = (provider: ProviderProfile) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setSelectedBookingProvider(provider);
  };

  const currentProviderProfile = currentUser
    ? providers.find(provider => provider.userId === currentUser.id)
    : undefined;
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5EF] text-[#252A28]">
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        lang={lang}
        onToggleLang={handleToggleLang}
        unreadCount={unreadCount}
        onOpenNotifications={() => currentUser ? setIsNotificationsOpen(true) : setIsAuthOpen(true)}
        onOpenEmergency={() => currentUser ? setIsEmergencyOpen(true) : setIsAuthOpen(true)}
        onOpenJavaCode={() => setIsJavaModalOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        activeView={activeView}
        onNavigate={view => {
          if (view === 'dashboard' && !currentUser) {
            setIsAuthOpen(true);
          } else {
            setActiveView(view as 'landing' | 'discovery' | 'dashboard');
          }
        }}
      />

      {errorMessage && (
        <div role="alert" className="mx-auto mt-3 max-w-7xl px-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {isInitializing && (
        <div role="status" className="mx-auto mt-3 max-w-7xl px-4 text-sm text-gray-600">
          Loading ONESTOP session and service data...
        </div>
      )}

      <main className="flex-1">
        {activeView === 'landing' && (
          <div>
            <HeroSection
              lang={lang}
              onSearch={handleNLPSearch}
              onExplore={() => setActiveView('discovery')}
              onEmergency={() => currentUser ? setIsEmergencyOpen(true) : setIsAuthOpen(true)}
            />
            <ServiceCategories categories={categories} lang={lang} onSelectCategory={handleSelectCategory} />
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
            onBook={openBooking}
            onRequestQuote={openBooking}
            onViewProfile={setSelectedProfileProvider}
          />
        )}

        {activeView === 'dashboard' && currentUser && (
          <div>
            {currentUser.role === 'CUSTOMER' && (
              <CustomerDashboard
                currentUser={currentUser}
                bookings={bookings}
                quotations={quotations}
                invoices={invoices}
                reviews={reviews}
                lang={lang}
                onOpenCompareQuotes={setComparisonBookingId}
                onExploreServices={() => setActiveView('discovery')}
                onRefreshData={() => refreshState()}
              />
            )}
            {currentUser.role === 'PROVIDER' && (
              currentProviderProfile ? (
                <ProviderDashboard
                  currentUser={currentUser}
                  provider={currentProviderProfile}
                  categories={categories}
                  bookings={bookings}
                  quotations={quotations}
                  invoices={invoices}
                  verifications={verifications}
                  lang={lang}
                  onRefreshData={() => refreshState()}
                />
              ) : (
                <p className="p-8 text-center text-sm text-gray-600">Provider profile is not available yet.</p>
              )
            )}
            {currentUser.role === 'ADMIN' && (
              <AdminDashboard
                currentUser={currentUser}
                users={users}
                providers={providers}
                bookings={bookings}
                verifications={verifications}
                complaints={complaints}
                auditLogs={auditLogs}
                lang={lang}
                onRefreshData={() => refreshState()}
              />
            )}
          </div>
        )}
      </main>

      <ProviderProfileModal
        provider={selectedProfileProvider}
        reviews={reviews}
        lang={lang}
        onClose={() => setSelectedProfileProvider(null)}
        onBook={provider => {
          setSelectedProfileProvider(null);
          openBooking(provider);
        }}
        onRequestQuote={provider => {
          setSelectedProfileProvider(null);
          openBooking(provider);
        }}
      />

      {currentUser && (
        <BookingModal
          provider={selectedBookingProvider}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setSelectedBookingProvider(null)}
          onBookingCreated={() => {
            void refreshState();
            setActiveView('dashboard');
          }}
        />
      )}

      {comparisonBookingId && currentUser && (
        <QuotationComparisonModal
          bookingId={comparisonBookingId}
          quotations={quotations}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setComparisonBookingId(null)}
          onQuotationAccepted={() => {
            void refreshState();
            setComparisonBookingId(null);
          }}
        />
      )}

      {isEmergencyOpen && currentUser && (
        <EmergencyBookingModal
          providers={providers}
          currentUser={currentUser}
          lang={lang}
          onClose={() => setIsEmergencyOpen(false)}
          onEmergencyDispatched={() => {
            void refreshState();
            setActiveView('dashboard');
          }}
        />
      )}

      <SmartAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        lang={lang}
        onSelectCategory={handleSelectCategory}
        onOpenEmergency={() => currentUser ? setIsEmergencyOpen(true) : setIsAuthOpen(true)}
        onOpenJavaCode={() => setIsJavaModalOpen(true)}
      />
      <JavaArchitectureModal isOpen={isJavaModalOpen} onClose={() => setIsJavaModalOpen(false)} />

      {currentUser && (
        <NotificationDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          userId={currentUser.id}
          onRefreshData={() => refreshState()}
        />
      )}
      {isAuthOpen && (
        <AuthModal
          categories={categories}
          onClose={() => setIsAuthOpen(false)}
          onAuthenticated={handleAuthenticated}
        />
      )}
    </div>
  );
}
