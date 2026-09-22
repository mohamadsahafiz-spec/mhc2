/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  NavigationTab, 
  Customer, 
  Plant, 
  ProductionLine, 
  Machine, 
  Contract, 
  ExecutionScheduleItem, 
  MHCRecord, 
  FieldEngineerTask, 
  AlertItem, 
  QualityInvestigation, 
  BaselineCheck,
  EngineerProfile,
  NotificationItem,
  SystemUser,
  WorkspaceMode,
  UserSession
} from './types';
import { StorageService } from './utils/persistence';
import { ImageStore, mergeMachinesPreservingImages } from './utils/imageStore';
import { SyncEngine } from './utils/syncEngine';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { motionTimings, motionEasings } from './theme/motion';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './components/auth/LoginPage';
import { AppCanvasShader } from './components/common/AppCanvasShader';

// Modules
import { StartPageModule } from './components/modules/StartPageModule';
import { MHCModeHome } from './components/modules/MHCModeHome';
import { ContractsModule } from './components/modules/ContractsModule';
import { CustomersPlantsModule } from './components/modules/CustomersPlantsModule';
import { MachinePassportModule } from './components/modules/MachinePassportModule';
import { MachineHealthCheckModule } from './components/modules/MachineHealthCheckModule';
import { AnalyticsModule } from './components/modules/AnalyticsModule';
import { UsersModule } from './components/modules/UsersModule';
import { ProfileModule } from './components/modules/ProfileModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { ChangelogModule } from './components/modules/ChangelogModule';

