import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Headphones,
  Search,
  User,
  Send,
  Lock,
  Star,
  PlusCircle,
  ArrowUpRight,
  Scale,
  MessageSquare,
  FileText,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { SupportTicketStatus } from '../../types';
import { formatNaira } from '../../utils/shipping-calculator';

export const CustomerServiceWorkspace: React.FC = () => {
  const {
    tickets,
    reviews,
    moderateReview,
    measurementReviews,
    shipments,
    replySupportTicket,
    updateTicketStatus,
    escalateTicket,
    createSupportTicket,
    currentStaffUser,
    currentCustomer,
    customers,
    pickupJobs,
    paymentAdjustments,
    paymentReceipts,
    shipmentCredits,
    getCustomerBalancesSnapshot,
    quotes,
    respondToManualQuoteEnquiry,
    otpDeliveryLogs,
    staffNotifications,
    markStaffNotificationRead,
  } = useDemo();

  const [activeTab, setActiveTab] = useState<
    'tickets' | 'quotes_desk' | 'reviews' | 'measurements' | 'inspector'
  >('tickets');
  const [inspectorSearch, setInspectorSearch] = useState('');
  const [quoteReplyAmounts, setQuoteReplyAmounts] = useState<Record<string, string>>({});
  const [quoteReplyNotes, setQuoteReplyNotes] = useState<Record<string, string>>({});
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending_review' | 'approved' | 'disputed' | 'rejected'>('all');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [disputeDrafts, setDisputeDrafts] = useState<Record<string, string>>({});
  const [csFeedback, setCsFeedback] = useState<string | null>(null);

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Escalation state
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateTo, setEscalateTo] = useState('Operations Admin');

  // New Ticket Modal
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    customerName: 'Amina Danjuma',
    customerEmail: 'amina.d@crafts.ng',
    customerPhone: '+234 803 111 2233',
    subject: 'Tracking Update Enquiry',
    category: 'tracking_enquiry' as any,
    priority: 'medium' as any,
    trackingNumber: 'SWV-2026-NG8491',
    initialMessage: 'Customer called helpline regarding package departure scan.',
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  // Filtering
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.trackingNumber && t.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // KPI Calculations
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'new').length;
  const escalatedTickets = tickets.filter((t) => t.status === 'escalated').length;
  const pendingReviewCount = reviews.filter(
    (r) => r.moderationStatus === 'pending_review' || r.status === 'pending' || r.moderationStatus === 'disputed'
  ).length;
  const openMeasurementCount = measurementReviews.filter(
    (mr) => mr.status === 'open' || mr.status === 'in_review'
  ).length;

  const getStatusBadge = (status: SupportTicketStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">NEW</span>;
      case 'open':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">OPEN</span>;
      case 'waiting_for_customer':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">WAITING CONSUMER</span>;
      case 'waiting_for_operations':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">OPS PENDING</span>;
      case 'escalated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">ESCALATED</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">RESOLVED</span>;
      case 'closed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">CLOSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Urgent</span>;
      case 'high':
        return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">High</span>;
      case 'medium':
        return <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">Medium</span>;
      default:
        return <span className="text-[10px] font-normal text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">Low</span>;
    }
  };

  const handleSendMessage = () => {
    if (!replyText.trim() || !selectedTicket) return;
    replySupportTicket(
      selectedTicket.id,
      replyText,
      isInternalNote,
      currentStaffUser?.role || 'Customer Service Officer',
      currentStaffUser?.name || 'Customer Service Desk'
    );
    setReplyText('');
    setIsInternalNote(false);
  };

  return (
    <div className="min-h-screen bg-[#F7FCFD] dark:bg-slate-950 pb-16 text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-[#DCEFF3] dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#CAF0F8] dark:bg-sky-950 text-[#00B4D8] flex items-center justify-center font-bold text-lg border border-[#DCEFF3] dark:border-sky-800">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00B4D8] bg-[#CAF0F8] dark:bg-sky-950 px-2 py-0.5 rounded">
                  Workspace B
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Consolidated Support &amp; Resolution Desk</span>
              </div>
              <h1 className="text-lg font-bold text-[#1E293B] dark:text-white">Customer Service Management</h1>
            </div>
          </div>

          {/* Quick SLA Counters */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-[#F7FCFD] dark:bg-slate-800 border border-[#DCEFF3] dark:border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Open Tickets:</span>
              <span className="font-bold font-mono text-[#1E293B] dark:text-white">{openTickets}</span>
            </div>
            <div className="bg-[#F7FCFD] dark:bg-slate-800 border border-[#DCEFF3] dark:border-slate-700 px-3 py-1.5 rounded-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Escalated:</span>
              <span className="font-bold font-mono text-rose-700 dark:text-rose-400">{escalatedTickets}</span>
            </div>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="bg-[#00B4D8] text-white px-3 py-1.5 rounded-md font-semibold hover:bg-[#008EA8] transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log Complaint</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 border-t border-slate-100 dark:border-slate-800 py-1">
          {[
            { id: 'tickets', label: 'Support Tickets', icon: MessageSquare, count: tickets.length },
            {
              id: 'quotes_desk',
              label: 'Quote Enquiries (QTE Desk)',
              icon: FileText,
              count: quotes.filter((q) => q.type === 'manual_enquiry' && q.status === 'manual_enquiry').length,
            },
            { id: 'reviews', label: 'Customer Reviews & Disputes', icon: Star, count: pendingReviewCount },
            { id: 'measurements', label: 'Measurement Review Queue', icon: Scale, count: openMeasurementCount },
            { id: 'inspector', label: 'Customer & Financial Inspector', icon: Eye, count: shipments.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#00B4D8] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {csFeedback && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
            <span>{csFeedback}</span>
            <button type="button" onClick={() => setCsFeedback(null)} className="font-bold underline text-[11px]">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {staffNotifications.filter((n) => n.targetWorkspace === 'customer_service' && !n.isRead).length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-2">
          {staffNotifications
            .filter((n) => n.targetWorkspace === 'customer_service' && !n.isRead)
            .map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3"
              >
                <div>
                  <strong className="mr-1.5">{n.title}:</strong>
                  <span>{n.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => markStaffNotificationRead(n.id)}
                  className="text-[11px] font-bold underline shrink-0"
                >
                  Mark Read
                </button>
              </div>
            ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === 'tickets' && (
        /* Workspace 2-Column Split: Ticket List (Left) + Detail Dialogue (Right) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Queue & Filters (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl border border-[#DCEFF3] space-y-3 shadow-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search SWV-CS-2026-..., name, tracking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#DCEFF3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00B4D8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-[#DCEFF3] rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="open">Open</option>
                  <option value="waiting_for_customer">Waiting on Customer</option>
                  <option value="waiting_for_operations">Waiting on Ops</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs border border-[#DCEFF3] rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Ticket Cards List */}
            <div className="space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {filteredTickets.map((ticket) => {
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#00B4D8] shadow-sm ring-1 ring-[#00B4D8]/20'
                        : 'bg-white border-[#DCEFF3] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-[#1E293B]">{ticket.ticketNumber}</span>
                      <div className="flex items-center gap-1.5">
                        {getPriorityBadge(ticket.priority || 'normal')}
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-[#1E293B] line-clamp-1">{ticket.subject}</h4>
                    <p className="text-[11px] text-[#66736B] line-clamp-2 mt-0.5">
                      {ticket.messages[ticket.messages.length - 1]?.text || ticket.description || 'No message'}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-700">{ticket.customerName}</span>
                      </div>
                      <span>{new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}

              {filteredTickets.length === 0 && (
                <div className="bg-white p-8 rounded-xl border border-[#DCEFF3] text-center text-xs text-slate-400">
                  No tickets matching your filter criteria.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Ticket Dialogue & Actions (7 cols) */}
          <div className="lg:col-span-7">
            {selectedTicket ? (
              <div className="bg-white rounded-xl border border-[#DCEFF3] shadow-xs flex flex-col h-[calc(100vh-210px)]">
                {/* Dialogue Header */}
                <div className="p-4 border-b border-[#DCEFF3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7FCFD] rounded-t-xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#00B4D8] bg-white px-2 py-0.5 rounded border border-[#DCEFF3]">
                        {selectedTicket.ticketNumber}
                      </span>
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority || 'normal')}
                    </div>
                    <h3 className="text-sm font-bold text-[#1E293B] mt-1">{selectedTicket.subject}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span>Customer: <strong>{selectedTicket.customerName}</strong> ({selectedTicket.customerEmail})</span>
                      {selectedTicket.trackingNumber && (
                        <span>Tracking: <strong>{selectedTicket.trackingNumber}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Top Status & Escalation Controls */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as any)}
                      className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
                    >
                      <option value="new">New</option>
                      <option value="open">Open</option>
                      <option value="waiting_for_customer">Waiting on Customer</option>
                      <option value="waiting_for_operations">Waiting on Ops</option>
                      <option value="resolved">Mark Resolved</option>
                      <option value="closed">Close Ticket</option>
                    </select>

                    <button
                      onClick={() => {
                        setShowEscalateModal(true);
                        setEscalateReason('');
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Escalate
                    </button>
                  </div>
                </div>

                {/* CSAT Rating Banner if closed */}
                {selectedTicket.satisfactionRating && (
                  <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs">
                    {(() => {
                      const ratingVal = typeof selectedTicket.satisfactionRating === 'object' ? selectedTicket.satisfactionRating.rating : selectedTicket.satisfactionRating;
                      const feedbackVal = typeof selectedTicket.satisfactionRating === 'object' ? selectedTicket.satisfactionRating.feedback : selectedTicket.satisfactionFeedback;
                      const submittedAtVal = typeof selectedTicket.satisfactionRating === 'object' ? selectedTicket.satisfactionRating.submittedAt : selectedTicket.updatedAt;
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-semibold text-amber-900">
                              Customer CSAT Rating: {ratingVal} / 5 Stars
                            </span>
                            {feedbackVal && (
                              <span className="text-amber-800 italic">"{feedbackVal}"</span>
                            )}
                          </div>
                          <span className="text-[10px] text-amber-700">
                            Submitted {new Date(submittedAtVal || selectedTicket.updatedAt).toLocaleDateString()}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Dialogue Messages Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
                  {selectedTicket.messages.map((msg) => {
                    const isStaff = msg.sender === 'support';
                    const isInternal = msg.isInternalNote;

                    if (isInternal) {
                      return (
                        <div
                          key={msg.id}
                          className="bg-amber-50/80 border border-amber-200 p-3 rounded-lg text-xs space-y-1 my-2"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                            <span className="flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-700" />
                              Internal Staff Note &bull; {msg.senderName} ({msg.senderRole || 'Staff'})
                            </span>
                            <span className="text-[10px] text-amber-600 font-normal">{msg.timestamp}</span>
                          </div>
                          <p className="text-amber-950 leading-relaxed font-sans">{msg.text}</p>
                          <div className="text-[10px] text-amber-700 italic">
                            * Confidential: Hidden from customer portal and public tracking.
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">{msg.senderName}</span>
                          <span>&bull;</span>
                          <span className="text-[10px]">{msg.timestamp}</span>
                          {isStaff && (
                            <span className="bg-[#CAF0F8] text-[#00B4D8] text-[9px] px-1.5 py-0.2 rounded font-bold">
                              STAFF
                            </span>
                          )}
                        </div>

                        <div
                          className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                            isStaff
                              ? 'bg-[#00B4D8] text-white rounded-tr-xs'
                              : 'bg-white border border-[#DCEFF3] text-[#1E293B] rounded-tl-xs shadow-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Composer */}
                <div className="p-3 border-t border-[#DCEFF3] bg-white rounded-b-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className={`font-semibold flex items-center gap-1 ${isInternalNote ? 'text-amber-700' : 'text-slate-600'}`}>
                        <Lock className="w-3 h-3" />
                        Internal Staff Note (Hidden from Customer)
                      </span>
                    </label>

                    <span className="text-[10px] text-slate-400">Press Send to send reply</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        isInternalNote
                          ? 'Add internal staff comment, investigation findings, or escalation context...'
                          : 'Type response to customer (sent to customer portal & email notification)...'
                      }
                      className={`flex-1 text-xs border rounded-lg p-2.5 focus:outline-none ${
                        isInternalNote
                          ? 'border-amber-300 bg-amber-50/50 focus:ring-1 focus:ring-amber-500'
                          : 'border-[#DCEFF3] focus:ring-1 focus:ring-[#00B4D8]'
                      }`}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!replyText.trim()}
                      className={`p-3 rounded-lg text-white font-semibold transition-all shrink-0 ${
                        !replyText.trim()
                          ? 'bg-slate-300 cursor-not-allowed'
                          : isInternalNote
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-[#00B4D8] hover:bg-[#008EA8]'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-12 text-center text-slate-400 text-xs">
                Select a ticket from the queue on the left to view the thread and reply.
              </div>
            )}
          </div>
        </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Customer Review Moderation &amp; Dispute Queue
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Only approved reviews appear publicly. Legitimate critical reviews must be answered transparently, never erased solely for a low score.
                </p>
              </div>
              <select
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value as any)}
                className="text-xs border border-[#DCEFF3] dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Reviews ({reviews.length})</option>
                <option value="pending_review">Pending Moderation</option>
                <option value="approved">Approved &amp; Published</option>
                <option value="disputed">Disputed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="space-y-4">
              {reviews
                .filter((r) => {
                  if (reviewFilter === 'all') return true;
                  return r.moderationStatus === reviewFilter || (reviewFilter === 'pending_review' && r.status === 'pending');
                })
                .map((rev) => {
                  const modStatus = rev.moderationStatus || (rev.status === 'published' ? 'approved' : rev.status === 'rejected' ? 'rejected' : 'pending_review');
                  return (
                    <div key={rev.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F7FCFD] dark:bg-slate-800/40 space-y-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{rev.customerName}</span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">{rev.trackingNumber}</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {rev.ratingOverall}/5 ★
                          </span>
                          {rev.isDemo && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-semibold">
                              Demo
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            modStatus === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : modStatus === 'disputed'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              : modStatus === 'rejected'
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {modStatus.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{rev.writtenFeedback}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Public Company Response
                          </label>
                          <textarea
                            rows={2}
                            value={replyDrafts[rev.id] ?? rev.companyResponse ?? ''}
                            onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                            placeholder="Write official Swiftvero public reply..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Internal Dispute / Moderation Note
                          </label>
                          <textarea
                            rows={2}
                            value={disputeDrafts[rev.id] ?? rev.disputeNote ?? ''}
                            onChange={(e) => setDisputeDrafts((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                            placeholder="Optional note for disputed or rejected claims..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            moderateReview(rev.id, 'published', replyDrafts[rev.id] ?? rev.companyResponse);
                            setCsFeedback(`Review for ${rev.trackingNumber} approved and published.`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                        >
                          Approve &amp; Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            moderateReview(
                              rev.id,
                              'disputed',
                              replyDrafts[rev.id] ?? rev.companyResponse,
                              disputeDrafts[rev.id] || 'Flagged for delivery discrepancy investigation.'
                            );
                            setCsFeedback(`Review for ${rev.trackingNumber} marked as disputed.`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700"
                        >
                          Mark Disputed
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            moderateReview(
                              rev.id,
                              'rejected',
                              replyDrafts[rev.id] ?? rev.companyResponse,
                              disputeDrafts[rev.id] || 'Violated moderation guidelines.'
                            );
                            setCsFeedback(`Review for ${rev.trackingNumber} rejected.`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {activeTab === 'measurements' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-5 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Facility Measurement Review Queue
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Track customer disputes on facility-verified weight and dimensions. Scale reweigh actions are completed by Workspace A operations staff.
              </p>
            </div>
            {measurementReviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No active measurement reviews.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {measurementReviews.map((mr) => {
                  const ship = shipments.find((s) => s.id === mr.shipmentId);
                  return (
                    <div key={mr.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{mr.trackingNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            {mr.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">{mr.reason}</p>
                        {ship && (
                          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            Declared {ship.declaredWeightKg} kg · Verified {ship.verifiedWeightKg || ship.declaredWeightKg} kg · Active Quote ₦{(ship.quote.totalAmount || 0).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {mr.createdAt.slice(0, 10)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {activeTab === 'quotes_desk' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-5 space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Manual Quote Enquiries &amp; Saved Quotes (QTE Desk — {quotes.length})
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Issue official Naira quotations for custom lanes, multi-destination enquiries, or commercial cargo requests without forcing an account first.
                </p>
              </div>

              {quotes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">No saved quotes or manual enquiries logged.</div>
              ) : (
                <div className="space-y-3">
                  {quotes.map((q) => {
                    const draftAmount = quoteReplyAmounts[q.id] ?? (q.totalEstimatedNgn ? String(q.totalEstimatedNgn) : '');
                    const draftNote = quoteReplyNotes[q.id] ?? q.staffQuoteNotes ?? '';
                    return (
                      <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F7FCFD] dark:bg-slate-800/40 space-y-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{q.quoteRef}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#CAF0F8] text-[#0F172A]">
                              {q.type.replace('_', ' ')}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                q.status === 'manual_enquiry'
                                  ? 'bg-amber-100 text-amber-800'
                                  : q.status === 'quoted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {q.status.replace('_', ' ')}
                            </span>
                            {q.items.some((i) => i.isFragile) && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                FRAGILE
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {q.totalEstimatedNgn > 0 ? formatNaira(q.totalEstimatedNgn) : 'Awaiting Staff Price'}
                          </span>
                        </div>

                        <div className="text-slate-700 dark:text-slate-300 space-y-1">
                          <p>
                            <strong>Contact:</strong> {q.contactName} ({q.contactEmail || 'No email'} · {q.contactPhone || 'No phone'})
                          </p>
                          <p>
                            <strong>Route:</strong> {q.originCity}, {q.originCountry} → {q.destinationCity}, {q.destinationCountry} · {q.items.length} parcel(s)
                          </p>
                          {q.enquiryNotes && (
                            <p className="text-slate-600 dark:text-slate-400">
                              <strong>Customer Notes:</strong> {q.enquiryNotes}
                            </p>
                          )}
                        </div>

                        {q.status !== 'converted' && (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 items-end">
                            <div className="md:col-span-3">
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Official Quote Total (NGN)
                              </label>
                              <input
                                type="number"
                                min={1000}
                                value={draftAmount}
                                onChange={(e) => setQuoteReplyAmounts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="e.g. 145000"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                              />
                            </div>
                            <div className="md:col-span-6">
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                Quote Breakdown / Lane Notes
                              </label>
                              <input
                                type="text"
                                value={draftNote}
                                onChange={(e) => setQuoteReplyNotes((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Includes export documentation, lane routing, and 7-day quote validity."
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <button
                                type="button"
                                onClick={() => {
                                  const amt = parseFloat(draftAmount) || 0;
                                  if (amt <= 0) {
                                    setCsFeedback('Enter a valid Naira quote amount before sending.');
                                    return;
                                  }
                                  const res = respondToManualQuoteEnquiry({
                                    quoteId: q.id,
                                    quotedTotalNgn: amt,
                                    staffQuoteNotes: draftNote || 'Official Swiftvero Express lane quote issued.',
                                  });
                                  setCsFeedback(res.message);
                                }}
                                className="w-full py-1.5 px-3 rounded-lg bg-[#00B4D8] text-white font-semibold hover:bg-[#008EA8]"
                              >
                                Send Official Quote
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-5 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Honest OTP Delivery Audit Log ({otpDeliveryLogs.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real dispatch outcomes per channel. Unconfigured providers are logged honestly as provider_unconfigured and never marked sent.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7FCFD] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3">Recipient (Masked)</th>
                      <th className="py-2.5 px-3">Purpose</th>
                      <th className="py-2.5 px-3">Delivery Status</th>
                      <th className="py-2.5 px-3">Provider / Detail</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {otpDeliveryLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2 px-3 uppercase font-bold">{log.channel}</td>
                        <td className="py-2 px-3 font-mono">{log.recipientMasked}</td>
                        <td className="py-2 px-3 capitalize">{log.purpose.replace('_', ' ')}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.status === 'sent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.status === 'provider_unconfigured'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                          {log.providerName}{log.errorDetail ? ` — ${log.errorDetail}` : ''}
                        </td>
                        <td className="py-2 px-3 font-mono text-[10px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inspector' && (() => {
          const q = inspectorSearch.trim().toLowerCase();
          const matchingCustomers = Object.values(customers).filter((c) => {
            if (!q) return true;
            const customerShipments = shipments.filter((s) => s.customerId === c.id);
            const customerPickups = pickupJobs.filter((p) => p.customerId === c.id);
            const customerQuotes = quotes.filter((qt) => qt.customerId === c.id);
            return (
              c.name.toLowerCase().includes(q) ||
              c.email.toLowerCase().includes(q) ||
              c.phone.toLowerCase().includes(q) ||
              customerShipments.some(
                (s) =>
                  s.trackingNumber.toLowerCase().includes(q) ||
                  (s.dhlTrackingNumber || '').toLowerCase().includes(q)
              ) ||
              customerPickups.some((p) => p.pickupReference.toLowerCase().includes(q)) ||
              customerQuotes.some((qt) => qt.quoteRef.toLowerCase().includes(q))
            );
          });

          return (
            <div className="space-y-6">
              {/* Read-Only Governance Banner */}
              <div className="p-4 rounded-xl bg-[#CAF0F8]/70 dark:bg-sky-950/60 border border-[#90E0EF] dark:border-sky-800 text-xs text-[#0F172A] dark:text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#008EA8] dark:text-[#90E0EF] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Read-Only Customer &amp; Financial Audit View (Workspace B)</div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                      Customer Service can inspect separated balances, quote versions, calibrated box measurements, and receipts. Balance adjustments are disabled here—escalate discrepancies to Workspace C (Operations Admin).
                    </p>
                  </div>
                </div>
                <div className="relative w-full sm:w-80 shrink-0">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search SWV-, QTE-, PKP-, name, email, phone..."
                    value={inspectorSearch}
                    onChange={(e) => setInspectorSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {matchingCustomers.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-10 text-center text-xs text-slate-500">
                  No matching customer profiles, SWV shipments, QTE quotes, or PKP pickups found.
                </div>
              ) : (
                <div className="space-y-5">
                  {matchingCustomers.map((cust) => {
                    const snap = getCustomerBalancesSnapshot(cust.id);
                    const custShipments = shipments.filter((s) => s.customerId === cust.id);
                    const custReceipts = paymentReceipts.filter((r) => r.customerId === cust.id);
                    const custCredits = shipmentCredits.filter((c) => c.customerId === cust.id);

                    return (
                      <div
                        key={cust.id}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCEFF3] dark:border-slate-800 p-5 space-y-4 shadow-xs text-xs"
                      >
                        {/* Customer Header & Escalation Trigger */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-[#1E293B] dark:text-white">{cust.name}</h3>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {cust.kycStatus}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {cust.email} &bull; {cust.phone} &bull; Wallet ID: <span className="font-mono">{cust.walletId}</span>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setNewTicketForm((prev) => ({
                                ...prev,
                                customerName: cust.name,
                                customerEmail: cust.email,
                                customerPhone: cust.phone,
                                trackingNumber: custShipments[0]?.trackingNumber || '',
                                category: 'payment_issue',
                                priority: 'high',
                                subject: `Escalated Financial/Weight Audit — ${cust.name}`,
                                initialMessage: `CS escalation to Operations Admin: review balances/quote history for ${cust.name} (${custShipments[0]?.trackingNumber || 'Account'}).`,
                              }));
                              setShowNewTicketModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 font-semibold hover:bg-rose-100 inline-flex items-center gap-1.5 shrink-0"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Escalate Financial / Weight Issue
                          </button>
                        </div>

                        {/* Strictly Separated Read-Only Balances */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 tabular-nums">
                          <div className="p-3 rounded-lg bg-[#F7FCFD] dark:bg-slate-800/60 border border-[#DCEFF3] dark:border-slate-700">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Deposited Wallet</span>
                            <strong className="text-sm font-mono text-[#008EA8] dark:text-[#90E0EF]">
                              {formatNaira(snap.depositedWalletBalanceNgn)}
                            </strong>
                          </div>
                          <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block">Available Account Credit</span>
                            <strong className="text-sm font-mono text-emerald-900 dark:text-emerald-200">
                              {formatNaira(snap.availableAccountCreditNgn)}
                            </strong>
                          </div>
                          <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                            <span className="text-[11px] text-amber-800 dark:text-amber-300 block">Cashback Balance</span>
                            <strong className="text-sm font-mono text-amber-900 dark:text-amber-200">
                              {formatNaira(snap.cashbackBalanceNgn)}
                            </strong>
                          </div>
                          <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                            <span className="text-[11px] text-indigo-800 dark:text-indigo-300 block">Bonus (Active / Expired)</span>
                            <strong className="text-sm font-mono text-indigo-900 dark:text-indigo-200">
                              {formatNaira(snap.activeBonusBalanceNgn)}
                            </strong>
                            {snap.expiredBonusBalanceNgn > 0 && (
                              <span className="text-[10px] text-slate-500 block">
                                Expired: {formatNaira(snap.expiredBonusBalanceNgn)}
                              </span>
                            )}
                          </div>
                          <div className="p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                            <span className="text-[11px] text-rose-800 dark:text-rose-300 block">Outstanding Due</span>
                            <strong className="text-sm font-mono text-rose-900 dark:text-rose-200">
                              {formatNaira(snap.outstandingAmountNgn)}
                            </strong>
                          </div>
                        </div>

                        {/* Customer Shipments, Versions, Box Breakdowns & Adjustments */}
                        {custShipments.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200">
                              Shipments, Quote Versions &amp; Measurements ({custShipments.length})
                            </h4>
                            <div className="space-y-2">
                              {custShipments.map((s) => {
                                const linkedAdjs = paymentAdjustments.filter((a) => a.shipmentId === s.id);
                                return (
                                  <div
                                    key={s.id}
                                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{s.trackingNumber}</span>
                                        {s.dhlTrackingNumber && (
                                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#CAF0F8] text-[#0F172A] font-bold">
                                            {s.dhlTrackingNumber}
                                          </span>
                                        )}
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700">
                                          {s.status.replace(/_/g, ' ')}
                                        </span>
                                      </div>
                                      <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                                        Active Total: {formatNaira(s.finalQuoteNgn || s.quote.totalAmount)} &bull; Paid:{' '}
                                        {formatNaira(s.originalPaidAmountNgn || (s.paymentStatus === 'paid' ? s.quote.totalAmount : 0))}
                                      </div>
                                    </div>

                                    {s.quoteVersions && s.quoteVersions.length > 0 && (
                                      <div className="flex flex-wrap gap-2 text-[11px]">
                                        {s.quoteVersions.map((qv) => (
                                          <span
                                            key={qv.version}
                                            className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                                          >
                                            v{qv.version}: {qv.measuredWeightKg}kg → {formatNaira(qv.quote.totalAmount)} ({qv.status.replace(/_/g, ' ')})
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {s.packageMeasurements && s.packageMeasurements.length > 0 && (
                                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                                        Facility Boxes ({s.packageMeasurements.length} via ÷{s.appliedDivisor || 5000}):{' '}
                                        {s.packageMeasurements
                                          .map(
                                            (pm) =>
                                              `#${pm.boxNumber} ${pm.actualWeightKg}kg (${pm.lengthCm}×${pm.widthCm}×${pm.heightCm}cm → ${pm.billableWeightKg}kg)`
                                          )
                                          .join(' | ')}
                                      </div>
                                    )}

                                    {linkedAdjs.length > 0 && (
                                      <div className="text-[11px] text-amber-800 dark:text-amber-300">
                                        Adjustments:{' '}
                                        {linkedAdjs
                                          .map(
                                            (a) =>
                                              `${a.adjustmentRef} (${a.differenceNgn > 0 ? '+' : '-'}${formatNaira(Math.abs(a.differenceNgn))}, ${a.status})`
                                          )
                                          .join(' · ')}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Receipts & Overpayment Credits */}
                        {(custReceipts.length > 0 || custCredits.length > 0) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                            {custReceipts.length > 0 && (
                              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="font-bold mb-1">Verified Receipts ({custReceipts.length})</div>
                                {custReceipts.slice(0, 4).map((r) => (
                                  <div key={r.id} className="font-mono text-slate-600 dark:text-slate-300">
                                    {r.receiptNumber} · {r.shipmentTrackingNumber || r.bookingGroupCode || r.adjustmentRef || r.gatewayReference} · {formatNaira(r.amountNgn)}
                                  </div>
                                ))}
                              </div>
                            )}
                            {custCredits.length > 0 && (
                              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <div className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                                  Overpayment Shipment Credits ({custCredits.length})
                                </div>
                                {custCredits.map((c) => (
                                  <div key={c.id} className="font-mono text-emerald-700 dark:text-emerald-400">
                                    {c.creditRef} · From {c.sourceTrackingNumber} · Remaining {formatNaira(c.remainingCreditNgn)} / {formatNaira(c.originalCreditNgn)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* MODAL: ESCALATE TICKET */}
      {showEscalateModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#DCEFF3]">
            <h3 className="text-base font-bold text-[#1E293B] mb-1">Escalate Ticket to Operational Lead</h3>
            <p className="text-xs text-[#66736B] mb-4">
              Escalate <span className="font-mono font-semibold">{selectedTicket.ticketNumber}</span> with priority action.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Destination Desk</label>
                <select
                  value={escalateTo}
                  onChange={(e) => setEscalateTo(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  <option value="Operations Admin">Workspace C: Operations & Admin</option>
                  <option value="Field Logistics Supervisor">Field Logistics & Pickup Supervisor</option>
                  <option value="Finance & Accounts">Finance & Payout Operations</option>
                  <option value="Branch Manager">Ikeja / VI Branch Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Escalation Reason & Context</label>
                <textarea
                  rows={3}
                  placeholder="Explain why this requires senior intervention (e.g. Weighing variance > 3kg, customs declaration hold, urgent linehaul reroute)..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  escalateTicket(selectedTicket.id, escalateReason || 'Escalated from Customer Service Desk.', escalateTo);
                  setShowEscalateModal(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG NEW COMPLAINT */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#DCEFF3]">
            <h3 className="text-base font-bold text-[#1E293B] mb-1">Log Customer Support Complaint</h3>
            <p className="text-xs text-[#66736B] mb-4">
              Create an official ticket for walk-in, phone helpline, or WhatsApp customer enquiries.
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={newTicketForm.customerName}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, customerName: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newTicketForm.customerEmail}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, customerEmail: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newTicketForm.customerPhone}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, customerPhone: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Related Consignment (Optional)</label>
                  <input
                    type="text"
                    placeholder="SWV-2026-NG..."
                    value={newTicketForm.trackingNumber}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, trackingNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category</label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value as any })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="tracking_enquiry">Tracking Freshness / Updates</option>
                    <option value="pickup_delay">Doorstep Pickup Delay</option>
                    <option value="weighing_discrepancy">Weighing Variance Query</option>
                    <option value="quote_enquiry">Quotation & Surcharges</option>
                    <option value="payment_issue">Wallet / Payment Confirmation</option>
                    <option value="customs_clearance">Customs Documentation</option>
                    <option value="general">General Logistics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Priority</label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value as any })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Initial Enquiry Details</label>
                <textarea
                  rows={3}
                  value={newTicketForm.initialMessage}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, initialMessage: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  createSupportTicket(
                    {
                      customerId: currentCustomer.id,
                      customerName: newTicketForm.customerName,
                      customerEmail: newTicketForm.customerEmail,
                      customerPhone: newTicketForm.customerPhone,
                      subject: newTicketForm.subject,
                      category: newTicketForm.category,
                      priority: newTicketForm.priority,
                      trackingNumber: newTicketForm.trackingNumber || undefined,
                      assignedStaffName: currentStaffUser?.name || 'Customer Service Desk',
                      assignedToStaffName: currentStaffUser?.name || 'Customer Service Desk',
                    },
                    newTicketForm.initialMessage
                  );
                  setShowNewTicketModal(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#00B4D8] text-white hover:bg-[#008EA8]"
              >
                Generate Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
