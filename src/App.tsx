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
import { ImageStore } from './utils/imageStore';
import { SyncEngine } from './utils/syncEngine';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './components/auth/LoginPage';

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

function AppLayout() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('start_page');
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

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
    return {
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
  });

  // Load state from StorageService & IDB on mount
  useEffect(() => {
    // Preload IDB images and refresh synced machine/customer state
    ImageStore.preloadAllImagesFromIDB().then(() => {
      const loadedMachines = StorageService.getMachines();
      const currentCusts = StorageService.getCustomers();
      const rec = StorageService.reconcileCustomerIdentities(loadedMachines, currentCusts);
      setMachines(rec.machines);
      setCustomers(rec.customers);
    }).catch(err => {
      console.warn('[App] Error preloading images from IDB:', err);
    });

    // Subscribe to SyncEngine remote updates to synchronize React UI
    const unsubscribeSync = SyncEngine.subscribe((state) => {
      if (state.status === 'synced') {
        try {
          const curCusts = StorageService.getCustomers();
          const curMachines = StorageService.getMachines();
          const rec = StorageService.reconcileCustomerIdentities(curMachines, curCusts);
          setMachines(rec.machines);
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
      phone: user.phone
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
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
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
  const handleUpdateContract = (updatedContract: Contract) => {
    const updated = contracts.map((c) => (c.id === updatedContract.id ? updatedContract : c));
    setContracts(updated);
    StorageService.saveContracts(updated);
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
    <div className={`min-h-screen flex transition-colors duration-250 ${
      isDark ? 'bg-[#111315] text-[#F3F4F6]' : 'bg-slate-100/80 text-slate-900'
    }`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        urgentAlertsCount={alerts.filter((a) => a.severity === 'CRITICAL').length}
        profile={profile}
        workspaceMode={workspaceMode}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          alerts={alerts}
          notifications={notifications}
          activeUser={activeUser}
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onOpenQuickMhc={() => setActiveTab('mhc')}
          nextPriorityAction={nextPriorityAction}
          workspaceMode={workspaceMode}
          onModeChange={handleModeChange}
          onLogout={handleLogout}
        />

        <main className={`flex-1 ${
          (activeTab === 'mhc' || activeTab.startsWith('mhc_'))
            ? 'p-2 sm:p-3 max-w-none w-full overflow-y-auto'
            : 'p-4 md:p-6 max-w-7xl w-full mx-auto overflow-y-auto'
        }`}>
          {activeTab === 'start_page' && (
            workspaceMode === 'MHC_MODE' ? (
              <MHCModeHome
                machines={machines}
                mhcRecords={mhcRecords}
                selectedMachineId={selectedMachineId}
                onSelectMachine={(id) => setSelectedMachineId(id)}
                onOpenMhcInspection={(id) => {
                  setSelectedMachineId(id);
                  setActiveTab('mhc');
                }}
                onAddMachine={() => {
                  setActiveTab('machines');
                }}
              />
            ) : (
              <StartPageModule
                onNavigate={setActiveTab}
                schedule={schedule}
                machines={machines}
                tasks={tasks}
                profile={profile}
                unreadNotificationsCount={notifications.filter(n => !n.read).length}
                onSelectMachine={(id) => {
                  setSelectedMachineId(id);
                  setActiveTab('machines');
                }}
              />
            )
          )}

          {activeTab === 'contracts' && (
            <ContractsModule
              contracts={contracts}
              onUpdateContract={handleUpdateContract}
              onOpenPlannerForContract={() => setActiveTab('contracts')}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersPlantsModule
              customers={customers}
              plants={plants}
              lines={lines}
              machines={machines}
              onSelectMachine={(id) => {
                setSelectedMachineId(id);
                setActiveTab('machines');
              }}
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
                setActiveTab('mhc');
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
            <AnalyticsModule machines={machines} />
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
              onUpdateUser={handleUpdateUser}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule 
              onResetData={handleResetData} 
            />
          )}
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
