import React, { useState, useMemo } from 'react';
import { Plus, Upload, Image as ImageIcon, CheckCircle, CheckCircle2, XCircle, Sliders, Layers, FileText, Trash2, Zap, Edit3, ShieldCheck } from 'lucide-react';
import { Machine } from '../../types';
import { ProductProcessRecord, TOP_VIA_SPEC, BOTTOM_VIA_SPEC, ViaSpecification } from '../../types/productProcess';
import { ProductProcessEngine } from '../../utils/productProcessEngine';
import { StorageService } from '../../utils/persistence';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ViaQualityInspectionCard } from './ViaQualityInspectionCard';

interface MachineProductProcessWorkspaceProps {
  machine: Machine;
  onUpdateMachine: (updatedMachine: Machine) => void;
}

export const MachineProductProcessWorkspace: React.FC<MachineProductProcessWorkspaceProps> = ({
  machine,
  onUpdateMachine
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const records = useMemo(() => {
    const raw = machine?.productProcessRecords || [];
    return [...raw].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [machine?.productProcessRecords]);
  const latestRecord = records[0] || null;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Form State for Inspection
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formProduct, setFormProduct] = useState('');
  const [formRecipe, setFormRecipe] = useState('');
  const [formLot, setFormLot] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [l1Offset, setL1Offset] = useState<string>('');
  const [l2Offset, setL2Offset] = useState<string>('');

  // Authoritative Via Specification State
  const [topTarget, setTopTarget] = useState<string>('51');
  const [topTolerance, setTopTolerance] = useState<string>('10');
  const [bottomTarget, setBottomTarget] = useState<string>('23');
  const [bottomTolerance, setBottomTolerance] = useState<string>('10');
  const [minTaper, setMinTaper] = useState<string>('40');
  const [taperSpecText, setTaperSpecText] = useState<string>('≥ 40%');
  const [isImportSpecOpen, setIsImportSpecOpen] = useState<boolean>(false);
  const [importSpecJson, setImportSpecJson] = useState<string>('');

  // Phase 1
  const [p1Power, setP1Power] = useState<string>('');
  const [p1Freq, setP1Freq] = useState<string>('');
  const [p1Shots, setP1Shots] = useState<string>('');
  const [p1Mask, setP1Mask] = useState<string>('');
  const [p1Defocus, setP1Defocus] = useState<string>('');

  // Phase 2
  const [p2Power, setP2Power] = useState<string>('');
  const [p2Freq, setP2Freq] = useState<string>('');
  const [p2Shots, setP2Shots] = useState<string>('');
  const [p2Mask, setP2Mask] = useState<string>('');
  const [p2Defocus, setP2Defocus] = useState<string>('');

  // Laser 1 Via Quality
  const [l1Top, setL1Top] = useState<string>('');
  const [l1Bottom, setL1Bottom] = useState<string>('');
  const [l1Image, setL1Image] = useState<string | undefined>(undefined);

  // Laser 2 Via Quality
  const [l2Top, setL2Top] = useState<string>('');
  const [l2Bottom, setL2Bottom] = useState<string>('');
  const [l2Image, setL2Image] = useState<string | undefined>(undefined);

  const applyPreset = (presetKey: string) => {
    if (presetKey === 'std50') {
      setTopTarget('51');
      setTopTolerance('10');
      setBottomTarget('23');
      setBottomTolerance('10');
      setMinTaper('40');
      setTaperSpecText('≥ 40%');
    } else if (presetKey === 'hdi35') {
      setTopTarget('35');
      setTopTolerance('5');
      setBottomTarget('18');
      setBottomTolerance('5');
      setMinTaper('45');
      setTaperSpecText('≥ 45%');
    } else if (presetKey === 'fine25') {
      setTopTarget('25');
      setTopTolerance('4');
      setBottomTarget('12');
      setBottomTolerance('3');
      setMinTaper('50');
      setTaperSpecText('≥ 50%');
    }
  };

  const handleOpenAdd = () => {
    setEditingRecordId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormProduct(latestRecord?.productName || '');
    setFormRecipe(latestRecord?.recipeName || '');
    setFormLot(latestRecord?.lotPanel || '');
    setFormRemarks('');
    setL1Offset(latestRecord?.laser1PowerOffsetPercent !== null && latestRecord?.laser1PowerOffsetPercent !== undefined ? String(latestRecord.laser1PowerOffsetPercent) : '');
    setL2Offset(latestRecord?.laser2PowerOffsetPercent !== null && latestRecord?.laser2PowerOffsetPercent !== undefined ? String(latestRecord.laser2PowerOffsetPercent) : '');

    // Init Spec from latest record or defaults
    const spec = latestRecord?.viaSpec;
    setTopTarget(spec?.topTargetUm !== undefined && spec?.topTargetUm !== null ? String(spec.topTargetUm) : '51');
    setTopTolerance(spec?.topToleranceUm !== undefined && spec?.topToleranceUm !== null ? String(spec.topToleranceUm) : '10');
    setBottomTarget(spec?.bottomTargetUm !== undefined && spec?.bottomTargetUm !== null ? String(spec.bottomTargetUm) : '23');
    setBottomTolerance(spec?.bottomToleranceUm !== undefined && spec?.bottomToleranceUm !== null ? String(spec.bottomToleranceUm) : '10');
    setMinTaper(spec?.minTaperPercent !== undefined && spec?.minTaperPercent !== null ? String(spec.minTaperPercent) : '40');
    setTaperSpecText(spec?.taperSpecText || '≥ 40%');

    setP1Power(latestRecord?.phase1?.powerWatts !== null && latestRecord?.phase1?.powerWatts !== undefined ? String(latestRecord.phase1.powerWatts) : '');
    setP1Freq(latestRecord?.phase1?.frequencyKhz !== null && latestRecord?.phase1?.frequencyKhz !== undefined ? String(latestRecord.phase1.frequencyKhz) : '');
    setP1Shots(latestRecord?.phase1?.shotCount !== null && latestRecord?.phase1?.shotCount !== undefined ? String(latestRecord.phase1.shotCount) : '');
    setP1Mask(latestRecord?.phase1?.maskMm !== null && latestRecord?.phase1?.maskMm !== undefined ? String(latestRecord.phase1.maskMm) : '');
    setP1Defocus(latestRecord?.phase1?.defocusMm !== null && latestRecord?.phase1?.defocusMm !== undefined ? String(latestRecord.phase1.defocusMm) : '');

    setP2Power(latestRecord?.phase2?.powerWatts !== null && latestRecord?.phase2?.powerWatts !== undefined ? String(latestRecord.phase2.powerWatts) : '');
    setP2Freq(latestRecord?.phase2?.frequencyKhz !== null && latestRecord?.phase2?.frequencyKhz !== undefined ? String(latestRecord.phase2.frequencyKhz) : '');
    setP2Shots(latestRecord?.phase2?.shotCount !== null && latestRecord?.phase2?.shotCount !== undefined ? String(latestRecord.phase2.shotCount) : '');
    setP2Mask(latestRecord?.phase2?.maskMm !== null && latestRecord?.phase2?.maskMm !== undefined ? String(latestRecord.phase2.maskMm) : '');
    setP2Defocus(latestRecord?.phase2?.defocusMm !== null && latestRecord?.phase2?.defocusMm !== undefined ? String(latestRecord.phase2.defocusMm) : '');

    setL1Top('');
    setL1Bottom('');
    setL1Image(undefined);
    setL2Top('');
    setL2Bottom('');
    setL2Image(undefined);

    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rec: ProductProcessRecord) => {
    setEditingRecordId(rec.id);
    setFormDate(rec.date);
    setFormProduct(rec.productName || '');
    setFormRecipe(rec.recipeName || '');
    setFormLot(rec.lotPanel || '');
    setFormRemarks(rec.engineerRemarks || '');
    setL1Offset(rec.laser1PowerOffsetPercent !== null && rec.laser1PowerOffsetPercent !== undefined ? String(rec.laser1PowerOffsetPercent) : '');
    setL2Offset(rec.laser2PowerOffsetPercent !== null && rec.laser2PowerOffsetPercent !== undefined ? String(rec.laser2PowerOffsetPercent) : '');

    // Init Spec from record
    const spec = rec.viaSpec;
    setTopTarget(spec?.topTargetUm !== undefined && spec?.topTargetUm !== null ? String(spec.topTargetUm) : '51');
    setTopTolerance(spec?.topToleranceUm !== undefined && spec?.topToleranceUm !== null ? String(spec.topToleranceUm) : '10');
    setBottomTarget(spec?.bottomTargetUm !== undefined && spec?.bottomTargetUm !== null ? String(spec.bottomTargetUm) : '23');
    setBottomTolerance(spec?.bottomToleranceUm !== undefined && spec?.bottomToleranceUm !== null ? String(spec.bottomToleranceUm) : '10');
    setMinTaper(spec?.minTaperPercent !== undefined && spec?.minTaperPercent !== null ? String(spec.minTaperPercent) : '40');
    setTaperSpecText(spec?.taperSpecText || '≥ 40%');

    setP1Power(rec.phase1?.powerWatts !== null && rec.phase1?.powerWatts !== undefined ? String(rec.phase1.powerWatts) : '');
    setP1Freq(rec.phase1?.frequencyKhz !== null && rec.phase1?.frequencyKhz !== undefined ? String(rec.phase1.frequencyKhz) : '');
    setP1Shots(rec.phase1?.shotCount !== null && rec.phase1?.shotCount !== undefined ? String(rec.phase1.shotCount) : '');
    setP1Mask(rec.phase1?.maskMm !== null && rec.phase1?.maskMm !== undefined ? String(rec.phase1.maskMm) : '');
    setP1Defocus(rec.phase1?.defocusMm !== null && rec.phase1?.defocusMm !== undefined ? String(rec.phase1.defocusMm) : '');

    setP2Power(rec.phase2?.powerWatts !== null && rec.phase2?.powerWatts !== undefined ? String(rec.phase2.powerWatts) : '');
    setP2Freq(rec.phase2?.frequencyKhz !== null && rec.phase2?.frequencyKhz !== undefined ? String(rec.phase2.frequencyKhz) : '');
    setP2Shots(rec.phase2?.shotCount !== null && rec.phase2?.shotCount !== undefined ? String(rec.phase2.shotCount) : '');
    setP2Mask(rec.phase2?.maskMm !== null && rec.phase2?.maskMm !== undefined ? String(rec.phase2.maskMm) : '');
    setP2Defocus(rec.phase2?.defocusMm !== null && rec.phase2?.defocusMm !== undefined ? String(rec.phase2.defocusMm) : '');

    setL1Top(rec.laser1Via?.topWidthUm !== null && rec.laser1Via?.topWidthUm !== undefined ? String(rec.laser1Via.topWidthUm) : '');
    setL1Bottom(rec.laser1Via?.bottomWidthUm !== null && rec.laser1Via?.bottomWidthUm !== undefined ? String(rec.laser1Via.bottomWidthUm) : '');
    setL1Image(rec.laser1Via?.viaImageDataUrl);

    setL2Top(rec.laser2Via?.topWidthUm !== null && rec.laser2Via?.topWidthUm !== undefined ? String(rec.laser2Via.topWidthUm) : '');
    setL2Bottom(rec.laser2Via?.bottomWidthUm !== null && rec.laser2Via?.bottomWidthUm !== undefined ? String(rec.laser2Via.bottomWidthUm) : '');
    setL2Image(rec.laser2Via?.viaImageDataUrl);

    setIsAddModalOpen(true);
  };

  const handleImageUpload = (laser: 1 | 2, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        if (laser === 1) setL1Image(dataUrl);
        else setL2Image(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Derived live evaluation for modal
  const liveTopTarget = topTarget.trim() !== '' ? parseFloat(topTarget) : TOP_VIA_SPEC.target;
  const liveTopTolerance = topTolerance.trim() !== '' ? parseFloat(topTolerance) : TOP_VIA_SPEC.tolerance;
  const liveBottomTarget = bottomTarget.trim() !== '' ? parseFloat(bottomTarget) : BOTTOM_VIA_SPEC.target;
  const liveBottomTolerance = bottomTolerance.trim() !== '' ? parseFloat(bottomTolerance) : BOTTOM_VIA_SPEC.tolerance;
  const liveMinTaper = minTaper.trim() !== '' ? parseFloat(minTaper) : 40;

  const currentViaSpec: ViaSpecification = useMemo(() => ({
    topTargetUm: liveTopTarget,
    topToleranceUm: liveTopTolerance,
    bottomTargetUm: liveBottomTarget,
    bottomToleranceUm: liveBottomTolerance,
    minTaperPercent: liveMinTaper,
    taperSpecText: taperSpecText.trim() || '≥ 40%'
  }), [liveTopTarget, liveTopTolerance, liveBottomTarget, liveBottomTolerance, liveMinTaper, taperSpecText]);

  const l1TopVal = l1Top.trim() !== '' ? parseFloat(l1Top) : null;
  const l1BottomVal = l1Bottom.trim() !== '' ? parseFloat(l1Bottom) : null;
  const l1HasEntries = l1TopVal !== null || l1BottomVal !== null;
  const l1OverallPass = l1TopVal !== null && l1BottomVal !== null && ProductProcessEngine.evalTopWidth(l1TopVal, currentViaSpec) && ProductProcessEngine.evalBottomWidth(l1BottomVal, currentViaSpec);

  const l2TopVal = l2Top.trim() !== '' ? parseFloat(l2Top) : null;
  const l2BottomVal = l2Bottom.trim() !== '' ? parseFloat(l2Bottom) : null;
  const l2HasEntries = l2TopVal !== null || l2BottomVal !== null;
  const l2OverallPass = l2TopVal !== null && l2BottomVal !== null && ProductProcessEngine.evalTopWidth(l2TopVal, currentViaSpec) && ProductProcessEngine.evalBottomWidth(l2BottomVal, currentViaSpec);

  const formOverallPass = l1OverallPass && l2OverallPass;
  const hasInspectionData = l1HasEntries || l2HasEntries;

  const l1OffsetNum = l1Offset.trim() !== '' ? parseFloat(l1Offset) : null;
  const l2OffsetNum = l2Offset.trim() !== '' ? parseFloat(l2Offset) : null;
  const deltaOffset = l1OffsetNum !== null && l2OffsetNum !== null ? Math.abs(l1OffsetNum - l2OffsetNum) : null;

  if (!machine) {
    return (
      <div className={`p-8 rounded-2xl border text-center ${
        isDark ? 'bg-[#14171A] border-[#2B323A] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-50" />
        <p className="text-sm font-semibold">No machine selected for product process inspection.</p>
      </div>
    );
  }

  const handleSaveRecord = () => {
    const draft = {
      date: formDate,
      productName: formProduct,
      recipeName: formRecipe,
      lotPanel: formLot,
      engineerRemarks: formRemarks,
      laser1PowerOffsetPercent: l1Offset !== '' ? parseFloat(l1Offset) : null,
      laser2PowerOffsetPercent: l2Offset !== '' ? parseFloat(l2Offset) : null,
      viaSpec: {
        topTargetUm: topTarget !== '' ? parseFloat(topTarget) : null,
        topToleranceUm: topTolerance !== '' ? parseFloat(topTolerance) : null,
        bottomTargetUm: bottomTarget !== '' ? parseFloat(bottomTarget) : null,
        bottomToleranceUm: bottomTolerance !== '' ? parseFloat(bottomTolerance) : null,
        minTaperPercent: minTaper !== '' ? parseFloat(minTaper) : null,
        taperSpecText: taperSpecText || '≥ 40%'
      },
      phase1: {
        powerWatts: p1Power !== '' ? parseFloat(p1Power) : null,
        frequencyKhz: p1Freq !== '' ? parseFloat(p1Freq) : null,
        shotCount: p1Shots !== '' ? parseInt(p1Shots, 10) : null,
        maskMm: p1Mask !== '' ? parseFloat(p1Mask) : null,
        defocusMm: p1Defocus !== '' ? parseFloat(p1Defocus) : null
      },
      phase2: {
        powerWatts: p2Power !== '' ? parseFloat(p2Power) : null,
        frequencyKhz: p2Freq !== '' ? parseFloat(p2Freq) : null,
        shotCount: p2Shots !== '' ? parseInt(p2Shots, 10) : null,
        maskMm: p2Mask !== '' ? parseFloat(p2Mask) : null,
        defocusMm: p2Defocus !== '' ? parseFloat(p2Defocus) : null
      },
      laser1Via: {
        topWidthUm: l1Top !== '' ? parseFloat(l1Top) : null,
        bottomWidthUm: l1Bottom !== '' ? parseFloat(l1Bottom) : null,
        viaImageDataUrl: l1Image
      },
      laser2Via: {
        topWidthUm: l2Top !== '' ? parseFloat(l2Top) : null,
        bottomWidthUm: l2Bottom !== '' ? parseFloat(l2Bottom) : null,
        viaImageDataUrl: l2Image
      }
    };

    const evaluated = ProductProcessEngine.evaluateRecord(draft);
    let updatedRecords: ProductProcessRecord[];

    if (editingRecordId) {
      updatedRecords = records.map(r => 
        r.id === editingRecordId 
          ? { ...evaluated, id: editingRecordId, createdAt: r.createdAt } 
          : r
      );
    } else {
      updatedRecords = [evaluated, ...records];
    }
    updatedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const updatedMachine: Machine = {
      ...machine,
      productProcessRecords: updatedRecords
    };

    onUpdateMachine(updatedMachine);
    const all = StorageService.getMachines();
    const others = all.filter(m => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...others]);

    setIsAddModalOpen(false);
    setEditingRecordId(null);
  };

  const handleImportSpec = () => {
    try {
      const parsed = JSON.parse(importSpecJson);
      if (parsed.topTargetUm !== undefined) setTopTarget(String(parsed.topTargetUm));
      else if (parsed.topTarget !== undefined) setTopTarget(String(parsed.topTarget));
      if (parsed.topToleranceUm !== undefined) setTopTolerance(String(parsed.topToleranceUm));
      else if (parsed.topTolerance !== undefined) setTopTolerance(String(parsed.topTolerance));
      if (parsed.bottomTargetUm !== undefined) setBottomTarget(String(parsed.bottomTargetUm));
      else if (parsed.bottomTarget !== undefined) setBottomTarget(String(parsed.bottomTarget));
      if (parsed.bottomToleranceUm !== undefined) setBottomTolerance(String(parsed.bottomToleranceUm));
      else if (parsed.bottomTolerance !== undefined) setBottomTolerance(String(parsed.bottomTolerance));
      if (parsed.minTaperPercent !== undefined) setMinTaper(String(parsed.minTaperPercent));
      else if (parsed.minTaper !== undefined) setMinTaper(String(parsed.minTaper));
      if (parsed.taperSpecText) setTaperSpecText(parsed.taperSpecText);
      setIsImportSpecOpen(false);
      setImportSpecJson('');
    } catch {
      alert('Invalid JSON specification format.');
    }
  };

  const currentTopSpecStr = ProductProcessEngine.getFormattedTopSpec(latestRecord?.viaSpec);
  const currentBottomSpecStr = ProductProcessEngine.getFormattedBottomSpec(latestRecord?.viaSpec);
  const currentTaperSpecStr = ProductProcessEngine.getFormattedTaperSpec(latestRecord?.viaSpec);

  const handleDeleteRecord = (id: string) => {
    if (!confirm('Are you sure you want to delete this Product & Process record?')) return;
    const updatedRecords = records.filter(r => r.id !== id);
    const updatedMachine: Machine = {
      ...machine,
      productProcessRecords: updatedRecords
    };
    onUpdateMachine(updatedMachine);
    const all = StorageService.getMachines();
    const others = all.filter(m => m.id !== machine.id);
    StorageService.saveMachines([updatedMachine, ...others]);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="p-5 border-slate-800 bg-slate-900/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Layers className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-100">Product, Process & Via Quality</h3>
              <Badge variant="cyan">{machine.machineNumber}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Authoritative machine product recipes, process parameters, and via drilling micro-inspection logs.
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-2 px-4 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Enter New Product / Process Check
          </Button>
        </div>
      </Card>

      {/* Latest Record Highlight */}
      {latestRecord ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">LATEST VERIFIED RECORD ({latestRecord.date})</span>
              <Badge variant={latestRecord.overallResult === 'PASS' ? 'success' : 'danger'}>
                OVERALL: {latestRecord.overallResult}
              </Badge>
            </div>
            <Button
              onClick={() => handleOpenEdit(latestRecord)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs py-1 px-2.5 font-sans"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              Edit Record
            </Button>
          </div>

          {/* Product & Process Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Product Identity */}
            <Card className="p-4 border-slate-800 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Product Identity
                </h4>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Product Name</span>
                  <span className="font-bold text-slate-200">{latestRecord.productName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Recipe</span>
                  <span className="text-cyan-300 font-bold">{latestRecord.recipeName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Lot / Panel</span>
                  <span className="text-amber-300">{latestRecord.lotPanel || '—'}</span>
                </div>
              </div>
            </Card>

            {/* Authoritative Via Specification */}
            <Card className="p-4 border-slate-800 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Via Acceptance Spec
                </h4>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Top Diameter Spec</span>
                  <span className="font-bold text-slate-200">{currentTopSpecStr}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Bottom Diameter Spec</span>
                  <span className="font-bold text-slate-200">{currentBottomSpecStr}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block uppercase">Taper Angle / Ratio</span>
                  <span className="font-bold text-cyan-300">{currentTaperSpecStr}</span>
                </div>
              </div>
            </Card>

            {/* Process Parameters Phase 1 & 2 */}
            <Card className="p-4 border-slate-800 bg-slate-950 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  Process Parameters
                </h4>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-slate-400">
                    L1 Offset: <strong className="text-amber-400">{latestRecord.laser1PowerOffsetPercent !== null && latestRecord.laser1PowerOffsetPercent !== undefined ? `${latestRecord.laser1PowerOffsetPercent > 0 ? '+' : ''}${latestRecord.laser1PowerOffsetPercent}%` : '—'}</strong>
                  </span>
                  <span className="text-slate-400">
                    L2 Offset: <strong className="text-cyan-400">{latestRecord.laser2PowerOffsetPercent !== null && latestRecord.laser2PowerOffsetPercent !== undefined ? `${latestRecord.laser2PowerOffsetPercent > 0 ? '+' : ''}${latestRecord.laser2PowerOffsetPercent}%` : '—'}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                {/* Phase 1 */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase block border-b border-slate-800 pb-1">Phase 1</span>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Power:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase1.powerWatts ?? '—'} W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frequency:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase1.frequencyKhz ?? '—'} kHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shot Count:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase1.shotCount ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mask:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase1.maskMm ?? '—'} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Defocus:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase1.defocusMm ?? '—'} mm</span>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase block border-b border-slate-800 pb-1">Phase 2</span>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Power:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase2.powerWatts ?? '—'} W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frequency:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase2.frequencyKhz ?? '—'} kHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shot Count:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase2.shotCount ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mask:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase2.maskMm ?? '—'} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Defocus:</span>
                    <span className="font-bold text-slate-200">{latestRecord.phase2.defocusMm ?? '—'} mm</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Via Quality Cards: Laser 1 & Laser 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Laser 1 Via Quality */}
            <Card className="p-4 border-slate-800 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                  VIA QUALITY — LASER 1 (HEAD A)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  latestRecord.laser1Via.overallPass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {latestRecord.laser1Via.overallPass ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {latestRecord.laser1Via.viaImageDataUrl ? (
                    <img src={latestRecord.laser1Via.viaImageDataUrl} alt="Laser 1 Via" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                  )}
                </div>

                <div className="space-y-2 text-xs font-mono flex-1">
                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Top Drill Width</span>
                      <span className="font-bold text-slate-100">{latestRecord.laser1Via.topWidthUm ?? '—'} µm</span>
                      <span className="text-[9px] text-slate-500 block">Spec: {currentTopSpecStr}</span>
                    </div>
                    {latestRecord.laser1Via.topPass ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Bottom Drill Width</span>
                      <span className="font-bold text-slate-100">{latestRecord.laser1Via.bottomWidthUm ?? '—'} µm</span>
                      <span className="text-[9px] text-slate-500 block">Spec: {currentBottomSpecStr}</span>
                    </div>
                    {latestRecord.laser1Via.bottomPass ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Laser 2 Via Quality */}
            <Card className="p-4 border-slate-800 bg-slate-950 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-400 text-xs uppercase tracking-wider">
                  VIA QUALITY — LASER 2 (HEAD B)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  latestRecord.laser2Via.overallPass ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {latestRecord.laser2Via.overallPass ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {latestRecord.laser2Via.viaImageDataUrl ? (
                    <img src={latestRecord.laser2Via.viaImageDataUrl} alt="Laser 2 Via" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                  )}
                </div>

                <div className="space-y-2 text-xs font-mono flex-1">
                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Top Drill Width</span>
                      <span className="font-bold text-slate-100">{latestRecord.laser2Via.topWidthUm ?? '—'} µm</span>
                      <span className="text-[9px] text-slate-500 block">Spec: {currentTopSpecStr}</span>
                    </div>
                    {latestRecord.laser2Via.topPass ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Bottom Drill Width</span>
                      <span className="font-bold text-slate-100">{latestRecord.laser2Via.bottomWidthUm ?? '—'} µm</span>
                      <span className="text-[9px] text-slate-500 block">Spec: {currentBottomSpecStr}</span>
                    </div>
                    {latestRecord.laser2Via.bottomPass ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center text-slate-400 border-dashed border-slate-800">
          <p>No product or process records found for this machine.</p>
          <Button onClick={() => setIsAddModalOpen(true)} className="mt-3 bg-cyan-500 text-slate-950 font-bold text-xs">
            Add Initial Record
          </Button>
        </Card>
      )}

      {/* Historical Records Table */}
      <Card className="p-4 border-slate-800 bg-slate-900/90 space-y-3">
        <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
          Product & Process Verification History ({records.length})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Product / Recipe</th>
                <th className="py-2 px-2">Lot / Panel</th>
                <th className="py-2 px-2">Phase 1 Pwr / Freq</th>
                <th className="py-2 px-2">Phase 2 Pwr / Freq</th>
                <th className="py-2 px-2">Power Offset (L1 / L2)</th>
                <th className="py-2 px-2">Via Spec (Top / Btm)</th>
                <th className="py-2 px-2">Laser 1 Via (Top/Btm)</th>
                <th className="py-2 px-2">Laser 2 Via (Top/Btm)</th>
                <th className="py-2 px-2 text-center">Result</th>
                <th className="py-2 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-800/40">
                  <td className="py-2 px-2 font-bold text-slate-200">{rec.date}</td>
                  <td className="py-2 px-2 text-slate-300">
                    <div className="font-semibold">{rec.productName || '—'}</div>
                    <div className="text-[10px] text-cyan-400">{rec.recipeName || '—'}</div>
                  </td>
                  <td className="py-2 px-2 text-amber-300">{rec.lotPanel || '—'}</td>
                  <td className="py-2 px-2 text-slate-300">
                    {rec.phase1.powerWatts ?? '—'}W / {rec.phase1.frequencyKhz ?? '—'}kHz
                  </td>
                  <td className="py-2 px-2 text-slate-300">
                    {rec.phase2.powerWatts ?? '—'}W / {rec.phase2.frequencyKhz ?? '—'}kHz
                  </td>
                  <td className="py-2 px-2 font-mono">
                    <span className="text-amber-400 font-semibold">{rec.laser1PowerOffsetPercent !== null && rec.laser1PowerOffsetPercent !== undefined ? `${rec.laser1PowerOffsetPercent > 0 ? '+' : ''}${rec.laser1PowerOffsetPercent}%` : '—'}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-cyan-400 font-semibold">{rec.laser2PowerOffsetPercent !== null && rec.laser2PowerOffsetPercent !== undefined ? `${rec.laser2PowerOffsetPercent > 0 ? '+' : ''}${rec.laser2PowerOffsetPercent}%` : '—'}</span>
                  </td>
                  <td className="py-2 px-2 text-slate-400 text-[10px]">
                    <div>Top: {ProductProcessEngine.getFormattedTopSpec(rec.viaSpec)}</div>
                    <div>Btm: {ProductProcessEngine.getFormattedBottomSpec(rec.viaSpec)}</div>
                  </td>
                  <td className="py-2 px-2 text-slate-300">
                    {rec.laser1Via.topWidthUm ?? '—'}µm / {rec.laser1Via.bottomWidthUm ?? '—'}µm
                  </td>
                  <td className="py-2 px-2 text-slate-300">
                    {rec.laser2Via.topWidthUm ?? '—'}µm / {rec.laser2Via.bottomWidthUm ?? '—'}µm
                  </td>
                  <td className="py-2 px-2 text-center">
                    <Badge variant={rec.overallResult === 'PASS' ? 'success' : 'danger'} className="text-[9px]">
                      {rec.overallResult}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(rec)}
                      className="text-cyan-400 hover:text-cyan-300 p-1 inline-flex items-center"
                      title="Edit record"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="text-rose-400 hover:text-rose-300 p-1 inline-flex items-center"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Enter / Edit Record Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRecordId(null);
        }}
        title={editingRecordId ? `Edit Product, Process & Via Check — ${formDate}` : `Enter New Product, Process & Via Check — ${machine.model}`}
        maxWidth="4xl"
      >
        <div className="space-y-2.5 max-h-[82vh] overflow-y-auto pr-1 text-xs">
          {/* 1. Header Metadata Bar */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Check Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-1 text-xs font-mono font-medium focus:outline-none focus:ring-1 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 focus:ring-cyan-600/20'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Product Name
              </label>
              <input
                type="text"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                placeholder="e.g. HDI Rigid-Flex Rev C"
                className={`w-full border rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600/20'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Recipe Name
              </label>
              <input
                type="text"
                value={formRecipe}
                onChange={(e) => setFormRecipe(e.target.value)}
                placeholder="e.g. HDI_VIA_MICRO_50UM"
                className={`w-full border rounded-lg px-2.5 py-1 text-xs font-mono font-medium focus:outline-none focus:ring-1 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600/20'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Lot / Panel
              </label>
              <input
                type="text"
                value={formLot}
                onChange={(e) => setFormLot(e.target.value)}
                placeholder="e.g. LOT-2026-8834 / P-01"
                className={`w-full border rounded-lg px-2.5 py-1 text-xs font-mono font-medium focus:outline-none focus:ring-1 ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-cyan-600/20'
                }`}
              />
            </div>
          </div>

          {/* 2. Process Parameters (Phase 1 & Phase 2) */}
          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2`}>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-cyan-400 uppercase tracking-wider text-xs font-mono">
                  PROCESS PARAMETERS (PHASE 1 & PHASE 2)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Dual-Phase Drilling Recipe</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Phase 1 */}
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/90 border-amber-900/30' : 'bg-white border-amber-200'}`}>
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-bold text-amber-400 uppercase text-[10px] font-mono">PHASE 1 (ROUGH / BULK)</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5 font-mono">
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Power</label>
                    <input
                      type="number"
                      step="0.1"
                      value={p1Power}
                      onChange={(e) => setP1Power(e.target.value)}
                      placeholder="W"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">W</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Freq</label>
                    <input
                      type="number"
                      step="1"
                      value={p1Freq}
                      onChange={(e) => setP1Freq(e.target.value)}
                      placeholder="kHz"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">kHz</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Shots</label>
                    <input
                      type="number"
                      step="1"
                      value={p1Shots}
                      onChange={(e) => setP1Shots(e.target.value)}
                      placeholder="qty"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">shots</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Mask</label>
                    <input
                      type="number"
                      step="0.1"
                      value={p1Mask}
                      onChange={(e) => setP1Mask(e.target.value)}
                      placeholder="mm"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">mm</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Defocus</label>
                    <input
                      type="number"
                      step="0.05"
                      value={p1Defocus}
                      onChange={(e) => setP1Defocus(e.target.value)}
                      placeholder="mm"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">mm</span>
                  </div>
                </div>
              </div>

              {/* Phase 2 */}
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/90 border-cyan-900/30' : 'bg-white border-cyan-200'}`}>
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="font-bold text-cyan-400 uppercase text-[10px] font-mono">PHASE 2 (CLEAN / FINISH)</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5 font-mono">
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Power</label>
                    <input
                      type="number"
                      step="0.1"
                      value={p2Power}
                      onChange={(e) => setP2Power(e.target.value)}
                      placeholder="W"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">W</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Freq</label>
                    <input
                      type="number"
                      step="1"
                      value={p2Freq}
                      onChange={(e) => setP2Freq(e.target.value)}
                      placeholder="kHz"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">kHz</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Shots</label>
                    <input
                      type="number"
                      step="1"
                      value={p2Shots}
                      onChange={(e) => setP2Shots(e.target.value)}
                      placeholder="qty"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">shots</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Mask</label>
                    <input
                      type="number"
                      step="0.1"
                      value={p2Mask}
                      onChange={(e) => setP2Mask(e.target.value)}
                      placeholder="mm"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">mm</span>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-400 text-center uppercase tracking-wider mb-0.5 truncate">Defocus</label>
                    <input
                      type="number"
                      step="0.05"
                      value={p2Defocus}
                      onChange={(e) => setP2Defocus(e.target.value)}
                      placeholder="mm"
                      className={`w-full text-center py-1 px-0.5 text-xs font-bold rounded border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="block text-[8px] text-slate-500 text-center mt-0.5">mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Offsets & Authoritative Via Specifications */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
            {/* Power Offsets (5 cols) */}
            <div className={`lg:col-span-5 p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2`}>
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-xs font-mono">
                    POWER OFFSETS
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">±20% Max</span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                {/* Laser 1 Offset */}
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/80 border-amber-900/30' : 'bg-white border-amber-200'}`}>
                  <span className="block text-[9px] text-amber-400 font-bold uppercase mb-0.5 truncate">L1 (Head A)</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={l1Offset}
                      onChange={(e) => setL1Offset(e.target.value)}
                      placeholder="-12.0"
                      className={`w-full py-1 pl-1.5 pr-4 rounded text-xs font-bold font-mono border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                  </div>
                  <span className="block text-[8px] text-slate-500 mt-0.5 truncate">Recipe offset</span>
                </div>

                {/* Laser 2 Offset */}
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/80 border-cyan-900/30' : 'bg-white border-cyan-200'}`}>
                  <span className="block text-[9px] text-cyan-400 font-bold uppercase mb-0.5 truncate">L2 (Head B)</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={l2Offset}
                      onChange={(e) => setL2Offset(e.target.value)}
                      placeholder="2.0"
                      className={`w-full py-1 pl-1.5 pr-4 rounded text-xs font-bold font-mono border ${
                        isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                      } outline-none`}
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                  </div>
                  <span className="block text-[8px] text-slate-500 mt-0.5 truncate">Recipe offset</span>
                </div>
              </div>

              {deltaOffset !== null && (
                <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/90 border border-slate-800 text-[10px] font-mono">
                  <span className="text-slate-400">Head Delta (|L1-L2|):</span>
                  <span className="font-bold text-amber-300">{deltaOffset.toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/* Authoritative Via Acceptance Specification (7 cols) */}
            <div className={`lg:col-span-7 p-2.5 rounded-xl border ${
              isDark ? 'bg-slate-950/90 border-amber-500/30 shadow-sm shadow-amber-500/5' : 'bg-amber-50/50 border-amber-300'
            } space-y-2`}>
              <div className="flex items-center justify-between pb-1 border-b border-amber-900/30">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-xs font-mono">
                    AUTHORITATIVE VIA SPECIFICATION (GATES)
                  </span>
                  <span className="hidden sm:inline text-[9px] bg-amber-950/80 border border-amber-800/80 text-amber-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                    GATES ≠ READINGS
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyPreset('std50')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] border border-slate-700 font-mono"
                  >
                    Std 50
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('hdi35')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] border border-slate-700 font-mono"
                  >
                    HDI 35
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('fine25')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] border border-slate-700 font-mono"
                  >
                    Fine 25
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsImportSpecOpen(true)}
                    className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[9px] border border-cyan-800 font-mono flex items-center gap-1"
                  >
                    <Upload className="w-2.5 h-2.5" />
                    JSON
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
                {/* Top Diameter Gate */}
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-bold text-slate-300 uppercase">Top Dia</span>
                    <span className="text-[8.5px] text-cyan-400 font-bold">
                      {(liveTopTarget - liveTopTolerance).toFixed(1)}–{(liveTopTarget + liveTopTolerance).toFixed(1)}µm
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="block text-[8px] text-slate-400">Target (µm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={topTarget}
                        onChange={(e) => setTopTarget(e.target.value)}
                        placeholder="51"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-400">Tol (± µm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={topTolerance}
                        onChange={(e) => setTopTolerance(e.target.value)}
                        placeholder="10"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Diameter Gate */}
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-bold text-slate-300 uppercase">Bottom Dia</span>
                    <span className="text-[8.5px] text-cyan-400 font-bold">
                      {(liveBottomTarget - liveBottomTolerance).toFixed(1)}–{(liveBottomTarget + liveBottomTolerance).toFixed(1)}µm
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="block text-[8px] text-slate-400">Target (µm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={bottomTarget}
                        onChange={(e) => setBottomTarget(e.target.value)}
                        placeholder="23"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-400">Tol (± µm)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={bottomTolerance}
                        onChange={(e) => setBottomTolerance(e.target.value)}
                        placeholder="10"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                  </div>
                </div>

                {/* Taper Spec */}
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9.5px] font-bold text-slate-300 uppercase">Taper Ratio</span>
                    <span className="text-[8.5px] text-amber-400 font-bold">
                      (B/T)×100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="block text-[8px] text-slate-400">Min Ratio (%)</label>
                      <input
                        type="number"
                        step="1"
                        value={minTaper}
                        onChange={(e) => setMinTaper(e.target.value)}
                        placeholder="40"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-slate-400">Label</label>
                      <input
                        type="text"
                        value={taperSpecText}
                        onChange={(e) => setTaperSpecText(e.target.value)}
                        placeholder="≥ 40%"
                        className={`w-full py-0.5 px-1 text-center text-xs font-bold rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                        } outline-none`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Via Quality Micro-Inspection (Evidence & Measurements) */}
          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-2`}>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-cyan-400 uppercase tracking-wider text-xs font-mono">
                  VIA QUALITY MICRO-INSPECTION
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Dual-Head Inspection Evidence & Measured Diameters
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <ViaQualityInspectionCard
                laser={1}
                title="Laser 1 (Head A)"
                themeColor="amber"
                topWidth={l1Top}
                bottomWidth={l1Bottom}
                imageDataUrl={l1Image}
                viaSpec={currentViaSpec}
                onTopWidthChange={setL1Top}
                onBottomWidthChange={setL1Bottom}
                onImageUpload={(file) => handleImageUpload(1, file)}
                onImageRemove={() => setL1Image(undefined)}
                isDark={isDark}
              />
              <ViaQualityInspectionCard
                laser={2}
                title="Laser 2 (Head B)"
                themeColor="cyan"
                topWidth={l2Top}
                bottomWidth={l2Bottom}
                imageDataUrl={l2Image}
                viaSpec={currentViaSpec}
                onTopWidthChange={setL2Top}
                onBottomWidthChange={setL2Bottom}
                onImageUpload={(file) => handleImageUpload(2, file)}
                onImageRemove={() => setL2Image(undefined)}
                isDark={isDark}
              />
            </div>
          </div>

          {/* 5. Engineer Remarks (Visually Secondary) */}
          <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800/70' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <label className={`text-[10px] font-medium whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Engineer Remarks (optional):
              </label>
              <input
                type="text"
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="e.g. Recipe parameters verified against production specs."
                className={`flex-1 text-xs py-1 px-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
                } outline-none`}
              />
            </div>
          </div>

          {/* 6. Footer Bar & Overall Verdict */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            {/* Left: Overall Verdict summary */}
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Overall Verdict:</span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                  !hasInspectionData
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : formOverallPass
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-rose-950 text-rose-300 border-rose-700'
                }`}
              >
                {!hasInspectionData ? 'PENDING' : formOverallPass ? 'PASS' : 'FAIL'}
              </span>
              {hasInspectionData && (
                <span className="hidden sm:inline text-[10px] text-slate-400">
                  ({formOverallPass ? 'Both Heads In Spec' : 'One or More Heads Out of Spec'})
                </span>
              )}
            </div>

            {/* Right: Cancel & Save Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingRecordId(null);
                }}
                className="text-xs py-1.5 px-3"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRecord}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1.5 px-4"
              >
                {editingRecordId ? 'Save Changes' : 'Save Record to Passport'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Import Specification Modal */}
      <Modal
        isOpen={isImportSpecOpen}
        onClose={() => setIsImportSpecOpen(false)}
        title="Import Authoritative Via Specification"
        maxWidth="max-w-lg"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            Paste a customer/engineering Via Specification JSON object below to populate the target limits:
          </p>
          <textarea
            value={importSpecJson}
            onChange={(e) => setImportSpecJson(e.target.value)}
            placeholder={`{\n  "topTargetUm": 51,\n  "topToleranceUm": 10,\n  "bottomTargetUm": 23,\n  "bottomToleranceUm": 10,\n  "minTaperPercent": 40,\n  "taperSpecText": "≥ 40%"\n}`}
            className="w-full h-36 bg-slate-950 border border-slate-700 rounded p-2.5 font-mono text-slate-100 text-xs focus:border-cyan-500 outline-none"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => setIsImportSpecOpen(false)}
              className="text-xs py-1.5 px-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportSpec}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-1.5 px-4"
            >
              Apply Specification
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
