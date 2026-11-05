import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import { SupportTicket } from '../../types';
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Phone,
  User,
  X,
} from 'lucide-react';

interface SupportViewProps {
  initialShipmentTracking?: string;
}

export const SupportView: React.FC<SupportViewProps> = ({ initialShipmentTracking }) => {
  const { currentCustomer, tickets, shipments, createSupportTicket, addTicketMessage } = useDemo();

  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<'tracking' | 'pickup' | 'quote' | 'payment' | 'general'>('tracking');
  const [newShipmentRef, setNewShipmentRef] = useState(initialShipmentTracking || shipments[0]?.trackingNumber || '');
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [showWhatsAppSim, setShowWhatsAppSim] = useState(false);

  // WhatsApp simulation state
  const [waMessages, setWaMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Hello! Welcome to Swiftvero Express Ltd WhatsApp Support channel. Please reply with your Swiftvero tracking number or describe your shipping enquiry.',
      time: '10:00 AM',
    },
  ]);
  const [waInput, setWaInput] = useState('');

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;

    createSupportTicket(
      {
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        category: newCategory,
        subject: newSubject,
        shipmentTracking: newShipmentRef,
        status: 'open',
      },
      newMessage
    );

    setNewSubject('');
    setNewMessage('');
    setIsCreatingNew(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    addTicketMessage(activeTicket.id, 'customer', replyMessage);
    const sentText = replyMessage;
    setReplyMessage('');

    // Simulate auto-reply from logistics desk after 1.5s
    setTimeout(() => {
      addTicketMessage(
        activeTicket.id,
        'support',
        `Logistics Desk Update: We have logged your enquiry regarding "${sentText.slice(0, 30)}...". Our export handling supervisor is reviewing the custody logs.`
      );
    }, 1200);
  };

  const handleSendWaMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waInput.trim()) return;

    const userText = waInput;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setWaMessages((prev) => [...prev, { sender: 'user', text: userText, time: now }]);
    setWaInput('');

    // Bot response
    setTimeout(() => {
      let botReply = '';
      if (userText.toUpperCase().includes('SWV')) {
        botReply = `Tracking scan check for ${userText.toUpperCase()}: Our records show this consignment is in transit via our export gateway. Our proactive tracking agent is verifying physical scan freshness.`;
      } else if (userText.toLowerCase().includes('pickup')) {
        botReply = `Pickup arrangements: Scheduled doorstep collections operate Mon-Sat. Please provide your booking reference to check agent arrival.`;
      } else {
        botReply = `Thank you. A Swiftvero international customer specialist has been notified and will assist you on this verified channel.`;
      }
      setWaMessages((prev) => [...prev, { sender: 'bot', text: botReply, time: now }]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-[#DCEFF3] p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#354B55]">Customer Support & Dispatch Assistance</h2>
          <p className="text-xs text-[#6A808C] mt-0.5">
            Direct communication with the Swiftvero logistics operations desk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* WhatsApp simulated entry point */}
          <button
            onClick={() => setShowWhatsAppSim(true)}
            className="px-3.5 py-2 text-xs font-semibold text-[#008EA8] bg-[#CAF0F8] hover:bg-[#CAF0F8] border border-[#DCEFF3] rounded-md transition-colors flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-[#00B4D8]" />
            <span>Launch WhatsApp Support (Demo Channel)</span>
          </button>

          <button
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#00B4D8] hover:bg-[#0096B4] rounded-md transition-colors shadow-xs"
          >
            {isCreatingNew ? 'View Open Tickets' : 'Open New Ticket'}
          </button>
        </div>
      </div>

      {isCreatingNew ? (
        /* Create New Ticket Form */
        <div className="bg-white rounded-lg border border-[#DCEFF3] p-6 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="border-b border-[#DCEFF3] pb-3">
            <h3 className="text-base font-bold text-[#354B55]">Submit a Logistics Support Ticket</h3>
            <p className="text-xs text-[#6A808C]">Our operations team responds within 4 business hours.</p>
          </div>

          <form onSubmit={handleCreateTicketSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#354B55] mb-1">Enquiry Category</label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                >
                  <option value="tracking">Tracking & Transit Progress</option>
                  <option value="pickup">Doorstep Pickup Arrangement</option>
                  <option value="quote">Quotation & Verified Measurement</option>
                  <option value="payment">Payment & Receipt</option>
                  <option value="general">Compliance & Customs Guidance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#354B55] mb-1">Related Shipment Reference</label>
                <input
                  type="text"
                  value={newShipmentRef}
                  onChange={(e) => setNewShipmentRef(e.target.value)}
                  placeholder="e.g. SWV-2026-NG8491"
                  className="w-full px-3 py-2 border border-[#DCEFF3] rounded-md font-mono focus:border-[#00B4D8] focus:outline-hidden uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#354B55] mb-1">Subject</label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Brief summary of your question"
                className="w-full px-3 py-2 border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#354B55] mb-1">Detailed Message</label>
              <textarea
                rows={4}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Provide specific consignment details or questions..."
                className="w-full px-3 py-2 border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setAttachment('cargo_receipt_sample.pdf')}
                className="text-[#6A808C] hover:text-[#354B55] text-xs flex items-center gap-1.5"
              >
                <Paperclip className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>{attachment ? `Attached: ${attachment}` : 'Attach photo or document (Demo)'}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-1.5 border border-[#DCEFF3] rounded text-xs text-[#354B55] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded font-semibold text-xs transition-colors"
                >
                  Submit Ticket
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* Ticket list + Conversation */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Tickets List */}
          <div className="bg-white rounded-lg border border-[#DCEFF3] p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#354B55] uppercase tracking-wider">Your Support Tickets</h3>
            <div className="space-y-2">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    activeTicket?.id === t.id
                      ? 'border-[#00B4D8] bg-[#CAF0F8]'
                      : 'border-[#DCEFF3] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono font-semibold text-[#354B55]">{t.ticketNumber}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-semibold capitalize ${
                        t.status === 'open'
                          ? 'bg-amber-100 text-[#956B16]'
                          : t.status === 'investigating'
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-[#CAF0F8] text-[#008EA8]'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#354B55] truncate">{t.subject}</div>
                  <div className="text-[11px] text-[#6A808C] mt-1 flex justify-between">
                    <span>{t.shipmentTracking || 'General'}</span>
                    <span className="font-mono">
                      {new Date(t.updatedAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Active Conversation Trail */}
          {activeTicket ? (
            <div className="lg:col-span-2 bg-white rounded-lg border border-[#DCEFF3] shadow-xs flex flex-col h-[520px]">
              {/* Ticket Top bar */}
              <div className="p-4 border-b border-[#DCEFF3] bg-[#F5FBFD] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#00B4D8]">{activeTicket.ticketNumber}</span>
                    <span className="text-xs font-bold text-[#354B55]">{activeTicket.subject}</span>
                  </div>
                  <div className="text-[11px] text-[#6A808C] mt-0.5">
                    Category: {activeTicket.category} · Consignment: {activeTicket.shipmentTracking || 'None'}
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded font-semibold bg-[#CAF0F8] text-[#008EA8] capitalize">
                  {activeTicket.status}
                </span>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {activeTicket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[85%] ${
                      m.sender === 'customer' ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-[#6A808C]">
                      <span className="font-semibold text-[#354B55]">{m.senderName}</span>
                      <span>·</span>
                      <span className="font-mono">{m.timestamp}</span>
                    </div>
                    <div
                      className={`p-3 rounded-lg text-xs leading-relaxed ${
                        m.sender === 'customer'
                          ? 'bg-[#00B4D8] text-white rounded-tr-xs'
                          : 'bg-[#F5FBFD] text-[#354B55] border border-[#DCEFF3] rounded-tl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-[#DCEFF3] flex gap-2 bg-[#F5FBFD]">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your message to dispatch support..."
                  className="flex-1 px-3 py-2 text-xs bg-white border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-lg border border-[#DCEFF3] p-12 text-center text-xs text-[#6A808C]">
              Select a ticket on the left to view the communication trail.
            </div>
          )}
        </div>
      )}

      {/* WhatsApp Simulated Modal */}
      {showWhatsAppSim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-[#DCEFF3] w-full max-w-md overflow-hidden flex flex-col h-[520px]">
            {/* WhatsApp Header */}
            <div className="bg-[#008EA8] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#00B4D8] flex items-center justify-center text-white font-bold text-xs">
                  SV
                </div>
                <div>
                  <div className="text-xs font-bold">Swiftvero Official WhatsApp (Simulated)</div>
                  <div className="text-[10px] text-emerald-200">Verified Business Channel · Nigeria</div>
                </div>
              </div>
              <button onClick={() => setShowWhatsAppSim(false)} className="text-white hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Disclaimer notice */}
            <div className="bg-[#CAF0F8] px-3 py-1.5 text-[10px] text-[#008EA8] border-b border-[#DCEFF3] text-center font-medium">
              Demo Simulation: No real WhatsApp credentials or external messages are triggered.
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#F5FAF6]">
              {waMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[80%] ${
                    msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-lg text-xs leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#00B4D8] text-white rounded-tr-xs'
                        : 'bg-white text-[#354B55] border border-[#DCEFF3] rounded-tl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-[#6A808C] mt-0.5 px-1 font-mono">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendWaMessage} className="p-2.5 bg-white border-t border-[#DCEFF3] flex gap-2">
              <input
                type="text"
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                placeholder="Type tracking number or question..."
                className="flex-1 px-3 py-2 text-xs border border-[#DCEFF3] rounded-md focus:border-[#00B4D8] focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-[#00B4D8] hover:bg-[#008EA8] text-white rounded-md text-xs font-semibold"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
