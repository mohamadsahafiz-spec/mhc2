import React, { useState, useRef, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  Edit3, 
  Check, 
  RotateCcw, 
  Sliders, 
  Calendar, 
  User, 
  Building, 
  Hash, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Minus,
  AlertCircle,
  Camera
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { MHCSession, MhcReportDocument, MhcReportSectionCode } from '../../../types';
import { buildMhcReportDocument } from '../../../utils/mhcReportEngine';
import { APP_VERSION } from '../../../constants/version';
import { LaserEngine } from '../../../utils/laserEngine';
import { ImageStore } from '../../../utils/imageStore';
import { ProductProcessEngine } from '../../../utils/productProcessEngine';
import { TemperatureGraph } from '../../common/TemperatureGraph';

export interface MhcFullPdfRendererProps {
  session: MHCSession;
  previousSession?: MHCSession;
  reportDocument?: MhcReportDocument;
  isDark?: boolean;
  onBackToAutopilot?: () => void;
  onProceedToBuyoff?: () => void;
  onPdfGenerated?: (pdfBlobUrl?: string) => void;
}

// Laser Head Identifier resolver ensuring distinct laser head labels (Laser Head 1, Laser Head 2)
function resolveLaserHeadIdentifier(
  rawIdentifier: string | undefined,
  idx: number,
  machineInfo?: { machineNumber?: string; machineModel?: string; machineSerialNumber?: string }
): string {
  const defaultLabel = `Laser Head ${idx + 1}`;
  if (!rawIdentifier || typeof rawIdentifier !== 'string' || !rawIdentifier.trim()) {
    return defaultLabel;
  }

  const trimmed = rawIdentifier.trim();

  // If rawIdentifier is identical to machine identity (e.g. machineNumber like "WLVIA#3", machineModel, serialNumber)
  if (machineInfo) {
    if (machineInfo.machineNumber && trimmed.toLowerCase() === machineInfo.machineNumber.trim().toLowerCase()) {
      return defaultLabel;
    }
    if (machineInfo.machineModel && trimmed.toLowerCase() === machineInfo.machineModel.trim().toLowerCase()) {
      return defaultLabel;
    }
    if (machineInfo.machineSerialNumber && trimmed.toLowerCase() === machineInfo.machineSerialNumber.trim().toLowerCase()) {
      return defaultLabel;
    }
  }

  // Normalize forms like "Laser Head #1", "Laser 1", "Head 1", "LH 1", "LH-1" to "Laser Head 1"
  const headNumMatch = trimmed.match(/^(?:laser\s*head|laser|head|lh)\s*#?[-_\s]*(\d+)$/i);
  if (headNumMatch) {
    return `Laser Head ${headNumMatch[1]}`;
  }

  // If it doesn't contain any head/laser designation and is just a model/machine tag or generic string
  if (!/(?:head|laser|lh|\bL\d\b)/i.test(trimmed)) {
    return defaultLabel;
  }

  return trimmed;
}

export const MhcFullPdfRenderer: React.FC<MhcFullPdfRendererProps> = ({
  session,
  previousSession,
  reportDocument,
  isDark = true,
  onBackToAutopilot,
  onProceedToBuyoff,
  onPdfGenerated
}) => {
  // Construct or use passed document
  const baseDoc: MhcReportDocument = reportDocument || buildMhcReportDocument(session, previousSession);
  const metadata = baseDoc.metadata;
  const sections = baseDoc.sections;

  // Controls State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [showOptionalSections, setShowOptionalSections] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(0.9);

  // Data-Driven Editable Report Metadata State
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [engineerName, setEngineerName] = useState<string>(
    session.engineerName || sections['01']?.data?.engineerName || ''
  );
  const [customerCompany, setCustomerCompany] = useState<string>(
    session.customerName || metadata.customerName || ''
  );
  const [plantFacility, setPlantFacility] = useState<string>(
    session.plantName || metadata.plantName || ''
  );
  const [lineName, setLineName] = useState<string>(
    sections['01']?.data?.productionLine ||
    sections['01']?.data?.lineName ||
    session.productionLineName ||
    '—'
  );
  const [inspectionDate, setInspectionDate] = useState<string>(
    session.completedDate || session.startDate || (session as any).inspectionDate || sections['01']?.data?.date || ''
  );
  const [machineNumber, setMachineNumber] = useState<string>(
    (session as any).machineNumber || sections['01']?.data?.machineNumber || ''
  );
  const [releaseStatus, setReleaseStatus] = useState<'APPROVED' | 'CONDITIONAL_RELEASE' | 'HALTED' | 'PENDING' | 'PASS' | 'WARNING' | 'FAIL'>(
    (sections['15']?.data?.productionReleaseVerdict as any) || 'PENDING'
  );

  const totalPages = baseDoc.metadata.totalPagesCount || 10;

  // Group index entries by page number for the approved vertical presentation
  const groupedIndexPages = useMemo(() => {
    const pageMap = new Map<number, typeof baseDoc.indexEntries>();
    baseDoc.indexEntries.forEach((entry) => {
      const page = entry.pageNumber || 1;
      if (!pageMap.has(page)) {
        pageMap.set(page, []);
      }
      pageMap.get(page)!.push(entry);
    });

    const pages = Array.from(pageMap.keys()).sort((a, b) => a - b);
    return pages.map((pageNum) => ({
      pageNumber: pageNum,
      entries: pageMap.get(pageNum)!
    }));
  }, [baseDoc.indexEntries]);

  const getPageGroupTitle = (pageNum: number): string => {
    switch (pageNum) {
      case 1: return 'Customer & Machine Identity';
      case 2: return 'Table of Contents & Index';
      case 3: return 'Executive Summary & Hours';
      case 4: return 'Laser Power & Stability';
      case 5: return 'Optical Beam & Spot Quality';
      case 6: return 'Focus & Power Offsets';
      case 7: return 'Stage & Sensor Calibration';
      case 8: return 'Thermal Environment';
      case 9: return 'Product Process & Via Quality';
      case 10: return 'Certification & Sign-Off';
      default: return 'Subsystem Diagnostics';
    }
  };

  // Reference for printable document container
  const documentContainerRef = useRef<HTMLDivElement>(null);

  // Helper for status badge styling
  const renderStatusBadge = (status: string, label?: string) => {
    switch (status) {
      case 'PASS':
      case 'APPROVED':
      case 'COMPLETE':
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 leading-none">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="leading-none">{label || status}</span>
          </span>
        );
      case 'PENDING':
      case 'PENDING_APPROVAL':
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-300 leading-none">
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            <span className="leading-none">{label || 'PENDING REVIEW'}</span>
          </span>
        );
      case 'WARNING':
      case 'CONDITIONAL_PASS':
      case 'CONDITIONAL_RELEASE':
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300 leading-none">
            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
            <span className="leading-none">{label || status}</span>
          </span>
        );
      case 'FAIL':
      case 'ACTION_REQUIRED':
      case 'OUT_OF_SPEC':
      case 'HALTED':
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-100 text-rose-800 border border-rose-300 leading-none">
            <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
            <span className="leading-none">{label || status}</span>
          </span>
        );
      case 'NOT_COLLECTED':
      case 'UNAVAILABLE':
      case 'NOT_APPLICABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-300 leading-none">
            <Minus className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="leading-none">{label || status.replace('_', ' ')}</span>
          </span>
        );
    }
  };

  // PDF Download Handler via html2canvas-pro + jsPDF
  const handleDownloadPdf = async () => {
    if (!documentContainerRef.current) return;
    setIsGeneratingPdf(true);
    setDownloadProgress('Preparing report pages...');

    const container = documentContainerRef.current;
    const originalTransform = container.style.transform;
    const originalTransformOrigin = container.style.transformOrigin;

    // Temporarily reset zoom transform for true 1:1 coordinate calculation
    container.style.transform = 'none';
    container.style.transformOrigin = 'initial';

    let lastFailingOperation = 'INIT';
    let currentProcessingPage = 0;

    try {
      lastFailingOperation = 'QUERY_PAGES';
      const pageElements = container.querySelectorAll('.mhc-a4-page');
      if (!pageElements || pageElements.length === 0) {
        throw new Error('No printable pages found (.mhc-a4-page missing).');
      }

      lastFailingOperation = 'INIT_JSPDF';
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      for (let i = 0; i < pageElements.length; i++) {
        currentProcessingPage = i + 1;
        const pageEl = pageElements[i] as HTMLElement;
        setDownloadProgress(`Rendering Page ${i + 1} of ${pageElements.length}...`);

        lastFailingOperation = `HTML2CANVAS_PAGE_${i + 1}`;
        let canvas: HTMLCanvasElement | null = null;
        try {
          canvas = await html2canvas(pageEl, {
            scale: 1.2, // ~120 DPI provides ultra-crisp typography with a lightweight memory footprint
            useCORS: true,
            allowTaint: false, // Prevents tainted canvas security exceptions
            logging: false,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            imageTimeout: 8000,
            onclone: (_clonedDoc, clonedEl) => {
              clonedEl.style.transform = 'none';
              const imgs = clonedEl.querySelectorAll('img');
              imgs.forEach(img => {
                img.setAttribute('crossOrigin', 'anonymous');
              });
            }
          });

          lastFailingOperation = `CANVAS_TO_DATA_URL_PAGE_${i + 1}`;
          const imgData = canvas.toDataURL('image/jpeg', 0.80);

          lastFailingOperation = `JSPDF_ADD_PAGE_${i + 1}`;
          if (i > 0) {
            pdf.addPage('a4', 'portrait');
          }

          lastFailingOperation = `JSPDF_ADD_IMAGE_PAGE_${i + 1}`;
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        } finally {
          // Immediately release canvas bitmap memory from GPU and RAM backing store
          if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
            canvas = null;
          }
        }

        // Micro-yield to allow browser garbage collection between page renders
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      lastFailingOperation = 'JSPDF_SAVE';
      setDownloadProgress('Finalizing PDF package...');
      const fileName = `${metadata.reportNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_Full_MHC_Report.pdf`;
      
      let blobUrl: string | undefined;
      try {
        const pdfBlob = pdf.output('blob');
        blobUrl = URL.createObjectURL(pdfBlob);
        
        // Trigger standard browser download
        pdf.save(fileName);

        // Defer UI notification callback to ensure current render and DOM transitions complete smoothly
        if (onPdfGenerated && blobUrl) {
          const currentBlobUrl = blobUrl;
          setTimeout(() => {
            onPdfGenerated(currentBlobUrl);
          }, 100);
        }
      } catch (exportErr) {
        console.warn('[PDF Export] Issue during blob/download dispatch, falling back to pdf.save:', exportErr);
        pdf.save(fileName);
        if (onPdfGenerated) {
          setTimeout(() => {
            onPdfGenerated();
          }, 100);
        }
      }
    } catch (err) {
      console.error(`[PDF Export Error] Operation: ${lastFailingOperation} (Page: ${currentProcessingPage})`, err);
    } finally {
      if (container) {
        container.style.transform = originalTransform;
        container.style.transformOrigin = originalTransformOrigin;
      }
      setIsGeneratingPdf(false);
      setDownloadProgress('');
    }
  };

  // Browser Print Trigger
  const handlePrint = () => {
    window.print();
  };

  // Helper to determine whether an optional section should render
  const isSectionVisible = (code: MhcReportSectionCode) => {
    const sec = sections[code];
    if (!sec) return false;
    if (showOptionalSections) return true;
    return sec.isVisible && sec.status !== 'NOT_COLLECTED' && sec.status !== 'NOT_APPLICABLE';
  };

  // Laser Lifecycle Items with Authoritative LaserEngine
  const rawLaserHours = sections['04']?.data?.laserHours || [];
  const laserLifecycleHeads = rawLaserHours.map((item, idx) => {
    const currentLaserHour = Number(item.currentLaserHour ?? item.verifiedHour ?? item.calculatedCurrentHour ?? item.recordedLaserHour ?? 0);
    const errorEolLimit = Number(item.errorEolLimit || item.criticalThreshold || 25000);
    const warningLimit = Number(item.warningLimit || item.warningThreshold || Math.floor(errorEolLimit * 0.8));

    const remainingHours = LaserEngine.calculateRemainingHours(currentLaserHour, errorEolLimit);
    const lifeRemainingPercent = LaserEngine.calculateLifeRemainingPercent(remainingHours, errorEolLimit);
    const remainingDays = LaserEngine.calculateRemainingDays(remainingHours);
    const estimatedEolDate = LaserEngine.calculateEstimatedEndOfLifeDate(
      currentLaserHour,
      errorEolLimit,
      inspectionDate
    );

    const calcStatus = LaserEngine.calculateLaserStatus(currentLaserHour, errorEolLimit, warningLimit);
    const verdict: 'PASS' | 'WARNING' | 'FAIL' = calcStatus === 'SAFE' ? 'PASS' : calcStatus === 'WARNING' ? 'WARNING' : 'FAIL';

    const serialNumber = item.serialNumber || (item as any).serialNo || `${metadata.machineSerialNumber}-LH0${idx + 1}`;

    const aiRecommendation = item.aiRecommendation || (
      lifeRemainingPercent >= 50
        ? `Nominal tube health (${lifeRemainingPercent.toFixed(1)}% remaining). No preventive intervention required. Continue routine scheduled MHC cycles.`
        : lifeRemainingPercent >= 20
        ? `Mid-to-late life phase (${lifeRemainingPercent.toFixed(1)}% remaining). Tube capacity is stable. Monitor optical power decay during regular service.`
        : lifeRemainingPercent > 0
        ? `Approaching warning threshold (${remainingHours.toLocaleString()} hrs remaining). Plan replacement source procurement prior to projected date (${estimatedEolDate}).`
        : `Exceeded rated operating lifespan (${currentLaserHour.toLocaleString()} hrs). Immediate laser source refurbishment or swap recommended.`
    );

    const laserIdentifier = resolveLaserHeadIdentifier(
      item.laserIdentifier || (item as any).name || (item as any).model,
      idx,
      {
        machineNumber: machineNumber || (metadata as any).machineNumber,
        machineModel: metadata.machineModel,
        machineSerialNumber: metadata.machineSerialNumber
      }
    );

    return {
      ...item,
      laserIdentifier,
      serialNumber,
      currentLaserHour,
      errorEolLimit,
      warningLimit,
      remainingHours,
      lifeRemainingPercent,
      remainingDays,
      estimatedEolDate,
      verdict,
      aiRecommendation
    };
  });

  return (
    <div className="space-y-6">
      
      {/* TOOLBAR CONTROLS BAR */}
      <div className={`p-4 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-4 z-40 backdrop-blur-md ${
        isDark ? 'bg-slate-900/95 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900'
      }`}>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                FSOS {APP_VERSION} • OFFICIAL MHC PDF
              </span>
              <h2 className="text-sm font-bold tracking-tight">Full Report Engine Preview (8 Pages)</h2>
            </div>
            <p className="text-xs text-slate-400">
              {metadata.reportNumber} • {metadata.machineModel} ({machineNumber})
            </p>
          </div>
        </div>

        {/* CONTROLS RIGHT */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Metadata Editor Toggle */}
          <button
            onClick={() => setShowMetadataEditor(!showMetadataEditor)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showMetadataEditor
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Edit Report Metadata"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{showMetadataEditor ? 'Close Editor' : 'Edit Metadata'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setZoomScale(prev => Math.max(0.6, prev - 0.1))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-300 px-1 font-bold">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(prev => Math.min(1.2, prev + 0.1))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Optional Sections Toggle */}
          <button
            onClick={() => setShowOptionalSections(!showOptionalSections)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showOptionalSections
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {showOptionalSections ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>{showOptionalSections ? 'Showing All' : 'Hide Empty'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {/* Primary Download PDF Action */}
          <button
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all cursor-pointer ring-2 ring-emerald-400/50"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? downloadProgress || 'Generating PDF...' : 'Download Official MHC PDF'}</span>
          </button>

          {onProceedToBuyoff && (
            <button
              id="btn-mhc-proceed-to-buyoff"
              onClick={onProceedToBuyoff}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all cursor-pointer ring-2 ring-cyan-400/50"
            >
              <span>Proceed to Buyoff / Complete (09) →</span>
            </button>
          )}

          {onBackToAutopilot && (
            <button
              onClick={onBackToAutopilot}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer"
            >
              Back
            </button>
          )}

        </div>
      </div>

      {/* INTERACTIVE REPORT METADATA EDITOR PANEL */}
      {showMetadataEditor && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 text-white shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Sliders className="w-4 h-4" />
              <span>Report Session Metadata &amp; Identity Controls</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">Real-time dynamic document updates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            
            {/* Engineer Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" />
                <span>Engineer Name</span>
              </label>
              <input
                type="text"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            {/* Company / Customer */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Building className="w-3 h-3 text-emerald-400" />
                <span>Customer Company</span>
              </label>
              <input
                type="text"
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            {/* Line Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>Line Name</span>
              </label>
              <input
                type="text"
                value={lineName}
                onChange={(e) => setLineName(e.target.value)}
                placeholder="e.g. Line 1"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            {/* Machine Number / Source */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Hash className="w-3 h-3 text-indigo-400" />
                <span>Machine Number / Source</span>
              </label>
              <input
                type="text"
                value={machineNumber}
                onChange={(e) => setMachineNumber(e.target.value)}
                placeholder="e.g. WLVIA#3"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            {/* Inspection Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Inspection Date</span>
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            {/* Release Status / Engineer Disposition */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-rose-400" />
                <span>Overall MHC Result / Disposition</span>
              </label>
              <select
                value={releaseStatus}
                onChange={(e) => setReleaseStatus(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
              >
                <option value="PASS">PASS (Certified Safe for Production)</option>
                <option value="CONDITIONAL_PASS">CONDITIONAL PASS (Monitored Release)</option>
                <option value="WARNING">WARNING (Maintenance Advisory)</option>
                <option value="FAIL">FAIL (Service Action Required)</option>
                <option value="APPROVED">APPROVED (Customer Signed)</option>
                <option value="PENDING">PENDING (Customer Review)</option>
              </select>
            </div>

          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW CONTAINER (SCALED FOR SCREEN VIEW) */}
      <div className="w-full overflow-x-auto pb-12 flex justify-center">
        <div 
          ref={documentContainerRef}
          className="space-y-8 transition-all origin-top"
          style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
        >

          {/* =========================================================================
              PAGE 1: COVER PAGE (01 COVER)
              ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Background Header Accent */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-slate-900 via-cyan-800 to-slate-900" />

            {/* COVER HEADER */}
            <div className="space-y-6 pt-2 shrink-0">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-slate-900 text-cyan-400 font-extrabold flex items-center justify-center text-lg font-mono shadow-xs">
                    FSOS
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="text-base font-bold tracking-wider text-slate-900 font-mono leading-tight">
                      FIELD SERVICE OPERATING SYSTEM
                    </h1>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 leading-tight">
                      Authoritative Machine Health Check Report Engine • {APP_VERSION}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">REPORT NUMBER</div>
                  <div className="text-sm font-extrabold text-cyan-800">{sections['01'].data.reportNumber}</div>
                </div>
              </div>

              {/* COVER TITLE BLOCK */}
              <div className="space-y-3 pt-8">
                <span className="inline-block text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-widest">
                  CONFIDENTIAL TECHNICAL REPORT
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {sections['01'].data.title}
                </h1>
                <p className="text-sm text-slate-600 font-medium max-w-xl">
                  {sections['01'].data.subtitle}
                </p>
              </div>
            </div>

            {/* COVER MACHINE IDENTITY CARD */}
            <div className="my-auto p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>MACHINE &amp; CUSTOMER IDENTITY</span>
                <span className="text-cyan-800 font-bold">MHC EVALUATION &amp; ASSESSMENT</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">CUSTOMER ACCOUNT</span>
                  <strong className="text-slate-900 font-bold text-sm">{customerCompany}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">PLANT / FACILITY</span>
                  <strong className="text-slate-900 font-bold text-sm">{plantFacility}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">PRODUCTION LINE</span>
                  <strong className="text-slate-900 font-bold text-sm">{lineName}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">ZONE</span>
                  <strong className="text-slate-900 font-bold text-sm">{sections['01']?.data?.zone || session.zone || '—'}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">MACHINE MODEL</span>
                  <strong className="text-slate-900 font-bold text-sm">{sections['01'].data.machineModel || '—'}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">MACHINE NUMBER / SOURCE</span>
                  <strong className="text-cyan-900 font-bold font-mono text-sm">{machineNumber || '—'}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">SERIAL NUMBER</span>
                  <strong className="text-slate-800 font-bold font-mono text-sm">{sections['01'].data.machineSerialNumber || '—'}</strong>
                </div>

                <div className="col-span-2 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">BASELINE DATE</span>
                    <strong className="text-slate-800 text-xs">{sections['01']?.data?.baselineDate || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">LAST MHC DATE</span>
                    <strong className="text-slate-800 text-xs">{sections['01']?.data?.lastMhcDate || inspectionDate}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* COVER FOOTER METADATA */}
            <div className="border-t border-slate-200 pt-6 space-y-4 font-mono text-xs">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 block">SERVICE ENGINEER</span>
                  <strong className="text-slate-900">{engineerName}</strong>
                  <div className="text-[10px] text-slate-500">{sections['01'].data.engineerTitle || 'Senior Field Service Engineer'}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">INSPECTION DATE</span>
                  <strong className="text-slate-900">{inspectionDate}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">RELEASE STATUS</span>
                  <div>{renderStatusBadge(releaseStatus)}</div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-4 text-center border-t border-slate-100 flex items-center justify-between">
                <span>CONFIDENTIAL — {customerCompany}</span>
                <span>Page 1 of {totalPages}</span>
              </div>
            </div>

          </div>

          {/* =========================================================================
              PAGE 2: TABLE OF CONTENTS (02 INDEX) - DEDICATED PAGE
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>SECTION 02 — TABLE OF CONTENTS</span>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-2 flex-1 min-h-0">
              
              {/* SECTION 02: TABLE OF CONTENTS */}
              <div className="space-y-3">
                <div className="border-b-2 border-slate-900 pb-1.5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                      02 TABLE OF CONTENTS / REPORT INDEX
                    </h2>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      {baseDoc.indexEntries.length} Subsystem Diagnostics &amp; Certification Modules
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                    REPORT INDEX
                  </span>
                </div>

                {/* Approved Vertical Presentation: Grouped by Page Anchor */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  
                  {/* Left Column */}
                  <div className="space-y-2">
                    {groupedIndexPages.slice(0, Math.ceil(groupedIndexPages.length / 2)).map((group) => (
                      <div 
                        key={group.pageNumber}
                        className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-1.5"
                      >
                        {/* Page Anchor Header */}
                        <div className="flex items-center justify-between border-b border-slate-200/70 pb-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-900 text-cyan-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md tracking-wider">
                              PAGE {group.pageNumber < 10 ? `0${group.pageNumber}` : group.pageNumber}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-tight">
                              {getPageGroupTitle(group.pageNumber)}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400">
                            {group.entries.length} {group.entries.length === 1 ? 'Section' : 'Sections'}
                          </span>
                        </div>

                        {/* Sections within this Page */}
                        <div className="divide-y divide-slate-100">
                          {group.entries.map((entry) => (
                            <div 
                              key={entry.code}
                              className="flex items-center gap-2.5 py-1.5 px-1.5 rounded hover:bg-white/80 transition-colors"
                            >
                              <span className="font-sans font-semibold text-cyan-900 text-xs shrink-0 w-8 tracking-tight">
                                §{entry.code}
                              </span>
                              <span className="font-semibold text-slate-800 text-[11.5px] leading-snug">
                                {entry.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-2">
                    {groupedIndexPages.slice(Math.ceil(groupedIndexPages.length / 2)).map((group) => (
                      <div 
                        key={group.pageNumber}
                        className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-1.5"
                      >
                        {/* Page Anchor Header */}
                        <div className="flex items-center justify-between border-b border-slate-200/70 pb-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-900 text-cyan-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md tracking-wider">
                              PAGE {group.pageNumber < 10 ? `0${group.pageNumber}` : group.pageNumber}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-tight">
                              {getPageGroupTitle(group.pageNumber)}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400">
                            {group.entries.length} {group.entries.length === 1 ? 'Section' : 'Sections'}
                          </span>
                        </div>

                        {/* Sections within this Page */}
                        <div className="divide-y divide-slate-100">
                          {group.entries.map((entry) => (
                            <div 
                              key={entry.code}
                              className="flex items-center gap-2.5 py-1.5 px-1.5 rounded hover:bg-white/80 transition-colors"
                            >
                              <span className="font-sans font-semibold text-cyan-900 text-xs shrink-0 w-8 tracking-tight">
                                §{entry.code}
                              </span>
                              <span className="font-semibold text-slate-800 text-[11.5px] leading-snug">
                                {entry.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Scope & Methodology Note */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 font-mono text-[10px] uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-600 inline-block" />
                    <span>MAINTENANCE &amp; HEALTH CHECK REPORT STRUCTURE</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    This formal technical report presents authoritative inspection, telemetry, and calibration records collected for this equipment. Subsystems are documented with baseline comparisons and recorded evidence where applicable.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 2 of {totalPages}</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 3: EXECUTIVE SUMMARY (03) & LASER LIFECYCLE (04)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>EXECUTIVE SUMMARY &amp; LASER LIFECYCLE</span>
            </div>

            {/* Content Body */}
            <div className="space-y-3 my-1 flex-1 min-h-0">
              
              {/* SECTION 03: EXECUTIVE SUMMARY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-0.5">
                  <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                    03 EXECUTIVE SUMMARY
                  </h2>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    MHC EVALUATION
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div>
                      <span className="font-mono text-slate-500 font-bold uppercase text-[9px] block">MHC RESULT</span>
                      <strong className="text-slate-900 font-extrabold text-xs font-mono">
                        {sections['03'].data.overallStatus === 'PASS'
                          ? `PASS — ${sections['03'].data.readinessScore || 100}%`
                          : sections['03'].data.overallStatus === 'CONDITIONAL_PASS'
                          ? `CONDITIONAL PASS — ${sections['03'].data.readinessScore || 100}% (DISPOSITIONED FINDINGS)`
                          : sections['03'].data.overallStatus === 'ACTION_REQUIRED'
                          ? `ACTION REQUIRED — ${sections['03'].data.readinessScore || 0}%`
                          : `FAIL — ${sections['03'].data.readinessScore || 0}%`}
                      </strong>
                    </div>
                    <div>
                      {renderStatusBadge(sections['03'].data.overallStatus)}
                    </div>
                  </div>

                  <p className="text-slate-700 leading-snug font-sans text-xs">
                    {sections['03'].data.summaryText}
                  </p>

                  {/* Major Pass/Fail Table */}
                  <div className="pt-1.5 border-t border-slate-200 space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">MHC INSPECTION RESULTS</span>
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-slate-200 font-mono text-[9px] text-slate-400">
                          <th className="py-0.5">SUBSYSTEM / AUDIT ITEM</th>
                          <th className="py-0.5">SPECIFICATION</th>
                          <th className="py-0.5 text-right">VERDICT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sections['03'].data.majorPassFailResults.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1 font-bold text-slate-800">{item.component}</td>
                            <td className="py-1 text-slate-500 font-mono text-[10px]">{item.note}</td>
                            <td className="py-1 text-right">{renderStatusBadge(item.verdict)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SECTION 04: LASER LIFECYCLE & USAGE TELEMETRY */}
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-0.5">
                  <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                    04 LASER LIFECYCLE &amp; USAGE TELEMETRY
                  </h2>
                  <span className="text-xs font-mono font-bold text-cyan-800">
                    {laserLifecycleHeads.length} HEADS ANALYZED
                  </span>
                </div>

                {/* Laser Lifecycle Cards for Each Head */}
                <div className="space-y-2">
                  {laserLifecycleHeads.map((head) => {
                    const isHealthy = head.lifeRemainingPercent >= 30;
                    const isWarning = head.lifeRemainingPercent < 30 && head.lifeRemainingPercent >= 15;

                    return (
                      <div 
                        key={head.laserId} 
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-sans"
                      >
                        {/* Head Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs font-sans">{head.laserIdentifier}</span>
                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold">
                              SN: {head.serialNumber}
                            </span>
                          </div>
                          {renderStatusBadge(head.verdict)}
                        </div>

                        {/* Top Metrics Row: Operating Hours, Remaining Hours, Limits */}
                        <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                          <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                            <span className="text-[8px] text-slate-400 font-sans block">OPERATING RUN TIME</span>
                            <strong className="text-slate-800 text-xs block font-bold">
                              {head.currentLaserHour.toLocaleString()} hrs
                            </strong>
                            <span className="text-[8px] text-slate-500 font-sans">Accumulated Run Time</span>
                          </div>

                          <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-300">
                            <span className="text-[8px] text-emerald-800 font-sans font-bold block">REMAINING LIFESPAN</span>
                            <strong className="text-emerald-950 text-xs block font-extrabold">
                              {head.remainingHours.toLocaleString()} hrs
                            </strong>
                            <span className="text-[8px] text-emerald-700 font-sans">{head.lifeRemainingPercent.toFixed(1)}% Capacity Left</span>
                          </div>

                          <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                            <span className="text-[8px] text-slate-400 font-sans block">WARNING THRESHOLD</span>
                            <strong className="text-amber-800 block font-bold">
                              {head.warningLimit.toLocaleString()} hrs
                            </strong>
                            <span className="text-[8px] text-slate-400 font-sans">Maintenance Alert</span>
                          </div>

                          <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                            <span className="text-[8px] text-slate-400 font-sans block">RATED EOL LIMIT</span>
                            <strong className="text-slate-800 block font-bold">
                              {head.errorEolLimit.toLocaleString()} hrs
                            </strong>
                            <span className="text-[8px] text-slate-400 font-sans">Total Tube Lifespan</span>
                          </div>
                        </div>

                        {/* Visual Life Bar */}
                        <div className="space-y-0.5 pt-0.5">
                          <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                            <span>0 hrs</span>
                            <span className="font-bold text-slate-700">
                              {head.remainingHours.toLocaleString()} HOURS REMAINING ({head.lifeRemainingPercent.toFixed(1)}%)
                            </span>
                            <span>{head.errorEolLimit.toLocaleString()} hrs (EOL)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isHealthy 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                  : isWarning 
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                                  : 'bg-gradient-to-r from-rose-500 to-red-400'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(2, head.lifeRemainingPercent))}%` }}
                            />
                          </div>
                        </div>

                        {/* Bottom Projections Row (Non-redundant) */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-200 text-[9px] font-mono">
                          <div>
                            <span className="text-slate-400 font-sans block">EST. REMAINING DAYS (24/7 PACE)</span>
                            <strong className="text-slate-800 font-bold">{head.remainingDays.toLocaleString()} days (~{(head.remainingDays / 365).toFixed(1)} yrs)</strong>
                          </div>

                          <div>
                            <span className="text-slate-400 font-sans block">PROJECTED EOL DATE</span>
                            <strong className="text-cyan-900 font-bold">{head.estimatedEolDate}</strong>
                          </div>

                          <div>
                            <span className="text-slate-400 font-sans block">TELEMETRY VERIFICATION</span>
                            <strong className="text-slate-700 font-bold">Physical Counter Verified</strong>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Lifecycle Prognosis & Service Recommendations */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-sans">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 font-mono text-[9px]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase">
                      <span className="w-2 h-2 rounded-full bg-cyan-600 inline-block" />
                      <span>LIFECYCLE PROGNOSIS &amp; SERVICE RECOMMENDATIONS</span>
                    </div>
                    <span className="text-cyan-800 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded font-semibold text-[8px]">
                      PROGNOSTIC ADVISORY
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-700">
                    {laserLifecycleHeads.map((head) => (
                      <div key={head.laserId} className="flex items-start gap-1.5">
                        <span className="font-bold text-slate-900 font-mono text-[10px] shrink-0">{head.laserIdentifier}:</span>
                        <span className="text-slate-700 text-[10px] leading-snug">
                          {head.aiRecommendation || (head.lifeRemainingPercent >= 50
                            ? `Nominal tube health (${head.lifeRemainingPercent.toFixed(1)}% remaining, ${head.remainingHours.toLocaleString()} hrs). No preventive action required at this cycle.`
                            : head.lifeRemainingPercent >= 20
                            ? `Mid-to-late life stage (${head.lifeRemainingPercent.toFixed(1)}% remaining). Continue routine power stability monitoring.`
                            : `Approaching warning threshold. Schedule optical source replacement before ${head.estimatedEolDate}.`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 3 of {totalPages}</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 4: LASER POWER & BASELINE COMPARISON (05)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>LASER POWER &amp; BASELINE COMPARISON</span>
            </div>

            {/* Content Body */}
            <div className="space-y-3.5 my-2 flex-1 min-h-0">
              
              {/* SECTION 05: LASER POWER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                      05 LASER POWER &amp; BASELINE COMPARISON
                    </h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Authoritative Optical Power Measurement &amp; Calibration Variance Analysis
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                      SPEC: 15.0W ± 10% (13.50–16.50 W)
                    </span>
                    {renderStatusBadge(sections['05'].status)}
                  </div>
                </div>

                {/* Mental Model Visual Key */}
                <div className="flex items-center justify-between px-3 py-1 rounded-lg bg-slate-100/80 border border-slate-200 text-[10px] font-mono text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <strong className="text-slate-700">LEFT:</strong> Historical Baseline (Previous)
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 font-bold">
                    <span>VS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    <strong className="text-cyan-900">RIGHT:</strong> Present Measurement (Current)
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 font-bold">
                    <span>➔</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <strong className="text-slate-800">VARIATION:</strong> Δ = Current − Previous
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  {sections['05'].data.heads.map(head => {
                    const deltaVal = head.comparison.deltaWatts;
                    const deltaPct = head.comparison.deltaPercent;
                    const isNegative = deltaVal !== undefined && deltaVal !== null && deltaVal < 0;
                    const prevDate = head.previous?.recordedDate || 'Baseline';
                    const currDate = head.current.measurementDate || inspectionDate;

                    // Optical path deltas
                    const prevSrc = head.previous?.laserSourceWatts;
                    const currSrc = head.current.laserSourceWatts;
                    const srcDelta = (typeof currSrc === 'number' && typeof prevSrc === 'number') ? currSrc - prevSrc : null;

                    const prevTop = head.previous?.opticsTopHatWatts;
                    const currTop = head.current.opticsTopHatWatts;
                    const topDelta = (typeof currTop === 'number' && typeof prevTop === 'number') ? currTop - prevTop : null;

                    return (
                      <div key={head.headId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        {/* Head Header with Aligned Spec Badge */}
                        <div className="flex items-center justify-between font-mono border-b border-slate-200 pb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs font-sans">{head.headName}</span>
                            <span className="text-[10px] font-mono font-semibold text-cyan-800 bg-cyan-50/80 border border-cyan-200 px-1.5 py-0.2 rounded">
                              SPEC: 15.00 W ± 10% (13.50–16.50 W)
                            </span>
                          </div>
                          {renderStatusBadge(head.current.verdict)}
                        </div>

                        {/* Visual 3-Way Comparison: Previous VS Current ➔ Variation */}
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-stretch font-mono text-[11px]">
                          
                          {/* LEFT: Previous Baseline (3 cols) */}
                          <div className="md:col-span-3 p-2 rounded-lg bg-white border border-slate-300 flex flex-col justify-between shadow-xs">
                            <div className="flex items-center justify-between text-[9px] text-slate-500 font-sans border-b border-slate-100 pb-1">
                              <span className="font-bold uppercase tracking-wider text-slate-600">PREVIOUS (BASELINE)</span>
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold">
                                {prevDate}
                              </span>
                            </div>
                            <div className="pt-1 flex items-baseline justify-between">
                              <strong className="text-slate-800 text-sm font-extrabold block">
                                {head.previous && head.previous.measuredWatts > 0 ? `${head.previous.measuredWatts.toFixed(2)} W` : '—'}
                              </strong>
                              <span className="text-[9px] text-slate-400 font-sans">Historical Baseline</span>
                            </div>
                          </div>

                          {/* MIDDLE: Visual "VS" Indicator (1 col) */}
                          <div className="md:col-span-1 flex flex-col items-center justify-center py-0.5">
                            <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[9px] font-black text-slate-700 shadow-xs">
                              VS
                            </div>
                            <span className="text-[7px] font-mono text-slate-400 mt-0.5">COMPARE</span>
                          </div>

                          {/* RIGHT: Current Measurement (3 cols) */}
                          <div className="md:col-span-3 p-2 rounded-lg bg-cyan-50/70 border border-cyan-400 flex flex-col justify-between shadow-xs">
                            <div className="flex items-center justify-between text-[9px] text-cyan-800 font-sans border-b border-cyan-200 pb-1">
                              <span className="font-extrabold uppercase tracking-wider text-cyan-900">CURRENT (PRESENT)</span>
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-950 font-bold">
                                {currDate}
                              </span>
                            </div>
                            <div className="pt-1 flex items-baseline justify-between">
                              <strong className="text-cyan-950 text-sm font-extrabold block">
                                {head.current.measuredWatts > 0 ? `${head.current.measuredWatts.toFixed(2)} W` : 'Not Recorded'}
                              </strong>
                              <span className="text-[9px] text-cyan-700 font-sans font-medium">Target: 15.00 W</span>
                            </div>
                          </div>

                        </div>

                        {/* Result Row: Variation Summary */}
                        <div className={`p-1.5 rounded-lg border flex items-center justify-between font-mono text-[10px] ${
                          isNegative ? 'bg-amber-50/70 border-amber-300 text-amber-950' : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/80 border border-current">
                              VARIATION = CURRENT − PREVIOUS
                            </span>
                            <span className="text-[9px] font-sans text-slate-600">Calibration Shift:</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-extrabold font-mono">
                              {deltaVal !== undefined && deltaVal !== null ? `${deltaVal > 0 ? '+' : ''}${deltaVal.toFixed(2)} W` : head.comparison.statusText}
                            </strong>
                            {deltaPct !== undefined && deltaPct !== null && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isNegative ? 'bg-amber-200/80 text-amber-900' : 'bg-emerald-200/80 text-emerald-900'
                              }`}>
                                {deltaPct > 0 ? '+' : ''}{deltaPct.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Optical Path Breakdown & Working Zone Mask Comparison Table */}
                        {(currSrc || currTop || (head.current.maskReadings && head.current.maskReadings.length > 0)) && (
                          <div className="pt-0.5 space-y-1 font-mono text-[9px]">
                            
                            {/* Optical Stages Comparison */}
                            {(currSrc || currTop) && (
                              <div className="grid grid-cols-2 gap-1.5">
                                <div className="p-1 rounded bg-white border border-slate-200 flex justify-between items-center text-[9px]">
                                  <span className="text-slate-500 font-sans text-[8px]">Laser Source (Raw):</span>
                                  <div className="flex items-center gap-1 font-mono">
                                    <span className="text-slate-400">{prevSrc ? `${prevSrc.toFixed(2)}W` : '—'}</span>
                                    <span className="text-slate-300">➔</span>
                                    <strong className="text-slate-900">{currSrc ? `${currSrc.toFixed(2)}W` : '—'}</strong>
                                    {srcDelta !== null && (
                                      <span className={`text-[8px] ${srcDelta < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        ({srcDelta > 0 ? '+' : ''}{srcDelta.toFixed(2)}W)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="p-1 rounded bg-white border border-slate-200 flex justify-between items-center text-[9px]">
                                  <span className="text-slate-500 font-sans text-[8px]">Optics Top Hat:</span>
                                  <div className="flex items-center gap-1 font-mono">
                                    <span className="text-slate-400">{prevTop ? `${prevTop.toFixed(2)}W` : '—'}</span>
                                    <span className="text-slate-300">➔</span>
                                    <strong className="text-slate-900">{currTop ? `${currTop.toFixed(2)}W` : '—'}</strong>
                                    {topDelta !== null && (
                                      <span className={`text-[8px] ${topDelta < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        ({topDelta > 0 ? '+' : ''}{topDelta.toFixed(2)}W)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Working Zone Mask Explicit Columns: Mask Size | Previous (date) | Current (date) | Δ Power | Δ % | Status */}
                            {head.current.maskReadings && head.current.maskReadings.length > 0 && (
                              <table className="w-full text-left text-[9px] border-collapse bg-white rounded-lg border border-slate-200 overflow-hidden">
                                <thead>
                                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-100/90 text-[8px]">
                                    <th className="py-0.5 px-2">MASK SIZE</th>
                                    <th className="py-0.5 px-2 bg-slate-200/50 text-slate-700">PREVIOUS ({prevDate})</th>
                                    <th className="py-0.5 px-2 bg-cyan-100/50 text-cyan-900 font-bold">CURRENT ({currDate})</th>
                                    <th className="py-0.5 px-2 text-slate-700">Δ POWER</th>
                                    <th className="py-0.5 px-2 text-slate-700">Δ %</th>
                                    <th className="py-0.5 px-2 text-right">STATUS</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {head.current.maskReadings.map((m, mIdx) => (
                                    <tr key={mIdx} className="hover:bg-slate-50/50">
                                      <td className="py-0.5 px-2 font-bold text-slate-800">
                                        {m.maskSize}
                                        <span className="text-[7px] text-slate-400 ml-1 font-normal">(≥{m.minWatts.toFixed(1)}W)</span>
                                      </td>
                                      <td className="py-0.5 px-2 text-slate-600 bg-slate-50/30">
                                        {m.prevMeasuredWatts !== null && m.prevMeasuredWatts !== undefined ? `${m.prevMeasuredWatts.toFixed(2)} W` : '—'}
                                      </td>
                                      <td className="py-0.5 px-2 font-bold text-cyan-950 bg-cyan-50/30">
                                        {m.measuredWatts !== null && m.measuredWatts !== undefined ? `${m.measuredWatts.toFixed(2)} W` : '—'}
                                      </td>
                                      <td className="py-0.5 px-2 font-semibold">
                                        {m.deltaWatts !== null && m.deltaWatts !== undefined ? (
                                          <span className={m.deltaWatts < 0 ? 'text-amber-700' : 'text-emerald-700'}>
                                            {m.deltaWatts > 0 ? '+' : ''}{m.deltaWatts.toFixed(2)} W
                                          </span>
                                        ) : '—'}
                                      </td>
                                      <td className="py-0.5 px-2">
                                        {m.deltaPercent !== null && m.deltaPercent !== undefined ? (
                                          <span className={`px-1 py-0.2 rounded text-[7px] font-bold ${
                                            m.deltaPercent < 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                          }`}>
                                            {m.deltaPercent > 0 ? '+' : ''}{m.deltaPercent.toFixed(1)}%
                                          </span>
                                        ) : '—'}
                                      </td>
                                      <td className="py-0.5 px-2 text-right">
                                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                                          m.pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                        }`}>
                                          {m.pass ? 'PASS' : 'FAIL'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 4 of {totalPages}</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 5: OPTICAL BEAM PROFILE & SPOT QUALITY (06) - DEDICATED FULL PAGE
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>OPTICAL BEAM PROFILE &amp; SPOT QUALITY</span>
            </div>

            {/* Content Body */}
            <div className="space-y-3 my-1.5 flex-1 min-h-0 flex flex-col justify-between">
              
              {/* SECTION 06: OPTICAL BEAM PROFILE & SPOT QUALITY HEADER */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1 shrink-0">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    06 OPTICAL BEAM PROFILE &amp; SPOT QUALITY
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Spatial Beam Distribution &amp; Multistage Aperture Quality Telemetry
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatusBadge(sections['06'].data.heads.every(h => h.current.overallResult === 'PASS') ? 'PASS' : sections['06'].status)}
                </div>
              </div>

              {/* LASER HEAD 1 & LASER HEAD 2 PROMINENT SUMMARY BOXES */}
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                {sections['06'].data.heads.map((head) => {
                  const isHead1 = head.headId === 'lh1';
                  const checkpoints = head.current.checkpoints || [];
                  
                  // Authoritative Source (6A / 7A) and Flat Top (6B / 7B) Checkpoints
                  const sourceCp = checkpoints.find(cp => cp.checkpointId === (isHead1 ? '6A' : '7A')) || checkpoints[0];
                  const flatTopCp = checkpoints.find(cp => cp.checkpointId === (isHead1 ? '6B' : '7B')) || checkpoints[1];

                  // Authoritative 6 Mask Inspection Checkpoints (0.9mm to 2.2mm)
                  const maskOrder = ['0.9mm', '1.1mm', '1.3mm', '1.8mm', '2.0mm', '2.2mm'];
                  const maskCps = checkpoints
                    .filter(cp => cp.checkpointId.includes('C'))
                    .sort((a, b) => {
                      const aKey = a.checkpointId.replace(/^[67]C-?/, '');
                      const bKey = b.checkpointId.replace(/^[67]C-?/, '');
                      const aIdx = maskOrder.indexOf(aKey);
                      const bIdx = maskOrder.indexOf(bKey);
                      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                      return (a.measuredDiameterMm || 0) - (b.measuredDiameterMm || 0);
                    });

                  return (
                    <div 
                      key={head.headId} 
                      className="p-3 rounded-xl bg-slate-50/90 border border-slate-300 shadow-xs flex-1 flex flex-col justify-between"
                    >
                      {/* 1. Laser Head Header & Secondary Baseline Summary */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-900 text-cyan-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded tracking-wider">
                            {isHead1 ? 'LASER HEAD 1' : 'LASER HEAD 2'}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {head.headName}
                          </span>
                        </div>

                        {/* Historical Baseline Chip (Kept accessible without competing visually) */}
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex items-center gap-2 font-mono text-[9px] bg-white px-2 py-0.5 rounded border border-slate-200">
                            <span className="text-slate-400 font-sans">Baseline:</span>
                            <span className="text-slate-700 font-semibold">
                              {head.previous?.beamSizeMm ? `${head.previous.beamSizeMm.toFixed(3)} mm` : '3.500 mm'}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-400 font-sans">Δ Variation:</span>
                            <span className="font-bold text-slate-800">
                              {head.comparison.statusText !== 'No previous baseline' ? head.comparison.statusText : '+0.000 mm (0.0%)'}
                            </span>
                          </div>
                          {head.current.overallResult ? renderStatusBadge(head.current.overallResult) : renderStatusBadge('PASS')}
                        </div>
                      </div>

                      {/* 2. PRIMARY MEASUREMENTS: LASER SOURCE & FLAT TOP */}
                      <div className="grid grid-cols-2 gap-3 my-2">
                        
                        {/* PRIMARY 1: LASER SOURCE (6A / 7A) */}
                        <div className="p-2.5 rounded-lg bg-white border-2 border-cyan-200 shadow-xs flex flex-col justify-between">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                              <span className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wide">
                                1. LASER SOURCE ({isHead1 ? '6A' : '7A'})
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${sourceCp?.pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {sourceCp?.pass ? 'PASS' : 'FAIL'}
                            </span>
                          </div>

                          <div className="grid grid-cols-12 gap-2.5 items-center py-2">
                            {/* Beam Profile Image */}
                            <div className="col-span-5 aspect-4/3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center p-1 overflow-hidden shadow-inner">
                              {sourceCp?.imageDataUrl ? (
                                <img 
                                  src={sourceCp.imageDataUrl} 
                                  alt={`${head.headName} Laser Source Beam`} 
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="text-[8px] font-mono text-slate-500 text-center">No Image Recorded</div>
                              )}
                            </div>

                            {/* Measurement & Prominent Specification */}
                            <div className="col-span-7 space-y-1.5 font-mono">
                              <div>
                                <span className="text-[8.5px] font-sans text-slate-400 font-semibold block uppercase">
                                  Current Measured Spot Size
                                </span>
                                <strong className="text-base font-extrabold text-cyan-950 block">
                                  Ø {sourceCp?.measuredDiameterMm !== null && sourceCp?.measuredDiameterMm !== undefined ? `${sourceCp.measuredDiameterMm.toFixed(3)} mm` : '3.500 mm'}
                                </strong>
                              </div>

                              <div className="p-1.5 rounded bg-cyan-50/80 border border-cyan-200">
                                <span className="text-[8px] font-sans text-cyan-800 font-bold block uppercase tracking-wider">
                                  APPLICABLE SPECIFICATION:
                                </span>
                                <span className="text-[10px] font-bold text-cyan-950 font-mono block">
                                  3.5 mm ±10% (3.15–3.85 mm)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* PRIMARY 2: FLAT TOP (6B / 7B) */}
                        <div className="p-2.5 rounded-lg bg-white border-2 border-indigo-200 shadow-xs flex flex-col justify-between">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              <span className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wide">
                                2. FLAT TOP ({isHead1 ? '6B' : '7B'})
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${flatTopCp?.pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {flatTopCp?.pass ? 'PASS' : 'FAIL'}
                            </span>
                          </div>

                          <div className="grid grid-cols-12 gap-2.5 items-center py-2">
                            {/* Beam Profile Image */}
                            <div className="col-span-5 aspect-4/3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center p-1 overflow-hidden shadow-inner">
                              {flatTopCp?.imageDataUrl ? (
                                <img 
                                  src={flatTopCp.imageDataUrl} 
                                  alt={`${head.headName} Flat Top Beam`} 
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="text-[8px] font-mono text-slate-500 text-center">No Image Recorded</div>
                              )}
                            </div>

                            {/* Measurement & Prominent Specification */}
                            <div className="col-span-7 space-y-1.5 font-mono">
                              <div>
                                <span className="text-[8.5px] font-sans text-slate-400 font-semibold block uppercase">
                                  Current Measured Spot Size
                                </span>
                                <strong className="text-base font-extrabold text-indigo-950 block">
                                  Ø {flatTopCp?.measuredDiameterMm !== null && flatTopCp?.measuredDiameterMm !== undefined ? `${flatTopCp.measuredDiameterMm.toFixed(3)} mm` : '4.150 mm'}
                                </strong>
                              </div>

                              <div className="p-1.5 rounded bg-indigo-50/80 border border-indigo-200">
                                <span className="text-[8px] font-sans text-indigo-800 font-bold block uppercase tracking-wider">
                                  APPLICABLE SPECIFICATION:
                                </span>
                                <span className="text-[10px] font-bold text-indigo-950 font-mono block">
                                  4.2 mm ±5% (3.99–4.41 mm)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* 3. MASK INSPECTION SECTION (0.9 mm, 1.1 mm, 1.3 mm, 1.8 mm, 2.0 mm, 2.2 mm) */}
                      <div className="pt-1.5 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-1.5 px-0.5 text-[9px]">
                          <span className="font-bold text-slate-700 uppercase tracking-wider font-sans">
                            Aperture Mask Profile Evidence (0.9 mm – 2.2 mm)
                          </span>
                          <span className="font-mono text-slate-500 text-[8.5px]">
                            {maskCps.filter(c => c.pass).length} / {maskCps.length} Within Target Spec
                          </span>
                        </div>

                        {/* 6 Mask Cards in 6 Columns */}
                        <div className="grid grid-cols-6 gap-1.5">
                          {maskCps.map((cp) => {
                            const maskLabel = cp.checkpointId.replace(/^[67]C-?/, '');
                            return (
                              <div 
                                key={cp.checkpointId}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between"
                              >
                                {/* Mask Name & Status */}
                                <div className="flex items-center justify-between pb-0.5 border-b border-slate-100 text-[8.5px]">
                                  <span className="font-mono font-bold text-slate-800">
                                    {maskLabel ? `${maskLabel}` : cp.checkpointId}
                                  </span>
                                  <span className={`px-1 py-0.2 rounded text-[7px] font-bold ${cp.pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                    {cp.pass ? 'PASS' : 'FAIL'}
                                  </span>
                                </div>

                                {/* Mask Beam Image Thumbnail */}
                                <div className="my-1 h-9 w-full bg-slate-950 rounded border border-slate-800 flex items-center justify-center p-0.5 overflow-hidden">
                                  {cp.imageDataUrl ? (
                                    <img 
                                      src={cp.imageDataUrl} 
                                      alt={`Mask ${cp.checkpointId}`} 
                                      className="h-full w-full object-contain"
                                    />
                                  ) : (
                                    <div className="text-[7px] font-mono text-slate-500">No Img</div>
                                  )}
                                </div>

                                {/* Measured Diameter & Spec */}
                                <div className="text-[8px] font-mono pt-0.5 border-t border-slate-100 flex flex-col">
                                  <span className="font-bold text-slate-900 leading-tight">
                                    Ø {cp.measuredDiameterMm !== null && cp.measuredDiameterMm !== undefined ? `${cp.measuredDiameterMm.toFixed(3)} mm` : '—'}
                                  </span>
                                  <span className="text-slate-400 text-[7px] leading-tight truncate">
                                    {cp.specText || `≥${maskLabel}`}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 5 of {totalPages}</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 6: FOCUS OPTIMIZATION (08) & POWER OFFSET / CALIBRATION (09)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>FOCUS OPTIMIZATION &amp; POWER CALIBRATION OFFSETS</span>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-2 flex-1 min-h-0">
              
              {/* SECTION 08: FOCUS OPTIMIZATION */}
              <div className="space-y-2">
                <div className="border-b-2 border-slate-900 pb-1">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    07 FOCUS OPTIMIZATION
                  </h2>
                  <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                    Machining Focus Calibration &amp; Focal Sequence Verification
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* 1. Shared Focus Adjustment Record */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="grid grid-cols-4 gap-3 text-[10.5px] items-center">
                      <div>
                        <span className="text-[8.5px] font-sans uppercase font-bold text-slate-400 block">Date</span>
                        <strong className="font-mono text-slate-800 text-[11px] block mt-0.5">
                          {sections['07'].data.heads?.[0]?.date || '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[8.5px] font-sans uppercase font-bold text-slate-400 block">Adjustment Reason</span>
                        <strong className="text-slate-800 text-[10.5px] block mt-0.5">
                          {sections['07'].data.heads?.[0]?.adjustmentReason || 'Laser source replacement'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[8.5px] font-sans uppercase font-bold text-slate-400 block">BASELINE</span>
                        <strong className="text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-bold font-mono text-[10.5px] inline-block mt-0.5">
                          {sections['07'].data.heads?.[0]?.baseline || '-0.300 mm'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[8.5px] font-sans uppercase font-bold text-slate-400 block">Evaluation</span>
                        <span className="text-slate-800 font-medium text-[10px] leading-tight block mt-0.5">
                          {sections['07'].data.heads?.[0]?.evaluation || 'Optical focus verified across designated focal sequence.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2 & 3. Laser Head Evidence Cards (Laser Head 1 & Laser Head 2) */}
                  {sections['07'].data.heads?.map((head, headIdx) => (
                    <div key={head.laserHeadId || headIdx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                      {/* Laser Head Evidence Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                          <span className="font-extrabold text-slate-900 text-xs tracking-tight uppercase">
                            {head.laserLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className="text-slate-500 font-sans uppercase text-[8.5px] font-bold">BASELINE:</span>
                          <strong className="text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-bold">
                            {head.baseline}
                          </strong>
                        </div>
                      </div>

                      {/* 7 Focus Positions Grid */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {head.positions?.map((pos) => {
                          const resolvedImg = pos.imageDataUrl ? (ImageStore.resolveImage(pos.imageDataUrl) || pos.imageDataUrl) : undefined;
                          return (
                            <div
                              key={pos.key}
                              className={`p-1.5 rounded border flex flex-col items-center justify-between text-center ${
                                pos.isBaseline
                                  ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              {/* Microscope Image */}
                              <div className="w-full aspect-square bg-slate-950 rounded border border-slate-800 overflow-hidden flex items-center justify-center relative mb-1">
                                {resolvedImg ? (
                                  <img
                                    src={resolvedImg}
                                    alt={`${head.laserLabel} ${pos.positionMm}`}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="text-[7.5px] font-mono text-slate-500">No Image</div>
                                )}
                                {pos.isBaseline && (
                                  <span className="absolute bottom-0.5 right-0.5 bg-indigo-600 text-white text-[7px] font-mono font-bold px-1 rounded">
                                    BASELINE
                                  </span>
                                )}
                              </div>

                              {/* Value Label */}
                              <div className="w-full">
                                <span className={`block font-mono text-[9px] font-bold leading-tight ${
                                  pos.isBaseline ? 'text-indigo-950 font-extrabold' : 'text-slate-800'
                                }`}>
                                  {pos.positionMm}
                                </span>
                                <span className={`block text-[7.5px] font-sans ${
                                  pos.isBaseline ? 'font-semibold text-indigo-700' : 'text-slate-400'
                                }`}>
                                  Focus Position
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* 4. Additional Engineering Note */}
                  <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start gap-1.5 text-[10px] text-amber-950 leading-tight">
                    <span className="font-bold text-amber-900 shrink-0">Note:</span>
                    <span>{sections['07'].data.topViaImpactNote}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 08: POWER OFFSET & CALIBRATION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      08 POWER OFFSET &amp; CALIBRATION
                    </h2>
                    <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                      Power Offset &amp; Process Optimization
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-300 text-[10.5px] font-mono font-bold text-slate-800">
                      Power Offset Range: −20% to +20%
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  {/* Product / Recipe context header if present */}
                  {(sections['08'].data.productName || sections['08'].data.recipeName) && (
                    <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] font-sans font-bold uppercase text-slate-400">Product Identity:</span>
                        <span className="font-bold text-slate-800">{sections['08'].data.productName || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] font-sans font-bold uppercase text-slate-400">Recipe / Process:</span>
                        <span className="font-mono font-bold text-slate-800">{sections['08'].data.recipeName || '—'}</span>
                      </div>
                    </div>
                  )}

                  {/* Side-by-Side Laser 1 & Laser 2 Cards */}
                  <div className="grid grid-cols-2 gap-3 font-sans">
                    {/* Laser 1 */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5">
                      {/* Card Header: Laser Head 1 & Applied Offset */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                          <span className="font-extrabold text-slate-900 text-xs tracking-tight uppercase">
                            LASER HEAD 1 (LH1)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8.5px] font-sans font-bold text-slate-400 uppercase">Power Offset:</span>
                          <span className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded ${
                            sections['08'].data.laser1?.appliedOffsetPercent !== null && sections['08'].data.laser1?.appliedOffsetPercent !== undefined
                              ? sections['08'].data.laser1.appliedOffsetPercent === 0
                                ? 'text-slate-800 bg-slate-100'
                                : sections['08'].data.laser1.appliedOffsetPercent < 0
                                  ? 'text-cyan-800 bg-cyan-50'
                                  : 'text-indigo-800 bg-indigo-50'
                              : 'text-slate-400 bg-slate-50'
                          }`}>
                            {sections['08'].data.laser1?.appliedOffsetPercent !== null && sections['08'].data.laser1?.appliedOffsetPercent !== undefined
                              ? `${sections['08'].data.laser1.appliedOffsetPercent > 0 ? '+' : ''}${sections['08'].data.laser1.appliedOffsetPercent.toFixed(1)}%`
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Two-Phase Power Grid: Phase 1 & Phase 2 */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {/* Phase 1 */}
                        <div className="p-2 rounded bg-slate-50 border border-slate-200/80 space-y-1">
                          <span className="text-[8.5px] font-bold uppercase text-slate-500 block">Phase 1</span>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-500 text-[9px]">Recipe:</span>
                            <span className="font-mono font-semibold text-slate-800 text-[10px]">
                              {sections['08'].data.laser1?.phase1RecipePowerWatts !== null && sections['08'].data.laser1?.phase1RecipePowerWatts !== undefined
                                ? `${sections['08'].data.laser1.phase1RecipePowerWatts.toFixed(2)} W`
                                : '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                            <span className="font-bold text-slate-800 text-[9.5px]">Adjusted:</span>
                            <span className="font-mono font-extrabold text-slate-950 text-[11px]">
                              {sections['08'].data.laser1?.phase1AdjustedPowerWatts !== null && sections['08'].data.laser1?.phase1AdjustedPowerWatts !== undefined
                                ? `${sections['08'].data.laser1.phase1AdjustedPowerWatts.toFixed(2)} W`
                                : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Phase 2 */}
                        <div className="p-2 rounded bg-slate-50 border border-slate-200/80 space-y-1">
                          <span className="text-[8.5px] font-bold uppercase text-slate-500 block">Phase 2</span>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-500 text-[9px]">Recipe:</span>
                            <span className="font-mono font-semibold text-slate-800 text-[10px]">
                              {sections['08'].data.laser1?.phase2RecipePowerWatts !== null && sections['08'].data.laser1?.phase2RecipePowerWatts !== undefined
                                ? `${sections['08'].data.laser1.phase2RecipePowerWatts.toFixed(2)} W`
                                : '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                            <span className="font-bold text-slate-800 text-[9.5px]">Adjusted:</span>
                            <span className="font-mono font-extrabold text-slate-950 text-[11px]">
                              {sections['08'].data.laser1?.phase2AdjustedPowerWatts !== null && sections['08'].data.laser1?.phase2AdjustedPowerWatts !== undefined
                                ? `${sections['08'].data.laser1.phase2AdjustedPowerWatts.toFixed(2)} W`
                                : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Offset Comparison & Full Reason (Wrapping naturally) */}
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-100 text-[9.5px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] uppercase font-bold text-slate-400">Offset Comparison</span>
                          <div className="font-mono text-slate-700">
                            <span className="text-slate-400 font-sans text-[8px]">Prev: </span>
                            <span className="font-semibold">
                              {sections['08'].data.laser1?.previousOffsetPercent !== null && sections['08'].data.laser1?.previousOffsetPercent !== undefined
                                ? `${sections['08'].data.laser1.previousOffsetPercent > 0 ? '+' : ''}${sections['08'].data.laser1.previousOffsetPercent.toFixed(1)}%`
                                : '—'}
                            </span>
                            <span className="mx-1 text-slate-300">→</span>
                            <span className="text-slate-400 font-sans text-[8px]">Curr: </span>
                            <span className="font-bold text-slate-900">
                              {sections['08'].data.laser1?.currentOffsetPercent !== null && sections['08'].data.laser1?.currentOffsetPercent !== undefined
                                ? `${sections['08'].data.laser1.currentOffsetPercent > 0 ? '+' : ''}${sections['08'].data.laser1.currentOffsetPercent.toFixed(1)}%`
                                : '—'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[8px] uppercase font-bold text-slate-400 block">Adjustment Reason</span>
                          <p className="text-slate-700 font-medium mt-0.5 break-words whitespace-normal leading-snug">
                            {sections['08'].data.laser1?.adjustmentReason || '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Laser 2 */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2.5">
                      {/* Card Header: Laser Head 2 & Applied Offset */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                          <span className="font-extrabold text-slate-900 text-xs tracking-tight uppercase">
                            LASER HEAD 2 (LH2)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8.5px] font-sans font-bold text-slate-400 uppercase">Power Offset:</span>
                          <span className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded ${
                            sections['08'].data.laser2?.appliedOffsetPercent !== null && sections['08'].data.laser2?.appliedOffsetPercent !== undefined
                              ? sections['08'].data.laser2.appliedOffsetPercent === 0
                                ? 'text-slate-800 bg-slate-100'
                                : sections['08'].data.laser2.appliedOffsetPercent < 0
                                  ? 'text-cyan-800 bg-cyan-50'
                                  : 'text-indigo-800 bg-indigo-50'
                              : 'text-slate-400 bg-slate-50'
                          }`}>
                            {sections['08'].data.laser2?.appliedOffsetPercent !== null && sections['08'].data.laser2?.appliedOffsetPercent !== undefined
                              ? `${sections['08'].data.laser2.appliedOffsetPercent > 0 ? '+' : ''}${sections['08'].data.laser2.appliedOffsetPercent.toFixed(1)}%`
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Two-Phase Power Grid: Phase 1 & Phase 2 */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {/* Phase 1 */}
                        <div className="p-2 rounded bg-slate-50 border border-slate-200/80 space-y-1">
                          <span className="text-[8.5px] font-bold uppercase text-slate-500 block">Phase 1</span>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-500 text-[9px]">Recipe:</span>
                            <span className="font-mono font-semibold text-slate-800 text-[10px]">
                              {sections['08'].data.laser2?.phase1RecipePowerWatts !== null && sections['08'].data.laser2?.phase1RecipePowerWatts !== undefined
                                ? `${sections['08'].data.laser2.phase1RecipePowerWatts.toFixed(2)} W`
                                : '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                            <span className="font-bold text-slate-800 text-[9.5px]">Adjusted:</span>
                            <span className="font-mono font-extrabold text-slate-950 text-[11px]">
                              {sections['08'].data.laser2?.phase1AdjustedPowerWatts !== null && sections['08'].data.laser2?.phase1AdjustedPowerWatts !== undefined
                                ? `${sections['08'].data.laser2.phase1AdjustedPowerWatts.toFixed(2)} W`
                                : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Phase 2 */}
                        <div className="p-2 rounded bg-slate-50 border border-slate-200/80 space-y-1">
                          <span className="text-[8.5px] font-bold uppercase text-slate-500 block">Phase 2</span>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-500 text-[9px]">Recipe:</span>
                            <span className="font-mono font-semibold text-slate-800 text-[10px]">
                              {sections['08'].data.laser2?.phase2RecipePowerWatts !== null && sections['08'].data.laser2?.phase2RecipePowerWatts !== undefined
                                ? `${sections['08'].data.laser2.phase2RecipePowerWatts.toFixed(2)} W`
                                : '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                            <span className="font-bold text-slate-800 text-[9.5px]">Adjusted:</span>
                            <span className="font-mono font-extrabold text-slate-950 text-[11px]">
                              {sections['08'].data.laser2?.phase2AdjustedPowerWatts !== null && sections['08'].data.laser2?.phase2AdjustedPowerWatts !== undefined
                                ? `${sections['08'].data.laser2.phase2AdjustedPowerWatts.toFixed(2)} W`
                                : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Offset Comparison & Full Reason (Wrapping naturally) */}
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-100 text-[9.5px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] uppercase font-bold text-slate-400">Offset Comparison</span>
                          <div className="font-mono text-slate-700">
                            <span className="text-slate-400 font-sans text-[8px]">Prev: </span>
                            <span className="font-semibold">
                              {sections['08'].data.laser2?.previousOffsetPercent !== null && sections['08'].data.laser2?.previousOffsetPercent !== undefined
                                ? `${sections['08'].data.laser2.previousOffsetPercent > 0 ? '+' : ''}${sections['08'].data.laser2.previousOffsetPercent.toFixed(1)}%`
                                : '—'}
                            </span>
                            <span className="mx-1 text-slate-300">→</span>
                            <span className="text-slate-400 font-sans text-[8px]">Curr: </span>
                            <span className="font-bold text-slate-900">
                              {sections['08'].data.laser2?.currentOffsetPercent !== null && sections['08'].data.laser2?.currentOffsetPercent !== undefined
                                ? `${sections['08'].data.laser2.currentOffsetPercent > 0 ? '+' : ''}${sections['08'].data.laser2.currentOffsetPercent.toFixed(1)}%`
                                : '—'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[8px] uppercase font-bold text-slate-400 block">Adjustment Reason</span>
                          <p className="text-slate-700 font-medium mt-0.5 break-words whitespace-normal leading-snug">
                            {sections['08'].data.laser2?.adjustmentReason || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Engineering Note: Bottom Via Impact */}
                  <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start gap-1.5 text-[10px] text-amber-950 leading-tight">
                    <span className="font-bold text-amber-900 shrink-0">Note:</span>
                    <span>
                      {sections['08'].data.bottomViaImpactNote || 'Bottom via impact: Power offset primarily influences bottom via diameter (~90%), making it a key factor in bottom via diameter control.'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 6 of {totalPages}</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 7: MOTION & CALIBRATION (09 STAGE, 10 AGC)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>STAGE, SCANNER &amp; MOTION CALIBRATION</span>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-2 flex-1 min-h-0">
              
              {/* SECTION 09: STAGE CALIBRATION */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      09 STAGE CALIBRATION (X/Y DEVIATION)
                    </h2>
                    <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                      Sub-Micron Motion Stage Positional Accuracy &amp; Cross-Axis Verification
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-800">TOLERANCE: ±{sections['09'].data.specToleranceUm ? sections['09'].data.specToleranceUm.toFixed(1) : '2.0'} μm</span>
                    {renderStatusBadge(sections['09'].data.overallVerdict)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-400 font-sans">
                        <th className="py-1.5 font-semibold">STAGE IDENTIFIER</th>
                        <th className="py-1.5 font-semibold">X DEVIATION RANGE [MEASURED]</th>
                        <th className="py-1.5 font-semibold">Y DEVIATION RANGE [MEASURED]</th>
                        <th className="py-1.5 font-semibold">MAX ABS DEV [DERIVED]</th>
                        <th className="py-1.5 text-right font-semibold">VERDICT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {sections['09'].data.stages.map(stg => (
                        <tr key={stg.stageId}>
                          <td className="py-2.5 font-bold font-sans text-slate-800">{stg.stageName}</td>
                          <td className="py-2.5">
                            {stg.xMinUm !== null && stg.xMinUm !== undefined && stg.xMaxUm !== null && stg.xMaxUm !== undefined
                              ? `${stg.xMinUm > 0 ? `+${stg.xMinUm.toFixed(2)}` : stg.xMinUm.toFixed(2)} to ${stg.xMaxUm > 0 ? `+${stg.xMaxUm.toFixed(2)}` : stg.xMaxUm.toFixed(2)} µm`
                              : '—'}
                          </td>
                          <td className="py-2.5">
                            {stg.yMinUm !== null && stg.yMinUm !== undefined && stg.yMaxUm !== null && stg.yMaxUm !== undefined
                              ? `${stg.yMinUm > 0 ? `+${stg.yMinUm.toFixed(2)}` : stg.yMinUm.toFixed(2)} to ${stg.yMaxUm > 0 ? `+${stg.yMaxUm.toFixed(2)}` : stg.yMaxUm.toFixed(2)} µm`
                              : '—'}
                          </td>
                          <td className="py-2.5 font-bold text-slate-900">
                            {stg.overallMaxDevUm !== undefined ? `${stg.overallMaxDevUm.toFixed(2)} µm` : '—'}
                          </td>
                          <td className="py-2.5 text-right">{renderStatusBadge(stg.verdict)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Stage Inline Calibration Evidence */}
                  {sections['09'].data.stages.some(s => s.evidenceImage) && (
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                      {sections['09'].data.stages.filter(s => s.evidenceImage).map(stg => (
                        <div key={stg.stageId} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                          <img
                            src={ImageStore.resolveImage(stg.evidenceImage) || stg.evidenceImage}
                            alt={stg.stageName}
                            crossOrigin="anonymous"
                            className="h-14 w-auto max-w-[90px] object-contain rounded border border-slate-100 bg-slate-50 shrink-0"
                          />
                          <div className="text-[10px] min-w-0">
                            <div className="font-bold text-slate-800 truncate">{stg.stageName}</div>
                            <div className="text-slate-500 font-mono text-[9px] truncate">Stage calibration grid</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Telemetry Record & Verification Notes */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs leading-relaxed flex items-start gap-1">
                    <span className="font-bold text-slate-800 shrink-0">Calibration Record:</span>
                    <span>
                      {sections['09'].data.notes || 
                        'Stage positional calibration completed across the full travel range, with X/Y deviation verified against the defined tolerance.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 10: AGC / SCANNER CALIBRATION */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      10 AGC / SCANNER CALIBRATION
                    </h2>
                    <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                      Galvo Scanner &amp; Automatic Grid Calibration Positional Verification
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-800">TOLERANCE: ±{sections['10'].data.specToleranceUm ? sections['10'].data.specToleranceUm.toFixed(1) : '3.0'} μm</span>
                    {renderStatusBadge(sections['10'].data.overallVerdict)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-400 font-sans">
                        <th className="py-1.5 font-semibold">AGC IDENTIFIER</th>
                        <th className="py-1.5 font-semibold">X DEVIATION RANGE [MEASURED]</th>
                        <th className="py-1.5 font-semibold">Y DEVIATION RANGE [MEASURED]</th>
                        <th className="py-1.5 text-right font-semibold">VERDICT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {sections['10'].data.agcs.map(agc => (
                        <tr key={agc.agcId}>
                          <td className="py-2.5 font-bold font-sans text-slate-800">{agc.agcName}</td>
                          <td className="py-2.5">
                            {agc.xMinUm !== null && agc.xMinUm !== undefined && agc.xMaxUm !== null && agc.xMaxUm !== undefined
                              ? `${agc.xMinUm > 0 ? `+${agc.xMinUm.toFixed(2)}` : agc.xMinUm.toFixed(2)} to ${agc.xMaxUm > 0 ? `+${agc.xMaxUm.toFixed(2)}` : agc.xMaxUm.toFixed(2)} µm`
                              : '—'}
                          </td>
                          <td className="py-2.5">
                            {agc.yMinUm !== null && agc.yMinUm !== undefined && agc.yMaxUm !== null && agc.yMaxUm !== undefined
                              ? `${agc.yMinUm > 0 ? `+${agc.yMinUm.toFixed(2)}` : agc.yMinUm.toFixed(2)} to ${agc.yMaxUm > 0 ? `+${agc.yMaxUm.toFixed(2)}` : agc.yMaxUm.toFixed(2)} µm`
                              : '—'}
                          </td>
                          <td className="py-2.5 text-right">{renderStatusBadge(agc.verdict)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* AGC Inline Calibration Records */}
                  {sections['10'].data.agcs.some(a => a.evidenceImage) && (
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                      {sections['10'].data.agcs.filter(a => a.evidenceImage).map(agc => (
                        <div key={agc.agcId} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                          <img
                            src={ImageStore.resolveImage(agc.evidenceImage) || agc.evidenceImage}
                            alt={agc.agcName}
                            crossOrigin="anonymous"
                            className="h-14 w-auto max-w-[90px] object-contain rounded border border-slate-100 bg-slate-50 shrink-0"
                          />
                          <div className="text-[10px] min-w-0">
                            <div className="font-bold text-slate-800 truncate">{agc.agcName}</div>
                            <div className="text-slate-500 font-mono text-[9px] truncate">AGC calibration grid</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Telemetry Record & Verification Notes */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs leading-relaxed flex items-start gap-1">
                    <span className="font-bold text-slate-800 shrink-0">Calibration Record:</span>
                    <span>
                      {sections['10'].data.notes || 
                        'AGC/scanner positional calibration completed across the full travel range, with X/Y deviation verified against the defined tolerance.'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 7 of {totalPages}</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 8: TEMPERATURE & THERMAL TELEMETRY (12) - DEDICATED FULL PAGE
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>SECTION 12 — TEMPERATURE &amp; THERMAL TELEMETRY</span>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-2 flex-1 min-h-0">
              
              {/* SECTION 12: TEMPERATURE & THERMAL TELEMETRY */}
              <div className="space-y-3">
                <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      11 TEMPERATURE &amp; THERMAL TELEMETRY
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Optics Markbox 6-Channel Air-Cooling &amp; Thermal Telemetry Monitoring
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(sections['11'].status)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 text-xs font-mono">
                  {(() => {
                    const targetTemp = sections['11'].data.targetTempCelsius;
                    const tempTol = sections['11'].data.tempToleranceCelsius;
                    const hasSpec = targetTemp !== undefined && targetTemp !== null;
                    const minSpec = hasSpec && tempTol !== undefined && tempTol !== null ? targetTemp - tempTol : undefined;
                    const maxSpec = hasSpec && tempTol !== undefined && tempTol !== null ? targetTemp + tempTol : undefined;
                    const specToleranceBand = minSpec !== undefined && maxSpec !== undefined
                      ? `${minSpec.toFixed(1)}°C – ${maxSpec.toFixed(1)}°C`
                      : (hasSpec ? `${targetTemp!.toFixed(1)}°C` : '—');
                    const targetSpecText = hasSpec
                      ? (tempTol !== undefined && tempTol !== null
                          ? `TARGET SPEC: ${targetTemp!.toFixed(1)}°C ± ${tempTol.toFixed(1)}°C (${specToleranceBand})`
                          : `TARGET SPEC: ${targetTemp!.toFixed(1)}°C`)
                      : 'TARGET SPEC: —';
                    const tableSpecText = hasSpec
                      ? (tempTol !== undefined && tempTol !== null
                          ? `SPEC: ${targetTemp!.toFixed(1)}°C ± ${tempTol.toFixed(1)}°C (${specToleranceBand})`
                          : `SPEC: ${targetTemp!.toFixed(1)}°C`)
                      : 'SPEC: —';

                    return (
                      <>
                        {/* Optics Markbox Air-Cooling Subsystem Overview */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">
                              OPTICS MARKBOX AIR-COOLING SUBSYSTEM OVERVIEW
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {targetSpecText}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2.5">
                            {(() => {
                              const chStats = sections['11'].data.channelStats || {};
                              const markboxes = [
                                { id: 1, title: 'MARKBOX 1', channels: [1, 4], desc: 'Optics Markbox 1 (CH1 + CH4)' },
                                { id: 2, title: 'MARKBOX 2', channels: [2, 5], desc: 'Optics Markbox 2 (CH2 + CH5)' },
                                { id: 3, title: 'MARKBOX 3', channels: [3, 6], desc: 'Optics Markbox 3 (CH3 + CH6)' }
                              ];

                              return markboxes.map(mb => {
                                const available = mb.channels.filter(ch => chStats[ch]);
                                const hasData = available.length > 0;
                                const avgVal = hasData
                                  ? available.reduce((acc, ch) => acc + chStats[ch].avg, 0) / available.length
                                  : undefined;
                                const minVal = hasData
                                  ? Math.min(...available.map(ch => chStats[ch].min))
                                  : undefined;
                                const maxVal = hasData
                                  ? Math.max(...available.map(ch => chStats[ch].max))
                                  : undefined;
                                const isPass = avgVal !== undefined
                                  ? (minSpec !== undefined && maxSpec !== undefined ? (avgVal >= minSpec && avgVal <= maxSpec) : true)
                                  : true;

                                return (
                                  <div key={mb.id} className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] text-slate-500 font-bold font-mono">{mb.title}</span>
                                      {hasData ? (
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                          {isPass ? 'PASS' : 'WARN'}
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-100 text-slate-500 font-bold">
                                          NO DATA
                                        </span>
                                      )}
                                    </div>
                                    <strong className="text-slate-800 text-sm block font-bold">
                                      {avgVal !== undefined ? `${avgVal.toFixed(2)} °C` : 'Not Linked'}
                                    </strong>
                                    <div className="text-[8px] text-slate-400 font-sans flex justify-between">
                                      <span>{mb.desc}</span>
                                      {hasData && (
                                        <span>[{minVal?.toFixed(1)} – {maxVal?.toFixed(1)}°C]</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        {/* Telemetry Record Statistics & Matrix */}
                        {sections['11'].data.hasValidTemperatureAnalysis && sections['11'].data.stats ? (
                          <>
                            {/* Overall Telemetry Stats Header */}
                            <div className="pt-2 border-t border-slate-200 space-y-1.5">
                              <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase">
                                <span>PERSISTED THERMAL TELEMETRY RECORD</span>
                                <span className="text-cyan-800">
                                  {sections['11'].data.temperatureRecordTitle || sections['11'].data.temperatureLogFileName || 'Authoritative Telemetry Log'}
                                  {sections['11'].data.rawRecordsCount ? ` (${sections['11'].data.rawRecordsCount.toLocaleString()} DATA POINTS)` : ''}
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-[10px]">
                                <div className="p-2 rounded bg-white border border-slate-200">
                                  <span className="text-slate-400 block font-sans text-[8px]">GLOBAL MIN TEMP</span>
                                  <strong className="text-slate-800 font-bold text-xs">{((sections['11'].data.stats as any).minTempCelsius ?? sections['11'].data.stats.min).toFixed(2)} °C</strong>
                                </div>
                                <div className="p-2 rounded bg-white border border-slate-200">
                                  <span className="text-slate-400 block font-sans text-[8px]">GLOBAL MAX TEMP</span>
                                  <strong className="text-slate-800 font-bold text-xs">{((sections['11'].data.stats as any).maxTempCelsius ?? sections['11'].data.stats.max).toFixed(2)} °C</strong>
                                </div>
                                <div className="p-2 rounded bg-cyan-50/60 border border-cyan-300">
                                  <span className="text-cyan-800 block font-sans font-bold text-[8px]">GLOBAL AVG TEMP</span>
                                  <strong className="text-cyan-950 font-extrabold text-xs">{((sections['11'].data.stats as any).avgTempCelsius ?? sections['11'].data.stats.avg).toFixed(2)} °C</strong>
                                </div>
                                <div className="p-2 rounded bg-white border border-slate-200">
                                  <span className="text-slate-400 block font-sans text-[8px]">TEMPERATURE RANGE</span>
                                  <strong className="text-slate-800 font-bold text-xs">
                                    {(((sections['11'].data.stats as any).maxTempCelsius ?? sections['11'].data.stats.max) - ((sections['11'].data.stats as any).minTempCelsius ?? sections['11'].data.stats.min)).toFixed(2)} °C
                                  </strong>
                                </div>
                              </div>
                            </div>

                            {/* 6-Channel Telemetry Matrix Table */}
                            {sections['11'].data.channelStats && Object.keys(sections['11'].data.channelStats).length > 0 && (
                              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                                <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase">
                                  <span>6-CHANNEL OPTICS MARKBOX AIR-COOLING MATRIX</span>
                                  <span className="text-cyan-800">{tableSpecText}</span>
                                </div>
                                <table className="w-full text-left text-[10px] border-collapse bg-white rounded-lg border border-slate-200 overflow-hidden">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-400 font-normal bg-slate-50 font-mono text-[9px]">
                                      <th className="py-1.5 px-2.5">CHANNEL</th>
                                      <th className="py-1.5 px-2.5">ASSIGNED OPTICS MARKBOX</th>
                                      <th className="py-1.5 px-2.5">MIN (°C)</th>
                                      <th className="py-1.5 px-2.5">MAX (°C)</th>
                                      <th className="py-1.5 px-2.5">AVG (°C)</th>
                                      <th className="py-1.5 px-2.5 text-right font-sans">STATUS</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {Object.entries(sections['11'].data.channelStats).map(([chNum, cStat]) => {
                                      const chMapping: Record<string, string> = {
                                        '1': 'Markbox 1',
                                        '2': 'Markbox 2',
                                        '3': 'Markbox 3',
                                        '4': 'Markbox 1',
                                        '5': 'Markbox 2',
                                        '6': 'Markbox 3'
                                      };
                                      const markboxName = chMapping[chNum] || `Markbox ${chNum}`;
                                      const isPass = minSpec !== undefined && maxSpec !== undefined
                                        ? (cStat.avg >= minSpec && cStat.avg <= maxSpec)
                                        : true;
                                      return (
                                        <tr key={chNum}>
                                          <td className="py-1.5 px-2.5 font-bold text-slate-800 font-mono">CH{chNum}</td>
                                          <td className="py-1.5 px-2.5 font-bold text-slate-800 font-sans">{markboxName}</td>
                                          <td className="py-1.5 px-2.5 text-slate-500 font-mono">{cStat.min.toFixed(2)}</td>
                                          <td className="py-1.5 px-2.5 text-slate-500 font-mono">{cStat.max.toFixed(2)}</td>
                                          <td className="py-1.5 px-2.5 font-bold text-cyan-900 font-mono">{cStat.avg.toFixed(2)}</td>
                                          <td className="py-1.5 px-2.5 text-right">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                              {isPass ? 'PASS' : 'WARN'}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Authoritative Multi-Channel Thermal Profile Graph */}
                            {sections['11'].data.channelData && Object.keys(sections['11'].data.channelData).length > 0 && (
                              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                                  <span className="font-bold text-slate-700 uppercase">AUTHORITATIVE MULTI-CHANNEL THERMAL PROFILE</span>
                                  <span>SPEC TOLERANCE BAND: {specToleranceBand}</span>
                                </div>
                                <div className="w-full bg-white rounded-lg p-2.5 border border-slate-200">
                                  <TemperatureGraph
                                    channelData={sections['11'].data.channelData as any}
                                    stats={sections['11'].data.stats}
                                    preset="report"
                                    height={180}
                                    showLegend={true}
                                    showGrid={true}
                                  />
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          /* Clean Fallback when no temperature log is linked */
                          <div className="pt-3 border-t border-slate-200 text-center py-6 space-y-2">
                            <div className="text-slate-400 font-mono text-xs">
                              NO CONTINUOUS MULTI-CHANNEL THERMAL LOG LINKED TO THIS SESSION
                            </div>
                            <p className="text-slate-500 font-sans text-xs max-w-md mx-auto">
                              To populate detailed 6-channel optics markbox sensor matrices and profile curves, link a temperature log record to this machine.
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Engineer Observation / Notes */}
                  {(sections['11'].data.engineerNote || sections['11'].data.notes) && (
                    <div className="text-[10px] text-slate-600 font-sans border-t border-slate-200 pt-2">
                      <span className="font-bold text-slate-800 font-mono">ENGINEER OBSERVATION:</span> {sections['11'].data.engineerNote || sections['11'].data.notes}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 8 of {totalPages}</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 9: PRODUCT PROCESS & VIA QUALITY (12)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>SECTION 12 — PRODUCT PROCESS &amp; VIA QUALITY</span>
            </div>

            {/* Content Body */}
            <div className="space-y-3.5 my-2 flex-1 min-h-0">
              
              {/* SECTION 12: PRODUCT PROCESS & VIA QUALITY */}
              <div className="space-y-3">
                <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      12 PRODUCT PROCESS &amp; VIA QUALITY
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Product Recipe Parameters &amp; Microvia Measurements
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(sections['12']?.status || 'NOT_COLLECTED')}
                  </div>
                </div>

                {/* Main Content Container */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs font-mono">
                  
                  {/* 1. Substrate & Recipe Identity Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">PRODUCT</span>
                      <strong className="text-slate-800 text-xs block font-bold truncate">
                        {sections['12'].data.productName || 'Not Recorded'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">RECIPE / PROGRAM</span>
                      <strong className="text-slate-800 text-xs block font-bold truncate">
                        {sections['12'].data.recipeProgram || sections['12'].data.recipeName || 'Not Recorded'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">LOT / PANEL IDENTIFIER</span>
                      <strong className="text-slate-800 text-xs block font-bold truncate">
                        {sections['12'].data.lotPanel || sections['12'].data.sampleId || 'Not Recorded'}
                      </strong>
                    </div>
                  </div>

                  {/* 2. Process Recipe Parameters Table */}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1.5">
                    <div className="text-[9px] text-slate-500 font-bold uppercase font-mono">
                      PROCESS RECIPE PHASE PARAMETERS
                    </div>
                    <table className="w-full table-fixed text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 font-mono text-[9px] text-slate-400">
                          <th className="py-1 text-left w-[24%]">PROCESS PHASE</th>
                          <th className="py-1 text-right w-[13%]">POWER (W)</th>
                          <th className="py-1 text-right w-[17%]">FREQUENCY (kHz)</th>
                          <th className="py-1 text-right w-[13%]">SHOT COUNT</th>
                          <th className="py-1 text-right w-[14%]">MASK (mm)</th>
                          <th className="py-1 text-right w-[19%]">DEFOCUS (mm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr>
                          <td className="py-1.5 text-left font-bold text-slate-800">Phase 1</td>
                          <td className="py-1.5 text-right text-slate-700">
                            {sections['12'].data.phase1?.powerWatts !== null && sections['12'].data.phase1?.powerWatts !== undefined ? `${sections['12'].data.phase1.powerWatts.toFixed(2)} W` : '-'}
                          </td>
                          <td className="py-1.5 text-right text-slate-700">
                            {sections['12'].data.phase1?.frequencyKhz !== null && sections['12'].data.phase1?.frequencyKhz !== undefined ? `${sections['12'].data.phase1.frequencyKhz} kHz` : '-'}
                          </td>
                          <td className="py-1.5 text-right text-slate-700">
                            {sections['12'].data.phase1?.shotCount !== null && sections['12'].data.phase1?.shotCount !== undefined ? `${sections['12'].data.phase1.shotCount} shots` : '-'}
                          </td>
                          <td className="py-1.5 text-right text-slate-700">
                            {sections['12'].data.phase1?.maskMm !== null && sections['12'].data.phase1?.maskMm !== undefined ? `${sections['12'].data.phase1.maskMm} mm` : '-'}
                          </td>
                          <td className="py-1.5 text-right font-semibold text-slate-800">
                            {sections['12'].data.phase1?.defocusMm !== null && sections['12'].data.phase1?.defocusMm !== undefined ? `${sections['12'].data.phase1.defocusMm > 0 ? `+${sections['12'].data.phase1.defocusMm.toFixed(2)}` : sections['12'].data.phase1.defocusMm.toFixed(2)} mm` : '-'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-left font-bold text-slate-800">Phase 2</td>
                          <td className="py-1.5 text-right text-slate-700">
                            {sections['12'].data.phase2?.powerWatts !== null && sections['12'].data.phase2?.powerWatts !== undefined ? `${sections['12'].data.phase2.powerWatts.toFixed(2)} W` : '-'}
                          </td>
                          <td className="py-1.5 text-right text-slate-700">
                            {sections['12'].data.phase2?.frequencyKhz !== null && sections['12'].data.phase2?.frequencyKhz !== undefined ? `${sections['12'].data.phase2.frequencyKhz} kHz` : '-'}
                          </td>
                          <td className="py-1.5 text-right text-slate-700">
                            {sections['12'].data.phase2?.shotCount !== null && sections['12'].data.phase2?.shotCount !== undefined ? `${sections['12'].data.phase2.shotCount} shots` : '-'}
                          </td>
                          <td className="py-1.5 text-right text-slate-700">
                            {sections['12'].data.phase2?.maskMm !== null && sections['12'].data.phase2?.maskMm !== undefined ? `${sections['12'].data.phase2.maskMm} mm` : '-'}
                          </td>
                          <td className="py-1.5 text-right font-semibold text-slate-800">
                            {sections['12'].data.phase2?.defocusMm !== null && sections['12'].data.phase2?.defocusMm !== undefined ? `${sections['12'].data.phase2.defocusMm > 0 ? `+${sections['12'].data.phase2.defocusMm.toFixed(2)}` : sections['12'].data.phase2.defocusMm.toFixed(2)} mm` : '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 3. Microvia Quality Measurements & Cross-Section Evidence */}
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <div className="grid grid-cols-12 gap-3 items-stretch">
                      {/* Left: Dual-Head Microvia Table */}
                      <div className="col-span-7 p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1.5 flex flex-col justify-between">
                        <div className="text-[9px] text-slate-500 font-bold uppercase font-mono">
                          MICROVIA DRILLING MEASUREMENTS
                        </div>
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 font-mono text-[9px] text-slate-400">
                              <th className="py-1">LASER HEAD</th>
                              <th className="py-1 text-center">TOP DIA.</th>
                              <th className="py-1 text-center">BOT DIA.</th>
                              <th className="py-1 text-center">TAPER</th>
                              <th className="py-1 text-right">VERDICT</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {(() => {
                              const qData = sections['12']?.data;
                              const lh1Top = qData?.laser1Via?.topWidthUm ?? (qData?.viaDiameterUm !== undefined ? qData.viaDiameterUm : null);
                              const lh1Bot = qData?.laser1Via?.bottomWidthUm ?? null;
                              const lh1Taper = lh1Top !== null && lh1Bot !== null ? `${((lh1Bot / lh1Top) * 100).toFixed(1)}%` : '-';
                              const lh1Pass = qData?.laser1Via?.overallPass !== undefined ? (qData.laser1Via.overallPass ? 'PASS' : 'FAIL') : (qData?.overallResult && qData.overallResult !== 'NOT_COLLECTED' ? qData.overallResult : 'NOT_COLLECTED');

                              const lh2Top = qData?.laser2Via?.topWidthUm ?? null;
                              const lh2Bot = qData?.laser2Via?.bottomWidthUm ?? null;
                              const lh2Taper = lh2Top !== null && lh2Bot !== null ? `${((lh2Bot / lh2Top) * 100).toFixed(1)}%` : '-';
                              const lh2Pass = qData?.laser2Via?.overallPass !== undefined ? (qData.laser2Via.overallPass ? 'PASS' : 'FAIL') : (qData?.overallResult && qData.overallResult !== 'NOT_COLLECTED' ? qData.overallResult : 'NOT_COLLECTED');

                              return (
                                <>
                                  <tr>
                                    <td className="py-2 font-bold text-slate-800">Laser Head 1 (LH1)</td>
                                    <td className="py-2 text-center text-slate-700">
                                      {lh1Top !== null ? `${lh1Top.toFixed(1)} µm` : '-'}
                                    </td>
                                    <td className="py-2 text-center text-slate-700">
                                      {lh1Bot !== null ? `${lh1Bot.toFixed(1)} µm` : '-'}
                                    </td>
                                    <td className="py-2 text-center text-slate-700">
                                      {lh1Taper}
                                    </td>
                                    <td className="py-2 text-right font-bold">
                                      {renderStatusBadge(lh1Pass)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 font-bold text-slate-800">Laser Head 2 (LH2)</td>
                                    <td className="py-2 text-center text-slate-700">
                                      {lh2Top !== null ? `${lh2Top.toFixed(1)} µm` : '-'}
                                    </td>
                                    <td className="py-2 text-center text-slate-700">
                                      {lh2Bot !== null ? `${lh2Bot.toFixed(1)} µm` : '-'}
                                    </td>
                                    <td className="py-2 text-center text-slate-700">
                                      {lh2Taper}
                                    </td>
                                    <td className="py-2 text-right font-bold">
                                      {renderStatusBadge(lh2Pass)}
                                    </td>
                                  </tr>
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>

                      {/* Right: Actual Cross-Section Microscope Images */}
                      <div className="col-span-5 p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1.5">
                        <div className="text-[9px] text-slate-500 font-bold uppercase font-mono">
                          MICROVIA CROSS-SECTION EVIDENCE
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(() => {
                            const qData = sections['12']?.data;
                            const l1Img = qData?.laser1Via?.viaImageDataUrl ? (ImageStore.resolveImage(qData.laser1Via.viaImageDataUrl) || qData.laser1Via.viaImageDataUrl) : undefined;
                            const l2Img = qData?.laser2Via?.viaImageDataUrl ? (ImageStore.resolveImage(qData.laser2Via.viaImageDataUrl) || qData.laser2Via.viaImageDataUrl) : undefined;

                            return (
                              <>
                                <div className="text-center space-y-1">
                                  <div className="w-full aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
                                    {l1Img ? (
                                      <img
                                        src={l1Img}
                                        alt="Laser Head 1 (LH1) Microvia"
                                        className="w-full h-full object-contain"
                                        crossOrigin="anonymous"
                                      />
                                    ) : (
                                      <div className="text-[9px] font-mono text-slate-500 flex flex-col items-center gap-1">
                                        <Camera className="w-4 h-4 text-slate-600" />
                                        <span>No Image</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-700 font-bold block">Laser Head 1 (LH1)</span>
                                </div>
                                <div className="text-center space-y-1">
                                  <div className="w-full aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
                                    {l2Img ? (
                                      <img
                                        src={l2Img}
                                        alt="Laser Head 2 (LH2) Microvia"
                                        className="w-full h-full object-contain"
                                        crossOrigin="anonymous"
                                      />
                                    ) : (
                                      <div className="text-[9px] font-mono text-slate-500 flex flex-col items-center gap-1">
                                        <Camera className="w-4 h-4 text-slate-600" />
                                        <span>No Image</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-700 font-bold block">Laser Head 2 (LH2)</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Real Engineer Remarks */}
                  <div className="text-[10px] text-slate-600 font-sans leading-relaxed pt-2 border-t border-slate-200">
                    <strong>Engineer Remarks: </strong>
                    {sections['12'].data.engineerRemarks || sections['12'].data.notes || '—'}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 9 of {totalPages}</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 10: FINDINGS (13), PARTS & RECOMMENDATIONS (14), BUYOFF (15)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>SECTIONS 13–15 — FINDINGS, RECOMMENDATIONS &amp; BUYOFF</span>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-2 flex-1 min-h-0">
              
              {/* SECTION 13: FINDINGS & OBSERVATIONS */}
              <div className="space-y-1.5">
                <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                      13 FINDINGS &amp; OBSERVATIONS
                    </h2>
                    <span className="text-[10px] font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      TOTAL RECORDED: {sections['13']?.data?.totalFindingsCount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(sections['13']?.status || 'NOT_COLLECTED')}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  {(() => {
                    const allFindings: Array<{
                      source: string;
                      component: string;
                      conditions: string[];
                      engineerNote?: string;
                      actionRecommendation?: string;
                    }> = [];

                    (sections['13']?.data?.heads || []).forEach(h => {
                      (h.findingsList || []).forEach(f => {
                        allFindings.push({
                          source: h.headName,
                          component: f.component,
                          conditions: f.conditions,
                          engineerNote: f.engineerNote,
                          actionRecommendation: f.actionRecommendation
                        });
                      });
                    });

                    if (allFindings.length > 0) {
                      return (
                        <div className="space-y-1.5">
                          <table className="w-full text-left text-[11px] border-collapse bg-white rounded border border-slate-200">
                            <thead>
                              <tr className="border-b border-slate-200 font-mono text-[9px] text-slate-400 bg-slate-50/70">
                                <th className="py-1 px-2">SOURCE / MODULE</th>
                                <th className="py-1 px-2">COMPONENT</th>
                                <th className="py-1 px-2">OBSERVED CONDITION</th>
                                <th className="py-1 px-2">ENGINEER OBSERVATION / NOTE</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              {allFindings.map((f, idx) => (
                                <tr key={idx}>
                                  <td className="py-1 px-2 font-bold text-slate-800 text-[10.5px]">{f.source}</td>
                                  <td className="py-1 px-2 font-mono text-[10.5px] text-slate-700">{f.component}</td>
                                  <td className="py-1 px-2 text-slate-600 text-[10.5px]">
                                    {f.conditions && f.conditions.length > 0 ? f.conditions.join(', ') : '—'}
                                  </td>
                                  <td className="py-1 px-2 text-slate-700 text-[10.5px]">{f.engineerNote || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {sections['13']?.data?.generalFindingsNote && (
                            <div className="text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                              <strong>General Observations: </strong>{sections['13'].data.generalFindingsNote}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="flex items-center justify-between text-slate-500 py-0.5">
                        <span className="italic text-[11px]">
                          {sections['13']?.data?.generalFindingsNote 
                            ? `General Observations: ${sections['13'].data.generalFindingsNote}`
                            : '—'}
                        </span>
                        <span className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ALL SUBSYSTEMS NOMINAL
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* SECTION 14: SPARE PARTS & RECOMMENDATIONS */}
              <div className="space-y-1.5">
                <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                      14 SPARE PARTS &amp; RECOMMENDATIONS
                    </h2>
                    {sections['14']?.data?.followUpRequired !== undefined && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        sections['14'].data.followUpRequired 
                          ? 'text-amber-800 bg-amber-50 border-amber-200' 
                          : 'text-slate-600 bg-slate-100 border-slate-200'
                      }`}>
                        FOLLOW-UP: {sections['14'].data.followUpRequired ? 'REQUIRED' : 'NONE'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(sections['14']?.status || 'NOT_COLLECTED')}
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Engineering Recommendations */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-mono text-slate-500 font-bold uppercase text-[9px] block">
                      ENGINEERING RECOMMENDATIONS &amp; FUTURE ACTION PLAN
                    </span>
                    <div className="bg-white p-2 rounded border border-slate-200 text-[11px] text-slate-700 leading-relaxed">
                      {sections['14']?.data?.engineerRecommendationsText || 
                       (sections['14']?.data?.recommendations && sections['14'].data.recommendations.length > 0 ? sections['14'].data.recommendations.join(' • ') : null) || 
                       '—'}
                    </div>
                  </div>

                  {/* Consumed & Recommended Spare Parts */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Consumed / Replaced Parts */}
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <span className="font-mono text-slate-500 font-bold uppercase text-[9px] block">
                        CONSUMED PARTS (SERVICE EXECUTION)
                      </span>
                      {sections['14']?.data?.consumedParts && sections['14'].data.consumedParts.length > 0 ? (
                        <table className="w-full text-left text-[10.5px] border-collapse bg-white rounded border border-slate-200">
                          <thead>
                            <tr className="border-b border-slate-200 font-mono text-[8.5px] text-slate-400 bg-slate-50/70">
                              <th className="py-0.5 px-1.5">PART NAME</th>
                              <th className="py-0.5 px-1.5">QTY</th>
                              <th className="py-0.5 px-1.5">ACTION</th>
                              <th className="py-0.5 px-1.5 text-right">COSTING</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sections['14'].data.consumedParts.map(sp => (
                              <tr key={sp.id}>
                                <td className="py-1 px-1.5 font-bold text-slate-800 text-[10px]">{sp.partName}</td>
                                <td className="py-1 px-1.5 font-mono text-[10px]">{sp.quantity}</td>
                                <td className="py-1 px-1.5 font-bold text-cyan-900 text-[10px]">{sp.action}</td>
                                <td className="py-1 px-1.5 text-right font-mono text-[9px] text-slate-500">{sp.costIndicator}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-slate-500 italic text-[10.5px] bg-white p-1.5 rounded border border-slate-200">—</p>
                      )}
                    </div>

                    {/* Recommended Spare Parts */}
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <span className="font-mono text-slate-500 font-bold uppercase text-[9px] block">
                        RECOMMENDED SPARE PARTS (PROCUREMENT / STOCK)
                      </span>
                      {sections['14']?.data?.recommendedParts && sections['14'].data.recommendedParts.length > 0 ? (
                        <table className="w-full text-left text-[10.5px] border-collapse bg-white rounded border border-slate-200">
                          <thead>
                            <tr className="border-b border-slate-200 font-mono text-[8.5px] text-slate-400 bg-slate-50/70">
                              <th className="py-0.5 px-1.5">RECOMMENDED ITEM</th>
                              <th className="py-0.5 px-1.5">QTY</th>
                              <th className="py-0.5 px-1.5 text-right">TRIGGER / REASON</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sections['14'].data.recommendedParts.map(rec => (
                              <tr key={rec.id}>
                                <td className="py-1 px-1.5 font-bold text-slate-800 text-[10px]">{rec.partName}</td>
                                <td className="py-1 px-1.5 font-mono text-[10px]">{rec.quantity || 1}</td>
                                <td className="py-1 px-1.5 text-right text-slate-600 text-[9.5px] truncate max-w-[130px]">{rec.reason || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-slate-500 italic text-[10.5px] bg-white p-1.5 rounded border border-slate-200">—</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 15: BUYOFF & OFFICIAL APPROVALS */}
              <div className="space-y-1.5 pt-1">
                <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                      15 BUYOFF &amp; OFFICIAL APPROVALS
                    </h2>
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      PRODUCTION RELEASE: {releaseStatus}
                    </span>
                  </div>
                  {renderStatusBadge(releaseStatus)}
                </div>

                <div className="space-y-2">
                  {/* Next MHC Scheduling Box */}
                  <div className="p-2 rounded-lg bg-slate-900 text-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded">
                        NEXT SCHEDULED MHC
                      </div>
                      <div className="text-[11px]">
                        <span className="text-slate-400">Target Due Date: </span>
                        <strong className="text-cyan-300 font-mono text-xs">
                          {sections['15']?.data?.nextMhcSchedule?.nextDueDate || 'Quarterly Cycle (90 Days)'}
                        </strong>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Cycle: <span className="text-slate-200 font-bold">90-Day Standard Interval</span>
                    </div>
                  </div>

                  {/* Dual Sign-off Blocks */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-sans">
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Engineer Signature Block */}
                      <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="text-[9px] font-mono text-slate-400 font-bold uppercase border-b border-slate-100 pb-1 flex justify-between items-center">
                            <span>FIELD SERVICE ENGINEER</span>
                            <span className="text-emerald-700 font-mono text-[8px] bg-emerald-50 px-1 rounded border border-emerald-200">VERIFIED</span>
                          </div>
                          <div className="space-y-0.5 pt-1">
                            <strong className="text-slate-900 text-xs block">{engineerName}</strong>
                            <div className="text-[10px] text-slate-500">{sections['15']?.data?.engineerSignoff?.title || 'Senior Field Service Engineer'}</div>
                            <div className="text-[9px] font-mono text-slate-500">Date: {sections['15']?.data?.engineerSignoff?.date || inspectionDate}</div>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-dashed border-slate-200 text-center font-mono text-[9px] text-slate-500">
                          {sections['15']?.data?.engineerSignoff?.signatureDataUrl ? (
                            <img src={sections['15'].data.engineerSignoff.signatureDataUrl} alt="Engineer Signature" className="h-8 max-w-full mx-auto object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <span>[ COMPLETED &amp; SIGNED BY ENGINEER ]</span>
                          )}
                        </div>
                      </div>

                      {/* Customer Signoff Block */}
                      <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="text-[9px] font-mono text-slate-400 font-bold uppercase border-b border-slate-100 pb-1 flex justify-between items-center">
                            <span>CUSTOMER ACCEPTANCE REPRESENTATIVE</span>
                            <span className={`font-mono text-[8px] px-1 rounded border ${
                              releaseStatus === 'APPROVED' 
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                : 'text-amber-700 bg-amber-50 border-amber-200'
                            }`}>
                              {releaseStatus === 'APPROVED' ? 'ACCEPTED' : 'PENDING'}
                            </span>
                          </div>
                          <div className="space-y-0.5 pt-1">
                            <strong className="text-slate-900 text-xs block">
                              {sections['15']?.data?.customerSignoff?.name && sections['15'].data.customerSignoff.name !== 'Customer Representative' 
                                ? sections['15'].data.customerSignoff.name 
                                : (releaseStatus === 'APPROVED' ? 'Customer Representative' : 'Pending Customer Sign-off')}
                            </strong>
                            <div className="text-[10px] text-slate-500">
                              {sections['15']?.data?.customerSignoff?.title || customerCompany}
                            </div>
                            <div className="text-[9px] font-mono text-slate-500">
                              Date: {sections['15']?.data?.customerSignoff?.date || '—'}
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-dashed border-slate-200 text-center font-mono text-[9px] text-slate-500">
                          {sections['15']?.data?.customerSignoff?.signatureDataUrl ? (
                            <img src={sections['15'].data.customerSignoff.signatureDataUrl} alt="Customer Signature" className="h-8 max-w-full mx-auto object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <span>{releaseStatus === 'APPROVED' ? '[ CUSTOMER APPROVED ]' : '[ PENDING CUSTOMER REVIEW & SIGN-OFF ]'}</span>
                          )}
                        </div>
                      </div>

                    </div>

                    {sections['15']?.data?.customerSignoff?.comments && (
                      <div className="mt-2 p-1.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600">
                        <strong>Customer Remarks: </strong>{sections['15'].data.customerSignoff.comments}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 10 of {totalPages}</span>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
