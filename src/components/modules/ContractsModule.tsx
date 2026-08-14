import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  Building2, 
  Layers, 
  ShieldCheck, 
  ChevronRight, 
  Save 
} from 'lucide-react';
import { Contract } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

interface ContractsModuleProps {
  contracts: Contract[];
  onUpdateContract: (updatedContract: Contract) => void;
  onOpenPlannerForContract: (contractId: string) => void;
}

export const ContractsModule: React.FC<ContractsModuleProps> = ({
  contracts,
  onUpdateContract,
  onOpenPlannerForContract
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [selectedContractId, setSelectedContractId] = useState<string>(contracts[0]?.id || '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const selectedContract = contracts.find((c) => c.id === selectedContractId) || contracts[0];

  const handleEditClick = () => {
    if (selectedContract) {
      setEditingContract({ ...selectedContract });
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (editingContract) {
      onUpdateContract(editingContract);
      setIsEditModalOpen(false);
    }
  };

  const toggleMilestone = (milestoneId: string) => {
    if (!selectedContract) return;
    const updatedMilestones = selectedContract.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progressPercent = Math.round((completedCount / updatedMilestones.length) * 100);

    const updated = {
      ...selectedContract,
      milestones: updatedMilestones,
      progressPercent
    };
    onUpdateContract(updated);
  };

  if (!selectedContract || contracts.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-300' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <FileText className="w-12 h-12 text-sky-500 mx-auto mb-3 opacity-70" />
          <h3 className="text-lg font-bold">No Service Contracts Registered</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            There are currently no active SLA or service agreements configured in the system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Contract Selector Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contracts.map((cnt) => {
          const isSelected = cnt.id === selectedContract.id;
          return (
            <div
              key={cnt.id}
              onClick={() => setSelectedContractId(cnt.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? isDark
                    ? 'bg-[#1A1D21] border-[#8B9DFF] shadow-lg shadow-black/20'
                    : 'bg-blue-50 border-blue-500 shadow-md'
                  : isDark
                    ? 'bg-[#111315] border-[#2B323A] hover:bg-[#1A1D21]'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>{cnt.contractNumber}</span>
                <Badge variant={cnt.riskLevel === 'LOW' ? 'emerald' : 'amber'} size="sm">
                  {cnt.status}
                </Badge>
              </div>
              <h3 className={`text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{cnt.customerName}</h3>
              <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{cnt.plantName}</p>

              <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-mono ${
                isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
              }`}>
                <span>Progress: {cnt.progressPercent}%</span>
                <span>{cnt.remainingWorkingDays} Days Left</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Selected Contract Detail View */}
      <Card
        title={
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono font-bold ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>{selectedContract.contractNumber}</span>
                <Badge variant={selectedContract.riskLevel === 'LOW' ? 'emerald' : 'amber'}>
                  Risk Level: {selectedContract.riskLevel}
                </Badge>
              </div>
              <h2 className={`text-xl font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{selectedContract.customerName}</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{selectedContract.plantName}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />} onClick={handleEditClick}>
                Edit Contract
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Calendar className="w-3.5 h-3.5" />}
                onClick={() => onOpenPlannerForContract(selectedContract.id)}
              >
                Open 2-Year Planner
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Key Metrics Bar */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border ${
            isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <span className={`text-[11px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Duration</span>
              <p className={`text-base font-bold mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{selectedContract.durationMonths} Months</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{selectedContract.startDate} to {selectedContract.endDate}</p>
            </div>
            <div>
              <span className={`text-[11px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Total Working Days</span>
              <p className={`text-base font-bold mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{selectedContract.totalWorkingDays} Days</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>M-F Working Calendar</p>
            </div>
            <div>
              <span className={`text-[11px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Remaining Days</span>
              <p className={`text-base font-bold mt-0.5 ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>{selectedContract.remainingWorkingDays} Days</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Active Execution Window</p>
            </div>
            <div>
              <span className={`text-[11px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Lead Engineer</span>
              <p className={`text-xs font-semibold truncate mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{selectedContract.engineerAssigned}</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{selectedContract.quarterlyScheduleCount} Quarterly MHCs</p>
            </div>
          </div>

          {/* Deliverables & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Contract Deliverables & Scope">
              <ul className="space-y-2">
                {selectedContract.deliverables.map((del, i) => (
                  <li key={i} className={`flex items-start gap-2.5 text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-[#8ECDF7]' : 'text-sky-700'}`} />
                    <span>{del}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Terms, SLA & Custom Notes">
              <div className="space-y-3 text-xs">
                <div>
                  <span className={`font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Service Level Agreement:</span>
                  <p className={`p-2.5 rounded-lg border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>{selectedContract.terms}</p>
                </div>
                <div>
                  <span className={`font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Site Protocol Notes:</span>
                  <p className={`p-2.5 rounded-lg border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-[#EFCB7A]' : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    {selectedContract.customNotes}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Milestones & Execution Timeline */}
          <Card title="2-Year Contract Milestones & Progress Tracking">
            <div className="space-y-3">
              {selectedContract.milestones.map((ms) => (
                <div
                  key={ms.id}
                  onClick={() => toggleMilestone(ms.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    ms.completed
                      ? isDark
                        ? 'bg-[#7FD4A6]/10 border-[#7FD4A6]/30 text-slate-200'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : isDark
                        ? 'bg-[#111315] border-[#2B323A] hover:bg-[#1A1D21] text-slate-100'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        ms.completed
                          ? isDark ? 'bg-[#7FD4A6] border-[#7FD4A6] text-slate-950' : 'bg-emerald-600 border-emerald-600 text-white'
                          : isDark ? 'border-slate-600 bg-[#1A1D21]' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {ms.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{ms.title}</p>
                      <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Due Target: {ms.dueDate}</p>
                    </div>
                  </div>

                  <Badge variant={ms.completed ? 'emerald' : 'amber'} size="sm">
                    {ms.completed ? 'COMPLETED' : 'PENDING'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Card>

      {/* Edit Contract Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Contract Specifications"
        subtitle={editingContract?.contractNumber}
      >
        {editingContract && (
          <div className="space-y-4 text-xs">
            <div>
              <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Customer Name</label>
              <input
                type="text"
                value={editingContract.customerName}
                onChange={(e) => setEditingContract({ ...editingContract, customerName: e.target.value })}
                className={`w-full border rounded-lg p-2.5 transition-all ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Plant Name</label>
              <input
                type="text"
                value={editingContract.plantName}
                onChange={(e) => setEditingContract({ ...editingContract, plantName: e.target.value })}
                className={`w-full border rounded-lg p-2.5 transition-all ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Start Date</label>
                <input
                  type="date"
                  value={editingContract.startDate}
                  onChange={(e) => setEditingContract({ ...editingContract, startDate: e.target.value })}
                  className={`w-full border rounded-lg p-2.5 transition-all ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>End Date</label>
                <input
                  type="date"
                  value={editingContract.endDate}
                  onChange={(e) => setEditingContract({ ...editingContract, endDate: e.target.value })}
                  className={`w-full border rounded-lg p-2.5 transition-all ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Total Working Days</label>
                <input
                  type="number"
                  value={editingContract.totalWorkingDays}
                  onChange={(e) =>
                    setEditingContract({ ...editingContract, totalWorkingDays: parseInt(e.target.value) || 0 })
                  }
                  className={`w-full border rounded-lg p-2.5 transition-all ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Remaining Working Days</label>
                <input
                  type="number"
                  value={editingContract.remainingWorkingDays}
                  onChange={(e) =>
                    setEditingContract({ ...editingContract, remainingWorkingDays: parseInt(e.target.value) || 0 })
                  }
                  className={`w-full border rounded-lg p-2.5 transition-all ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Assigned Lead Engineer</label>
              <input
                type="text"
                value={editingContract.engineerAssigned}
                onChange={(e) => setEditingContract({ ...editingContract, engineerAssigned: e.target.value })}
                className={`w-full border rounded-lg p-2.5 transition-all ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Terms & Conditions</label>
              <textarea
                value={editingContract.terms}
                onChange={(e) => setEditingContract({ ...editingContract, terms: e.target.value })}
                rows={3}
                className={`w-full border rounded-lg p-2.5 transition-all ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className={`pt-4 flex items-center justify-end gap-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSaveEdit}>
                Save Contract Details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
