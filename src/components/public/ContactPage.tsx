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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-xs font-semibold text-[#00B4D8] tracking-wider uppercase bg-[#CAF0F8] px-2.5 py-1 rounded">
          Contact Swiftvero
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif-display font-medium text-[#354B55] tracking-tight">
          We’re here when you need direct, accountable answers.
        </h1>
        <p className="text-sm text-[#6A808C] leading-relaxed">
          Reach our logistics dispatch desks in Lagos and Abuja, or connect directly with our customer support coordinators.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Contact Information & Hubs (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-xl border border-[#DCEFF3] p-6 sm:p-7 shadow-xs space-y-5">
            <h2 className="text-xs font-bold text-[#00B4D8] uppercase tracking-wider">Direct Communication Channels</h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3.5 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3]">
                <Mail className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#354B55]">Electronic Dispatch Desk</div>
                  <div className="text-[#6A808C] mt-0.5">dispatch@swiftvero.ng</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3]">
                <Clock className="w-4 h-4 text-[#00B4D8] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#354B55]">Consolidation Hub Operating Hours</div>
                  <div className="text-[#6A808C] mt-0.5">Monday – Friday: 8:00 AM – 6:00 PM (WAT)</div>
                  <div className="text-[#6A808C]">Saturday: 9:00 AM – 4:00 PM (WAT)</div>
                </div>
              </div>
            </div>

            {/* WhatsApp simulated CTA */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="w-full py-2.5 px-4 bg-[#CAF0F8] hover:bg-[#dff4e4] border border-[#DCEFF3] text-[#0096B4] rounded-md font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4 text-[#00B4D8]" />
                <span>Chat via Official Support Channel</span>
              </button>
            </div>
          </div>

          {/* Physical Facilities */}
          <div className="bg-white rounded-xl border border-[#DCEFF3] p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#00B4D8] uppercase tracking-wider">Physical Hub Facilities</h2>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3] space-y-1">
                <div className="font-semibold text-[#354B55] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#00B4D8]" />
                  <span>Ikeja International Cargo Terminal</span>
                </div>
                <p className="text-[11px] text-[#6A808C] pl-5">
                  Murtala Muhammed International Airport Cargo Section, Ikeja, Lagos
                </p>
              </div>

              <div className="p-3.5 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3] space-y-1">
                <div className="font-semibold text-[#354B55] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#00B4D8]" />
                  <span>Lekki Intake & Customer Counter</span>
                </div>
                <p className="text-[11px] text-[#6A808C] pl-5">
                  Admiralty Way, Lekki Phase 1, Lagos
                </p>
              </div>

              <div className="p-3.5 bg-[#F5FBFD] rounded-lg border border-[#DCEFF3] space-y-1">
                <div className="font-semibold text-[#354B55] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#00B4D8]" />
                  <span>Abuja Regional Cargo Center</span>
                </div>
                <p className="text-[11px] text-[#6A808C] pl-5">
                  Nnamdi Azikiwe International Airport Cargo Wing, Abuja (FCT)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Contact Inquiry Form (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#DCEFF3] p-6 sm:p-7 shadow-xs space-y-4">
          <div className="border-b border-[#DCEFF3] pb-3">
            <h2 className="text-base font-serif-display font-medium text-[#354B55]">Send a Message</h2>
            <p className="text-xs text-[#6A808C] mt-0.5">Please provide your details below.</p>
          </div>

          {sent ? (
            <div className="p-6 bg-[#CAF0F8] border border-[#DCEFF3] rounded-lg text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-[#00B4D8] mx-auto" />
              <div className="text-xs font-bold text-[#354B55]">Message Transmitted</div>
              <p className="text-[11px] text-[#6A808C] leading-relaxed">
                Thank you, {name}. Your inquiry has been routed to our logistics support coordinators.
              </p>
              <button
                onClick={() => setSent(false)}
                className="px-3 py-1.5 bg-white border border-[#DCEFF3] text-xs font-semibold text-[#00B4D8] rounded hover:bg-[#CAF0F8]"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#354B55] mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Babatunde Adeleke"
                  className="w-full px-3 py-2 border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-[#354B55] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#354B55] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-3 py-2 border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#354B55] mb-1">
                  Tracking Number (If Regarding Active Consignment)
                </label>
                <input
                  type="text"
                  value={trackingNum}
                  onChange={(e) => setTrackingNum(e.target.value)}
                  placeholder="e.g. SWV-2026-NG8491"
                  className="w-full px-3 py-2 border border-[#DCEFF3] rounded-md font-mono focus:border-[#00B4D8] focus:outline-hidden uppercase"
                />
              </div>

              <div>
                <label className="block font-medium text-[#354B55] mb-1">Message</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can our export coordinators assist you?"
                  className="w-full px-3 py-2 border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-md font-semibold text-xs transition-colors shadow-xs"
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