function AppLayout() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('start_page');
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const prefersReducedMotion = Boolean(useReducedMotion());

  // Auth & Workspace Mode State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const authSession = StorageService.getAuth();
    return Boolean(authSession && authSession.isAuthenticated);
  });
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(() => {
    const authSession = StorageService.getAuth();
    return authSession?.workspaceMode || StorageService.getWorkspaceMode() || 'MHC_MODE';
  });

  // Operational State initialized synchronously from StorageService
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const initialCusts = StorageService.getCustomers();
    const initialMachines = StorageService.getMachines();
    return StorageService.reconcileCustomerIdentities(initialMachines, initialCusts).customers;
  });
  const [plants, setPlants] = useState<Plant[]>(() => StorageService.getPlants());
  const [lines, setLines] = useState<ProductionLine[]>(() => StorageService.getLines());
  const [machines, setMachines] = useState<Machine[]>(() => {
    const initialCusts = StorageService.getCustomers();
    const initialMachines = StorageService.getMachines();
    return StorageService.reconcileCustomerIdentities(initialMachines, initialCusts).machines;
  });
  const [contracts, setContracts] = useState<Contract[]>(() => StorageService.getContracts());
  const [schedule, setSchedule] = useState<ExecutionScheduleItem[]>(() => StorageService.getSchedule());
  const [mhcRecords, setMhcRecords] = useState<MHCRecord[]>(() => StorageService.getMhcRecords());
  const [tasks, setTasks] = useState<FieldEngineerTask[]>(() => StorageService.getTasks());
  const [alerts, setAlerts] = useState<AlertItem[]>(() => StorageService.getAlerts());
  const [investigations, setInvestigations] = useState<QualityInvestigation[]>(() => StorageService.getInvestigations());
  const [baselines, setBaselines] = useState<BaselineCheck[]>(() => StorageService.getBaselines());
  const [profile, setProfile] = useState<EngineerProfile>(() => StorageService.getProfile());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => StorageService.getNotifications());
  const [users, setUsers] = useState<SystemUser[]>(() => StorageService.getUsers());
  const [selectedMachineId, setSelectedMachineId] = useState<string>(() => {
    const initMachines = StorageService.getMachines();
    return initMachines.length > 0 ? initMachines[0].id : '';
  });
  const [activeUser, setActiveUser] = useState<SystemUser>(() => {
    const loadedUsers = StorageService.getUsers();
    if (loadedUsers.length > 0) return loadedUsers[0];
    return StorageService.getInitialActiveOperator();
  });

  // Sidebar Visibility State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('fsos_sidebar_open');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return true;
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('fsos_sidebar_open', String(next));
      }
      return next;
    });
  };

  // Load state from StorageService & IDB on mount
  useEffect(() => {
    // 1. Targeted startup image hydration & unseen media purge (runs independently of SyncEngine!)
    ImageStore.hydrateAppState().then(async () => {
      const loadedMachines = StorageService.getMachines();
      const currentCusts = StorageService.getCustomers();
      const rec = StorageService.reconcileCustomerIdentities(loadedMachines, currentCusts);
      const recPlants = StorageService.reconcilePlantsAndLines(rec.machines, rec.customers, StorageService.getPlants(), StorageService.getLines());
      StorageService.savePlants(recPlants.plants);
      StorageService.saveLines(recPlants.lines);
      setPlants(recPlants.plants);
      setLines(recPlants.lines);
      StorageService.reconcileMhcSessions(undefined, rec.machines);
      StorageService.sanitizeLocalStorageGhostMedia();
      await ImageStore.purgeUnseenMedia();
      setMachines(prev => mergeMachinesPreservingImages(rec.machines, prev));
      setCustomers(rec.customers);
    }).catch(err => {
      console.warn('[App] Error during startup image hydration / media purge:', err);
    });

    // 2. Reactive listener for asynchronous ImageStore hydration
    let isMounted = true;
    let hydrationScheduled = false;
    const unsubscribeImageStore = ImageStore.subscribe(() => {
      if (hydrationScheduled) return;
      hydrationScheduled = true;
      queueMicrotask(() => {
        hydrationScheduled = false;
        if (!isMounted) return;
        const loadedMachines = StorageService.getMachines();
        setMachines(prev => mergeMachinesPreservingImages(loadedMachines, prev));
      });
    });

    // 3. Subscribe to SyncEngine remote updates to synchronize React UI without clobbering images
    const unsubscribeSync = SyncEngine.subscribe((state) => {
      if (state.status === 'synced') {
        try {
          const curCusts = StorageService.getCustomers();
          const curMachines = StorageService.getMachines();
          const rec = StorageService.reconcileCustomerIdentities(curMachines, curCusts);
          StorageService.reconcileMhcSessions(undefined, rec.machines);
          setMachines(prev => mergeMachinesPreservingImages(rec.machines, prev));
          setCustomers(rec.customers);
          setMhcRecords(StorageService.getMhcRecords());
          setPlants(StorageService.getPlants());
          setLines(StorageService.getLines());
          setContracts(StorageService.getContracts());
          setTasks(StorageService.getTasks());
          setAlerts(StorageService.getAlerts());
        } catch (err) {
          console.warn('[App] Sync update error:', err);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeImageStore();
      unsubscribeSync();
    };
  }, []);

  // Auth & Workspace Mode Handlers
  const handleLoginSuccess = (session: UserSession) => {
    setIsAuthenticated(true);
    setWorkspaceMode(session.workspaceMode);
    StorageService.saveAuth(session);
    
    const matchedUser = users.find(u => u.id === session.userId);
    if (matchedUser) {
      setActiveUser(matchedUser);
    }

    if (session.workspaceMode === 'MHC_MODE') {
      setActiveTab('start_page');
    }
  };

  const handleLogout = () => {
    StorageService.clearAuth();
    setIsAuthenticated(false);
  };

  const handleModeChange = (newMode: WorkspaceMode) => {
    setWorkspaceMode(newMode);
    StorageService.saveWorkspaceMode(newMode);
    const currentAuth = StorageService.getAuth();
    if (currentAuth) {
      StorageService.saveAuth({ ...currentAuth, workspaceMode: newMode });
    }

    // Auto-redirect to start page if current active tab is not visible in MHC Mode
    if (newMode === 'MHC_MODE') {
      const mhcAllowedTabs: NavigationTab[] = ['start_page', 'machines', 'mhc_autopilot', 'mhc', 'mhc_history', 'profile', 'customers', 'contracts', 'analytics', 'settings'];
      if (!mhcAllowedTabs.includes(activeTab)) {
        setActiveTab('start_page');
      }
    }
  };

  const handleSetActiveUser = (user: SystemUser) => {
    setActiveUser(user);
    const newProfile: EngineerProfile = {
      name: user.fullName,
      company: user.company,
      role: user.role,
      department: user.department,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl
    };
    setProfile(newProfile);
    StorageService.saveProfile(newProfile);
  };

  const handleAddUser = (newUser: SystemUser) => {
    const updated = [newUser, ...users];
    setUsers(updated);
    StorageService.saveUsers(updated);
  };

  const handleUpdateUser = (updatedUser: SystemUser) => {
    const exists = users.some(u => u.id === updatedUser.id);
    const updated = exists 
      ? users.map(u => u.id === updatedUser.id ? updatedUser : u)
      : [updatedUser, ...users];
    setUsers(updated);
    StorageService.saveUsers(updated);
    if (activeUser.id === updatedUser.id) {
      handleSetActiveUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    StorageService.saveUsers(updated);
  };

  const handleSaveProfile = (newProfile: EngineerProfile) => {
    setProfile(newProfile);
    StorageService.saveProfile(newProfile);
    if (activeUser) {
      const updatedActive: SystemUser = {
        ...activeUser,
        fullName: newProfile.name,
        company: newProfile.company,
        role: newProfile.role,
        department: newProfile.department,
        email: newProfile.email || activeUser.email,
        phone: newProfile.phone || activeUser.phone,
        avatarUrl: newProfile.avatarUrl || activeUser.avatarUrl
      };
      setActiveUser(updatedActive);
      const updatedUsers = users.map(u => u.id === activeUser.id ? updatedActive : u);
      setUsers(updatedUsers);
      StorageService.saveUsers(updatedUsers);
    }
  };

  const handleMarkNotificationAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const handleMarkAllNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    StorageService.saveNotifications([]);
  };

  // Machine Management Helpers
  const handleAddMachine = (newMachine: Machine) => {
    const currentCusts = StorageService.getCustomers();
    const updated = [newMachine, ...machines];
    const reconciled = StorageService.reconcileCustomerIdentities(updated, currentCusts);

    setCustomers(reconciled.customers);
    StorageService.saveCustomers(reconciled.customers);

    setMachines(reconciled.machines);
    StorageService.saveMachines(reconciled.machines);
    setSelectedMachineId(newMachine.id);
  };

  const handleEditMachine = (updatedMachine: Machine) => {
    const currentCusts = StorageService.getCustomers();
    const updated = machines.map((m) => (m.id === updatedMachine.id ? updatedMachine : m));
    const reconciled = StorageService.reconcileCustomerIdentities(updated, currentCusts);

    setCustomers(reconciled.customers);
    StorageService.saveCustomers(reconciled.customers);

    setMachines(reconciled.machines);
    StorageService.saveMachines(reconciled.machines);
  };

  const handleDeleteMachine = (machineId: string) => {
    const updated = machines.filter((m) => m.id !== machineId);
    setMachines(updated);
    StorageService.saveMachines(updated);
    if (selectedMachineId === machineId) {
      setSelectedMachineId(updated.length > 0 ? updated[0].id : '');
    }
  };

  const handleBatchImportMachines = (importedMachines: Machine[]) => {
    const currentCusts = StorageService.getCustomers();
    const reconciled = StorageService.reconcileCustomerIdentities(importedMachines, currentCusts);

    setCustomers(reconciled.customers);
    StorageService.saveCustomers(reconciled.customers);

    setMachines(reconciled.machines);
    StorageService.saveMachines(reconciled.machines);
    const recPlants = StorageService.reconcilePlantsAndLines(reconciled.machines, reconciled.customers, StorageService.getPlants(), StorageService.getLines());
    StorageService.savePlants(recPlants.plants);
    StorageService.saveLines(recPlants.lines);
    setPlants(recPlants.plants);
    setLines(recPlants.lines);
    StorageService.reconcileMhcSessions(undefined, reconciled.machines);
    if (reconciled.machines.length > 0) {
      setSelectedMachineId(reconciled.machines[0].id);
    }
  };

  // Customer Management Helpers
  const handleAddCustomer = (newCustomer: Customer) => {
    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    StorageService.saveCustomers(updated);
  };

  const handleEditCustomer = (updatedCustomer: Customer) => {
    const previousCustomer = customers.find((c) => c.id === updatedCustomer.id);
    const exists = customers.some((c) => c.id === updatedCustomer.id);
    const updatedCusts = exists
      ? customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
      : [updatedCustomer, ...customers];

    setCustomers(updatedCusts);
    StorageService.saveCustomers(updatedCusts);

    // CASCADE: If the customer name changed, cascade the new customerName to all machines matching customerId or old name
    const oldName = previousCustomer?.name;
    const updatedMachines = machines.map((m) => {
      if (m.customerId === updatedCustomer.id || (oldName && m.customerName === oldName)) {
        return {
          ...m,
          customerId: updatedCustomer.id,
          customerName: updatedCustomer.name
        };
      }
      return m;
    });

    setMachines(updatedMachines);
    StorageService.saveMachines(updatedMachines);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const updated = customers.filter((c) => c.id !== customerId);
    setCustomers(updated);
    StorageService.saveCustomers(updated);
  };

  // Sync to persistence helpers
  const handleSaveContract = (contractData: Contract) => {
    const exists = contracts.some((c) => c.id === contractData.id);
    const updated = exists
      ? contracts.map((c) => (c.id === contractData.id ? contractData : c))
      : [contractData, ...contracts];
    setContracts(updated);
    StorageService.saveContracts(updated);
  };

  const handleUpdateContract = (updatedContract: Contract) => {
    handleSaveContract(updatedContract);
  };

  const handleTransferMachine = (
    machineId: string,
    transferData: {
      plantName: string;
      plantId: string;
      productionLineName: string;
      productionLineId: string;
      zone: string;
    }
  ) => {
    const updatedMachines = machines.map((m) => {
      if (m.id === machineId) {
        return {
          ...m,
          plantName: transferData.plantName,
          plantId: transferData.plantId,
          productionLineName: transferData.productionLineName,
          productionLineId: transferData.productionLineId,
          zone: transferData.zone
        };
      }
      return m;
    });

    setMachines(updatedMachines);
    StorageService.saveMachines(updatedMachines);
  };

  const handleAddScheduleItem = (newItem: ExecutionScheduleItem) => {
    const updated = [newItem, ...schedule];
    setSchedule(updated);
    StorageService.saveSchedule(updated);
  };

  const handleUpdateScheduleItem = (updatedItem: ExecutionScheduleItem) => {
    const updated = schedule.map((s) => (s.id === updatedItem.id ? updatedItem : s));
    setSchedule(updated);
    StorageService.saveSchedule(updated);
  };

  const handleDeleteScheduleItem = (itemId: string) => {
    const updated = schedule.filter((s) => s.id !== itemId);
    setSchedule(updated);
    StorageService.saveSchedule(updated);
  };

  const handleSaveMhcRecord = (record: MHCRecord) => {
    const updated = [record, ...mhcRecords];
    setMhcRecords(updated);
    StorageService.saveMhcRecords(updated);
  };

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    setTasks(updated);
    StorageService.saveTasks(updated);
  };

  const handleAddInvestigation = (inv: QualityInvestigation) => {
    const updated = [inv, ...investigations];
    setInvestigations(updated);
    StorageService.saveInvestigations(updated);
  };

  const handleResetData = async () => {
    if (window.confirm("Are you sure you want to reset all operational data to factory zero-state defaults?")) {
      await StorageService.resetToDefaults();
      window.location.reload();
    }
  };

  const nextPriorityAction = machines.length > 0
    ? `Execute scheduled maintenance on ${machines[0].model} (${machines[0].machineNumber})`
    : "Awaiting Customer & Machine registration. Add equipment in Machine Passport to begin service.";

  if (!isAuthenticated) {
    return (
      <LoginPage
        users={users}
        activeUser={activeUser}
        savedWorkspaceMode={workspaceMode}
        onLoginSuccess={handleLoginSuccess}
        onLogin={(selectedUser) => {
          setActiveUser(selectedUser);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex bg-canvas text-theme-primary transition-colors duration-150 relative overflow-x-hidden`}>
      {/* Dynamic Ambient Application Canvas Shader */}
      <AppCanvasShader />

      {/* Sidebar Navigation */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isOpen={isSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
            urgentAlertsCount={alerts.filter((a) => a.severity === 'CRITICAL').length}
            profile={profile}
            workspaceMode={workspaceMode}
          />
        )}
      </AnimatePresence>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          activeUser={activeUser}
          onLogout={handleLogout}
        />

        <main className={`flex-1 ${
          (activeTab === 'mhc' || activeTab.startsWith('mhc_'))
            ? 'p-2 sm:p-3 max-w-none w-full overflow-y-auto'
            : 'p-4 md:p-6 max-w-7xl w-full mx-auto overflow-y-auto'
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: motionTimings.quick, ease: motionEasings.responsive }}
              className="w-full"
            >
              {activeTab === 'start_page' && (
                <StartPageModule
                  onNavigate={setActiveTab}
                  schedule={schedule}
                  machines={machines}
                  tasks={tasks}
                  alerts={alerts}
                  profile={profile}
                  unreadNotificationsCount={notifications.filter(n => !n.read).length}
                  onSelectMachine={(id) => {
                    setSelectedMachineId(id);
                    setActiveTab('machines');
                  }}
                  onContinueMhcSession={(id) => {
                    setSelectedMachineId(id);
                    setActiveTab('mhc_autopilot');
                  }}
                />
              )}

              {activeTab === 'contracts' && (
                <ContractsModule
                  contracts={contracts}
                  onUpdateContract={handleUpdateContract}
                  onOpenPlannerForContract={() => setActiveTab('contracts')}
                  onOpenMhcSession={(machId) => {
                    setSelectedMachineId(machId);
                    setActiveTab('mhc_history');
                  }}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersPlantsModule
                  customers={customers}
                  plants={plants}
                  lines={lines}
                  machines={machines}
                  contracts={contracts}
                  mhcSessions={StorageService.getMhcSessions()}
                  onSelectMachine={(id) => {
                    setSelectedMachineId(id);
                    setActiveTab('machines');
                  }}
                  onOpenMhcHistory={(machId) => {
                    setSelectedMachineId(machId);
                    setActiveTab('mhc_history');
                  }}
                  onAddCustomer={handleAddCustomer}
                  onEditCustomer={handleEditCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onTransferMachine={handleTransferMachine}
                  onSaveContract={handleSaveContract}
                  onOpenPlanner={() => setActiveTab('contracts')}
                />
              )}

              {activeTab === 'machines' && (
                <MachinePassportModule
                  machines={machines}
                  customers={customers}
                  selectedMachineId={selectedMachineId}
                  onSelectMachine={setSelectedMachineId}
                  mhcRecords={mhcRecords}
                  onOpenMhcForMachine={(id) => {
                    setSelectedMachineId(id);
                    setActiveTab('mhc_autopilot');
                  }}
                  onAddMachine={handleAddMachine}
                  onEditMachine={handleEditMachine}
                  onDeleteMachine={handleDeleteMachine}
                  onBatchImportMachines={handleBatchImportMachines}
                  onAddCustomer={handleAddCustomer}
                  onEditCustomer={handleEditCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                />
              )}

              {(activeTab === 'mhc' || activeTab.startsWith('mhc_')) && (
                <MachineHealthCheckModule
                  machines={machines}
                  initialMachineId={selectedMachineId}
                  activeSubTab={activeTab}
                  onSaveMhcRecord={handleSaveMhcRecord}
                  onNavigate={setActiveTab}
                  onUpdateMachine={handleEditMachine}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsModule 
                  machines={machines}
                  mhcSessions={StorageService.getMhcSessions(true)}
                  contracts={contracts}
                  customers={customers}
                  onNavigate={setActiveTab}
                  onSelectMachine={(id) => {
                    setSelectedMachineId(id);
                    setActiveTab('machines');
                  }}
                />
              )}

              {activeTab === 'users' && (
                <UsersModule
                  users={users}
                  activeUser={activeUser}
                  onSetActiveUser={handleSetActiveUser}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileModule
                  activeUser={activeUser}
                  currentUserRole={activeUser.role}
                  workspaceMode={workspaceMode}
                  plants={plants}
                  customers={customers}
                  onUpdateUser={handleUpdateUser}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsModule 
                  onResetData={handleResetData}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'changelog' && (
                <ChangelogModule 
                  onNavigate={setActiveTab}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}
