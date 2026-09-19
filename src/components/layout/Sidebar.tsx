import React from 'react';
import { 
  PanelLeftClose,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { NavigationTab, EngineerProfile, WorkspaceMode } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { UserAvatar } from '../common/UserAvatar';
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
  workspaceMode?: WorkspaceMode;
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
  profile,
  workspaceMode = 'MHC_MODE'
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const isMhcMode = workspaceMode === 'MHC_MODE';
  const prefersReducedMotion = Boolean(useReducedMotion());

  if (!isOpen) {
    return null;
  }

  // Navigation Groups with Pure Typography Hierarchy (no redundant icon walls)
  const rawNavGroups: NavGroup[] = [
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
        { id: 'users', label: 'Engineers Directory' },
        { id: 'settings', label: 'Settings' },
        { id: 'changelog', label: 'Release History' },
      ]
    }
  ];

  // Filter navigation items based on Workspace Mode
  const navGroups: NavGroup[] = rawNavGroups.map(group => {
    if (!isMhcMode) return group;

    let allowedIds: NavigationTab[] = [];
    if (group.key === 'work') {
      allowedIds = ['start_page'];
    } else if (group.key === 'mhc_category') {
      allowedIds = ['mhc_autopilot', 'mhc_history'];
    } else if (group.key === 'assets') {
      allowedIds = ['machines'];
    } else if (group.key === 'fleet') {
      allowedIds = ['customers', 'contracts', 'analytics'];
    } else if (group.key === 'system') {
      allowedIds = ['profile', 'settings', 'changelog'];
    }

    return {
      ...group,
      items: group.items.filter(item => allowedIds.includes(item.id))
    };
  }).filter(group => group.items.length > 0);

  return (
    <motion.aside
      aria-label="Application Navigation"
      initial={prefersReducedMotion ? { opacity: 0, width: 0 } : { opacity: 0, x: -240, width: 0 }}
      animate={prefersReducedMotion ? { opacity: 1, width: 240 } : { opacity: 1, x: 0, width: 240 }}
      exit={prefersReducedMotion ? { opacity: 0, width: 0 } : { opacity: 0, x: -240, width: 0 }}
      transition={{ duration: motionTimings.standard, ease: motionEasings.responsive }}
      className={`w-60 border-r flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 overflow-hidden ${
        isDark 
          ? 'bg-[#121518] border-[#262C34] text-slate-300' 
          : 'bg-[#F8FAFC] border-slate-200 text-slate-800'
      }`}
    >
      <div className="w-60 flex flex-col h-full shrink-0">
        {/* 1. Header Branding & Collapse Action */}
        <div className={`h-14 px-3.5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-[#262C34]' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
              isDark 
                ? 'bg-[#1C2026] text-slate-200 border border-[#2E3642]' 
                : 'bg-slate-900 text-white'
            }`}>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  FSOS
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                  isDark ? 'bg-[#1C2026] text-slate-400 border border-[#2E3642]' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {APP_VERSION}
                </span>
              </div>
              <p className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Precision Operations
              </p>
            </div>
          </div>

          <motion.button
            whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.tap}
            onClick={onToggleSidebar}
            aria-label="Hide Sidebar"
            className={`p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500 shrink-0`}
            title="Hide Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </motion.button>
        </div>

        {/* 2. Compact Engineer Identity */}
        <div className={`px-3 py-2 border-b ${isDark ? 'border-[#262C34]' : 'border-slate-200'}`}>
          <motion.button 
            type="button"
            whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
            onClick={() => setActiveTab('profile')}
            title="View Engineer Profile"
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors relative ${
              activeTab === 'profile'
                ? isDark 
                  ? 'bg-[#1C2026] text-slate-100 border border-[#2E3642]' 
                  : 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                : isDark 
                  ? 'text-slate-300 hover:bg-[#181B20]' 
                  : 'text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <UserAvatar user={profile} size="sm" showStatus={true} status="Online" />
              <div className="truncate">
                <p className={`text-[11px] font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  {profile?.name || 'Sahafiz'}
                </p>
                <p className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {profile?.role || 'Field Service Engineer'}
                </p>
              </div>
            </div>
            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </motion.button>
        </div>

        {/* 3. Navigation Groups */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-4 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.key} className="space-y-1">
              {/* Section Header */}
              <div className={`px-2 py-0.5 text-[10px] font-mono font-medium tracking-wider uppercase ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
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
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors relative ${
                        isActive
                          ? isDark
                            ? 'bg-[#1C2026] text-slate-100 font-medium border border-[#2E3642]'
                            : 'bg-white text-slate-950 font-medium border border-slate-200 shadow-2xs'
                          : isDark
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-[#181B20]'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      {isActive && (
                        <motion.span 
                          layoutId="sidebarActiveIndicator"
                          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-emerald-500"
                          transition={prefersReducedMotion ? { duration: 0 } : slidingIndicatorTransition}
                        />
                      )}

                      <span className="truncate text-left">
                        {item.label}
                      </span>

                      {item.badge && item.badge > 0 ? (
                        <span className={`px-1.5 py-0.2 text-[9px] font-mono rounded ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                        }`}>
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

        {/* 4. Subtle System Status Footer */}
        <div className={`px-3.5 py-2.5 border-t text-[10px] font-mono flex items-center justify-between shrink-0 ${
          isDark ? 'bg-[#121518] border-[#262C34] text-slate-500' : 'bg-[#F8FAFC] border-slate-200 text-slate-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">FSOS Core • Ready</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
