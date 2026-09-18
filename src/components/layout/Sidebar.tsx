import React, { useState, useEffect } from 'react';
import { 
  Compass,
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
  ScrollText
} from 'lucide-react';
import { NavigationTab, EngineerProfile, WorkspaceMode } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { UserAvatar } from '../common/UserAvatar';
import { APP_VERSION } from '../../constants/version';

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

  // Nav Groups Definition with Calm Monochrome Functional Icons
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    work: true,
    mhc_category: true,
    assets: true,
    fleet: true,
    system: true
  }));

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
      aria-label="Application Sidebar"
      className={`${
        isCollapsed ? 'w-16' : 'w-60'
      } border-r flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-[width] duration-150 ease-in-out ${
        isDark 
          ? 'bg-[#121518] border-[#262C34] text-slate-300' 
          : 'bg-[#F8FAFC] border-slate-200 text-slate-800'
      }`}
    >
      {/* 1. Header Branding & Collapse Toggle */}
      <div className={`h-14 px-3.5 border-b flex items-center justify-between shrink-0 ${
        isDark ? 'border-[#262C34]' : 'border-slate-200'
      }`}>
        {!isCollapsed ? (
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
        ) : (
          <div className="w-full flex items-center justify-center">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs ${
              isDark 
                ? 'bg-[#1C2026] text-slate-200 border border-[#2E3642]' 
                : 'bg-slate-900 text-white'
            }`} title={`FSOS ${APP_VERSION}`}>
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebarCollapse}
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-expanded={!isCollapsed}
          className={`p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500 ${
            isCollapsed ? 'hidden' : 'shrink-0'
          }`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsed Expand Trigger Bar */}
      {isCollapsed && (
        <div className={`py-1.5 border-b flex justify-center ${isDark ? 'border-[#262C34]' : 'border-slate-200'}`}>
          <button
            onClick={toggleSidebarCollapse}
            aria-label="Expand Sidebar"
            aria-expanded={false}
            className={`p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500`}
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Personal Engineer Workspace Identity */}
      {!isCollapsed ? (
        <div className={`px-3 py-2 border-b ${isDark ? 'border-[#262C34]' : 'border-slate-200'}`}>
          <button 
            type="button"
            onClick={() => setActiveTab('profile')}
            title="View Engineer Profile"
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors ${
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
          </button>
        </div>
      ) : (
        <div className={`py-2 border-b flex justify-center ${isDark ? 'border-[#262C34]' : 'border-slate-200'}`}>
          <button 
            type="button"
            onClick={() => setActiveTab('profile')} 
            className="rounded-full focus:outline-none focus:ring-1 focus:ring-slate-500" 
            title={profile?.name || 'My Profile'}
            aria-label={profile?.name || 'My Profile'}
          >
            <UserAvatar user={profile} size="sm" showStatus={true} status="Online" />
          </button>
        </div>
      )}

      {/* 3. Navigation Hierarchy */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin">
        {navGroups.map((group, groupIdx) => {
          const isOpen = !!openGroups[group.key];
          const hasActiveChild = group.items.some(i => i.id === activeTab);

          return (
            <div key={group.key} className="space-y-0.5">
              {/* Group Title / Toggle Button */}
              {!isCollapsed ? (
                <button
                  type="button"
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
                </button>
              ) : groupIdx > 0 ? (
                <div className={`border-t my-2 mx-2 ${isDark ? 'border-[#262C34]' : 'border-slate-200'}`} />
              ) : null}

              {/* Group Items */}
              {(isOpen || isCollapsed) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const IconComponent = item.icon;

                    if (isCollapsed) {
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          title={item.label}
                          aria-label={item.label}
                          className={`w-10 h-10 mx-auto flex items-center justify-center rounded-md transition-all relative ${
                            isActive
                              ? isDark
                                ? 'bg-[#1C2026] text-white border border-[#2E3642]'
                                : 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                              : isDark
                                ? 'text-slate-400 hover:text-slate-200 hover:bg-[#181B20]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-emerald-500" />
                          )}
                          <IconComponent className="w-4 h-4 shrink-0" />
                        </button>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all relative ${
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
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-emerald-500" />
                        )}

                        <div className="flex items-center gap-2.5 min-w-0">
                          <IconComponent className={`w-4 h-4 shrink-0 ${
                            isActive 
                              ? isDark ? 'text-slate-100' : 'text-slate-900' 
                              : isDark ? 'text-slate-400' : 'text-slate-500'
                          }`} />
                          <span className="truncate text-left text-xs">
                            {item.label}
                          </span>
                        </div>

                        {item.badge && item.badge > 0 ? (
                          <span className={`px-1.5 py-0.2 text-[9px] font-mono rounded ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {item.badge}
                          </span>
                        ) : null}
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
        isDark ? 'bg-[#121518] border-[#262C34] text-slate-500' : 'bg-[#F8FAFC] border-slate-200 text-slate-500'
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
