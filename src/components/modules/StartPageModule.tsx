import React from 'react';
import { 
  Play, 
  ArrowRight, 
  Calendar, 
  Clock, 
  Cpu, 
  Building2, 
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { 
  NavigationTab, 
  Machine, 
  ExecutionScheduleItem, 
  FieldEngineerTask, 
  AlertItem, 
  EngineerProfile, 
  MHCSession 
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { StorageService } from '../../utils/persistence';
import { findLatestResumableMhcSession, hasMeaningfulMhcProgress } from '../../utils/mhcAutopilotBrain';

interface StartPageModuleProps {
  onNavigate: (tab: NavigationTab) => void;
  schedule?: ExecutionScheduleItem[];
  machines?: Machine[];
  tasks?: FieldEngineerTask[];
  alerts?: AlertItem[];
  mhcSessions?: MHCSession[];
  onSelectMachine?: (id: string) => void;
  onContinueMhcSession?: (machineId: string) => void;
  profile?: EngineerProfile;
  unreadNotificationsCount?: number;
}

const ACTIVITY_TITLES: Record<string, string> = {
  '01': 'Laser & Power Inspection',
  '02': 'Stage Calibration & Accuracy',
  '03': 'Focus Optimization & Beam',
  '04': 'Auto Gap Control (AGC)',
  '05': 'Temperature & Thermal Evidence',
  '06': 'Product & Process Verification',
  '07': 'Recommendations & Spare Parts',
  '08': 'Readiness & Executive Review'
};

export const StartPageModule: React.FC<StartPageModuleProps> = ({
  onNavigate,
  schedule = [],
  machines = [],
  tasks = [],
  alerts = [],
  mhcSessions,
  onSelectMachine,
  onContinueMhcSession,
  profile,
  unreadNotificationsCount = 0
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // 1. Authoritative date handling
  const now = new Date();
  const currentHour = now.getHours();
  const greetingTimeOfDay = currentHour < 12 
    ? 'Good morning' 
    : currentHour < 18 
      ? 'Good afternoon' 
      : 'Good evening';
  
  const greetingName = profile?.name && profile.name.trim() !== '' ? profile.name : 'Engineer';
  const todayIsoDate = now.toISOString().split('T')[0];
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);

  // 2. Authoritative MHC session resolution
  const resolvedSessions = mhcSessions || StorageService.getMhcSessions(true);
  const resumable = findLatestResumableMhcSession(resolvedSessions, machines);
  const hasProgress = resumable ? hasMeaningfulMhcProgress(resumable.session) : false;

  // 3. Schedule filtering
  const todayScheduleItems = schedule.filter(
    (item) => item.scheduledDate === todayIsoDate || item.status === 'IN_PROGRESS'
  );

  const upcomingScheduleItems = schedule.filter(
    (item) => item.scheduledDate && item.scheduledDate > todayIsoDate
  ).sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));

  const primaryScheduleItem = todayScheduleItems[0];

  // 4. Attention filtering (Strictly real data only - no fake fallback)
  const overdueTasks = tasks.filter(
    (t) => !t.completed && (t.priority === 'URGENT' || (t.dueDate && t.dueDate < todayIsoDate))
  );
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  const hasAttentionItems = overdueTasks.length > 0 || criticalAlerts.length > 0;

  // Navigation / Action Handlers
  const handleResumeMhc = (machineId: string) => {
    if (onContinueMhcSession) {
      onContinueMhcSession(machineId);
    } else {
      if (onSelectMachine) onSelectMachine(machineId);
      onNavigate('mhc_autopilot');
    }
  };

  const handleStartNewMhc = () => {
    onNavigate('mhc_autopilot');
  };

  return (
    <div className="max-w-5xl mx-auto py-2 md:py-6 space-y-8 animate-in fade-in duration-200">
      
      {/* 1. DAILY WORK HEADER (Restrained, Personal Orientation) */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-theme-subtle pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-theme-primary">
            {greetingTimeOfDay}, {greetingName}
          </h1>
          <p className="text-xs text-theme-muted mt-0.5">
            {profile?.company ? `${profile.company}${profile.department ? ` • ${profile.department}` : ''}` : 'Field Service Operations'}
          </p>
        </div>

        <div className="text-xs font-mono text-theme-muted sm:text-right shrink-0">
          {formattedDate}
        </div>
      </div>

      {/* 2. CURRENT FOCUS (Primary Workspace Section) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-medium tracking-wider text-theme-muted uppercase">
            Current Focus
          </span>
          {resumable && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${
              hasProgress
                ? isDark 
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
                : isDark 
                  ? 'bg-slate-800 text-slate-300 border-slate-700' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {hasProgress ? 'In Progress' : 'Draft'}
            </span>
          )}
        </div>

        {/* State A: Meaningful Ongoing Inspection */}
        {resumable && hasProgress && (
          <div className={`p-5 md:p-6 rounded-xl border transition-colors ${
            isDark 
              ? 'bg-[#16191D] border-[#2B323A] text-slate-100' 
              : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 text-xs font-mono text-theme-muted">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span>SN: {resumable.machine.serialNumber}</span>
                  {resumable.machine.customerName && (
                    <>
                      <span>•</span>
                      <span>{resumable.machine.customerName}</span>
                    </>
                  )}
                  {resumable.machine.plantName && (
                    <>
                      <span>•</span>
                      <span>{resumable.machine.plantName}</span>
                    </>
                  )}
                </div>

                <h2 className="text-lg font-semibold tracking-tight text-theme-primary truncate">
                  {resumable.machine.machineNumber || resumable.machine.model} Health Check
                </h2>

                <div className="flex items-center gap-3 text-xs text-theme-muted flex-wrap">
                  {resumable.session.autopilotProgress?.currentActivityCode && (
                    <span className="font-mono">
                      Stage: {resumable.session.autopilotProgress.currentActivityCode} - {ACTIVITY_TITLES[resumable.session.autopilotProgress.currentActivityCode] || 'Inspection'}
                    </span>
                  )}
                  {typeof resumable.session.autopilotProgress?.readinessScore === 'number' && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{resumable.session.autopilotProgress.readinessScore}% Complete</span>
                    </>
                  )}
                  {resumable.session.lastUpdated && (
                    <>
                      <span>•</span>
                      <span className="font-mono">Updated {new Date(resumable.session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => handleResumeMhc(resumable.machine.id)}
                >
                  Continue Health Check
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* State B: Resumable Zero-Progress Draft */}
        {resumable && !hasProgress && (
          <div className={`p-5 md:p-6 rounded-xl border transition-colors ${
            isDark 
              ? 'bg-[#16191D] border-[#2B323A] text-slate-100' 
              : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-mono text-theme-muted">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span>SN: {resumable.machine.serialNumber}</span>
                  {resumable.machine.customerName && (
                    <>
                      <span>•</span>
                      <span>{resumable.machine.customerName}</span>
                    </>
                  )}
                </div>

                <h2 className="text-lg font-semibold tracking-tight text-theme-primary truncate">
                  {resumable.machine.machineNumber || resumable.machine.model} Health Check
                </h2>

                <p className="text-xs text-theme-muted">
                  Draft initialized • Ready to begin inspection workflow.
                </p>
              </div>

              <div className="shrink-0">
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Play className="w-4 h-4 fill-current" />}
                  onClick={() => handleResumeMhc(resumable.machine.id)}
                >
                  Open Health Check
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* State C: No Resumable Session, but Today's Schedule has an Item */}
        {!resumable && primaryScheduleItem && (
          <div className={`p-5 md:p-6 rounded-xl border transition-colors ${
            isDark 
              ? 'bg-[#16191D] border-[#2B323A] text-slate-100' 
              : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-mono text-theme-muted">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{primaryScheduleItem.scheduledDate || 'Today'}</span>
                  {primaryScheduleItem.customerName && (
                    <>
                      <span>•</span>
                      <span>{primaryScheduleItem.customerName}</span>
                    </>
                  )}
                  {primaryScheduleItem.plantName && (
                    <>
                      <span>•</span>
                      <span>{primaryScheduleItem.plantName}</span>
                    </>
                  )}
                </div>

                <h2 className="text-lg font-semibold tracking-tight text-theme-primary truncate">
                  {primaryScheduleItem.title}
                </h2>

                <div className="flex items-center gap-3 text-xs text-theme-muted">
                  {primaryScheduleItem.machineName && (
                    <span className="font-mono">{primaryScheduleItem.machineName}</span>
                  )}
                  {primaryScheduleItem.estimatedHours && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{primaryScheduleItem.estimatedHours}h estimated</span>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Play className="w-4 h-4 fill-current" />}
                  onClick={() => {
                    if (primaryScheduleItem.machineId && onSelectMachine) {
                      onSelectMachine(primaryScheduleItem.machineId);
                    }
                    onNavigate('mhc_autopilot');
                  }}
                >
                  Start Inspection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* State D: Truthful Empty State (Nothing ongoing or scheduled) */}
        {!resumable && !primaryScheduleItem && (
          <div className={`p-6 text-center rounded-xl border ${
            isDark 
              ? 'bg-[#16191D] border-[#2B323A] text-slate-300' 
              : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
          }`}>
            <p className="text-sm font-medium text-theme-primary">
              No active inspection or scheduled task in progress.
            </p>
            <p className="text-xs text-theme-muted mt-1 max-w-md mx-auto">
              Select a machine from the fleet to begin a new health check, or check the schedule for planned service.
            </p>
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                icon={<Play className="w-3.5 h-3.5 fill-current" />}
                onClick={handleStartNewMhc}
              >
                Start New Health Check
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* 3. NEEDS ATTENTION (Conditional - Only rendered when real items require action) */}
      {hasAttentionItems && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium tracking-wider text-theme-muted uppercase">
              Needs Attention
            </span>
            <span className="text-[10px] font-mono text-rose-500 font-medium">
              {overdueTasks.length + criticalAlerts.length} actionable
            </span>
          </div>

          <div className="space-y-2">
            {/* Critical Alerts */}
            {criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => {
                  if (alert.machineId && onSelectMachine) onSelectMachine(alert.machineId);
                  onNavigate('machines');
                }}
                className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isDark 
                    ? 'bg-[#181B1E] border-rose-900/40 hover:border-rose-700/60' 
                    : 'bg-rose-50/40 border-rose-200 hover:border-rose-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-theme-primary truncate">
                      {alert.message}
                    </p>
                    <p className="text-[11px] font-mono text-theme-muted truncate">
                      {alert.machineName} {alert.customerName ? `• ${alert.customerName}` : ''}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-theme-muted shrink-0" />
              </div>
            ))}

            {/* Overdue Tasks */}
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onNavigate('contracts')}
                className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isDark 
                    ? 'bg-[#181B1E] border-amber-900/40 hover:border-amber-700/60' 
                    : 'bg-amber-50/40 border-amber-200 hover:border-amber-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-theme-primary truncate">
                      {task.title}
                    </p>
                    <p className="text-[11px] font-mono text-theme-muted truncate">
                      {task.customerName} {task.machineName ? `• ${task.machineName}` : ''} {task.dueDate ? `• Due ${task.dueDate}` : ''}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-theme-muted shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. SCHEDULE (One Coherent Flow: Today & Upcoming) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-medium tracking-wider text-theme-muted uppercase">
            Schedule
          </span>
          <span className="text-xs font-mono text-theme-muted">
            {schedule.length} total entries
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Today Column */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <div className="flex items-center justify-between border-b border-theme-subtle pb-2">
              <span className="text-xs font-semibold text-theme-primary">
                Today
              </span>
              <span className="text-[11px] font-mono text-theme-muted">
                {todayScheduleItems.length} {todayScheduleItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="space-y-2">
              {todayScheduleItems.length === 0 ? (
                <p className="text-xs text-theme-muted py-4 text-center">
                  No tasks scheduled for today.
                </p>
              ) : (
                todayScheduleItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.machineId && onSelectMachine) {
                        onSelectMachine(item.machineId);
                        onNavigate('mhc_autopilot');
                      }
                    }}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      isDark 
                        ? 'bg-[#1B1F24] border-[#2B323A] hover:border-slate-600' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-theme-primary truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] font-mono text-theme-muted truncate mt-0.5">
                          {item.customerName} {item.machineName ? `• ${item.machineName}` : ''}
                        </p>
                      </div>
                      <Badge variant={item.status === 'IN_PROGRESS' ? 'amber' : 'gray'}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Column */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <div className="flex items-center justify-between border-b border-theme-subtle pb-2">
              <span className="text-xs font-semibold text-theme-primary">
                Upcoming
              </span>
              <span className="text-[11px] font-mono text-theme-muted">
                {upcomingScheduleItems.length} {upcomingScheduleItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="space-y-2">
              {upcomingScheduleItems.length === 0 ? (
                <p className="text-xs text-theme-muted py-4 text-center">
                  No upcoming tasks in the schedule.
                </p>
              ) : (
                upcomingScheduleItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.machineId && onSelectMachine) {
                        onSelectMachine(item.machineId);
                        onNavigate('machines');
                      }
                    }}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      isDark 
                        ? 'bg-[#1B1F24] border-[#2B323A] hover:border-slate-600' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-theme-muted">
                          {item.scheduledDate}
                        </div>
                        <p className="text-xs font-medium text-theme-primary truncate mt-0.5">
                          {item.title}
                        </p>
                        <p className="text-[11px] font-mono text-theme-muted truncate">
                          {item.customerName} {item.machineName ? `• ${item.machineName}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
