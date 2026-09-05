import React, { useState, useEffect } from 'react';
import { Machine, MHCRecord, MHCSession, NavigationTab } from '../../types';
import { StorageService } from '../../utils/persistence';
import { ImageStore, mergeSessionsPreservingImages } from '../../utils/imageStore';
import { Card } from '../common/Card';
import { Cpu, Activity } from 'lucide-react';

// Active Subcomponents
import { MhcHistoryView } from '../mhc/MhcHistoryView';
import { MhcAutopilot } from '../mhc/MhcAutopilot';

interface MachineHealthCheckProps {
  machines: Machine[];
  initialMachineId?: string;
  activeSubTab?: NavigationTab;
  onSaveMhcRecord?: (record: MHCRecord) => void;
  onNavigate?: (tab: NavigationTab) => void;
  onUpdateMachine?: (machine: Machine) => void;
}

export const MachineHealthCheckModule: React.FC<MachineHealthCheckProps> = ({
  machines = [],
  initialMachineId,
  activeSubTab = 'mhc_autopilot',
  onNavigate,
  onUpdateMachine
}) => {
  // 1. Selected Machine
  const [selectedMachineId, setSelectedMachineId] = useState<string>(
    initialMachineId || machines[0]?.id || ''
  );

  // Sync selectedMachineId if machines change
  useEffect(() => {
    if (machines.length > 0) {
      if (!selectedMachineId || !machines.some(m => m.id === selectedMachineId)) {
        setSelectedMachineId(machines[0].id);
      }
    }
  }, [machines, selectedMachineId]);

  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];

  // 2. All MHC Sessions persistence state
  const [mhcSessions, setMhcSessions] = useState<MHCSession[]>(() =>
    StorageService.getMhcSessions()
  );

  // Active Session for current machine
  const activeSession = mhcSessions.find(
    (s) => s.machineId === selectedMachineId && s.completionStatus !== 'COMPLETED'
  ) || mhcSessions.find((s) => s.machineId === selectedMachineId);

  // 1. Targeted hydration of activeSession images independently of cloud sync
  useEffect(() => {
    if (!activeSession) return;
    const sessionKeys = ImageStore.collectIdbKeys(activeSession);
    if (sessionKeys.length === 0) return;

    ImageStore.hydrateKeysAsync(sessionKeys).then(() => {
      setMhcSessions(prev => {
        return prev.map(s => {
          if (s.id === activeSession.id) {
            return ImageStore.hydrateImagesSync(s);
          }
          return s;
        });
      });
    }).catch(err => {
      console.warn('[MachineHealthCheckModule] Error hydrating active session images:', err);
    });
  }, [activeSession?.id, selectedMachineId]);

  // 2. Reactive listener for asynchronous ImageStore hydration
  useEffect(() => {
    const unsub = ImageStore.subscribe(() => {
      setMhcSessions(prev => prev.map(s => ImageStore.hydrateImagesSync(s)));
    });
    return unsub;
  }, []);

  // 3. View Mode: 'mhc_autopilot' | 'mhc_history'
  const [viewMode, setViewMode] = useState<'mhc_autopilot' | 'mhc_history'>('mhc_autopilot');

  // Handle activeSubTab mapping from sidebar navigation
  useEffect(() => {
    if (!activeSubTab) return;

    if (activeSubTab === 'mhc_history') {
      setViewMode('mhc_history');
    } else {
      setViewMode('mhc_autopilot');
    }
  }, [activeSubTab]);

  // Update session state helper
  const handleUpdateSession = (updatedSession: MHCSession) => {
    const exists = mhcSessions.some(s => s.id === updatedSession.id);
    const updatedList: MHCSession[] = exists 
      ? mhcSessions.map((s) => (s.id === updatedSession.id ? updatedSession : s))
      : [updatedSession, ...mhcSessions];
    const preservedList: MHCSession[] = mergeSessionsPreservingImages<MHCSession>(updatedList, mhcSessions);
    setMhcSessions(preservedList);
    StorageService.saveMhcSessions(preservedList);
  };

  // Safe Discard / Delete Draft Session helper
  const handleDeleteSession = (sessionId: string) => {
    const targetSession = mhcSessions.find(s => s.id === sessionId);
    // Explicit protection: Completed sessions are historical and MUST NOT be deleted as drafts
    if (!targetSession || targetSession.completionStatus === 'COMPLETED') {
      return;
    }
    const updatedList = mhcSessions.filter((s) => s.id !== sessionId);
    setMhcSessions(updatedList);
    StorageService.saveMhcSessions(updatedList);
    ImageStore.deleteImagesForRecord(sessionId).catch(err => {
      console.warn('[MachineHealthCheckModule] Error cleaning up session images:', err);
    });
  };

  // If no machines are registered/available in the system and not in history view, render an empty state
  if ((!machines || machines.length === 0 || !selectedMachine) && viewMode !== 'mhc_history') {
    return (
      <div className="space-y-4">
        <Card className="p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
            <Cpu className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold">No Machines Available for Health Check</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please register or import a machine in Machine Passport before launching a Machine Health Check inspection.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. CANONICAL MHC AUTOPILOT EXPERIENCE */}
      {viewMode === 'mhc_autopilot' && selectedMachine && (
        <MhcAutopilot
          machines={machines}
          selectedMachine={selectedMachine}
          activeSession={activeSession}
          mhcSessions={mhcSessions}
          onSelectMachine={(m) => setSelectedMachineId(m.id)}
          onUpdateSession={handleUpdateSession}
          onSaveNewSession={handleUpdateSession}
          onDeleteSession={handleDeleteSession}
          onExitAutopilot={() => {
            if (onNavigate) {
              onNavigate('start_page');
            } else {
              setViewMode('mhc_history');
            }
          }}
          onNavigate={onNavigate}
          onUpdateMachine={onUpdateMachine}
        />
      )}

      {/* 2. MHC HISTORY VIEW */}
      {viewMode === 'mhc_history' && (
        <MhcHistoryView
          sessions={mhcSessions}
          machines={machines}
          onOpenSession={(sessionId) => {
            const target = mhcSessions.find(s => s.id === sessionId);
            if (target) {
              setSelectedMachineId(target.machineId);
              setViewMode('mhc_autopilot');
            }
          }}
          onOpenSmartWorkspace={(sessionId) => {
            const target = mhcSessions.find(s => s.id === sessionId);
            if (target) {
              setSelectedMachineId(target.machineId);
              setViewMode('mhc_autopilot');
            }
          }}
        />
      )}
    </div>
  );
};
