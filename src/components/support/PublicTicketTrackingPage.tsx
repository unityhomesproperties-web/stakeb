import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Search,
  Headphones,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Star,
  ShieldCheck,
  User,
  ArrowRight,
} from 'lucide-react';
import { SupportTicket } from '../../types';

export const PublicTicketTrackingPage: React.FC = () => {
  const { tickets, replySupportTicket, rateTicketSatisfaction } = useDemo();

  const [ticketInput, setTicketInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [searchedTicket, setSearchedTicket] = useState<SupportTicket | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Customer reply state
  const [replyText, setReplyText] = useState('');

  // CSAT rating state
  const [rating, setRating] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleTrackTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setErrorMessage('');
    setSearchedTicket(null);

    const cleanNum = ticketInput.trim().toUpperCase();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanNum || !cleanEmail) {
      setErrorMessage('Please enter both your ticket number and registered email address.');
      return;
    }

    const matched = tickets.find(
      (t) =>
        t.ticketNumber.toUpperCase() === cleanNum &&
        t.customerEmail?.toLowerCase() === cleanEmail
    );

    if (matched) {
      setSearchedTicket(matched);
    } else {
      setErrorMessage(
        'No matching support ticket found with the provided ticket number and email address. Please verify your reference or contact our WhatsApp helpline.'
      );
    }
  };

  const handleCustomerReply = () => {
    if (!replyText.trim() || !searchedTicket) return;
    replySupportTicket(
      searchedTicket.id,
      replyText,
      false,
      'Customer',
      searchedTicket.customerName
    );
    setReplyText('');
    // refresh current view
    const updated = tickets.find((t) => t.id === searchedTicket.id);
    if (updated) setSearchedTicket(updated);
  };

  const handleSubmitCsat = () => {
    if (!searchedTicket) return;
    rateTicketSatisfaction(searchedTicket.id, rating, ratingFeedback);
    setRatingSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="w-12 h-12 rounded-[12px] bg-[#CAF0F8] text-[#00B4D8] border border-[#90E0EF] flex items-center justify-center mx-auto mb-3">
            <Headphones className="w-6 h-6" />
          </div>
          <h1 className="sv-h1">Track Support Ticket</h1>
          <p className="sv-body text-[#4B5563]">
            Check the live resolution status of your enquiry, view staff replies, or update your request.
          </p>
        </div>

        {/* Verification & Search Form */}
        <div className="sv-card p-6 mb-6">
          <form onSubmit={handleTrackTicket} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="sv-label block text-[#111827] font-semibold mb-1.5">
                  Ticket Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. SWV-CS-2026-000001"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  className="sv-input w-full text-[14px] border border-[#CBD5E1] rounded-[8px] px-3.5 py-2.5 text-[#111827] bg-white tabular-nums"
                />
              </div>

              <div>
                <label className="sv-label block text-[#111827] font-semibold mb-1.5">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. amara.okafor@crafts.ng"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="sv-input w-full text-[14px] border border-[#CBD5E1] rounded-[8px] px-3.5 py-2.5 text-[#111827] bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="sv-label">
                Quick Demo Test: <strong className="text-[#111827]">SWV-CS-2026-000001</strong> with <strong className="text-[#111827]">amara.okafor@crafts.ng</strong>
              </span>
              <button
                type="submit"
                className="sv-btn-primary w-full sm:w-auto px-6 py-2.5 rounded-full flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Find Ticket</span>
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-[10px] bg-rose-50 border border-rose-200 text-[13px] text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Matched Ticket Results */}
        {searchedTicket && (
          <div className="sv-card overflow-hidden">
            {/* Ticket Header */}
            <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-[#0F172A] bg-[#CAF0F8] px-3 py-1 rounded-full border border-[#90E0EF] tabular-nums">
                    {searchedTicket.ticketNumber}
                  </span>
                  <span
                    className={`text-[12px] px-3 py-0.5 rounded-full font-semibold ${
                      searchedTicket.status === 'resolved' || searchedTicket.status === 'closed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : searchedTicket.status === 'waiting_for_customer'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {searchedTicket.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h3 className="sv-h3 mt-2">{searchedTicket.subject}</h3>
                <div className="sv-label mt-0.5">
                  Raised by {searchedTicket.customerName} &bull; Last updated {new Date(searchedTicket.updatedAt).toLocaleDateString()}
                </div>
              </div>

              {searchedTicket.trackingNumber && (
                <div className="text-left sm:text-right text-[13px] bg-white px-3.5 py-2 rounded-[10px] border border-[#E2E8F0]">
                  <span className="sv-label block">Related Consignment</span>
                  <div className="font-bold text-[#111827] tabular-nums">{searchedTicket.trackingNumber}</div>
                </div>
              )}
            </div>

            {/* Public Message Thread (Strictly EXCLUDES isInternalNote: true) */}
            <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto bg-[#F8FAFC]">
              {searchedTicket.messages
                .filter((m) => !m.isInternalNote)
                .map((msg) => {
                  const isStaff = msg.sender === 'support';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[12px] text-[#4B5563]">
                        <span className="font-semibold text-[#111827]">{msg.senderName}</span>
                        {isStaff && (
                          <span className="bg-[#CAF0F8] text-[#0F172A] border border-[#90E0EF] text-[10px] px-2 py-0.5 rounded-full font-bold">
                            OFFICIAL SUPPORT
                          </span>
                        )}
                        <span>&bull;</span>
                        <span className="text-[11px] tabular-nums">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[85%] p-3.5 rounded-[12px] text-[14px] leading-relaxed ${
                          isStaff
                            ? 'bg-white border border-[#E2E8F0] text-[#1F2937] rounded-tl-xs shadow-2xs'
                            : 'bg-[#00B4D8] text-white rounded-tr-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Consignor Reply Box */}
            {searchedTicket.status !== 'closed' && (
              <div className="p-4 border-t border-[#E2E8F0] bg-white">
                <label className="sv-label block text-[#111827] font-semibold mb-1.5">
                  Reply to Customer Support
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Provide additional details or response to the agent..."
                    className="sv-input flex-1 text-[14px] border border-[#CBD5E1] rounded-[8px] p-3 text-[#111827] bg-white"
                  />
                  <button
                    onClick={handleCustomerReply}
                    disabled={!replyText.trim()}
                    className={`px-5 py-2.5 text-[14px] font-bold rounded-full text-white transition-colors shrink-0 flex items-center justify-center gap-1.5 ${
                      !replyText.trim()
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-[#00B4D8] hover:bg-[#0096C7] cursor-pointer'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </div>
            )}

            {/* CSAT Rating Widget for Resolved Tickets */}
            {(searchedTicket.status === 'resolved' || searchedTicket.status === 'closed') && (
              <div className="p-5 border-t border-[#E2E8F0] bg-emerald-50/50">
                {searchedTicket.satisfactionRating || ratingSubmitted ? (
                  <div className="text-center py-2 text-[13px] text-emerald-800">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                    <span className="font-bold">Thank you for rating our customer service!</span>
                    <p className="sv-label mt-0.5">Your feedback helps us maintain Nigerian logistics excellence.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-[#111827]">
                        How would you rate our resolution of this enquiry?
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Optional written feedback or suggestions..."
                      value={ratingFeedback}
                      onChange={(e) => setRatingFeedback(e.target.value)}
                      className="sv-input w-full text-[14px] border border-[#CBD5E1] rounded-[8px] p-2.5 bg-white text-[#111827]"
                    />

                    <div className="flex justify-end">
                      <button
                        onClick={handleSubmitCsat}
                        className="sv-btn-primary px-5 py-2 text-[13px] rounded-full cursor-pointer"
                      >
                        Submit Satisfaction Rating
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
