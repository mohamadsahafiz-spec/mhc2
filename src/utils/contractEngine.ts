import { Contract, MHCSession, Machine } from '../types';

export interface ContractTimelineEvent {
  sessionId: string;
  machineId: string;
  machineName: string;
  machineModel: string;
  machineSerialNumber: string;
  startDate: string;
  completedDate?: string;
  daysConsumed: number;
  completionStatus: 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED';
  engineerName: string;
  dispositionVerdict?: string;
}

export interface ContractMetrics {
  contract: Contract;
  totalWorkingDays: number;
  consumedWorkingDays: number;
  remainingWorkingDays: number;
  utilizationPercent: number;
  derivedStatus: 'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'PENDING' | 'RENEWAL_DUE' | 'DRAFT';
  coveredMachines: Machine[];
  uncoveredMachines: Machine[];
  contractSessions: MHCSession[];
  timelineEvents: ContractTimelineEvent[];
}

/**
 * Calculates the real working days consumed by an MHC inspection session.
 * Derives day count from the session's actual start and completion dates without hardcoding.
 */
export function calculateMhcDayConsumption(session: MHCSession | null | undefined): number {
  if (!session || !session.startDate) {
    return 0;
  }

  const start = new Date(session.startDate);
  if (isNaN(start.getTime())) {
    return 1;
  }

  if (session.completedDate) {
    const end = new Date(session.completedDate);
    if (!isNaN(end.getTime()) && end >= start) {
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive day count
      return Math.max(1, diffDays);
    }
  }

  // If completedDate is not set or same day
  return 1;
}

/**
 * Determines whether an MHC session falls within a contract's coverage window and machine scope.
 */
export function isSessionInContract(session: MHCSession, contract: Contract): boolean {
  if (!session || !contract) return false;

  // Machine Scope Check
  const coveredIds = new Set(contract.machinesCoveredIds || []);
  const isMachineCovered = coveredIds.has(session.machineId);

  if (!isMachineCovered) {
    return false;
  }

  // Date Range Check (session startDate within [contract.startDate, contract.endDate])
  if (!session.startDate || !contract.startDate || !contract.endDate) {
    return false;
  }

  const sessionDate = session.startDate.slice(0, 10);
  const contractStart = contract.startDate.slice(0, 10);
  const contractEnd = contract.endDate.slice(0, 10);

  return sessionDate >= contractStart && sessionDate <= contractEnd;
}

/**
 * Computes all authoritative metrics, machine coverage, day consumption, and timeline events for a contract.
 */
export function getContractMetrics(
  contract: Contract,
  allSessions: MHCSession[],
  customerMachines: Machine[]
): ContractMetrics {
  const coveredIds = new Set(contract.machinesCoveredIds || []);
  
  const coveredMachines = customerMachines.filter(m => coveredIds.has(m.id));
  const uncoveredMachines = customerMachines.filter(m => !coveredIds.has(m.id));

  // Find all real sessions belonging to this contract
  const contractSessions = (allSessions || []).filter(s => isSessionInContract(s, contract));

  // Sort sessions chronologically (oldest to newest for timeline presentation)
  contractSessions.sort((a, b) => {
    const timeA = new Date(`${a.startDate} ${a.startTime || '00:00'}`).getTime();
    const timeB = new Date(`${b.startDate} ${b.startTime || '00:00'}`).getTime();
    return timeA - timeB;
  });

  const consumedWorkingDays = contractSessions.reduce((acc, s) => acc + calculateMhcDayConsumption(s), 0);
  const totalWorkingDays = Number(contract.totalWorkingDays) || 0;
  const remainingWorkingDays = Math.max(0, totalWorkingDays - consumedWorkingDays);
  
  const utilizationPercent = totalWorkingDays > 0
    ? Math.min(100, Math.round((consumedWorkingDays / totalWorkingDays) * 100))
    : 0;

  // Determine derived contract status
  const todayIso = new Date().toISOString().slice(0, 10);
  let derivedStatus = contract.status || 'ACTIVE';

  if (contract.endDate && todayIso > contract.endDate.slice(0, 10)) {
    derivedStatus = 'EXPIRED';
  } else if (totalWorkingDays > 0 && consumedWorkingDays >= totalWorkingDays) {
    derivedStatus = 'COMPLETED';
  } else if (!contract.status || contract.status === 'ACTIVE') {
    derivedStatus = 'ACTIVE';
  }

  // Map into timeline events
  const timelineEvents: ContractTimelineEvent[] = contractSessions.map(s => {
    return {
      sessionId: s.id,
      machineId: s.machineId,
      machineName: s.machineName || s.machineModel || 'Laser System',
      machineModel: s.machineModel || 'MHC System',
      machineSerialNumber: s.machineSerialNumber || 'SN-UNKNOWN',
      startDate: s.startDate,
      completedDate: s.completedDate,
      daysConsumed: calculateMhcDayConsumption(s),
      completionStatus: (s.completionStatus as 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED') || 'COMPLETED',
      engineerName: s.engineerName || 'Service Engineer',
      dispositionVerdict: s.stage08_engineerRemarks?.productionReleaseVerdict
    };
  });

  return {
    contract: {
      ...contract,
      consumedWorkingDays,
      remainingWorkingDays,
      status: derivedStatus
    },
    totalWorkingDays,
    consumedWorkingDays,
    remainingWorkingDays,
    utilizationPercent,
    derivedStatus,
    coveredMachines,
    uncoveredMachines,
    contractSessions,
    timelineEvents
  };
}

/**
 * Formats a contract duration string from start to end date.
 */
export function formatContractDuration(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return 'Duration unspecified';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return `${startDate} – ${endDate}`;

  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  let durationLabel = '';
  if (years > 0) {
    durationLabel += `${years} Year${years > 1 ? 's' : ''}`;
  }
  if (remMonths > 0) {
    durationLabel += `${years > 0 ? ' ' : ''}${remMonths} Month${remMonths > 1 ? 's' : ''}`;
  }

  return `${durationLabel || '1 Month'} (${startDate} – ${endDate})`;
}
