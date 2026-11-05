import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { Logo } from '../common/Logo';
import { Menu, X, ArrowRight, User } from 'lucide-react';

interface PublicHeaderProps {
  onOpenAuth: (mode?: 'signin' | 'register') => void;
  onOpenQuote: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  onOpenAuth,
  onOpenQuote,
}) => {
  const {
    role,
    setRole,
    activePublicNav,
    setActivePublicNav,
    currentCustomer,
    setSelectedShipmentForTracking,
  } = useDemo();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'cargo', label: 'Cargo & Freight' },
    { id: 'assistant', label: 'Shipping Assistant' },
    { id: 'swift-share', label: 'SwiftShare' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'faq', label: 'FAQ' },
    { id: 'track', label: 'Track' },
    { id: 'business', label: 'Business' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (id: string) => {
    setActivePublicNav(id);
    setMobileMenuOpen(false);
    if (id === 'track') {
      setSelectedShipmentForTracking('SWV-2026-NG8491');
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-[#DCEFF3] sticky top-0 z-40 transition-shadow duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Official Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="text-left focus:outline-hidden hover:opacity-95 transition-opacity shrink-0"
          aria-label="Swiftvero Express Home"
        >
          <Logo size="md" />
        </button>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-xs xl:text-sm font-medium text-[#354B55]">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#00B4D8] py-1 ${
                activePublicNav === link.id
                  ? 'text-[#00B4D8] font-bold border-b-2 border-[#00B4D8]'
                  : 'text-[#354B55]'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Single front door: Portal / Sign In + Get a Quote */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {role === 'customer' || role === 'business' ? (
            <button
              onClick={() => {
                setRole(role);
              }}
              className="text-xs font-semibold text-[#008EA8] bg-[#CAF0F8]/50 border border-[#90E0EF] px-3.5 py-1.5 rounded-lg hover:bg-[#CAF0F8] transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span>Portal ({currentCustomer.name.split(' ')[0]})</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('signin')}
              className="text-xs font-semibold text-[#354B55] hover:text-[#00B4D8] transition-colors whitespace-nowrap shrink-0 px-2.5 py-1.5"
            >
              Customer Sign In
            </button>
          )}

          <button
            onClick={onOpenQuote}
            className="px-4 py-2 text-xs font-bold text-white bg-[#00B4D8] hover:bg-[#009BB8] rounded-lg transition-all whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5"
          >
            <span>Get a Quote</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => onOpenQuote()}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#00B4D8] rounded-md"
          >
            Quote
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#354B55] hover:text-[#00B4D8] rounded-md border border-[#DCEFF3]"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DCEFF3] bg-white px-4 py-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-left py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  activePublicNav === link.id
                    ? 'bg-[#CAF0F8]/50 text-[#008EA8] font-bold border-l-2 border-[#00B4D8]'
                    : 'text-[#354B55] hover:bg-[#F5FBFD]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#DCEFF3] flex flex-col gap-2">
            {role === 'customer' || role === 'business' ? (
              <button
                onClick={() => {
                  setRole(role);
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 text-xs font-semibold text-[#008EA8] bg-[#CAF0F8]/50 rounded-lg text-center"
              >
                Go to {role === 'business' ? 'Business' : 'Customer'} Portal
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signin');
                }}
                className="w-full py-2.5 px-3 text-xs font-semibold text-[#354B55] bg-[#F5FBFD] border border-[#DCEFF3] rounded-lg text-center hover:border-[#00B4D8]"
              >
                Customer Sign In
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuote();
              }}
              className="w-full py-2.5 px-3 text-xs font-bold text-white bg-[#00B4D8] rounded-lg text-center flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Get an Instant Quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
