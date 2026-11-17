import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { Logo } from '../common/Logo';
import { Menu, X, ArrowRight, User } from 'lucide-react';

interface PublicHeaderProps {
  onOpenAuth: (mode?: 'signin' | 'register' | 'staff') => void;
  onOpenQuote: () => void;
  onOpenBookPickup: () => void;
  onOpenPolicy?: (key: any) => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  onOpenAuth,
  onOpenQuote,
  onOpenBookPickup,
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

  // Clean single-line desktop destinations
  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'quote', label: 'Get a Quote' },
    { id: 'track', label: 'Track a Shipment' },
    { id: 'retrieve-quote', label: 'Retrieve Quote' },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'quote') {
      onOpenQuote();
      setMobileMenuOpen(false);
      return;
    }
    setActivePublicNav(id);
    setMobileMenuOpen(false);
    if (id === 'track') {
      setSelectedShipmentForTracking('SWV-2026-NG8491');
    }
  };

  return (
    <header className="bg-[#00B4D8] text-white border-b border-[#0096C7] sticky top-0 z-40 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Official Logo seated inside crisp white frame for WCAG AA contrast on #00B4D8 */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="bg-white rounded-[10px] px-2.5 py-1.5 shadow-2xs hover:opacity-95 transition-opacity shrink-0 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#90E0EF] cursor-pointer"
          aria-label="Swiftvero Express Home"
        >
          <Logo size="md" />
        </button>

        {/* Center: Clean Single-Line Desktop Navigation */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-5 xl:gap-7 text-[14px] font-semibold"
        >
          {navLinks.map((link) => {
            const isActive = activePublicNav === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                className={`whitespace-nowrap shrink-0 py-1.5 transition-colors border-b-2 cursor-pointer ${
                  isActive
                    ? 'text-white font-bold border-white'
                    : 'text-white/90 hover:text-white border-transparent hover:border-white/60'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Customer Sign In + Book a Pickup CTA */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {role === 'customer' || role === 'business' ? (
            <button
              type="button"
              onClick={() => setRole(role)}
              className="min-h-[40px] px-4 py-1.5 rounded-full text-[13px] font-bold bg-white/15 hover:bg-white/25 text-white border border-white/40 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <User className="w-4 h-4" />
              <span>Portal ({currentCustomer.name.split(' ')[0]})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="min-h-[40px] px-4 py-1.5 rounded-full text-[13px] font-bold bg-transparent hover:bg-white/15 text-white border border-white/60 transition-colors whitespace-nowrap cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={onOpenBookPickup}
            className="min-h-[40px] px-5 py-1.5 rounded-full text-[14px] font-bold tracking-[0.01em] bg-white text-[#0F172A] hover:bg-[#CAF0F8] transition-colors whitespace-nowrap shrink-0 shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Book a Pickup</span>
            <ArrowRight className="w-4 h-4 text-[#00B4D8]" />
          </button>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={onOpenBookPickup}
            className="min-h-[38px] px-3.5 py-1.5 text-[13px] font-bold bg-white text-[#0F172A] hover:bg-[#CAF0F8] rounded-full shadow-2xs cursor-pointer whitespace-nowrap"
          >
            Book a Pickup
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[38px] min-w-[38px] p-2 text-white hover:bg-white/15 rounded-[10px] border border-white/40 flex items-center justify-center cursor-pointer"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Clean Hamburger / Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#90E0EF]/40 bg-white dark:bg-slate-900 text-[#111827] dark:text-white px-4 py-4 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = activePublicNav === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`text-left min-h-[44px] py-2.5 px-3.5 text-[14px] rounded-[10px] transition-colors ${
                    isActive
                      ? 'bg-[#CAF0F8] dark:bg-sky-950 text-[#0F172A] dark:text-[#90E0EF] font-bold border-l-4 border-[#00B4D8]'
                      : 'text-[#1F2937] dark:text-slate-200 font-medium hover:bg-[#F8FAFC] dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-col gap-2.5">
            {role === 'customer' || role === 'business' ? (
              <button
                type="button"
                onClick={() => {
                  setRole(role);
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 px-4 text-[14px] font-bold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950/60 border border-[#90E0EF] dark:border-sky-800 rounded-full text-center"
              >
                Go to {role === 'business' ? 'Business' : 'Customer'} Portal
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signin');
                }}
                className="w-full min-h-[44px] py-2.5 px-4 text-[14px] font-bold text-[#111827] dark:text-slate-200 bg-white dark:bg-slate-800 border border-[#CBD5E1] dark:border-slate-700 rounded-full text-center hover:border-[#00B4D8]"
              >
                Customer Sign In
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenQuote();
                }}
                className="w-full min-h-[44px] py-2.5 px-4 text-[14px] font-bold text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950/60 border border-[#90E0EF] rounded-full text-center"
              >
                Get a Quote
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBookPickup();
                }}
                className="w-full min-h-[44px] py-2.5 px-4 text-[14px] font-bold tracking-[0.01em] text-white bg-[#00B4D8] hover:bg-[#0096C7] rounded-full text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Book a Pickup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
