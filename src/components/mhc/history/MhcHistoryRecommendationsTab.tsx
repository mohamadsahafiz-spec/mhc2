import React from 'react';
import { Wrench, Calendar, ClipboardCheck, AlertCircle, PackageCheck, FileText } from 'lucide-react';
import { MHCSession } from '../../../types';

interface MhcHistoryRecommendationsTabProps {
  session: MHCSession;
  isDark: boolean;
}

export const MhcHistoryRecommendationsTab: React.FC<MhcHistoryRecommendationsTabProps> = ({
  session,
  isDark
}) => {
  const parts = session.stage07_spareParts || [];
  const remarks = session.stage08_engineerRemarks;

  const hasParts = parts.length > 0;
  const hasRemarks = !!remarks && (
    !!remarks.generalRemarks || 
    !!remarks.customerRemarks || 
    !!remarks.dispositionVerdict ||
    !!remarks.nextScheduledDate
  );

  const getActionBadge = (action?: string) => {
    switch (action?.toUpperCase()) {
      case 'REPLACE_IMMEDIATELY':
      case 'REPLACEMENT_REQUIRED':
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
            isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            REPLACE IMMEDIATELY
          </span>
        );
      case 'RECOMMEND_STOCK':
      case 'RECOMMENDED_REPLACEMENT':
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
            isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            RECOMMEND SPARE STOCK
          </span>
        );
      case 'MONITOR':
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
            isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            MONITOR CONDITION
          </span>
        );
      case 'GOOD_CONDITION':
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
            isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            GOOD CONDITION
          </span>
        );
      default:
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
            isDark ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {action || 'STANDARD'}
          </span>
        );
    }
  };

  if (!hasParts && !hasRemarks) {
    return (
      <div
        id="mhc-history-recommendations-empty"
        className="p-8 text-center rounded-card border bg-surface border-theme-default text-theme-muted"
      >
        <Wrench className="w-8 h-8 text-theme-muted mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold font-theme-heading text-theme-primary">
          No Recommendations Logged
        </h3>
        <p className="text-xs text-theme-muted mt-1 max-w-sm mx-auto">
          No spare parts replacements or technical maintenance recommendations were registered for this inspection.
        </p>
      </div>
    );
  }

  return (
    <div id="mhc-history-recommendations-tab" className="space-y-6">
      {/* Engineer Remarks & Disposition Card */}
      {hasRemarks && (
        <div className="p-4 rounded-card border space-y-4 bg-surface border-theme-default text-theme-primary shadow-theme-card">
          <div className="flex items-center justify-between border-b border-theme-subtle pb-2 text-xs font-mono font-bold text-theme-secondary uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-theme-muted" />
              <span>Engineering Evaluation &amp; Disposition (Stage 08)</span>
            </span>
            {remarks?.dispositionVerdict && (
              <span className={`px-2 py-0.5 rounded-badge text-[10px] font-semibold border ${
                remarks.dispositionVerdict === 'ACCEPTED' || remarks.dispositionVerdict === 'PASS'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                DISPOSITION: {remarks.dispositionVerdict}
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            {remarks?.generalRemarks && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-theme-muted uppercase block">
                  Lead Engineer Technical Observations:
                </span>
                <p className="text-theme-primary bg-black/20 p-3 rounded-card border border-white/5 whitespace-pre-wrap leading-relaxed">
                  {remarks.generalRemarks}
                </p>
              </div>
            )}

            {remarks?.customerRemarks && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-theme-muted uppercase block">
                  Customer Discussion &amp; Feedback:
                </span>
                <p className="text-theme-secondary bg-black/15 p-3 rounded-card border border-white/5 whitespace-pre-wrap leading-relaxed">
                  {remarks.customerRemarks}
                </p>
              </div>
            )}

            {remarks?.nextScheduledDate && (
              <div className="flex items-center gap-2 pt-1 text-theme-secondary font-mono">
                <Calendar className="w-3.5 h-3.5 text-theme-muted" />
                <span>Next Recommended Inspection Interval: </span>
                <strong className="text-theme-primary">{remarks.nextScheduledDate}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spare Parts Inventory Recommendations Card */}
      {hasParts && (
        <div className="p-4 rounded-card border space-y-3 bg-surface border-theme-default text-theme-primary shadow-theme-card">
          <div className="flex items-center justify-between border-b border-theme-subtle pb-2 text-xs font-mono font-bold text-theme-secondary uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-theme-muted" />
              <span>Recommended Spare Parts &amp; Consumables (Stage 07)</span>
            </span>
            <span className="text-[10px] font-mono text-theme-muted">
              {parts.length} item{parts.length === 1 ? '' : 's'} registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-theme-subtle text-[10px] font-mono text-theme-muted uppercase">
                  <th className="pb-2 font-medium">Part Code</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium text-center">Qty</th>
                  <th className="pb-2 font-medium">Wear Condition</th>
                  <th className="pb-2 font-medium text-right">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-subtle">
                {parts.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-surface-hover">
                    <td className="py-2.5 font-mono text-theme-primary font-semibold">{p.partNumber || '—'}</td>
                    <td className="py-2.5 text-theme-primary">{p.partName || p.description || '—'}</td>
                    <td className="py-2.5 text-center font-mono text-theme-primary">{p.quantity || 1}</td>
                    <td className="py-2.5 font-mono text-theme-muted">{p.wearCondition || '—'}</td>
                    <td className="py-2.5 text-right">{getActionBadge(p.action)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
