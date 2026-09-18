import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  ChevronDown, 
  Settings as SettingsIcon, 
  LogOut, 
  ScrollText,
  PanelLeft
} from 'lucide-react';
import { NavigationTab, SystemUser } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { UserAvatar } from '../common/UserAvatar';
import { SyncStatusIndicator } from '../common/SyncStatusIndicator';

interface HeaderProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeUser: SystemUser;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  onToggleSidebar,
  activeUser,
  onLogout
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menu when navigation tab changes
  useEffect(() => {
    setShowUserMenu(false);
  }, [activeTab]);

  return (
    <header className={`h-14 px-4 sm:px-6 border-b sticky top-0 z-20 transition-colors duration-150 flex items-center justify-between gap-3 ${
      isDark 
        ? 'bg-[#121518] border-[#262C34] text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* 1. Context Orientation & Restore Sidebar Trigger */}
      <div className="flex items-center gap-2.5 min-w-0">
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            aria-label="Show navigation sidebar"
            aria-expanded={false}
            title="Show sidebar"
            className={`p-1.5 rounded-md border text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500 ${
              isDark 
                ? 'bg-[#181B20] border-[#2E3642] hover:bg-[#20252C]' 
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <PanelLeft className="w-4 h-4" />
            <span className="text-xs font-medium pr-1">Menu</span>
          </button>
        )}

        <h1 className="text-sm font-semibold tracking-tight truncate">
          {getTabTitle(activeTab)}
        </h1>
      </div>

      {/* 2. Minimal Global Actions & Status */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Real Sync Status */}
        <SyncStatusIndicator isDark={isDark} />

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
