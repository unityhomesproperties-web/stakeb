import React from 'react';

export interface StatusMeta {
  label: string;
  className: string;
  dotColor: string;
}

export function getStatusMeta(status: string, isOverdue?: boolean): StatusMeta {
  if (isOverdue || status === 'overdue_investigation') {
    return {
      label: 'Update Delayed',
      className: 'bg-rose-50 text-rose-700 border border-rose-200',
      dotColor: 'bg-rose-500',
    };
  }

  switch (status) {
    case 'in_transit':
      return {
        label: 'In Transit',
        className: 'bg-[#CAF0F8] text-[#008EA8] border border-[#90E0EF]',
        dotColor: 'bg-[#00B4D8]',
      };
    case 'payment_pending':
      return {
        label: 'Awaiting Payment',
        className: 'bg-amber-50 text-amber-800 border border-amber-200',
        dotColor: 'bg-amber-500',
      };
    case 'pickup_scheduled':
      return {
        label: 'Pickup Scheduled',
        className: 'bg-[#F0FAFD] text-[#008EA8] border border-[#DCEFF3]',
        dotColor: 'bg-[#00B4D8]',
      };
    case 'pickup_completed':
      return {
        label: 'Picked Up',
        className: 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]',
        dotColor: 'bg-[#16A34A]',
      };
    case 'delivered':
      return {
        label: 'Delivered',
        className: 'bg-[#EBF9F1] text-[#166534] border border-[#A7F3D0]',
        dotColor: 'bg-[#10B981]',
      };
    case 'quote_ready':
      return {
        label: 'Quote Ready',
        className: 'bg-[#CAF0F8]/50 text-[#008EA8] border border-[#90E0EF]',
        dotColor: 'bg-[#00B4D8]',
      };
    case 'booked':
      return {
        label: 'Confirmed',
        className: 'bg-[#F5FBFD] text-[#354B55] border border-[#DCEFF3]',
        dotColor: 'bg-[#00B4D8]',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        className: 'bg-slate-50 text-slate-500 border border-slate-200',
        dotColor: 'bg-slate-400',
      };
    default:
      return {
        label: status.replace(/_/g, ' '),
        className: 'bg-[#F5FBFD] text-[#6A808C] border border-[#DCEFF3]',
        dotColor: 'bg-[#00B4D8]',
      };
  }
}

interface StatusPillProps {
  status: string;
  isOverdue?: boolean;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, isOverdue, className = '' }) => {
  const meta = getStatusMeta(status, isOverdue);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize tracking-wide transition-colors ${meta.className} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
      <span>{meta.label}</span>
    </span>
  );
};
