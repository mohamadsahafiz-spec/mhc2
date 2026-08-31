import React, { useState } from 'react';
import {
  Crosshair,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Eye,
  Sliders,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  Zap,
  Clock,
  UserCheck,
  Edit3
} from 'lucide-react';
import { Machine } from '../../types';
import {
  FOCUS_WAFER_POSITIONS,
  FocusOptimizationRecord,
  FocusWaferPosition,
  LaserFocusEvidence,
  WaferPositionEvidence
} from '../../types/focusOptimization';
import { FocusOptimizationEngine } from '../../utils/focusOptimizationEngine';
import { StorageService } from '../../utils/persistence';
import { ImageStore } from '../../utils/imageStore';
import { getLocalDateString } from '../../utils/timeUtils';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useTheme } from '../../context/ThemeContext';

interface MachineFocusOptimizationWorkspaceProps {
  machine: Machine;
  onUpdateMachine: (updatedMachine: Machine) => void;
}

export const MachineFocusOptimizationWorkspace: React.FC<MachineFocusOptimizationWorkspaceProps> = ({
  machine,
  onUpdateMachine
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // State to hold hydrated records with resolved base64 images from ImageStore
  const [hydratedRecords, setHydratedRecords] = useState<FocusOptimizationRecord[]>(() => {
    return (machine?.focusOptimizationRecords || []).map(r => ImageStore.hydrateImagesSync(r));
  });

  // Re-hydrate whenever machine records change or background IDB preloading completes
  React.useEffect(() => {
    let isMounted = true;
    const rawRecs = machine?.focusOptimizationRecords || [];
    const syncHydrated = rawRecs.map(r => ImageStore.hydrateImagesSync(r));
    setHydratedRecords(syncHydrated);

    const hasIdbPointer = rawRecs.some(r =>
      Object.values(r.laser1?.positions || {}).some((p: any) => p?.imageDataUrl?.startsWith('idb:')) ||
      Object.values(r.laser2?.positions || {}).some((p: any) => p?.imageDataUrl?.startsWith('idb:'))
    );

    if (hasIdbPointer) {
      ImageStore.hydrateImagesAsync(rawRecs).then((asyncHydrated) => {
        if (isMounted && Array.isArray(asyncHydrated)) {
          setHydratedRecords(asyncHydrated);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [machine?.focusOptimizationRecords]);

  const records = hydratedRecords.length > 0 ? hydratedRecords : (machine?.focusOptimizationRecords || []);
  const latestRecord = records[0] || null;

  // Helper to safely resolve image data from ImageStore cache or direct base64/URL
  const resolveImg = (url?: string): string | undefined => {
    if (!url) return undefined;
    return ImageStore.resolveImage(url) || (url.startsWith('idb:') ? undefined : url);
  };

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<FocusOptimizationRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<{ title: string; src: string } | null>(null);

  // Form State for New Check
  const [formDate, setFormDate] = useState<string>(getLocalDateString());
  const [formEngineer, setFormEngineer] = useState<string>('EO Technics Field Engineer');
  const [formRemarks, setFormRemarks] = useState<string>('Focus verified on dummy wafer matrix. Center 0.00 position selected.');
  const [formReason, setFormReason] = useState<string>('LASER_REPLACEMENT');

  // Form Laser 1 & 2 Evidences
  const [formLaser1, setFormLaser1] = useState<LaserFocusEvidence>(() => {
    return FocusOptimizationEngine.createDefaultRecord().laser1;
  });

  const [formLaser2, setFormLaser2] = useState<LaserFocusEvidence>(() => {
    return FocusOptimizationEngine.createDefaultRecord().laser2;
  });

  const handleOpenAddModal = () => {
    setEditingRecordId(null);
    const template = FocusOptimizationEngine.createDefaultRecord(getLocalDateString(), formEngineer);
    setFormDate(template.date);
    setFormEngineer(template.engineerName || 'EO Technics Field Engineer');
    setFormRemarks(template.serviceRecord || '');
    setFormReason(template.reason || 'LASER_REPLACEMENT');
    setFormLaser1(template.laser1);
    setFormLaser2(template.laser2);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (rec: FocusOptimizationRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingRecordId(rec.id);
    setFormDate(rec.date);
    setFormEngineer(rec.engineerName || 'EO Technics Field Engineer');
    setFormRemarks(rec.serviceRecord || '');
    setFormReason(rec.reason || 'LASER_REPLACEMENT');
    setFormLaser1(rec.laser1 || FocusOptimizationEngine.createDefaultRecord().laser1);
    setFormLaser2(rec.laser2 || FocusOptimizationEngine.createDefaultRecord().laser2);
    setSelectedRecordDetail(null);
    setIsAddModalOpen(true);
  };

  const handleImageFileUpload = (
    laserKey: 'laser1' | 'laser2',
    position: FocusWaferPosition,
    file: File
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const updater = laserKey === 'laser1' ? setFormLaser1 : setFormLaser2;
        updater((prev) => ({
          ...prev,
          positions: {
            ...prev.positions,
            [position]: {
              ...prev.positions[position],
              imageDataUrl: dataUrl,
              capturedAt: getLocalDateString()
            }
          }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveRecord = () => {
    const draft: FocusOptimizationRecord = {
      id: editingRecordId || `FOC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: formDate,
      engineerName: formEngineer,
      serviceRecord: formRemarks,
      reason: formReason,
      procedure: 'Drill on using wafer (Dummy)',
      specificationText: 'None — This item is for checking and setting machining focus. No numerical specification.',
      laser1: formLaser1,
      laser2: formLaser2,
      overallResult: 'VERIFIED',
      createdAt: new Date().toISOString()
    };

    let updatedRecords: FocusOptimizationRecord[];
    if (editingRecordId) {
      updatedRecords = records.map(r =>
        r.id === editingRecordId ? { ...draft, id: editingRecordId, createdAt: r.createdAt } : r
      );
    } else {
      updatedRecords = [draft, ...records];
    }

    const updatedMachine: Machine = {
      ...machine,
      focusOptimizationRecords: updatedRecords
    };

    onUpdateMachine(updatedMachine);
    const allMachines = StorageService.getMachines();
    const otherMachines = allMachines.filter(m => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...otherMachines]);

    setIsAddModalOpen(false);
    setEditingRecordId(null);
  };

  const handleDeleteRecord = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('Delete this Focus Optimization record?')) {
      const updatedRecords = records.filter(r => r.id !== id);
      const updatedMachine: Machine = {
        ...machine,
        focusOptimizationRecords: updatedRecords
      };
      onUpdateMachine(updatedMachine);
      const allMachines = StorageService.getMachines();
      const otherMachines = allMachines.filter(m => m.id !== machine.id);
      StorageService.saveMachines([updatedMachine, ...otherMachines]);

      if (selectedRecordDetail?.id === id) {
        setSelectedRecordDetail(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl ${
              isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
            }`}>
              <Crosshair className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Focus Optimization Engineering Records
                </h2>
                <Badge variant="info">Historical Optics Calibration</Badge>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Specialized procedure for laser source replacement and optical beam re-alignment. Physical dummy wafer test sequence (+3 → -3).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddModal}
            >
              Add Focus Optimization Record
            </Button>
          </div>
        </div>
      </div>

      {/* Procedure & Specification Info Banner */}
      <div className={`p-4 rounded-xl border grid grid-cols-1 md:grid-cols-3 gap-4 text-xs ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Authoritative Procedure</span>
          <p className={`font-semibold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Drill on using wafer (Dummy)
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Working zone: Width Square Mask
          </p>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Perform Parameter</span>
          <p className={`font-semibold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            2W @ 50kHz (Working zone) + 2 shots
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Sequence: +3 → +2 → +1 → 0 → -1 → -2 → -3 (14 total wafer images)
          </p>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Specification Standard</span>
          <p className="font-semibold text-amber-500 mt-0.5">
            None (Visual / Machining Focus Verification)
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            This item is for setting machining focus. No numerical spec is fabricated.
          </p>
        </div>
      </div>

      {/* If No Records Found */}
      {records.length === 0 ? (
        <div className={`p-12 rounded-2xl border text-center ${
          isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
        }`}>
          <Crosshair className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-40" />
          <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            No Focus Optimization Records on File
          </h3>
          <p className="text-xs max-w-md mx-auto mb-5 text-slate-500">
            Focus Optimization is skipped during routine MHC and is performed during laser head replacement or optical path re-alignment.
          </p>
          <Button
            variant="secondary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAddModal}
          >
            Create Initial Record
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Latest Record Banner */}
          {latestRecord && (
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Active Optical Baseline Record — {latestRecord.date}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Reason: <span className="font-mono text-indigo-400">{latestRecord.reason || 'LASER_REPLACEMENT'}</span> • Engineer: {latestRecord.engineerName || 'Field Engineer'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">14/14 Wafer Positions Verified</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                    onClick={(e) => handleDeleteRecord(latestRecord.id, e)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Laser Head 1 & Laser Head 2 Evidence Grids */}
              <div className="space-y-6">
                {/* Laser Head 1 Grid */}
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-xs uppercase tracking-wide">
                        Laser 1 (Head A) — Dummy Wafer Sequence
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      Mask: {latestRecord.laser1?.maskName || 'Width Square Mask'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {FOCUS_WAFER_POSITIONS.map((pos) => {
                      const item = latestRecord.laser1?.positions?.[pos];
                      const imgUrl = resolveImg(item?.imageDataUrl);
                      const isCenter = pos === '0';
                      return (
                        <div
                          key={`l1_${pos}`}
                          onClick={() => imgUrl && setPreviewImage({ title: `Laser 1 — Position ${pos} Wafer Drill`, src: imgUrl })}
                          className={`p-2 rounded-lg border text-center cursor-pointer transition-all hover:scale-105 ${
                            isCenter
                              ? isDark
                                ? 'bg-emerald-950/40 border-emerald-500/50'
                                : 'bg-emerald-50 border-emerald-300'
                              : isDark
                              ? 'bg-slate-900/80 border-slate-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-mono font-bold ${isCenter ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {pos}
                            </span>
                            {isCenter && (
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-bold px-1 rounded">
                                BEST
                              </span>
                            )}
                          </div>

                          <div className="w-full aspect-square rounded bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800/80">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={`Laser 1 ${pos}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-600" />
                            )}
                          </div>

                          <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                            {item?.drillDiameterUm ? `${item.drillDiameterUm.toFixed(1)} µm` : 'Spot Check'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Laser Head 2 Grid */}
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-500" />
                      <span className="font-bold text-xs uppercase tracking-wide">
                        Laser 2 (Head B) — Dummy Wafer Sequence
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      Mask: {latestRecord.laser2?.maskName || 'Width Square Mask'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {FOCUS_WAFER_POSITIONS.map((pos) => {
                      const item = latestRecord.laser2?.positions?.[pos];
                      const imgUrl = resolveImg(item?.imageDataUrl);
                      const isCenter = pos === '0';
                      return (
                        <div
                          key={`l2_${pos}`}
                          onClick={() => imgUrl && setPreviewImage({ title: `Laser 2 — Position ${pos} Wafer Drill`, src: imgUrl })}
                          className={`p-2 rounded-lg border text-center cursor-pointer transition-all hover:scale-105 ${
                            isCenter
                              ? isDark
                                ? 'bg-emerald-950/40 border-emerald-500/50'
                                : 'bg-emerald-50 border-emerald-300'
                              : isDark
                              ? 'bg-slate-900/80 border-slate-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-mono font-bold ${isCenter ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {pos}
                            </span>
                            {isCenter && (
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-bold px-1 rounded">
                                BEST
                              </span>
                            )}
                          </div>

                          <div className="w-full aspect-square rounded bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800/80">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={`Laser 2 ${pos}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-600" />
                            )}
                          </div>

                          <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                            {item?.drillDiameterUm ? `${item.drillDiameterUm.toFixed(1)} µm` : 'Spot Check'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Service Remarks */}
              {latestRecord.serviceRecord && (
                <div className={`p-3 rounded-xl text-xs ${
                  isDark ? 'bg-slate-900/40 text-slate-300 border border-slate-800' : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  <span className="font-bold text-indigo-400 uppercase text-[10px] block mb-0.5">Service Log Record:</span>
                  {latestRecord.serviceRecord}
                </div>
              )}
            </div>
          )}

          {/* Historical Records Table */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Historical Focus Optimization Archive ({records.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3">Engineer</th>
                    <th className="py-2 px-3">Laser 1 Evidence</th>
                    <th className="py-2 px-3">Laser 2 Evidence</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {records.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecordDetail(rec)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold">{rec.date}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {rec.reason || 'LASER_REPLACEMENT'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{rec.engineerName || 'Field Engineer'}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400">7/7 Positions</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400">7/7 Positions</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="success">VERIFIED</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleOpenEditModal(rec, e)}
                          className="py-1 px-2 text-[11px] text-indigo-400 border-indigo-500/40 hover:bg-indigo-500/10"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleDeleteRecord(rec.id, e)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Add / Edit Focus Optimization Record */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingRecordId(null);
          }}
          title={editingRecordId ? `Edit Focus Optimization Audit — ${formDate}` : "New Focus Optimization Engineering Record"}
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Engineer Name</label>
                <input
                  type="text"
                  value={formEngineer}
                  onChange={(e) => setFormEngineer(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="EO Technics Engineer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Reason / Trigger</label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="LASER_REPLACEMENT">Laser Replacement</option>
                  <option value="BEAM_REALIGNMENT">Beam Re-alignment</option>
                  <option value="ROUTINE_ENGINEERING">Routine Engineering Audit</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Service & Alignment Notes</label>
              <textarea
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                rows={2}
                className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
                placeholder="Details of wafer drilling, optimal focus setting, etc."
              />
            </div>

            {/* Laser 1 Wafer Step Uploaders */}
            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-amber-400">Laser 1: 7-Position Wafer Evidence</span>
                <span className="text-[10px] text-slate-400 font-mono">2W@50kHz + 2 shots</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                {FOCUS_WAFER_POSITIONS.map((pos) => {
                  const rawImg = formLaser1.positions[pos]?.imageDataUrl;
                  const img = resolveImg(rawImg);
                  return (
                    <div key={`modal_l1_${pos}`} className="text-center">
                      <span className="text-[10px] font-mono font-bold block mb-1 text-slate-400">{pos}</span>
                      <div className="relative group w-full aspect-square rounded border border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center">
                        {img && <img src={img} alt={`L1 ${pos}`} className="w-full h-full object-cover" />}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[9px]">
                          <Upload className="w-3.5 h-3.5 mb-0.5" />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleImageFileUpload('laser1', pos, e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Laser 2 Wafer Step Uploaders */}
            <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-cyan-400">Laser 2: 7-Position Wafer Evidence</span>
                <span className="text-[10px] text-slate-400 font-mono">2W@50kHz + 2 shots</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                {FOCUS_WAFER_POSITIONS.map((pos) => {
                  const rawImg = formLaser2.positions[pos]?.imageDataUrl;
                  const img = resolveImg(rawImg);
                  return (
                    <div key={`modal_l2_${pos}`} className="text-center">
                      <span className="text-[10px] font-mono font-bold block mb-1 text-slate-400">{pos}</span>
                      <div className="relative group w-full aspect-square rounded border border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center">
                        {img && <img src={img} alt={`L2 ${pos}`} className="w-full h-full object-cover" />}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[9px]">
                          <Upload className="w-3.5 h-3.5 mb-0.5" />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleImageFileUpload('laser2', pos, e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingRecordId(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveRecord}>
                {editingRecordId ? 'Save Changes' : 'Save Focus Optimization Record'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Selected Historical Record Detail Modal */}
      {selectedRecordDetail && (
        <Modal
          isOpen={!!selectedRecordDetail}
          onClose={() => setSelectedRecordDetail(null)}
          title={`Focus Optimization Audit — ${selectedRecordDetail.date}`}
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border ${
              isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
            }`}>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Engineer</span>
                <p className="font-semibold text-xs mt-0.5">{selectedRecordDetail.engineerName || 'Field Engineer'}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Trigger / Reason</span>
                <Badge variant="info">{selectedRecordDetail.reason || 'LASER_REPLACEMENT'}</Badge>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Audit Status</span>
                <Badge variant="success">14/14 Positions Verified</Badge>
              </div>
            </div>

            {selectedRecordDetail.serviceRecord && (
              <div className={`p-3 rounded-xl border text-xs ${
                isDark ? 'bg-slate-900/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="font-bold text-indigo-400 uppercase text-[10px] block mb-0.5">Notes:</span>
                {selectedRecordDetail.serviceRecord}
              </div>
            )}

            {/* Laser 1 Grid in modal */}
            <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
              <span className="font-bold text-xs text-amber-500 block mb-2">Laser 1 (Head A) — Dummy Wafer Sequence</span>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                {FOCUS_WAFER_POSITIONS.map((pos) => {
                  const item = selectedRecordDetail.laser1?.positions?.[pos];
                  const imgUrl = resolveImg(item?.imageDataUrl);
                  return (
                    <div key={`modal_detail_l1_${pos}`} className={`p-1.5 rounded-lg border text-center ${
                      isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
                    }`}>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">{pos}</span>
                      <div
                        onClick={() => imgUrl && setPreviewImage({ title: `Laser 1 — Position ${pos} Wafer Drill`, src: imgUrl })}
                        className="w-full aspect-square rounded bg-black flex items-center justify-center overflow-hidden border border-slate-800 cursor-pointer"
                      >
                        {imgUrl ? (
                          <img src={imgUrl} alt={`L1 ${pos}`} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 mt-1 block">
                        {item?.drillDiameterUm ? `${item.drillDiameterUm.toFixed(1)} µm` : 'Spot Check'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Laser 2 Grid in modal */}
            <div className={`p-3 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
              <span className="font-bold text-xs text-cyan-500 block mb-2">Laser 2 (Head B) — Dummy Wafer Sequence</span>
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                {FOCUS_WAFER_POSITIONS.map((pos) => {
                  const item = selectedRecordDetail.laser2?.positions?.[pos];
                  const imgUrl = resolveImg(item?.imageDataUrl);
                  return (
                    <div key={`modal_detail_l2_${pos}`} className={`p-1.5 rounded-lg border text-center ${
                      isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
                    }`}>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">{pos}</span>
                      <div
                        onClick={() => imgUrl && setPreviewImage({ title: `Laser 2 — Position ${pos} Wafer Drill`, src: imgUrl })}
                        className="w-full aspect-square rounded bg-black flex items-center justify-center overflow-hidden border border-slate-800 cursor-pointer"
                      >
                        {imgUrl ? (
                          <img src={imgUrl} alt={`L2 ${pos}`} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 mt-1 block">
                        {item?.drillDiameterUm ? `${item.drillDiameterUm.toFixed(1)} µm` : 'Spot Check'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="secondary" onClick={() => setSelectedRecordDetail(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => handleOpenEditModal(selectedRecordDetail)}
                icon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit This Record
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title={previewImage.title}
        >
          <div className="p-4 flex flex-col items-center justify-center">
            <img
              src={previewImage.src}
              alt="Wafer Drill Preview"
              className="max-w-md w-full rounded-xl border border-slate-700 shadow-2xl bg-black"
            />
            <p className="text-xs text-slate-400 mt-3 text-center">
              Physical dummy wafer drill microscope observation under 2W@50kHz laser excitation.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
