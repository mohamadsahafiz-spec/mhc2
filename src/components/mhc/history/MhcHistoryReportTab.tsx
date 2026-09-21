import React from 'react';
import { FileText, ArrowRight, ExternalLink } from 'lucide-react';
import { MHCSession } from '../../../types';
import { MhcFullPdfRenderer } from '../report/MhcFullPdfRenderer';

interface MhcHistoryReportTabProps {
  session: MHCSession;
  previousSession?: MHCSession;
  onOpenSession?: (sessionId: string) => void;
  isDark: boolean;
}

export const MhcHistoryReportTab: React.FC<MhcHistoryReportTabProps> = ({
  session,
  previousSession,
  onOpenSession,
  isDark
}) => {
  return (
    <div id="mhc-history-report-tab" className="space-y-4">
      {/* Top Action Bar */}
      <div className="p-3.5 rounded-card border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border-theme-default text-theme-primary shadow-theme-card">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-theme-muted" />
          <div>
            <h4 className="text-xs font-mono font-bold font-theme-heading text-theme-primary">
              Authoritative Engineering MHC Inspection Document
            </h4>
            <p className="text-[11px] text-theme-muted">
              Multi-page report generated using the official FSOS Report Engine (ISO/IEC compliance format).
            </p>
          </div>
        </div>

        {onOpenSession && (
          <button
            onClick={() => onOpenSession(session.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-mono font-medium border transition-colors cursor-pointer shrink-0 bg-canvas hover:bg-surface-hover text-theme-secondary hover:text-theme-primary border-theme-default shadow-2xs"
          >
            <span>Open in Autopilot (Activity 09)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Embedded Full PDF Renderer */}
      <div className="rounded-card border overflow-hidden p-2 sm:p-4 bg-canvas border-theme-default shadow-theme-card">
        <MhcFullPdfRenderer
          session={session}
          previousSession={previousSession}
          isDark={isDark}
        />
      </div>
    </div>
  );
};
