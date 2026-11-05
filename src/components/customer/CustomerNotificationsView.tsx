import React, { useState } from 'react';
import { useDemo } from '../../context/DemoContext';
import {
  Bell,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plane,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const CustomerNotificationsView: React.FC = () => {
  const { shipments, currentCustomer } = useDemo();

  // Channel toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  // Generate realistic notification items from customer shipments
  const notifications = [
    {
      id: 'notif_01',
      title: 'Doorstep Pickup Completed & Weighed',
      time: '2 hours ago',
      category: 'pickup',
      text: 'Consignment SWV-2026-NG8491 was verified by courier Emeka Nwosu. Scale reading: 4.50 kg.',
      isRead: false,
    },
    {
      id: 'notif_02',
      title: 'Scheduled Flight Departure Out of Lagos (LOS)',
      time: 'Yesterday at 14:15',
      category: 'flight',
      text: 'Consignment SWV-2026-NG1088 has departed Murtala Muhammed International Airport en route to London Heathrow (LHR).',
      isRead: true,
    },
    {
      id: 'notif_03',
      title: 'Proactive Alert: Scan Verification in Progress',
      time: '2 days ago',
      category: 'alert',
      text: 'Scheduled transit scan has not arrived within expected window for SWV-2026-NG5519. Swiftvero team opened proactive check.',
      isRead: true,
    },
    {
      id: 'notif_04',
      title: 'Delivery Confirmed & 3% Cashback Unlocked',
      time: '3 days ago',
      category: 'delivery',
      text: 'Recipient signed for consignment in Houston, TX. ₦4,500 cashback released to your reward ledger.',
      isRead: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#DCEFF3] p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCEFF3]">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#00B4D8]" />
            <h2 className="text-base font-bold text-[#354B55]">
              Notifications &amp; Proactive Alert Center
            </h2>
          </div>
          <p className="text-xs text-[#6A808C] mt-0.5">
            Real-time milestone logs, scale verification receipts, and automated scan-gap alerts.
          </p>
        </div>

        <span className="text-xs font-semibold text-[#008EA8] bg-[#CAF0F8] px-3 py-1 rounded-full border border-[#90E0EF] self-start sm:self-auto">
          Proactive Dispatch Monitoring
        </span>
      </div>

      {/* Notification Preferences */}
      <div className="bg-[#F5FBFD] border border-[#DCEFF3] rounded-xl p-4 space-y-3 text-xs">
        <div className="font-bold text-[#354B55]">Alert Communication Channels</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#DCEFF3]">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#00B4D8]" />
              <span className="font-medium text-[#354B55]">Email Receipts</span>
            </div>
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className="text-[#00B4D8] transition-colors"
            >
              {emailAlerts ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#DCEFF3]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#00B4D8]" />
              <span className="font-medium text-[#354B55]">In-Portal Banners</span>
            </div>
            <button
              onClick={() => setInAppAlerts(!inAppAlerts)}
              className="text-[#00B4D8] transition-colors"
            >
              {inAppAlerts ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#DCEFF3]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00B4D8]" />
              <div>
                <span className="font-medium text-[#354B55] block">WhatsApp Alerts</span>
                <span className="text-[10px] text-[#6A808C]">(Verified Pilot)</span>
              </div>
            </div>
            <button
              onClick={() => setWhatsappAlerts(!whatsappAlerts)}
              className="text-[#00B4D8] transition-colors"
            >
              {whatsappAlerts ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notification History Feed */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#354B55] uppercase tracking-wider">Recent Activity &amp; Alerts</h3>

        <div className="divide-y divide-[#DCEFF3] border border-[#DCEFF3] rounded-xl overflow-hidden bg-white">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 flex items-start gap-3.5 transition-colors ${
                !item.isRead ? 'bg-[#CAF0F8]/30' : 'bg-white'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#CAF0F8] border border-[#90E0EF] flex items-center justify-center text-[#008EA8] shrink-0 mt-0.5">
                {item.category === 'flight' ? (
                  <Plane className="w-4 h-4 text-[#00B4D8]" />
                ) : item.category === 'alert' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : item.category === 'delivery' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[#00B4D8]" />
                )}
              </div>

              <div className="flex-1 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#354B55]">{item.title}</span>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#00B4D8]" />
                    )}
                  </div>
                  <span className="text-[11px] text-[#6A808C]">{item.time}</span>
                </div>
                <p className="text-[#6A808C] leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
