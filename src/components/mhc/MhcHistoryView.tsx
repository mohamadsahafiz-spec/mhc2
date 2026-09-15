import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { MHCSession, Machine } from '../../types';
import { MhcHistoryHeader } from './history/MhcHistoryHeader';
import { MhcHistoryToolbar, HistoryStatusFilter, HistorySortOrder } from './history/MhcHistoryToolbar';
import { MhcHistorySessionList } from './history/MhcHistorySessionList';
import { MhcHistoryDetailView } from './history/MhcHistoryDetailView';
import { Inbox } from 'lucide-react';

export interface MhcHistoryViewProps {
  sessions: MHCSession[];
  machines: Machine[];
  selectedMachineId?: string | null;
  onSelectMachineId?: (machineId: string | null) => void;
  onOpenSession?: (sessionId: string) => void;
  onOpenSmartWorkspace?: (sessionId: string) => void;
  onOpenStageForm?: (sessionId: string, stageNum: number) => void;
  onNavigate?: (tab: any) => void;
}

export const MhcHistoryView: React.FC<MhcHistoryViewProps> = ({
  sessions,
  machines,
  selectedMachineId = null,
  onSelectMachineId,
  onOpenSession,
  onOpenSmartWorkspace,
  onNavigate
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Internal machine filter state synchronized with prop
  const [activeMachineId, setActiveMachineId] = useState<string | null>(selectedMachineId || null);

  useEffect(() => {
    if (selectedMachineId !== undefined) {
      setActiveMachineId(selectedMachineId);
    }
  }, [selectedMachineId]);

  const handleMachineSelect = (id: string | null) => {
    setActiveMachineId(id);
    if (onSelectMachineId) {
      onSelectMachineId(id);
    }
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>('ALL');
  const [sortOrder, setSortOrder] = useState<HistorySortOrder>('DESC');

  // Selected session state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'detail'>('list');

  // Filter and sort sessions chronologically
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Filter by machine if selected
    if (activeMachineId) {
      result = result.filter(s => s.machineId === activeMachineId);
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter(s => s.completionStatus === statusFilter);
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(s => 
        (s.id && s.id.toLowerCase().includes(q)) ||
        (s.machineModel && s.machineModel.toLowerCase().includes(q)) ||
        (s.machineName && s.machineName.toLowerCase().includes(q)) ||
        (s.machineSerialNumber && s.machineSerialNumber.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.plantName && s.plantName.toLowerCase().includes(q)) ||
        (s.engineerName && s.engineerName.toLowerCase().includes(q))
      );
    }

    // Chronological sorting (by startDate + startTime or lastUpdated)
    result.sort((a, b) => {
      const timeA = new Date(`${a.startDate} ${a.startTime || '00:00'}`).getTime() || (a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0);
      const timeB = new Date(`${b.startDate} ${b.startTime || '00:00'}`).getTime() || (b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0);

      return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [sessions, activeMachineId, statusFilter, searchTerm, sortOrder]);

  // Keep selected session valid
  useEffect(() => {
    if (filteredSessions.length > 0) {
      if (!selectedSessionId || !filteredSessions.some(s => s.id === selectedSessionId)) {
        setSelectedSessionId(filteredSessions[0].id);
      }
    } else {
      setSelectedSessionId(null);
    }
  }, [filteredSessions, selectedSessionId]);

  // Active selected session object
  const activeSession = useMemo(() => {
    return filteredSessions.find(s => s.id === selectedSessionId) || null;
  }, [filteredSessions, selectedSessionId]);

  // Matching machine for the active session
  const activeSessionMachine = useMemo(() => {
    if (!activeSession) return null;
    return machines.find(m => m.id === activeSession.machineId) || null;
  }, [activeSession, machines]);

  // Chronologically previous session for report comparison
  const previousSession = useMemo(() => {
    if (!activeSession) return undefined;
    const sameMachineSessions = sessions
      .filter(s => s.machineId === activeSession.machineId && s.id !== activeSession.id)
      .sort((a, b) => {
        const timeA = new Date(`${a.startDate} ${a.startTime || '00:00'}`).getTime() || 0;
        const timeB = new Date(`${b.startDate} ${b.startTime || '00:00'}`).getTime() || 0;
        return timeB - timeA;
      });
    return sameMachineSessions[0];
  }, [activeSession, sessions]);

  // Metrics for header
  const totalCompletedCount = useMemo(() => {
    const list = activeMachineId ? sessions.filter(s => s.machineId === activeMachineId) : sessions;
    return list.filter(s => s.completionStatus === 'COMPLETED').length;
  }, [sessions, activeMachineId]);

  const totalSessionsCount = useMemo(() => {
    return activeMachineId ? sessions.filter(s => s.machineId === activeMachineId).length : sessions.length;
  }, [sessions, activeMachineId]);

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    setMobileViewMode('detail');
  };

  const handleOpenTargetSession = (sessionId: string) => {
    if (onOpenSession) {
      onOpenSession(sessionId);
    } else if (onOpenSmartWorkspace) {
      onOpenSmartWorkspace(sessionId);
    }
  };

  return (
    <div id="mhc-history-workspace" className="space-y-4 pb-12">
      {/* 1. Prominent Machine Identity Header */}
      <MhcHistoryHeader
        machines={machines}
        selectedMachineId={activeMachineId}
        onSelectMachineId={handleMachineSelect}
        onNavigate={onNavigate}
        totalSessionsCount={totalSessionsCount}
        completedSessionsCount={totalCompletedCount}
        isDark={isDark}
      />

      {/* 2. Quiet Search & Filter Toolbar */}
      <MhcHistoryToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortOrder={sortOrder}
        onToggleSortOrder={() => setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
        filteredCount={filteredSessions.length}
        totalCount={totalSessionsCount}
        isDark={isDark}
      />

      {/* 3. Main Workspace: Desktop Master-Detail & Responsive Layout */}
      {sessions.length === 0 ? (
        <div
          id="mhc-history-no-records"
          className={`p-12 text-center rounded-md border ${
            isDark ? 'bg-[#15181C] border-[#242930] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          <Inbox className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-200 dark:text-slate-100">
            No MHC Inspection Records Available
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            No historical or in-progress inspection records were found. You can launch a new Machine Health Check protocol from MHC Autopilot.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Master-Detail View (>= lg) */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-5 items-start">
            {/* Left Rail: Chronological List */}
            <div className="lg:col-span-4 xl:col-span-4 space-y-2 sticky top-4 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
              <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-mono text-slate-400 border-b border-white/5">
                <span>INSPECTION CHRONOLOGY</span>
                <span>{filteredSessions.length} RECORDS</span>
              </div>

              <MhcHistorySessionList
                sessions={filteredSessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={handleSelectSession}
                isDark={isDark}
              />
            </div>

            {/* Right Panel: Selected Inspection Detail Area */}
            <div className="lg:col-span-8 xl:col-span-8 min-w-0">
              {activeSession ? (
                <MhcHistoryDetailView
                  session={activeSession}
                  machine={activeSessionMachine}
                  previousSession={previousSession}
                  onOpenSession={handleOpenTargetSession}
                  onNavigate={onNavigate}
                  isDark={isDark}
                />
              ) : (
                <div
                  className={`p-12 text-center rounded-md border ${
                    isDark ? 'bg-[#15181C] border-[#242930] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <p className="text-xs font-mono text-slate-500">
                    Select an inspection record from the chronological log to inspect details.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile / Tablet Responsive View (< lg) */}
          <div className="lg:hidden">
            {mobileViewMode === 'detail' && activeSession ? (
              <MhcHistoryDetailView
                session={activeSession}
                machine={activeSessionMachine}
                previousSession={previousSession}
                onBackToList={() => setMobileViewMode('list')}
                onOpenSession={handleOpenTargetSession}
                onNavigate={onNavigate}
                isDark={isDark}
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-mono text-slate-400 border-b border-white/5">
                  <span>INSPECTION LOG</span>
                  <span>{filteredSessions.length} RECORDS</span>
                </div>

                <MhcHistorySessionList
                  sessions={filteredSessions}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={handleSelectSession}
                  isDark={isDark}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
