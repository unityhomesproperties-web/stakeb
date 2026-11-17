import React, { useState, useMemo } from 'react';
import { X, FileText, CheckCircle2, Search, ChevronDown, ChevronUp } from 'lucide-react';

export type PolicyKey =
  | 'terms'
  | 'privacy'
  | 'pickup'
  | 'shipping'
  | 'prohibited'
  | 'packaging'
  | 'protection'
  | 'priority'
  | 'cancellation'
  | 'claims'
  | 'responsibilities'
  | 'payment'
  | 'kyc'
  | 'pricing'
  | 'cashback'
  | 'complaints'
  | 'declaration'
  | 'whatsapp'
  | 'retention';

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
  pickup: {
    key: 'pickup',
    title: 'Customer Pickup Policy',
    version: 'v2.4',
    lastUpdated: 'November 2026',
    summary: 'Free pickup within 24 hours of booking confirmation and certified facility weighing rules.',
    sections: [
      {
        heading: '1. Free Pickup Commitment',
        body: 'Swiftvero Express offers free doorstep pickup for all eligible international shipment bookings. International shipping, air freight, customs, and delivery are quoted and paid separately. Free pickup does NOT mean free shipping or free international delivery.',
      },
      {
        heading: '2. 24-Hour Collection Promise',
        body: 'Once a customer successfully submits a pickup booking, Swiftvero arranges collection of the package from the confirmed address within 24 hours of booking confirmation. This 24-hour commitment applies strictly to physical collection from your premises in Nigeria, not international transit or destination delivery.',
      },
      {
        heading: '3. Facility Weighing Policy (No Scale at Doorstep)',
        body: 'Swiftvero does NOT send a weighing scale with the pickup collection person. The collection handler inspects the outer condition, verifies the package count, and issues a collection receipt. Final physical inspection, dimensions measurement, reinforcement where required, and certified digital scale weighing take place exclusively at the Swiftvero facility before your final shipping quotation is generated.',
      },
      {
        heading: '4. Sender Availability & Accurate Contact',
        body: 'The customer must make the package available at the confirmed pickup address, provide reachable phone numbers, and provide accurate landmarks. If collection is prevented due to sender unavailability or inaccessible premises, Operations Admin records the exception and reschedules collection.',
      },
    ],
  },
  packaging: {
    key: 'packaging',
    title: 'Packaging & Repackaging Policy',
    version: 'v2.0',
    lastUpdated: 'November 2026',
    summary: 'Standards for international air cargo packaging and protective repackaging.',
    sections: [
      {
        heading: '1. Safe Air Carriage Standards',
        body: 'All shipments must be sufficiently packed to withstand international air cargo handling, cabin pressure variations, and transit consolidation.',
      },
      {
        heading: '2. Facility Inspection & Reinforcement',
        body: 'Upon arrival at our gateway intake center, every package is physically inspected. If an outer carton is compromised, unsealed, or fragile, facility staff provide professional reinforcement or repackaging.',
      },
      {
        heading: '3. Customer Approval for Chargeable Packaging',
        body: 'Standard protective tape and inspection sealing are provided. Any specialized crating, heavy-duty insulated packaging, or hazardous material prep will be clearly explained and must be approved by the customer before any charge is added.',
      },
    ],
  },
  responsibilities: {
    key: 'responsibilities',
    title: 'Customer Responsibilities',
    version: 'v2.0',
    lastUpdated: 'November 2026',
    summary: 'Legal obligations, accurate declarations, and customer commitments.',
    sections: [
      {
        heading: '1. Truthful & Complete Declarations',
        body: 'The customer is legally responsible for declaring the true contents, item quantities, and market values of all goods. Misdeclaring commercial goods as personal gifts or concealing restricted items violates aviation and customs regulations.',
      },
      {
        heading: '2. Prohibited Goods Certification',
        body: 'Customers certify that packages do not contain undeclared firearms, hazardous chemicals, flammable substances, narcotics, or counterfeit currency. Any prohibited goods will be quarantined and reported to regulatory authorities.',
      },
      {
        heading: '3. Pickup Availability & Handover',
        body: 'Customers must be reachable at the designated phone number and ensure an authorized adult is available to hand over packages to the assigned Swiftvero collection handler.',
      },
      {
        heading: '4. Timely Quotation Review & Payment',
        body: 'Once the final shipping quotation is prepared following facility weighing, the customer must review and approve the quote promptly so flight cargo manifests can be booked without delay.',
      },
    ],
  },
  payment: {
    key: 'payment',
    title: 'Payment & Quotation Policy',
    version: 'v2.2',
    lastUpdated: 'November 2026',
    summary: 'Transparent billing, approved payment methods, and advance settlement rules.',
    sections: [
      {
        heading: '1. Transparent Customer Quotations',
        body: 'Customer-facing quotations display only the verified chargeable weight, selected shipping speed (Standard vs Priority), optional cargo protection, priority surcharge (if selected), and statutory VAT. Internal airline fuel surcharges and carrier operational costs are absorbed into our transparent freight rates.',
      },
      {
        heading: '2. Advance Payment Required',
        body: 'International shipping charges must be settled in full before goods are dispatched on international flights. Pickup collection remains completely free (₦0).',
      },
      {
        heading: '3. Approved Payment Channels',
        body: 'Payments are accepted through approved electronic bank transfer, verified branch POS, or authorized online card gateways. Swiftvero collection handlers never accept cash on behalf of international freight charges at your doorstep.',
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
        body: 'Aviation security laws require every sender sending goods internationally to verify their identity before air carriage can proceed.',
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
        body: 'Once a shipment has departed on an international flight, cancellation is no longer possible.',
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
  declaration: {
    key: 'declaration',
    title: 'Shipment Declaration & Value Policy',
    version: 'v2.0',
    lastUpdated: 'November 2026',
    summary: 'Guidelines on item descriptions, declared monetary values, and commercial invoices.',
    sections: [
      {
        heading: '1. Accurate Content Descriptions',
        body: 'All items must be declared by specific item name and category (e.g., "Woven cotton shirts", not "General personal items"). Vague descriptions can cause airline holdbacks or customs rejection.',
      },
      {
        heading: '2. Declared Value for Carriage',
        body: 'The declared value must match commercial sales receipts or proof of purchase. Deliberate undervaluation to avoid customs duties violates international export regulations.',
      },
      {
        heading: '3. Physical Verification at Facility',
        body: 'Swiftvero staff verify package contents against your digital declaration during physical intake. Discrepancies require customer confirmation before flight booking.',
      },
    ],
  },
  whatsapp: {
    key: 'whatsapp',
    title: 'WhatsApp Business Channel Notice',
    version: 'v1.2',
    lastUpdated: 'November 2026',
    summary: 'Official Swiftvero WhatsApp assistance, tracking notifications, and security guidelines.',
    sections: [
      {
        heading: '1. Official Communication Channel',
        body: 'Swiftvero delivers real-time shipping notifications and customer support through our official verified WhatsApp Business channel. We will never ask for your password, PIN, or full card details via chat.',
      },
      {
        heading: '2. Customer Identity Verification',
        body: 'To protect sensitive shipment and financial details, support representatives verify customer credentials before disclosing private tracking records or releasing account information.',
      },
      {
        heading: '3. Human Support Escalation',
        body: 'You can request immediate escalation to a live operations coordinator during standard operating hours (Monday to Saturday, 8:00 AM – 6:00 PM West Africa Time).',
      },
    ],
  },
  retention: {
    key: 'retention',
    title: 'Data Retention & Record Deletion Policy',
    version: 'v1.4',
    lastUpdated: 'November 2026',
    summary: 'Rules for document storage, compliance archives, and customer deletion requests.',
    sections: [
      {
        heading: '1. Aviation and Tax Compliance Records',
        body: 'Shipping waybills, export manifests, and financial records are retained for minimum statutory periods mandated by aviation authorities and tax administrations.',
      },
      {
        heading: '2. Customer ID Document Storage',
        body: 'KYC identity documents are stored in encrypted vaults with restricted role access and are retained only for the active compliance lifetime of your account.',
      },
      {
        heading: '3. Account Deletion and Right to Erasure',
        body: 'You may request deletion of personal profile data and address book entries through the customer portal, subject to lawful statutory retention requirements for completed cargo shipments.',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });

  // Filter policies based on search query
  const filteredPolicies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return Object.values(LEGAL_POLICIES);
    return Object.values(LEGAL_POLICIES).filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.sections.some(
          (s) => s.heading.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)
        )
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const current = LEGAL_POLICIES[activeKey] || LEGAL_POLICIES['terms'];

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
      <div className="sv-card shadow-xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#CAF0F8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-white text-[#00B4D8] flex items-center justify-center shadow-2xs">
              <FileText className="w-4 h-4 text-[#00B4D8]" />
            </div>
            <div>
              <h2 className="sv-h3 text-[#0F172A]">Swiftvero Policies &amp; Help Centre</h2>
              <p className="text-[12px] text-[#0F172A]/80">19 Simple English policies, carrier rules, and customer standards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#0F172A] hover:bg-white/70 p-2 rounded-full transition-colors cursor-pointer"
            aria-label="Close legal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sidebar + Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Policy navigation list with Search */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-[#E2E8F0] bg-[#FFFFFF] p-3 flex flex-col max-h-56 md:max-h-full">
            {/* Search Box */}
            <div className="relative mb-2.5">
              <Search className="w-4 h-4 text-[#4B5563] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search 19 policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sv-input w-full pl-9 pr-3 py-2 text-[13px] border border-[#CBD5E1] rounded-[8px] bg-[#F8FAFC] text-[#111827]"
              />
            </div>

            <div className="text-[11px] font-bold text-[#4B5563] uppercase px-2 mb-1.5 tracking-wider flex justify-between">
              <span>All 19 Policies</span>
              <span className="tabular-nums">{filteredPolicies.length} match</span>
            </div>

            <div className="space-y-1 overflow-y-auto flex-1 pr-1">
              {filteredPolicies.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setActiveKey(p.key);
                    setExpandedSections({ 0: true, 1: true, 2: true });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                    activeKey === p.key
                      ? 'bg-[#CAF0F8] text-[#0F172A] font-bold border border-[#90E0EF]'
                      : 'text-[#1F2937] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="truncate">{p.title}</div>
                  <div className="text-[11px] text-[#4B5563] font-normal truncate mt-0.5">{p.summary}</div>
                </button>
              ))}
              {filteredPolicies.length === 0 && (
                <div className="sv-label p-3 text-center">No matching policy found.</div>
              )}
            </div>
          </div>

          {/* Active Policy Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-white space-y-5">
            <div className="border-b border-[#E2E8F0] pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="sv-h2">{current.title}</h3>
                <span className="text-[12px] font-semibold text-[#0F172A] bg-[#CAF0F8] px-3 py-0.5 rounded-full border border-[#90E0EF] whitespace-nowrap">
                  Version {current.version} · {current.lastUpdated}
                </span>
              </div>
              <p className="sv-body mt-2">{current.summary}</p>
            </div>

            {/* Expandable Sections */}
            <div className="space-y-3">
              {current.sections.map((sec, idx) => {
                const isExpanded = expandedSections[idx] !== false;
                return (
                  <div
                    key={idx}
                    className="border border-[#CBD5E1] rounded-[8px] overflow-hidden bg-white shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(idx)}
                      className="w-full flex items-center justify-between p-4 text-left bg-[#F8FAFC] hover:bg-[#CAF0F8]/40 transition-colors cursor-pointer"
                    >
                      <span className="text-[14px] font-bold text-[#111827]">{sec.heading}</span>
                      <span className="w-7 h-7 rounded-full border border-[#CBD5E1] bg-white flex items-center justify-center shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#00B4D8]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#4B5563]" />
                        )}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="p-4 sv-body border-t border-[#E2E8F0]">
                        {sec.body}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-[#CAF0F8] rounded-[12px] border border-[#90E0EF] text-[13px] text-[#0F172A]">
              <span className="font-bold">Standard Operating Notice:</span> Swiftvero Express
              coordinates international shipping in compliance with civil aviation regulations.
              Package weighing is performed accurately using calibrated digital scales at our facility intake before final payment.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
          <span className="sv-label">Swiftvero Express Ltd · Official Policy Repository</span>
          <div className="flex items-center gap-2.5">
            {showAcceptButton && (
              <button
                onClick={() => {
                  onAccept?.();
                  onClose();
                }}
                className="sv-btn-primary px-5 py-2 rounded-full text-[13px] flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Understand &amp; Agree</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 text-[13px] font-semibold text-[#111827] bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded-full transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
