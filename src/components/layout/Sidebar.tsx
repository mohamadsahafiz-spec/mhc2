import React, { useState, useEffect } from 'react';
import { 
  Compass,
  LayoutDashboard, 
  FileText, 
  Building2, 
  Cpu, 
  LineChart, 
  Users,
  User,
  History,
  Database,
  Bot,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  SlidersHorizontal,
  CircleDot,
  ScrollText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationTab, EngineerProfile, WorkspaceMode } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { UserAvatar } from '../common/UserAvatar';
import { APP_VERSION } from '../../constants/version';
import { motionPresets } from '../../theme/tokens';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  urgentAlertsCount: number;
  profile?: EngineerProfile;
  workspaceMode?: WorkspaceMode;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
  urgentAlertsCount,
  profile,
  workspaceMode = 'MHC_MODE'
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const isMhcMode = workspaceMode === 'MHC_MODE';

  // Sidebar Rail Collapse State
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('fsos_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleSidebarCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('fsos_sidebar_collapsed', String(nextState));
    }
  };

  // Nav Groups Definition with Monochrome Functional Icons
  const rawNavGroups: NavGroup[] = [
    {
      key: 'work',
      title: 'DAILY WORK',
      items: [
        { id: 'start_page', label: 'Daily Work', icon: Compass },
      ]
    },
    {
      key: 'mhc_category',
      title: 'OPERATIONS',
      items: [
        { id: 'mhc_autopilot', label: 'MHC Autopilot', icon: Bot },
        { id: 'mhc_history', label: 'MHC History', icon: History },
      ]
    },
    {
      key: 'assets',
      title: 'ASSETS',
      items: [
        { id: 'machines', label: 'Machine Passport', icon: Cpu },
      ]
    },
    {
      key: 'fleet',
      title: 'FLEET & CONTRACTS',
      items: [
        { id: 'customers', label: 'Customers & Plants', icon: Building2 },
        { id: 'contracts', label: 'Contracts', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: LineChart },
      ]
    },
    {
      key: 'system',
      title: 'SYSTEM',
      items: [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'users', label: 'Engineers Directory', icon: Users },
        { id: 'settings', label: 'Settings', icon: Database },
        { id: 'changelog', label: 'Release History', icon: ScrollText },
      ]
    }
  ];

  // Filter nav items based on Workspace Mode
  const navGroups: NavGroup[] = rawNavGroups.map(group => {
    if (!isMhcMode) return group;

    // In MHC Mode, show operationally focused tabs
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

  // Group Open/Close State
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {
      work: true,
      mhc_category: true,
      assets: true,
      fleet: true,
      system: true
    };
    return initialState;
  });

  useEffect(() => {
    const activeGroup = navGroups.find(g => g.items.some(i => i.id === activeTab));
    if (activeGroup) {
      setOpenGroups(prev => ({
        ...prev,
        [activeGroup.key]: true
      }));
    }
  }, [activeTab]);

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } border-r flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-[width] duration-200 ease-out ${
        isDark 
          ? 'bg-[#111315] border-[#2B323A]/70 text-slate-300' 
          : 'bg-[#F8FAFC] border-slate-200 text-slate-800 shadow-2xs'
      }`}
    >
      {/* 1. Identity & System Header */}
      <div className={`h-14 px-3.5 border-b flex items-center justify-between shrink-0 ${
        isDark ? 'border-[#2B323A]/60' : 'border-slate-200 bg-white/50'
      }`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Technical Mark: Calm geometric aperture */}
            <div className={`w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
              isDark 
                ? 'bg-[#1C2026] text-slate-200 border border-[#2B323A]' 
                : 'bg-slate-900 text-white shadow-2xs'
            }`}>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  FSOS
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                  isDark ? 'bg-[#1C2026] text-slate-400 border border-[#2B323A]' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {APP_VERSION}
                </span>
              </div>
              <p className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Field Operations Workspace
              </p>
            </div>
          </div>
        ) : (
          <div className={`w-7 h-7 mx-auto rounded-md flex items-center justify-center font-mono font-bold text-xs ${
            isDark 
              ? 'bg-[#1C2026] text-slate-200 border border-[#2B323A]' 
              : 'bg-slate-900 text-white shadow-2xs'
          }`}>
            <Activity className="w-3.5 h-3.5" />
          </div>
        )}

        <button
          onClick={toggleSidebarCollapse}
          className={`p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors ${
            isCollapsed ? 'mx-auto mt-1' : ''
          }`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. Personal Engineer Workspace Badge */}
      {!isCollapsed ? (
        <div className={`px-3 py-2.5 border-b ${isDark ? 'border-[#2B323A]/40' : 'border-slate-200/60'}`}>
          <div 
            onClick={() => setActiveTab('profile')}
            title="View Engineer Profile"
            className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-xs cursor-pointer transition-all duration-150 ${
              activeTab === 'profile'
                ? isDark 
                  ? 'bg-[#1C2026] border-[#3D4754] text-slate-100' 
                  : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                : isDark 
                  ? 'bg-[#16191D] border-[#2B323A]/50 text-slate-300 hover:bg-[#1C2026] hover:border-[#3D4754]' 
                  : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <UserAvatar user={profile} size="sm" showStatus={true} status="Online" />
              <div className="truncate">
                <p className={`text-[11px] font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  {profile?.name || 'Sahafiz'}
                </p>
                <p className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {profile?.role || 'Field Service Engineer'}
                </p>
              </div>
            </div>
            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>
        </div>
      ) : (
        <div className={`p-2 border-b flex justify-center ${isDark ? 'border-[#2B323A]/40' : 'border-slate-200/60'}`}>
          <div onClick={() => setActiveTab('profile')} className="cursor-pointer" title={profile?.name || 'My Profile'}>
            <UserAvatar user={profile} size="sm" showStatus={true} status="Online" />
          </div>
        </div>
      )}

      {/* 3. Navigation Hierarchy */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-3.5 scrollbar-thin">
        {navGroups.map((group) => {
          const isOpen = !!openGroups[group.key];
          const hasActiveChild = group.items.some(i => i.id === activeTab);
          const groupBadgeCount = group.items.reduce((sum, item) => sum + (item.badge || 0), 0);

          return (
            <div key={group.key} className="space-y-1">
              {/* Group Title / Toggle Button */}
              {!isCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-mono font-medium tracking-wider uppercase transition-colors ${
                    hasActiveChild
                      ? isDark ? 'text-slate-300 font-semibold' : 'text-slate-800 font-semibold'
                      : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isOpen ? <ChevronDown className="w-3 h-3 opacity-60" /> : <ChevronRight className="w-3 h-3 opacity-60" />}
                    <span>{group.title}</span>
                  </div>

                  {!isOpen && groupBadgeCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {groupBadgeCount}
                    </span>
                  )}
                </button>
              ) : (
                <div className="w-full text-center py-1">
                  <span className="w-1 h-1 rounded-full bg-slate-600 inline-block" title={group.title} />
                </div>
              )}

              {/* Group Items */}
              {(isOpen || isCollapsed) && (
                <div className={`space-y-0.5 ${!isCollapsed ? 'pl-1' : ''}`}>
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const IconComponent = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center justify-between p-1.5 rounded-md text-xs transition-all duration-150 relative group ${
                          isActive
                            ? isDark
                              ? 'bg-[#1C2026] text-slate-100 font-medium border border-[#3D4754]/80'
                              : 'bg-white text-slate-950 font-semibold border border-slate-300/80 shadow-2xs'
                            : isDark
                              ? 'text-slate-400 hover:text-slate-200 hover:bg-[#16191D] border border-transparent'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
                        }`}
                      >
                        {/* Active Anchor Indicator */}
                        {isActive && (
                          <span 
                            className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full ${
                              isDark ? 'bg-slate-300' : 'bg-slate-900'
                            }`} 
                          />
                        )}

                        <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'mx-auto justify-center' : ''}`}>
                          <span className={`shrink-0 transition-colors ${
                            isActive 
                              ? isDark ? 'text-slate-100' : 'text-slate-900' 
                              : 'text-slate-400 group-hover:text-slate-200'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </span>
                          {!isCollapsed && (
                            <span className="truncate text-left text-xs">
                              {item.label}
                            </span>
                          )}
                        </div>

                        {!isCollapsed && (
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {item.badge && item.badge > 0 ? (
                              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {item.badge}
                              </span>
                            ) : null}
                            {isActive && (
                              <CircleDot className={`w-2.5 h-2.5 opacity-60 ${isDark ? 'text-slate-300' : 'text-slate-900'}`} />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 4. Structural Workspace Footer Indicator */}
      <div className={`p-2.5 border-t text-[10px] font-mono flex items-center justify-between shrink-0 ${
        isDark ? 'bg-[#111315] border-[#2B323A]/60 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">Core Ready • Local & D1</span>
          </div>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500 mx-auto" title="Core Ready • Local & D1" />
        )}
      </div>
    </aside>
  );
};
