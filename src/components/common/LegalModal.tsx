import React, { useState } from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';

export type PolicyKey =
  | 'terms'
  | 'privacy'
  | 'kyc'
  | 'prohibited'
  | 'shipping'
  | 'pricing'
  | 'cancellation'
  | 'claims'
  | 'priority'
  | 'protection'
  | 'cashback'
  | 'complaints';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPolicy?: PolicyKey;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

interface PolicyDetail {
  key: PolicyKey;
  title: string;
  version: string;
  lastUpdated: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
}

export const LEGAL_POLICIES: Record<PolicyKey, PolicyDetail> = {
  terms: {
    key: 'terms',
    title: 'Terms of Use',
    version: 'v2.2',
    lastUpdated: 'October 2026',
    summary: 'Clear rules for using the Swiftvero Express shipping platform.',
    sections: [
      {
        heading: '1. What Swiftvero Express Does',
        body: 'Swiftvero Express coordinates international cargo, parcel, and express shipping to destinations worldwide. We coordinate carriage through licensed air transport and international handling networks. Swiftvero does not own or operate aircraft or cargo vessels.',
      },
      {
        heading: '2. User Information and Honesty',
        body: 'You must provide accurate information when booking. Declaring prohibited goods or using false identity credentials will lead to immediate cancellation of your shipment.',
      },
      {
        heading: '3. Company Property',
        body: 'All Swiftvero logos, software, and brand assets belong to Swiftvero Express Ltd. Copying or imitating our brand without permission is prohibited.',
      },
    ],
  },
  privacy: {
    key: 'privacy',
    title: 'Privacy Notice',
    version: 'v2.1',
    lastUpdated: 'October 2026',
    summary: 'How we protect your personal and shipment information under the Nigeria Data Protection Act (NDPA).',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect your name, phone number, address, recipient contact details, package descriptions, declared values, and official identification required for international shipping.',
      },
      {
        heading: '2. How We Use It',
        body: 'We use your details to schedule pickups, verify package measurements, prepare international air waybills, update tracking, and complete customs clearance.',
      },
      {
        heading: '3. Privacy & Security',
        body: 'Your identity documents are securely stored and accessible only to authorized compliance staff. We never sell your personal information.',
      },
    ],
  },
  kyc: {
    key: 'kyc',
    title: 'KYC & Identity Verification Notice',
    version: 'v2.0',
    lastUpdated: 'October 2026',
    summary: 'Statutory identity verification required before international carriage.',
    sections: [
      {
        heading: '1. Mandatory Verification',
        body: 'Aviation security laws require every consignor sending goods internationally to verify their identity before air carriage can proceed.',
      },
      {
        heading: '2. Accepted Identification',
        body: 'We accept a valid Nigerian International Passport, National Identity Number (NIN) slip, or Driver’s Licence. For registered companies, Corporate Affairs Commission (CAC) status is also verified.',
      },
      {
        heading: '3. Simple Digital Process',
        body: 'Verification is completed in a few short steps on your phone or computer. Once approved, your account can book shipments without repeating full verification.',
      },
    ],
  },
  prohibited: {
    key: 'prohibited',
    title: 'Prohibited and Restricted Goods Policy',
    version: 'v2.3',
    lastUpdated: 'October 2026',
    summary: 'Items that cannot be shipped by air under international aviation rules.',
    sections: [
      {
        heading: '1. Strictly Forbidden Items',
        body: 'Firearms, ammunition, fireworks, explosives, flammable liquids (petrol, paint, pure alcohol), aerosol sprays, narcotics, currency notes or coins, counterfeit items, and live animals are strictly forbidden on all flights.',
      },
      {
        heading: '2. Items Requiring Permits',
        body: 'Commercial food products, prescription medications, cosmetics in large quantities, and standalone lithium batteries require regulatory clearance and certificates before booking.',
      },
      {
        heading: '3. Security Screening',
        body: 'Every package is physically inspected and X-ray screened at our gateway intake center. Any forbidden item will be rejected immediately.',
      },
    ],
  },
  shipping: {
    key: 'shipping',
    title: 'Shipping and Service Terms',
    version: 'v2.0',
    lastUpdated: 'October 2026',
    summary: 'How booking, service tiers, and transit timelines work.',
    sections: [
      {
        heading: '1. Service Tiers',
        body: 'We offer Priority Air Express (2–3 business days) and Standard Air Courier (4–6 business days) on supported international lanes. Transit times are business days from flight departure, not including destination customs checks.',
      },
      {
        heading: '2. Charges Based on Verified Weight',
        body: 'Your price is calculated on the chargeable weight — the larger of actual scale weight and volumetric weight (L × W × H ÷ 5000). Measurements are verified upon intake.',
      },
      {
        heading: '3. Delivery Confirmation',
        body: 'Deliveries require a recipient signature or official delivery confirmation at the destination address.',
      },
    ],
  },
  pricing: {
    key: 'pricing',
    title: 'Pricing and Quotation Policy',
    version: 'v2.0',
    lastUpdated: 'October 2026',
    summary: 'Transparent pricing with no hidden charges.',
    sections: [
      {
        heading: '1. Transparent Itemization',
        body: 'Every quote clearly shows base air freight, jet fuel surcharge, security documentation, collection (always free), and statutory 7.5% Nigerian VAT. We never add surprise fees after you approve your quote.',
      },
      {
        heading: '2. Free Pickup Always',
        body: 'Doorstep pickup and depot drop-off are both completely free (₦0) on all bookings. We do not charge collection fees.',
      },
      {
        heading: '3. Discrepancy Approval',
        body: 'If physical scale measurements differ from your original estimate, we send you an itemized breakdown. You must approve any adjusted amount before payment.',
      },
    ],
  },
  cancellation: {
    key: 'cancellation',
    title: 'Cancellation and Refund Policy',
    version: 'v2.1',
    lastUpdated: 'October 2026',
    summary: 'Your cancellation rights and our facility collection rule.',
    sections: [
      {
        heading: '1. Cancellation Before Pickup',
        body: 'If you cancel your shipment before pickup or drop-off occurs, you receive a full 100% refund of all fees paid.',
      },
      {
        heading: '2. Mandatory Cancellation Disclaimer at Facility',
        body: 'Once your shipment has arrived at a Swiftvero facility, cancelling it does not include returning or redelivering the goods to you — Swiftvero is not responsible for returning or delivering the goods back after a cancellation at this stage. Arranging collection of cancelled goods from our facility is the customer’s responsibility.',
      },
      {
        heading: '3. Flights in Transit',
        body: 'Once a consignment has departed on an international flight, cancellation is no longer possible.',
      },
    ],
  },
  claims: {
    key: 'claims',
    title: 'Claims and Liability Policy',
    version: 'v1.7',
    lastUpdated: 'October 2026',
    summary: 'How to file a claim in case of loss or damage.',
    sections: [
      {
        heading: '1. Standard Aviation Liability',
        body: 'International air carriage liability is governed by standard aviation conventions (Montreal Convention), capped at standard SDR rates per kilogram.',
      },
      {
        heading: '2. How to File',
        body: 'Damage claims must be submitted with photos within 7 days of delivery. Non-delivery must be reported within 14 days of estimated arrival.',
      },
      {
        heading: '3. Packaging Evidence',
        body: 'Keep all packaging cartons and inner materials so our claims team can evaluate your claim fairly.',
      },
    ],
  },
  priority: {
    key: 'priority',
    title: 'Priority Air Express Terms',
    version: 'v1.5',
    lastUpdated: 'October 2026',
    summary: 'Guidelines for our fastest expedited service tier.',
    sections: [
      {
        heading: '1. Fastest Available Lane',
        body: 'Priority Air Express offers expedited dispatch and prioritized handling on supported international routes, targeting delivery within 2 to 3 business days.',
      },
      {
        heading: '2. Route Availability',
        body: 'Priority service is available on major commercial international lanes. For remote or restricted destinations where expedited handling cannot be fulfilled, only Standard Air Courier is offered.',
      },
      {
        heading: '3. Customs Clearance',
        body: 'Target delivery dates depend on standard customs clearance times and do not include delays caused by local regulatory holds.',
      },
    ],
  },
  protection: {
    key: 'protection',
    title: 'Shipment Protection & Underwriting Terms',
    version: 'v2.1',
    lastUpdated: 'October 2026',
    summary: 'Rules, coverage limits, deductibles, exclusions, and claims procedures for basic and premium shipment protection.',
    sections: [
      {
        heading: '1. Protection Options & Underwriting Architecture',
        body: 'Swiftvero offers two tiers of protection: (a) Included Basic Protection, governed by standard carrier conditions of carriage and Warsaw/Montreal convention liability limits up to ₦50,000; and (b) Optional Premium Shipment Coverage, underwritten in alliance with authorized underwriting partners (Leadway Assurance Alliance), providing declared value protection against verified loss or physical handling damage.',
      },
      {
        heading: '2. Premium Calculation & Invoicing',
        body: 'Premium coverage is calculated as an agreed percentage (1.5% in current configuration, subject to administrative policy updates) of the verified eligible declared value of declared items, subject to configured minimum and maximum limits. Basic protection incurs no additional fee (₦0).',
      },
      {
        heading: '3. Deductibles and Claims Settlement',
        body: 'For approved claims under Premium Shipment Coverage, an applicable deductible (excess) of 5% of the claimed loss or ₦10,000 (whichever is higher) applies. Compensation is disbursed via verified bank credit following survey assessment.',
      },
      {
        heading: '4. Strictly Excluded Goods',
        body: 'Coverage strictly excludes cash, banknotes, negotiable instruments, bullion, loose unpackaged glass/mirrors, perishable foodstuffs subject to rapid spoilage, counterfeit merchandise, and dangerous goods prohibited by international air transport regulations.',
      },
      {
        heading: '5. Claims Filing Deadlines & Evidence Checklist',
        body: 'Claims for damage must be submitted within 14 calendar days of delivery with photos of the outer carton, tamper seal, and damaged items. Claims for total non-delivery must be submitted within 21 days of scheduled delivery date.',
      },
      {
        heading: '6. Demonstration Mode Notice',
        body: 'In demonstration mode, policies and certificates operate as realistic interactive simulations. Production policies are issued in accordance with NAICOM standards.',
      },
    ],
  },
  cashback: {
    key: 'cashback',
    title: 'Cashback and Referral Terms',
    version: 'v1.6',
    lastUpdated: 'October 2026',
    summary: 'Earn rewards on completed international deliveries.',
    sections: [
      {
        heading: '1. Cashback Released Upon Delivery',
        body: 'Eligible cashback (3% of base freight) is released only after your shipment is successfully delivered and closed. Rewards are never released at booking.',
      },
      {
        heading: '2. Referral Rewards',
        body: 'Share your referral code with fellow businesses or individuals. You earn your referral bonus once your invited contact completes their first qualifying shipment.',
      },
      {
        heading: '3. Real Bank Payouts',
        body: 'Unlocked cashback balances can be disbursed directly to your registered Nigerian bank account upon request.',
      },
    ],
  },
  complaints: {
    key: 'complaints',
    title: 'Support and Complaints',
    version: 'v1.3',
    lastUpdated: 'October 2026',
    summary: 'How we handle questions, tickets, and complaints.',
    sections: [
      {
        heading: '1. Fast Responses',
        body: 'Submit a ticket through your account or WhatsApp desk. Our dispatch team reviews all queries and responds promptly with clear next steps.',
      },
      {
        heading: '2. Fair Resolution',
        body: 'If an issue arises, our operations team works directly with you to resolve it constructively and transparently.',
      },
    ],
  },
};

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialPolicy = 'terms',
  onAccept,
  showAcceptButton = false,
}) => {
  const [activeKey, setActiveKey] = useState<PolicyKey>(initialPolicy);

  if (!isOpen) return null;

  const current = LEGAL_POLICIES[activeKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl border border-[#DCEFF3] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCEFF3] bg-[#CAF0F8]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00B4D8]" />
            <h2 className="text-base font-bold text-[#354B55]">Swiftvero Policies & Legal Terms</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#6A808C] hover:text-[#354B55] p-1 rounded-md transition-colors"
            aria-label="Close legal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sidebar + Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Policy navigation list */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#DCEFF3] bg-[#FFFFFF] p-3 overflow-y-auto max-h-48 md:max-h-full">
            <div className="text-[11px] font-semibold text-[#6A808C] uppercase px-2 mb-2 tracking-wider">
              Legal Documents
            </div>
            <div className="space-y-0.5">
              {Object.values(LEGAL_POLICIES).map((p) => (
                <button
                  key={p.key}
                  onClick={() => setActiveKey(p.key)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeKey === p.key
                      ? 'bg-[#CAF0F8] text-[#00B4D8] font-semibold'
                      : 'text-[#354B55] hover:bg-slate-50'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Active Policy Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            <div className="border-b border-[#DCEFF3] pb-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold font-serif-display text-[#354B55]">{current.title}</h3>
                <span className="text-xs text-[#6A808C] whitespace-nowrap">
                  Version {current.version} · {current.lastUpdated}
                </span>
              </div>
              <p className="text-xs text-[#6A808C] mt-1">{current.summary}</p>
            </div>

            <div className="space-y-4">
              {current.sections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#354B55]">{sec.heading}</h4>
                  <p className="text-xs text-[#6A808C] leading-relaxed">{sec.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-3.5 bg-[#CAF0F8] rounded-md border border-[#DCEFF3] text-[11px] text-[#354B55]">
              <span className="font-semibold text-[#00B4D8]">Standard Operating Notice:</span> Swiftvero Express
              coordinates international cargo and parcel shipping in compliance with civil aviation regulations.
              Doorstep pickup and depot drop-off are both completely free.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#DCEFF3] bg-white flex items-center justify-between">
          <span className="text-xs text-[#6A808C]">Swiftvero Express Ltd · Official Policy Repository</span>
          <div className="flex items-center gap-2">
            {showAcceptButton && (
              <button
                onClick={() => {
                  onAccept?.();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-md transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>I Understand & Agree</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#354B55] bg-white hover:bg-slate-50 border border-[#DCEFF3] rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
