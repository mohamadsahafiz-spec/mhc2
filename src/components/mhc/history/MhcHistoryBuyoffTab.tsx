import React from 'react';
import { CheckCircle2, Clock, FileCheck, ArrowRight, UserCheck, ShieldAlert, Award } from 'lucide-react';
import { MHCSession } from '../../../types';

interface MhcHistoryBuyoffTabProps {
  session: MHCSession;
  onOpenSession?: (sessionId: string) => void;
  isDark: boolean;
}

export const MhcHistoryBuyoffTab: React.FC<MhcHistoryBuyoffTabProps> = ({
  session,
  onOpenSession,
  isDark
}) => {
  const isCompleted = session.completionStatus === 'COMPLETED';
  const handoverNotes = session.autopilotProgress?.activityNotes?.['10'] || session.stage08_engineerRemarks?.customerRemarks;

  return (
    <div id="mhc-history-buyoff-tab" className="space-y-6">
      {/* Buyoff Status Banner */}
      <div className={`p-4 rounded-card border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isCompleted
          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
          : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
      }`}>
        <div className="flex items-start gap-3">
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}

          <div>
            <h4 className="text-sm font-mono font-bold tracking-tight">
              {isCompleted 
                ? 'CUSTOMER BUYOFF & HANDOVER COMPLETED' 
                : 'PENDING CUSTOMER BUYOFF & SIGN-OFF'}
            </h4>
            <p className="text-xs opacity-90 mt-0.5">
              {isCompleted
                ? `Official handover confirmed on ${session.completedDate || session.startDate}. All inspection deliverables accepted by client.`
                : 'This session has not completed final customer acceptance sign-off.'}
            </p>
          </div>
        </div>

        {!isCompleted && onOpenSession && (
          <button
            onClick={() => onOpenSession(session.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-button text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer shrink-0 transition-colors"
          >
            <span>Proceed to Buyoff (Activity 10)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Signatures & Acceptance Audit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field Engineer Signoff */}
        <div className="p-4 rounded-card border space-y-3 bg-surface border-theme-default text-theme-primary shadow-theme-card">
          <div className="flex items-center gap-2 border-b border-theme-subtle pb-2 text-xs font-mono font-bold text-theme-secondary uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-theme-muted" />
            <span>Field Service Engineer Sign-Off</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-mono text-theme-muted uppercase block">Certified Engineer:</span>
              <span className="font-semibold text-theme-primary">
                {session.engineerName || 'Field Engineer'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-theme-muted uppercase block">Certification Date:</span>
              <span className="font-mono text-theme-secondary">
                {session.completedDate || session.startDate}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-theme-muted uppercase block">Execution Verification:</span>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified &amp; Calibrated per Standard SOP
              </span>
            </div>
          </div>
        </div>

        {/* Customer Buyoff Signoff */}
        <div className="p-4 rounded-card border space-y-3 bg-surface border-theme-default text-theme-primary shadow-theme-card">
          <div className="flex items-center gap-2 border-b border-theme-subtle pb-2 text-xs font-mono font-bold text-theme-secondary uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-theme-muted" />
            <span>Customer Acceptance &amp; Handover</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-mono text-theme-muted uppercase block">Client Representative:</span>
              <span className="font-semibold text-theme-primary">
                {session.customerName} Facility Lead
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-theme-muted uppercase block">Acceptance Status:</span>
              <span className={`font-mono text-[11px] font-semibold ${
                isCompleted ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {isCompleted ? 'BUYOFF ACCEPTED & SIGNED' : 'PENDING CLIENT SIGNOFF'}
              </span>
            </div>

            {session.completedDate && (
              <div>
                <span className="text-[10px] font-mono text-theme-muted uppercase block">Signed Date:</span>
                <span className="font-mono text-theme-secondary">{session.completedDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Handover Remarks & Acceptance Notes */}
      {handoverNotes && (
        <div className="p-4 rounded-card border space-y-2 bg-surface border-theme-default text-theme-primary shadow-theme-card">
          <div className="flex items-center gap-2 border-b border-theme-subtle pb-2 text-xs font-mono font-bold text-theme-secondary uppercase tracking-wider">
            <FileCheck className="w-3.5 h-3.5 text-theme-muted" />
            <span>Customer Handover &amp; Acceptance Remarks</span>
          </div>

          <p className="text-xs text-theme-primary bg-black/20 p-3 rounded-card border border-white/5 whitespace-pre-wrap leading-relaxed">
            {handoverNotes}
          </p>
        </div>
      )}
    </div>
  );
};
