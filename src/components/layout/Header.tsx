import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  ChevronDown, 
  Settings as SettingsIcon, 
  LogOut, 
  ScrollText,
  PanelLeft
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { NavigationTab, SystemUser } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { UserAvatar } from '../common/UserAvatar';
import { SyncStatusIndicator } from '../common/SyncStatusIndicator';
import { 
  motionTimings, 
  motionEasings, 
  mechanicalPressConfig, 
  createScaleFadeVariants 
} from '../../theme/motion';

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
  const prefersReducedMotion = Boolean(useReducedMotion());

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
    <header className="h-14 px-4 sm:px-6 border-b sticky top-0 z-20 backdrop-theme-surface transition-colors duration-150 flex items-center justify-between gap-3 bg-surface border-theme-default text-theme-primary">
      {/* 1. Context Orientation & Restore Sidebar Trigger */}
      <div className="flex items-center gap-2.5 min-w-0">
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.button
              key="sidebar-restore-trigger"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, x: -6 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, x: -6 }}
              transition={{ duration: motionTimings.quick, ease: motionEasings.responsive }}
              whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.tap}
              whileHover={prefersReducedMotion ? undefined : mechanicalPressConfig.hover}
              onClick={onToggleSidebar}
              aria-label="Show navigation sidebar"
              aria-expanded={false}
              title="Show sidebar"
              className="p-1.5 rounded-button border text-theme-secondary hover:text-theme-primary flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500 bg-raised border-theme-default hover:bg-surface font-theme-label"
            >
              <PanelLeft className="w-4 h-4" />
              <span className="text-xs font-medium pr-1">Menu</span>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.h1
            key={activeTab}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            transition={{ duration: motionTimings.quick, ease: motionEasings.smooth }}
            className="text-sm font-theme-heading tracking-tight truncate text-theme-primary"
          >
            {getTabTitle(activeTab)}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* 2. Minimal Global Actions & Status */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Real Sync Status */}
        <SyncStatusIndicator isDark={isDark} />

        {/* Account Menu */}
        <div className="relative" ref={userMenuRef}>
          <motion.button
            whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.tap}
            onClick={() => setShowUserMenu(!showUserMenu)}
            title="Account Menu"
            aria-label="Open Account Menu"
            aria-expanded={showUserMenu}
            className={`flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-button border transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500 ${
              showUserMenu
                ? 'bg-raised border-theme-strong text-theme-primary'
                : 'bg-raised border-theme-default text-theme-secondary hover:bg-surface hover:text-theme-primary'
            }`}
          >
            <UserAvatar user={activeUser} size="sm" showStatus={true} />
            <ChevronDown className={`w-3 h-3 text-theme-muted transition-transform ${showUserMenu ? 'rotate-180 text-theme-primary' : ''}`} />
          </motion.button>

          {/* User Account Popover */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                key="user-account-dropdown"
                variants={createScaleFadeVariants(prefersReducedMotion)}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-1.5 w-48 rounded-modal border shadow-theme-popover backdrop-theme-surface p-1.5 z-50 bg-raised border-theme-default text-theme-primary"
              >
                <div className="space-y-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-button flex items-center gap-2 font-theme-label transition-colors hover:bg-surface text-theme-secondary hover:text-theme-primary"
                  >
                    <User className="w-3.5 h-3.5 text-theme-muted" />
                    <span>My Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-button flex items-center gap-2 font-theme-label transition-colors hover:bg-surface text-theme-secondary hover:text-theme-primary"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-theme-muted" />
                    <span>Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('changelog');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-button flex items-center gap-2 font-theme-label transition-colors hover:bg-surface text-theme-secondary hover:text-theme-primary"
                  >
                    <ScrollText className="w-3.5 h-3.5 text-theme-muted" />
                    <span>Release History</span>
                  </button>
                </div>

                <div className="pt-1 mt-1 border-t border-theme-subtle">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-button flex items-center gap-2 font-theme-label text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
