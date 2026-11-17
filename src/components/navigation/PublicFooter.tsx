import React from 'react';
import { Logo } from '../common/Logo';
import { PolicyKey } from '../common/LegalModal';
import { ShieldCheck, MapPin, Mail, Globe, Building2 } from 'lucide-react';

interface PublicFooterProps {
  onOpenPolicy: (policyKey: PolicyKey) => void;
  onNavigate: (navId: string) => void;
  onOpenComingSoon: () => void;
  onOpenStaffPortal?: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onOpenPolicy,
  onNavigate,
  onOpenComingSoon,
  onOpenStaffPortal,
}) => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-[#E2E8F0] dark:border-slate-800 pt-12 pb-10 text-[#1F2937] dark:text-slate-300 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10 border-b border-[#E2E8F0] dark:border-slate-800">
          {/* Col 1: Brand & Promise */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="inline-block bg-white rounded-lg p-1">
              <Logo size="md" />
            </div>
            <p className="text-[14px] font-bold text-[#0096C7] dark:text-[#90E0EF]">
              Swiftvero Express — Your world, connected.
            </p>
            <p className="text-[14px] text-[#4B5563] dark:text-slate-400 leading-[1.5] max-w-sm">
              Swiftvero Express Ltd (RC: 1894022) is an international logistics platform coordinating outbound parcel, document, and cargo shipping from Nigeria to confirmed destinations worldwide.
            </p>
            <div className="text-[13px] text-[#4B5563] dark:text-slate-400 space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>Primary Hub: Ikeja Cargo Hub &amp; Intake Center, Lagos, Nigeria</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>support@swiftvero.ng</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>Bilateral International Air Logistics Corridors</span>
              </div>
            </div>
          </div>

          {/* Col 2: Services */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold text-[#111827] dark:text-white uppercase tracking-wider">
              Services
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#4B5563] dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('services')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Personal International Shipping
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('business')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Business &amp; Artisan Export
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('services')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Priority Air Express (2–3 Days)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('services')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Standard Air Courier (4–6 Days)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenComingSoon}
                  className="hover:text-[#00B4D8] transition-colors inline-flex items-center gap-1.5 text-[#4B5563] dark:text-slate-400 cursor-pointer"
                >
                  <span>Domestic Moving</span>
                  <span className="text-[11px] font-medium bg-[#F1F5F9] dark:bg-slate-800 px-2 py-0.5 rounded-full border border-[#E2E8F0] dark:border-slate-700">
                    Preview
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold text-[#111827] dark:text-white uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#4B5563] dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Get an Instant Quote
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('track')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Track Shipment
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('faq')}
                  className="hover:text-[#00B4D8] transition-colors text-left font-semibold text-[#111827] dark:text-white cursor-pointer"
                >
                  Help Centre &amp; FAQs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('prohibited')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Prohibited Goods Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Contact Support
                </button>
              </li>
              {onOpenStaffPortal && (
                <li className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenStaffPortal}
                    className="hover:text-[#00B4D8] transition-colors text-left inline-flex items-center gap-1.5 text-[#4B5563] dark:text-slate-400 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-[#00B4D8]" />
                    <span>Branch Desk Admin</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-bold text-[#111827] dark:text-white uppercase tracking-wider">
              Compliance &amp; Terms
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#4B5563] dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('terms')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('privacy')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Privacy Policy (NDPA)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('kyc')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  KYC &amp; Identity Verification
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('pricing')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Pricing &amp; Quotation Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('cancellation')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Cancellation &amp; Refund Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenPolicy('claims')}
                  className="hover:text-[#00B4D8] transition-colors text-left cursor-pointer"
                >
                  Claims &amp; Liability Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Operating Scope & Physical Verification Notice */}
        <div className="py-5 text-[13px] text-[#4B5563] dark:text-slate-400 leading-[1.5] border-b border-[#E2E8F0] dark:border-slate-800 space-y-2">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
            <p>
              <strong className="text-[#111827] dark:text-white">Operating Scope:</strong> Swiftvero Express Ltd
              coordinates outbound international parcel, document, and cargo shipping from Nigeria through commercial airline carriage. Online estimates are confirmed following calibrated physical scale weighing and volumetric verification at our intake facility. Doorstep pickup and depot drop-off are free in eligible areas. All shipments are screened in accordance with Nigerian civil aviation safety regulations.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#4B5563] dark:text-slate-400">
          <div className="tabular-nums">
            © {new Date().getFullYear()} Swiftvero Express Ltd. RC: 1894022. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-medium text-[#0F172A] dark:text-[#90E0EF] bg-[#CAF0F8] dark:bg-sky-950/60 border border-[#90E0EF] dark:border-sky-800 px-3 py-1 rounded-full">
              International Shipping · Lagos, Nigeria
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
