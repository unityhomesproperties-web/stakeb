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
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'register'>('signin');
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [activePolicyKey, setActivePolicyKey] = useState<PolicyKey>('terms');
  const [futureModalOpen, setFutureModalOpen] = useState(false);

  const handleOpenAuth = (mode: 'signin' | 'register' = 'signin') => {
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
          <div className="bg-white border-b border-[#DCEFF3] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setRole('visitor')}
                title="Go to public website"
                className="hover:opacity-90 transition-opacity"
              >
                <Logo size="sm" />
              </button>
              <div className="h-5 w-px bg-[#DCEFF3] hidden sm:block" />
              <div className="text-xs text-[#6A808C] hidden sm:block font-medium">
                {getPortalLabel()}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setRole('visitor')}
                className="px-3 py-1.5 border border-[#DCEFF3] rounded-lg text-xs font-medium text-[#354B55] hover:bg-[#CAF0F8]/50 transition-colors flex items-center gap-1.5"
                title="Sign out of customer portal"
              >
                <LogOut className="w-3.5 h-3.5 text-[#6A808C]" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Active Authenticated View: Customer Portal (Individual & Business) */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
            <CustomerPortal
              onOpenPolicy={handleOpenPolicy}
              onOpenKyc={() => setKycModalOpen(true)}
            />
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
