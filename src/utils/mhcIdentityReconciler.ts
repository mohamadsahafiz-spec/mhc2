import { MHCSession, Machine } from '../types';

export interface MhcSessionMappingEntry {
  oldMachineId: string;
  newMachineId: string;
  machineDisplayName: string;
  matchedBy: 'SERIAL_NUMBER_MATCH' | 'MACHINE_ID_NORMALIZED_MATCH' | 'MACHINE_NAME_MATCH' | 'COMPOSITE_MODEL_CUSTOMER_MATCH';
  sessionIds: string[];
  sessionCount: number;
}

export interface MhcSessionAmbiguityEntry {
  sessionId: string;
  oldMachineId: string;
  candidateMachineIds: string[];
  reason: string;
}

export interface MhcSessionReconciliationReport {
  totalSessions: number;
  alreadyCorrectCount: number;
  relinkedCount: number;
  ambiguousCount: number;
  unmatchedCount: number;
  mappings: MhcSessionMappingEntry[];
  ambiguities: MhcSessionAmbiguityEntry[];
}

export interface ReconciliationResult {
  sessions: MHCSession[];
  report: MhcSessionReconciliationReport;
  modified: boolean;
}

/**
 * Reconciles orphaned or stale MHCSession machineId foreign keys against the current active Machine fleet.
 * Preserves all session contents, timestamps, activity progress, and evidence references byte-for-byte.
 * Fully deterministic, safe against ambiguities, and idempotent.
 */
