import React, { useState } from 'react';
import { Building2, ShieldCheck, CheckCircle2, ArrowRight, Send, Package, Briefcase, Warehouse } from 'lucide-react';

interface BusinessPageProps {
  onOpenQuote: () => void;
}

export const BusinessPage: React.FC<BusinessPageProps> = ({ onOpenQuote }) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('Fashion & Apparel');
  const [monthlyVolume, setMonthlyVolume] = useState('50 - 200 kg monthly');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="inline-block text-[12px] font-semibold text-[#0F172A] tracking-wide uppercase bg-[#CAF0F8] border border-[#90E0EF] px-3 py-1 rounded-full">
          Enterprise &amp; SME Solutions
        </span>
        <h1 className="sv-h1">
          Commercial international shipping for Nigerian enterprises.
        </h1>
        <p className="sv-body">
          Predictable volume rates, export documentation assistance, and scheduled doorstep collections for Nigerian manufacturers, fashion brands, craftsmen, and trading houses.
        </p>
      </div>

      {/* Flagship Commercial Overview with Authentic Nigerian Trade Visual */}
      <div className="bg-[#CAF0F8] border border-[#90E0EF] rounded-[12px] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5 relative h-80 sm:h-96 lg:h-full min-h-[380px] overflow-hidden bg-slate-100">
            <img
              src="/assets/aistudio/IMG_1993_5e79565e.jpeg"
              alt="Nigerian commercial trade partner packing premium export spices with SwiftVero international air cargo box"
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-5">
              <div className="text-white space-y-1">
                <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#00B4D8] text-white inline-block">
                  Verified Commercial Consignor
                </span>
                <p className="text-[13px] font-medium text-slate-100">
                  Global Spice &amp; Foodstuff Export Consolidation &middot; Lagos to London &amp; New York
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 p-6 sm:p-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-semibold bg-white border border-[#90E0EF] text-[#0F172A]">
              <span className="w-2 h-2 rounded-full bg-[#00B4D8]" />
              <span>Dedicated Commercial Logistics Desk</span>
            </div>
            <h2 className="sv-h2 text-[#0F172A]">
              “The secret ingredient to global success is a strong partnership.”
            </h2>
            <p className="sv-body text-[#0F172A]/85">
              Whether you are an established spice and foodstuff exporter, an haute couture fashion house, or a manufacturing enterprise shipping pallets of goods, Swiftvero acts as your reliable logistics arm with contracted air cargo allocations, transparent invoices, and personal account handling.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-white rounded-[8px] border border-[#E2E8F0]">
                <span className="sv-label block">Flight Allotments</span>
                <p className="font-bold text-[#111827] mt-0.5 text-[13px]">Lagos (LOS) &amp; Abuja (ABV)</p>
              </div>
              <div className="p-3 bg-white rounded-[8px] border border-[#E2E8F0]">
                <span className="sv-label block">Export Documentation</span>
                <p className="font-bold text-[#111827] mt-0.5 text-[13px]">NXP &amp; Phytosanitary Manifests</p>
              </div>
              <div className="p-3 bg-white rounded-[8px] border border-[#E2E8F0]">
                <span className="sv-label block">Volume Tiers</span>
                <p className="font-bold text-[#111827] mt-0.5 text-[13px]">50kg – 5,000kg+ Cargo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Value proposition (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="sv-card p-6 sm:p-7 space-y-5">
            <h2 className="sv-h2">
              Why Nigerian Exporters Choose Swiftvero
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-[8px] bg-[#CAF0F8] text-[#0F172A] flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="sv-h3">Volume Bracket Rate Cards</h3>
                  <p className="sv-body text-[14px] mt-0.5">
                    Tiered pricing for consistent commercial shippers. No sudden fuel surcharge spikes or non-transparent destination terminal fees.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-[8px] bg-[#CAF0F8] text-[#0F172A] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="sv-h3">Export Documentation &amp; Compliance</h3>
                  <p className="sv-body text-[14px] mt-0.5">
                    Clear guidance on commercial invoices, packing lists, and Nigerian Export Promotion Council (NEPC) documentation to avoid customs border holds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-[8px] bg-[#CAF0F8] text-[#0F172A] flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="sv-h3">Free Warehouse &amp; Workshop Pickups</h3>
                  <p className="sv-body text-[14px] mt-0.5">
                    Scheduled collections from your studio, workshop, or fulfillment center with calibrated scale weighing and instant digital custody sign-off at zero surcharge.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="sv-card p-5 space-y-2.5">
            <div className="sv-h3">Supported Nigerian Commercial Sectors</div>
            <div className="grid grid-cols-2 gap-2 sv-label text-[13px]">
              <div>• Fashion, Adire &amp; Haute Couture</div>
              <div>• Handcrafted Art, Carvings &amp; Sculpture</div>
              <div>• Packaged Dry Foods &amp; Shea Butter</div>
              <div>• Natural Cosmetics &amp; Organic Oils</div>
              <div>• Leather Goods &amp; Footwear</div>
              <div>• Publishing, Media &amp; Textbooks</div>
            </div>
          </div>
        </div>

        {/* Right: Business Enquiry Form (5 cols) */}
        <div className="lg:col-span-5 sv-card p-6 sm:p-7 space-y-4">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h2 className="sv-h3">Request Commercial Rates</h2>
            <p className="sv-label mt-0.5">Our commercial logistics team responds within 24 hours.</p>
          </div>

          {submitted ? (
            <div className="p-6 bg-[#CAF0F8] border border-[#90E0EF] rounded-[12px] text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-[#00B4D8] mx-auto" />
              <div className="sv-h3 text-[#0F172A]">Commercial Enquiry Received</div>
              <p className="text-[13px] text-[#0F172A]/85 leading-relaxed">
                Thank you, {contactName || 'Trader'}. An export account officer has been assigned to evaluate volume requirements for {companyName}.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 bg-white border border-[#CBD5E1] text-[13px] font-semibold text-[#111827] rounded-full hover:bg-[#F8FAFC] cursor-pointer"
              >
                Send Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block sv-label mb-1">Company / Trading Name <span className="text-[#B42318]">*</span></label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Lagos Artisan Exports Ltd"
                  className="sv-input"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block sv-label mb-1">Contact Officer <span className="text-[#B42318]">*</span></label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full name"
                    className="sv-input"
                    required
                  />
                </div>
                <div>
                  <label className="block sv-label mb-1">Official Email <span className="text-[#B42318]">*</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trade@company.com"
                    className="sv-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block sv-label mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="sv-input"
                  />
                </div>
                <div>
                  <label className="block sv-label mb-1">Industry Sector</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="sv-input"
                  >
                    <option value="Fashion & Apparel">Fashion &amp; Apparel</option>
                    <option value="Handicrafts & Art">Handicrafts &amp; Art</option>
                    <option value="Cosmetics & Beauty">Cosmetics &amp; Beauty</option>
                    <option value="Publishing & Books">Publishing &amp; Books</option>
                    <option value="General Commercial Goods">General Commercial Goods</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block sv-label mb-1">Estimated Monthly Volume</label>
                <select
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(e.target.value)}
                  className="sv-input"
                >
                  <option value="Under 50 kg monthly">Under 50 kg monthly (Ad-hoc parcels)</option>
                  <option value="50 - 200 kg monthly">50 – 200 kg monthly (Growing SME)</option>
                  <option value="200 - 1000 kg monthly">200 – 1,000 kg monthly (Established exporter)</option>
                  <option value="1000+ kg monthly">Over 1,000 kg monthly (Air Cargo)</option>
                </select>
              </div>

              <div>
                <label className="block sv-label mb-1">Target Export Destinations / Details</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. UK, USA, Canada retail delivery..."
                  className="sv-input"
                />
              </div>

              <button
                type="submit"
                className="sv-btn-primary w-full py-3 cursor-pointer"
              >
                Submit Commercial Inquiry
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Commercial Operational Spotlight Grid */}
      <div className="space-y-6 pt-6 border-t border-[#E2E8F0]">
        <div className="max-w-2xl space-y-2">
          <span className="text-[12px] font-bold text-[#00B4D8] uppercase tracking-wider">
            Operational Excellence Across Sectors
          </span>
          <h2 className="sv-h2">
            Dedicated solutions for fashion, handicrafts, and enterprise cargo.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spotlight 1: Fashion & Artisan Apparel */}
          <div className="sv-card flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#0F172A]">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#0F172A] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                    Apparel &amp; Artisan Exports
                  </span>
                  <h3 className="sv-h3 mt-1">
                    Textile, Adire &amp; Diaspora Fashion Shipping
                  </h3>
                </div>
              </div>
            </div>
            <p className="sv-body text-[14px]">
              Exporting indigenous fabrics, bespoke couture, and fashion collections requires delicate moisture-resistant packaging and prompt flight dispatch. Swiftvero works directly with designers across Lagos, Abeokuta, and Ibadan.
            </p>
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[13px] text-[#0096C7] font-semibold">
              <span>Free workshop collection</span>
              <span>2–3 Days Priority Available</span>
            </div>
          </div>

          {/* Spotlight 2: Warehousing & Consolidated Cargo */}
          <div className="sv-card flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[10px] bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#0F172A]">
                  <Warehouse className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#0F172A] bg-[#CAF0F8] px-2.5 py-0.5 rounded-full border border-[#90E0EF]">
                    Ikeja Consolidation Hub
                  </span>
                  <h3 className="sv-h3 mt-1">
                    Palletized Cargo &amp; Consolidated Linehaul
                  </h3>
                </div>
              </div>
            </div>
            <p className="sv-body text-[14px]">
              From cartons to aggregated air cargo, our Ikeja warehouse team manages physical verification, precision weighing, barcode generation, and NCAA-compliant pre-flight screening so your cargo flies without border friction.
            </p>
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[13px] text-[#0096C7] font-semibold">
              <span>Enterprise SLA available</span>
              <span>Up to 5,000kg+ Cargo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
