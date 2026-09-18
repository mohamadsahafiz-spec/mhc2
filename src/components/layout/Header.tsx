import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  Moon, 
  Sun, 
  Monitor, 
  User, 
  ChevronDown, 
  Settings as SettingsIcon, 
  LogOut, 
  BellRing,
  ScrollText
} from 'lucide-react';
import { NavigationTab, AlertItem, NotificationItem, SystemUser, WorkspaceMode } from '../../types';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { UserAvatar } from '../common/UserAvatar';
import { WorkspaceModeSelector } from './WorkspaceModeSelector';
import { SyncStatusIndicator } from '../common/SyncStatusIndicator';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  alerts: AlertItem[];
  notifications: NotificationItem[];
  activeUser: SystemUser;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAllNotifications: () => void;
  onOpenQuickMhc: () => void;
  nextPriorityAction: string;
  workspaceMode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  alerts,
  notifications,
  activeUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAllNotifications,
  onOpenQuickMhc,
  nextPriorityAction,
  workspaceMode,
  onModeChange,
  onLogout
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const { theme, setTheme, effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'start_page': return 'Daily Work';
      case 'mhc_autopilot': return 'MHC Autopilot';
      case 'mhc': return 'Machine Health Check (MHC)';
      case 'mhc_history': return 'MHC History & Reports';
      case 'contracts': return 'Contracts';
      case 'customers': return 'Customers & Plants';
      case 'machines': return 'Machine Passport';
      case 'analytics': return 'Operational Analytics';
      case 'users': return 'Engineers Directory';
      case 'settings': return 'Settings';
      case 'profile': return 'My Profile';
      case 'changelog': return 'Release History';
      default: return 'Field Operations System';
    }
  };

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  // Close overlays on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(target)) {
        setShowNotificationPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close overlays on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotificationPanel(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close overlays when navigating
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotificationPanel(false);
  }, [activeTab]);

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <header className={`h-14 px-4 sm:px-6 border-b sticky top-0 z-20 transition-colors duration-150 flex items-center justify-between gap-3 ${
      isDark 
        ? 'bg-[#121518] border-[#262C34] text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* 1. Context Orientation */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-sm font-semibold tracking-tight shrink-0">
          {getTabTitle(activeTab)}
        </h1>

        {/* Operational Directive (Only visible on Daily Work where relevant) */}
        {activeTab === 'start_page' && nextPriorityAction && (
          <div className="hidden lg:flex items-center gap-2 min-w-0 pl-3 border-l border-slate-300 dark:border-slate-700">
            <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
              isDark 
                ? 'bg-[#1C2026] text-slate-400 border-[#2E3642]' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              DIRECTIVE
            </span>
            <p className={`text-xs truncate max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {nextPriorityAction}
            </p>
          </div>
        )}
      </div>

      {/* 2. Unified Operational & System Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Global Search */}
        <div className="relative hidden xl:block w-44">
          <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full text-xs rounded-md pl-7 pr-2.5 py-1 border transition-colors ${
              isDark 
                ? 'bg-[#181B20] text-slate-200 border-[#2E3642] placeholder-slate-500 focus:border-slate-400 focus:outline-none' 
                : 'bg-slate-50 text-slate-900 border-slate-200 placeholder-slate-400 focus:border-slate-400 focus:outline-none'
            }`}
          />
        </div>

        {/* Quick Action: New Health Check */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={onOpenQuickMhc}
        >
          New MHC
        </Button>

        <div className={`h-4 w-px mx-0.5 hidden sm:block ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

        {/* Sync Status Indicator */}
        <SyncStatusIndicator isDark={isDark} />

        {/* Workspace Mode Selector */}
        <WorkspaceModeSelector
          currentMode={workspaceMode}
          onModeChange={onModeChange}
          userRole={activeUser?.role || 'Field Service Engineer'}
        />

        {/* Theme Toggle (Single Cycle Button) */}
        <button
          onClick={cycleTheme}
          title={`Theme: ${theme} (Click to toggle)`}
          aria-label={`Current theme is ${theme}. Click to switch theme.`}
          className={`p-1.5 rounded-md border text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500 ${
            isDark 
              ? 'bg-[#181B20] border-[#2E3642] hover:bg-[#20252C]' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {theme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-slate-300" />
          ) : theme === 'light' ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {/* Notification Center Trigger */}
        <div className="relative" ref={notifContainerRef}>
          <button
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            title="Notifications"
            aria-label="View notifications"
            className={`p-1.5 rounded-md border transition-colors relative focus:outline-none focus:ring-1 focus:ring-slate-500 ${
              showNotificationPanel
                ? isDark 
                  ? 'bg-[#22272E] border-slate-500 text-slate-100' 
                  : 'bg-slate-100 border-slate-300 text-slate-900'
                : isDark 
                  ? 'bg-[#181B20] border-[#2E3642] text-slate-400 hover:text-slate-200 hover:bg-[#20252C]' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full text-[8px] font-bold font-mono flex items-center justify-center bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 ring-1 ring-[#121518]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel Popover */}
          <NotificationPanel
            isOpen={showNotificationPanel}
            onClose={() => setShowNotificationPanel(false)}
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onClearAll={onClearAllNotifications}
            onNavigateTab={setActiveTab}
            isDark={isDark}
          />
        </div>

        {/* Account Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            title="Account Menu"
            aria-label="Open Account Menu"
            aria-expanded={showUserMenu}
            className={`flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-md border transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500 ${
              showUserMenu
                ? isDark 
                  ? 'bg-[#22272E] border-slate-500 text-white' 
                  : 'bg-slate-100 border-slate-300 text-slate-900'
                : isDark 
                  ? 'bg-[#181B20] border-[#2E3642] text-slate-300 hover:bg-[#20252C]' 
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <UserAvatar user={activeUser} size="sm" showStatus={true} />
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180 text-slate-200' : ''}`} />
          </button>

          {/* User Account Popover */}
          {showUserMenu && (
            <div className={`absolute right-0 mt-1.5 w-48 rounded-lg border shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 ${
              isDark ? 'bg-[#181B20] border-[#2E3642] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 font-medium transition-colors ${
                    isDark ? 'hover:bg-[#22272E] text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationPanel(true);
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between font-medium transition-colors ${
                    isDark ? 'hover:bg-[#22272E] text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BellRing className="w-3.5 h-3.5 text-slate-400" />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-slate-800 text-slate-200">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 font-medium transition-colors ${
                    isDark ? 'hover:bg-[#22272E] text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('changelog');
                    setShowUserMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 font-medium transition-colors ${
                    isDark ? 'hover:bg-[#22272E] text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <ScrollText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Release History</span>
                </button>
              </div>

              <div className="pt-1 mt-1 border-t border-slate-700/30 dark:border-slate-700/30">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
