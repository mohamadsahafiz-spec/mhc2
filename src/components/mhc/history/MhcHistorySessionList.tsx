import React from 'react';
import { Calendar, User, Cpu, Building2, CheckCircle2, Clock, AlertTriangle, ChevronRight, Inbox } from 'lucide-react';
import { MHCSession, MHCHeadInspectionState } from '../../../types';

interface MhcHistorySessionListProps {
  sessions: MHCSession[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isDark: boolean;
}

export const MhcHistorySessionList: React.FC<MhcHistorySessionListProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  isDark
}) => {
  if (sessions.length === 0) {
    return (
      <div
        id="mhc-history-empty-list"
        className={`p-8 text-center rounded-md border ${
          isDark ? 'bg-[#15181C] border-[#242930] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        <Inbox className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold text-slate-200 dark:text-slate-100">
          No Inspection Records Match
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No service sessions match the selected search query or status filter. Try clearing filters to view all historical records.
        </p>
      </div>
    );
  }

  return (
    <div id="mhc-history-session-list" className="space-y-2">
      {sessions.map((session, index) => {
        const isSelected = session.id === selectedSessionId;
        const isCompleted = session.completionStatus === 'COMPLETED';

        // Extract honest summary metrics directly from existing session data
        const findingsCount: number = session.inspectionFindings
          ? (Object.values(session.inspectionFindings) as MHCHeadInspectionState[]).reduce((acc, h) => acc + (h.findings?.length || 0), 0)
          : 0;

        const partsCount = session.stage07_spareParts?.length || 0;
        const readinessScore = session.autopilotProgress?.readinessScore;

        return (
          <div
            key={session.id}
            id={`mhc-history-item-${session.id}`}
            onClick={() => onSelectSession(session.id)}
            className={`p-3.5 rounded-md border text-left cursor-pointer transition-all ${
              isSelected
                ? isDark
                  ? 'bg-[#1B2026] border-slate-500 shadow-xs ring-1 ring-slate-500/50'
                  : 'bg-slate-50 border-slate-400 shadow-xs ring-1 ring-slate-400/30'
                : isDark
                ? 'bg-[#15181C] border-[#242930] hover:border-slate-600 hover:bg-[#181C21]'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              {/* Session ID & Timestamp */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isDark ? 'bg-[#101215] text-slate-400 border-[#2A303A]' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    #{String(sessions.length - index).padStart(2, '0')}
                  </span>

                  <span className="text-xs font-mono font-bold tracking-tight text-slate-100 dark:text-slate-100">
                    {session.id}
                  </span>

                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    isCompleted
                      ? isDark
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isDark
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                  </span>
                </div>

                {/* Machine & Customer Details */}
                <div className="text-xs text-slate-300 font-medium truncate flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-slate-200 dark:text-slate-100">{session.machineModel}</span>
                  {session.machineSerialNumber && (
                    <span className="text-slate-400 font-mono text-[11px]">({session.machineSerialNumber})</span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{session.customerName}</span>
                    {session.plantName && <span>• {session.plantName}</span>}
                  </span>

                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{session.engineerName}</span>
                  </span>
                </div>
              </div>

              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                isSelected ? 'text-slate-200 transform translate-x-0.5' : 'text-slate-500'
              }`} />
            </div>

            {/* Bottom Info Bar: Date + Findings / Parts summary */}
            <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] font-mono ${
              isDark ? 'border-[#22272E] text-slate-400' : 'border-slate-100 text-slate-500'
            }`}>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{session.startDate} {session.startTime ? `• ${session.startTime}` : ''}</span>
              </div>

              <div className="flex items-center gap-2.5">
                {findingsCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{findingsCount} {findingsCount === 1 ? 'finding' : 'findings'}</span>
                  </span>
                )}
                {partsCount > 0 && (
                  <span className="text-slate-400">
                    {partsCount} parts
                  </span>
                )}
                {typeof readinessScore === 'number' && (
                  <span className="text-slate-400">
                    {readinessScore}% ready
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
