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
import { LogoSkeleton } from './components/common/LogoSkeleton';
import { AuthModal } from './components/auth/AuthModal';
import { KycWizardModal } from './components/customer/KycWizardModal';
import { LegalModal, PolicyKey } from './components/common/LegalModal';
import { FutureServicesModal } from './components/public/FutureServicesModal';
import { BookingWizard } from './components/booking/BookingWizard';
import { SwiftSharePage } from './components/swiftshare/SwiftSharePage';
import { FaqPage } from './components/public/FaqPage';
import { CargoPage } from './components/public/CargoPage';
import { ShippingAssistantPage } from './components/public/ShippingAssistantPage';
import { Logo } from './components/common/Logo';
import { ArrowLeft, LogOut } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    role,
    setRole,
    activePublicNav,
    setActivePublicNav,
    currentCustomer,
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

  const handleOpenAuth = (mode: 'signin' | 'register' | 'staff' = 'signin') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenPolicy = (key: PolicyKey) => {
    setActivePolicyKey(key);
    setLegalModalOpen(true);
  };

  const handleOpenQuote = () => {
    setActivePublicNav('quote');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTrack = () => {
    setSelectedShipmentForTracking('SWV-2026-NG8491');
    setActivePublicNav('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPortalLabel = () => {
    if (role === 'front_desk') {
      return `Branch Desk Admin Portal · Counter Intake`;
    }
    if (role === 'pickup_agent') {
      return `Pickup Courier Portal · Field Operations`;
    }
    if (role === 'operations') {
      return `MMIA Operations Control Tower · Hub Transit`;
    }
    if (role === 'finance') {
      return `Corporate Finance & VAT Audit Portal`;
    }
    if (role === 'platform_admin' || role === 'super_admin' || role === 'owner') {
      return `Central Head Office · Super Admin & Governance`;
    }
    if (role === 'business') {
      return `Business Consignor Portal · ${currentCustomer.companyName || currentCustomer.name}`;
    }
    return `Customer Portal · ${currentCustomer.name}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FBFD] text-[#354B55] relative">
      {/* Animated Logo Loading Skeleton Overlay */}
      {isLoading && <LogoSkeleton message={loadingMessage} size="fullscreen" />}

      {/* Main Role Views */}
      {role === 'visitor' ? (
        /* Public Marketing Website */
        <div className="flex-1 flex flex-col">
          <PublicHeader
            onOpenAuth={handleOpenAuth}
            onOpenQuote={handleOpenQuote}
          />

          <main className="flex-1">
            {activePublicNav === 'home' && (
              <HomePage
                onOpenQuote={handleOpenQuote}
                onOpenTrack={handleOpenTrack}
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
                onStartBooking={(data) => {
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
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <div className="mb-4">
                  <button
                    onClick={() => setActivePublicNav('home')}
                    className="text-xs font-semibold text-[#00B4D8] hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Home</span>
                  </button>
                </div>
                <TrackingView
                  onOpenSupportWithShipment={(tracking) => {
                    setRole('customer');
                    setActiveCustomerTab('support');
                  }}
                  onOpenReviewForShipment={(shipmentId) => {
                    setRole('customer');
                    setActiveCustomerTab('reviews');
                  }}
                />
              </div>
            )}

            {activePublicNav === 'quote' && (
              <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                <div className="mb-4">
                  <button
                    onClick={() => setActivePublicNav('home')}
                    className="text-xs font-semibold text-[#00B4D8] hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Home</span>
                  </button>
                </div>
                <BookingWizard
                  onComplete={(trackingNum) => {
                    setSelectedShipmentForTracking(trackingNum);
                    setActivePublicNav('track');
                  }}
                  onOpenPolicy={handleOpenPolicy}
                  onOpenKyc={() => setKycModalOpen(true)}
                />
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
          />
        </div>
      ) : (
        /* Authenticated Role Portal View */
        <div className="flex-1 flex flex-col">
          {/* Authenticated Top Navbar */}
          <div className="bg-white border-b border-[#DDEEF2] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRole('visitor')}
                title="Go to public website"
                className="hover:opacity-90 transition-opacity shrink-0"
              >
                <Logo size="sm" />
              </button>
              <div className="h-5 w-px bg-[#DDEEF2] hidden sm:block" />
              <div className="text-xs text-[#637984] hidden md:block font-medium truncate max-w-xs">
                {getPortalLabel()}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Quick Role Switcher Pill for Demo Review */}
              <div className="flex items-center gap-1.5 bg-[#F7FCFD] border border-[#DDEEF2] rounded-lg px-2 py-1">
                <span className="text-[10px] text-[#637984] font-semibold hidden sm:inline">Role:</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="text-xs bg-transparent font-bold text-[#00B4D8] focus:outline-hidden cursor-pointer"
                >
                  <option value="customer">Customer</option>
                  <option value="front_desk">Front Desk</option>
                  <option value="pickup_agent">Pickup Agent</option>
                  <option value="operations">Operations</option>
                  <option value="finance">Finance</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="business">Business Shipper</option>
                </select>
              </div>

              <button
                onClick={() => setRole('visitor')}
                className="px-3 py-1.5 border border-[#DDEEF2] rounded-lg text-xs font-medium text-[#253B45] hover:bg-[#CAF0F8]/50 transition-colors flex items-center gap-1.5"
                title="Sign out of portal"
              >
                <LogOut className="w-3.5 h-3.5 text-[#637984]" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Active Authenticated View: Role-specific portals */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-7">
            {role === 'front_desk' && (
              <BranchDeskPortal onOpenKycModal={() => setKycModalOpen(true)} />
            )}
            {role === 'pickup_agent' && (
              <PickupAgentPortal />
            )}
            {role === 'operations' && (
              <OperationsDashboard />
            )}
            {role === 'finance' && (
              <FinanceLeadPortal />
            )}
            {(role === 'platform_admin' || role === 'super_admin' || role === 'owner') && (
              <SuperAdminPortal />
            )}
            {(role === 'customer' || role === 'business') && (
              <CustomerPortal
                onOpenPolicy={handleOpenPolicy}
                onOpenKyc={() => setKycModalOpen(true)}
              />
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
