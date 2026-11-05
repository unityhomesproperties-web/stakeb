import React from 'react';
import { Logo } from '../common/Logo';
import { PolicyKey } from '../common/LegalModal';
import { ShieldCheck, MapPin, Mail, Globe } from 'lucide-react';

interface PublicFooterProps {
  onOpenPolicy: (policyKey: PolicyKey) => void;
  onNavigate: (navId: string) => void;
  onOpenComingSoon: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onOpenPolicy, onNavigate, onOpenComingSoon }) => {
  return (
    <footer className="bg-white border-t border-[#DCEFF3] pt-14 pb-10 text-[#354B55]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#DCEFF3]">
          {/* Col 1: Brand & Promise */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-xs font-bold text-[#00B4D8] tracking-wide">
              Swiftvero Express — Your world, connected.
            </p>
            <p className="text-xs text-[#6A808C] leading-relaxed max-w-sm">
              Swiftvero Express is an international logistics technology company, headquartered in Nigeria,
              coordinating outbound parcel, document, and cargo shipping from anywhere in Nigeria to eligible destinations worldwide.
            </p>
            <div className="text-xs text-[#6A808C] space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                <span>Gateways: Ikeja Cargo Hub & Lekki Intake Center, Lagos, Nigeria</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                <span>support@swiftvero.ng</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                <span>Worldwide International Air & Sea Logistics</span>
              </div>
            </div>
          </div>

          {/* Col 2: Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#354B55] uppercase tracking-wider">Services</h4>
            <ul className="space-y-2.5 text-xs text-[#6A808C]">
              <li>
                <button onClick={() => onNavigate('cargo')} className="hover:text-[#00B4D8] transition-colors text-left font-semibold text-[#354B55]">
                  Cargo &amp; Freight Forwarding
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('assistant')} className="hover:text-[#00B4D8] transition-colors text-left text-[#00B4D8] font-semibold">
                  Smart Shipping Assistant
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Priority Air Express (2–3 Days)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Standard Air Courier (4–6 Days)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('swift-share')} className="hover:text-[#00B4D8] transition-colors text-left inline-flex items-center gap-1.5 text-[#00B4D8] font-medium">
                  <span>SwiftShare (Traveller Pilot)</span>
                  <span className="text-[10px] bg-[#CAF0F8] px-1.5 py-0.5 rounded text-[#008EA8] font-bold">Pilot</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('business')} className="hover:text-[#00B4D8] transition-colors text-left">
                  SME &amp; Artisan Export Solutions
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenComingSoon}
                  className="hover:text-[#00B4D8] transition-colors inline-flex items-center gap-1.5 text-[#6A808C]"
                >
                  <span>Domestic Moving &amp; Cargo</span>
                  <span className="text-[10px] bg-[#F5FBFD] border border-[#DCEFF3] px-1.5 py-0.5 rounded text-[#6A808C]">Preview</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#354B55] uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5 text-xs text-[#6A808C]">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Rate Calculator
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('track')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Track Consignment
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-[#00B4D8] transition-colors text-left">
                  How Shipping Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-[#00B4D8] transition-colors text-left font-medium text-[#354B55]">
                  Frequently Asked Questions (FAQ)
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('prohibited')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Prohibited Goods Guide
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-[#00B4D8] transition-colors text-left">
                  About Swiftvero
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Support &amp; Enquiries
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#354B55] uppercase tracking-wider">Compliance & Terms</h4>
            <ul className="space-y-2.5 text-xs text-[#6A808C]">
              <li>
                <button onClick={() => onOpenPolicy('terms')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Terms of Use
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('privacy')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Privacy Notice (NDPA)
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('kyc')} className="hover:text-[#00B4D8] transition-colors text-left">
                  KYC & Identity Verification
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('pricing')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Pricing & Quotation Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('cancellation')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Cancellation & Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('claims')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Claims & Liability Limits
                </button>
              </li>
              <li>
                <button onClick={() => onOpenPolicy('cashback')} className="hover:text-[#00B4D8] transition-colors text-left">
                  Cashback & Referral Terms
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Operating Role & Transparency Notice */}
        <div className="py-6 text-[11px] text-[#6A808C] leading-relaxed border-b border-[#DCEFF3] space-y-2">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
            <p>
              <strong className="text-[#354B55]">Operating Scope & Physical Verification:</strong> Swiftvero Express Ltd
              coordinates outbound international parcel, document, and cargo shipping from Nigeria via commercial airline schedules and international air handling networks.
              Online estimates are confirmed following calibrated physical scale weighing and volumetric verification at our intake facility.
              Doorstep pickup and depot drop-off are free. All consignments are screened in accordance with civil aviation security regulations.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6A808C]">
          <div>
            © {new Date().getFullYear()} Swiftvero Express Ltd. RC: 1894022. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#008EA8] bg-[#CAF0F8] border border-[#90E0EF] px-2.5 py-0.5 rounded-full font-bold">
              Global Shipping · Out of Nigeria
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
