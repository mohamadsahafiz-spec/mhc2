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
        className={`p-8 text-center rounded-md border ${
          isDark ? 'bg-[#15181C] border-[#242930] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        <Wrench className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
        <h3 className="text-sm font-semibold text-slate-200 dark:text-slate-100">
          No Recommendations Logged
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No spare parts replacements or technical maintenance recommendations were registered for this inspection.
        </p>
      </div>
    );
  }

  return (
    <div id="mhc-history-recommendations-tab" className="space-y-6">
      {/* Engineer Remarks & Disposition Card */}
      {hasRemarks && (
        <div className={`p-4 rounded-md border space-y-4 ${
          isDark ? 'bg-[#15181C] border-[#242930]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Engineering Evaluation &amp; Disposition (Stage 08)</span>
            </span>
            {remarks?.dispositionVerdict && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                remarks.dispositionVerdict === 'ACCEPTED' || remarks.dispositionVerdict === 'PASS'
                  ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                DISPOSITION: {remarks.dispositionVerdict}
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            {remarks?.generalRemarks && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">
                  Lead Engineer Technical Observations:
                </span>
                <p className="text-slate-200 bg-black/20 p-3 rounded border border-white/5 whitespace-pre-wrap leading-relaxed">
                  {remarks.generalRemarks}
                </p>
              </div>
            )}

            {remarks?.customerRemarks && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">
                  Customer Discussion &amp; Feedback:
                </span>
                <p className="text-slate-300 bg-black/15 p-3 rounded border border-white/5 whitespace-pre-wrap leading-relaxed">
                  {remarks.customerRemarks}
                </p>
              </div>
            )}

            {remarks?.nextScheduledDate && (
              <div className="flex items-center gap-2 pt-1 text-slate-300 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Next Recommended Inspection Interval: </span>
                <strong className="text-slate-100 dark:text-slate-100">{remarks.nextScheduledDate}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spare Parts Inventory Recommendations Card */}
      {hasParts && (
        <div className={`p-4 rounded-md border space-y-3 ${
          isDark ? 'bg-[#15181C] border-[#242930]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Recommended Spare Parts &amp; Consumables (Stage 07)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {parts.length} item{parts.length === 1 ? '' : 's'} registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`border-b text-[10px] font-mono text-slate-400 uppercase ${
                  isDark ? 'border-[#262C36]' : 'border-slate-200'
                }`}>
                  <th className="pb-2 font-medium">Part Code</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium text-center">Qty</th>
                  <th className="pb-2 font-medium">Wear Condition</th>
                  <th className="pb-2 font-medium text-right">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parts.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-white/2">
                    <td className="py-2.5 font-mono text-slate-300 font-semibold">{p.partNumber || '—'}</td>
                    <td className="py-2.5 text-slate-200">{p.partName || p.description || '—'}</td>
                    <td className="py-2.5 text-center font-mono text-slate-300">{p.quantity || 1}</td>
                    <td className="py-2.5 font-mono text-slate-400">{p.wearCondition || '—'}</td>
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
