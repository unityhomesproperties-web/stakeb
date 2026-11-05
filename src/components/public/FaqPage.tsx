import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CreditCard,
  Plane,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
  tag?: string;
}

interface FaqCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: FaqItem[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'general',
    name: 'General & Company',
    description: 'Learn about Swiftvero Express, our network, and international shipping standards.',
    icon: HelpCircle,
    items: [
      {
        q: 'What is Swiftvero Express?',
        a: 'Swiftvero Express Ltd is a Nigerian international logistics technology company coordinating cargo, parcel, and express shipping from Nigeria to destinations worldwide. We combine automated booking, 100% free doorstep pickup across covered zones, counter intake hubs, transparent itemized pricing, and proactive exception monitoring.',
      },
      {
        q: 'Where does Swiftvero operate in Nigeria?',
        a: 'Our primary consolidation gateway is the Ikeja Cargo Hub in Lagos, with an intake branch in Lekki Phase 1 and pickup networks active across Lagos and Abuja (Central Area, Wuse, Maitama, Garki). We serve individual shippers, SMEs, and commercial exporters across Nigeria shipping to over 190 destinations worldwide.',
      },
      {
        q: 'Does Swiftvero own cargo aircraft or shipping fleets?',
        a: 'Swiftvero is a logistics coordinator and technology platform, not an airline or ocean line operator. We manage ground intake, free doorstep pickup, physical verification, export compliance, and digital tracking, while carriage is operated through authorized international airlines, certified shipping operators, and vetted linehaul providers.',
      },
      {
        q: 'What goods are strictly prohibited from international shipping?',
        a: 'Prohibited goods include hazardous materials (flammables, compressed gases, explosives), live animals, perishables without phytosanitary documentation, counterfeit goods, currency/bullion, firearms/ammunition, illegal substances, and uncertified lithium batteries. View our full Prohibited & Restricted Goods Policy for details.',
      },
      {
        q: 'Is identity verification (KYC) mandatory for all shippers?',
        a: 'Yes. In strict compliance with Nigerian export regulations (NIPOST, NDLEA, and international aviation security rules), all international shippers must complete government ID verification before consignments are cleared for export carriage.',
      },
    ],
  },
  {
    id: 'booking-pickup',
    name: 'Booking & Doorstep Pickup',
    description: 'How pickup scheduling, measurement verification, and quote adjustments work.',
    icon: Truck,
    items: [
      {
        q: 'Is doorstep pickup really free?',
        a: 'Yes! Doorstep pickup is 100% free for all international consignments in our covered service areas across Lagos and Abuja. An authorized Swiftvero pickup agent arrives at your scheduled time slot with calibrated digital scales and measuring tapes.',
      },
      {
        q: 'What is the difference between actual and volumetric weight?',
        a: 'Actual weight is the parcel’s physical weight on a calibrated digital scale in kilograms. Volumetric (dimensional) weight reflects the volume the parcel occupies on an aircraft, calculated as (Length × Width × Height in cm) ÷ 5,000. Airlines charge based on the higher of the two, called Chargeable Weight.',
      },
      {
        q: 'What happens if the verified parcel measurements differ from my estimate?',
        a: 'If our agent records a weight or dimensional discrepancy at intake, Swiftvero immediately issues a revised, itemized quote explaining the exact variance. We never silently alter or bill an accepted price—you must review and affirmatively approve the revised quote before we proceed.',
      },
      {
        q: 'Can I drop off my package physically instead of booking a pickup?',
        a: 'Absolutely. You can walk into our Ikeja Cargo Consolidation Gateway (Airport Road) or our Lekki Intake Branch (Admiralty Way) Monday through Saturday for immediate counter weighing, inspection, and intake receipting.',
      },
      {
        q: 'What packaging standards should I follow?',
        a: 'Items should be packed securely in sturdy, double-walled corrugated cardboard boxes with adequate internal cushioning (bubble wrap or air pillows). Fragile items must be declared. Liquids, powders, and glass require specialized containment.',
      },
    ],
  },
  {
    id: 'tracking-payments',
    name: 'Tracking & Payments',
    description: 'Real-time milestones, proactive delay alerts, approved payment methods, and refunds.',
    icon: CreditCard,
    items: [
      {
        q: 'How does Swiftvero’s proactive delay notification work?',
        a: 'Unlike traditional trackers where delays appear as silent gaps, our system monitors scan freshness against expected carrier transit windows. If an expected milestone is overdue, an internal operations ticket triggers, we contact the linehaul partner, and we proactively message you with an honest update on what is confirmed.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept instant Nigerian bank transfers (via secure virtual accounts), debit cards (Mastercard, Visa, Verve) via authorized payment gateways, and corporate invoiced credit terms for verified SME business accounts.',
      },
      {
        q: 'When do I actually pay for my shipment?',
        a: 'You only pay after your parcel has been physically collected/intake-verified and you have reviewed and approved the finalized itemized quotation. There is zero upfront pre-charging before physical parcel verification.',
      },
      {
        q: 'What is your cancellation and refund policy?',
        a: 'You may cancel for a 100% refund at any point before the parcel is booked into international carrier custody. Once carrier linehaul custody has commenced, refunds are governed by linehaul carrier recall provisions and administrative handling fees as outlined in our Shipping Terms.',
      },
      {
        q: 'How does the 3% freight cashback work?',
        a: 'Verified customers earn 3% freight cashback on every completed international delivery. Cashback is held pending delivery closure and released directly to your customer reward ledger for use toward future shipments or approved payout workflows.',
      },
    ],
  },
  {
    id: 'swiftshare',
    name: 'SwiftShare (Traveller-Assisted)',
    description: 'Our innovative peer traveller-assisted express delivery pilot program.',
    icon: Plane,
    items: [
      {
        q: 'What is SwiftShare?',
        a: 'SwiftShare is a peer traveller-assisted express delivery pilot connecting vetted, ID-verified international air travellers who have spare baggage capacity with shippers needing urgent, high-value personal or business items delivered quickly.',
        tag: 'Pilot Feature',
      },
      {
        q: 'How are travellers and senders vetted?',
        a: 'Both senders and travellers must complete Swiftvero’s mandatory 8-state KYC compliance pipeline (government-issued international passport or NIN verification). Unverified users cannot book or accept SwiftShare consignments.',
        tag: 'Mandatory KYC',
      },
      {
        q: 'How is package safety and airport security guaranteed?',
        a: 'Every SwiftShare parcel undergoes mandatory in-person counter intake at Swiftvero hubs. Staff weigh, inspect the contents against airline security rules, and seal the item in a tamper-evident serial-numbered bag. Travellers never accept sealed boxes from strangers—everything is verified, recorded, and sealed by Swiftvero.',
        tag: 'Tamper-Evident Seal',
      },
      {
        q: 'Which categories are currently eligible for SwiftShare?',
        a: 'Currently, Personal Clothing and Business/Personal Documents are open for requests now. Human Hair & Wigs is under review and not yet bookable until pilot clearance is granted. Food, powders, liquids, and commercial merchandise are strictly excluded.',
      },
      {
        q: 'How and when are traveller payouts released?',
        a: 'Payouts are held in secure escrow upon booking. Compensation is NEVER released on a single unconfirmed click. Payout is released only after the verified recipient inspects the tamper seal and confirms delivery in the recipient verification portal.',
        tag: 'Escrow Release',
      },
      {
        q: 'What happens if a recipient is unreachable or handover fails?',
        a: 'Travellers are instructed never to abandon items or hand them to unauthorized third parties. If handover fails, the traveller drops the sealed parcel at an approved partner airport depot or local courier hub, and Swiftvero operations mediates resolution or return shipping.',
      },
      {
        q: 'Can a Safety Hold be triggered during transit?',
        a: 'Yes. If a tamper-seal discrepancy is reported, a flight itinerary changes unexpectedly, or an exception arises, Swiftvero operations can flag an immediate Safety Hold, freezing escrow payout until an investigation is completed.',
      },
    ],
  },
];

