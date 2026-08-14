import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  ShieldAlert, 
  Info, 
  FileCode, 
  Layers, 
  Check, 
  Download,
  RotateCcw
} from 'lucide-react';
import { RecommendedPart, MachineFamily } from '../../types/parts';
import { 
  parseCSVToObjects, 
  validateImportRecords, 
  ImportSummary, 
  ImportValidationItem 
} from '../../utils/partsImportEngine';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useTheme } from '../../context/ThemeContext';

interface ImportPartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingParts: RecommendedPart[];
  onConfirmImport: (partsToPersist: RecommendedPart[], mode: 'SKIP_EXISTING' | 'OVERWRITE_EXISTING' | 'MERGE_ALL') => void;
  defaultFamily?: MachineFamily;
}

export const ImportPartsModal: React.FC<ImportPartsModalProps> = ({
  isOpen,
  onClose,
  existingParts,
  onConfirmImport,
  defaultFamily = 'BMD302W'
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps: 'SELECT' | 'PREVIEW' | 'COMPLETE'
  const [step, setStep] = useState<'SELECT' | 'PREVIEW'>('SELECT');
  const [fileName, setFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'SKIP_EXISTING' | 'OVERWRITE_EXISTING'>('OVERWRITE_EXISTING');
  const [filterPreviewStatus, setFilterPreviewStatus] = useState<'ALL' | 'NEW' | 'DUPLICATE' | 'ERROR'>('ALL');

  const resetState = () => {
    setStep('SELECT');
    setFileName('');
    setRawText('');
    setParseError(null);
    setImportSummary(null);
    setDuplicateStrategy('OVERWRITE_EXISTING');
    setFilterPreviewStatus('ALL');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processText = (text: string, name: string) => {
    setParseError(null);
    setFileName(name);
    setRawText(text);

    let rawRecords: Record<string, any>[] = [];

    const isJson = name.toLowerCase().endsWith('.json') || text.trim().startsWith('[') || text.trim().startsWith('{');

    try {
      if (isJson) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          rawRecords = parsed;
        } else if (parsed && Array.isArray(parsed.parts)) {
          rawRecords = parsed.parts;
        } else if (parsed && Array.isArray(parsed.data)) {
          rawRecords = parsed.data;
        } else if (typeof parsed === 'object') {
          rawRecords = [parsed];
        } else {
          throw new Error('JSON structure must be an array of part objects.');
        }
      } else {
        // CSV Parsing
        rawRecords = parseCSVToObjects(text);
        if (rawRecords.length === 0) {
          throw new Error('CSV file is empty or does not contain header columns.');
        }
      }

      const familyToPass: MachineFamily = (defaultFamily === 'BMD250WM' || defaultFamily === 'OTHER') ? defaultFamily : 'BMD302W';
      const summary = validateImportRecords(rawRecords, existingParts, familyToPass);
      if (summary.totalRecords === 0) {
        throw new Error('No valid or parseable part records found in file.');
      }

      setImportSummary(summary);
      setStep('PREVIEW');
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file. Please verify CSV/JSON formatting.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processText(content, file.name);
    };
    reader.onerror = () => {
      setParseError('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processText(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Download Sample Template
  const handleDownloadSampleCSV = (family: MachineFamily) => {
    const headers = [
      'Machine Family',
      'Part Number',
      'Part Name',
      'Description',
      'Unit',
      'Quantity per machine',
      'Price',
      'Recommended Life Span',
      'Lead Time',
      'Critical Part',
      'Remark',
      'Category'
    ];

    const sampleRows = family === 'BMD302W' ? [
      [
        'BMD302W',
        '100-302-9901',
        'Dual Oscillator Optical Isolation Window',
        'High damage threshold fused silica window 1064nm AR coated',
        'PCS',
        '2',
        '450.00',
        '20,000 hrs',
        '4-6 weeks',
        'TRUE',
        'Cleanroom ISO Class 5 required during installation',
        'Optics'
      ],
      [
        'BMD302W',
        '100-302-9902',
        'DI Resin Filter Cartridge 10-Inch',
        'Ultra-pure deionized cooling water loop filter',
        'PCS',
        '1',
        '180.00',
        '6 months',
        'In Stock',
        'FALSE',
        'Scheduled replacement during quarterly PM',
        'Cooling System'
      ]
    ] : [
      [
        'BMD250WM',
        '200-250-8801',
        'Single Mode Beam Collimator Assembly',
        'Precision precision-grade collimator with water cooling jacket',
        'SET',
        '1',
        '1200.00',
        '30,000 hrs',
        '6-8 weeks',
        'TRUE',
        'Verify focal centering before securing',
        'Laser Source'
      ],
      [
        'BMD250WM',
        '200-250-8802',
        'Galvo Scanner Protective Lens Cover',
        'Protective cover glass with anti-reflective coating',
        'PCS',
        '2',
        '95.00',
        '12 months',
        'In Stock',
        'FALSE',
        'Replace when scatter exceeds 2%',
        'Optics'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FSOS_Recommended_Parts_Template_${family}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = () => {
    if (!importSummary) return;

    const validItems = importSummary.items.filter(i => i.status !== 'ERROR' && i.parsedPart);
    
    let partsToSave: RecommendedPart[] = [];

    if (duplicateStrategy === 'SKIP_EXISTING') {
      partsToSave = validItems
        .filter(i => i.status === 'VALID_NEW')
        .map(i => i.parsedPart!);
    } else {
      // OVERWRITE_EXISTING / MERGE
      partsToSave = validItems.map(i => i.parsedPart!);
    }

    onConfirmImport(partsToSave, duplicateStrategy);
    handleClose();
  };

  const filteredPreviewItems = (importSummary?.items || []).filter(item => {
    if (filterPreviewStatus === 'NEW') return item.status === 'VALID_NEW';
    if (filterPreviewStatus === 'DUPLICATE') return item.status === 'VALID_DUPLICATE';
    if (filterPreviewStatus === 'ERROR') return item.status === 'ERROR';
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'SELECT' ? 'Import Recommended Parts Catalog' : 'Validate & Preview Import Data'}
      subtitle={
        step === 'SELECT'
          ? 'Import structured CSV or JSON parts lists for BMD302W and BMD250WM machine families into the authoritative Master.'
          : `Reviewing ${importSummary?.totalRecords || 0} parsed records from ${fileName}`
      }
      maxWidth={step === 'SELECT' ? 'xl' : '4xl'}
    >
      <div className="p-4 space-y-4">
        {step === 'SELECT' ? (
          <div className="space-y-4">
            {parseError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Import File Error</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{parseError}</div>
                </div>
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDark 
                  ? 'border-indigo-500/30 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10' 
                  : 'border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,text/csv,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20 mb-3">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Click to Browse or Drag & Drop File
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Supports structured CSV or JSON formats. Automatically verifies machine families, duplicate identities, and field validity before persistence.
                </p>
              </div>
            </div>

            {/* Template Download & Format Guide */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-400" />
                  Download Engineering Sample CSV Templates
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDownloadSampleCSV('BMD302W')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isDark ? 'bg-[#1E2227] border-[#2B323A] hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-500'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold font-mono text-indigo-400">BMD302W Template.csv</div>
                    <div className="text-[10px] text-slate-400">Dual Laser Series Spare Parts Schema</div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadSampleCSV('BMD250WM')}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isDark ? 'bg-[#1E2227] border-[#2B323A] hover:border-cyan-500' : 'bg-white border-slate-200 hover:border-cyan-500'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold font-mono text-cyan-400">BMD250WM Template.csv</div>
                    <div className="text-[10px] text-slate-400">Precision Series Spare Parts Schema</div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-300">Required CSV/JSON Column Headers:</div>
                <div className="font-mono text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800 overflow-x-auto">
                  Machine Family, Part Number, Part Name, Description, Unit, Quantity per machine, Price, Recommended Life Span, Lead Time, Critical Part, Remark
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP: PREVIEW */
          <div className="space-y-4">
            {/* KPI Validation Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] text-slate-400 font-medium">Total In Payload</div>
                <div className="text-lg font-bold font-mono text-slate-200">{importSummary?.totalRecords}</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] text-slate-400 font-medium">New Parts</div>
                <div className="text-lg font-bold font-mono text-emerald-400">{importSummary?.newCount}</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] text-slate-400 font-medium">Existing Matches</div>
                <div className="text-lg font-bold font-mono text-amber-400">{importSummary?.duplicateCount}</div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
              }`}>
                <div className="text-[10px] text-slate-400 font-medium">Validation Errors</div>
                <div className={`text-lg font-bold font-mono ${
                  (importSummary?.errorCount || 0) > 0 ? 'text-rose-400' : 'text-slate-500'
                }`}>
                  {importSummary?.errorCount}
                </div>
              </div>
            </div>

            {/* Existing Matches Strategy */}
            {(importSummary?.duplicateCount || 0) > 0 && (
              <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="text-xs">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {importSummary?.duplicateCount} Existing Part Match(es) Detected
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Choose how to handle items matching existing part numbers in the same machine family:
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDuplicateStrategy('OVERWRITE_EXISTING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      duplicateStrategy === 'OVERWRITE_EXISTING'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : isDark ? 'bg-[#1E2227] text-slate-300 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Update / Overwrite
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateStrategy('SKIP_EXISTING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      duplicateStrategy === 'SKIP_EXISTING'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : isDark ? 'bg-[#1E2227] text-slate-300 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Skip Matches
                  </button>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterPreviewStatus('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterPreviewStatus === 'ALL'
                      ? 'bg-slate-800 text-slate-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Items ({importSummary?.totalRecords})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPreviewStatus('NEW')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterPreviewStatus === 'NEW'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  New ({importSummary?.newCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPreviewStatus('DUPLICATE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterPreviewStatus === 'DUPLICATE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Existing Matches ({importSummary?.duplicateCount})
                </button>
                {(importSummary?.errorCount || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterPreviewStatus('ERROR')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterPreviewStatus === 'ERROR'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Errors ({importSummary?.errorCount})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep('SELECT')}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Change File
              </button>
            </div>

            {/* Preview Table */}
            <div className={`overflow-x-auto max-h-72 rounded-xl border ${
              isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-200'
            }`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${
                    isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Family</th>
                    <th className="py-2.5 px-3 font-semibold">Part Number</th>
                    <th className="py-2.5 px-3 font-semibold">Part Name</th>
                    <th className="py-2.5 px-3 font-semibold">Qty / Unit</th>
                    <th className="py-2.5 px-3 font-semibold">Critical</th>
                    <th className="py-2.5 px-3 font-semibold">Life Span / Lead</th>
                    <th className="py-2.5 px-3 font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#2B323A]">
                  {filteredPreviewItems.map((item) => (
                    <tr 
                      key={item.index}
                      className={item.status === 'ERROR' ? 'bg-rose-500/5' : ''}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.status === 'VALID_NEW' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            NEW
                          </span>
                        )}
                        {item.status === 'VALID_DUPLICATE' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            MATCH
                          </span>
                        )}
                        {item.status === 'ERROR' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            INVALID
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-semibold whitespace-nowrap">
                        {item.parsedPart?.machineFamily || item.raw.machineFamily || '—'}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-400 whitespace-nowrap">
                        {item.parsedPart?.partNumber || item.raw.partNumber || '—'}
                      </td>

                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-semibold text-slate-200 truncate">
                          {item.parsedPart?.partName || item.raw.partName || '—'}
                        </div>
                        {item.errors.length > 0 && (
                          <div className="text-[10px] text-rose-400 font-normal mt-0.5">
                            {item.errors.join('; ')}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.parsedPart ? (
                          <span>{item.parsedPart.quantityPerMachine} {item.parsedPart.unit}</span>
                        ) : '—'}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.parsedPart?.isCritical ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1 text-[10px]">
                            <ShieldAlert className="w-3 h-3" /> Critical
                          </span>
                        ) : (
                          <span className="text-slate-500">Standard</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                        {item.parsedPart?.recommendedLifeSpan || item.parsedPart?.leadTime ? (
                          <div>
                            {item.parsedPart.recommendedLifeSpan && <div>{item.parsedPart.recommendedLifeSpan}</div>}
                            {item.parsedPart.leadTime && <div className="text-[10px] text-cyan-400">{item.parsedPart.leadTime}</div>}
                          </div>
                        ) : '—'}
                      </td>

                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                        {item.parsedPart?.price !== undefined ? (
                          `${item.parsedPart.currency || 'USD'} ${item.parsedPart.price.toFixed(2)}`
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Error Notice */}
            {(importSummary?.errorCount || 0) > 0 && (
              <div className="text-[11px] text-rose-400/90 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{importSummary?.errorCount} invalid record(s) will be excluded automatically. Only valid records will be saved.</span>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>

          {step === 'PREVIEW' && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep('SELECT')}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleExecuteImport}
                disabled={!importSummary || (importSummary.validCount === 0)}
                className="flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirm & Import Valid Records
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
