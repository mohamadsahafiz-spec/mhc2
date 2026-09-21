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
        className="p-8 text-center rounded-card border bg-surface border-theme-default text-theme-muted"
      >
        <Inbox className="w-8 h-8 text-theme-muted mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold font-theme-heading text-theme-primary">
          No Inspection Records Match
        </h3>
        <p className="text-xs text-theme-muted mt-1 max-w-sm mx-auto">
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
            className={`p-3.5 rounded-card border text-left cursor-pointer transition-all ${
              isSelected
                ? 'bg-surface-active border-cyan-500/40 text-theme-primary shadow-theme-card ring-1 ring-cyan-500/30'
                : 'bg-surface border-theme-default hover:border-theme-hover hover:bg-surface-hover text-theme-primary shadow-2xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              {/* Session ID & Timestamp */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-badge border bg-canvas text-theme-muted border-theme-default">
                    #{String(sessions.length - index).padStart(2, '0')}
                  </span>

                  <span className="text-xs font-mono font-bold tracking-tight text-theme-primary">
                    {session.id}
                  </span>

                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-badge border ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                  </span>
                </div>

                {/* Machine & Customer Details */}
                <div className="text-xs text-theme-secondary font-medium truncate flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-theme-muted shrink-0" />
                  <span className="text-theme-primary">{session.machineModel}</span>
                  {session.machineSerialNumber && (
                    <span className="text-theme-muted font-mono text-[11px]">({session.machineSerialNumber})</span>
                  )}
                </div>

                <div className="text-[11px] text-theme-muted flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-theme-muted shrink-0" />
                    <span>{session.customerName}</span>
                    {session.plantName && <span>• {session.plantName}</span>}
                  </span>

                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-theme-muted shrink-0" />
                    <span>{session.engineerName}</span>
                  </span>
                </div>
              </div>

              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                isSelected ? 'text-theme-primary transform translate-x-0.5' : 'text-theme-muted'
              }`} />
            </div>

            {/* Bottom Info Bar: Date + Findings / Parts summary */}
            <div className="mt-2.5 pt-2 border-t border-theme-subtle flex items-center justify-between text-[11px] font-mono text-theme-muted">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-theme-muted" />
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
                  <span className="text-theme-muted">
                    {partsCount} parts
                  </span>
                )}
                {typeof readinessScore === 'number' && (
                  <span className="text-theme-muted">
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
