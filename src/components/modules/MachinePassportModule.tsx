import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  Cpu, 
  Zap, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Activity, 
  Activity as HeartIcon,
  Image as ImageIcon, 
  Wrench, 
  Plus, 
  Layers, 
  Edit3, 
  Type, 
  Trash2, 
  X, 
  Settings, 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Archive, 
  MapPin, 
  ShieldCheck, 
  MoreVertical, 
  Upload, 
  Download, 
  FileJson, 
  Check, 
  Camera, 
  Thermometer, 
  Aperture, 
  Crosshair, 
  Package, 
  Share2, 
  Search,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { MachinePassportTableView, PassportSubjectId } from './MachinePassportTableView';
import { Machine, MHCRecord, Customer, MachineMhcSpecs } from '../../types';
import { StorageService } from '../../utils/persistence';
import { hasMeaningfulMhcProgress } from '../../utils/mhcAutopilotBrain';
import { MachineTemperatureWorkspace } from './MachineTemperatureWorkspace';
import { MachineLaserPowerWorkspace } from './MachineLaserPowerWorkspace';
import { MachineBeamProfileWorkspace } from './MachineBeamProfileWorkspace';
import { MachineFocusOptimizationWorkspace } from './MachineFocusOptimizationWorkspace';
import { MachineProductProcessWorkspace } from './MachineProductProcessWorkspace';
import { RecommendedPartsWorkspace } from '../parts/RecommendedPartsWorkspace';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { HealthGauge } from '../common/HealthGauge';
import { ProgressBar } from '../common/ProgressBar';
import { useTheme } from '../../context/ThemeContext';
import {
  motionTimings,
  motionEasings,
  mechanicalPressConfig,
  slidingIndicatorTransition,
  createStaggerContainerVariants,
  createFadeSlideVariants
} from '../../theme/motion';

import { 
  LaserEngine, 
  LaserMetrics, 
  MachineMetrics, 
  LaserHeadDomain, 
  formatLifeRemainingPercent,
  formatDate 
} from '../../utils/laserEngine';

interface MachinePassportProps {
  machines: Machine[];
  customers?: Customer[];
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  mhcRecords: MHCRecord[];
  onOpenMhcForMachine: (machineId: string) => void;
  onAddMachine?: (machine: Machine) => void;
  onEditMachine?: (machine: Machine) => void;
  onDeleteMachine?: (machineId: string) => void;
  onBatchImportMachines?: (machines: Machine[]) => void;
  onAddCustomer?: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
}

