import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Plane,
  ShieldCheck,
  CheckCheck,
  Package,
  ArrowRight,
  ExternalLink,
  Truck,
  Coins,
  Receipt,
} from 'lucide-react';
import { CustomerNotification } from '../../types';

export const CustomerNotificationsView: React.FC = () => {
  const {
    currentCustomer,
    customerNotifications,
    markCustomerNotificationRead,
    markAllCustomerNotificationsRead,
    setSelectedShipmentForTracking,
    setActiveCustomerTab,
  } = useDemo();

  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts' | 'payments'>('all');

  const myNotifications = customerNotifications.filter(
    (n) => n.customerId === currentCustomer.id
  );
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const isAlertType = (item: CustomerNotification) =>
    item.triggerType === 'pickup_failed' ||
    item.triggerType === 'approval_required' ||
    item.triggerType === 'payment_required' ||
    item.triggerType === 'revised_quote_ready';

  const isPaymentOrRewardType = (item: CustomerNotification) =>
    item.triggerType === 'payment_required' ||
    item.triggerType === 'additional_payment_confirmed' ||
    item.triggerType === 'overpayment_credit_created' ||
    item.triggerType === 'reward_earned';

  const filtered = myNotifications.filter((item) => {
    if (filter === 'unread') return !item.isRead;
    if (filter === 'alerts') return isAlertType(item);
    if (filter === 'payments') return isPaymentOrRewardType(item);
    return true;
  });

  const handleOpenRelated = (item: CustomerNotification) => {
    markCustomerNotificationRead(item.id);
    const ref = item.relatedReference;
    if (!ref) return;
    if (
      item.triggerType === 'revised_quote_ready' ||
      item.triggerType === 'approval_required' ||
      item.triggerType === 'payment_required'
    ) {
      setSelectedShipmentForTracking(ref);
      setActiveCustomerTab('retrieve_quote');
      return;
    }
    if (ref.startsWith('PKP-')) {
      setActiveCustomerTab('my_pickups');
      return;
    }
    if (ref.startsWith('SWV-')) {
      setSelectedShipmentForTracking(ref);
      setActiveCustomerTab('tracking');
    }
  };

  const renderIcon = (item: CustomerNotification) => {
    switch (item.triggerType) {
      case 'pickup_booked':
      case 'pickup_scheduled':
      case 'pickup_rescheduled':
      case 'package_collected':
        return <Truck className="w-4 h-4 text-[#00B4D8]" />;
      case 'pickup_failed':
      case 'approval_required':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'carrier_booked':
      case 'tracking_available':
      case 'status_changed':
        return <Plane className="w-4 h-4 text-[#00B4D8]" />;
      case 'payment_required':
      case 'additional_payment_confirmed':
        return <Receipt className="w-4 h-4 text-[#00B4D8]" />;
      case 'overpayment_credit_created':
      case 'reward_earned':
        return <Coins className="w-4 h-4 text-emerald-600" />;
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#00B4D8]" />;
    }
  };

  return (
    <div className="sv-card p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#CAF0F8] dark:bg-sky-950 border border-[#90E0EF] dark:border-sky-800 flex items-center justify-center text-[#00B4D8]">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="sv-h2">Notifications &amp; Live Dispatch Alerts</h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#00B4D8] text-white rounded-full tabular-nums">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="sv-label mt-1">
            Live event-driven alerts across pickup dispatch, facility weighing, revised quotes, payments, credits, and DHL tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllCustomerNotificationsRead(currentCustomer.id)}
              className="px-3.5 py-1.5 rounded-full border border-[#CBD5E1] dark:border-slate-700 hover:border-[#00B4D8] text-xs font-semibold text-[#0F172A] dark:text-[#90E0EF] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all', label: `All (${myNotifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'alerts', label: 'Action & Quotes' },
            { id: 'payments', label: 'Payments & Rewards' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-[#00B4D8] text-white'
                : 'bg-[#F8FAFC] dark:bg-slate-900 text-[#4B5563] dark:text-slate-300 hover:text-[#111827] dark:hover:text-white border border-[#E2E8F0] dark:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-[#F8FAFC] dark:bg-slate-900/50 rounded-xl border border-[#E2E8F0] dark:border-slate-800 text-xs text-[#4B5563] dark:text-slate-400">
            No notifications in this category yet.
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-slate-800 border border-[#E2E8F0] dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => markCustomerNotificationRead(item.id)}
                className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer ${
                  !item.isRead
                    ? 'bg-[#CAF0F8]/25 dark:bg-sky-950/35'
                    : 'bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#CAF0F8] dark:bg-sky-950 border border-[#90E0EF] dark:border-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                  {renderIcon(item)}
                </div>

                <div className="flex-1 space-y-1 text-xs min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111827] dark:text-white">
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#00B4D8] shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#4B5563] dark:text-slate-400 tabular-nums shrink-0">
                      {new Date(item.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[#4B5563] dark:text-slate-300 leading-relaxed">
                    {item.message}
                  </p>

                  {item.relatedReference && (
                    <div className="pt-1.5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRelated(item);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#008EA8] dark:text-[#90E0EF] hover:underline cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>
                          {item.triggerType === 'revised_quote_ready' ||
                          item.triggerType === 'approval_required' ||
                          item.triggerType === 'payment_required'
                            ? `Review Quote (${item.relatedReference})`
                            : item.relatedReference.startsWith('PKP-')
                            ? `View Pickup (${item.relatedReference})`
                            : `Track ${item.relatedReference}`}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclosure */}
      <div className="p-3.5 bg-[#F8FAFC] dark:bg-slate-900/50 border border-[#E2E8F0] dark:border-slate-800 rounded-xl flex items-center justify-between text-xs text-[#4B5563] dark:text-slate-400">
        <span>
          Notification channels run in simulated Demo Mode alongside live in-app updates.
        </span>
        <button
          type="button"
          onClick={() => setActiveCustomerTab('profile')}
          className="font-semibold text-[#008EA8] dark:text-[#90E0EF] hover:underline flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
        >
          <span>Notification Settings</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
