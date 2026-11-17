import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  MessageSquare,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Star,
  User,
  Shield,
  Search,
  Filter,
} from 'lucide-react';
import { SupportTicket } from '../../types';

export const CustomerTicketsView: React.FC = () => {
  const {
    currentCustomer,
    tickets,
    replySupportTicket,
    createSupportTicket,
    rateTicketSatisfaction,
    shipments,
  } = useDemo();

  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // CSAT Rating state
  const [csatRating, setCsatRating] = useState(5);
  const [csatFeedback, setCsatFeedback] = useState('');
  const [csatSubmitted, setCsatSubmitted] = useState(false);

  // New Ticket Form
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    category: 'tracking_enquiry' as any,
    priority: 'medium' as any,
    trackingNumber: '',
    initialMessage: '',
  });

  // Consignor's tickets
  const myTickets = tickets.filter(
    (t) => t.customerId === currentCustomer.id || t.customerEmail === currentCustomer.email
  );

  const filteredTickets = myTickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeSelectedTicket =
    filteredTickets.find((t) => t.id === selectedTicketId) || filteredTickets[0];

  const handleSendReply = () => {
    if (!replyText.trim() || !activeSelectedTicket) return;
    replySupportTicket(
      activeSelectedTicket.id,
      replyText,
      false,
      'Customer',
      currentCustomer.name
    );
    setReplyText('');
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.subject.trim() || !newTicketForm.initialMessage.trim()) return;

    createSupportTicket(
      {
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        customerEmail: currentCustomer.email,
        customerPhone: currentCustomer.phone,
        subject: newTicketForm.subject,
        category: newTicketForm.category,
        priority: newTicketForm.priority,
        trackingNumber: newTicketForm.trackingNumber || undefined,
        assignedStaffName: 'Customer Support Desk',
        assignedToStaffName: 'Customer Support Desk',
      },
      newTicketForm.initialMessage
    );

    setShowCreateModal(false);
    setNewTicketForm({
      subject: '',
      category: 'tracking_enquiry',
      priority: 'medium',
      trackingNumber: '',
      initialMessage: '',
    });
  };

  const handleRateCsat = () => {
    if (!activeSelectedTicket) return;
    rateTicketSatisfaction(activeSelectedTicket.id, csatRating, csatFeedback);
    setCsatSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCEFF3]">
        <div>
          <h2 className="text-xl font-bold text-[#1D2922] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#00B4D8]" />
            Support Tickets & Resolution Desk
          </h2>
          <p className="text-xs text-[#66736B] mt-0.5">
            Submit inquiries, track investigations with support staff, and rate completed resolutions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-[#00B4D8] text-white rounded-xl text-xs font-bold hover:bg-[#008EA8] transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Main Split: Ticket List (Left) & Conversation (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3 rounded-xl border border-[#DCEFF3] flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket # or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="waiting_for_customer">Waiting on You</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredTickets.map((ticket) => {
              const isSelected = activeSelectedTicket?.id === ticket.id;
              return (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    setCsatSubmitted(false);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#00B4D8] ring-1 ring-[#00B4D8]/20 shadow-xs'
                      : 'bg-white border-[#DCEFF3] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#1D2922]">{ticket.ticketNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                        ticket.status === 'resolved' || ticket.status === 'closed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ticket.status === 'waiting_for_customer'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#1D2922] line-clamp-1">{ticket.subject}</h4>
                  <p className="text-[11px] text-[#66736B] line-clamp-2 mt-0.5">
                    {ticket.messages[ticket.messages.length - 1]?.text || 'No messages'}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{ticket.trackingNumber ? `Consignment: ${ticket.trackingNumber}` : 'General Enquiry'}</span>
                    <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div className="bg-white p-8 rounded-xl border border-[#DCEFF3] text-center text-xs text-slate-400">
                You have no active support tickets in this view.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Conversation Thread */}
        <div className="lg:col-span-7">
          {activeSelectedTicket ? (
            <div className="bg-white rounded-2xl border border-[#DCEFF3] shadow-xs flex flex-col h-[520px]">
              {/* Thread Header */}
              <div className="p-4 border-b border-[#DCEFF3] bg-[#F7FCFD] rounded-t-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#00B4D8] bg-white px-2 py-0.5 rounded border border-[#DCEFF3]">
                      {activeSelectedTicket.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        activeSelectedTicket.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {activeSelectedTicket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1D2922] mt-1">{activeSelectedTicket.subject}</h3>
                </div>

                {activeSelectedTicket.trackingNumber && (
                  <div className="text-right text-[11px] font-mono font-medium text-slate-600 bg-white px-2 py-1 rounded border border-[#DCEFF3]">
                    {activeSelectedTicket.trackingNumber}
                  </div>
                )}
              </div>

              {/* Messages Thread (Excludes Internal Notes) */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                {activeSelectedTicket.messages
                  .filter((m) => !m.isInternalNote)
                  .map((msg) => {
                    const isStaff = msg.sender === 'support';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700">{msg.senderName}</span>
                          {isStaff && (
                            <span className="bg-[#CAF0F8] text-[#00B4D8] text-[9px] px-1.5 py-0.2 rounded font-bold">
                              SWIFTVERO AGENT
                            </span>
                          )}
                          <span>&bull;</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        <div
                          className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                            isStaff
                              ? 'bg-white border border-[#DCEFF3] text-[#1D2922] rounded-tl-xs shadow-xs'
                              : 'bg-[#00B4D8] text-white rounded-tr-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Reply Box */}
              {activeSelectedTicket.status !== 'closed' && (
                <div className="p-3 border-t border-[#DCEFF3] bg-white rounded-b-2xl flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response to support..."
                    className="flex-1 text-xs border border-[#DCEFF3] rounded-lg p-2 focus:ring-1 focus:ring-[#00B4D8] focus:outline-none"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className={`px-4 rounded-lg text-white font-semibold transition-colors shrink-0 flex items-center justify-center ${
                      !replyText.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#00B4D8] hover:bg-[#008EA8]'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* CSAT Rating if resolved */}
              {(activeSelectedTicket.status === 'resolved' || activeSelectedTicket.status === 'closed') && (
                <div className="p-4 border-t border-[#DCEFF3] bg-emerald-50/50 rounded-b-2xl">
                  {activeSelectedTicket.satisfactionRating || csatSubmitted ? (
                    <div className="text-center text-xs text-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600 inline mr-1" />
                      <span>Thank you for rating our support resolution!</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1D2922]">Rate Resolution Quality:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onClick={() => setCsatRating(s)}
                              className="text-amber-400 hover:scale-110"
                            >
                              <Star
                                className={`w-4 h-4 ${s <= csatRating ? 'fill-amber-400' : 'text-slate-300'}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Optional comment on agent service..."
                          value={csatFeedback}
                          onChange={(e) => setCsatFeedback(e.target.value)}
                          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                        />
                        <button
                          onClick={handleRateCsat}
                          className="px-3 py-1 bg-[#00B4D8] text-white rounded text-xs font-semibold hover:bg-[#008EA8]"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#DCEFF3] p-12 text-center text-xs text-slate-400">
              Select a ticket to view conversation or click New Support Ticket.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE TICKET */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3] space-y-4">
            <h3 className="text-base font-bold text-[#1D2922]">Open New Support Ticket</h3>
            <p className="text-xs text-[#66736B]">
              Our customer service officers respond within 15 minutes during standard operational hours.
            </p>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of enquiry..."
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value as any })}
                    className="w-full border border-slate-300 rounded px-2 py-1.5"
                  >
                    <option value="tracking_enquiry">Tracking Update</option>
                    <option value="pickup_delay">Doorstep Pickup</option>
                    <option value="weighing_discrepancy">Weighing Variance</option>
                    <option value="quote_enquiry">Quotation / Surcharges</option>
                    <option value="payment_issue">Payment / Wallet</option>
                    <option value="customs_clearance">Customs / Export</option>
                    <option value="general">General Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Related Consignment</label>
                  <select
                    value={newTicketForm.trackingNumber}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, trackingNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 font-mono"
                  >
                    <option value="">None / General</option>
                    {shipments
                      .filter((s) => s.customerId === currentCustomer.id)
                      .map((s) => (
                        <option key={s.id} value={s.trackingNumber}>
                          {s.trackingNumber}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Message Details</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your issue or question in detail..."
                  value={newTicketForm.initialMessage}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, initialMessage: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00B4D8] text-white rounded text-xs font-bold hover:bg-[#008EA8]"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