export const MachinePassportModule: React.FC<MachinePassportProps> = ({
  machines,
  customers: propsCustomers,
  selectedMachineId,
  onSelectMachine,
  mhcRecords,
  onOpenMhcForMachine,
  onAddMachine,
  onEditMachine,
  onDeleteMachine,
  onBatchImportMachines,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const shouldReduceMotion = !!useReducedMotion();
  const sortedMachines = React.useMemo(() => {
    return LaserEngine.normalizeMachines(machines);
  }, [machines]);

  const selectedMachine = sortedMachines.find((m) => m.id === selectedMachineId) || sortedMachines[0] || machines[0];

  // Machine Passport Sub-Category Active Tab State
  const [passportSubTab, setPassportSubTab] = useState<PassportSubjectId>('lifecycle');
  // Machine Passport View Mode: 'table' (Machine Inspection Table) or 'workspace' (Individual Subject Workspace)
  const [passportViewMode, setPassportViewMode] = useState<'table' | 'workspace'>('table');

  // Authoritative Machine Laser Lifecycle Metrics derived via LaserEngine
  const machineMetrics: MachineMetrics = React.useMemo(() => {
    return LaserEngine.calculateMachineMetrics(selectedMachine);
  }, [selectedMachine]);

  // Check for active in-progress session for selected machine
  const resumableSession = React.useMemo(() => {
    if (!selectedMachine?.id) return null;
    const sessions = StorageService.getMhcSessions(true);
    return sessions.find(s => s.machineId === selectedMachine.id && s.completionStatus === 'IN_PROGRESS') || null;
  }, [selectedMachine?.id]);
  const isResumableActive = resumableSession ? hasMeaningfulMhcProgress(resumableSession) : false;

  // Laser Head Progressive Detail Expansion State
  const [expandedLaserIds, setExpandedLaserIds] = useState<Record<string, boolean>>({});
  const toggleExpandLaser = (id: string) => {
    setExpandedLaserIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Physical Meter Verification Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [targetLaserMetrics, setTargetLaserMetrics] = useState<LaserMetrics | null>(null);
  const [physicalMeterInput, setPhysicalMeterInput] = useState<string>('');
  const [verifyDateInput, setVerifyDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [verifyTimeInput, setVerifyTimeInput] = useState<string>('09:00');
  const [verifyReason, setVerifyReason] = useState<string>('Scheduled Preventive Maintenance Verification');

  // Laser Head Configuration Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configLaserHead, setConfigLaserHead] = useState<LaserHeadDomain | null>(null);
  const [configName, setConfigName] = useState('');
  const [configSerial, setConfigSerial] = useState('');
  const [configBaseHour, setConfigBaseHour] = useState('');
  const [configBaseTimestamp, setConfigBaseTimestamp] = useState('');
  const [configRatedLife, setConfigRatedLife] = useState('');
  const [configWarningLife, setConfigWarningLife] = useState('');
  const [configContingency, setConfigContingency] = useState('');

  // Add Laser Head Modal State
  const [isAddLaserModalOpen, setIsAddLaserModalOpen] = useState(false);
  const [addLaserName, setAddLaserName] = useState('');
  const [addLaserSerial, setAddLaserSerial] = useState('');
  const [addLaserBaseHour, setAddLaserBaseHour] = useState('');
  const [addLaserBaseDate, setAddLaserBaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [addLaserBaseTime, setAddLaserBaseTime] = useState('09:00');
  const [addLaserRatedLife, setAddLaserRatedLife] = useState('25000');

  // Laser Monitor JSON Import / Export State
  const [importPreviewModalOpen, setImportPreviewModalOpen] = useState(false);
  const [importResultModalOpen, setImportResultModalOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<{
    machinesFound: number;
    laserHeadsFound: number;
    existingMatched: number;
    newMachines: number;
    skippedUnmatched?: number;
    warnings: string[];
    mappedMachines: Machine[];
    importedMachineList: Machine[];
  } | null>(null);
  const [importResultSummary, setImportResultSummary] = useState<{
    machinesImported: number;
    laserHeadsImported: number;
    existingMatched: number;
    newMachines: number;
    skippedUnmatched?: number;
    warnings: string[];
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleTriggerImportFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const preview = LaserEngine.parseAndMapLaserMonitorJson(text, machines, customers);
        setImportPreviewData(preview);
        setImportPreviewModalOpen(true);
      } catch (err: any) {
        alert(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importPreviewData) return;

    if (onBatchImportMachines) {
      onBatchImportMachines(importPreviewData.mappedMachines);
    } else {
      importPreviewData.mappedMachines.forEach((m) => {
        if (onEditMachine) onEditMachine(m);
      });
    }

    setImportResultSummary({
      machinesImported: importPreviewData.machinesFound,
      laserHeadsImported: importPreviewData.laserHeadsFound,
      existingMatched: importPreviewData.existingMatched,
      newMachines: importPreviewData.newMachines,
      skippedUnmatched: importPreviewData.skippedUnmatched || 0,
      warnings: importPreviewData.warnings
    });

    setImportPreviewModalOpen(false);
    setImportResultModalOpen(true);
  };

  const handleExportJson = () => {
    LaserEngine.exportLaserLifecycleJson(machines);
  };

  // Handlers for Physical Meter Verification
  const handleOpenVerifyModal = (lm: LaserMetrics) => {
    setTargetLaserMetrics(lm);
    setPhysicalMeterInput(String(lm.estimatedCurrentHour ?? lm.baseLaserHour ?? 12000));
    setVerifyDateInput(new Date().toISOString().split('T')[0]);
    setVerifyTimeInput(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    setVerifyReason('Scheduled Preventive Maintenance Verification');
    setIsVerifyModalOpen(true);
  };

  const handleConfirmRecalibration = () => {
    if (!selectedMachine || !targetLaserMetrics) return;
    const actualHour = parseFloat(physicalMeterInput);
    if (isNaN(actualHour) || actualHour < 0) {
      showAlert('Please enter a valid non-negative physical meter reading.');
      return;
    }

    const timestampStr = `${verifyDateInput}T${verifyTimeInput}:00`;
    const timestamp = new Date(timestampStr);

    const updatedMachine = LaserEngine.executeRecalibration(
      selectedMachine,
      targetLaserMetrics.id,
      actualHour,
      verifyReason || 'Meter Verification',
      timestamp
    );

    if (onEditMachine) {
      onEditMachine(updatedMachine);
    }

    setIsVerifyModalOpen(false);
    showAlert(`Physical meter verified and recalibrated to ${actualHour.toLocaleString()} hrs!`);
  };

  // Handlers for Laser Config Modal
  const handleOpenConfigModal = (lm: LaserMetrics) => {
    const lh = (selectedMachine.lasers || selectedMachine.laserHeads || []).find(l => l.id === lm.id);
    setConfigLaserHead(lh || {
      id: lm.id,
      name: lm.name,
      serialNo: lm.serialNo,
      baseLaserHour: lm.baseLaserHour,
      baseTimestamp: lm.baseTimestamp,
      ratedLife: lm.ratedLife,
      warningLife: lm.warningLife,
      contingencyCeiling: lm.contingencyCeiling,
      calibrationHistory: lm.calibrationHistory
    });
    setConfigName(lm.name);
    setConfigSerial(lm.serialNo);
    setConfigBaseHour(lm.baseLaserHour !== null && lm.baseLaserHour !== undefined ? String(lm.baseLaserHour) : '');
    setConfigBaseTimestamp(lm.baseTimestamp || '');
    setConfigRatedLife(String(lm.ratedLife));
    setConfigWarningLife(String(lm.warningLife));
    setConfigContingency(String(lm.contingencyCeiling));
    setIsConfigModalOpen(true);
  };

  const handleSaveLaserConfig = () => {
    if (!selectedMachine || !configLaserHead) return;
    const updatedLaserHead: LaserHeadDomain = {
      ...configLaserHead,
      name: configName.trim() || 'Laser Head',
      serialNo: configSerial.trim() || 'SN-UNKNOWN',
      baseLaserHour: configBaseHour.trim() !== '' ? parseFloat(configBaseHour) : null,
      baseTimestamp: configBaseTimestamp.trim() !== '' ? configBaseTimestamp : null,
      ratedLife: parseFloat(configRatedLife) || 25000,
      warningLife: parseFloat(configWarningLife) || 20000,
      contingencyCeiling: parseFloat(configContingency) || 30000
    };

    const updatedMachine = LaserEngine.updateLaserInMachine(selectedMachine, configLaserHead.id, updatedLaserHead);
    if (onEditMachine) {
      onEditMachine(updatedMachine);
    }
    setIsConfigModalOpen(false);
    showAlert(`Laser head "${updatedLaserHead.name}" configuration updated.`);
  };

  const handleDeleteLaserHead = () => {
    if (!selectedMachine || !configLaserHead) return;
    const lasers = selectedMachine.lasers || selectedMachine.laserHeads || [];
    if (lasers.length <= 1) {
      showAlert('Cannot delete laser head. Machines must have at least one laser head.');
      return;
    }
    const updatedLasers = lasers.filter(l => l.id !== configLaserHead.id);
    const updatedMachine = {
      ...selectedMachine,
      lasers: updatedLasers,
      laserHeads: updatedLasers
    };
    if (onEditMachine) {
      onEditMachine(updatedMachine);
    }
    setIsConfigModalOpen(false);
    showAlert(`Laser head deleted.`);
  };

  // Handlers for Add Laser Modal
  const handleOpenAddLaser = () => {
    if (!selectedMachine) return;
    const currentCount = (selectedMachine.lasers || selectedMachine.laserHeads || []).length;
    setAddLaserName(`Laser Head #${currentCount + 1}`);
    setAddLaserSerial(`LZR-${selectedMachine.machineNumber ? selectedMachine.machineNumber.replace('MCH-', '') : '01'}-0${currentCount + 1}`);
    setAddLaserBaseHour('10000');
    setAddLaserBaseDate(new Date().toISOString().split('T')[0]);
    setAddLaserBaseTime('09:00');
    setAddLaserRatedLife('25000');
    setIsAddLaserModalOpen(true);
  };

  const handleSaveAddLaser = () => {
    if (!selectedMachine) return;
    const baseHr = parseFloat(addLaserBaseHour);
    const baseTs = `${addLaserBaseDate}T${addLaserBaseTime}:00`;
    const newLaserHead: LaserHeadDomain = {
      id: `lh-${Date.now()}`,
      name: addLaserName.trim() || 'Laser Head',
      serialNo: addLaserSerial.trim() || 'SN-GENERIC',
      baseLaserHour: !isNaN(baseHr) ? baseHr : 10000,
      baseTimestamp: baseTs,
      ratedLife: parseFloat(addLaserRatedLife) || 25000,
      warningLife: (parseFloat(addLaserRatedLife) || 25000) * 0.8,
      contingencyCeiling: (parseFloat(addLaserRatedLife) || 25000) * 1.2,
      calibrationHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          estimatedHour: !isNaN(baseHr) ? baseHr : 10000,
          actualHour: !isNaN(baseHr) ? baseHr : 10000,
          difference: 0,
          reason: 'Initial Baseline Set',
          rating: 'Initial Baseline'
        }
      ]
    };

    const updatedMachine = LaserEngine.addLaserToMachine(selectedMachine, newLaserHead);
    if (onEditMachine) {
      onEditMachine(updatedMachine);
    }
    setIsAddLaserModalOpen(false);
    showAlert(`New laser head "${newLaserHead.name}" added to machine.`);
  };

  const customerSource = propsCustomers || [];

  // Toast / System Alert Notice
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  const showAlert = (msg: string) => {
    setSystemAlert(msg);
    setTimeout(() => setSystemAlert(null), 4000);
  };

  // Derive aggregated Customer Workspace Accounts
  const customers = React.useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      site: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      machineCount: number;
      avgHealth: number;
      pmDueCount: number;
      criticalAlerts: number;
      status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
    }>();

    // Seed customer records from authoritative customerSource
    customerSource.forEach((c) => {
      map.set(c.id, {
        id: c.id,
        name: c.name,
        site: c.industry || 'Global Cleanroom Operations',
        contactPerson: c.contactPerson,
        email: c.email,
        phone: c.phone,
        machineCount: 0,
        avgHealth: 0,
        pmDueCount: 0,
        criticalAlerts: 0,
        status: 'OPTIMAL'
      });
    });

    // Populate machine stats
    machines.forEach((m) => {
      let item = map.get(m.customerId);
      if (!item && m.customerName) {
        item = Array.from(map.values()).find(
          (c) => c.name.toLowerCase() === m.customerName.toLowerCase()
        );
      }
      if (!item) {
        // Authoritative reconciliation in App.tsx / StorageService guarantees records;
        // do not synthesize a ghost customer from stale machine names.
        return;
      }

      item.machineCount += 1;
      item.avgHealth += m.healthScore;
      if (m.status === 'NEEDS_CALIBRATION' || m.status === 'MAINTENANCE_DUE') {
        item.pmDueCount += 1;
      }
      if (m.status === 'OUT_OF_SERVICE' || m.healthScore < 70) {
        item.criticalAlerts += 1;
      }
      if (m.plantName && item.site === 'Global Cleanroom Operations') {
        item.site = m.plantName;
      }
    });

    // Normalize averages and statuses
    map.forEach((item) => {
      if (item.machineCount > 0) {
        item.avgHealth = Math.round(item.avgHealth / item.machineCount);
      } else {
        item.avgHealth = 100;
      }
      if (item.criticalAlerts > 0) {
        item.status = 'CRITICAL';
      } else if (item.pmDueCount > 0 || item.avgHealth < 85) {
        item.status = 'WARNING';
      } else {
        item.status = 'OPTIMAL';
      }
    });

    return Array.from(map.values());
  }, [customerSource, machines]);

  // Active Selected Customer State
  const [activeCustomerId, setActiveCustomerId] = useState<string>(() => {
    return selectedMachine?.customerId || customerSource[0]?.id || '';
  });

  // Sync active customer if selectedMachine changes externally
  React.useEffect(() => {
    if (selectedMachine?.customerId && customerSource.some(c => c.id === selectedMachine.customerId)) {
      setActiveCustomerId(selectedMachine.customerId);
    }
  }, [selectedMachine?.id, selectedMachine?.customerId, customerSource]);

  const activeCustomer = customers.find((c) => c.id === activeCustomerId) || customers[0];

  // Filter machines for selected customer
  const filteredMachines = sortedMachines.filter(
    (m) => m.customerId === activeCustomerId || m.customerName === activeCustomer?.name
  );

  // Handle customer switching
  const handleSelectCustomer = (custId: string) => {
    setActiveCustomerId(custId);
    const targetCust = customers.find((c) => c.id === custId);
    const custMachines = sortedMachines.filter(
      (m) => m.customerId === custId || m.customerName === targetCust?.name
    );
    if (custMachines.length > 0) {
      if (!custMachines.some((m) => m.id === selectedMachine?.id)) {
        onSelectMachine(custMachines[0].id);
      }
    }
  };

  // Customer Card Action Dropdown State
  const [activeCustomerMenuId, setActiveCustomerMenuId] = useState<string | null>(null);
  // Machine Card Action Dropdown State
  const [activeMachineCardMenuId, setActiveMachineCardMenuId] = useState<string | null>(null);

  // Machine Photo Handlers
  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMachine) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const updatedPhotos = [...(selectedMachine.photos || []), result];
        if (onEditMachine) {
          onEditMachine({ ...selectedMachine, photos: updatedPhotos });
        }
        showAlert('New machine photo uploaded successfully.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReplacePhoto = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMachine) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const updatedPhotos = [...(selectedMachine.photos || [])];
        updatedPhotos[index] = result;
        if (onEditMachine) {
          onEditMachine({ ...selectedMachine, photos: updatedPhotos });
        }
        showAlert('Machine photo updated successfully.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    if (!selectedMachine) return;
    const updatedPhotos = (selectedMachine.photos || []).filter((_, i) => i !== index);
    if (onEditMachine) {
      onEditMachine({ ...selectedMachine, photos: updatedPhotos });
    }
    showAlert('Machine photo removed.');
  };

  // Customer CRUD Modals State
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [isRenameCustomerModalOpen, setIsRenameCustomerModalOpen] = useState(false);
  const [isDeleteCustomerModalOpen, setIsDeleteCustomerModalOpen] = useState(false);

  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Customer Form State
  const [custForm, setCustForm] = useState({
    name: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: ''
  });

  // Customer Actions Handlers
  const handleOpenAddCustomer = () => {
    setCustForm({
      name: '',
      industry: 'Semiconductor & Optics Facility',
      contactPerson: 'Lead Operations Engineer',
      email: 'ops@cleanroom.com',
      phone: '+1 (555) 019-2831'
    });
    setIsAddCustomerModalOpen(true);
  };

  const handleSaveAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name.trim()) return;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: custForm.name.trim(),
      industry: custForm.industry.trim() || 'Precision Laser Cleanroom',
      contactPerson: custForm.contactPerson.trim() || 'Lead Operations Engineer',
      email: custForm.email.trim() || 'ops@cleanroom.com',
      phone: custForm.phone.trim() || '+1 (555) 019-2831',
      plantsCount: 1,
      activeContractsCount: 1
    };
    if (onAddCustomer) onAddCustomer(newCust);
    setActiveCustomerId(newCust.id);
    setIsAddCustomerModalOpen(false);
    showAlert(`Customer account "${newCust.name}" created successfully.`);
  };

  const handleOpenEditCustomer = (c: any) => {
    const realCust = customerSource.find((cust) => cust.id === c.id || cust.name === c.name);
    const target: Customer = realCust || {
      id: c.id,
      name: c.name || '',
      industry: c.site || c.industry || 'Precision Laser Facility',
      contactPerson: c.contactPerson || 'Lead Operations Engineer',
      email: c.email || 'ops@cleanroom.com',
      phone: c.phone || '+1 (555) 019-2831',
      plantsCount: 1,
      activeContractsCount: 1
    };
    setCustomerToEdit(target);
    setCustForm({
      name: target.name || '',
      industry: target.industry || '',
      contactPerson: target.contactPerson || '',
      email: target.email || '',
      phone: target.phone || ''
    });
    setIsEditCustomerModalOpen(true);
  };

  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToEdit || !custForm.name.trim()) return;
    const updatedName = custForm.name.trim();
    const updatedCust: Customer = {
      ...customerToEdit,
      name: updatedName,
      industry: custForm.industry.trim(),
      contactPerson: custForm.contactPerson.trim(),
      email: custForm.email.trim(),
      phone: custForm.phone.trim()
    };
    if (onEditCustomer) onEditCustomer(updatedCust);
    setIsEditCustomerModalOpen(false);
    showAlert(`Customer account "${updatedName}" updated successfully.`);
  };

  const handleOpenRenameCustomer = (c: any) => {
    const realCust = customerSource.find((cust) => cust.id === c.id || cust.name === c.name);
    const target: Customer = realCust || {
      id: c.id,
      name: c.name || '',
      industry: c.site || c.industry || 'Precision Laser Facility',
      contactPerson: c.contactPerson || 'Lead Operations Engineer',
      email: c.email || 'ops@cleanroom.com',
      phone: c.phone || '+1 (555) 019-2831',
      plantsCount: 1,
      activeContractsCount: 1
    };
    setCustomerToEdit(target);
    setCustForm((prev) => ({ ...prev, name: target.name }));
    setIsRenameCustomerModalOpen(true);
  };

  const handleSaveRenameCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToEdit || !custForm.name.trim()) return;
    const updatedName = custForm.name.trim();
    const updatedCust: Customer = { ...customerToEdit, name: updatedName };
    if (onEditCustomer) onEditCustomer(updatedCust);
    setIsRenameCustomerModalOpen(false);
    showAlert(`Customer account renamed to "${updatedName}".`);
  };

  const handleOpenDeleteCustomer = (c: Customer) => {
    setCustomerToDelete(c);
    setIsDeleteCustomerModalOpen(true);
  };

  const handleConfirmDeleteCustomer = () => {
    if (!customerToDelete) return;
    const deletedId = customerToDelete.id;
    const deletedName = customerToDelete.name;

    // Check if customer has assigned machines
    const assignedMachines = machines.filter(
      (m) => m.customerId === deletedId || m.customerName === deletedName
    );

    if (assignedMachines.length > 0) {
      showAlert(
        `Cannot delete customer "${deletedName}". ${assignedMachines.length} machine(s) are assigned to this customer. Delete or reassign all machines first.`
      );
      setIsDeleteCustomerModalOpen(false);
      return;
    }

    if (onDeleteCustomer) onDeleteCustomer(deletedId);

    if (activeCustomerId === deletedId) {
      const remaining = customerSource.filter((c) => c.id !== deletedId);
      if (remaining.length > 0) {
        setActiveCustomerId(remaining[0].id);
      }
    }
    setIsDeleteCustomerModalOpen(false);
    showAlert(`Customer account "${deletedName}" deleted.`);
  };

  const handleArchiveCustomer = (c: Customer) => {
    showAlert(`Customer account "${c.name}" marked as archived (placeholder).`);
  };

  // Action Menu Dropdown State
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  // Modal Visibility States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFanOutModalOpen, setIsFanOutModalOpen] = useState(false);

  // Helper for MHC / Calibration Specifications
  const hasConfiguredMhcSpecs = (m?: Machine): boolean => {
    if (!m || !m.mhcSpecs) return false;
    return (
      (m.mhcSpecs.laserPower?.targetPowerWatts !== undefined && m.mhcSpecs.laserPower.targetPowerWatts !== null) ||
      (m.mhcSpecs.laserPower?.powerTolerancePercent !== undefined && m.mhcSpecs.laserPower.powerTolerancePercent !== null) ||
      Boolean(m.mhcSpecs.beamProfile?.profileMode) ||
      (m.mhcSpecs.stageCalibration?.toleranceUm !== undefined && m.mhcSpecs.stageCalibration.toleranceUm !== null) ||
      (m.mhcSpecs.agcCalibration?.toleranceUm !== undefined && m.mhcSpecs.agcCalibration.toleranceUm !== null) ||
      (m.mhcSpecs.temperatureCooling?.targetTempCelsius !== undefined && m.mhcSpecs.temperatureCooling.targetTempCelsius !== null) ||
      (m.mhcSpecs.temperatureCooling?.tempToleranceCelsius !== undefined && m.mhcSpecs.temperatureCooling.tempToleranceCelsius !== null)
    );
  };

  const copyMhcSpecsFromMachine = (sourceMch: Machine, targetForm: 'add' | 'edit') => {
    if (!sourceMch.mhcSpecs) return;
    const specs = sourceMch.mhcSpecs;
    const specFields = {
      mhcLaserTargetPower: specs.laserPower?.targetPowerWatts !== undefined && specs.laserPower.targetPowerWatts !== null ? String(specs.laserPower.targetPowerWatts) : '',
      mhcLaserPowerTolerance: specs.laserPower?.powerTolerancePercent !== undefined && specs.laserPower.powerTolerancePercent !== null ? String(specs.laserPower.powerTolerancePercent) : '',
      mhcBeamProfileMode: specs.beamProfile?.profileMode || '',
      mhcStageTolerance: specs.stageCalibration?.toleranceUm !== undefined && specs.stageCalibration.toleranceUm !== null ? String(specs.stageCalibration.toleranceUm) : '',
      mhcAgcTolerance: specs.agcCalibration?.toleranceUm !== undefined && specs.agcCalibration.toleranceUm !== null ? String(specs.agcCalibration.toleranceUm) : '',
      mhcTargetTemp: specs.temperatureCooling?.targetTempCelsius !== undefined && specs.temperatureCooling.targetTempCelsius !== null ? String(specs.temperatureCooling.targetTempCelsius) : '',
      mhcTempTolerance: specs.temperatureCooling?.tempToleranceCelsius !== undefined && specs.temperatureCooling.tempToleranceCelsius !== null ? String(specs.temperatureCooling.tempToleranceCelsius) : ''
    };

    if (targetForm === 'add') {
      setAddForm(prev => ({ ...prev, ...specFields }));
    } else {
      setEditForm(prev => ({ ...prev, ...specFields }));
    }

    showAlert(`Copied baseline specifications from ${sourceMch.machineNumber || sourceMch.model}.`);
  };

  // Fan-Out Modal State & Handlers
  const [fanOutTargetIds, setFanOutTargetIds] = useState<string[]>([]);
  const [fanOutFilter, setFanOutFilter] = useState('');
  const [fanOutConfirmOverwrite, setFanOutConfirmOverwrite] = useState(false);

  const handleOpenFanOut = () => {
    if (!selectedMachine) return;
    setFanOutTargetIds([]);
    setFanOutFilter('');
    setFanOutConfirmOverwrite(false);
    setIsFanOutModalOpen(true);
  };

  const handleToggleFanOutTarget = (id: string) => {
    setFanOutTargetIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleApplyFanOut = () => {
    if (!selectedMachine || fanOutTargetIds.length === 0) return;
    const overwritingCount = machines.filter(
      m => m.id !== selectedMachine.id && fanOutTargetIds.includes(m.id) && hasConfiguredMhcSpecs(m)
    ).length;

    if (overwritingCount > 0 && !fanOutConfirmOverwrite) {
      showAlert(`Please confirm overwriting specifications for ${overwritingCount} machine(s).`);
      return;
    }

    const sourceSpecs = selectedMachine.mhcSpecs ? JSON.parse(JSON.stringify(selectedMachine.mhcSpecs)) : undefined;

    const updatedMachines = machines.map(m => {
      if (fanOutTargetIds.includes(m.id)) {
        return {
          ...m,
          mhcSpecs: sourceSpecs ? JSON.parse(JSON.stringify(sourceSpecs)) : undefined
        };
      }
      return m;
    });

    if (onBatchImportMachines) {
      onBatchImportMachines(updatedMachines);
    } else {
      StorageService.saveMachines(updatedMachines);
    }

    setIsFanOutModalOpen(false);
    showAlert(`MHC specifications successfully copied to ${fanOutTargetIds.length} machine(s).`);
  };

  const buildMhcSpecsFromForm = (form: {
    mhcLaserTargetPower?: string;
    mhcLaserPowerTolerance?: string;
    mhcBeamProfileMode?: string;
    mhcStageTolerance?: string;
    mhcAgcTolerance?: string;
    mhcTargetTemp?: string;
    mhcTempTolerance?: string;
  }): MachineMhcSpecs | undefined => {
    const hasLaserTarget = (form.mhcLaserTargetPower || '').trim() !== '';
    const hasLaserTol = (form.mhcLaserPowerTolerance || '').trim() !== '';
    const hasBeamMode = (form.mhcBeamProfileMode || '').trim() !== '';
    const hasStageTol = (form.mhcStageTolerance || '').trim() !== '';
    const hasAgcTol = (form.mhcAgcTolerance || '').trim() !== '';
    const hasTempTarget = (form.mhcTargetTemp || '').trim() !== '';
    const hasTempTol = (form.mhcTempTolerance || '').trim() !== '';

    if (!hasLaserTarget && !hasLaserTol && !hasBeamMode && !hasStageTol && !hasAgcTol && !hasTempTarget && !hasTempTol) {
      return undefined;
    }

    const specs: MachineMhcSpecs = {};

    if (hasLaserTarget || hasLaserTol) {
      specs.laserPower = {
        targetPowerWatts: hasLaserTarget ? parseFloat(form.mhcLaserTargetPower!) : undefined,
        powerTolerancePercent: hasLaserTol ? parseFloat(form.mhcLaserPowerTolerance!) : undefined
      };
    }

    if (hasBeamMode) {
      specs.beamProfile = {
        profileMode: form.mhcBeamProfileMode!.trim()
      };
    }

    if (hasStageTol) {
      specs.stageCalibration = {
        toleranceUm: parseFloat(form.mhcStageTolerance!)
      };
    }

    if (hasAgcTol) {
      specs.agcCalibration = {
        toleranceUm: parseFloat(form.mhcAgcTolerance!)
      };
    }

    if (hasTempTarget || hasTempTol) {
      specs.temperatureCooling = {
        targetTempCelsius: hasTempTarget ? parseFloat(form.mhcTargetTemp!) : undefined,
        tempToleranceCelsius: hasTempTol ? parseFloat(form.mhcTempTolerance!) : undefined
      };
    }

    return specs;
  };

  // Form States
  const [addForm, setAddForm] = useState({
    model: '',
    machineNumber: '',
    serialNumber: '',
    customerName: '',
    plantName: '',
    productionLineName: '',
    zone: '',
    status: 'OPERATIONAL' as Machine['status'],
    healthScore: 98,
    installationDate: new Date().toISOString().split('T')[0],
    baselineDate: new Date().toISOString().split('T')[0],
    laserHeadModel: 'TruPulse 2000 Main Oscillator',
    mhcLaserTargetPower: '',
    mhcLaserPowerTolerance: '',
    mhcBeamProfileMode: '',
    mhcStageTolerance: '',
    mhcAgcTolerance: '',
    mhcTargetTemp: '',
    mhcTempTolerance: ''
  });

  const [editForm, setEditForm] = useState({
    model: '',
    machineNumber: '',
    serialNumber: '',
    customerName: '',
    plantName: '',
    productionLineName: '',
    zone: '',
    status: 'OPERATIONAL' as Machine['status'],
    healthScore: 100,
    installationDate: '',
    baselineDate: '',
    mhcLaserTargetPower: '',
    mhcLaserPowerTolerance: '',
    mhcBeamProfileMode: '',
    mhcStageTolerance: '',
    mhcAgcTolerance: '',
    mhcTargetTemp: '',
    mhcTempTolerance: ''
  });

  const [renameForm, setRenameForm] = useState({
    model: '',
    machineNumber: '',
    serialNumber: ''
  });

  const machineMhcs = selectedMachine ? mhcRecords.filter((r) => r.machineId === selectedMachine.id) : [];

  // Fleet Navigator Handlers
  const currentIndex = selectedMachine ? machines.findIndex((m) => m.id === selectedMachine.id) : -1;
  const handlePrevMachine = () => {
    if (machines.length === 0 || !selectedMachine) return;
    const prevIdx = (currentIndex - 1 + machines.length) % machines.length;
    onSelectMachine(machines[prevIdx].id);
  };

  const handleNextMachine = () => {
    if (machines.length === 0 || !selectedMachine) return;
    const nextIdx = (currentIndex + 1) % machines.length;
    onSelectMachine(machines[nextIdx].id);
  };

  const handleDuplicateMachine = () => {
    if (!selectedMachine) return;
    const duplicate: Machine = {
      ...selectedMachine,
      id: `mch-${Date.now()}`,
      machineNumber: `${selectedMachine.machineNumber}-COPY`,
      serialNumber: `SN-COPY-${Math.floor(100000 + Math.random() * 900000)}`,
      model: `${selectedMachine.model} (Copy)`
    };
    if (onAddMachine) {
      onAddMachine(duplicate);
    }
    onSelectMachine(duplicate.id);
    setIsActionMenuOpen(false);
  };

  const handleArchiveMachine = () => {
    if (!selectedMachine) return;
    const archived: Machine = {
      ...selectedMachine,
      status: 'OUT_OF_SERVICE'
    };
    if (onEditMachine) {
      onEditMachine(archived);
    }
    setIsActionMenuOpen(false);
    showAlert(`Machine ${selectedMachine.machineNumber} status changed to OUT_OF_SERVICE.`);
  };

  // Handlers
  const handleOpenAdd = () => {
    const activeCust = customerSource.find((c) => c.id === activeCustomerId) || customerSource[0];
    setAddForm({
      model: '',
      machineNumber: `MCH-${Math.floor(100 + Math.random() * 900)}`,
      serialNumber: `SN-TRU-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: activeCust?.name || selectedMachine?.customerName || '',
      plantName: activeCust?.site || selectedMachine?.plantName || '',
      productionLineName: selectedMachine?.productionLineName || '',
      zone: selectedMachine?.zone || '',
      status: 'OPERATIONAL',
      healthScore: 98,
      installationDate: new Date().toISOString().split('T')[0],
      baselineDate: new Date().toISOString().split('T')[0],
      laserHeadModel: 'TruPulse 2000 Main Oscillator',
      mhcLaserTargetPower: '',
      mhcLaserPowerTolerance: '',
      mhcBeamProfileMode: '',
      mhcStageTolerance: '',
      mhcAgcTolerance: '',
      mhcTargetTemp: '',
      mhcTempTolerance: ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const activeCust = customerSource.find((c) => c.id === activeCustomerId) || customerSource[0];
    const targetCustId = activeCust?.id || '';
    const targetCustName = addForm.customerName || activeCust?.name || 'Customer Account';

    const newMachine: Machine = {
      id: `mch-${Date.now()}`,
      customerId: targetCustId,
      customerName: targetCustName,
      plantId: addForm.plantName ? `plant-${addForm.plantName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '',
      plantName: addForm.plantName || activeCust?.site || '',
      productionLineId: addForm.productionLineName ? `line-${addForm.productionLineName.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '',
      productionLineName: addForm.productionLineName || '',
      zone: addForm.zone || '',
      model: addForm.model || 'Laser System',
      machineNumber: addForm.machineNumber || `MCH-${Math.floor(100 + Math.random() * 900)}`,
      machineNo: addForm.machineNumber || `MCH-${Math.floor(100 + Math.random() * 900)}`,
      serialNumber: addForm.serialNumber || `SN-${Date.now().toString().slice(-8)}`,
      serialNo: addForm.serialNumber || `SN-${Date.now().toString().slice(-8)}`,
      installationDate: addForm.installationDate,
      baselineDate: addForm.baselineDate,
      healthScore: Number(addForm.healthScore) || 98,
      status: addForm.status,
      mhcSpecs: buildMhcSpecsFromForm(addForm),
      photos: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
      ],
      lastMhcDate: new Date().toISOString().split('T')[0],
      nextMhcDate: '2026-10-15',
      laserHeads: [
        {
          id: `lh-${Date.now()}-1`,
          model: addForm.laserHeadModel || 'Main Laser Head',
          serialNumber: `LH-SN-${Math.floor(1000 + Math.random() * 9000)}`,
          runningHours: 0,
          maxRecommendedHours: 10000,
          remainingHours: 10000,
          healthScore: 100,
          wavelengthNm: 1064,
          beamQualityM2: 1.08,
          estimatedReplacementDate: '2029-01-15'
        }
      ],
      consumables: [
        {
          id: `con-${Date.now()}-1`,
          name: 'Fused Silica Protective Window',
          partNumber: 'FS-OPT-9941',
          currentLifePercent: 95,
          lastReplacedDate: new Date().toISOString().split('T')[0],
          status: 'OPTIMAL',
          estimatedDaysRemaining: 180
        },
        {
          id: `con-${Date.now()}-2`,
          name: 'DI Water Cooling Ion Filter',
          partNumber: 'FLT-CW-302',
          currentLifePercent: 90,
          lastReplacedDate: new Date().toISOString().split('T')[0],
          status: 'OPTIMAL',
          estimatedDaysRemaining: 120
        }
      ]
    };

    if (onAddMachine) {
      onAddMachine(newMachine);
    }
    setActiveCustomerId(targetCustId);
    onSelectMachine(newMachine.id);
    setIsAddModalOpen(false);
    showAlert(`New machine "${newMachine.model}" added under ${targetCustName}.`);
  };

  const handleOpenEdit = () => {
    if (!selectedMachine) return;
    setEditForm({
      model: selectedMachine.model || '',
      machineNumber: selectedMachine.machineNumber || '',
      serialNumber: selectedMachine.serialNumber || '',
      customerName: selectedMachine.customerName || '',
      plantName: selectedMachine.plantName || '',
      productionLineName: selectedMachine.productionLineName || '',
      zone: selectedMachine.zone || '',
      status: selectedMachine.status || 'OPERATIONAL',
      healthScore: selectedMachine.healthScore || 100,
      installationDate: selectedMachine.installationDate || '',
      baselineDate: selectedMachine.baselineDate || '',
      mhcLaserTargetPower: selectedMachine.mhcSpecs?.laserPower?.targetPowerWatts !== undefined && selectedMachine.mhcSpecs.laserPower.targetPowerWatts !== null ? String(selectedMachine.mhcSpecs.laserPower.targetPowerWatts) : '',
      mhcLaserPowerTolerance: selectedMachine.mhcSpecs?.laserPower?.powerTolerancePercent !== undefined && selectedMachine.mhcSpecs.laserPower.powerTolerancePercent !== null ? String(selectedMachine.mhcSpecs.laserPower.powerTolerancePercent) : '',
      mhcBeamProfileMode: selectedMachine.mhcSpecs?.beamProfile?.profileMode || '',
      mhcStageTolerance: selectedMachine.mhcSpecs?.stageCalibration?.toleranceUm !== undefined && selectedMachine.mhcSpecs.stageCalibration.toleranceUm !== null ? String(selectedMachine.mhcSpecs.stageCalibration.toleranceUm) : '',
      mhcAgcTolerance: selectedMachine.mhcSpecs?.agcCalibration?.toleranceUm !== undefined && selectedMachine.mhcSpecs.agcCalibration.toleranceUm !== null ? String(selectedMachine.mhcSpecs.agcCalibration.toleranceUm) : '',
      mhcTargetTemp: selectedMachine.mhcSpecs?.temperatureCooling?.targetTempCelsius !== undefined && selectedMachine.mhcSpecs.temperatureCooling.targetTempCelsius !== null ? String(selectedMachine.mhcSpecs.temperatureCooling.targetTempCelsius) : '',
      mhcTempTolerance: selectedMachine.mhcSpecs?.temperatureCooling?.tempToleranceCelsius !== undefined && selectedMachine.mhcSpecs.temperatureCooling.tempToleranceCelsius !== null ? String(selectedMachine.mhcSpecs.temperatureCooling.tempToleranceCelsius) : ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    const updated: Machine = {
      ...selectedMachine,
      model: editForm.model,
      machineNumber: editForm.machineNumber,
      machineNo: editForm.machineNumber,
      serialNumber: editForm.serialNumber,
      serialNo: editForm.serialNumber,
      customerName: editForm.customerName,
      plantName: editForm.plantName,
      productionLineName: editForm.productionLineName,
      zone: editForm.zone,
      status: editForm.status,
      healthScore: Number(editForm.healthScore),
      installationDate: editForm.installationDate,
      baselineDate: editForm.baselineDate,
      mhcSpecs: buildMhcSpecsFromForm(editForm)
    };

    if (onEditMachine) {
      onEditMachine(updated);
    }
    setIsEditModalOpen(false);
  };

  const handleOpenRename = () => {
    if (!selectedMachine) return;
    setRenameForm({
      model: selectedMachine.model || '',
      machineNumber: selectedMachine.machineNumber || '',
      serialNumber: selectedMachine.serialNumber || ''
    });
    setIsRenameModalOpen(true);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    const updated: Machine = {
      ...selectedMachine,
      model: renameForm.model,
      machineNumber: renameForm.machineNumber,
      machineNo: renameForm.machineNumber,
      serialNumber: renameForm.serialNumber,
      serialNo: renameForm.serialNumber
    };

    if (onEditMachine) {
      onEditMachine(updated);
    }
    setIsRenameModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (selectedMachine && onDeleteMachine) {
      onDeleteMachine(selectedMachine.id);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <motion.div 
      className="space-y-6 pb-12"
      variants={createStaggerContainerVariants(0.04, shouldReduceMotion)}
      initial="hidden"
      animate="visible"
    >
      {/* System Toast / Alert Banner */}
      <AnimatePresence>
        {systemAlert && (
          <motion.div 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
            transition={{ duration: motionTimings.quick, ease: motionEasings.responsive }}
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-md ${
              isDark ? 'bg-indigo-950/80 border-[#8B9DFF]/40 text-[#8B9DFF]' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{systemAlert}</span>
            </div>
            <button
              onClick={() => setSystemAlert(null)}
              className="p-1 hover:opacity-75 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fleet Navigator / Context Bar */}
      <motion.div 
        variants={createFadeSlideVariants({ direction: 'down', distance: 'component', prefersReducedMotion: shouldReduceMotion })}
        className={`p-4 rounded-xl border space-y-3.5 ${
          isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Top Row: Customer Selection + Utility Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Customer Account Switcher */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
              <Building2 className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Customer:</span>
            </div>

            <div className="relative inline-block">
              <select
                value={activeCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                aria-label="Select Customer Account"
                className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg border appearance-none pr-8 cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-[#1C2026] text-white border-[#3D4754] hover:border-slate-400'
                    : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 shadow-2xs'
                }`}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.machineCount} {c.machineCount === 1 ? 'unit' : 'units'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>

            {activeCustomer?.site && (
              <span className={`text-[11px] font-mono hidden md:inline-flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <MapPin className="w-3 h-3 text-slate-400" />
                {activeCustomer.site}
              </span>
            )}

            {/* Customer Action Menu */}
            {activeCustomer && (
              <div className="relative inline-block">
                <motion.button
                  type="button"
                  aria-label="Customer options"
                  whileTap={shouldReduceMotion ? undefined : mechanicalPressConfig.subtleTap}
                  onClick={() => setActiveCustomerMenuId(activeCustomerMenuId === activeCustomer.id ? null : activeCustomer.id)}
                  className={`p-1.5 rounded-md border transition-colors ${
                    isDark
                      ? 'bg-[#1C2026] border-[#3D4754] text-slate-300 hover:text-white'
                      : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                  title="Customer Actions"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </motion.button>

                <AnimatePresence>
                  {activeCustomerMenuId === activeCustomer.id && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setActiveCustomerMenuId(null)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
                        transition={{ duration: motionTimings.quick, ease: motionEasings.responsive }}
                        className={`absolute left-0 top-8 w-48 rounded-xl border shadow-xl z-30 py-1 text-xs font-semibold ${
                          isDark
                            ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 divide-y divide-[#2B323A]'
                            : 'bg-white border-slate-200 text-slate-800 divide-y divide-slate-100'
                        }`}
                      >
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCustomerMenuId(null);
                              handleOpenEditCustomer(activeCustomer);
                            }}
                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${
                              isDark ? 'hover:bg-[#242A32] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                            Edit Customer Info
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCustomerMenuId(null);
                              handleOpenRenameCustomer(activeCustomer);
                            }}
                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${
                              isDark ? 'hover:bg-[#242A32] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <Type className="w-3.5 h-3.5 text-slate-400" />
                            Rename Customer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCustomerMenuId(null);
                              handleArchiveCustomer(activeCustomer);
                            }}
                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 ${
                              isDark ? 'hover:bg-[#242A32] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <Archive className="w-3.5 h-3.5 text-amber-500" />
                            Archive Account
                          </button>
                        </div>
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCustomerMenuId(null);
                              handleOpenDeleteCustomer(activeCustomer as any);
                            }}
                            className={`w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-500 ${
                              isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            Delete Customer
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            <motion.button
              type="button"
              whileHover={shouldReduceMotion ? undefined : mechanicalPressConfig.hover}
              whileTap={shouldReduceMotion ? undefined : mechanicalPressConfig.subtleTap}
              onClick={handleOpenAddCustomer}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors ${
                isDark
                  ? 'border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200'
                  : 'border-dashed border-slate-300 hover:border-slate-500 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3 h-3" />
              New Customer
            </motion.button>
          </div>

          {/* Right utility buttons */}
          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 px-3 font-sans"
            >
              Add Machine
            </Button>
          </div>
        </div>

        {/* Machine Quick Switcher Horizontal Pill Bar */}
        <div className="pt-2.5 border-t border-slate-200 dark:border-[#2B323A]/80">
          {filteredMachines.length === 0 ? (
            <div className="py-2 px-3 text-xs font-mono flex items-center justify-between text-slate-500">
              <span>No machines assigned to {activeCustomer?.name || 'this customer'}.</span>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="text-xs font-bold text-indigo-500 hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add first machine
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className={`text-[10px] font-mono uppercase tracking-wider shrink-0 font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Fleet ({filteredMachines.length}):
              </span>
              {filteredMachines.map((m) => {
                const isSelected = m.id === selectedMachine?.id;
                const healthStatus = LaserEngine.getMachineHealthStatus(m);
                return (
                  <motion.button
                    key={m.id}
                    type="button"
                    whileHover={shouldReduceMotion ? undefined : mechanicalPressConfig.hover}
                    whileTap={shouldReduceMotion ? undefined : mechanicalPressConfig.subtleTap}
                    onClick={() => onSelectMachine(m.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 shrink-0 transition-colors ${
                      isSelected
                        ? isDark
                          ? 'bg-[#242A32] border-[#3D4754] text-white shadow-xs font-bold'
                          : 'bg-white border-slate-400 text-slate-900 shadow-xs font-bold'
                        : isDark
                        ? 'bg-[#1C2026] border-[#2B323A] text-slate-400 hover:text-slate-200 hover:bg-[#242A32]'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      healthStatus === 'PASS'
                        ? 'bg-emerald-500'
                        : healthStatus === 'WARNING'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`} />
                    <span className="font-bold">{m.machineNumber || m.machineNo || m.id}</span>
                    <span className={`text-[10px] opacity-75 font-sans ${isSelected ? (isDark ? 'text-slate-300' : 'text-slate-700') : ''}`}>
                      {m.model}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Machine Passport Workspace / Empty State */}
      {!selectedMachine ? (
        passportSubTab === 'recommended_parts' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPassportSubTab('lifecycle')}
              >
                ← Back to Machine Fleet
              </Button>
            </div>
            <RecommendedPartsWorkspace initialFamilyFilter="ALL" />
          </div>
        ) : (
          <Card className="p-8 text-center space-y-4">
            <Cpu className="w-12 h-12 mx-auto text-slate-400 opacity-60" />
            <h2 className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              No Machine Selected
            </h2>
            <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Register a new laser machine asset, or manage the authoritative Recommended Parts catalog.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleOpenAdd}
              >
                Add Machine
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={<Package className="w-4 h-4 text-purple-400" />}
                onClick={() => setPassportSubTab('recommended_parts')}
              >
                Recommended Items Master
              </Button>
            </div>
          </Card>
        )
      ) : (
        <>
          {/* Selected Machine Identity Surface */}
          <motion.div 
            variants={createFadeSlideVariants({ direction: 'up', distance: 'component', prefersReducedMotion: shouldReduceMotion })}
            className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
              isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selectedMachine.id}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -4 }}
                transition={{ duration: motionTimings.quick, ease: motionEasings.responsive }}
              >
                {!shouldReduceMotion && (
                  <motion.div
                    key={`machine-datum-${selectedMachine.id}`}
                    initial={{ scaleX: 0, opacity: 0.75 }}
                    animate={{ scaleX: 1, opacity: 0 }}
                    transition={{ duration: motionTimings.deliberate, ease: motionEasings.smooth }}
                    className="absolute top-0 left-0 right-0 h-[2px] bg-sky-500 origin-left pointer-events-none"
                  />
                )}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Identity & Metadata */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                        isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        MACHINE PASSPORT
                      </span>
                      <Badge
                        variant={
                          selectedMachine.status === 'OPERATIONAL'
                            ? 'emerald'
                            : selectedMachine.status === 'NEEDS_CALIBRATION'
                            ? 'amber'
                            : 'rose'
                        }
                        size="sm"
                      >
                        {selectedMachine.status}
                      </Badge>
                      <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        SN: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{selectedMachine.serialNumber || selectedMachine.serialNo || 'N/A'}</strong>
                      </span>
                    </div>

                    <div>
                      <h1 className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {selectedMachine.machineNumber || selectedMachine.machineNo || selectedMachine.id}
                      </h1>
                      <div className={`flex items-center gap-2 mt-1.5 text-xs font-medium flex-wrap ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <span className={`font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {selectedMachine.model}
                        </span>
                        <span className="opacity-40">•</span>
                        <span>{selectedMachine.customerName}</span>
                        <span className="opacity-40">•</span>
                        <span>{selectedMachine.plantName || 'Cleanroom'}</span>
                        {selectedMachine.productionLineName && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="font-mono text-[11px]">{selectedMachine.productionLineName}</span>
                          </>
                        )}
                        {selectedMachine.zone ? (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="font-mono text-[11px]">Zone: {selectedMachine.zone}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Primary Operational Action & Management Dropdown */}
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-start lg:justify-end">
                    {/* Primary Action Button */}
                    <Button
                      variant="primary"
                      size="md"
                      icon={<Activity className="w-4 h-4" />}
                      onClick={() => onOpenMhcForMachine(selectedMachine.id)}
                      className="font-sans font-semibold"
                    >
                      {isResumableActive ? 'Continue Health Check' : 'Start Health Check'}
                    </Button>

                    {/* Machine Management Actions Menu */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="md"
                        icon={<Settings className="w-4 h-4" />}
                        onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                      >
                        Manage Machine
                      </Button>

                      <AnimatePresence>
                        {isActionMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setIsActionMenuOpen(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
                              transition={{ duration: motionTimings.quick, ease: motionEasings.responsive }}
                              className={`absolute right-0 mt-1.5 w-52 rounded-xl border shadow-xl z-30 py-1 text-xs font-medium ${
                                isDark
                                  ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 divide-y divide-[#2B323A]'
                                  : 'bg-white border-slate-200 text-slate-800 divide-y divide-slate-100 shadow-xl'
                              }`}
                            >
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsActionMenuOpen(false);
                                    handleOpenEdit();
                                  }}
                                  className={`w-full px-3 py-2 text-left flex items-center gap-2 ${
                                    isDark ? 'hover:bg-[#242A32] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                  Edit Machine & Specs
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsActionMenuOpen(false);
                                    handleOpenRename();
                                  }}
                                  className={`w-full px-3 py-2 text-left flex items-center gap-2 ${
                                    isDark ? 'hover:bg-[#242A32] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                >
                                  <Type className="w-3.5 h-3.5 text-slate-400" />
                                  Rename Asset
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsActionMenuOpen(false);
                                    handleOpenFanOut();
                                  }}
                                  className={`w-full px-3 py-2 text-left flex items-center gap-2 ${
                                    isDark ? 'hover:bg-[#242A32] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                >
                                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                  Fan-Out Specs to Fleet
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsActionMenuOpen(false);
                                    handleDuplicateMachine();
                                  }}
                                  className={`w-full px-3 py-2 text-left flex items-center gap-2 ${
                                    isDark ? 'hover:bg-[#242A32] hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  Duplicate Machine
                                </button>
                              </div>
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsActionMenuOpen(false);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className={`w-full px-3 py-2 text-left flex items-center gap-2 text-rose-500 ${
                                    isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  Delete Machine
                                </button>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Current State Summary Strip */}
                <div className={`mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono ${
                  isDark ? 'border-[#2B323A]/80' : 'border-slate-200'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Health Status</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${
                        LaserEngine.getMachineHealthStatus(selectedMachine) === 'PASS'
                          ? 'bg-emerald-500'
                          : LaserEngine.getMachineHealthStatus(selectedMachine) === 'WARNING'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`} />
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        {LaserEngine.getMachineHealthStatus(selectedMachine)} ({selectedMachine.healthScore}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Laser Configuration</span>
                    <span className={`font-bold block mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {machineMetrics.laserMetricsList.length} Head(s) Active
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Last MHC Inspection</span>
                    <span className={`font-bold block mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {selectedMachine.lastMhcDate || 'None recorded'}
                    </span>
                  </div>

                  <div>
                    <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Next MHC Target</span>
                    <span className={`font-bold block mt-0.5 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                      {selectedMachine.nextMhcDate || 'Unscheduled'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Spatial Machine Table or Active Subsystem Workspace */}
          {passportViewMode === 'table' ? (
            <MachinePassportTableView
              machine={selectedMachine}
              machineMetrics={machineMetrics}
              machineMhcs={machineMhcs}
              onSelectSubject={(sub) => {
                setPassportSubTab(sub);
                setPassportViewMode('workspace');
              }}
              isDark={isDark}
              onOpenMhc={() => onOpenMhcForMachine(selectedMachine.id)}
            />
          ) : (
            <div className="space-y-6">
              {/* Workspace Navigation & Return Header */}
              <div
                className={`p-3 sm:p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ArrowLeft className="w-4 h-4" />}
                    onClick={() => setPassportViewMode('table')}
                    className="font-sans font-bold text-xs h-8 px-3"
                  >
                    Back to Machine Table
                  </Button>
                  <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                  <div className="hidden sm:flex items-center gap-2 min-w-0 font-mono text-xs">
                    <span className="font-bold text-slate-400">
                      {selectedMachine.machineNumber || selectedMachine.id}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {passportSubTab === 'lifecycle'
                        ? 'Lifecycle & Health'
                        : passportSubTab === 'temperature'
                        ? 'Temperature'
                        : passportSubTab === 'laser_power'
                        ? 'Laser Power'
                        : passportSubTab === 'beam_profile'
                        ? 'Beam Profile'
                        : passportSubTab === 'focus_optimization'
                        ? 'Focus Optimization'
                        : passportSubTab === 'product_process'
                        ? 'Product & Process'
                        : 'Recommended Items'}
                    </span>
                  </div>
                </div>

                {/* Restored Flat Subject Navigation Pills */}
                <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
                  {[
                    { id: 'lifecycle', label: 'Lifecycle' },
                    { id: 'temperature', label: 'Temperature' },
                    { id: 'laser_power', label: 'Laser Power' },
                    { id: 'beam_profile', label: 'Beam Profile' },
                    { id: 'focus_optimization', label: 'Focus' },
                    { id: 'product_process', label: 'Product & Process' },
                    { id: 'recommended_parts', label: 'Recommended Items' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPassportSubTab(s.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors ${
                        passportSubTab === s.id
                          ? isDark
                            ? 'bg-[#242A32] text-white font-bold border border-[#3D4754]'
                            : 'bg-slate-200 text-slate-900 font-bold border border-slate-300'
                          : isDark
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-[#1C2026]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Subsystem Workspace Pane */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={passportSubTab}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
                  transition={{ duration: motionTimings.standard, ease: motionEasings.responsive }}
                  className="w-full"
                >
                  {passportSubTab === 'lifecycle' ? (
                  <div className="space-y-6">
                    {/* SECTION 1: PRIMARY MACHINE-LEVEL LIFECYCLE (LMS v2 Hierarchy) */}
                    <div className={`p-6 rounded-2xl border transition-all space-y-6 ${
                      isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
                    }`}>
                      {/* 1.1 Machine Identity & Lifecycle Header Strip */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`text-base font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                              {selectedMachine.machineNumber || selectedMachine.machineNo || 'MCH'}
                            </span>
                            <span className={`text-sm font-semibold truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              {selectedMachine.machineName || selectedMachine.name || 'Laser System'}
                            </span>
                            <Badge 
                              variant={
                                machineMetrics.status === 'SAFE' ? 'emerald' :
                                machineMetrics.status === 'WARNING' ? 'amber' :
                                machineMetrics.status === 'ALARM' ? 'rose' : 'amber'
                              }
                              size="sm"
                            >
                              {machineMetrics.status === 'BASELINE_REQUIRED' ? 'BASELINE REQUIRED' : machineMetrics.status}
                            </Badge>
                            <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium border ${
                              isDark ? 'bg-sky-950/40 text-sky-400 border-sky-800/60' : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}>
                              {machineMetrics.totalLasers} {machineMetrics.totalLasers === 1 ? 'Laser Head' : 'Laser Heads'}
                            </span>
                          </div>
                          <div className={`flex items-center gap-3 text-xs flex-wrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span>Model: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{selectedMachine.model || selectedMachine.laserModel || '—'}</strong></span>
                            <span>•</span>
                            <span>Serial: <strong className="font-mono text-slate-400">{selectedMachine.serialNumber || selectedMachine.serialNo || '—'}</strong></span>
                            <span>•</span>
                            <span>Customer: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{selectedMachine.customerName || 'Global Cleanroom'}</strong></span>
                          </div>
                        </div>

                        {/* Top Global Actions */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Upload className="w-3.5 h-3.5 text-slate-400" />}
                            onClick={handleTriggerImportFile}
                            className="text-xs h-8 px-3 font-sans"
                            title="Import Laser Monitor JSON"
                          >
                            Sync LMS
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Download className="w-3.5 h-3.5 text-slate-400" />}
                            onClick={handleExportJson}
                            className="text-xs h-8 px-3 font-sans"
                            title="Export Laser Lifecycle JSON"
                          >
                            Export
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            onClick={handleOpenAddLaser}
                            className="text-xs h-8 px-3 font-sans"
                          >
                            Add Head
                          </Button>
                        </div>
                      </div>

                      {/* 1.2 REQUIRED ACTION (Rendered ONLY when an actual action is required) */}
                      {machineMetrics.baselineRequiredCount > 0 ? (
                        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isDark ? 'bg-amber-950/30 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}>
                          <div className="flex items-start sm:items-center gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                            <div>
                              <span className="font-bold font-mono">ACTION REQUIRED:</span> Initial physical meter baseline required for{' '}
                              <strong>{machineMetrics.baselineRequiredCount} laser head(s)</strong> to activate deterministic runtime calculations.
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="warning"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => {
                              const firstUnbaselined = machineMetrics.laserMetricsList.find(l => l.status === 'BASELINE_REQUIRED') || machineMetrics.mostCriticalLaser;
                              handleOpenVerifyModal(firstUnbaselined);
                            }}
                            className="text-xs py-1 px-3 shrink-0"
                          >
                            Set Baseline Meter
                          </Button>
                        </div>
                      ) : machineMetrics.status === 'ALARM' ? (
                        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isDark ? 'bg-rose-950/30 border-rose-800/60 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900'
                        }`}>
                          <div className="flex items-start sm:items-center gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 sm:mt-0" />
                            <div>
                              <span className="font-bold font-mono">CRITICAL THRESHOLD:</span> Laser operating runtime has exceeded rated life capacity on{' '}
                              <strong>{machineMetrics.mostCriticalLaser.name}</strong>. Replacement or contingency planning required.
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenVerifyModal(machineMetrics.mostCriticalLaser)}
                            className="text-xs py-1 px-3 shrink-0"
                          >
                            Verify Meter
                          </Button>
                        </div>
                      ) : machineMetrics.recalRecommendation.urgency === 'WARNING' ? (
                        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50/70 border-amber-200 text-amber-900'
                        }`}>
                          <div className="flex items-start sm:items-center gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                            <div>
                              <span className="font-bold font-mono">VERIFICATION RECOMMENDED:</span> Physical meter verification is recommended to maintain runtime accuracy (last verified {machineMetrics.daysSinceRecal ?? '—'} days ago).
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="warning"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenVerifyModal(machineMetrics.mostCriticalLaser)}
                            className="text-xs py-1 px-3 shrink-0"
                          >
                            Verify Meter
                          </Button>
                        </div>
                      ) : null}

                      {/* 1.3 PRIMARY LIFECYCLE HERO: REMAINING MARGIN & LIFE CAPACITY */}
                      <div className={`p-5 rounded-xl border ${
                        isDark ? 'bg-[#181B1F] border-[#2B323A]' : 'bg-slate-50/70 border-slate-200'
                      }`}>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                          {/* Dominant Remaining Margin */}
                          <div className="lg:col-span-5 space-y-1.5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-4 lg:pb-0 lg:pr-6">
                            <span className={`text-[11px] font-mono uppercase tracking-wider block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Remaining Lifecycle Margin
                            </span>
                            <div className="flex items-baseline gap-3">
                              <span className={`text-4xl font-extrabold font-mono tracking-tight ${
                                machineMetrics.status === 'ALARM' ? 'text-rose-500' :
                                machineMetrics.status === 'WARNING' ? 'text-amber-500' :
                                'text-emerald-500'
                              }`}>
                                {machineMetrics.mostCriticalLaser.formattedLifeRemaining}
                              </span>
                              {machineMetrics.totalLasers > 1 && machineMetrics.avgLifeRemaining !== null && (
                                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                                  isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200'
                                }`}>
                                  Avg: {machineMetrics.formattedAvgLifeRemaining}
                                </span>
                              )}
                            </div>
                            <p className={`text-xs font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {machineMetrics.mostCriticalLaser.recommendedRemainingHour !== null
                                ? <><strong className="text-slate-100 dark:text-slate-100">{machineMetrics.mostCriticalLaser.recommendedRemainingHour.toLocaleString()} hrs</strong> remaining margin</>
                                : 'Initial meter reading required'
                              }
                              {machineMetrics.mostCriticalLaser.remainingDaysInfo.formattedText && (
                                <span className="text-slate-400 ml-1">({machineMetrics.mostCriticalLaser.remainingDaysInfo.formattedText})</span>
                              )}
                            </p>
                          </div>

                          {/* Life Capacity & Hours */}
                          <div className="lg:col-span-7 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
                              <span className={isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}>
                                System Life Capacity (Critical: {machineMetrics.mostCriticalLaser.name})
                              </span>
                              <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                {machineMetrics.mostCriticalLaser.currentHour !== null
                                  ? `${Number(machineMetrics.mostCriticalLaser.currentHour).toLocaleString()} hrs`
                                  : 'Unrecorded'
                                }
                                <span className={`font-normal ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                  / {machineMetrics.mostCriticalLaser.ratedLife.toLocaleString()} rated hrs
                                </span>
                              </span>
                            </div>

                            {/* Visual Progress Bar */}
                            {(() => {
                              const usedPct = machineMetrics.mostCriticalLaser.lifeRemainingPercent !== null
                                ? Math.min(100, Math.max(0, 100 - machineMetrics.mostCriticalLaser.lifeRemainingPercent))
                                : 0;
                              return (
                                <div className="space-y-1.5">
                                  <ProgressBar
                                    value={usedPct}
                                    variant={
                                      machineMetrics.status === 'ALARM' ? 'danger' :
                                      machineMetrics.status === 'WARNING' ? 'warning' :
                                      'primary'
                                    }
                                    size="lg"
                                    animated={true}
                                  />
                                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    <span>0 hrs</span>
                                    <span>{usedPct.toFixed(1)}% Consumed</span>
                                    <span>{machineMetrics.mostCriticalLaser.ratedLife.toLocaleString()} hrs</span>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Projected EOL & Freshness Strip */}
                            <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-400">
                              <div>
                                <span>Est. EOL: </span>
                                <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                                  {machineMetrics.mostCriticalLaser.estimatedRecommendedEOL || machineMetrics.eolDate || '—'}
                                </strong>
                              </div>
                              <div>
                                <span>Telemetry Freshness: </span>
                                <strong className={
                                  machineMetrics.mostCriticalLaser.accuracy.color === 'emerald' ? 'text-emerald-500' :
                                  machineMetrics.mostCriticalLaser.accuracy.color === 'amber' ? 'text-amber-500' :
                                  'text-slate-400'
                                }>
                                  {machineMetrics.mostCriticalLaser.accuracy.label}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 1.4 SECONDARY LASER-HEAD VIEW (Compact List with Progressive Disclosure) */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-xs font-bold font-mono tracking-wider uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Configured Laser Heads ({machineMetrics.totalLasers})
                          </h3>
                          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                            Click details to view complete telemetry & verification records
                          </span>
                        </div>

                        <div className="space-y-3">
                          {machineMetrics.laserMetricsList.map((lm) => {
                            const isExpanded = !!expandedLaserIds[lm.id];
                            const isBaselineReq = lm.status === 'BASELINE_REQUIRED';
                            const percentUsed = lm.lifeRemainingPercent !== null 
                              ? Math.min(100, Math.max(0, 100 - lm.lifeRemainingPercent))
                              : 0;

                            return (
                              <div 
                                key={lm.id}
                                className={`rounded-xl border transition-all overflow-hidden ${
                                  isDark ? 'bg-[#181B1F] border-[#2B323A]' : 'bg-slate-50/80 border-slate-200'
                                }`}
                              >
                                {/* Compact Header Summary Row */}
                                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  {/* Head Identity */}
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-2 rounded-lg shrink-0 ${
                                      lm.status === 'ALARM' ? (isDark ? 'bg-rose-950/50 text-rose-400' : 'bg-rose-100 text-rose-700') :
                                      lm.status === 'WARNING' ? (isDark ? 'bg-amber-950/50 text-amber-400' : 'bg-amber-100 text-amber-700') :
                                      (isDark ? 'bg-sky-950/50 text-sky-400' : 'bg-sky-100 text-sky-700')
                                    }`}>
                                      <Zap className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                          {lm.name}
                                        </span>
                                        <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded border ${
                                          isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-white text-slate-700 border-slate-200'
                                        }`}>
                                          SN: {lm.serialNo || 'N/A'}
                                        </span>
                                        <Badge 
                                          variant={
                                            lm.status === 'SAFE' ? 'emerald' :
                                            lm.status === 'WARNING' ? 'amber' :
                                            lm.status === 'ALARM' ? 'rose' : 'amber'
                                          } 
                                          size="sm"
                                        >
                                          {lm.status === 'BASELINE_REQUIRED' ? 'BASELINE REQ' : lm.status}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                                        <span>Operating: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{lm.currentHour !== null ? `${lm.currentHour.toLocaleString()} hrs` : 'Unrecorded'}</strong></span>
                                        <span>•</span>
                                        <span>Rated: {lm.ratedLife.toLocaleString()} hrs</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Center Margin Bar */}
                                  <div className="md:w-64 space-y-1">
                                    <div className="flex justify-between text-xs font-mono">
                                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Life Margin:</span>
                                      <strong className={
                                        lm.status === 'ALARM' ? 'text-rose-400' :
                                        lm.status === 'WARNING' ? 'text-amber-400' :
                                        'text-emerald-500'
                                      }>
                                        {lm.formattedLifeRemaining}
                                      </strong>
                                    </div>
                                    <ProgressBar
                                      value={percentUsed}
                                      variant={
                                        lm.status === 'ALARM' ? 'danger' :
                                        lm.status === 'WARNING' ? 'warning' :
                                        'primary'
                                      }
                                      size="sm"
                                      animated={true}
                                    />
                                  </div>

                                  {/* Action Controls & Progressive Toggle */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                      size="sm"
                                      variant={isBaselineReq ? 'warning' : 'outline'}
                                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                      onClick={() => handleOpenVerifyModal(lm)}
                                      className="text-xs h-7.5 px-2.5 font-sans"
                                    >
                                      {isBaselineReq ? 'Set Baseline' : 'Verify'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      icon={<Settings className="w-3.5 h-3.5" />}
                                      onClick={() => handleOpenConfigModal(lm)}
                                      className="text-xs h-7.5 px-2"
                                      title="Configure Laser Head"
                                    >
                                      Config
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      icon={isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      onClick={() => toggleExpandLaser(lm.id)}
                                      className="text-xs h-7.5 px-2.5 font-mono text-slate-400 hover:text-slate-200"
                                    >
                                      {isExpanded ? 'Hide' : 'Details'}
                                    </Button>
                                  </div>
                                </div>

                                {/* 1.5 PROGRESSIVE DETAIL PANEL (Disclosed on demand) */}
                                {isExpanded && (
                                  <div className={`p-4 border-t space-y-4 text-xs font-mono ${
                                    isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-white border-slate-200'
                                  }`}>
                                    {/* 6-Grid Detailed Telemetry */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#181B1F] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                                        <span className="text-[10px] text-slate-500 uppercase block">Physical Meter</span>
                                        <p className={`font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                          {lm.baseLaserHour !== null ? `${lm.baseLaserHour.toLocaleString()} hrs` : 'Unrecorded'}
                                        </p>
                                        <span className="text-[10px] text-slate-500 block truncate">
                                          {lm.baseTimestamp ? new Date(lm.baseTimestamp).toLocaleDateString() : 'No timestamp'}
                                        </span>
                                      </div>

                                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#181B1F] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                                        <span className="text-[10px] text-slate-500 uppercase block">Estimated Current</span>
                                        <p className={`font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                          {lm.estimatedCurrentHour !== null ? `${lm.estimatedCurrentHour.toLocaleString()} hrs` : '—'}
                                        </p>
                                        <span className="text-[10px] text-slate-500 block">
                                          {lm.runtimeState}
                                        </span>
                                      </div>

                                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#181B1F] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                                        <span className="text-[10px] text-slate-500 uppercase block">Remaining Hours</span>
                                        <p className={`font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                          {lm.recommendedRemainingHour !== null ? `${lm.recommendedRemainingHour.toLocaleString()} hrs` : '—'}
                                        </p>
                                        <span className="text-[10px] text-slate-500 block truncate">
                                          {lm.remainingDaysInfo.formattedText}
                                        </span>
                                      </div>

                                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#181B1F] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                                        <span className="text-[10px] text-slate-500 uppercase block">Estimated EOL</span>
                                        <p className={`font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                          {lm.estimatedRecommendedEOL || lm.eolDate || '—'}
                                        </p>
                                        <span className="text-[10px] text-slate-500 block">
                                          Rated: {lm.ratedLife.toLocaleString()}h
                                        </span>
                                      </div>

                                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#181B1F] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                                        <span className="text-[10px] text-slate-500 uppercase block">Accuracy Rating</span>
                                        <p className={`font-bold mt-0.5 ${
                                          lm.accuracy.color === 'emerald' ? 'text-emerald-500' :
                                          lm.accuracy.color === 'amber' ? 'text-amber-500' :
                                          'text-slate-400'
                                        }`}>
                                          {lm.accuracy.label}
                                        </p>
                                        <span className="text-[10px] text-slate-500 block truncate">
                                          {lm.daysSinceRecal !== null ? `${lm.daysSinceRecal}d since verify` : 'Uncalibrated'}
                                        </span>
                                      </div>

                                      <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-[#181B1F] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                                        <span className="text-[10px] text-slate-500 uppercase block">Last Calibration</span>
                                        <p className={`font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                          {lm.lastRecalibrationDate || 'Never'}
                                        </p>
                                        <span className="text-[10px] text-slate-500 block truncate">
                                          Contingency: {lm.contingencyCeiling.toLocaleString()}h
                                        </span>
                                      </div>
                                    </div>

                                    {/* Head Specific Calibration History Records (if any exist) */}
                                    {lm.calibrationHistory && lm.calibrationHistory.length > 0 && (
                                      <div className="space-y-1.5 pt-1">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                          Calibration & Verification History ({lm.calibrationHistory.length} records)
                                        </span>
                                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                          {lm.calibrationHistory.map((rec, rIdx) => (
                                            <div 
                                              key={rIdx}
                                              className={`p-2 rounded border flex items-center justify-between gap-2 text-[11px] ${
                                                isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-400">{rec.date} {rec.time || ''}</span>
                                                <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{rec.reason || 'Verification'}</span>
                                                {rec.rating && <span className="text-amber-500 text-[10px] font-medium">({rec.rating})</span>}
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <span className="font-bold">{rec.actualHour.toLocaleString()} hrs</span>
                                                {rec.difference !== 0 && (
                                                  <span className="text-slate-400 text-[10px]">
                                                    (Δ {rec.difference > 0 ? '+' : ''}{rec.difference}h)
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: LIFECYCLE & CALIBRATION HISTORY */}
                    <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div>
                          <h3 className={`text-sm font-bold font-mono tracking-tight uppercase ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            Lifecycle & Calibration History
                          </h3>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Verified physical meter records, recalibrations, and maintenance events
                          </p>
                        </div>
                      </div>

                      {/* History Content */}
                      <div className="space-y-2">
                        {/* Summary metadata cards */}
                        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border text-xs font-mono ${
                          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div>
                            <span className={`text-[10px] uppercase ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Installation Date</span>
                            <p className={`font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{selectedMachine.installationDate || '—'}</p>
                          </div>
                          <div>
                            <span className={`text-[10px] uppercase ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Factory Baseline Date</span>
                            <p className={`font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{selectedMachine.baselineDate || '—'}</p>
                          </div>
                          <div>
                            <span className={`text-[10px] uppercase ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Next MHC Target</span>
                            <p className={`font-bold mt-0.5 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>{selectedMachine.nextMhcDate || '—'}</p>
                          </div>
                          <div>
                            <span className={`text-[10px] uppercase ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Production Line / Zone</span>
                            <p className={`font-bold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {selectedMachine.productionLineName || 'Line'}{selectedMachine.zone ? ` (${selectedMachine.zone})` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Calibration and meter verification entries */}
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {(() => {
                            const calibList: {
                              id: string;
                              date: string;
                              head: string;
                              sn: string;
                              type: string;
                              hours: number | null;
                              rating?: string;
                              notes?: string;
                              performedBy?: string;
                            }[] = [];

                            if (selectedMachine.baselineDate) {
                              calibList.push({
                                id: `base-${selectedMachine.id}`,
                                date: selectedMachine.baselineDate,
                                head: 'All Heads',
                                sn: selectedMachine.serialNumber || selectedMachine.serialNo || '—',
                                type: 'Factory Baseline',
                                hours: selectedMachine.baseLaserHour ?? null,
                                notes: 'Initial factory / commissioning baseline',
                                performedBy: 'Commissioning Team'
                              });
                            }

                            (selectedMachine.lasers || selectedMachine.laserHeads || []).forEach((l, idx) => {
                              const headName = l.name || `Laser Head ${idx + 1}`;
                              const sn = l.serialNo || l.serialNumber || '—';
                              if (l.calibrationHistory && Array.isArray(l.calibrationHistory)) {
                                l.calibrationHistory.forEach((rec, rIdx) => {
                                  calibList.push({
                                    id: `cal-${idx}-${rIdx}`,
                                    date: rec.date || 'N/A',
                                    head: headName,
                                    sn,
                                    type: 'Meter Verification',
                                    hours: rec.physicalHour ?? null,
                                    rating: rec.accuracyRating,
                                    notes: rec.notes || (rec.driftHours !== undefined ? `Drift: ${rec.driftHours > 0 ? '+' : ''}${rec.driftHours}h` : undefined),
                                    performedBy: rec.performedBy || 'Service Engineer'
                                  });
                                });
                              }
                            });

                            if (selectedMachine.maintenanceHistory && Array.isArray(selectedMachine.maintenanceHistory)) {
                              selectedMachine.maintenanceHistory.forEach((rec, mIdx) => {
                                calibList.push({
                                  id: `maint-${mIdx}`,
                                  date: rec.date || 'N/A',
                                  head: 'System',
                                  sn: selectedMachine.serialNumber || '—',
                                  type: 'Maintenance',
                                  hours: rec.currentHours ?? null,
                                  notes: rec.description || rec.notes || 'Routine maintenance service',
                                  performedBy: rec.technician || 'Service Engineer'
                                });
                              });
                            }

                            if (calibList.length === 0) {
                              return (
                                <p className={`text-xs py-4 text-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                  No historical calibration or meter adjustment records logged.
                                </p>
                              );
                            }

                            return calibList
                              .sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0))
                              .map((entry) => (
                                <div 
                                  key={entry.id}
                                  className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                                    isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="font-mono text-xs font-bold text-slate-500 min-w-[75px]">
                                      {entry.date}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                          {entry.head}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-500">
                                          ({entry.type})
                                        </span>
                                        {entry.rating && (
                                          <span className="text-[10px] text-amber-500 font-medium">
                                            {entry.rating}
                                          </span>
                                        )}
                                      </div>
                                      {entry.notes && (
                                        <p className={`text-[11px] truncate max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                          {entry.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0 font-mono text-right">
                                    {entry.hours !== null && (
                                      <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {entry.hours.toLocaleString()} hrs
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-500">
                                      {entry.performedBy}
                                    </span>
                                  </div>
                                </div>
                              ));
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: MACHINE ENGINEERING HEALTH (MHC SPECIFICATIONS & RECENT INSPECTIONS) */}
                    <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className={`text-sm font-bold font-mono tracking-tight uppercase ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                              MHC Baseline Engineering Specifications
                            </h3>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Authoritative engineering thresholds & tolerances for Machine Health Check reports
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Share2 className="w-3.5 h-3.5 text-indigo-500" />}
                            onClick={handleOpenFanOut}
                            className="text-xs h-7.5 px-2.5"
                          >
                            Fan-Out
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Edit3 className="w-3.5 h-3.5" />}
                            onClick={handleOpenEdit}
                            className="text-xs h-7.5 px-2.5"
                          >
                            Configure Specs
                          </Button>
                        </div>
                      </div>

                      {/* 5 Engineering Baseline Tolerances */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                        {/* Laser Power */}
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                          <span className={`text-[10px] uppercase font-mono tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Laser Power</span>
                          <p className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {selectedMachine.mhcSpecs?.laserPower?.targetPowerWatts !== undefined && selectedMachine.mhcSpecs?.laserPower?.targetPowerWatts !== null
                              ? `${selectedMachine.mhcSpecs.laserPower.targetPowerWatts} W${selectedMachine.mhcSpecs.laserPower.powerTolerancePercent !== undefined && selectedMachine.mhcSpecs.laserPower.powerTolerancePercent !== null ? ` ±${selectedMachine.mhcSpecs.laserPower.powerTolerancePercent}%` : ''}`
                              : '— (Unrecorded)'}
                          </p>
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Target Power & Tol</span>
                        </div>

                        {/* Beam Profile / Mode */}
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                          <span className={`text-[10px] uppercase font-mono tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Beam Profile / Mode</span>
                          <p className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {selectedMachine.mhcSpecs?.beamProfile?.profileMode || '— (Unrecorded)'}
                          </p>
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Profile geometry / mode</span>
                        </div>

                        {/* Stage Calibration */}
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                          <span className={`text-[10px] uppercase font-mono tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Stage Calibration</span>
                          <p className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {selectedMachine.mhcSpecs?.stageCalibration?.toleranceUm !== undefined && selectedMachine.mhcSpecs?.stageCalibration?.toleranceUm !== null
                              ? `±${selectedMachine.mhcSpecs.stageCalibration.toleranceUm} µm`
                              : '— (Unrecorded)'}
                          </p>
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Stage tolerance spec</span>
                        </div>

                        {/* AGC / Scanner Calibration */}
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                          <span className={`text-[10px] uppercase font-mono tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>AGC / Scanner</span>
                          <p className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {selectedMachine.mhcSpecs?.agcCalibration?.toleranceUm !== undefined && selectedMachine.mhcSpecs?.agcCalibration?.toleranceUm !== null
                              ? `±${selectedMachine.mhcSpecs.agcCalibration.toleranceUm} µm`
                              : '— (Unrecorded)'}
                          </p>
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Galvo scanner tolerance</span>
                        </div>

                        {/* Temperature / Cooling */}
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
                          <span className={`text-[10px] uppercase font-mono tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600 font-semibold'}`}>Temperature / Cooling</span>
                          <p className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {selectedMachine.mhcSpecs?.temperatureCooling?.targetTempCelsius !== undefined && selectedMachine.mhcSpecs?.temperatureCooling?.targetTempCelsius !== null
                              ? `${selectedMachine.mhcSpecs.temperatureCooling.targetTempCelsius}°C${selectedMachine.mhcSpecs.temperatureCooling.tempToleranceCelsius !== undefined && selectedMachine.mhcSpecs.temperatureCooling.tempToleranceCelsius !== null ? ` ±${selectedMachine.mhcSpecs.temperatureCooling.tempToleranceCelsius}°C` : ''}`
                              : '— (Unrecorded)'}
                          </p>
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Target temp & tolerance</span>
                        </div>
                      </div>

                      {/* Recent Machine Health Checks Table */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold font-mono tracking-tight ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Recent MHC Inspections
                          </span>
                        </div>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {machineMhcs.length === 0 ? (
                            <p className={`text-xs py-3 text-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                              No completed MHC inspection records logged for this machine.
                            </p>
                          ) : (
                            machineMhcs.map((rec) => (
                              <div 
                                key={rec.id} 
                                className={`p-2.5 rounded-lg border flex justify-between items-center text-xs ${
                                  isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="min-w-0 pr-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                      {rec.date}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                                      rec.status === 'COMPLETED'
                                        ? (isDark ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                                        : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200')
                                    }`}>
                                      {rec.status}
                                    </span>
                                  </div>
                                  <p className={`text-[10px] truncate max-w-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {rec.engineerRemarks || 'Standard comprehensive health audit'}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <Badge variant="cyan" size="sm">
                                    Score: {rec.healthScores?.overallScore ?? 100}/100
                                  </Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : passportSubTab === 'temperature' ? (
          <MachineTemperatureWorkspace
            machine={selectedMachine}
            onUpdateMachine={(updated) => onEditMachine?.(updated)}
          />
        ) : passportSubTab === 'laser_power' ? (
          <MachineLaserPowerWorkspace
            machine={selectedMachine}
            onUpdateMachine={(updated) => onEditMachine?.(updated)}
          />
        ) : passportSubTab === 'beam_profile' ? (
          <MachineBeamProfileWorkspace
            machine={selectedMachine}
            onUpdateMachine={(updated) => onEditMachine?.(updated)}
          />
        ) : passportSubTab === 'focus_optimization' ? (
          <MachineFocusOptimizationWorkspace
            machine={selectedMachine}
            onUpdateMachine={(updated) => onEditMachine?.(updated)}
          />
        ) : passportSubTab === 'recommended_parts' ? (
          <RecommendedPartsWorkspace
            initialFamilyFilter={
              selectedMachine?.model?.toUpperCase().includes('302') 
                ? 'BMD302W' 
                : selectedMachine?.model?.toUpperCase().includes('250') 
                ? 'BMD250WM' 
                : 'ALL'
            }
          />
        ) : (
          <MachineProductProcessWorkspace
            machine={selectedMachine}
            onUpdateMachine={(updated) => onEditMachine?.(updated)}
          />
        )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </>
    )}

      {/* 1. Add Machine Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Machine to Fleet Passport"
        subtitle="Register a new machine asset with hardware baseline and customer allocation."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Machine Model / Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TRUMPF TruLaser Cell 7040"
                value={addForm.model}
                onChange={(e) => setAddForm({ ...addForm, model: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Machine ID / Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MCH-105"
                value={addForm.machineNumber}
                onChange={(e) => setAddForm({ ...addForm, machineNumber: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Serial Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SN-TRU-904128"
                value={addForm.serialNumber}
                onChange={(e) => setAddForm({ ...addForm, serialNumber: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Customer Allocation
              </label>
              <input
                type="text"
                value={addForm.customerName}
                onChange={(e) => setAddForm({ ...addForm, customerName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Plant / Facility Name
              </label>
              <input
                type="text"
                value={addForm.plantName}
                onChange={(e) => setAddForm({ ...addForm, plantName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Production Line
              </label>
              <input
                type="text"
                value={addForm.productionLineName}
                onChange={(e) => setAddForm({ ...addForm, productionLineName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Zone / Area
              </label>
              <input
                type="text"
                placeholder="e.g. Zone A, Cleanroom North"
                value={addForm.zone}
                onChange={(e) => setAddForm({ ...addForm, zone: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Initial Status
              </label>
              <select
                value={addForm.status}
                onChange={(e) => setAddForm({ ...addForm, status: e.target.value as Machine['status'] })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="NEEDS_CALIBRATION">NEEDS_CALIBRATION</option>
                <option value="MAINTENANCE_DUE">MAINTENANCE_DUE</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>
            </div>



            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Installation Date
              </label>
              <input
                type="date"
                value={addForm.installationDate}
                onChange={(e) => setAddForm({ ...addForm, installationDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Laser Oscillator / Head Model
              </label>
              <input
                type="text"
                value={addForm.laserHeadModel}
                onChange={(e) => setAddForm({ ...addForm, laserHeadModel: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* MHC / Calibration Specifications Inputs */}
            <div className="md:col-span-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  MHC / Calibration Specifications (Machine Baseline)
                </h4>
              </div>
              <p className={`text-[11px] mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Authoritative machine baseline tolerances used for MHC calculations and executive summary reports. Leave blank if not yet configured.
              </p>

              {/* Reuse Baseline Control */}
              <div className={`flex items-center justify-between flex-wrap gap-2 mb-3 p-2.5 rounded-xl border ${
                isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <Copy className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-medium">Reuse baseline specs from existing machine:</span>
                </div>
                <select
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                  defaultValue=""
                  onChange={(e) => {
                    const sourceMch = machines.find((m) => m.id === e.target.value);
                    if (sourceMch) {
                      copyMhcSpecsFromMachine(sourceMch, 'add');
                    }
                    e.target.value = '';
                  }}
                >
                  <option value="" disabled>Select source machine...</option>
                  {machines.map((m) => {
                    const hasSpecs = hasConfiguredMhcSpecs(m);
                    return (
                      <option key={m.id} value={m.id} disabled={!hasSpecs}>
                        {m.machineNumber || m.model} — {m.customerName || 'General'} {hasSpecs ? '(Configured)' : '(No specs)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Target Laser Power (W)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 15.0"
                    value={addForm.mhcLaserTargetPower}
                    onChange={(e) => setAddForm({ ...addForm, mhcLaserTargetPower: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Power Tolerance (±%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 10"
                    value={addForm.mhcLaserPowerTolerance}
                    onChange={(e) => setAddForm({ ...addForm, mhcLaserPowerTolerance: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Beam Profile / Mode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gaussian Mode"
                    value={addForm.mhcBeamProfileMode}
                    onChange={(e) => setAddForm({ ...addForm, mhcBeamProfileMode: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Stage Calibration Tolerance (±µm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 2.0"
                    value={addForm.mhcStageTolerance}
                    onChange={(e) => setAddForm({ ...addForm, mhcStageTolerance: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    AGC / Scanner Tolerance (±µm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 3.0"
                    value={addForm.mhcAgcTolerance}
                    onChange={(e) => setAddForm({ ...addForm, mhcAgcTolerance: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Target Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 22.0"
                    value={addForm.mhcTargetTemp}
                    onChange={(e) => setAddForm({ ...addForm, mhcTargetTemp: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Temperature Tolerance (±°C)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1.0"
                    value={addForm.mhcTempTolerance}
                    onChange={(e) => setAddForm({ ...addForm, mhcTempTolerance: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Create Machine
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Machine Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Machine: ${selectedMachine?.model || ''}`}
        subtitle={`Update operational parameters and specs for ${selectedMachine?.machineNumber || ''}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Machine Model
              </label>
              <input
                type="text"
                required
                value={editForm.model}
                onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Machine Number
              </label>
              <input
                type="text"
                required
                value={editForm.machineNumber}
                onChange={(e) => setEditForm({ ...editForm, machineNumber: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Serial Number
              </label>
              <input
                type="text"
                required
                value={editForm.serialNumber}
                onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Customer Name
              </label>
              <input
                type="text"
                value={editForm.customerName}
                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Plant Name
              </label>
              <input
                type="text"
                value={editForm.plantName}
                onChange={(e) => setEditForm({ ...editForm, plantName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Production Line Name
              </label>
              <input
                type="text"
                value={editForm.productionLineName}
                onChange={(e) => setEditForm({ ...editForm, productionLineName: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Zone / Area
              </label>
              <input
                type="text"
                placeholder="e.g. Zone A, Cleanroom North"
                value={editForm.zone}
                onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Machine['status'] })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="NEEDS_CALIBRATION">NEEDS_CALIBRATION</option>
                <option value="MAINTENANCE_DUE">MAINTENANCE_DUE</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>
            </div>

            {/* MHC / Calibration Specifications Inputs */}
            <div className="md:col-span-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  MHC / Calibration Specifications (Machine Baseline)
                </h4>
              </div>
              <p className={`text-[11px] mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Authoritative machine baseline tolerances used for MHC calculations and executive summary reports. Leave blank if not yet configured.
              </p>

              {/* Reuse Baseline Control */}
              <div className={`flex items-center justify-between flex-wrap gap-2 mb-3 p-2.5 rounded-xl border ${
                isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <Copy className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-medium">Reuse baseline specs from existing machine:</span>
                </div>
                <select
                  className={`px-2.5 py-1 text-xs rounded-lg border font-medium ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                  defaultValue=""
                  onChange={(e) => {
                    const sourceMch = machines.find((m) => m.id === e.target.value);
                    if (sourceMch) {
                      copyMhcSpecsFromMachine(sourceMch, 'edit');
                    }
                    e.target.value = '';
                  }}
                >
                  <option value="" disabled>Select source machine...</option>
                  {machines
                    .filter((m) => selectedMachine ? m.id !== selectedMachine.id : true)
                    .map((m) => {
                      const hasSpecs = hasConfiguredMhcSpecs(m);
                      return (
                        <option key={m.id} value={m.id} disabled={!hasSpecs}>
                          {m.machineNumber || m.model} — {m.customerName || 'General'} {hasSpecs ? '(Configured)' : '(No specs)'}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Target Laser Power (W)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 15.0"
                    value={editForm.mhcLaserTargetPower}
                    onChange={(e) => setEditForm({ ...editForm, mhcLaserTargetPower: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Power Tolerance (±%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 10"
                    value={editForm.mhcLaserPowerTolerance}
                    onChange={(e) => setEditForm({ ...editForm, mhcLaserPowerTolerance: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Beam Profile / Mode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gaussian Mode"
                    value={editForm.mhcBeamProfileMode}
                    onChange={(e) => setEditForm({ ...editForm, mhcBeamProfileMode: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Stage Calibration Tolerance (±µm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 2.0"
                    value={editForm.mhcStageTolerance}
                    onChange={(e) => setEditForm({ ...editForm, mhcStageTolerance: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    AGC / Scanner Tolerance (±µm)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 3.0"
                    value={editForm.mhcAgcTolerance}
                    onChange={(e) => setEditForm({ ...editForm, mhcAgcTolerance: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Target Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 22.0"
                    value={editForm.mhcTargetTemp}
                    onChange={(e) => setEditForm({ ...editForm, mhcTargetTemp: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Temperature Tolerance (±°C)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1.0"
                    value={editForm.mhcTempTolerance}
                    onChange={(e) => setEditForm({ ...editForm, mhcTempTolerance: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>


          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Edit3 className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Rename Machine Modal */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Quick Rename Machine"
        subtitle={`Update model designation or machine code for ${selectedMachine?.machineNumber || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveRename} className="space-y-4 p-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Machine Model Name
            </label>
            <input
              type="text"
              required
              value={renameForm.model}
              onChange={(e) => setRenameForm({ ...renameForm, model: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Machine Number / Code
            </label>
            <input
              type="text"
              required
              value={renameForm.machineNumber}
              onChange={(e) => setRenameForm({ ...renameForm, machineNumber: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Serial Number
            </label>
            <input
              type="text"
              required
              value={renameForm.serialNumber}
              onChange={(e) => setRenameForm({ ...renameForm, serialNumber: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsRenameModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Type className="w-4 h-4" />}
            >
              Rename Machine
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Delete Machine Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Machine"
        subtitle="This action is permanent and cannot be undone."
        maxWidth="md"
      >
        <div className="p-4 space-y-4">
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Are you sure you want to delete this machine?</p>
              <p>
                Target: <strong className="font-mono">{selectedMachine?.model || ''} ({selectedMachine?.machineNumber || ''})</strong>
              </p>
              <p className="text-[11px] opacity-80 pt-1">
                SN: {selectedMachine?.serialNumber || ''} • {selectedMachine?.customerName || ''}
              </p>
            </div>
          </div>

          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Deleting this machine will remove its telemetry, active laser head specifications, and consumable records from the active fleet passport.
          </p>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleConfirmDelete}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. Add Customer Modal */}
      <Modal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        title="Create Customer Account"
        subtitle="Add a new customer account to FSOS Customer Workspace"
        maxWidth="md"
      >
        <form onSubmit={handleSaveAddCustomer} className="space-y-4 p-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Customer Account Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Semiconductor Fab Cleanroom"
              value={custForm.name}
              onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Facility / Industry Site
            </label>
            <input
              type="text"
              placeholder="e.g., EUV Wafer Dicing Facility"
              value={custForm.industry}
              onChange={(e) => setCustForm({ ...custForm, industry: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Contact Person
              </label>
              <input
                type="text"
                placeholder="Dr. Robert Chen"
                value={custForm.contactPerson}
                onChange={(e) => setCustForm({ ...custForm, contactPerson: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Contact Email
              </label>
              <input
                type="email"
                placeholder="a.rivera@fab.com"
                value={custForm.email}
                onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Edit Customer Modal */}
      <Modal
        isOpen={isEditCustomerModalOpen}
        onClose={() => setIsEditCustomerModalOpen(false)}
        title="Edit Customer Details"
        subtitle={`Modify account information for ${customerToEdit?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditCustomer} className="space-y-4 p-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Customer Account Name *
            </label>
            <input
              type="text"
              required
              value={custForm.name}
              onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Facility / Industry Site
            </label>
            <input
              type="text"
              value={custForm.industry}
              onChange={(e) => setCustForm({ ...custForm, industry: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Contact Person
              </label>
              <input
                type="text"
                value={custForm.contactPerson}
                onChange={(e) => setCustForm({ ...custForm, contactPerson: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Contact Email
              </label>
              <input
                type="email"
                value={custForm.email}
                onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Edit3 className="w-4 h-4" />}
            >
              Save Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Rename Customer Modal */}
      <Modal
        isOpen={isRenameCustomerModalOpen}
        onClose={() => setIsRenameCustomerModalOpen(false)}
        title="Rename Customer Account"
        subtitle={`Update account name for ${customerToEdit?.name}`}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveRenameCustomer} className="space-y-4 p-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              New Customer Name
            </label>
            <input
              type="text"
              required
              value={custForm.name}
              onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsRenameCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Type className="w-4 h-4" />}
            >
              Rename Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Delete Customer Confirmation Modal */}
      {(() => {
        const assignedMachinesCount = customerToDelete
          ? machines.filter((m) => m.customerId === customerToDelete.id || m.customerName === customerToDelete.name).length
          : 0;

        return (
          <Modal
            isOpen={isDeleteCustomerModalOpen}
            onClose={() => setIsDeleteCustomerModalOpen(false)}
            title="Confirm Delete Customer Account"
            subtitle="This action will remove the customer account."
            maxWidth="md"
          >
            <div className="p-4 space-y-4">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-rose-950/20 border-rose-800/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">Are you sure you want to delete this customer account?</p>
                  <p>
                    Account: <strong className="font-mono">{customerToDelete?.name}</strong>
                  </p>
                  <p className="text-[11px] opacity-80 pt-1">
                    Facility: {customerToDelete?.industry || 'Cleanroom Operations'}
                  </p>
                </div>
              </div>

              {assignedMachinesCount > 0 ? (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Customer Deletion Blocked:</strong> {assignedMachinesCount} machine(s) are assigned to this customer. You must delete or reassign all machines before this customer account can be deleted.
                  </span>
                </div>
              ) : (
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Deleting this customer account will permanently remove it from the Customer Workspace navigation hierarchy.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteCustomerModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={assignedMachinesCount > 0}
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={handleConfirmDeleteCustomer}
                >
                  Confirm Delete Customer
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* 9. Verify Physical Laser Meter Modal */}
      {isVerifyModalOpen && targetLaserMetrics && (() => {
        const estHr = targetLaserMetrics.estimatedCurrentHour ?? targetLaserMetrics.baseLaserHour ?? 0;
        const enteredHr = parseFloat(physicalMeterInput) || 0;
        const dev = enteredHr - estHr;
        const absDev = Math.abs(dev);
        const evalRating = LaserEngine.calculateDeviationRating(dev);

        return (
          <Modal
            isOpen={isVerifyModalOpen}
            onClose={() => setIsVerifyModalOpen(false)}
            title={`Verify Physical Meter — ${targetLaserMetrics.name}`}
            subtitle={`Machine: ${selectedMachine.model} (${selectedMachine.machineNumber}) • Serial: ${targetLaserMetrics.serialNo}`}
            maxWidth="md"
          >
            <div className="p-4 space-y-4">
              {/* Estimated vs Physical Banner */}
              <div className={`p-4 rounded-xl border grid grid-cols-2 gap-3 text-xs ${
                isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`block text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Live Estimated Hour
                  </span>
                  <span className={`text-base font-extrabold font-mono ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>
                    {estHr.toLocaleString()} hrs
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Calculated via LaserEngine
                  </span>
                </div>

                <div>
                  <span className={`block text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Last Physical Meter
                  </span>
                  <span className={`text-base font-extrabold font-mono ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    {targetLaserMetrics.baseLaserHour !== null ? `${targetLaserMetrics.baseLaserHour.toLocaleString()} hrs` : 'Unset'}
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {targetLaserMetrics.baseTimestamp ? formatDate(targetLaserMetrics.baseTimestamp) : 'No baseline recorded'}
                  </span>
                </div>
              </div>

              {/* Physical Meter Form */}
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Physical Meter Reading (hrs) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={physicalMeterInput}
                    onChange={(e) => setPhysicalMeterInput(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-mono font-bold border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Verification Date
                    </label>
                    <input
                      type="date"
                      required
                      value={verifyDateInput}
                      onChange={(e) => setVerifyDateInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                        isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Verification Time
                    </label>
                    <input
                      type="time"
                      required
                      value={verifyTimeInput}
                      onChange={(e) => setVerifyTimeInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                        isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Reason / Engineer Notes
                  </label>
                  <select
                    value={verifyReason}
                    onChange={(e) => setVerifyReason(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Scheduled Preventive Maintenance Verification">Scheduled PM Verification</option>
                    <option value="Routine Inspection Audit">Routine Inspection Audit</option>
                    <option value="Diode Module / Optics Service Baseline">Diode Module / Optics Service Baseline</option>
                    <option value="Laser Recalibration & Alignment">Laser Recalibration & Alignment</option>
                    <option value="Customer Cleanroom Handover Verification">Customer Cleanroom Handover Verification</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Real-Time Deviation Feedback */}
              <div className={`p-3.5 rounded-xl border space-y-1.5 text-xs font-mono ${
                absDev > 500 ? (isDark ? 'bg-amber-950/30 border-amber-800/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900') :
                (isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900')
              }`}>
                <div className="flex justify-between items-center font-bold">
                  <span>Meter Deviation:</span>
                  <span>{dev > 0 ? `+${dev.toLocaleString()}` : dev.toLocaleString()} hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Accuracy Rating:</span>
                  <span className="font-bold">{evalRating.rating}</span>
                </div>
                {evalRating.warningMsg && (
                  <div className="text-[11px] text-amber-500 font-semibold pt-1">
                    {evalRating.warningMsg}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVerifyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleConfirmRecalibration}
                >
                  Confirm & Recalibrate Baseline
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* 10. Laser Head Configuration & Calibration History Modal */}
      {isConfigModalOpen && configLaserHead && (
        <Modal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          title={`Laser Head Configuration & Calibration Log — ${configName}`}
          subtitle={`Machine: ${selectedMachine.model} (${selectedMachine.machineNumber})`}
          maxWidth="lg"
        >
          <div className="p-4 space-y-5">
            {/* Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Laser Head Model / Name
                </label>
                <input
                  type="text"
                  required
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Serial Number
                </label>
                <input
                  type="text"
                  required
                  value={configSerial}
                  onChange={(e) => setConfigSerial(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border font-mono ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Rated Lifetime Hours
                </label>
                <input
                  type="number"
                  required
                  value={configRatedLife}
                  onChange={(e) => setConfigRatedLife(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border font-mono ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Warning Life Threshold (hrs)
                </label>
                <input
                  type="number"
                  required
                  value={configWarningLife}
                  onChange={(e) => setConfigWarningLife(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border font-mono ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Calibration Audit Log Table */}
            <div className="space-y-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Physical Meter Calibration & Recalibration Audit Log
              </h4>

              <div className={`rounded-xl border overflow-hidden text-xs font-mono max-h-48 overflow-y-auto ${
                isDark ? 'border-[#2B323A] bg-[#111315]' : 'border-slate-200 bg-white'
              }`}>
                {(!configLaserHead.calibrationHistory || configLaserHead.calibrationHistory.length === 0) ? (
                  <p className="p-4 text-center text-slate-500">No recalibration history recorded for this laser head.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={isDark ? 'bg-[#1A1D21] text-slate-400 border-b border-[#2B323A]' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}>
                        <th className="p-2">Date/Time</th>
                        <th className="p-2">Est. Hour</th>
                        <th className="p-2">Actual Hour</th>
                        <th className="p-2">Dev</th>
                        <th className="p-2">Rating</th>
                        <th className="p-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800">
                      {configLaserHead.calibrationHistory.map((rec, i) => (
                        <tr key={i} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                          <td className="p-2 font-bold">{rec.date} {rec.time || ''}</td>
                          <td className="p-2">{rec.estimatedHour?.toLocaleString()}</td>
                          <td className="p-2 text-emerald-400 font-bold">{rec.actualHour?.toLocaleString()}</td>
                          <td className="p-2">{rec.difference > 0 ? `+${rec.difference}` : rec.difference}</td>
                          <td className="p-2">{rec.rating}</td>
                          <td className="p-2 max-w-xs truncate text-[10px] text-slate-400">{rec.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleDeleteLaserHead}
                disabled={(selectedMachine.lasers || selectedMachine.laserHeads || []).length <= 1}
              >
                Delete Laser Head
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsConfigModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Edit3 className="w-4 h-4" />}
                  onClick={handleSaveLaserConfig}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 11. Add Laser Head Modal */}
      {isAddLaserModalOpen && (
        <Modal
          isOpen={isAddLaserModalOpen}
          onClose={() => setIsAddLaserModalOpen(false)}
          title={`Add Laser Head — ${selectedMachine.model}`}
          subtitle="Configure a multi-laser head system for independent lifecycle tracking."
          maxWidth="md"
        >
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Laser Head Name / Model <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addLaserName}
                  onChange={(e) => setAddLaserName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="e.g. TRUMPF TruLaser Oscillator #2"
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Serial Number
                </label>
                <input
                  type="text"
                  required
                  value={addLaserSerial}
                  onChange={(e) => setAddLaserSerial(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Physical Meter Reading (hrs) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={addLaserBaseHour}
                  onChange={(e) => setAddLaserBaseHour(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Rated Life (hrs)
                </label>
                <input
                  type="number"
                  required
                  value={addLaserRatedLife}
                  onChange={(e) => setAddLaserRatedLife(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Baseline Date
                </label>
                <input
                  type="date"
                  value={addLaserBaseDate}
                  onChange={(e) => setAddLaserBaseDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Baseline Time
                </label>
                <input
                  type="time"
                  value={addLaserBaseTime}
                  onChange={(e) => setAddLaserBaseTime(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddLaserModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleSaveAddLaser}
              >
                Add Laser Head
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 1. Import Preview Modal */}
      {importPreviewModalOpen && importPreviewData && (
        <Modal
          isOpen={importPreviewModalOpen}
          onClose={() => setImportPreviewModalOpen(false)}
          title="Laser Monitor JSON Import Preview"
          size="md"
        >
          <div className="space-y-4">
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Parsed backup file from Laser Hour Monitor. Preview of machines and laser lifecycle configurations to be imported into FSOS:
            </p>

            <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl font-mono text-xs border ${
              isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Machines Found</span>
                <strong className="text-base text-indigo-400 font-bold">{importPreviewData.machinesFound}</strong>
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Laser Heads Found</span>
                <strong className="text-base text-sky-400 font-bold">{importPreviewData.laserHeadsFound}</strong>
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Existing Matched (Merge)</span>
                <strong className="text-base text-amber-400 font-bold">{importPreviewData.existingMatched}</strong>
              </div>
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Skipped Unmatched (Protected)</span>
                <strong className="text-base text-slate-300 font-bold">{importPreviewData.skippedUnmatched || 0}</strong>
              </div>
            </div>

            {importPreviewData.warnings && importPreviewData.warnings.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Validation & Safety Warnings ({importPreviewData.warnings.length})</span>
                </div>
                <ul className="text-[11px] text-amber-400/90 list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto font-mono">
                  {importPreviewData.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={`p-3 rounded-xl border text-xs space-y-2 ${
              isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-bold text-slate-300 flex justify-between items-center">
                <span>LaserEngine Data Safety Authority</span>
                <Badge variant="emerald">SAFE MERGE</Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                Partial Laser Monitor backups update only matching active Machine Passports while preserving all operational history, focus optimizations, and engineering records. Unmatched records are safely rejected without creating stripped machines.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImportPreviewModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Upload className="w-4 h-4" />}
                onClick={handleConfirmImport}
              >
                Import
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Import Result Modal */}
      {importResultModalOpen && importResultSummary && (
        <Modal
          isOpen={importResultModalOpen}
          onClose={() => setImportResultModalOpen(false)}
          title="Laser Monitor Import Completed"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
              <div>
                <strong className="block font-bold">Import Completed Safely</strong>
                <span>
                  {importResultSummary.existingMatched > 0
                    ? `Successfully merged ${importResultSummary.existingMatched} matched machine(s). All embedded engineering records were preserved.`
                    : 'No matching active machines found. All unmatched records were safely skipped.'}
                </span>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-xl border ${
              isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Machines in File:</span>
                <strong className="text-white">{importResultSummary.machinesImported}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Laser Heads Processed:</span>
                <strong className="text-white">{importResultSummary.laserHeadsImported}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Merged Existing:</span>
                <strong className="text-amber-400">{importResultSummary.existingMatched}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Skipped Unmatched:</span>
                <strong className="text-slate-300">{importResultSummary.skippedUnmatched || 0}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setImportResultModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Fan-Out MHC Specifications Modal */}
      {isFanOutModalOpen && selectedMachine && (
        <Modal
          isOpen={isFanOutModalOpen}
          onClose={() => setIsFanOutModalOpen(false)}
          title={`Fan-Out Baseline Specs: ${selectedMachine.machineNumber || selectedMachine.model}`}
          subtitle="Apply this machine's MHC / calibration specifications to multiple target machines"
          maxWidth="2xl"
        >
          <div className="space-y-4 p-4">
            {/* Source Specs Summary */}
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-[#16191D] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Source Specification Set
                </span>
                <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {selectedMachine.machineNumber || selectedMachine.model} ({selectedMachine.customerName || 'General'})
                </span>
              </div>

              {hasConfiguredMhcSpecs(selectedMachine) ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <span className="text-[9px] uppercase text-slate-500 font-bold block">Laser Power</span>
                    <span className="font-semibold">{selectedMachine.mhcSpecs?.laserPower?.targetPowerWatts !== undefined ? `${selectedMachine.mhcSpecs.laserPower.targetPowerWatts}W ±${selectedMachine.mhcSpecs.laserPower.powerTolerancePercent || 0}%` : '—'}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <span className="text-[9px] uppercase text-slate-500 font-bold block">Beam Mode</span>
                    <span className="font-semibold truncate block">{selectedMachine.mhcSpecs?.beamProfile?.profileMode || '—'}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <span className="text-[9px] uppercase text-slate-500 font-bold block">Stage Cal</span>
                    <span className="font-semibold">{selectedMachine.mhcSpecs?.stageCalibration?.toleranceUm !== undefined ? `±${selectedMachine.mhcSpecs.stageCalibration.toleranceUm}µm` : '—'}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <span className="text-[9px] uppercase text-slate-500 font-bold block">AGC Scanner</span>
                    <span className="font-semibold">{selectedMachine.mhcSpecs?.agcCalibration?.toleranceUm !== undefined ? `±${selectedMachine.mhcSpecs.agcCalibration.toleranceUm}µm` : '—'}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-white border-slate-200'}`}>
                    <span className="text-[9px] uppercase text-slate-500 font-bold block">Cooling Temp</span>
                    <span className="font-semibold">{selectedMachine.mhcSpecs?.temperatureCooling?.targetTempCelsius !== undefined ? `${selectedMachine.mhcSpecs.temperatureCooling.targetTempCelsius}°C ±${selectedMachine.mhcSpecs.temperatureCooling.tempToleranceCelsius || 0}°C` : '—'}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-500 p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>The source machine currently has no MHC specifications recorded. Please configure its specs before fan-out.</span>
                </div>
              )}
            </div>

            {/* Target Filter & Batch Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter target machines by name, customer, line..."
                    value={fanOutFilter}
                    onChange={(e) => setFanOutFilter(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allCandidateIds = machines
                        .filter(m => m.id !== selectedMachine.id)
                        .filter(m => {
                          if (!fanOutFilter.trim()) return true;
                          const q = fanOutFilter.toLowerCase();
                          return (
                            (m.machineNumber && m.machineNumber.toLowerCase().includes(q)) ||
                            (m.model && m.model.toLowerCase().includes(q)) ||
                            (m.customerName && m.customerName.toLowerCase().includes(q)) ||
                            (m.productionLineName && m.productionLineName.toLowerCase().includes(q))
                          );
                        })
                        .map(m => m.id);
                      setFanOutTargetIds(allCandidateIds);
                    }}
                    className="text-xs py-1 h-auto"
                  >
                    Select All Filtered
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFanOutTargetIds([])}
                    className="text-xs py-1 h-auto"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Target List */}
              <div className={`max-h-56 overflow-y-auto rounded-xl border divide-y ${
                isDark ? 'bg-[#111315] border-[#2B323A] divide-[#2B323A]' : 'bg-white border-slate-200 divide-slate-100'
              }`}>
                {machines
                  .filter(m => m.id !== selectedMachine.id)
                  .filter(m => {
                    if (!fanOutFilter.trim()) return true;
                    const q = fanOutFilter.toLowerCase();
                    return (
                      (m.machineNumber && m.machineNumber.toLowerCase().includes(q)) ||
                      (m.model && m.model.toLowerCase().includes(q)) ||
                      (m.customerName && m.customerName.toLowerCase().includes(q)) ||
                      (m.productionLineName && m.productionLineName.toLowerCase().includes(q))
                    );
                  })
                  .map(m => {
                    const isSelected = fanOutTargetIds.includes(m.id);
                    const hasSpecs = hasConfiguredMhcSpecs(m);
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleFanOutTarget(m.id)}
                        className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? isDark ? 'bg-indigo-500/10' : 'bg-indigo-50/70'
                            : isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent div
                            className="rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                {m.machineNumber || m.model}
                              </span>
                              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {m.model}
                              </span>
                            </div>
                            <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} truncate`}>
                              {m.customerName || 'General'} • {m.plantName || 'Plant'} • {m.productionLineName || 'Line'}
                            </div>
                          </div>
                        </div>

                        <div>
                          {hasSpecs ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                              Has Existing Specs
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              No Specs
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Overwrite Warning & Explicit Confirmation */}
            {(() => {
              const overwritingCount = machines.filter(
                m => m.id !== selectedMachine.id && fanOutTargetIds.includes(m.id) && hasConfiguredMhcSpecs(m)
              ).length;

              if (overwritingCount === 0) return null;

              return (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Overwrite Notice: {overwritingCount} selected machine{overwritingCount > 1 ? 's' : ''} already have configured MHC specifications.</span>
                  </div>
                  <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={fanOutConfirmOverwrite}
                      onChange={(e) => setFanOutConfirmOverwrite(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-medium text-[11px]">
                      I explicitly confirm overwriting existing specifications on {overwritingCount} machine{overwritingCount > 1 ? 's' : ''} with this source machine's baseline.
                    </span>
                  </label>
                </div>
              );
            })()}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-medium">
                {fanOutTargetIds.length} target machine{fanOutTargetIds.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFanOutModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<Share2 className="w-4 h-4" />}
                  disabled={
                    fanOutTargetIds.length === 0 ||
                    !hasConfiguredMhcSpecs(selectedMachine) ||
                    (machines.filter(m => m.id !== selectedMachine.id && fanOutTargetIds.includes(m.id) && hasConfiguredMhcSpecs(m)).length > 0 && !fanOutConfirmOverwrite)
                  }
                  onClick={handleApplyFanOut}
                >
                  Apply to {fanOutTargetIds.length} Machine{fanOutTargetIds.length === 1 ? '' : 's'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};
