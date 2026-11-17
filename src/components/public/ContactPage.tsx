import React, { useState } from 'react';
import { MapPin, Mail, Phone, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';

interface ContactPageProps {
  onOpenWhatsApp: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onOpenWhatsApp }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [trackingNum, setTrackingNum] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14 text-[#1F2937]">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium text-[#0F172A] bg-[#CAF0F8] border border-[#90E0EF]">
          Contact Swiftvero
        </span>
        <h1 className="sv-h1">
          We’re here when you need direct, accountable answers.
        </h1>
        <p className="sv-body text-[#4B5563]">
          Reach our logistics dispatch desks in Lagos and Abuja, or connect directly with our customer support coordinators.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Contact Information & Hubs (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="sv-card p-6 sm:p-7 space-y-5">
            <h2 className="text-[12px] font-bold text-[#0096C7] uppercase tracking-wider">
              Direct Communication Channels
            </h2>

            <div className="space-y-3 text-[14px]">
              <div className="flex items-start gap-3 p-3.5 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0]">
                <Mail className="w-4 h-4 text-[#00B4D8] shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-[#111827]">Electronic Dispatch Desk</div>
                  <div className="text-[#4B5563] mt-0.5">dispatch@swiftvero.ng</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0]">
                <Clock className="w-4 h-4 text-[#00B4D8] shrink-0 mt-1" />
                <div>
                  <div className="font-bold text-[#111827]">Consolidation Hub Operating Hours</div>
                  <div className="text-[#4B5563] mt-0.5">Monday – Friday: 8:00 AM – 6:00 PM (WAT)</div>
                  <div className="text-[#4B5563]">Saturday: 9:00 AM – 4:00 PM (WAT)</div>
                </div>
              </div>
            </div>

            {/* WhatsApp simulated CTA */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="w-full min-h-[44px] py-2.5 px-5 bg-[#CAF0F8] hover:bg-[#90E0EF]/60 border border-[#90E0EF] text-[#0F172A] rounded-full font-bold text-[14px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#00B4D8]" />
                <span>Chat via Official Support Channel</span>
              </button>
            </div>
          </div>

          {/* Physical Facilities */}
          <div className="sv-card p-6 sm:p-7 space-y-4">
            <h2 className="text-[12px] font-bold text-[#0096C7] uppercase tracking-wider">
              Physical Hub Facilities
            </h2>

            <div className="space-y-3 text-[14px]">
              <div className="p-3.5 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0] space-y-1">
                <div className="font-bold text-[#111827] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#00B4D8] shrink-0" />
                  <span>Ikeja International Cargo Terminal</span>
                </div>
                <p className="text-[13px] text-[#4B5563] pl-5">
                  Murtala Muhammed International Airport Cargo Section, Ikeja, Lagos
                </p>
              </div>

              <div className="p-3.5 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0] space-y-1">
                <div className="font-bold text-[#111827] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#00B4D8] shrink-0" />
                  <span>Lekki Intake &amp; Customer Counter</span>
                </div>
                <p className="text-[13px] text-[#4B5563] pl-5">
                  Admiralty Way, Lekki Phase 1, Lagos
                </p>
              </div>

              <div className="p-3.5 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0] space-y-1">
                <div className="font-bold text-[#111827] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#00B4D8] shrink-0" />
                  <span>Abuja Regional Cargo Center</span>
                </div>
                <p className="text-[13px] text-[#4B5563] pl-5">
                  Nnamdi Azikiwe International Airport Cargo Wing, Abuja (FCT)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact Inquiry Form (6 cols) */}
        <div className="lg:col-span-6 sv-card p-6 sm:p-7 space-y-4">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h2 className="sv-h3">Send a Message</h2>
            <p className="sv-label mt-0.5">Please provide your details below.</p>
          </div>

          {sent ? (
            <div className="p-6 bg-[#CAF0F8] border border-[#90E0EF] rounded-[12px] text-center space-y-3 text-[#0F172A]">
              <CheckCircle2 className="w-8 h-8 text-[#00B4D8] mx-auto" />
              <div className="text-[15px] font-bold text-[#0F172A]">Message Transmitted</div>
              <p className="text-[13px] text-[#0F172A]/85 leading-relaxed">
                Thank you, {name}. Your inquiry has been routed to our logistics support coordinators.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="min-h-[40px] px-5 py-2 bg-white border border-[#CBD5E1] text-[13px] font-bold text-[#111827] rounded-full hover:border-[#00B4D8] transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="sv-label block mb-1">
                  Your Full Name <span className="text-[#B42318]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Babatunde Adeleke"
                  className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] border border-[#CBD5E1] rounded-[10px] bg-white text-[#111827]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="sv-label block mb-1">
                    Email Address <span className="text-[#B42318]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] border border-[#CBD5E1] rounded-[10px] bg-white text-[#111827]"
                    required
                  />
                </div>
                <div>
                  <label className="sv-label block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] border border-[#CBD5E1] rounded-[10px] bg-white text-[#111827] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="sv-label block mb-1">
                  Tracking Number (If Regarding Active Consignment)
                </label>
                <input
                  type="text"
                  value={trackingNum}
                  onChange={(e) => setTrackingNum(e.target.value)}
                  placeholder="e.g. SWV-2026-NG8491"
                  className="sv-input w-full min-h-[44px] px-3.5 py-2 text-[14px] border border-[#CBD5E1] rounded-[10px] bg-white text-[#111827] tabular-nums uppercase"
                />
              </div>

              <div>
                <label className="sv-label block mb-1">
                  Message <span className="text-[#B42318]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can our export coordinators assist you?"
                  className="sv-input w-full px-3.5 py-2.5 text-[14px] border border-[#CBD5E1] rounded-[10px] bg-white text-[#111827]"
                  required
                />
              </div>

              <button
                type="submit"
                className="sv-btn-primary w-full min-h-[46px] py-2.5 rounded-full shadow-xs cursor-pointer"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
