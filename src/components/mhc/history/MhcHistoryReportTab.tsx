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
      <div className={`p-3.5 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDark ? 'bg-[#15181C] border-[#242930]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-200 dark:text-slate-100">
              Authoritative Engineering MHC Inspection Document
            </h4>
            <p className="text-[11px] text-slate-500">
              Multi-page report generated using the official FSOS Report Engine (ISO/IEC compliance format).
            </p>
          </div>
        </div>

        {onOpenSession && (
          <button
            onClick={() => onOpenSession(session.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors cursor-pointer shrink-0 ${
              isDark 
                ? 'bg-[#1D2128] hover:bg-[#252A33] text-slate-200 border-[#2D3440]' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
            }`}
          >
            <span>Open in Autopilot (Activity 09)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Embedded Full PDF Renderer */}
      <div className={`rounded-md border overflow-hidden p-2 sm:p-4 ${
        isDark ? 'bg-[#0E1114] border-[#20252C]' : 'bg-slate-100 border-slate-200'
      }`}>
        <MhcFullPdfRenderer
          session={session}
          previousSession={previousSession}
          isDark={isDark}
        />
      </div>
    </div>
  );
};
