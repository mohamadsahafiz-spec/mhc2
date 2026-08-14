import { LaserEngine } from './laserEngine';
import { ImageStore } from './imageStore';
import { SyncEngine } from './syncEngine';
import { TemperatureEngine } from './temperatureEngine';
import { TempRawStore } from './tempRawStore';
import { SavedTemperatureRecord } from '../types/temperature';
import { 
  Customer, 
  Plant, 
  ProductionLine, 
  Machine, 
  Contract, 
  ExecutionScheduleItem, 
  MHCRecord, 
  ExecutiveReport, 
  QualityInvestigation, 
  BaselineCheck, 
  FieldEngineerTask, 
  AlertItem,
  ReportTemplate,
  ReportDraft,
  FounderBrandingConfig,
  EngineerProfile,
  NotificationItem,
  SystemUser,
  WorkspaceMode,
  UserSession,
  MHCSession,
  MHCReportDraftConfig,
  MhcWorkspaceTemplate,
  MhcWorkspaceDraft,
  RecommendedPart
} from '../types';
import { 
  INITIAL_FOUNDER_BRANDING,
  INITIAL_ENGINEER_PROFILE,
  INITIAL_USERS
} from '../data/mockData';

const ZERO_STATE_PURGE_KEY = 'fsos_v1_0_31_4_zero_state_purged';

const KEYS = {
  CUSTOMERS: 'fso_v04_customers',
  PLANTS: 'fso_v04_plants',
  LINES: 'fso_v04_lines',
  MACHINES: 'fso_v04_machines',
  CONTRACTS: 'fso_v04_contracts',
  SCHEDULE: 'fso_v04_schedule',
  MHC_RECORDS: 'fso_v04_mhc_records',
  REPORTS: 'fso_v04_reports',
  TASKS: 'fso_v04_tasks',
  ALERTS: 'fso_v04_alerts',
  INVESTIGATIONS: 'fso_v04_investigations',
  BASELINES: 'fso_v04_baselines',
  TEMPLATES: 'fso_v04_templates',
  DRAFTS: 'fso_v04_drafts',
  BRANDING: 'fso_v04_branding',
  PROFILE: 'fso_v072_profile',
  NOTIFICATIONS: 'fso_v072_notifications',
  USERS: 'fso_v073_users',
  AUTH: 'fso_v080_authenticated',
  WORKSPACE_MODE: 'fso_v080_workspace_mode',
  MHC_SESSIONS: 'fso_v080_mhc_sessions',
  MHC_REPORT_DRAFTS: 'fso_v080_mhc_report_drafts',
  MHC_WORKSPACE_TEMPLATES: 'fso_v090_mhc_workspace_templates',
  MHC_WORKSPACE_DRAFTS: 'fso_v090_mhc_workspace_drafts',
  RECOMMENDED_PARTS: 'fso_v090_recommended_parts'
};

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
  }
  return defaultValue;
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e: any) {
    console.error(`[StorageService] Error writing ${key} to localStorage:`, e);
    throw new Error(`Failed to persist data to local storage (${e?.message || 'Storage Quota Exceeded'}).`);
  }
}

// Ensure clean one-time zero-state purge for v1.0.31.4 to eliminate legacy fixture residue
function checkAndApplyZeroStatePurge() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(ZERO_STATE_PURGE_KEY) !== 'true') {
      const operationalKeys = [
        KEYS.CUSTOMERS,
        KEYS.PLANTS,
        KEYS.LINES,
        KEYS.MACHINES,
        KEYS.CONTRACTS,
        KEYS.SCHEDULE,
        KEYS.MHC_RECORDS,
        KEYS.REPORTS,
        KEYS.TASKS,
        KEYS.ALERTS,
        KEYS.INVESTIGATIONS,
        KEYS.BASELINES,
        KEYS.TEMPLATES,
        KEYS.DRAFTS,
        KEYS.NOTIFICATIONS,
        KEYS.MHC_SESSIONS,
        KEYS.MHC_REPORT_DRAFTS,
        KEYS.MHC_WORKSPACE_TEMPLATES,
        KEYS.MHC_WORKSPACE_DRAFTS,
        'fsos_customer_list',
        'fsos_sync_queue',
        'fsos_last_sync_time',
        'fsos_cloud_migrated_v1'
      ];
      operationalKeys.forEach(k => localStorage.removeItem(k));
      ImageStore.clearAll().catch(() => {});
      TempRawStore.clearAll().catch(() => {});
      SyncEngine.purgeRemoteData().catch(() => {});
      localStorage.setItem(ZERO_STATE_PURGE_KEY, 'true');
      console.log('[StorageService] v1.0.31.4 Zero-state baseline clean purge applied.');
    }
  } catch (err) {
    console.warn('[StorageService] Zero-state purge check warning:', err);
  }
}

