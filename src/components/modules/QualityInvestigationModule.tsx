import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, Plus, CheckCircle2, Search } from 'lucide-react';
import { QualityInvestigation, Machine } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

interface QualityInvestigationProps {
  investigations: QualityInvestigation[];
  machines: Machine[];
  onAddInvestigation: (investigation: QualityInvestigation) => void;
}

export const QualityInvestigationModule: React.FC<QualityInvestigationProps> = ({
  investigations,
  machines,
  onAddInvestigation
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<QualityInvestigation>>({
    issueDescription: '',
    rootCauseAnalysis: '',
    correctiveActionsTaken: '',
    severity: 'MAJOR',
    status: 'INVESTIGATING'
  });

  const handleCreate = () => {
    const item: QualityInvestigation = {
      id: `qi-${Date.now()}`,
      ticketNumber: `QI-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      machineId: machines[0]?.id || '',
      machineName: machines[0]?.model || 'Unassigned Equipment',
      customerName: machines[0]?.customerName || 'Direct Customer',
      reportedDate: new Date().toISOString().split('T')[0],
      issueDescription: form.issueDescription || '',
      rootCauseAnalysis: form.rootCauseAnalysis || '',
      correctiveActionsTaken: form.correctiveActionsTaken || '',
      severity: form.severity as any || 'MAJOR',
      status: form.status as any || 'INVESTIGATING',
      engineerAssigned: 'Field Service Engineer'
    };
    onAddInvestigation(item);
    setForm({
      issueDescription: '',
      rootCauseAnalysis: '',
      correctiveActionsTaken: '',
      severity: 'MAJOR',
      status: 'INVESTIGATING'
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className={`flex items-center justify-between p-4 rounded-xl border ${
        isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
      }`}>
        <div>
          <span className={`text-xs font-mono font-bold uppercase ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>Quality Investigations</span>
          <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Failure Root Cause Analysis (RCA) Log</h2>
        </div>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          New Quality Ticket
        </Button>
      </div>

      <div className="space-y-4">
        {investigations.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${
            isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-300' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-bold">No Quality Tickets Logged</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              There are currently no failure investigations or RCA tickets recorded in the system.
            </p>
          </div>
        ) : (
          investigations.map((qi) => (
            <Card key={qi.id}>
              <div className="space-y-3 text-xs">
                <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold ${isDark ? 'text-[#E98A8A]' : 'text-rose-700'}`}>{qi.ticketNumber}</span>
                    <Badge variant={qi.severity === 'CRITICAL' ? 'rose' : 'amber'}>{qi.severity}</Badge>
                  </div>
                  <Badge variant={qi.status === 'RESOLVED' ? 'emerald' : 'cyan'}>{qi.status}</Badge>
                </div>

                <div>
                  <span className={`font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Reported Defect Issue:</span>
                  <p className={`font-semibold text-sm mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{qi.issueDescription}</p>
                  <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>
                    Machine: {qi.machineName} ({qi.customerName}) • Assigned: {qi.engineerAssigned}
                  </p>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg border ${
                  isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className={`font-bold font-mono block mb-0.5 ${isDark ? 'text-[#EFCB7A]' : 'text-amber-700'}`}>Root Cause Analysis (RCA)</span>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-800'}>{qi.rootCauseAnalysis}</p>
                  </div>
                  <div>
                    <span className={`font-bold font-mono block mb-0.5 ${isDark ? 'text-[#7FD4A6]' : 'text-emerald-700'}`}>Corrective Actions Taken</span>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-800'}>{qi.correctiveActionsTaken}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Quality Investigation Ticket">
        <div className="space-y-4 text-xs">
          <div>
            <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Issue Description</label>
            <textarea
              value={form.issueDescription}
              onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
              rows={2}
              className={`w-full border rounded-lg p-2.5 transition-all ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Root Cause Analysis (RCA)</label>
            <textarea
              value={form.rootCauseAnalysis}
              onChange={(e) => setForm({ ...form, rootCauseAnalysis: e.target.value })}
              rows={2}
              className={`w-full border rounded-lg p-2.5 transition-all ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Corrective Actions Taken</label>
            <textarea
              value={form.correctiveActionsTaken}
              onChange={(e) => setForm({ ...form, correctiveActionsTaken: e.target.value })}
              rows={2}
              className={`w-full border rounded-lg p-2.5 transition-all ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className={`pt-4 flex justify-end gap-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Save Ticket</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
