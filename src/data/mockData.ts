import { 
  FounderBrandingConfig,
  EngineerProfile,
  SystemUser
} from '../types';

export const INITIAL_FOUNDER_BRANDING: FounderBrandingConfig = {
  companyName: 'FIELD OPERATIONS SERVICE SYSTEMS INC.',
  companyLogoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
  customerLogoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?auto=format&fit=crop&w=120&h=120&q=80',
  headerText: 'EXECUTIVE FIELD SERVICE REPORT — ENTERPRISE SLA',
  footerText: 'Confidential & Proprietary — Field Operations Service Systems © 2026',
  showPageNumbers: true,
  primaryColor: '#8B9DFF',
  engineerSignatureBlock: true,
  customerSignatureBlock: true,
  confidentialityBanner: true
};

export const INITIAL_ENGINEER_PROFILE: EngineerProfile = {
  name: 'Sahafiz',
  company: 'EO Technics',
  role: 'Field Service Engineer',
  department: 'Service Operations',
  avatarUrl: ''
};

export const INITIAL_ACTIVE_OPERATOR: SystemUser = {
  id: 'usr-8801',
  employeeId: 'EMP-EO-8801',
  fullName: 'Sahafiz',
  email: 'sahafiz@eotechnics.com',
  phone: '+60 12-882 1042',
  company: 'EO Technics',
  department: 'Service Operations',
  role: 'Field Service Engineer',
  status: 'Online',
  lastLogin: 'Active now',
  timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
  language: 'English (US)',
  accountStatus: 'Active',
  bio: 'Field Service Engineer certified for precision laser systems and cleanroom diagnostics.'
};

export const INITIAL_USERS: SystemUser[] = [INITIAL_ACTIVE_OPERATOR];
