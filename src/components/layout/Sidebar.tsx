import React from 'react';
import { 
  PanelLeftClose,
  ShieldCheck
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { NavigationTab, EngineerProfile } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { UserAvatar } from '../common/UserAvatar';
import { SyncStatusIndicator } from '../common/SyncStatusIndicator';
import { FsosMutedLogo } from '../common/FsosMutedLogo';
import { APP_VERSION } from '../../constants/version';
import { 
  motionTimings, 
  motionEasings, 
  mechanicalPressConfig, 
  slidingIndicatorTransition 
} from '../../theme/motion';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
  urgentAlertsCount?: number;
  profile?: EngineerProfile;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  badge?: number;
}

interface NavGroup {
  key: string;
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onToggleSidebar,
  urgentAlertsCount,
  profile
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const prefersReducedMotion = Boolean(useReducedMotion());

  if (!isOpen) {
    return null;
  }

  // Navigation Groups with Pure Typography Hierarchy (no redundant icon walls)
  const navGroups: NavGroup[] = [
    {
      key: 'work',
      title: 'DAILY WORK',
      items: [
        { id: 'start_page', label: 'Daily Work' },
      ]
    },
    {
      key: 'mhc_category',
      title: 'OPERATIONS',
      items: [
        { id: 'mhc_autopilot', label: 'MHC Autopilot' },
        { id: 'mhc_history', label: 'MHC History & Reports' },
      ]
    },
    {
      key: 'assets',
      title: 'ASSETS',
      items: [
        { id: 'machines', label: 'Machine Passport' },
      ]
    },
    {
      key: 'fleet',
      title: 'FLEET & CONTRACTS',
      items: [
        { id: 'customers', label: 'Customers & Plants' },
        { id: 'contracts', label: 'Contracts' },
        { id: 'analytics', label: 'Operational Analytics' },
      ]
    },
    {
      key: 'system',
      title: 'SYSTEM',
      items: [
        { id: 'profile', label: 'My Profile' },
        { id: 'settings', label: 'Settings' },
        { id: 'changelog', label: 'Release History' },
      ]
    }
  ];

  return (
    <motion.aside
      id="main-sidebar"
      aria-label="Application Navigation"
      initial={prefersReducedMotion ? { opacity: 0, width: 0 } : { opacity: 0, x: -240, width: 0 }}
      animate={prefersReducedMotion ? { opacity: 1, width: 240 } : { opacity: 1, x: 0, width: 240 }}
      exit={prefersReducedMotion ? { opacity: 0, width: 0 } : { opacity: 0, x: -240, width: 0 }}
      transition={{ duration: motionTimings.standard, ease: motionEasings.responsive }}
      className="main-sidebar w-60 border-r flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 overflow-hidden backdrop-theme-surface bg-surface border-theme-default text-theme-primary"
    >
      <div className="w-60 flex flex-col h-full shrink-0">
        {/* 1. Header Branding & Collapse Action */}
        <div id="main-sidebar-header" className="sidebar-header h-14 px-3.5 border-b border-theme-default flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FsosMutedLogo size={28} className="shrink-0" />
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-theme-primary">
                  FSOS
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-badge font-medium bg-raised text-theme-muted border border-theme-default">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-[10px] truncate text-theme-muted">
                Precision Operations
              </p>
            </div>
          </div>

          <motion.button
            whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.tap}
            onClick={onToggleSidebar}
            aria-label="Hide Sidebar"
            className="p-1.5 rounded-button text-theme-muted hover:text-theme-primary hover:bg-raised transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500 shrink-0"
            title="Hide Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </motion.button>
        </div>

        {/* 2. Compact Engineer Identity */}
        <div className="px-3 py-2 border-b border-theme-default">
          <motion.button 
            id="main-sidebar-profile-btn"
            type="button"
            whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
            onClick={() => setActiveTab('profile')}
            title="View Engineer Profile"
            className={`sidebar-profile-btn w-full flex items-center justify-between px-2.5 py-1.5 rounded-button text-left transition-colors relative ${
              activeTab === 'profile'
                ? 'bg-raised text-theme-primary border border-theme-strong shadow-2xs is-active' 
                : 'text-theme-secondary hover:bg-raised hover:text-theme-primary'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <UserAvatar user={profile} size="sm" showStatus={true} status="Online" />
              <div className="truncate">
                <p className="text-[11px] font-medium truncate text-theme-primary">
                  {profile?.name || 'Sahafiz'}
                </p>
                <p className="text-[10px] truncate text-theme-muted">
                  {profile?.role || 'Field Service Engineer'}
                </p>
              </div>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-theme-muted" />
          </motion.button>
        </div>

        {/* 3. Navigation Groups */}
        <nav className="sidebar-nav-container flex-1 overflow-y-auto p-2.5 space-y-4 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.key} className="space-y-1">
              {/* Section Header */}
              <div className="sidebar-section-header px-2 py-0.5 text-[10px] font-mono font-medium tracking-wider uppercase text-theme-muted">
                {group.title}
              </div>

              {/* Menu Items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
                      onClick={() => setActiveTab(item.id)}
                      className={`sidebar-nav-item w-full flex items-center justify-between px-2.5 py-1.5 rounded-button text-xs transition-colors relative ${
                        isActive
                          ? 'sidebar-nav-item-active bg-raised text-theme-primary font-medium border border-theme-strong shadow-2xs'
                          : 'text-theme-secondary hover:text-theme-primary hover:bg-raised'
                      }`}
                    >
                      {isActive && (
                        <motion.span 
                          layoutId="sidebarActiveIndicator"
                          className="sidebar-active-bar absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[var(--color-primary)]"
                          transition={prefersReducedMotion ? { duration: 0 } : slidingIndicatorTransition}
                        />
                      )}

                      <span className="truncate text-left font-theme-label">
                        {item.label}
                      </span>

                      {item.badge && item.badge > 0 ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono rounded-badge bg-raised text-theme-muted border border-theme-default">
                          {item.badge}
                        </span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* 4. Real Cloud Sync Hamster Footer */}
        <div id="main-sidebar-footer" className="sidebar-footer py-2 px-3 border-t border-theme-default flex items-center justify-center shrink-0 bg-surface relative">
          <SyncStatusIndicator isDark={isDark} placement="top-center" />
        </div>
      </div>
    </motion.aside>
  );
};
