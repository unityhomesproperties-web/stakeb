import React, { useState } from 'react';
import { DemoProvider, useDemo } from './context/DemoContext';
import { PublicHeader } from './components/navigation/PublicHeader';
import { PublicFooter } from './components/navigation/PublicFooter';
import { HomePage } from './components/public/HomePage';
import { ServicesPage } from './components/public/ServicesPage';
import { HowItWorksPage } from './components/public/HowItWorksPage';
import { BusinessPage } from './components/public/BusinessPage';
import { AboutPage } from './components/public/AboutPage';
import { ContactPage } from './components/public/ContactPage';
import { TrackingView } from './components/tracking/TrackingView';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { BranchDeskPortal } from './components/desk/BranchDeskPortal';
import { PickupAgentPortal } from './components/pickup/PickupAgentPortal';
import { OperationsDashboard } from './components/operations/OperationsDashboard';
import { FinanceLeadPortal } from './components/finance/FinanceLeadPortal';
import { SuperAdminPortal } from './components/superadmin/SuperAdminPortal';
import { PickupShippingWorkspace } from './components/workspaces/PickupShippingWorkspace';
import { CustomerServiceWorkspace } from './components/workspaces/CustomerServiceWorkspace';
import { OperationsAdminWorkspace } from './components/workspaces/OperationsAdminWorkspace';
import { PublicTicketTrackingPage } from './components/support/PublicTicketTrackingPage';
import { LogoSkeleton } from './components/common/LogoSkeleton';
import { AuthModal } from './components/auth/AuthModal';
import { KycWizardModal } from './components/customer/KycWizardModal';
import { LegalModal, PolicyKey } from './components/common/LegalModal';
import { FutureServicesModal } from './components/public/FutureServicesModal';
import { GuestRegistrationPromoModal } from './components/common/GuestRegistrationPromoModal';
import { BookingWizard } from './components/booking/BookingWizard';
import { QuoteRetrievalView } from './components/booking/QuoteRetrievalView';
import { SwiftSharePage } from './components/swiftshare/SwiftSharePage';
import { FaqPage } from './components/public/FaqPage';
import { CargoPage } from './components/public/CargoPage';
import { ShippingAssistantPage } from './components/public/ShippingAssistantPage';
import { Logo } from './components/common/Logo';
import { BookPickupModal } from './components/customer/BookPickupModal';
import { ArrowLeft, LogOut } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    role,
    setRole,
    activePublicNav,
    setActivePublicNav,
    currentCustomer,
    selectedShipmentForTracking,
    setSelectedShipmentForTracking,
    setActiveCustomerTab,
    isLoading,
    loadingMessage,
  } = useDemo();

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'register' | 'staff'>('signin');
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [activePolicyKey, setActivePolicyKey] = useState<PolicyKey>('terms');
  const [futureModalOpen, setFutureModalOpen] = useState(false);
  const [guestPromoOpen, setGuestPromoOpen] = useState(false);
  const [guestPromoDismissed, setGuestPromoDismissed] = useState(false);
  const [initialQuoteRefForBooking, setInitialQuoteRefForBooking] = useState<string | undefined>(undefined);
  const [bookPickupModalOpen, setBookPickupModalOpen] = useState(false);

  const handleOpenAuth = (mode: 'signin' | 'register' | 'staff' = 'signin') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenPolicy = (key: PolicyKey) => {
    setActivePolicyKey(key);
    setLegalModalOpen(true);
  };

  const handleOpenQuote = () => {
    setInitialQuoteRefForBooking(undefined);
    setActivePublicNav('quote');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedGuestQuote = () => {
    setGuestPromoDismissed(true);
    setGuestPromoOpen(false);
    setActivePublicNav('quote');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTrack = () => {
    setSelectedShipmentForTracking('SWV-2026-NG8491');
    setActivePublicNav('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPortalLabel = () => {
    if (role === 'pickup_shipping' || role === 'front_desk' || role === 'pickup_agent') {
      return `Workspace A · Pickup & Shipping Management`;
    }
    if (role === 'customer_service') {
      return `Workspace B · Customer Service & Resolution Desk`;
    }
    if (role === 'operations_admin' || role === 'operations' || role === 'finance' || role === 'platform_admin' || role === 'super_admin' || role === 'owner') {
      return `Workspace C · Operations & Admin Command`;
    }
    if (role === 'business') {
      return `Business Shipping Portal · ${currentCustomer.companyName || currentCustomer.name}`;
    }
    return `Customer Shipping Portal · ${currentCustomer.name}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-[#1F2937] dark:text-slate-100 relative transition-colors duration-200">
      {/* Animated Logo Loading Skeleton Overlay */}
      {isLoading && <LogoSkeleton message={loadingMessage} size="fullscreen" />}

      {/* Main Role Views */}
      {role === 'visitor' ? (
        /* Public Marketing Website */
        <div className="flex-1 flex flex-col">
          <PublicHeader
            onOpenAuth={handleOpenAuth}
            onOpenQuote={handleOpenQuote}
            onOpenBookPickup={() => setBookPickupModalOpen(true)}
            onOpenPolicy={handleOpenPolicy}
          />

          <main className="flex-1">
            {activePublicNav === 'home' && (
              <HomePage
                onOpenQuote={handleOpenQuote}
                onOpenBookPickup={() => setBookPickupModalOpen(true)}
                onOpenTrack={handleOpenTrack}
                onOpenRetrieveQuote={(code) => {
                  if (code) setSelectedShipmentForTracking(code);
                  setActivePublicNav('retrieve-quote');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenAuth={handleOpenAuth}
                onOpenComingSoon={() => setFutureModalOpen(true)}
                onNavigateToSwiftShare={() => {
                  setActivePublicNav('swift-share');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {activePublicNav === 'services' && (
              <ServicesPage
                onOpenQuote={handleOpenQuote}
                onOpenComingSoon={() => setFutureModalOpen(true)}
              />
            )}

            {activePublicNav === 'cargo' && (
              <CargoPage onOpenQuote={handleOpenQuote} />
            )}

            {activePublicNav === 'assistant' && (
              <ShippingAssistantPage
                onOpenQuote={handleOpenQuote}
                onStartBooking={() => {
                  setRole('customer');
                  setActiveCustomerTab('book');
                }}
              />
            )}

            {(activePublicNav === 'swift-share' || activePublicNav === 'travel-carry') && (
              <SwiftSharePage
                onOpenPolicy={handleOpenPolicy}
                onOpenKyc={() => setKycModalOpen(true)}
                onOpenStandardQuote={handleOpenQuote}
              />
            )}

            {activePublicNav === 'how-it-works' && (
              <HowItWorksPage
                onOpenQuote={handleOpenQuote}
                onOpenPolicy={handleOpenPolicy}
              />
            )}

            {activePublicNav === 'faq' && (
              <FaqPage
                onOpenQuote={handleOpenQuote}
                onOpenContact={() => {
                  setActivePublicNav('contact');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateToSwiftShare={() => {
                  setActivePublicNav('swift-share');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {activePublicNav === 'business' && (
              <BusinessPage onOpenQuote={handleOpenQuote} />
            )}

            {activePublicNav === 'about' && (
              <AboutPage
                onOpenQuote={handleOpenQuote}
                onOpenPolicy={handleOpenPolicy}
              />
            )}

            {activePublicNav === 'contact' && (
              <ContactPage
                onOpenWhatsApp={() => {
                  setRole('customer');
                  setActiveCustomerTab('support');
                }}
              />
            )}

            {activePublicNav === 'track' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setActivePublicNav('home')}
                    className="text-[13px] font-bold text-[#0096C7] dark:text-[#90E0EF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                  </button>
                </div>
                <TrackingView
                  onOpenSupportWithShipment={(tracking) => {
                    setSelectedShipmentForTracking(tracking);
                    setRole('customer');
                    setActiveCustomerTab('support');
                  }}
                  onOpenReviewForShipment={() => {
                    setRole('customer');
                    setActiveCustomerTab('reviews');
                  }}
                  onOpenQuoteRetrieval={(code) => {
                    setSelectedShipmentForTracking(code);
                    setActivePublicNav('retrieve-quote');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            )}

            {activePublicNav === 'retrieve-quote' && (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setActivePublicNav('home')}
                    className="text-[13px] font-bold text-[#0096C7] dark:text-[#90E0EF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                  </button>
                </div>
                <QuoteRetrievalView
                  initialCode={selectedShipmentForTracking || undefined}
                  onTrackShipment={(code: string) => {
                    setSelectedShipmentForTracking(code);
                    setActivePublicNav('track');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onConvertQuoteToBooking={(quoteRef: string) => {
                    setInitialQuoteRefForBooking(quoteRef);
                    setActivePublicNav('quote');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            )}

            {activePublicNav === 'quote' && (
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setInitialQuoteRefForBooking(undefined);
                      setActivePublicNav('home');
                    }}
                    className="text-[13px] font-bold text-[#0096C7] dark:text-[#90E0EF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                  </button>
                </div>
                <BookingWizard
                  initialQuoteRef={initialQuoteRefForBooking}
                  onComplete={(trackingNum) => {
                    setInitialQuoteRefForBooking(undefined);
                    setSelectedShipmentForTracking(trackingNum);
                    setActivePublicNav('track');
                  }}
                  onOpenPolicy={handleOpenPolicy}
                  onOpenKyc={() => setKycModalOpen(true)}
                />
              </div>
            )}

            {activePublicNav === 'ticket-track' && (
              <div className="py-6">
                <div className="max-w-3xl mx-auto px-4 mb-2">
                  <button
                    type="button"
                    onClick={() => setActivePublicNav('home')}
                    className="text-[13px] font-bold text-[#0096C7] dark:text-[#90E0EF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                  </button>
                </div>
                <PublicTicketTrackingPage />
              </div>
            )}
          </main>

          <PublicFooter
            onOpenPolicy={handleOpenPolicy}
            onNavigate={(navId) => {
              setActivePublicNav(navId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenComingSoon={() => setFutureModalOpen(true)}
            onOpenStaffPortal={() => handleOpenAuth('staff')}
          />
        </div>
      ) : (
        /* Authenticated Role Portal View */
        <div className="flex-1 flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-[#1F2937] dark:text-slate-100 min-h-screen transition-colors duration-200">
          {/* Sticky #00B4D8 Authenticated Navbar */}
          <div className="bg-[#00B4D8] text-white border-b border-[#0096C7] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sticky top-0 z-40 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
              <button
                type="button"
                onClick={() => setRole('visitor')}
                title="Go to public website"
                className="bg-white rounded-[8px] px-2 py-1 shadow-2xs hover:opacity-95 transition-opacity shrink-0 cursor-pointer"
              >
                <Logo size="sm" />
              </button>
              <div className="h-5 w-px bg-white/30 hidden sm:block" />
              <div className="text-[13px] text-white font-semibold hidden md:block truncate max-w-xs">
                {getPortalLabel()}
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              {/* Show Workspace Switcher only for internal staff roles — hidden for normal customer/business accounts */}
              {role !== 'customer' && role !== 'business' && (
                <div className="flex items-center gap-1 bg-white rounded-full px-3 py-1.5 min-w-0 shadow-2xs">
                  <span className="text-[11px] text-[#4B5563] font-semibold hidden sm:inline shrink-0">Workspace:</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    aria-label="Staff workspace switcher"
                    className="text-[12px] bg-transparent font-bold text-[#0F172A] focus:outline-none cursor-pointer max-w-[140px] sm:max-w-none truncate"
                  >
                    <option value="pickup_shipping">Workspace A: Pickup &amp; Shipping</option>
                    <option value="customer_service">Workspace B: Customer Service</option>
                    <option value="operations_admin">Workspace C: Operations &amp; Admin</option>
                    <option value="customer">Preview Customer Portal</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setRole('visitor')}
                className="px-3.5 py-1.5 border border-white/60 bg-white/15 hover:bg-white/25 rounded-full text-[13px] font-bold text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Sign out of portal"
                aria-label="Sign out of portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Active Authenticated View: Consolidated 3 Workspaces & Customer Portals */}
          <main className="flex-1 w-full">
            {(role === 'pickup_shipping' || role === 'front_desk' || role === 'pickup_agent') && (
              <PickupShippingWorkspace />
            )}
            {role === 'customer_service' && (
              <CustomerServiceWorkspace />
            )}
            {(role === 'operations_admin' || role === 'operations' || role === 'finance' || role === 'platform_admin' || role === 'super_admin' || role === 'owner') && (
              <OperationsAdminWorkspace />
            )}
            {(role === 'customer' || role === 'business') && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
                <CustomerPortal
                  onOpenPolicy={handleOpenPolicy}
                  onOpenKyc={() => setKycModalOpen(true)}
                />
              </div>
            )}
          </main>
        </div>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        onOpenPolicy={handleOpenPolicy}
        onSuccessRedirect={() => {
          // Handled via context role
        }}
      />

      <KycWizardModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        onOpenPolicy={handleOpenPolicy}
      />

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialPolicy={activePolicyKey}
      />

      <FutureServicesModal
        isOpen={futureModalOpen}
        onClose={() => setFutureModalOpen(false)}
      />

      <GuestRegistrationPromoModal
        isOpen={guestPromoOpen}
        onClose={() => setGuestPromoOpen(false)}
        onCreateAccount={() => {
          setGuestPromoOpen(false);
          handleOpenAuth('register');
        }}
        onContinueAsGuest={handleProceedGuestQuote}
      />

      <BookPickupModal
        isOpen={bookPickupModalOpen}
        onClose={() => setBookPickupModalOpen(false)}
        onOpenPolicy={handleOpenPolicy}
        onSuccess={(trackingNumber) => {
          if (trackingNumber) {
            setSelectedShipmentForTracking(trackingNumber);
          }
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <DemoProvider>
      <MainAppContent />
    </DemoProvider>
  );
}
