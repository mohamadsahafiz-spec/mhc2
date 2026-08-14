import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Compass, 
  Activity, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Building2, 
  Cpu, 
  Sparkles,
  Check,
  Inbox
} from 'lucide-react';
import { NotificationItem, NotificationCategory, NavigationTab } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
  isDark: boolean;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNavigateTab,
  isDark
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.read;
    return true;
  });

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'MISSION_ASSIGNED':
        return <Compass className="w-4 h-4 text-indigo-400" />;
      case 'MHC_DUE':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'CONTRACT_REMINDER':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'PLANNER_REMINDER':
        return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'PENDING_REPORT':
        return <Clock className="w-4 h-4 text-orange-400" />;
      case 'COMPLETED_REPORT':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'CUSTOMER_ADDED':
        return <Building2 className="w-4 h-4 text-purple-400" />;
      case 'MACHINE_ADDED':
        return <Cpu className="w-4 h-4 text-[#8B9DFF]" />;
      case 'SYSTEM_UPDATE':
      default:
        return <Sparkles className="w-4 h-4 text-[#8B9DFF]" />;
    }
  };

  const getCategoryBadge = (category: NotificationCategory) => {
    const formatted = category.replace(/_/g, ' ');
    return formatted;
  };

  const handleItemClick = (notif: NotificationItem) => {
    if (!notif.read) {
      onMarkAsRead(notif.id);
    }
    if (notif.targetTab && onNavigateTab) {
      onNavigateTab(notif.targetTab);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop overlay for quick dismissal */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Notification Panel Modal / Slideover */}
      <div className={`fixed right-4 top-16 z-50 w-full max-w-md rounded-2xl border shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-top-3 ${
        isDark 
          ? 'bg-[#181B1E] border-[#2B323A] text-slate-100 shadow-black/60' 
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-[#2B323A]' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-[#8B9DFF]/10 border-[#8B9DFF]/30 text-[#8B9DFF]' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
            }`}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight">Notification Center</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-600 text-white shadow-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Operational updates, tasks & system alerts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark ? 'border-[#2B323A] text-slate-400 hover:text-slate-200 hover:bg-[#20252B]' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar & Action Controls */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 text-xs ${
          isDark ? 'bg-[#141618] border-[#2B323A]' : 'bg-slate-50 border-slate-100'
        }`}>
          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                filter === 'ALL'
                  ? isDark 
                    ? 'bg-[#20252B] text-white border border-[#2B323A]' 
                    : 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                filter === 'UNREAD'
                  ? isDark 
                    ? 'bg-[#20252B] text-white border border-[#2B323A]' 
                    : 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                title="Mark all as read"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  isDark ? 'text-[#8B9DFF] hover:bg-[#8B9DFF]/10' : 'text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                title="Clear all notifications"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List Body */}
        <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center border ${
                isDark ? 'bg-[#20252B] border-[#2B323A] text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-300 dark:text-slate-200">You're all caught up.</h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No new notifications today.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-3 rounded-xl border text-xs transition-all cursor-pointer relative group ${
                  !notif.read
                    ? isDark 
                      ? 'bg-[#20252B] border-[#8B9DFF]/30 hover:border-[#8B9DFF]/60' 
                      : 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-400'
                    : isDark 
                      ? 'bg-[#141618]/60 border-[#2B323A] opacity-75 hover:opacity-100' 
                      : 'bg-slate-50/80 border-slate-200 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Category Icon or User Avatar */}
                  <div className="shrink-0 mt-0.5">
                    {notif.category === 'MISSION_ASSIGNED' ? (
                      <UserAvatar user={{ fullName: 'Sahafiz' }} size="sm" showStatus={true} status="Online" />
                    ) : (
                      <div className={`p-2 rounded-xl border ${
                        isDark ? 'bg-[#181B1E] border-[#2B323A]' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        {getCategoryIcon(notif.category)}
                      </div>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                        isDark ? 'bg-[#8B9DFF]/10 text-[#8B9DFF] border-[#8B9DFF]/20' : 'bg-indigo-100/80 text-indigo-700 border-indigo-200'
                      }`}>
                        {getCategoryBadge(notif.category)}
                      </span>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {notif.time}
                      </span>
                    </div>

                    <h4 className={`font-bold text-xs ${
                      !notif.read ? 'text-slate-100 dark:text-white' : 'text-slate-300 dark:text-slate-300'
                    }`}>
                      {notif.title}
                    </h4>

                    <p className={`mt-0.5 text-[11px] leading-relaxed line-clamp-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {notif.description}
                    </p>
                  </div>

                  {/* Read / Unread Indicator Dot & Single Read Button */}
                  <div className="absolute right-3 top-3 flex items-center gap-1">
                    {!notif.read ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20 animate-pulse" title="Unread" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-500 opacity-60" title="Read" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t text-center ${
          isDark ? 'border-[#2B323A] bg-[#141618]/80 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500'
        }`}>
          <p className="text-[10px] font-mono">FSOS Notification Service • Real-time Sync Active</p>
        </div>
      </div>
    </>
  );
};