if (typeof window !== 'undefined') {
  checkAndApplyZeroStatePurge();
}

function syncEnqueueList<T extends { id?: string }>(tableName: string, storageKey: string, items: T[]) {
  if (!Array.isArray(items)) return;

  // Read existing items prior to update to identify deleted records
  const previousItems = getStorage<{ id?: string }[] | null>(storageKey, null);
  const previousIds = new Set<string>();
  if (Array.isArray(previousItems)) {
    previousItems.forEach((item, idx) => {
      if (item && item.id) {
        previousIds.add(item.id);
      }
    });
  }

  const newIds = new Set<string>();
  items.forEach((item, idx) => {
    if (item) {
      const recordId = item.id || `${tableName}_${idx}`;
      newIds.add(recordId);
      SyncEngine.enqueueChange(tableName, recordId, 'upsert', item);
    }
  });

  // Enqueue deletion tombstones for any records missing from the new list
  if (previousItems !== null) {
    previousIds.forEach(prevId => {
      if (!newIds.has(prevId)) {
        SyncEngine.enqueueChange(tableName, prevId, 'delete', null);
      }
    });
  }
}

function sanitizeMachine(m: Machine): Machine {
  if (!m) return m;
  if (!m.temperatureRecords || !Array.isArray(m.temperatureRecords)) return m;

  const sanitizedTempRecords = m.temperatureRecords.map((rec) => {
    const rawCount = rec.rawRecordsCount || (Array.isArray(rec.records) ? rec.records.length : 0);
    const cleanedRec: SavedTemperatureRecord = {
      ...rec,
      rawRecordsCount: rawCount,
      records: [] // Strip heavy raw records array from localStorage/D1
    };

    if (cleanedRec.channelData && typeof cleanedRec.channelData === 'object') {
      const downsampledMap: Record<number, Array<{ ts: Date; val: number }>> = {};
      let modified = false;
      Object.entries(cleanedRec.channelData).forEach(([chStr, pts]) => {
        const ch = parseInt(chStr, 10);
        if (Array.isArray(pts)) {
          if (pts.length > 1500) {
            downsampledMap[ch] = TemperatureEngine.downsamplePoints(pts, 1500);
            modified = true;
          } else {
            downsampledMap[ch] = pts;
          }
        }
      });
      if (modified) {
        cleanedRec.channelData = downsampledMap;
      }
    }

    return cleanedRec;
  });

  return {
    ...m,
    temperatureRecords: sanitizedTempRecords
  };
}

