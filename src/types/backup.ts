import {
  Machine,
  Customer,
  Plant,
  ProductionLine,
  Contract,
  ExecutionScheduleItem,
  MHCSession,
  ExecutiveReport,
  MHCRecord,
  FieldEngineerTask,
  AlertItem,
  BaselineCheck,
  QualityInvestigation,
  ReportTemplate,
  ReportDraft,
  MHCReportDraftConfig,
  MhcWorkspaceTemplate,
  MhcWorkspaceDraft,
  FounderBrandingConfig,
  EngineerProfile
} from './index';
import { RecommendedPart } from './parts';

export const CURRENT_BACKUP_SCHEMA_VERSION = '1.0.0';

export interface FSOSBackupManifest {
  backupId: string;
  backupVersion: string;
  appVersion: string;
  createdAt: string;
  environment: string;
  domainCounts: Record<string, number>;
  includesImages: boolean;
  includesRawTemperature: boolean;
}

export interface FSOSFullBackupData {
  machines: Machine[];
  customers: Customer[];
  plants: Plant[];
  lines: ProductionLine[];
  contracts: Contract[];
  schedule: ExecutionScheduleItem[];
  mhc_sessions: MHCSession[];
  reports: ExecutiveReport[];
  mhc_records: MHCRecord[];
  tasks: FieldEngineerTask[];
  alerts: AlertItem[];
  baselines: BaselineCheck[];
  investigations: QualityInvestigation[];
  templates: ReportTemplate[];
  drafts: ReportDraft[];
  mhc_report_drafts: MHCReportDraftConfig[];
  mhc_workspace_templates: MhcWorkspaceTemplate[];
  mhc_workspace_drafts: MhcWorkspaceDraft[];
  recommended_parts: RecommendedPart[];
  branding?: FounderBrandingConfig;
  profile?: EngineerProfile;
}

export interface FSOSFullBackupEnvelope {
  manifest: FSOSBackupManifest;
  data: FSOSFullBackupData;
}

export interface FSOSBackupValidationResult {
  valid: boolean;
  manifest?: FSOSBackupManifest;
  envelope?: FSOSFullBackupEnvelope;
  domainCounts: Record<string, number>;
  warnings: string[];
  errors: string[];
}
