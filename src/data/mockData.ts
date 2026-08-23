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

export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr-101',
    employeeId: 'EMP-EO-8801',
    fullName: 'Sahafiz',
    email: 'sahafiz@eotechnics.com',
    phone: '+60 12-345 6789',
    company: 'EO Technics',
    department: 'Service Operations',
    role: 'Field Service Engineer',
    status: 'Online',
    lastLogin: 'Active now',
    timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
    language: 'English (US)',
    accountStatus: 'Active',
    bio: 'Field Service Engineer certified for precision laser systems and cleanroom diagnostics.'
  },
  {
    id: 'usr-102',
    employeeId: 'EMP-EO-8802',
    fullName: 'David Vance',
    email: 'd.vance@eotechnics.com',
    phone: '+886 912 345 678',
    company: 'EO Technics',
    department: 'Laser Optics & Photonics',
    role: 'Senior Engineer',
    status: 'Busy',
    lastLogin: '12 mins ago',
    timezone: 'Asia/Taipei (UTC+08:00)',
    language: 'English (US)',
    accountStatus: 'Active',
    bio: 'Senior Laser Calibration Specialist with 12+ years expertise in galvo beam diagnostics.'
  },
  {
    id: 'usr-103',
    employeeId: 'EMP-EO-8803',
    fullName: 'Elena Rostova',
    email: 'e.rostova@eotechnics.com',
    phone: '+65 9812 3456',
    company: 'EO Technics',
    department: 'APAC Field Operations',
    role: 'Supervisor',
    status: 'Online',
    lastLogin: '45 mins ago',
    timezone: 'Asia/Singapore (UTC+08:00)',
    language: 'English (UK)',
    accountStatus: 'Active',
    bio: 'Regional Service Operations Supervisor overseeing semiconductor SLA compliance and engineer dispatch.'
  },
  {
    id: 'usr-104',
    employeeId: 'EMP-EO-8001',
    fullName: 'Marcus Sterling',
    email: 'm.sterling@eotechnics.com',
    phone: '+1 (408) 555-0192',
    company: 'EO Technics Global',
    department: 'IT & Systems Governance',
    role: 'Administrator',
    status: 'Online',
    lastLogin: '3 mins ago',
    timezone: 'America/Los_Angeles (UTC-07:00)',
    language: 'English (US)',
    accountStatus: 'Active',
    bio: 'System Administrator managing FSOS enterprise platform roles, security rules, and user access.'
  },
  {
    id: 'usr-105',
    employeeId: 'EMP-EO-8005',
    fullName: 'Hiroshi Tanaka',
    email: 'h.tanaka@eotechnics.com',
    phone: '+81 3 5555 0143',
    company: 'EO Technics Japan',
    department: 'Global Service Operations',
    role: 'Manager',
    status: 'Offline',
    lastLogin: 'Yesterday 18:30',
    timezone: 'Asia/Tokyo (UTC+09:00)',
    language: 'Japanese / English',
    accountStatus: 'Active',
    bio: 'Global Field Service Director managing enterprise contract renewals and SLA targets.'
  },
  {
    id: 'usr-106',
    employeeId: 'EMP-EO-8806',
    fullName: 'Sophia Chen',
    email: 's.chen@eotechnics.com',
    phone: '+886 928 112 233',
    company: 'EO Technics Taiwan',
    department: 'Precision Maintenance',
    role: 'Field Service Engineer',
    status: 'On Leave',
    lastLogin: '3 days ago',
    timezone: 'Asia/Taipei (UTC+08:00)',
    language: 'English / Mandarin',
    accountStatus: 'Active',
    bio: 'Precision Field Service Specialist focused on cleanroom optical maintenance and laser alignment.'
  },
  {
    id: 'usr-107',
    employeeId: 'EMP-STM-9901',
    fullName: 'Liam O\'Connor',
    email: 'l.oconnor@st.com',
    phone: '+33 4 76 92 50 00',
    company: 'STMicroelectronics',
    department: 'Quality & Audit Compliance',
    role: 'Viewer',
    status: 'Inactive',
    lastLogin: '2 weeks ago',
    timezone: 'Europe/Paris (UTC+02:00)',
    language: 'English (UK)',
    accountStatus: 'Suspended',
    bio: 'Customer Quality Auditor with read-only access to Machine Health Check reports and SLAs.'
  }
];