interface FaqPageProps {
  onOpenQuote: () => void;
  onOpenContact: () => void;
  onNavigateToSwiftShare: () => void;
  onNavigateToTravelCarry?: () => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({
  onOpenQuote,
  onOpenContact,
  onNavigateToSwiftShare,
  onNavigateToTravelCarry,
}) => {
  const navigateToShare = onNavigateToSwiftShare || onNavigateToTravelCarry;
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'What is Swiftvero Express?': true,
    'What is SwiftShare?': true,
  });

  const toggleItem = (q: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [q]: !prev[q],
    }));
  };

  const filteredCategories = FAQ_CATEGORIES.map((cat) => {
    if (activeTab !== 'all' && cat.id !== activeTab) {
      return null;
    }
    const matchingItems = cat.items.filter((item) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.q.toLowerCase().includes(query) ||
        item.a.toLowerCase().includes(query) ||
        (item.tag && item.tag.toLowerCase().includes(query))
      );
    });
    if (matchingItems.length === 0) return null;
    return {
      ...cat,
      items: matchingItems,
    };
  }).filter(Boolean) as FaqCategory[];

  return (
    <div className="bg-[#F5FBFD] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CAF0F8] border border-[#90E0EF] text-xs font-semibold text-[#00B4D8]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help Center &amp; Frequently Asked Questions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif-display font-medium text-[#354B55] tracking-tight">
            Transparent Answers, Zero Guesswork
          </h1>
          <p className="text-sm text-[#6A808C] max-w-xl mx-auto leading-relaxed">
            Everything you need to know about international air shipping from Nigeria, free doorstep
            pickups, itemized quotes, and our SwiftShare pilot.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-lg mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6A808C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. pickup, volumetric weight, SwiftShare, escrow)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCEFF3] rounded-xl text-xs text-[#354B55] placeholder:text-[#6A808C] focus:outline-hidden focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8] shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6A808C] hover:text-[#354B55]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-[#00B4D8] text-white shadow-xs'
                : 'bg-white border border-[#DCEFF3] text-[#6A808C] hover:border-[#90E0EF] hover:text-[#354B55]'
            }`}
          >
            All Questions
          </button>
          {FAQ_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#00B4D8] text-white shadow-xs'
                    : 'bg-white border border-[#DCEFF3] text-[#6A808C] hover:border-[#90E0EF] hover:text-[#354B55]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Categories & Accordions */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DCEFF3] p-10 text-center space-y-3">
            <HelpCircle className="w-8 h-8 text-[#6A808C] mx-auto opacity-50" />
            <h3 className="text-sm font-semibold text-[#354B55]">No matching questions found</h3>
            <p className="text-xs text-[#6A808C]">
              Try searching with different terms, or reach out directly to our customer support team.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="text-xs text-[#00B4D8] font-semibold hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center gap-2.5 px-1">
                    <div className="w-7 h-7 rounded-lg bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-serif-display font-medium text-[#354B55]">
                        {category.name}
                      </h2>
                      <p className="text-[11px] text-[#6A808C]">{category.description}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#DCEFF3] divide-y divide-[#DCEFF3] overflow-hidden shadow-xs">
                    {category.items.map((item) => {
                      const isOpen = !!openItems[item.q];
                      return (
                        <div key={item.q} className="transition-colors">
                          <button
                            onClick={() => toggleItem(item.q)}
                            className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 hover:bg-[#F5FBFD] transition-colors focus:outline-hidden"
                            aria-expanded={isOpen}
                          >
                            <div className="space-y-1 pr-2">
                              <span className="text-xs sm:text-sm font-semibold text-[#354B55] block leading-snug">
                                {item.q}
                              </span>
                              {item.tag && (
                                <span className="inline-block text-[10px] font-medium text-[#00B4D8] bg-[#CAF0F8] px-2 py-0.5 rounded-full border border-[#90E0EF]">
                                  {item.tag}
                                </span>
                              )}
                            </div>
                            <div className="w-6 h-6 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center shrink-0 mt-0.5">
                              {isOpen ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </button>
                          {isOpen && (
                            <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-[#6A808C] leading-relaxed border-t border-[#DCEFF3]/40 bg-[#F5FBFD]/40">
                              <p>{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SwiftShare Banner Callout */}
        <div className="bg-[#CAF0F8] rounded-2xl border border-[#90E0EF] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-lg">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#00B4D8] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pilot Program</span>
            </div>
            <h3 className="text-base sm:text-lg font-serif-display font-medium text-[#354B55]">
              Curious about SwiftShare traveller-assisted delivery?
            </h3>
            <p className="text-xs text-[#6A808C] leading-relaxed">
              Explore how tamper-evident seal serials, KYC verification, and delivery escrow payout
              keep peer delivery structured, secure, and compliant.
            </p>
          </div>
          <button
            onClick={navigateToShare}
            className="px-4 py-2.5 bg-[#00B4D8] hover:opacity-95 text-white text-xs font-semibold rounded-xl transition-opacity whitespace-nowrap shrink-0 flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Explore SwiftShare</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Still have questions? Help card */}
        <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#CAF0F8] text-[#00B4D8] flex items-center justify-center mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-serif-display font-medium text-[#354B55]">
              Still have questions about shipping with Swiftvero?
            </h3>
            <p className="text-xs text-[#6A808C] max-w-md mx-auto">
              Our Nigerian logistics support specialists are ready to help via official WhatsApp,
              phone, or direct support ticket.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenContact}
              className="px-4 py-2 bg-white border border-[#DCEFF3] text-[#354B55] hover:bg-[#F5FBFD] text-xs font-semibold rounded-xl transition-colors"
            >
              Contact Support Desk
            </button>
            <button
              onClick={onOpenQuote}
              className="px-4 py-2 bg-[#00B4D8] hover:opacity-95 text-white text-xs font-semibold rounded-xl transition-opacity flex items-center gap-1.5 shadow-xs"
            >
              <span>Calculate Shipping Quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