export const StorageService = {
  getCustomers: (): Customer[] => {
    // Check if legacy 'fsos_customer_list' exists in localStorage
    try {
      const legacySaved = localStorage.getItem('fsos_customer_list');
      const currentSaved = localStorage.getItem(KEYS.CUSTOMERS);

      if (legacySaved && !currentSaved) {
        const legacyCustomers: Customer[] = JSON.parse(legacySaved);
        if (Array.isArray(legacyCustomers) && legacyCustomers.length > 0) {
          setStorage(KEYS.CUSTOMERS, legacyCustomers);
        }
        localStorage.removeItem('fsos_customer_list');
      } else if (legacySaved && currentSaved) {
        const legacyCustomers: Customer[] = JSON.parse(legacySaved);
        const currentCustomers: Customer[] = JSON.parse(currentSaved);
        if (Array.isArray(legacyCustomers) && Array.isArray(currentCustomers)) {
          const currentIds = new Set(currentCustomers.map((c) => c?.id));
          let merged = false;
          legacyCustomers.forEach((lc) => {
            if (lc && lc.id && !currentIds.has(lc.id)) {
              currentCustomers.push(lc);
              merged = true;
            }
          });
          if (merged) {
            setStorage(KEYS.CUSTOMERS, currentCustomers);
          }
        }
        localStorage.removeItem('fsos_customer_list');
      }
    } catch (e) {
      console.error('[StorageService] Error migrating legacy customer data:', e);
    }

    return getStorage<Customer[]>(KEYS.CUSTOMERS, []);
  },
  saveCustomers: (data: Customer[]) => {
    syncEnqueueList('customers', KEYS.CUSTOMERS, data);
    setStorage(KEYS.CUSTOMERS, data);
  },

  reconcileCustomerIdentities: (
    machinesList: Machine[],
    existingCustomersList: Customer[]
  ): { machines: Machine[]; customers: Customer[] } => {
    const customersMap = new Map<string, Customer>();
    const nameToIdMap = new Map<string, string>();

    // 1. Index existing authoritative customers
    (existingCustomersList || []).forEach((c) => {
      if (c && c.id) {
        customersMap.set(c.id, c);
        if (c.name) {
          nameToIdMap.set(c.name.trim().toLowerCase(), c.id);
        }
      }
    });

    // 2. Reconcile machines
    const updatedMachines = (machinesList || []).map((m, idx) => {
      if (!m) return m;
      let custId = m.customerId;
      const rawCustName = (m.customerName || '').trim();
      const custNameKey = rawCustName.toLowerCase();

      // Check if machine already has a valid customerId in authoritative map
      if (custId && customersMap.has(custId)) {
        const authCust = customersMap.get(custId)!;
        return {
          ...m,
          customerId: authCust.id,
          customerName: authCust.name
        };
      }

      // Check if customerName matches an existing customer
      if (custNameKey && nameToIdMap.has(custNameKey)) {
        const matchedId = nameToIdMap.get(custNameKey)!;
        const authCust = customersMap.get(matchedId)!;
        return {
          ...m,
          customerId: authCust.id,
          customerName: authCust.name
        };
      }

      // Customer does not exist in authoritative list -> create ONE authoritative Customer record
      const targetName = rawCustName || 'Cleanroom Customer';
      const newCustId = custId || `cust-${Date.now()}-${idx}`;
      const newCustomer: Customer = {
        id: newCustId,
        name: targetName,
        industry: m.plantName || 'Precision Laser Facility',
        contactPerson: 'Lead Operations Engineer',
        email: 'ops@cleanroom.com',
        phone: '+1 (555) 019-2831',
        plantsCount: 1,
        activeContractsCount: 1
      };

      customersMap.set(newCustId, newCustomer);
      nameToIdMap.set(targetName.toLowerCase(), newCustId);

      return {
        ...m,
        customerId: newCustId,
        customerName: targetName
      };
    });

    return {
      machines: updatedMachines,
      customers: Array.from(customersMap.values())
    };
  },

  getPlants: (): Plant[] => getStorage(KEYS.PLANTS, []),
  savePlants: (data: Plant[]) => {
    syncEnqueueList('plants', KEYS.PLANTS, data);
    setStorage(KEYS.PLANTS, data);
  },

  getLines: (): ProductionLine[] => getStorage(KEYS.LINES, []),
  saveLines: (data: ProductionLine[]) => {
    syncEnqueueList('lines', KEYS.LINES, data);
    setStorage(KEYS.LINES, data);
  },

  getMachines: (): Machine[] => {
    const raw = getStorage<Machine[]>(KEYS.MACHINES, []);
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      return [];
    }
    const sanitized = raw.map(sanitizeMachine);
    const normalized = LaserEngine.normalizeMachines(sanitized) as unknown as Machine[];
    return ImageStore.hydrateImagesSync(normalized);
  },
  saveMachines: (data: Machine[]) => {
    const processedMachines = data.map(m => {
      const recordId = m.id || `M-${Date.now()}`;
      const withId = m.id ? m : { ...m, id: recordId };
      const sanitized = sanitizeMachine(withId);
      return ImageStore.extractAndStoreImagesSync(sanitized, recordId);
    });
    syncEnqueueList('machines', KEYS.MACHINES, processedMachines);
    setStorage(KEYS.MACHINES, processedMachines);
  },

  getContracts: (): Contract[] => getStorage(KEYS.CONTRACTS, []),
  saveContracts: (data: Contract[]) => {
    syncEnqueueList('contracts', KEYS.CONTRACTS, data);
    setStorage(KEYS.CONTRACTS, data);
  },

  getSchedule: (): ExecutionScheduleItem[] => getStorage(KEYS.SCHEDULE, []),
  saveSchedule: (data: ExecutionScheduleItem[]) => {
    syncEnqueueList('schedule', KEYS.SCHEDULE, data);
    setStorage(KEYS.SCHEDULE, data);
  },

  getMhcRecords: (): MHCRecord[] => getStorage(KEYS.MHC_RECORDS, []),
  saveMhcRecords: (data: MHCRecord[]) => {
    syncEnqueueList('mhc_records', KEYS.MHC_RECORDS, data);
    setStorage(KEYS.MHC_RECORDS, data);
  },

  getReports: (): ExecutiveReport[] => getStorage(KEYS.REPORTS, []),
  saveReports: (data: ExecutiveReport[]) => {
    syncEnqueueList('reports', KEYS.REPORTS, data);
    setStorage(KEYS.REPORTS, data);
  },

  getTasks: (): FieldEngineerTask[] => getStorage(KEYS.TASKS, []),
  saveTasks: (data: FieldEngineerTask[]) => {
    syncEnqueueList('tasks', KEYS.TASKS, data);
    setStorage(KEYS.TASKS, data);
  },

  getAlerts: (): AlertItem[] => getStorage(KEYS.ALERTS, []),
  saveAlerts: (data: AlertItem[]) => {
    syncEnqueueList('alerts', KEYS.ALERTS, data);
    setStorage(KEYS.ALERTS, data);
  },

  getInvestigations: (): QualityInvestigation[] => getStorage(KEYS.INVESTIGATIONS, []),
  saveInvestigations: (data: QualityInvestigation[]) => {
    syncEnqueueList('investigations', KEYS.INVESTIGATIONS, data);
    setStorage(KEYS.INVESTIGATIONS, data);
  },

  getBaselines: (): BaselineCheck[] => getStorage(KEYS.BASELINES, []),
  saveBaselines: (data: BaselineCheck[]) => {
    syncEnqueueList('baselines', KEYS.BASELINES, data);
    setStorage(KEYS.BASELINES, data);
  },

  getTemplates: (): ReportTemplate[] => getStorage(KEYS.TEMPLATES, []),
  saveTemplates: (data: ReportTemplate[]) => {
    syncEnqueueList('templates', KEYS.TEMPLATES, data);
    setStorage(KEYS.TEMPLATES, data);
  },

  getDrafts: (): ReportDraft[] => getStorage(KEYS.DRAFTS, []),
  saveDrafts: (data: ReportDraft[]) => {
    syncEnqueueList('drafts', KEYS.DRAFTS, data);
    setStorage(KEYS.DRAFTS, data);
  },

  getBranding: (): FounderBrandingConfig => getStorage(KEYS.BRANDING, INITIAL_FOUNDER_BRANDING),
  saveBranding: (data: FounderBrandingConfig) => setStorage(KEYS.BRANDING, data),

  getProfile: (): EngineerProfile => getStorage(KEYS.PROFILE, INITIAL_ENGINEER_PROFILE),
  saveProfile: (data: EngineerProfile) => setStorage(KEYS.PROFILE, data),

  getNotifications: (): NotificationItem[] => getStorage(KEYS.NOTIFICATIONS, []),
  saveNotifications: (data: NotificationItem[]) => setStorage(KEYS.NOTIFICATIONS, data),

  getUsers: (): SystemUser[] => getStorage(KEYS.USERS, INITIAL_USERS),
  saveUsers: (data: SystemUser[]) => setStorage(KEYS.USERS, data),

  getAuth: (): UserSession | null => getStorage(KEYS.AUTH, null),
  saveAuth: (session: UserSession | null) => setStorage(KEYS.AUTH, session),
  clearAuth: () => localStorage.removeItem(KEYS.AUTH),

  getWorkspaceMode: (): WorkspaceMode => getStorage(KEYS.WORKSPACE_MODE, 'MHC_MODE'),
  saveWorkspaceMode: (mode: WorkspaceMode) => setStorage(KEYS.WORKSPACE_MODE, mode),

  getMhcSessions: (): MHCSession[] => getStorage(KEYS.MHC_SESSIONS, []),
  saveMhcSessions: (data: MHCSession[]) => {
    syncEnqueueList('mhc_sessions', KEYS.MHC_SESSIONS, data);
    setStorage(KEYS.MHC_SESSIONS, data);
  },

  getMhcReportDrafts: (): MHCReportDraftConfig[] => getStorage(KEYS.MHC_REPORT_DRAFTS, []),
  saveMhcReportDrafts: (data: MHCReportDraftConfig[]) => {
    syncEnqueueList('mhc_report_drafts', KEYS.MHC_REPORT_DRAFTS, data);
    setStorage(KEYS.MHC_REPORT_DRAFTS, data);
  },

  getMhcWorkspaceTemplates: (): MhcWorkspaceTemplate[] => getStorage(KEYS.MHC_WORKSPACE_TEMPLATES, []),
  saveMhcWorkspaceTemplates: (data: MhcWorkspaceTemplate[]) => {
    syncEnqueueList('mhc_workspace_templates', KEYS.MHC_WORKSPACE_TEMPLATES, data);
    setStorage(KEYS.MHC_WORKSPACE_TEMPLATES, data);
  },

  getMhcWorkspaceDrafts: (): MhcWorkspaceDraft[] => getStorage(KEYS.MHC_WORKSPACE_DRAFTS, []),
  saveMhcWorkspaceDrafts: (data: MhcWorkspaceDraft[]) => {
    syncEnqueueList('mhc_workspace_drafts', KEYS.MHC_WORKSPACE_DRAFTS, data);
    setStorage(KEYS.MHC_WORKSPACE_DRAFTS, data);
  },

  getRecommendedParts: (): RecommendedPart[] => getStorage(KEYS.RECOMMENDED_PARTS, []),
  getRecommendedPartById: (id: string): RecommendedPart | undefined => {
    const parts = getStorage<RecommendedPart[]>(KEYS.RECOMMENDED_PARTS, []);
    return parts.find(p => p.id === id);
  },
  saveRecommendedParts: (data: RecommendedPart[]) => {
    syncEnqueueList('recommended_parts', KEYS.RECOMMENDED_PARTS, data);
    setStorage(KEYS.RECOMMENDED_PARTS, data);
  },
  saveRecommendedPart: (part: RecommendedPart) => {
    const parts = StorageService.getRecommendedParts();
    const existingIndex = parts.findIndex(p => p.id === part.id);
    let updated: RecommendedPart[];
    if (existingIndex >= 0) {
      updated = [...parts];
      updated[existingIndex] = { ...part, updatedAt: new Date().toISOString() };
    } else {
      updated = [
        {
          ...part,
          createdAt: part.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        ...parts
      ];
    }
    StorageService.saveRecommendedParts(updated);
  },
  deleteRecommendedPart: (partId: string) => {
    const parts = StorageService.getRecommendedParts();
    const updated = parts.filter(p => p.id !== partId);
    StorageService.saveRecommendedParts(updated);
    StorageService.deleteRecord('recommended_parts', partId);
  },

  deleteRecord: (tableName: string, recordId: string) => {
    SyncEngine.enqueueChange(tableName, recordId, 'delete', null);
  },

  deleteMachine: (machineId: string) => {
    const current = StorageService.getMachines();
    const updated = current.filter(m => m.id !== machineId);
    StorageService.saveMachines(updated);
  },

  getAllLocalData: (): Record<string, any[]> => {
    return {
      machines: StorageService.getMachines(),
      mhc_sessions: StorageService.getMhcSessions(),
      reports: StorageService.getReports(),
      customers: StorageService.getCustomers(),
      plants: StorageService.getPlants(),
      lines: StorageService.getLines(),
      contracts: StorageService.getContracts(),
      tasks: StorageService.getTasks(),
      baselines: StorageService.getBaselines(),
      investigations: StorageService.getInvestigations(),
      mhc_report_drafts: StorageService.getMhcReportDrafts(),
      mhc_workspace_templates: StorageService.getMhcWorkspaceTemplates(),
      mhc_workspace_drafts: StorageService.getMhcWorkspaceDrafts(),
      recommended_parts: StorageService.getRecommendedParts()
    };
  },

  resetToDefaults: async () => {
    const operationalKeys = [
      KEYS.CUSTOMERS,
      KEYS.PLANTS,
      KEYS.LINES,
      KEYS.MACHINES,
      KEYS.CONTRACTS,
      KEYS.SCHEDULE,
      KEYS.MHC_RECORDS,
      KEYS.REPORTS,
      KEYS.TASKS,
      KEYS.ALERTS,
      KEYS.INVESTIGATIONS,
      KEYS.BASELINES,
      KEYS.TEMPLATES,
      KEYS.DRAFTS,
      KEYS.NOTIFICATIONS,
      KEYS.MHC_SESSIONS,
      KEYS.MHC_REPORT_DRAFTS,
      KEYS.MHC_WORKSPACE_TEMPLATES,
      KEYS.MHC_WORKSPACE_DRAFTS,
      KEYS.RECOMMENDED_PARTS,
      'fsos_customer_list',
      'fsos_sync_queue',
      'fsos_last_sync_time',
      'fsos_cloud_migrated_v1'
    ];
    operationalKeys.forEach(k => localStorage.removeItem(k));
    await ImageStore.clearAll().catch(() => {});
    await TempRawStore.clearAll().catch(() => {});
    await SyncEngine.purgeRemoteData().catch(() => {});
    localStorage.setItem(ZERO_STATE_PURGE_KEY, 'true');
  }
};

