import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  User, 
  Cpu, 
  Sliders, 
  Trash2, 
  Edit2, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Filter, 
  Briefcase 
} from 'lucide-react';
import { ExecutionScheduleItem, Contract, Machine } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { UserAvatar } from '../common/UserAvatar';
import { useTheme } from '../../context/ThemeContext';

interface ExecutionPlannerProps {
  schedule: ExecutionScheduleItem[];
  contracts: Contract[];
  machines: Machine[];
  onAddScheduleItem: (item: ExecutionScheduleItem) => void;
  onUpdateScheduleItem: (item: ExecutionScheduleItem) => void;
  onDeleteScheduleItem: (itemId: string) => void;
}

export const ExecutionPlannerModule: React.FC<ExecutionPlannerProps> = ({
  schedule,
  contracts,
  machines,
  onAddScheduleItem,
  onUpdateScheduleItem,
  onDeleteScheduleItem
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'quarters'>('timeline');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [selectedEngineerFilter, setSelectedEngineerFilter] = useState<string>('ALL');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExecutionScheduleItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ExecutionScheduleItem | null>(null);

  // New item form state
  const [newItemForm, setNewItemForm] = useState<Partial<ExecutionScheduleItem>>({
    title: 'Scheduled Machine Health Check & Calibration',
    quarter: 'Q1',
    type: 'QUARTERLY_MHC',
    status: 'SCHEDULED',
    scheduledDate: new Date().toISOString().split('T')[0],
    engineerName: 'Field Service Engineer',
    estimatedHours: 4
  });

  // Calculate stats
  const totalItems = schedule.length;
  const completedItems = schedule.filter((s) => s.status === 'COMPLETED').length;
  const pendingItems = schedule.filter((s) => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS').length;
  const totalWorkloadHours = schedule.reduce((sum, item) => sum + item.estimatedHours, 0);

  // M-F Working Day Check helper
  const isWeekend = (dateStr: string) => {
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  const filteredSchedule = schedule.filter((item) => {
    if (selectedQuarter !== 'ALL' && item.quarter !== selectedQuarter) return false;
    if (selectedEngineerFilter !== 'ALL' && item.engineerName !== selectedEngineerFilter) return false;
    return true;
  });

  const quartersList = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'];

  const handleCreateNewItem = () => {
    if (isWeekend(newItemForm.scheduledDate || '')) {
      alert('Note: Field operations planner enforces Monday-Friday working days. Weekends excluded.');
      return;
    }

    const item: ExecutionScheduleItem = {
      id: `sch-${Date.now()}`,
      contractId: contracts[0]?.id || '',
      customerName: newItemForm.customerName || contracts[0]?.customerName || machines[0]?.customerName || 'Direct Customer',
      plantName: newItemForm.plantName || contracts[0]?.plantName || machines[0]?.plantName || 'Primary Cleanroom',
      machineId: newItemForm.machineId || machines[0]?.id || '',
      machineName: newItemForm.machineName || machines[0]?.model || 'Standard Laser Unit',
      engineerName: newItemForm.engineerName || 'Field Service Engineer',
      title: newItemForm.title || 'Scheduled MHC',
      scheduledDate: newItemForm.scheduledDate || new Date().toISOString().split('T')[0],
      quarter: (newItemForm.quarter as any) || 'Q1',
      type: (newItemForm.type as any) || 'QUARTERLY_MHC',
      status: (newItemForm.status as any) || 'SCHEDULED',
      estimatedHours: newItemForm.estimatedHours || 4
    };

    onAddScheduleItem(item);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = () => {
    if (editingItem) {
      if (isWeekend(editingItem.scheduledDate)) {
        alert('Note: Field operations planner enforces Monday-Friday working days. Weekends excluded.');
        return;
      }
      onUpdateScheduleItem(editingItem);
      setEditingItem(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Planner Metric Summary Bar */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl border ${
        isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
      }`}>
        <div>
          <span className={`text-xs font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>2-Year Operations Window</span>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>8 Quarters (24 Mos)</p>
          <p className={`text-[10px] font-mono ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>522 M-F Working Days</p>
        </div>
        <div>
          <span className={`text-xs font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Total Field MHC Workload</span>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{totalWorkloadHours} Hours</p>
          <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{totalItems} Total Operations</p>
        </div>
        <div>
          <span className={`text-xs font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Execution Progress</span>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-[#7FD4A6]' : 'text-emerald-700'}`}>
            {totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%
          </p>
          <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{completedItems} / {totalItems} Completed</p>
        </div>
        <div>
          <span className={`text-xs font-mono uppercase ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Pending MHC Interventions</span>
          <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-[#EFCB7A]' : 'text-amber-700'}`}>{pendingItems} Scheduled</p>
          <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Weekend Excluded (M-F)</p>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border ${
        isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* View Switcher */}
        <div className={`flex items-center p-1 rounded-lg border ${
          isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-200 border-slate-300'
        }`}>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'timeline'
                ? isDark ? 'bg-[#8B9DFF] text-slate-950 font-bold shadow-xs' : 'bg-blue-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Timeline View
          </button>
          <button
            onClick={() => setViewMode('quarters')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'quarters'
                ? isDark ? 'bg-[#8B9DFF] text-slate-950 font-bold shadow-xs' : 'bg-blue-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Quarterly Grid
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? isDark ? 'bg-[#8B9DFF] text-slate-950 font-bold shadow-xs' : 'bg-blue-600 text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            M-F Calendar View
          </button>
        </div>

        {/* Filters & Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
            isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-white border-slate-300'
          }`}>
            <Filter className={`w-3.5 h-3.5 ${isDark ? 'text-[#8ECDF7]' : 'text-sky-700'}`} />
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className={`bg-transparent focus:outline-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
            >
              <option value="ALL" className={isDark ? 'bg-[#111315]' : 'bg-white'}>All Quarters (Q1-Q8)</option>
              {quartersList.map((q) => (
                <option key={q} value={q} className={isDark ? 'bg-[#111315]' : 'bg-white'}>{q} Target</option>
              ))}
            </select>
          </div>

          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsAddModalOpen(true)}>
            Schedule Intervention
          </Button>
        </div>
      </div>

      {/* TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <Card title="Full Two-Year Field Execution Timeline (M-F Working Days)">
          <div className="space-y-4">
            {filteredSchedule.length === 0 ? (
              <div className={`p-10 text-center rounded-xl border ${
                isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-300' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <CalendarIcon className="w-10 h-10 text-sky-500 mx-auto mb-2 opacity-70" />
                <h4 className="text-sm font-bold">No Scheduled Interventions</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  There are no scheduled MHC or maintenance operations in the selected planner scope.
                </p>
              </div>
            ) : (
              filteredSchedule.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDark
                      ? 'bg-[#111315] border-[#2B323A] hover:border-[#8B9DFF]/60'
                      : 'bg-slate-50 border-slate-200 hover:border-sky-400'
                  }`}
                >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${
                    isDark ? 'bg-[#8ECDF7]/15 border-[#8ECDF7]/30 text-[#8ECDF7]' : 'bg-sky-100 border-sky-200 text-sky-800'
                  }`}>
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="cyan" size="sm">{item.quarter}</Badge>
                      <Badge variant={item.type === 'QUARTERLY_MHC' ? 'indigo' : 'amber'} size="sm">
                        {item.type}
                      </Badge>
                      <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({item.estimatedHours} hrs)</span>
                    </div>
                    <h3 className={`text-sm font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.title}</h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {item.customerName} • {item.plantName} • Machine: <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{item.machineName}</span>
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold block ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>{item.scheduledDate}</span>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <UserAvatar user={{ fullName: item.engineerName }} size="xs" />
                      <span className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {item.engineerName}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={item.status === 'COMPLETED' ? 'emerald' : item.status === 'IN_PROGRESS' ? 'amber' : 'gray'}
                  >
                    {item.status}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingItem(item)}
                      className={`p-1.5 rounded transition-colors ${
                        isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      title="Delete scheduled intervention"
                      className={`p-1.5 rounded transition-colors ${
                        isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-200'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )))
          }
        </div>
      </Card>
      )}

      {/* QUARTERLY GRID VIEW */}
      {viewMode === 'quarters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quartersList.map((q) => {
            const qItems = schedule.filter((s) => s.quarter === q);
            return (
              <Card key={q} title={`${q} Execution Plan`} subtitle={`${qItems.length} Interventions`}>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {qItems.length === 0 ? (
                    <p className={`text-xs py-6 text-center italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No events scheduled for {q}.</p>
                  ) : (
                    qItems.map((item) => (
                      <div key={item.id} className={`p-2.5 rounded-lg border text-xs ${
                        isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className={`flex items-center justify-between font-semibold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <span className="truncate">{item.customerName}</span>
                          <span className={`text-[10px] font-mono ${isDark ? 'text-[#8ECDF7]' : 'text-sky-800'}`}>{item.scheduledDate}</span>
                        </div>
                        <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.title}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* M-F CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <Card title="August 2026 M-F Working Days Calendar (Weekends Excluded)">
          <div className={`grid grid-cols-5 gap-2 text-center text-xs font-mono mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
            <div className={`p-2 rounded ${isDark ? 'bg-[#111315]' : 'bg-slate-100'}`}>Monday</div>
            <div className={`p-2 rounded ${isDark ? 'bg-[#111315]' : 'bg-slate-100'}`}>Tuesday</div>
            <div className={`p-2 rounded ${isDark ? 'bg-[#111315]' : 'bg-slate-100'}`}>Wednesday</div>
            <div className={`p-2 rounded ${isDark ? 'bg-[#111315]' : 'bg-slate-100'}`}>Thursday</div>
            <div className={`p-2 rounded ${isDark ? 'bg-[#111315]' : 'bg-slate-100'}`}>Friday</div>
          </div>
          <div className="grid grid-cols-5 gap-2 text-xs">
            {Array.from({ length: 20 }).map((_, i) => {
              const dayNum = i + 3; // Aug 3 - Aug 28 M-F
              const dateStr = `2026-08-${dayNum < 10 ? '0' + dayNum : dayNum}`;
              const dayEvents = schedule.filter((s) => s.scheduledDate === dateStr);
              return (
                <div
                  key={i}
                  className={`min-h-24 p-2 rounded-xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className={`font-mono text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{dateStr}</span>
                  <div className="space-y-1 my-1">
                    {dayEvents.map((ev) => (
                      <div key={ev.id} className={`p-1 rounded border text-[10px] truncate ${
                        isDark ? 'bg-[#8ECDF7]/20 border-[#8ECDF7]/40 text-[#8ECDF7]' : 'bg-sky-100 border-sky-200 text-sky-900 font-medium'
                      }`}>
                        {ev.title}
                      </div>
                    ))}
                  </div>
                  <span className={`text-[9px] text-right ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>M-F Valid</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add Intervention Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Schedule New Field Operation">
        <div className="space-y-4 text-xs">
          <div>
            <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Intervention Title</label>
            <input
              type="text"
              value={newItemForm.title}
              onChange={(e) => setNewItemForm({ ...newItemForm, title: e.target.value })}
              className={`w-full border rounded-lg p-2.5 transition-all ${
                isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Scheduled Date (M-F strictly)</label>
              <input
                type="date"
                value={newItemForm.scheduledDate}
                onChange={(e) => setNewItemForm({ ...newItemForm, scheduledDate: e.target.value })}
                className={`w-full border rounded-lg p-2.5 transition-all ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Target Quarter</label>
              <select
                value={newItemForm.quarter}
                onChange={(e) => setNewItemForm({ ...newItemForm, quarter: e.target.value as any })}
                className={`w-full border rounded-lg p-2.5 transition-all ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {quartersList.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Engineer Assigned</label>
              <input
                type="text"
                value={newItemForm.engineerName}
                onChange={(e) => setNewItemForm({ ...newItemForm, engineerName: e.target.value })}
                className={`w-full border rounded-lg p-2.5 transition-all ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Estimated Duration (Hours)</label>
              <input
                type="number"
                value={newItemForm.estimatedHours}
                onChange={(e) => setNewItemForm({ ...newItemForm, estimatedHours: parseInt(e.target.value) || 4 })}
                className={`w-full border rounded-lg p-2.5 transition-all ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className={`pt-4 flex justify-end gap-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleCreateNewItem}>
              Schedule Intervention
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      {editingItem && (
        <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Reschedule Field Operation">
          <div className="space-y-4 text-xs">
            <div>
              <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Intervention Title</label>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className={`w-full border rounded-lg p-2.5 transition-all ${
                  isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Scheduled Date (M-F strictly)</label>
                <input
                  type="date"
                  value={editingItem.scheduledDate}
                  onChange={(e) => setEditingItem({ ...editingItem, scheduledDate: e.target.value })}
                  className={`w-full border rounded-lg p-2.5 transition-all ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Target Quarter</label>
                <select
                  value={editingItem.quarter}
                  onChange={(e) => setEditingItem({ ...editingItem, quarter: e.target.value as any })}
                  className={`w-full border rounded-lg p-2.5 transition-all ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {quartersList.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`pt-4 flex justify-end gap-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal (ENGINEERING RULE #001) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 ${
            isDark ? 'bg-[#181B1E] border-[#2B323A] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 pb-4 border-b border-[#2B323A]">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-500">Confirm Schedule Item Deletion</h3>
                <p className="text-xs text-slate-400">FSOS Engineering Rule #001 — Confirmation Required</p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  INTERVENTION TO BE DELETED
                </span>
                <p className="font-bold text-sm text-slate-100 dark:text-white">
                  {itemToDelete.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-400">
                  <span>Customer: <strong className="text-slate-200">{itemToDelete.customerName}</strong></span>
                  <span>•</span>
                  <span>Machine: <strong className="text-slate-200">{itemToDelete.machineName}</strong></span>
                  <span>•</span>
                  <span>Scheduled: <strong className="text-[#8ECDF7]">{itemToDelete.scheduledDate}</strong></span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Warning:</strong> Deleting this scheduled intervention will remove it from the two-year field execution planner timeline and workload calculations. This action is <strong>irreversible</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2B323A]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  onDeleteScheduleItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
              >
                Permanently Delete Schedule Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
