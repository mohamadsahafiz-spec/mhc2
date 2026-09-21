import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ArrowRight, 
  User, 
  Building2, 
  Cpu, 
  Calendar, 
  ShieldCheck,
  Zap,
  Activity,
  Check
} from 'lucide-react';
import { MHCSession, Machine } from '../../../types';

interface MhcHistoryOverviewTabProps {
  session: MHCSession;
  machine?: Machine | null;
  onOpenSession?: (sessionId: string) => void;
  onNavigate?: (tab: any) => void;
  isDark: boolean;
}

export const MhcHistoryOverviewTab: React.FC<MhcHistoryOverviewTabProps> = ({
  session,
  machine,
  onOpenSession,
  onNavigate,
  isDark
}) => {
  const isCompleted = session.completionStatus === 'COMPLETED';

  // Section audit matrix based on authoritative data
  const activities = [
    { code: '01', title: 'Laser Operating Hours', stage: session.stage01_laserHours?.length > 0 },
    { code: '02', title: 'Laser Beam Profile', stage: !!session.stage02_laserProfile?.mode },
    { code: '03', title: 'Laser Power Output Check', stage: session.stage03_laserPower?.length > 0 },
    { code: '04', title: 'Optics & Beam Path Alignment', stage: !!session.stage04_opticsBeam?.status },
    { code: '05', title: 'Cooling & Temperature Evidence', stage: !!session.temperatureEvidenceData || !!session.stage05_cooling?.chillerTemp },
    { code: '06', title: 'Product & Process Evaluation', stage: !!session.productProcessRecord || !!session.stage06_productQuality?.status },
    { code: '07', title: 'Spare Parts & Maintenance Recs', stage: session.stage07_spareParts?.length > 0 },
    { code: '08', title: 'Engineer Remarks & Readiness Review', stage: !!session.stage08_engineerRemarks?.generalRemarks },
    { code: '09', title: 'Official PDF Report Generation', stage: isCompleted || session.autopilotProgress?.completedActivities?.includes('09') },
    { code: '10', title: 'Final Buyoff & Acceptance Signoff', stage: isCompleted }
  ];

  return (
    <div id="mhc-history-overview-tab" className="space-y-6">
      {/* Top Banner with Actions */}
      <div className="p-4 rounded-card border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border-theme-default text-theme-primary shadow-theme-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-theme-primary">
              {session.id}
            </span>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-badge border ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {isCompleted ? 'INSPECTION COMPLETED' : 'INSPECTION IN PROGRESS'}
            </span>
          </div>
          <p className="text-xs text-theme-muted">
            {isCompleted 
              ? `Finalized and signed off on ${session.completedDate || session.startDate}. All audit baselines recorded.`
              : `Active session started on ${session.startDate} (${session.startTime}). Currently in progress.`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenSession && (
            <button
              id="btn-mhc-open-autopilot"
              onClick={() => onOpenSession(session.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-mono font-semibold transition-colors cursor-pointer ${
                isCompleted
                  ? 'bg-canvas hover:bg-surface-hover text-theme-primary border border-theme-default shadow-2xs'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
              }`}
            >
              <span>{isCompleted ? 'View in Autopilot' : 'Resume in Autopilot'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {machine && onNavigate && (
            <button
              onClick={() => onNavigate('machines')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-button text-xs font-mono border transition-colors cursor-pointer bg-canvas hover:bg-surface-hover text-theme-secondary hover:text-theme-primary border-theme-default shadow-2xs"
              title="Open Machine Passport"
            >
              <Cpu className="w-3.5 h-3.5 text-theme-muted" />
              <span className="hidden md:inline">Passport</span>
              <ExternalLink className="w-3 h-3 text-theme-muted" />
            </button>
          )}
        </div>
      </div>

      {/* Two Column Grid: Machine Context & Lifecycle Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Machine & Site Context Card */}
        <div className="p-4 rounded-card border space-y-3 bg-surface border-theme-default text-theme-primary shadow-theme-card">
          <div className="flex items-center gap-2 border-b border-theme-subtle pb-2.5 text-xs font-mono font-bold text-theme-secondary uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-theme-muted" />
            <span>Equipment Identity &amp; Location</span>
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 text-xs">
            <div>
              <span className="text-[11px] font-mono text-theme-muted block">MACHINE MODEL</span>
              <span className="font-semibold text-theme-primary">{session.machineModel}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-theme-muted block">SERIAL NUMBER</span>
              <span className="font-mono text-theme-primary">{session.machineSerialNumber || '—'}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-theme-muted block">CUSTOMER</span>
              <span className="text-theme-secondary">{session.customerName}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-theme-muted block">PLANT / FACILITY</span>
              <span className="text-theme-secondary">{session.plantName || '—'}</span>
            </div>
            {session.productionLineName && (
              <div>
                <span className="text-[11px] font-mono text-theme-muted block">PRODUCTION LINE</span>
                <span className="text-theme-secondary">{session.productionLineName}</span>
              </div>
            )}
            {session.zone && (
              <div>
                <span className="text-[11px] font-mono text-theme-muted block">ZONE</span>
                <span className="text-theme-secondary">{session.zone}</span>
              </div>
            )}
            {machine?.installationDate && (
              <div>
                <span className="text-[11px] font-mono text-theme-muted block">COMMISSIONING DATE</span>
                <span className="font-mono text-theme-secondary">{machine.installationDate}</span>
              </div>
            )}
            {machine?.healthScore !== undefined && (
              <div>
                <span className="text-[11px] font-mono text-theme-muted block">PASSPORT HEALTH SCORE</span>
                <span className="font-mono text-theme-primary font-semibold">{machine.healthScore}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Inspection Lifecycle Card */}
        <div className="p-4 rounded-card border space-y-3 bg-surface border-theme-default text-theme-primary shadow-theme-card">
          <div className="flex items-center gap-2 border-b border-theme-subtle pb-2.5 text-xs font-mono font-bold text-theme-secondary uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-theme-muted" />
            <span>Inspection Lifecycle &amp; Personnel</span>
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 text-xs">
            <div>
              <span className="text-[11px] font-mono text-theme-muted block">FIELD SERVICE ENGINEER</span>
              <span className="font-semibold text-theme-primary flex items-center gap-1">
                <User className="w-3 h-3 text-theme-muted" />
                {session.engineerName || 'Field Engineer'}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-theme-muted block">CURRENT STATUS</span>
              <span className="font-mono font-medium text-theme-secondary">{session.completionStatus}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-theme-muted block">START DATE &amp; TIME</span>
              <span className="font-mono text-theme-secondary">{session.startDate} {session.startTime ? `(${session.startTime})` : ''}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-theme-muted block">COMPLETED DATE</span>
              <span className="font-mono text-theme-secondary">{session.completedDate || 'Pending Final Buyoff'}</span>
            </div>
            {session.lastUpdated && (
              <div className="col-span-2">
                <span className="text-[11px] font-mono text-theme-muted block">LAST RECORD UPDATE</span>
                <span className="font-mono text-theme-muted text-[11px]">{new Date(session.lastUpdated).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Laser Hours Telemetry Record (if available) */}
      {session.stage01_laserHours && session.stage01_laserHours.length > 0 && (
        <div className="p-4 rounded-card border space-y-3 bg-surface border-theme-default text-theme-primary shadow-theme-card">
          <div className="flex items-center justify-between border-b border-theme-subtle pb-2 text-xs font-mono font-bold text-theme-secondary uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-theme-muted" />
              <span>Laser Source Hours Telemetry (Stage 01)</span>
            </span>
            <span className="text-[10px] text-theme-muted font-normal">Audited Values</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {session.stage01_laserHours.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-card border bg-canvas border-theme-subtle"
              >
                <span className="text-[10px] font-mono text-theme-muted block uppercase">
                  {item.headName || `Laser Head ${idx + 1}`}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-mono font-bold text-theme-primary">
                    {typeof item.laserHours === 'number' ? item.laserHours.toLocaleString() : '0'}
                  </span>
                  <span className="text-xs font-mono text-theme-muted">hours</span>
                </div>
                {item.serialNumber && (
                  <span className="text-[10px] font-mono text-theme-muted block mt-1">
                    S/N: {item.serialNumber}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Execution Audit Matrix */}
      <div className="p-4 rounded-card border space-y-3 bg-surface border-theme-default text-theme-primary shadow-theme-card">
        <div className="flex items-center justify-between border-b border-theme-subtle pb-2 text-xs font-mono font-bold text-theme-secondary uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-theme-muted" />
            <span>Inspection Protocol Execution Matrix</span>
          </span>
          <span className="text-[10px] text-theme-muted font-normal">10 Verification Activities</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {activities.map((act) => (
            <div
              key={act.code}
              className={`p-2.5 rounded-card border flex items-center justify-between text-xs font-mono ${
                act.stage
                  ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-300'
                  : 'bg-canvas border-theme-subtle text-theme-muted'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-[11px] opacity-75">{act.code}</span>
                <span className="truncate">{act.title}</span>
              </div>

              {act.stage ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 shrink-0">
                  <Check className="w-3 h-3" />
                  <span>RECORDED</span>
                </span>
              ) : (
                <span className="text-[10px] text-theme-muted shrink-0">
                  PENDING
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