export function reconcileMhcSessionIdentities(
  sessionsList: MHCSession[],
  machinesList: Machine[]
): ReconciliationResult {
  const report: MhcSessionReconciliationReport = {
    totalSessions: Array.isArray(sessionsList) ? sessionsList.length : 0,
    alreadyCorrectCount: 0,
    relinkedCount: 0,
    ambiguousCount: 0,
    unmatchedCount: 0,
    mappings: [],
    ambiguities: []
  };

  if (!Array.isArray(sessionsList) || sessionsList.length === 0 || !Array.isArray(machinesList) || machinesList.length === 0) {
    return {
      sessions: Array.isArray(sessionsList) ? sessionsList : [],
      report,
      modified: false
    };
  }

  // Set of current active machine IDs
  const activeMachineIdSet = new Set<string>(machinesList.map(m => m.id).filter(Boolean));

  // Mapping accumulator: key = `${oldMachineId}->${newMachineId}`
  const mappingMap = new Map<string, MhcSessionMappingEntry>();

  let hasModifications = false;

  const reconciledSessions = sessionsList.map((session) => {
    if (!session || typeof session !== 'object' || !session.id) {
      return session;
    }

    // 1. If session.machineId is already a valid active machine ID, it's correct!
    if (session.machineId && activeMachineIdSet.has(session.machineId)) {
      report.alreadyCorrectCount++;
      return session;
    }

    const oldId = session.machineId || '';
    const sessSerial = (session.machineSerialNumber || '').trim().toLowerCase();
    const sessName = (session.machineName || '').trim().toLowerCase();
    const sessModel = (session.machineModel || '').trim().toLowerCase();
    const sessCust = (session.customerName || '').trim().toLowerCase();
    const oldIdNorm = oldId.trim().toLowerCase();

    // ------------------------------------------------------------------------
    // LEVEL 1: Exact Unique Serial Number Match (Highest Confidence)
    // ------------------------------------------------------------------------
    const isValidSerial = sessSerial && 
      sessSerial !== 'sn-unknown' && 
      sessSerial !== 'unknown' && 
      sessSerial !== 'sn-0000' &&
      sessSerial !== 'n/a';

    if (isValidSerial) {
      const serialMatches = machinesList.filter((m) => {
        const mSerial = (m.serialNo || '').trim().toLowerCase();
        const mNo = (m.machineNo || m.machineNumber || '').trim().toLowerCase();
        return (mSerial && mSerial === sessSerial) || (mNo && mNo === sessSerial);
      });

      if (serialMatches.length === 1) {
        const target = serialMatches[0];
        recordMapping(mappingMap, oldId, target, 'SERIAL_NUMBER_MATCH', session.id);
        report.relinkedCount++;
        hasModifications = true;
        return { ...session, machineId: target.id };
      } else if (serialMatches.length > 1) {
        report.ambiguousCount++;
        report.ambiguities.push({
          sessionId: session.id,
          oldMachineId: oldId,
          candidateMachineIds: serialMatches.map(m => m.id),
          reason: `Multiple active machines matched session machineSerialNumber "${session.machineSerialNumber}".`
        });
        return session; // Stop mapping on ambiguity
      }
    }

    // ------------------------------------------------------------------------
    // LEVEL 2: Machine ID Substring / Normalization Match (e.g. "mach-WD-44367" vs "WD-44367")
    // ------------------------------------------------------------------------
    if (oldIdNorm) {
      const idMatches = machinesList.filter((m) => {
        const mIdNorm = (m.id || '').trim().toLowerCase();
        const mNoNorm = (m.machineNo || m.machineNumber || '').trim().toLowerCase();
        const mSerialNorm = (m.serialNo || '').trim().toLowerCase();

        if (mIdNorm && (oldIdNorm === mIdNorm || oldIdNorm.includes(mIdNorm) || mIdNorm.includes(oldIdNorm))) return true;
        if (mNoNorm && (oldIdNorm === mNoNorm || oldIdNorm.includes(mNoNorm))) return true;
        if (mSerialNorm && (oldIdNorm === mSerialNorm || oldIdNorm.includes(mSerialNorm))) return true;
        return false;
      });

      if (idMatches.length === 1) {
        const target = idMatches[0];
        recordMapping(mappingMap, oldId, target, 'MACHINE_ID_NORMALIZED_MATCH', session.id);
        report.relinkedCount++;
        hasModifications = true;
        return { ...session, machineId: target.id };
      } else if (idMatches.length > 1) {
        report.ambiguousCount++;
        report.ambiguities.push({
          sessionId: session.id,
          oldMachineId: oldId,
          candidateMachineIds: idMatches.map(m => m.id),
          reason: `Multiple active machines matched session machineId pattern "${oldId}".`
        });
        return session;
      }
    }

    // ------------------------------------------------------------------------
    // LEVEL 3: Machine Number / Unique Machine Name Match
    // ------------------------------------------------------------------------
    const isValidName = sessName && 
      sessName !== 'wafer driller' && 
      sessName !== 'unknown' && 
      sessName !== 'machine';

    if (isValidName) {
      const nameMatches = machinesList.filter((m) => {
        const mNo = (m.machineNo || m.machineNumber || '').trim().toLowerCase();
        const mName = (m.machineName || '').trim().toLowerCase();
        return (mNo && mNo === sessName) || (mName && mName === sessName);
      });

      if (nameMatches.length === 1) {
        const target = nameMatches[0];
        recordMapping(mappingMap, oldId, target, 'MACHINE_NAME_MATCH', session.id);
        report.relinkedCount++;
        hasModifications = true;
        return { ...session, machineId: target.id };
      } else if (nameMatches.length > 1) {
        // Try narrowing with model and customer
        const narrowed = nameMatches.filter((m) => {
          const mModel = (m.model || '').trim().toLowerCase();
          const mCust = (m.customerName || '').trim().toLowerCase();
          const modelOk = !sessModel || (mModel && mModel === sessModel);
          const custOk = !sessCust || (mCust && mCust === sessCust);
          return modelOk && custOk;
        });

        if (narrowed.length === 1) {
          const target = narrowed[0];
          recordMapping(mappingMap, oldId, target, 'MACHINE_NAME_MATCH', session.id);
          report.relinkedCount++;
          hasModifications = true;
          return { ...session, machineId: target.id };
        }

        report.ambiguousCount++;
        report.ambiguities.push({
          sessionId: session.id,
          oldMachineId: oldId,
          candidateMachineIds: nameMatches.map(m => m.id),
          reason: `Multiple active machines matched session machineName "${session.machineName}".`
        });
        return session;
      }
    }

    // ------------------------------------------------------------------------
    // LEVEL 4: Composite Attributes (Model + Customer + Distinctive Model)
    // ------------------------------------------------------------------------
    if (sessModel && sessCust) {
      const compositeMatches = machinesList.filter((m) => {
        const mModel = (m.model || '').trim().toLowerCase();
        const mCust = (m.customerName || '').trim().toLowerCase();
        return mModel === sessModel && mCust === sessCust;
      });

      if (compositeMatches.length === 1) {
        const target = compositeMatches[0];
        recordMapping(mappingMap, oldId, target, 'COMPOSITE_MODEL_CUSTOMER_MATCH', session.id);
        report.relinkedCount++;
        hasModifications = true;
        return { ...session, machineId: target.id };
      } else if (compositeMatches.length > 1) {
        report.ambiguousCount++;
        report.ambiguities.push({
          sessionId: session.id,
          oldMachineId: oldId,
          candidateMachineIds: compositeMatches.map(m => m.id),
          reason: `Multiple active machines matched composite model "${session.machineModel}" & customer "${session.customerName}".`
        });
        return session;
      }
    }

    // ------------------------------------------------------------------------
    // UNMATCHED: Insufficient evidence to establish deterministic link
    // ------------------------------------------------------------------------
    report.unmatchedCount++;
    return session;
  });

  report.mappings = Array.from(mappingMap.values());

  return {
    sessions: reconciledSessions,
    report,
    modified: hasModifications
  };
}

function recordMapping(
  acc: Map<string, MhcSessionMappingEntry>,
  oldMachineId: string,
  targetMachine: Machine,
  matchedBy: MhcSessionMappingEntry['matchedBy'],
  sessionId: string
) {
  const key = `${oldMachineId}->${targetMachine.id}`;
  if (!acc.has(key)) {
    acc.set(key, {
      oldMachineId,
      newMachineId: targetMachine.id,
      machineDisplayName: targetMachine.machineNo || targetMachine.machineNumber || targetMachine.machineName || targetMachine.id,
      matchedBy,
      sessionIds: [sessionId],
      sessionCount: 1
    });
  } else {
    const existing = acc.get(key)!;
    if (!existing.sessionIds.includes(sessionId)) {
      existing.sessionIds.push(sessionId);
      existing.sessionCount = existing.sessionIds.length;
    }
  }
}
