import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  FileSearch, 
  Camera, 
  Wrench, 
  FileText, 
  Award,
  AlertTriangle,
  PackageCheck
} from 'lucide-react';
import { MHCSession, Machine, MHCHeadInspectionState } from '../../../types';
import { MhcHistoryOverviewTab } from './MhcHistoryOverviewTab';
import { MhcHistoryFindingsTab } from './MhcHistoryFindingsTab';
import { MhcHistoryEvidenceTab } from './MhcHistoryEvidenceTab';
import { MhcHistoryRecommendationsTab } from './MhcHistoryRecommendationsTab';
import { MhcHistoryReportTab } from './MhcHistoryReportTab';
import { MhcHistoryBuyoffTab } from './MhcHistoryBuyoffTab';

export type HistoryDetailTabId = 'overview' | 'findings' | 'evidence' | 'recommendations' | 'report' | 'buyoff';

interface MhcHistoryDetailViewProps {
  session: MHCSession;
  machine?: Machine | null;
  previousSession?: MHCSession;
  onBackToList?: () => void;
  onOpenSession?: (sessionId: string) => void;
  onNavigate?: (tab: any) => void;
  isDark: boolean;
}

export const MhcHistoryDetailView: React.FC<MhcHistoryDetailViewProps> = ({
  session,
  machine,
  previousSession,
  onBackToList,
  onOpenSession,
  onNavigate,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<HistoryDetailTabId>('overview');

  // Count metrics to display in tab badges
  const findingsCount: number = session.inspectionFindings
    ? (Object.values(session.inspectionFindings) as MHCHeadInspectionState[]).reduce((acc, h) => acc + (h.findings?.length || 0), 0)
    : 0;

  const partsCount = session.stage07_spareParts?.length || 0;

  const tabs: { id: HistoryDetailTabId; label: string; icon: React.ElementType; badge?: number | string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'findings', label: 'Findings', icon: FileSearch, badge: findingsCount > 0 ? findingsCount : undefined },
    { id: 'evidence', label: 'Evidence', icon: Camera },
    { id: 'recommendations', label: 'Recommendations', icon: Wrench, badge: partsCount > 0 ? partsCount : undefined },
    { id: 'report', label: 'Report', icon: FileText },
    { id: 'buyoff', label: 'Buyoff', icon: Award }
  ];

  return (
    <div id="mhc-history-detail-view" className="space-y-4">
      {/* Mobile Back to List Button */}
      {onBackToList && (
        <div className="lg:hidden">
          <button
            onClick={onBackToList}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-mono font-medium border cursor-pointer bg-canvas border-theme-default text-theme-secondary hover:text-theme-primary shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Inspection Records</span>
          </button>
        </div>
      )}

      {/* Selected Session Header Strip */}
      <div className="p-4 rounded-card border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border-theme-default text-theme-primary shadow-theme-card">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-bold font-theme-heading text-theme-primary">
              {session.id}
            </span>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-badge border ${
              session.completionStatus === 'COMPLETED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {session.completionStatus}
            </span>
          </div>

          <div className="text-xs text-theme-muted flex items-center gap-3 flex-wrap font-mono">
            <span>{session.machineModel} ({session.machineSerialNumber || '—'})</span>
            <span>•</span>
            <span>{session.customerName}</span>
            <span>•</span>
            <span>{session.startDate}</span>
          </div>
        </div>

        {/* Compact Section Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 pt-2 sm:pt-0 shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                id={`tab-mhc-detail-${t.id}`}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-surface-active text-theme-primary border-cyan-500/40 ring-1 ring-cyan-500/30 shadow-2xs'
                    : 'text-theme-muted border-transparent hover:text-theme-primary hover:bg-surface-hover'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-theme-primary' : 'text-theme-muted'}`} />
                <span>{t.label}</span>
                {t.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-canvas text-theme-primary border border-cyan-500/30'
                      : 'bg-canvas text-theme-muted border border-theme-subtle'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Container with Subtle Motion */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'overview' && (
            <MhcHistoryOverviewTab
              session={session}
              machine={machine}
              onOpenSession={onOpenSession}
              onNavigate={onNavigate}
              isDark={isDark}
            />
          )}

          {activeTab === 'findings' && (
            <MhcHistoryFindingsTab
              session={session}
              isDark={isDark}
            />
          )}

          {activeTab === 'evidence' && (
            <MhcHistoryEvidenceTab
              session={session}
              isDark={isDark}
            />
          )}

          {activeTab === 'recommendations' && (
            <MhcHistoryRecommendationsTab
              session={session}
              isDark={isDark}
            />
          )}

          {activeTab === 'report' && (
            <MhcHistoryReportTab
              session={session}
              previousSession={previousSession}
              onOpenSession={onOpenSession}
              isDark={isDark}
            />
          )}

          {activeTab === 'buyoff' && (
            <MhcHistoryBuyoffTab
              session={session}
              onOpenSession={onOpenSession}
              isDark={isDark}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
