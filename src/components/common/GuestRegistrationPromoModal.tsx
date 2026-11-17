import React from 'react';
import { Sparkles, Gift, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface GuestRegistrationPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
  onContinueAsGuest: () => void;
}

export const GuestRegistrationPromoModal: React.FC<GuestRegistrationPromoModalProps> = ({
  isOpen,
  onClose,
  onCreateAccount,
  onContinueAsGuest,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="sv-card max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 text-left relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#4B5563] hover:text-[#111827] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Eyebrow */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[12px] bg-[#CAF0F8] text-[#00B4D8] border border-[#90E0EF] flex items-center justify-center shadow-xs shrink-0">
            <Gift className="w-6 h-6 text-[#00B4D8]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#0F172A] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
              Member Perks
            </span>
            <h3 className="sv-h3 mt-1">
              Enjoy More Benefits with a Swiftvero Account
            </h3>
          </div>
        </div>

        {/* Message Copy */}
        <p className="sv-body">
          Create a free account to enjoy cashback rewards and special shipping discounts on eligible shipments. You can also track your packages, manage your pickups and view all your shipping payments in one place.
        </p>

        {/* Value Points */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-4 space-y-2.5 text-[13px] text-[#1F2937]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
            <span>Up to 3% cashback credited to your wallet upon confirmed delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
            <span>Exclusive welcome promo codes (e.g. 10% off your initial booking)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
            <span>Saved addresses, 1-click rebooking, and live flight milestone tracking</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onCreateAccount}
            className="sv-btn-primary flex-1 py-3 px-4 rounded-full shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Free Account</span>
          </button>

          <button
            type="button"
            onClick={onContinueAsGuest}
            className="py-3 px-4 bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#111827] text-[14px] font-semibold rounded-full transition-colors text-center cursor-pointer"
          >
            <span>Continue as Guest</span>
          </button>
        </div>

        <p className="sv-label text-center">
          Guest bookings proceed with full transparency. You can still create an account later.
        </p>
      </div>
    </div>
  );
};
