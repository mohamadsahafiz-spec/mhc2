import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Cpu, 
  Activity, 
  CalendarDays, 
  FileBarChart, 
  CheckCircle2, 
  ArrowRight,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Award,
  Layers,
  Circle,
  Check
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';

interface WorkflowGuideModuleProps {
  onNavigate: (tab: NavigationTab) => void;
}

export interface WorkflowStep {
  stepNumber: number;
  id: string;
  anchorId: string;
  shortLabel: string;
  title: string;
  icon: React.ReactNode;
  purpose: string;
  whatToDo: string[];
  expectedOutcome: string;
  navTab: NavigationTab;
  navLabel: string;
  badgeColor: string;
}

interface WorkflowNavigatorProps {
  steps: WorkflowStep[];
  activeStepIndex: number;
  onSelectStep: (anchorId: string, index: number) => void;
  isDark: boolean;
}

/**
 * Workflow Navigator Component
 * Serves as the navigation column of the Workflow Guide document,
 * enabling engineers to see current progress, completed steps, next steps, and jump directly to any step.
 */
export const WorkflowNavigator: React.FC<WorkflowNavigatorProps> = ({
  steps,
  activeStepIndex,
  onSelectStep,
  isDark,
}) => {
  const progressPercent = Math.round(((activeStepIndex + 1) / steps.length) * 100);

  return (
    <div className={`p-3.5 md:p-4 rounded-2xl border transition-all ${
      isDark 
        ? 'bg-[#16191D] border-[#282F37] text-slate-200' 
        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Navigator Header */}
      <div className="pb-3 border-b border-slate-200/80 dark:border-[#282F37] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#8B9DFF]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Mission Companion
            </span>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
            isDark ? 'bg-[#8B9DFF]/10 text-[#8B9DFF] border-[#8B9DFF]/25' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            {progressPercent}% Complete
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
            Step <strong className="font-bold text-[#8B9DFF]">{activeStepIndex + 1}</strong> of {steps.length}
          </span>
          <span className="text-[11px] text-slate-400 font-medium truncate max-w-[110px]">
            {steps[activeStepIndex]?.shortLabel}
          </span>
        </div>

        {/* Sleek Progress Bar */}
        <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-[#20252B]' : 'bg-slate-200/80'}`}>
          <div 
            className="h-full bg-gradient-to-r from-[#8B9DFF] to-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps Navigation List */}
      <div className="pt-2.5 space-y-1">
        {steps.map((step, idx) => {
          const isCompleted = idx < activeStepIndex;
          const isActive = idx === activeStepIndex;

          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.anchorId, idx)}
              className={`w-full text-left pl-2.5 pr-2 py-2 rounded-xl transition-all duration-150 flex items-center justify-between group relative border-l-2 ${
                isActive
                  ? isDark
                    ? 'border-l-[#8B9DFF] bg-[#20252B] text-white shadow-2xs'
                    : 'border-l-indigo-600 bg-white text-indigo-950 shadow-2xs border-slate-200/60'
                  : isCompleted
                    ? isDark
                      ? 'border-l-emerald-500/50 hover:bg-[#1F242A] border-y-transparent border-r-transparent text-slate-300'
                      : 'border-l-emerald-500/60 hover:bg-slate-100/80 border-y-transparent border-r-transparent text-slate-800'
                    : isDark
                      ? 'border-l-transparent hover:bg-[#1F242A] text-slate-400'
                      : 'border-l-transparent hover:bg-slate-100/60 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Status Indicator Icon */}
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-mono font-bold transition-transform group-hover:scale-105 ${
                  isCompleted
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : isActive
                      ? isDark
                        ? 'bg-[#8B9DFF] text-slate-950 font-extrabold'
                        : 'bg-indigo-600 text-white font-extrabold'
                      : isDark
                        ? 'bg-[#20252B] text-slate-400 border border-[#2B323A]'
                        : 'bg-slate-200/70 text-slate-600 border border-slate-300/60'
                }`}>
                  {isCompleted ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : (
                    <span>{step.stepNumber}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-bold ${
                      isActive 
                        ? isDark ? 'text-[#8B9DFF]' : 'text-indigo-600'
                        : isCompleted
                          ? 'text-emerald-500'
                          : 'text-slate-400'
                    }`}>
                      0{step.stepNumber}
                    </span>
                    <span className={`text-xs font-bold truncate ${
                      isActive 
                        ? isDark ? 'text-white' : 'text-slate-900'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {step.shortLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="shrink-0 pl-1">
                {isCompleted ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-500">
                    ✓
                  </span>
                ) : isActive ? (
                  <span className={`text-[10px] font-mono font-bold ${
                    isDark ? 'text-[#8B9DFF]' : 'text-indigo-600'
                  }`}>
                    ►
                  </span>
                ) : (
                  <Circle className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className={`mt-3 pt-2.5 border-t text-[10px] font-mono flex items-center justify-between ${
        isDark ? 'border-[#282F37] text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live SOP Sync
        </span>
        <span>FSOS v0.7.1</span>
      </div>
    </div>
  );
};

export const WorkflowGuideModule: React.FC<WorkflowGuideModuleProps> = ({ onNavigate }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const steps: WorkflowStep[] = [
    {
      stepNumber: 1,
      id: 'start_mission',
      anchorId: 'mission',
      shortLabel: 'Mission',
      title: "Start Today's Mission",
      icon: <Play className="w-5 h-5 fill-current" />,
      purpose: "Initiate daily on-site service operations and review scheduled directives.",
      whatToDo: [
        "Open Mission Control to verify today's assigned customer site and target machine.",
        "Review cleanroom access protocols and required personal protective equipment (PPE).",
        "Confirm field engineer dispatch status and on-site clock-in time.",
        "Inspect active work order tasks and high-priority machine alerts."
      ],
      expectedOutcome: "Field engineer is dispatched and actively executing directives on the target machine.",
      navTab: 'mission_control',
      navLabel: 'Open Mission Control',
      badgeColor: 'text-[#8B9DFF] bg-[#8B9DFF]/15 border-[#8B9DFF]/30'
    },
    {
      stepNumber: 2,
      id: 'machine_passport',
      anchorId: 'passport',
      shortLabel: 'Passport',
      title: "Machine Passport",
      icon: <Cpu className="w-5 h-5" />,
      purpose: "Inspect machine specifications, laser hardware configuration, and historical service logs.",
      whatToDo: [
        "Search and open the target machine's passport using serial number or plant location.",
        "Verify laser source wattage, galvo head remaining operating hours, and optical baseline.",
        "Review past maintenance records and previous field engineer intervention notes.",
        "Confirm active SLA contract tier and component warranty status."
      ],
      expectedOutcome: "Machine identity, hardware configuration, and baseline history are fully verified.",
      navTab: 'machines',
      navLabel: 'Open Machine Passport',
      badgeColor: 'text-[#8ECDF7] bg-[#8ECDF7]/15 border-[#8ECDF7]/30'
    },
    {
      stepNumber: 3,
      id: 'machine_health_check',
      anchorId: 'mhc',
      shortLabel: 'MHC',
      title: "Machine Health Check (MHC)",
      icon: <Activity className="w-5 h-5" />,
      purpose: "Perform standardized diagnostic testing to measure optical power, beam drift, and cooling status.",
      whatToDo: [
        "Run optical power sampling across low, mid, and high laser power settings.",
        "Record galvo scanner head temperature, chiller DI water pressure, and flow rates.",
        "Measure beam pointing stability and spot size deviation against baseline limits.",
        "Submit pass/fail health score and capture digital diagnostic verification."
      ],
      expectedOutcome: "Completed Machine Health Check audit with verified diagnostic performance scores.",
      navTab: 'mhc',
      navLabel: 'Open Machine Health Check',
      badgeColor: 'text-[#7FD4A6] bg-[#7FD4A6]/15 border-[#7FD4A6]/30'
    },
    {
      stepNumber: 4,
      id: 'execution_planner',
      anchorId: 'planner',
      shortLabel: 'Planner',
      title: "Execution Planner",
      icon: <CalendarDays className="w-5 h-5" />,
      purpose: "Schedule required preventative maintenance, filter swaps, and future service dispatches.",
      whatToDo: [
        "Mark completed checklist items and record consumed spare parts inventory.",
        "Schedule upcoming SLA maintenance cycles and optical recalibration milestones.",
        "Assign field engineer hours and coordinate access windows with plant managers.",
        "Log follow-up work orders if component degradation is detected."
      ],
      expectedOutcome: "Updated execution calendar with scheduled follow-up dispatches and spare parts tracking.",
      navTab: 'planner',
      navLabel: 'Open Planner',
      badgeColor: 'text-[#EFCB7A] bg-[#EFCB7A]/15 border-[#EFCB7A]/30'
    },
    {
      stepNumber: 5,
      id: 'generate_report',
      anchorId: 'report',
      shortLabel: 'Report',
      title: "Generate Report",
      icon: <FileBarChart className="w-5 h-5" />,
      purpose: "Compile audit findings, MHC metrics, and SLA compliance records into executive reports.",
      whatToDo: [
        "Review auto-generated field service audit report for technical accuracy.",
        "Verify baseline drift trend graphs and customer sign-off details.",
        "Export official engineering PDF report for plant manager archive.",
        "Deliver completion summary to customer technical contacts."
      ],
      expectedOutcome: "Signed executive engineering report archived in the system and delivered to the customer.",
      navTab: 'reports',
      navLabel: 'Open Reports',
      badgeColor: 'text-[#E98A8A] bg-[#E98A8A]/15 border-[#E98A8A]/30'
    },
    {
      stepNumber: 6,
      id: 'mission_complete',
      anchorId: 'complete',
      shortLabel: 'Complete',
      title: "Mission Complete",
      icon: <CheckCircle2 className="w-5 h-5" />,
      purpose: "Close active work order, release target machine back to production, and log final trace.",
      whatToDo: [
        "Confirm machine cleanroom handover and production clearance status.",
        "Sign off work order completion in Mission Control.",
        "Sync operational trace with central FSOS ledger.",
        "Return unused equipment and update engineer status to available for dispatch."
      ],
      expectedOutcome: "Work order officially closed and machine cleared for continuous manufacturing.",
      navTab: 'start_page',
      navLabel: 'Return to Start Page',
      badgeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
    }
  ];

  const isManualScrollingRef = useRef(false);
  const manualScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sopScrollContainerRef = useRef<HTMLDivElement>(null);

  // Automatic Active Step Tracking listening directly to the SOP Timeline scroll container
  useEffect(() => {
    const container = sopScrollContainerRef.current;
    if (!container) return;

    const calculateActiveStep = () => {
      if (isManualScrollingRef.current) return;

      const containerRect = container.getBoundingClientRect();
      const targetY = containerRect.top + 140;

      let foundIndex = 0;
      for (let i = 0; i < steps.length; i++) {
        const el = document.getElementById(steps[i].anchorId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.bottom > targetY) {
            foundIndex = i;
            break;
          }
          foundIndex = i;
        }
      }

      setActiveStepIndex(foundIndex);
    };

    calculateActiveStep();

    const handleScroll = () => {
      calculateActiveStep();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (manualScrollTimerRef.current) {
        clearTimeout(manualScrollTimerRef.current);
      }
    };
  }, [steps]);

  // Click-to-scroll navigation handler
  const scrollToStep = (anchorId: string, idx: number) => {
    setActiveStepIndex(idx);
    
    isManualScrollingRef.current = true;
    if (manualScrollTimerRef.current) {
      clearTimeout(manualScrollTimerRef.current);
    }

    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    manualScrollTimerRef.current = setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 800);
  };

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col h-full overflow-hidden space-y-4">
      
      {/* Page Header */}
      <div className={`p-5 md:p-6 rounded-3xl border shrink-0 transition-all ${
        isDark 
          ? 'bg-[#1A1D21] border-[#2B323A]/80 text-[#F3F4F6]' 
          : 'bg-white border-slate-200/80 text-slate-900 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                isDark 
                  ? 'bg-[#8B9DFF]/15 text-[#8B9DFF] border-[#8B9DFF]/30' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                STANDARD OPERATING PROCEDURE (SOP)
              </span>
              <span className="text-xs font-mono text-slate-400">FSOS Field Guide v0.7.1</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-[#8B9DFF]" />
              Workflow Guide
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              The end-to-end operational roadmap for Field Service Engineers — integrated with the ambient Mission Companion.
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border text-center shrink-0 ${
            isDark ? 'bg-[#20252B] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">TOTAL STEPS</span>
            <span className="text-xl font-bold text-[#8B9DFF] font-mono">6 Phase SOP</span>
          </div>
        </div>
      </div>

      {/* 2-Column Integrated Document Architecture: Left Mission Companion Navigation Workspace Column & Right Scrollable SOP Timeline Container */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-5 items-start overflow-hidden">
        
        {/* Left Column — Mission Companion Navigation Workspace Column (Stationary inside the workspace) */}
        <div className="w-full lg:w-64 lg:shrink-0">
          <WorkflowNavigator
            steps={steps}
            activeStepIndex={activeStepIndex}
            onSelectStep={scrollToStep}
            isDark={isDark}
          />
        </div>

        {/* Right Column — Scrollable SOP Timeline Reading Surface Container */}
        <div ref={sopScrollContainerRef} className="flex-1 min-w-0 h-full overflow-y-auto pr-2 pb-6 space-y-6 scroll-smooth">
          <div className="flex items-center justify-between px-1">
            <h2 className={`text-xs font-mono uppercase tracking-wider font-semibold ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Standard Operating Procedure Timeline
            </h2>
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live SOP Scroll Sync
            </span>
          </div>

        <div className="relative pl-4 md:pl-8 space-y-8 before:absolute before:left-3 md:before:left-7 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-300 dark:before:bg-[#2B323A]">
          {steps.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            const isCompleted = idx < activeStepIndex;

            return (
              <div 
                id={step.anchorId}
                key={step.id} 
                className="scroll-mt-20 relative transition-all"
              >
                {/* Timeline Dot Icon */}
                <div className={`absolute -left-4 md:-left-8 top-1 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                    : isActive 
                      ? isDark
                        ? 'bg-[#8B9DFF] border-[#8B9DFF] text-slate-950 shadow-md ring-4 ring-[#8B9DFF]/20 scale-110' 
                        : 'bg-indigo-600 border-indigo-600 text-white shadow-md ring-4 ring-indigo-200 scale-110'
                      : 'bg-white dark:bg-[#1A1D21] border-slate-300 dark:border-[#2B323A] text-slate-500 dark:text-slate-400'
                }`}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span className="text-xs font-bold font-mono">{step.stepNumber}</span>
                  )}
                </div>

                {/* Step Card */}
                <div className={`p-6 md:p-7 rounded-2xl border transition-all duration-200 ${
                  isActive
                    ? isDark 
                      ? 'bg-[#20252B] border-[#8B9DFF]/60 shadow-lg text-[#F3F4F6] ring-1 ring-[#8B9DFF]/30' 
                      : 'bg-white border-indigo-400 shadow-md text-slate-900 ring-2 ring-indigo-500/20'
                    : isCompleted
                      ? isDark
                        ? 'bg-[#181B1F] border-[#2B323A] text-slate-200'
                        : 'bg-slate-50/90 border-slate-200 text-slate-900'
                      : isDark
                        ? 'bg-[#1A1D21]/90 border-[#2B323A]/70 text-slate-300 hover:border-[#2B323A]'
                        : 'bg-white border-slate-300/80 text-slate-900 hover:border-slate-400 shadow-2xs'
                }`}>
                  {/* Step Title & Purpose */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                    isDark ? 'border-[#2B323A]/60' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${step.badgeColor}`}>
                        {step.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            STEP 0{step.stepNumber} • #{step.anchorId}
                          </span>
                        </div>
                        <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {step.title}
                        </h3>
                      </div>
                    </div>

                    {/* Quick Navigation Action Button */}
                    <Button
                      variant={isActive ? 'primary' : 'secondary'}
                      size="sm"
                      icon={<ChevronRight className="w-4 h-4" />}
                      onClick={() => onNavigate(step.navTab)}
                      className="shrink-0 self-start sm:self-center font-semibold"
                    >
                      {step.navLabel}
                    </Button>
                  </div>

                  {/* Purpose */}
                  <div className="py-3">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block mb-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      PURPOSE
                    </span>
                    <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                      {step.purpose}
                    </p>
                  </div>

                  {/* What To Do */}
                  <div className="py-2">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block mb-2 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      WHAT TO DO
                    </span>
                    <ul className="space-y-2">
                      {step.whatToDo.map((item, bIdx) => (
                        <li key={bIdx} className={`text-xs flex items-start gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${isDark ? 'bg-[#8B9DFF]' : 'bg-indigo-600'}`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expected Outcome */}
                  <div className={`mt-4 pt-3 p-3 rounded-xl border ${
                    isDark 
                      ? 'border-[#2B323A]/40 bg-[#1A1D21]/60' 
                      : 'border-emerald-200/80 bg-emerald-50/60'
                  }`}>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block mb-0.5 flex items-center gap-1 ${
                      isDark ? 'text-[#7FD4A6]' : 'text-emerald-800 font-bold'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      EXPECTED OUTCOME
                    </span>
                    <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {step.expectedOutcome}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion State Banner */}
        <div className={`p-8 md:p-10 rounded-3xl border transition-all text-center space-y-4 ${
          isDark 
            ? 'bg-gradient-to-b from-[#1F2922] to-[#151C17] border-[#7FD4A6]/40 text-[#F3F4F6] shadow-xl' 
            : 'bg-gradient-to-b from-emerald-50 via-white to-white border-emerald-200 text-slate-900 shadow-sm'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-[#7FD4A6]/20 border border-[#7FD4A6]/40 flex items-center justify-center mx-auto text-[#7FD4A6]">
            <Award className="w-6 h-6" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Congratulations!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              You have completed one full Field Service workflow. You are now ready to operate FSOS independently.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={<Play className="w-4 h-4 fill-current" />}
              onClick={() => onNavigate('mission_control')}
              className="font-bold px-6"
            >
              Start Today's Mission
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => onNavigate('start_page')}
              className="font-medium px-6"
            >
              Return to Start Page
            </Button>
          </div>
        </div>

      </div>

    </div>

  </div>
  );
};