// Register remote update merge handler
SyncEngine.registerRemoteUpdateCallback((tableName, remoteRecords) => {
  if (!Array.isArray(remoteRecords) || remoteRecords.length === 0) return;

  const keyMap: Record<string, { key: string; get: () => any[]; save: (data: any[]) => void }> = {
    machines: { key: KEYS.MACHINES, get: StorageService.getMachines, save: StorageService.saveMachines },
    mhc_sessions: { key: KEYS.MHC_SESSIONS, get: StorageService.getMhcSessions, save: StorageService.saveMhcSessions },
    reports: { key: KEYS.REPORTS, get: StorageService.getReports, save: StorageService.saveReports },
    customers: { key: KEYS.CUSTOMERS, get: StorageService.getCustomers, save: StorageService.saveCustomers },
    plants: { key: KEYS.PLANTS, get: StorageService.getPlants, save: StorageService.savePlants },
    lines: { key: KEYS.LINES, get: StorageService.getLines, save: StorageService.saveLines },
    contracts: { key: KEYS.CONTRACTS, get: StorageService.getContracts, save: StorageService.saveContracts },
    schedule: { key: KEYS.SCHEDULE, get: StorageService.getSchedule, save: StorageService.saveSchedule },
    mhc_records: { key: KEYS.MHC_RECORDS, get: StorageService.getMhcRecords, save: StorageService.saveMhcRecords },
    tasks: { key: KEYS.TASKS, get: StorageService.getTasks, save: StorageService.saveTasks },
    alerts: { key: KEYS.ALERTS, get: StorageService.getAlerts, save: StorageService.saveAlerts },
    baselines: { key: KEYS.BASELINES, get: StorageService.getBaselines, save: StorageService.saveBaselines },
    investigations: { key: KEYS.INVESTIGATIONS, get: StorageService.getInvestigations, save: StorageService.saveInvestigations },
    templates: { key: KEYS.TEMPLATES, get: StorageService.getTemplates, save: StorageService.saveTemplates },
    drafts: { key: KEYS.DRAFTS, get: StorageService.getDrafts, save: StorageService.saveDrafts },
    mhc_report_drafts: { key: KEYS.MHC_REPORT_DRAFTS, get: StorageService.getMhcReportDrafts, save: StorageService.saveMhcReportDrafts },
    mhc_workspace_templates: { key: KEYS.MHC_WORKSPACE_TEMPLATES, get: StorageService.getMhcWorkspaceTemplates, save: StorageService.saveMhcWorkspaceTemplates },
    mhc_workspace_drafts: { key: KEYS.MHC_WORKSPACE_DRAFTS, get: StorageService.getMhcWorkspaceDrafts, save: StorageService.saveMhcWorkspaceDrafts },
    recommended_parts: { key: KEYS.RECOMMENDED_PARTS, get: StorageService.getRecommendedParts, save: StorageService.saveRecommendedParts }
  };

  const config = keyMap[tableName];
  if (!config) return;

  const currentLocal = config.get();
  const nextList = [...currentLocal];
  let updated = false;

  remoteRecords.forEach(rec => {
    if (rec.isDeleted) {
      const idx = nextList.findIndex(item => item && item.id === rec.recordId);
      if (idx !== -1) {
        nextList.splice(idx, 1);
        updated = true;
      }
    } else if (rec.data) {
      const idx = nextList.findIndex(item => item && item.id === rec.recordId);
      if (idx !== -1) {
        nextList[idx] = rec.data;
      } else {
        nextList.unshift(rec.data);
      }
      updated = true;
    }
  });

  if (updated) {
    setStorage(config.key, nextList);
  }
});
