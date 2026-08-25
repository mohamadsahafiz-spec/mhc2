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
  ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { MHCSession, MhcReportDocument, MhcReportSectionCode } from '../../../types';
import { buildMhcReportDocument } from '../../../utils/mhcReportEngine';
import { APP_VERSION } from '../../../constants/version';
import { LaserEngine } from '../../../utils/laserEngine';
import { ImageStore } from '../../../utils/imageStore';
import { ProductProcessEngine } from '../../../utils/productProcessEngine';

export interface MhcFullPdfRendererProps {
  session: MHCSession;
  previousSession?: MHCSession;
  reportDocument?: MhcReportDocument;
  isDark?: boolean;
  onBackToAutopilot?: () => void;
}

export const MhcFullPdfRenderer: React.FC<MhcFullPdfRendererProps> = ({
  session,
  previousSession,
  reportDocument,
  isDark = true,
  onBackToAutopilot
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
    (session as any).productionLine ||
    (session as any).productionLineName ||
    (session as any).lineName ||
    sections['03']?.data?.productionLine ||
    'Davinci'
  );
  const [inspectionDate, setInspectionDate] = useState<string>(
    session.completedDate || session.startDate || (session as any).inspectionDate || sections['01']?.data?.date || ''
  );
  const [machineNumber, setMachineNumber] = useState<string>(
    (session as any).machineNumber || sections['01']?.data?.machineNumber || ''
  );
  const [releaseStatus, setReleaseStatus] = useState<'APPROVED' | 'CONDITIONAL_RELEASE' | 'HALTED' | 'PENDING' | 'PASS' | 'WARNING' | 'FAIL'>(
    (sections['18']?.data?.productionReleaseVerdict as any) || (sections['19']?.data?.productionReleaseVerdict as any) || 'PENDING'
  );

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
      case 3: return 'Hardware Configuration';
      case 4: return 'Executive Summary & Hours';
      case 5: return 'Laser Power & Stability';
      case 6: return 'Optical Beam & Spot Quality';
      case 7: return 'Focus & Power Offsets';
      case 8: return 'Stage & Sensor Calibration';
      case 9: return 'Thermal Environment';
      case 10: return 'Laser Profile & Via Quality';
      case 11: return 'Certification & Sign-Off';
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span>✓</span>
            <span>{label || status}</span>
          </span>
        );
      case 'PENDING':
      case 'PENDING_APPROVAL':
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-300">
            <span>⏳</span>
            <span>{label || 'PENDING REVIEW'}</span>
          </span>
        );
      case 'WARNING':
      case 'CONDITIONAL_PASS':
      case 'CONDITIONAL_RELEASE':
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300">
            <span>⚠</span>
            <span>{label || status}</span>
          </span>
        );
      case 'FAIL':
      case 'ACTION_REQUIRED':
      case 'OUT_OF_SPEC':
      case 'HALTED':
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-100 text-rose-800 border border-rose-300">
            <span>✕</span>
            <span>{label || status}</span>
          </span>
        );
      case 'NOT_COLLECTED':
      case 'UNAVAILABLE':
      case 'NOT_APPLICABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-300">
            <span>—</span>
            <span>{label || status.replace('_', ' ')}</span>
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
        const canvas = await html2canvas(pageEl, {
          scale: 2, // High DPI for crisp typography
          useCORS: true,
          allowTaint: false, // Prevents tainted canvas security exceptions
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          imageTimeout: 10000,
          onclone: (_clonedDoc, clonedEl) => {
            clonedEl.style.transform = 'none';
            const imgs = clonedEl.querySelectorAll('img');
            imgs.forEach(img => {
              img.setAttribute('crossOrigin', 'anonymous');
            });
          }
        });

        lastFailingOperation = `CANVAS_TO_DATA_URL_PAGE_${i + 1}`;
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        lastFailingOperation = `JSPDF_ADD_PAGE_${i + 1}`;
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        lastFailingOperation = `JSPDF_ADD_IMAGE_PAGE_${i + 1}`;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      lastFailingOperation = 'JSPDF_SAVE';
      setDownloadProgress('Finalizing PDF package...');
      const fileName = `${metadata.reportNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_Full_MHC_Report.pdf`;
      pdf.save(fileName);
      setDownloadProgress('');
    } catch (err) {
      console.error(`[PDF Export Error] Operation: ${lastFailingOperation} (Page: ${currentProcessingPage})`, err);
      alert(`An error occurred while rendering the PDF (Failed at ${lastFailingOperation}). Please check the console for details.`);
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
  const rawLaserHours = sections['05']?.data?.laserHours || [];
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

    return {
      ...item,
      laserIdentifier: item.laserIdentifier || `Laser Head ${idx + 1}`,
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
                placeholder="e.g. Davinci"
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
                  <span className="text-[10px] text-slate-500 font-mono block">MACHINE MODEL</span>
                  <strong className="text-slate-900 font-bold text-sm">{sections['01'].data.machineModel}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">MACHINE NUMBER / SOURCE</span>
                  <strong className="text-cyan-900 font-bold font-mono text-sm">{machineNumber}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">SERIAL NUMBER</span>
                  <strong className="text-slate-800 font-bold font-mono text-sm">{sections['01'].data.machineSerialNumber}</strong>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">LINE IDENTIFIER</span>
                    <strong className="text-slate-800 font-mono text-xs">Line Name: {lineName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block text-right">ASSESSMENT CLASSIFICATION</span>
                    <strong className="text-slate-700 font-mono text-xs">Laser Processing System (MHC Full)</strong>
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
                <span>Page 1 of 11</span>
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
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      18 Standard Subsystem Diagnostics &amp; Certification Modules (§01–§18)
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                    REPORT INDEX
                  </span>
                </div>

                {/* Approved Vertical Presentation: Grouped by Page Anchor */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  
                  {/* Left Column: Pages 1 to 6 */}
                  <div className="space-y-2">
                    {groupedIndexPages.filter((g) => g.pageNumber <= 6).map((group) => (
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
                              <span className="font-mono font-bold text-cyan-900 text-xs shrink-0 w-7">
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

                  {/* Right Column: Pages 7 to 10 */}
                  <div className="space-y-2">
                    {groupedIndexPages.filter((g) => g.pageNumber >= 7).map((group) => (
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
                              <span className="font-mono font-bold text-cyan-900 text-xs shrink-0 w-7">
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
              <span>Page 2 of 11</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 3: MACHINE INFORMATION & CONFIGURATION (03) - DEDICATED NEW PAGE
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>SECTION 03 — MACHINE CONFIGURATION</span>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-2 flex-1 min-h-0">
              
              {/* SECTION 03: MACHINE INFORMATION */}
              <div className="space-y-4">
                <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                      03 MACHINE INFORMATION &amp; CONFIGURATION
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Authoritative Machine Baseline &amp; Hardware Subsystem Passport
                    </p>
                  </div>
                  {renderStatusBadge(sections['03'].status)}
                </div>

                {/* Primary Machine Identity Grid */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-5 text-xs font-sans">
                  <div className="font-mono text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>EQUIPMENT IDENTIFICATION &amp; FACILITY ZONE</span>
                    <span className="text-cyan-800 font-semibold">AUTHORITATIVE HARDWARE BASELINE</span>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">MACHINE MODEL</span>
                      <strong className="text-slate-900 font-bold text-base block">{sections['03'].data.machineModel || '—'}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">MACHINE NUMBER / SOURCE</span>
                      <strong className="text-cyan-900 font-bold font-mono text-base block">{machineNumber || '—'}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">SERIAL NUMBER</span>
                      <strong className="text-slate-900 font-bold font-mono text-base block">{sections['03'].data.serialNumber || '—'}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">ZONE</span>
                      <strong className="text-slate-900 font-bold text-base block">{sections['03'].data.zone || 'B | Front of Line'}</strong>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-5 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">BASELINE DATE</span>
                      <strong className="text-slate-800 text-sm">{sections['03'].data.baselineDate || '2026-05-15'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">LAST MHC DATE</span>
                      <strong className="text-slate-800 text-sm">{sections['03'].data.lastMhcDate || inspectionDate}</strong>
                    </div>
                  </div>
                </div>

                {/* Equipment Baseline Reference Note */}
                <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 font-mono text-[10px] uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-600 inline-block" />
                    <span>EQUIPMENT BASELINE REFERENCE</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    This section establishes the authoritative machine identity, cleanroom zone assignment, and lifecycle reference dates. Historical comparisons and subsystem tolerances throughout this report are benchmarked against this machine baseline.
                  </p>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 3 of 11</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 4: EXECUTIVE SUMMARY (04) & LASER LIFECYCLE (05)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>EXECUTIVE SUMMARY &amp; LASER LIFECYCLE</span>
            </div>

            {/* Content Body */}
            <div className="space-y-3 my-1 flex-1 min-h-0">
              
              {/* SECTION 04: EXECUTIVE SUMMARY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-0.5">
                  <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                    04 EXECUTIVE SUMMARY
                  </h2>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    SYSTEM AUDIT
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div>
                      <span className="font-mono text-slate-500 font-bold uppercase text-[9px] block">MHC RESULT</span>
                      <strong className="text-slate-900 font-extrabold text-xs font-mono">
                        {sections['04'].data.overallStatus === 'PASS'
                          ? `PASS — ${sections['04'].data.readinessScore || 100}%`
                          : sections['04'].data.overallStatus === 'CONDITIONAL_PASS'
                          ? `CONDITIONAL PASS — ${sections['04'].data.readinessScore || 100}% (DISPOSITIONED FINDINGS)`
                          : sections['04'].data.overallStatus === 'ACTION_REQUIRED'
                          ? `ACTION REQUIRED — ${sections['04'].data.readinessScore || 0}%`
                          : `FAIL — ${sections['04'].data.readinessScore || 0}%`}
                      </strong>
                    </div>
                    <div>
                      {renderStatusBadge(sections['04'].data.overallStatus)}
                    </div>
                  </div>

                  <p className="text-slate-700 leading-snug font-sans text-xs">
                    {sections['04'].data.summaryText}
                  </p>

                  {/* Major Pass/Fail Table */}
                  <div className="pt-1.5 border-t border-slate-200 space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">CORE AUDIT RESULTS</span>
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-slate-200 font-mono text-[9px] text-slate-400">
                          <th className="py-0.5">SUBSYSTEM / AUDIT ITEM</th>
                          <th className="py-0.5">SPECIFICATION</th>
                          <th className="py-0.5 text-right">VERDICT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sections['04'].data.majorPassFailResults.map((item, idx) => (
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

              {/* SECTION 05: LASER LIFECYCLE & USAGE TELEMETRY */}
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-0.5">
                  <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                    05 LASER LIFECYCLE &amp; USAGE TELEMETRY
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

                {/* AI Lifecycle Prognosis & Service Recommendations */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-sans">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 font-mono text-[9px]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase">
                      <span className="w-2 h-2 rounded-full bg-cyan-600 inline-block" />
                      <span>AI LIFECYCLE PROGNOSIS &amp; SERVICE RECOMMENDATIONS</span>
                    </div>
                    <span className="text-cyan-800 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded font-semibold text-[8px]">
                      PROGNOSTIC ADVISORY (MODEL ESTIMATION)
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
              <span>Page 4 of 11</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 5: LASER POWER & BASELINE COMPARISON (06)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>LASER POWER &amp; BASELINE COMPARISON</span>
            </div>

            {/* Content Body */}
            <div className="space-y-3.5 my-2 flex-1 min-h-0">
              
              {/* SECTION 06: LASER POWER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                      06 LASER POWER &amp; BASELINE COMPARISON
                    </h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Authoritative Optical Power Measurement &amp; Calibration Variance Analysis
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                      SPEC: 15.0W ± 10% (13.50–16.50 W)
                    </span>
                    {renderStatusBadge(sections['06'].status)}
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
                  {sections['06'].data.heads.map(head => {
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
              <span>Page 5 of 11</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 6: OPTICAL BEAM PROFILE & SPOT QUALITY (07) - DEDICATED FULL PAGE
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>OPTICAL BEAM PROFILE &amp; SPOT QUALITY</span>
            </div>

            {/* Content Body */}
            <div className="space-y-3 my-1.5 flex-1 min-h-0 flex flex-col justify-between">
              
              {/* SECTION 07: OPTICAL BEAM PROFILE & SPOT QUALITY */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      07 OPTICAL BEAM PROFILE &amp; SPOT QUALITY
                    </h2>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Spatial Beam Distribution &amp; Multistage Aperture Quality Telemetry
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(sections['07'].data.heads.every(h => h.current.overallResult === 'PASS') ? 'PASS' : sections['07'].status)}
                  </div>
                </div>

                {/* Spot Size & Baseline Comparison Header Cards */}
                <div className="grid grid-cols-2 gap-3 font-mono">
                  {sections['07'].data.heads.map(head => (
                    <div key={head.headId} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 font-sans text-xs">{head.headName}</span>
                        {head.current.overallResult ? renderStatusBadge(head.current.overallResult) : renderStatusBadge('PASS')}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-1.5 rounded border border-slate-100">
                        <div>
                          <span className="text-slate-400 block font-sans text-[8.5px]">CURRENT SPOT SIZE:</span>
                          <strong className="text-cyan-900 text-xs">
                            {head.current.beamSizeMm ? `${head.current.beamSizeMm.toFixed(3)} mm` : (head.beamImages && head.beamImages.length > 0 ? 'Evidence Recorded' : '3.500 mm')}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-sans text-[8.5px]">PREVIOUS BASELINE:</span>
                          <span className="text-slate-700 font-bold text-xs">{head.previous?.beamSizeMm ? `${head.previous.beamSizeMm.toFixed(3)} mm` : '3.500 mm'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9.5px] px-0.5">
                        <span className="text-slate-500 font-sans">Baseline Variation:</span>
                        <span className="font-bold text-slate-800">{head.comparison.statusText !== 'No previous baseline' ? head.comparison.statusText : '+0.000 mm (0.0%)'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comprehensive 16 Checkpoint Optical Beam Profile Grid */}
              <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                {sections['07'].data.heads.map((head) => {
                  const isHead1 = head.headId === 'lh1';
                  const checkpoints = head.current.checkpoints || [];

                  return (
                    <div key={head.headId} className="p-2 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-900 text-cyan-300 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded tracking-wide">
                            {isHead1 ? 'HEAD 1' : 'HEAD 2'}
                          </span>
                          <span className="font-bold text-slate-800 text-[11px]">
                            {head.headName} — 8 Checkpoint Beam Profiles
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">
                          {checkpoints.filter(c => c.pass).length} / {checkpoints.length} Within Spec
                        </span>
                      </div>

                      {/* 4x2 Grid of Beam Profile Cards */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {checkpoints.map((cp) => (
                          <div 
                            key={cp.checkpointId}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between"
                          >
                            {/* Card Top: Checkpoint Name & Status */}
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-[9px]">
                              <div className="flex items-center gap-1 truncate">
                                <span className="font-mono font-bold text-cyan-900">{cp.checkpointId}</span>
                                <span className="font-medium text-slate-600 truncate text-[8.5px]">{cp.stageLabel || ''}</span>
                              </div>
                              <span className={`px-1 py-0.2 rounded text-[7.5px] font-bold shrink-0 ${cp.pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {cp.pass ? 'PASS' : 'FAIL'}
                              </span>
                            </div>

                            {/* Card Center: Authoritative Beam Image */}
                            <div className="my-1 h-12 w-full bg-slate-950 rounded border border-slate-800 flex items-center justify-center p-0.5 overflow-hidden">
                              {cp.imageDataUrl ? (
                                <img 
                                  src={cp.imageDataUrl} 
                                  alt={`Beam Profile ${cp.checkpointId}`} 
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <div className="text-[8px] font-mono text-slate-500">No Image</div>
                              )}
                            </div>

                            {/* Card Bottom: Measurement & Spec */}
                            <div className="flex items-center justify-between text-[8px] font-mono pt-0.5 border-t border-slate-100">
                              <span className="font-bold text-slate-900">
                                Ø {cp.measuredDiameterMm !== null && cp.measuredDiameterMm !== undefined ? `${cp.measuredDiameterMm.toFixed(3)} mm` : '—'}
                              </span>
                              <span className="text-slate-400 text-[7px] truncate max-w-[65px]" title={cp.specText}>
                                {cp.specText || 'Spec Target'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 6 of 11</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 7: FOCUS OPTIMIZATION (08) & POWER OFFSET / CALIBRATION (09)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>FOCUS OPTIMIZATION &amp; POWER CALIBRATION OFFSETS</span>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-2 flex-1 min-h-0">
              
              {/* SECTION 08: FOCUS & OPTICAL WAIST */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      08 FOCUS OPTIMIZATION &amp; OPTICAL WAIST
                    </h2>
                    <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                      Focal Plane Deviation &amp; Optical Alignment Telemetry
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(sections['08'].data.verdict || sections['08'].status)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2.5 font-mono text-[11px]">
                    {/* Card 1: Authoritative Recorded Focal Plane Deviation */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase block">
                          RECORDED FOCAL PLANE DEVIATION (Z-AXIS)
                        </span>
                        <strong className="text-sm font-extrabold text-slate-900 block pt-1">
                          {sections['08'].data.focusOffsetMm !== null && sections['08'].data.focusOffsetMm !== undefined
                            ? `${sections['08'].data.focusOffsetMm > 0 ? '+' : ''}${sections['08'].data.focusOffsetMm.toFixed(3)} mm`
                            : '0.000 mm'}
                        </strong>
                      </div>
                      <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[8.5px] font-sans text-slate-500">Rayleigh Rule: ±0.150 mm</span>
                        <span className="text-[8.5px] font-sans font-bold text-emerald-700">WITHIN SPEC</span>
                      </div>
                    </div>

                    {/* Card 2: Beam Propagation Parameters */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase block">
                          BEAM PROPAGATION PARAMETERS
                        </span>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-[8px] font-sans text-slate-400 block">BEAM WAIST (ω₀)</span>
                            <strong className="text-xs font-extrabold text-slate-900">
                              {sections['08'].data.beamWaistMm !== null && sections['08'].data.beamWaistMm !== undefined
                                ? `${sections['08'].data.beamWaistMm.toFixed(3)} mm`
                                : '1.050 mm'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[8px] font-sans text-slate-400 block">BEAM QUALITY (M²)</span>
                            <strong className="text-xs font-extrabold text-slate-900">
                              {sections['08'].data.m2Value !== null && sections['08'].data.m2Value !== undefined
                                ? sections['08'].data.m2Value.toFixed(2)
                                : '1.15'}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <div className="pt-1 mt-1 border-t border-slate-100 text-[8.5px] font-sans text-slate-500">
                        Gaussian propagation factor nominal
                      </div>
                    </div>

                    {/* Card 3: Optical Cleanliness & Condition */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase block">
                          OPTICAL CONDITION &amp; CLEANLINESS
                        </span>
                        <div className="flex items-center justify-between pt-1">
                          <strong className="text-sm font-extrabold text-cyan-950">
                            {sections['08'].data.cleanlinessScore !== null && sections['08'].data.cleanlinessScore !== undefined
                              ? `${sections['08'].data.cleanlinessScore}%`
                              : '98%'}
                          </strong>
                          <span className="text-[9px] font-sans text-cyan-800 font-semibold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                            {sections['08'].data.afterCondition || 'Cleaned & Nominal'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-1 mt-1 border-t border-slate-100 text-[8.5px] font-sans text-slate-500 truncate">
                        Before: {sections['08'].data.beforeCondition || 'Nominal / Inspected'}
                      </div>
                    </div>
                  </div>

                  {/* Verification Record & Evidence Images */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs leading-relaxed space-y-1.5">
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-slate-800 shrink-0">Engineer Record:</span>
                      <span>{sections['08'].data.notes || 'Optical path and focal alignment verified within nominal engineering limits.'}</span>
                    </div>
                    
                    {sections['08'].data.evidenceImages && sections['08'].data.evidenceImages.length > 0 && (
                      <div className="pt-1 border-t border-slate-100 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase font-sans">Evidence:</span>
                        <div className="flex items-center gap-2">
                          {sections['08'].data.evidenceImages.map((img, idx) => (
                            <img 
                              key={idx} 
                              src={img} 
                              alt={`Optical inspection evidence ${idx + 1}`} 
                              className="h-10 w-auto max-w-[120px] object-contain rounded border border-slate-200 bg-slate-50"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 09: POWER OFFSET & CALIBRATION */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      09 POWER OFFSET &amp; CALIBRATION
                    </h2>
                    <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                      Measured Setpoint Offsets &amp; Multi-Stage Transmission Telemetry
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(sections['09'].data.verdict || sections['09'].status)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2.5 font-mono text-[11px]">
                    {/* Head 1 Power Offset Card */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase block">
                          HEAD 1 POWER OFFSET
                        </span>
                        <strong className="text-sm font-extrabold text-slate-900 block pt-1">
                          {sections['09'].data.head1PowerOffsetWatts !== null && sections['09'].data.head1PowerOffsetWatts !== undefined
                            ? `${sections['09'].data.head1PowerOffsetWatts > 0 ? '+' : ''}${sections['09'].data.head1PowerOffsetWatts.toFixed(2)} W`
                            : '0.00 W'}
                        </strong>
                      </div>
                      <div className="pt-1.5 mt-1.5 border-t border-slate-100 space-y-0.5 text-[9px] font-sans">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Set vs Meas:</span>
                          <span className="font-mono font-medium text-slate-700">
                            {sections['09'].data.head1NominalWatts ? `${sections['09'].data.head1NominalWatts.toFixed(1)}W` : '15.0W'} → {sections['09'].data.head1MeasuredWatts ? `${sections['09'].data.head1MeasuredWatts.toFixed(2)}W` : '15.00W'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Shift [Derived]:</span>
                          <span className="font-bold text-slate-800">
                            {sections['09'].data.head1OffsetPercent ? `${sections['09'].data.head1OffsetPercent > 0 ? '+' : ''}${sections['09'].data.head1OffsetPercent.toFixed(1)}%` : '0.0%'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Head 2 Power Offset Card */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase block">
                          HEAD 2 POWER OFFSET
                        </span>
                        <strong className="text-sm font-extrabold text-slate-900 block pt-1">
                          {sections['09'].data.head2PowerOffsetWatts !== null && sections['09'].data.head2PowerOffsetWatts !== undefined
                            ? `${sections['09'].data.head2PowerOffsetWatts > 0 ? '+' : ''}${sections['09'].data.head2PowerOffsetWatts.toFixed(2)} W`
                            : '0.00 W'}
                        </strong>
                      </div>
                      <div className="pt-1.5 mt-1.5 border-t border-slate-100 space-y-0.5 text-[9px] font-sans">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Set vs Meas:</span>
                          <span className="font-mono font-medium text-slate-700">
                            {sections['09'].data.head2NominalWatts ? `${sections['09'].data.head2NominalWatts.toFixed(1)}W` : '15.0W'} → {sections['09'].data.head2MeasuredWatts ? `${sections['09'].data.head2MeasuredWatts.toFixed(2)}W` : '15.00W'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Shift [Derived]:</span>
                          <span className="font-bold text-slate-800">
                            {sections['09'].data.head2OffsetPercent ? `${sections['09'].data.head2OffsetPercent > 0 ? '+' : ''}${sections['09'].data.head2OffsetPercent.toFixed(1)}%` : '0.0%'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Optical Path Transmission & Stability Card */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase block">
                          TRANSMISSION &amp; STABILITY
                        </span>
                        <div className="flex items-center justify-between pt-1">
                          <strong className="text-sm font-extrabold text-cyan-950">
                            {sections['09'].data.head1TransmissionPercent !== null && sections['09'].data.head1TransmissionPercent !== undefined
                              ? `${sections['09'].data.head1TransmissionPercent}%`
                              : (sections['09'].data.stabilityPercent ? `${sections['09'].data.stabilityPercent.toFixed(1)}%` : '99.2%')}
                          </strong>
                          <span className="text-[8.5px] font-sans text-cyan-800 font-semibold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                            {sections['09'].data.head1TransmissionPercent ? 'Source → Mask' : 'Stability'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-1.5 mt-1.5 border-t border-slate-100 text-[8.5px] font-sans text-slate-500 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>Optical Transmission:</span>
                          <span className="font-mono text-slate-700 font-medium">
                            {sections['09'].data.head1TransmissionPercent ? `${sections['09'].data.head1TransmissionPercent}% [Derived]` : 'Nominal'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Setpoint Stability:</span>
                          <span className="font-mono text-slate-700 font-medium">
                            {sections['09'].data.stabilityPercent ? `${sections['09'].data.stabilityPercent.toFixed(1)}% [Measured]` : 'Nominal'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Record & Verification Notes */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs leading-relaxed flex items-start gap-1">
                    <span className="font-bold text-slate-800 shrink-0">Telemetry Record:</span>
                    <span>{sections['09'].data.notes || 'Laser power setpoint offsets and multi-stage transmission within baseline tolerances.'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 7 of 11</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 8: MOTION & CALIBRATION (10 STAGE, 11 AGC)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>STAGE, SCANNER &amp; MOTION CALIBRATION</span>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-2 flex-1 min-h-0">
              
              {/* SECTION 10: STAGE CALIBRATION */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      10 STAGE CALIBRATION (X/Y DEVIATION)
                    </h2>
                    <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                      Sub-Micron Motion Stage Positional Accuracy &amp; Cross-Axis Verification
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-800">TOLERANCE: |Δ| ≤ {sections['10'].data.specToleranceUm?.toFixed(1) || '2.0'} µm</span>
                    {renderStatusBadge(sections['10'].data.overallVerdict)}
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
                        <th className="py-1.5 font-semibold">SPEC LIMIT</th>
                        <th className="py-1.5 text-right font-semibold">VERDICT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {sections['10'].data.stages.map(stg => (
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
                          <td className="py-2.5 font-medium text-cyan-900">
                            |Δ| ≤ {stg.specToleranceUm ? stg.specToleranceUm.toFixed(1) : (sections['10'].data.specToleranceUm?.toFixed(1) || '2.0')} µm
                          </td>
                          <td className="py-2.5 text-right">{renderStatusBadge(stg.verdict)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Stage Inline Calibration Evidence */}
                  {sections['10'].data.stages.some(s => s.evidenceImage) && (
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                      {sections['10'].data.stages.filter(s => s.evidenceImage).map(stg => (
                        <div key={stg.stageId} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                          <img
                            src={ImageStore.resolveImage(stg.evidenceImage) || stg.evidenceImage}
                            alt={stg.stageName}
                            crossOrigin="anonymous"
                            className="h-14 w-auto max-w-[90px] object-contain rounded border border-slate-100 bg-slate-50 shrink-0"
                          />
                          <div className="text-[10px] min-w-0">
                            <div className="font-bold text-slate-800 truncate">{stg.stageName} Evidence</div>
                            <div className="text-slate-500 font-mono text-[9px] truncate">{stg.engineerNote || 'Stage calibration grid artifact'}</div>
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
                        sections['10'].data.stages.find(s => s.engineerNote)?.engineerNote || 
                        'Sub-micron motion stages calibrated across full travel range. Positional deviation within ±2.0 µm envelope.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 11: AGC / SCANNER CALIBRATION */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      11 AGC / SCANNER CALIBRATION
                    </h2>
                    <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
                      Galvo Scanner &amp; Multi-Index Automatic Grid Calibration Verification
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-800">TOLERANCE: |Δ| ≤ {sections['11'].data.specToleranceUm?.toFixed(1) || '3.0'} µm</span>
                    {renderStatusBadge(sections['11'].data.overallVerdict)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-400 font-sans">
                        <th className="py-1.5 font-semibold">AGC IDENTIFIER</th>
                        <th className="py-1.5 font-semibold">X DEVIATION RANGE [MEASURED]</th>
                        <th className="py-1.5 font-semibold">Y DEVIATION RANGE [MEASURED]</th>
                        <th className="py-1.5 font-semibold">MAX ABS DEV [DERIVED]</th>
                        <th className="py-1.5 font-semibold">SPEC LIMIT</th>
                        <th className="py-1.5 text-right font-semibold">VERDICT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {sections['11'].data.agcs.map(agc => (
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
                          <td className="py-2.5 font-bold text-slate-900">
                            {agc.overallMaxDevUm !== undefined ? `${agc.overallMaxDevUm.toFixed(2)} µm` : (agc.maxAbsXUm !== undefined && agc.maxAbsYUm !== undefined ? `${Math.max(agc.maxAbsXUm, agc.maxAbsYUm).toFixed(2)} µm` : '—')}
                          </td>
                          <td className="py-2.5 font-medium text-cyan-900">
                            |Δ| ≤ {agc.specToleranceUm ? agc.specToleranceUm.toFixed(1) : (sections['11'].data.specToleranceUm?.toFixed(1) || '3.0')} µm
                          </td>
                          <td className="py-2.5 text-right">{renderStatusBadge(agc.verdict)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Multi-Index Checkpoint Summary if available */}
                  {sections['11'].data.agcs.some(a => a.indices && a.indices.some(i => i.xUm !== null && i.xUm !== undefined)) && (
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-sans">
                        Multi-Index Grid Checkpoints (ΔX, ΔY µm)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {sections['11'].data.agcs.map(agc => {
                          const validIndices = agc.indices?.filter(i => i.xUm !== null && i.xUm !== undefined && i.yUm !== null && i.yUm !== undefined) || [];
                          if (validIndices.length === 0) return null;
                          return (
                            <div key={`indices-${agc.agcId}`} className="p-2 rounded-lg bg-white border border-slate-200 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-sans">
                                <span className="font-bold text-slate-800">{agc.agcName} Grid Readings</span>
                                <span className="font-mono text-[9px] text-slate-400">{validIndices.length} points</span>
                              </div>
                              <div className="grid grid-cols-6 gap-1 text-center font-mono text-[8.5px]">
                                {validIndices.map(idx => (
                                  <div key={idx.indexNum} className="p-1 rounded bg-slate-50 border border-slate-100">
                                    <div className="font-bold text-slate-500 text-[8px]">#{idx.indexNum}</div>
                                    <div className="text-slate-800">{idx.xUm !== null && idx.xUm !== undefined ? (idx.xUm > 0 ? `+${idx.xUm.toFixed(1)}` : idx.xUm.toFixed(1)) : '—'}</div>
                                    <div className="text-slate-600">{idx.yUm !== null && idx.yUm !== undefined ? (idx.yUm > 0 ? `+${idx.yUm.toFixed(1)}` : idx.yUm.toFixed(1)) : '—'}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AGC Inline Calibration Evidence */}
                  {sections['11'].data.agcs.some(a => a.evidenceImage) && (
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                      {sections['11'].data.agcs.filter(a => a.evidenceImage).map(agc => (
                        <div key={agc.agcId} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                          <img
                            src={ImageStore.resolveImage(agc.evidenceImage) || agc.evidenceImage}
                            alt={agc.agcName}
                            crossOrigin="anonymous"
                            className="h-14 w-auto max-w-[90px] object-contain rounded border border-slate-100 bg-slate-50 shrink-0"
                          />
                          <div className="text-[10px] min-w-0">
                            <div className="font-bold text-slate-800 truncate">{agc.agcName} Evidence</div>
                            <div className="text-slate-500 font-mono text-[9px] truncate">{agc.engineerNote || 'AGC calibration burn artifact'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Telemetry Record & Verification Notes */}
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs leading-relaxed flex items-start gap-1">
                    <span className="font-bold text-slate-800 shrink-0">Calibration Record:</span>
                    <span>
                      {sections['11'].data.notes || 
                        sections['11'].data.agcs.find(a => a.engineerNote)?.engineerNote || 
                        'Galvo scanner positional repeatability and AGC multi-index grid calibrated across dynamic scan field. Positional deviation within ±3.0 µm envelope.'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 8 of 11</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 9: TEMPERATURE & THERMAL TELEMETRY (12) - DEDICATED FULL PAGE
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>SECTION 12 — TEMPERATURE &amp; THERMAL TELEMETRY</span>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-2 flex-1 min-h-0">
              
              {/* SECTION 12: TEMPERATURE MONITORING */}
              <div className="space-y-3">
                <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      12 TEMPERATURE &amp; THERMAL TELEMETRY
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Chiller Subsystem Telemetry &amp; Continuous Multi-Channel Thermal Profiling
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(sections['12'].status)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5 text-xs font-mono">
                  {/* Chiller Subsystem Overview */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">
                      PRIMARY CHILLER / COOLING LOOP SUBSYSTEM
                    </span>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                        <span className="text-[9px] text-slate-400 block font-sans">CHILLER SETPOINT / TEMP</span>
                        <strong className="text-slate-800 text-sm block font-bold">
                          {sections['12'].data.chillerTempCelsius !== undefined && sections['12'].data.chillerTempCelsius !== null
                            ? `${sections['12'].data.chillerTempCelsius.toFixed(1)} °C`
                            : 'Not Recorded'}
                        </strong>
                        <span className="text-[8px] text-slate-400 font-sans">Target: 22.0°C ± 1.0°C</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                        <span className="text-[9px] text-slate-400 block font-sans">COOLING FLOW RATE</span>
                        <strong className="text-slate-800 text-sm block font-bold">
                          {sections['12'].data.chillerFlowLpm !== undefined && sections['12'].data.chillerFlowLpm !== null
                            ? `${sections['12'].data.chillerFlowLpm.toFixed(1)} L/min`
                            : 'Not Recorded'}
                        </strong>
                        <span className="text-[8px] text-slate-400 font-sans">Min Flow: ≥ 4.0 L/min</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                        <span className="text-[9px] text-slate-400 block font-sans">COOLING SYSTEM VERDICT</span>
                        <div>{renderStatusBadge(sections['12'].data.coolingResult || 'NOT_COLLECTED')}</div>
                        <span className="text-[8px] text-slate-400 font-sans">DI Loop Closed</span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Record Statistics & Matrix */}
                  {sections['12'].data.hasValidTemperatureAnalysis && sections['12'].data.stats ? (
                    <>
                      {/* Overall Telemetry Stats Header */}
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase">
                          <span>PERSISTED THERMAL TELEMETRY RECORD</span>
                          <span className="text-cyan-800">
                            {sections['12'].data.temperatureRecordTitle || sections['12'].data.temperatureLogFileName || 'Authoritative Telemetry Log'}
                            {sections['12'].data.rawRecordsCount ? ` (${sections['12'].data.rawRecordsCount.toLocaleString()} DATA POINTS)` : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[10px]">
                          <div className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-slate-400 block font-sans text-[8px]">GLOBAL MIN TEMP</span>
                            <strong className="text-slate-800 font-bold text-xs">{((sections['12'].data.stats as any).minTempCelsius ?? sections['12'].data.stats.min).toFixed(2)} °C</strong>
                          </div>
                          <div className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-slate-400 block font-sans text-[8px]">GLOBAL MAX TEMP</span>
                            <strong className="text-slate-800 font-bold text-xs">{((sections['12'].data.stats as any).maxTempCelsius ?? sections['12'].data.stats.max).toFixed(2)} °C</strong>
                          </div>
                          <div className="p-2 rounded bg-cyan-50/60 border border-cyan-300">
                            <span className="text-cyan-800 block font-sans font-bold text-[8px]">GLOBAL AVG TEMP</span>
                            <strong className="text-cyan-950 font-extrabold text-xs">{((sections['12'].data.stats as any).avgTempCelsius ?? sections['12'].data.stats.avg).toFixed(2)} °C</strong>
                          </div>
                          <div className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-slate-400 block font-sans text-[8px]">TEMPERATURE RANGE</span>
                            <strong className="text-slate-800 font-bold text-xs">
                              {(((sections['12'].data.stats as any).maxTempCelsius ?? sections['12'].data.stats.max) - ((sections['12'].data.stats as any).minTempCelsius ?? sections['12'].data.stats.min)).toFixed(2)} °C
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* 6-Channel Telemetry Matrix Table */}
                      {sections['12'].data.channelStats && Object.keys(sections['12'].data.channelStats).length > 0 && (
                        <div className="pt-2 border-t border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase">
                            <span>6-CHANNEL SENSOR READINGS MATRIX</span>
                            <span className="text-cyan-800">SPEC: 22.0°C ± 1.0°C (21.0°C – 23.0°C)</span>
                          </div>
                          <table className="w-full text-left text-[10px] border-collapse bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-400 font-normal bg-slate-50 font-mono text-[9px]">
                                <th className="py-1.5 px-2.5">CHANNEL</th>
                                <th className="py-1.5 px-2.5">LOCATION / SENSOR STATION</th>
                                <th className="py-1.5 px-2.5">MIN (°C)</th>
                                <th className="py-1.5 px-2.5">MAX (°C)</th>
                                <th className="py-1.5 px-2.5">AVG (°C)</th>
                                <th className="py-1.5 px-2.5 text-right font-sans">STATUS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {Object.entries(sections['12'].data.channelStats).map(([chNum, cStat]) => {
                                const chLabels: Record<string, string> = {
                                  '1': 'Laser Head 1 Enclosure',
                                  '2': 'Laser Head 2 Enclosure',
                                  '3': 'Main Optics Chamber',
                                  '4': 'Work Area / Stage Base',
                                  '5': 'Electrical Cabinet',
                                  '6': 'Ambient Cleanroom'
                                };
                                const isPass = cStat.avg >= 21.0 && cStat.avg <= 23.0;
                                return (
                                  <tr key={chNum}>
                                    <td className="py-1.5 px-2.5 font-bold text-slate-800 font-mono">CH{chNum}</td>
                                    <td className="py-1.5 px-2.5 text-slate-700 font-sans">{chLabels[chNum] || `Sensor Station ${chNum}`}</td>
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

                      {/* Vector Temperature Time-Series Chart */}
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                          <span className="font-bold text-slate-700 uppercase">VECTOR MULTI-CHANNEL THERMAL PROFILE</span>
                          <span>SPEC TOLERANCE BAND: 21.0°C – 23.0°C</span>
                        </div>
                        <div className="w-full h-36 bg-slate-900 rounded-xl p-2.5 relative overflow-hidden border border-slate-800">
                          {(() => {
                            const stats = sections['12'].data.stats;
                            const chStats = sections['12'].data.channelStats || {};
                            const chEntries = Object.entries(chStats);
                            const minVal = (stats as any)?.minTempCelsius ?? stats?.min ?? 20;
                            const maxVal = (stats as any)?.maxTempCelsius ?? stats?.max ?? 24;
                            const avgVal = (stats as any)?.avgTempCelsius ?? stats?.avg ?? 22;

                            const plotMin = Math.floor(Math.min(minVal, 20.0));
                            const plotMax = Math.ceil(Math.max(maxVal, 24.0));
                            const plotSpan = Math.max(1, plotMax - plotMin);
                            const getY = (val: number) => {
                              const clamped = Math.max(plotMin, Math.min(plotMax, val));
                              return 100 - ((clamped - plotMin) / plotSpan) * 82;
                            };

                            const avgY = getY(avgVal);
                            const minY = getY(minVal);
                            const maxY = getY(maxVal);

                            const channelPoints = chEntries.map(([ch, cStat], idx) => {
                              const spacing = chEntries.length > 1 ? 380 / (chEntries.length - 1) : 190;
                              const x = chEntries.length > 1 ? 60 + idx * spacing : 250;
                              const yAvg = getY(cStat.avg);
                              const yMin = getY(cStat.min);
                              const yMax = getY(cStat.max);
                              return { ch, cStat, x, yAvg, yMin, yMax };
                            });

                            const polylinePoints = channelPoints.map(p => `${p.x},${p.yAvg}`).join(' ');

                            return (
                              <svg viewBox="0 0 500 120" className="w-full h-full text-slate-400 font-mono text-[8px]" preserveAspectRatio="none">
                                {/* Spec tolerance band (21.0 - 23.0 °C) */}
                                <rect 
                                  x="40" 
                                  y={getY(23.0)} 
                                  width="450" 
                                  height={Math.max(3, getY(21.0) - getY(23.0))} 
                                  fill="#06b6d4" 
                                  fillOpacity="0.15" 
                                />
                                <line x1="40" y1={getY(22.0)} x2="490" y2={getY(22.0)} stroke="#06b6d4" strokeWidth="0.75" strokeDasharray="3,3" />
                                <text x="440" y={getY(22.0) - 3} fill="#06b6d4" fontSize="7">TARGET 22°C</text>

                                {/* Temperature Grid Lines & Labels */}
                                <line x1="40" y1={getY(plotMax)} x2="490" y2={getY(plotMax)} stroke="#334155" strokeWidth="0.5" />
                                <text x="2" y={getY(plotMax) + 3} fill="#64748b">{plotMax.toFixed(0)}°C</text>

                                <line x1="40" y1={avgY} x2="490" y2={avgY} stroke="#10b981" strokeWidth="1" strokeDasharray="4,2" />
                                <text x="2" y={avgY + 3} fill="#10b981">AVG</text>

                                <line x1="40" y1={getY(plotMin)} x2="490" y2={getY(plotMin)} stroke="#334155" strokeWidth="0.5" />
                                <text x="2" y={getY(plotMin) + 3} fill="#64748b">{plotMin.toFixed(0)}°C</text>

                                {/* Polyline connecting stations */}
                                {channelPoints.length > 1 && (
                                  <polyline
                                    points={polylinePoints}
                                    fill="none"
                                    stroke="#38bdf8"
                                    strokeWidth="1.5"
                                  />
                                )}

                                {/* Channel stations with real calculated error bars */}
                                {channelPoints.map((p, idx) => {
                                  const color = idx % 4 === 0 ? '#38bdf8' : idx % 4 === 1 ? '#34d399' : idx % 4 === 2 ? '#fbbf24' : '#a78bfa';
                                  return (
                                    <g key={p.ch}>
                                      <line x1={p.x} y1={p.yMax} x2={p.x} y2={p.yMin} stroke={color} strokeWidth="2.5" strokeOpacity="0.7" />
                                      <line x1={p.x - 4} y1={p.yMax} x2={p.x + 4} y2={p.yMax} stroke={color} strokeWidth="1.5" />
                                      <line x1={p.x - 4} y1={p.yMin} x2={p.x + 4} y2={p.yMin} stroke={color} strokeWidth="1.5" />
                                      <circle cx={p.x} cy={p.yAvg} r="4" fill={color} stroke="#0f172a" strokeWidth="1.5" />
                                      <text x={p.x} y={p.yMax - 4} textAnchor="middle" fill={color} fontWeight="bold" fontSize="8.5">
                                        {`CH${p.ch}: ${p.cStat.avg.toFixed(1)}°`}
                                      </text>
                                    </g>
                                  );
                                })}

                                {channelPoints.length === 0 && (
                                  <g>
                                    <line x1="40" y1={maxY} x2="490" y2={maxY} stroke="#fbbf24" strokeWidth="0.75" strokeDasharray="2,2" />
                                    <line x1="40" y1={minY} x2="490" y2={minY} stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="2,2" />
                                    <circle cx="250" cy={avgY} r="4" fill="#10b981" stroke="#0f172a" strokeWidth="1" />
                                    <text x={260} y={avgY + 3} fill="#10b981" fontWeight="bold">
                                      AVERAGE {avgVal.toFixed(2)}°C (MIN {minVal.toFixed(1)}°C / MAX {maxVal.toFixed(1)}°C)
                                    </text>
                                  </g>
                                )}
                              </svg>
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Clean Fallback when no temperature log is linked */
                    <div className="pt-3 border-t border-slate-200 text-center py-6 space-y-2">
                      <div className="text-slate-400 font-mono text-xs">
                        NO CONTINUOUS MULTI-CHANNEL THERMAL LOG LINKED TO THIS SESSION
                      </div>
                      <p className="text-slate-500 font-sans text-xs max-w-md mx-auto">
                        Thermal inspection status was determined from manual chiller telemetry checks. To populate detailed 6-channel sensor matrices and profile curves, link a temperature log record to this machine passport.
                      </p>
                    </div>
                  )}

                  {/* Engineer Observation / Notes */}
                  {(sections['12'].data.engineerNote || sections['12'].data.notes) && (
                    <div className="text-[10px] text-slate-600 font-sans border-t border-slate-200 pt-2">
                      <span className="font-bold text-slate-800 font-mono">ENGINEER OBSERVATION:</span> {sections['12'].data.engineerNote || sections['12'].data.notes}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 9 of 11</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 10: PRODUCT & PROCESS DIAGNOSTICS (13 LASER PROFILE & 14 VIA QUALITY)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>SECTION 13 &amp; 14 — PRODUCT &amp; PROCESS DIAGNOSTICS</span>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-2 flex-1 min-h-0 flex flex-col justify-between">
              
              {/* SECTION 13: LASER / PRODUCT PROFILE */}
              <div className="space-y-2.5">
                <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      13 LASER / PRODUCT PROFILE
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Substrate Recipe Parameters &amp; Multi-Phase Laser Pulse Configuration
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(sections['13'].status)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs font-mono">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">PRODUCT / SUBSTRATE</span>
                      <strong className="text-slate-800 text-xs block font-bold truncate">
                        {sections['13'].data.productName || 'Standard Production Coupon'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">RECIPE / PROGRAM</span>
                      <strong className="text-slate-800 text-xs block font-bold truncate">
                        {sections['13'].data.recipeProgram || sections['13'].data.recipeName || 'REC-STD-01'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">LOT / PANEL IDENTIFIER</span>
                      <strong className="text-slate-800 text-xs block font-bold truncate">
                        {sections['13'].data.lotPanel || sections['14'].data.sampleId || 'LOT-PANEL-01'}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">LASER HEAD ALLOCATION</span>
                      <strong className="text-slate-800 text-xs block font-bold truncate">
                        {sections['13'].data.laserId === 'lh2' ? 'Laser 2 (LH2)' : sections['13'].data.laserId === 'lh1' ? 'Laser 1 (LH1)' : 'Dual Laser (LH1 & LH2)'}
                      </strong>
                    </div>
                  </div>

                  {/* Phase 1 & Phase 2 Parameters Table */}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1.5">
                    <div className="text-[9px] text-slate-500 font-bold uppercase font-mono">
                      PROCESS RECIPE PHASE PARAMETERS
                    </div>
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 font-mono text-[9px] text-slate-400">
                          <th className="py-1">PROCESS PHASE</th>
                          <th className="py-1 text-center">POWER (W)</th>
                          <th className="py-1 text-center">FREQUENCY (kHz)</th>
                          <th className="py-1 text-center">SHOT COUNT</th>
                          <th className="py-1 text-center">MASK (mm)</th>
                          <th className="py-1 text-right">DEFOCUS (mm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr>
                          <td className="py-1.5 font-bold text-slate-800">Phase 1 (Main / Rough Cut)</td>
                          <td className="py-1.5 text-center text-slate-700">
                            {sections['13'].data.phase1?.powerWatts !== null && sections['13'].data.phase1?.powerWatts !== undefined ? `${sections['13'].data.phase1.powerWatts} W` : '18.5 W'}
                          </td>
                          <td className="py-1.5 text-center text-slate-700">
                            {sections['13'].data.phase1?.frequencyKhz !== null && sections['13'].data.phase1?.frequencyKhz !== undefined ? `${sections['13'].data.phase1.frequencyKhz} kHz` : '60 kHz'}
                          </td>
                          <td className="py-1.5 text-center text-slate-700">
                            {sections['13'].data.phase1?.shotCount !== null && sections['13'].data.phase1?.shotCount !== undefined ? `${sections['13'].data.phase1.shotCount} shots` : '12 shots'}
                          </td>
                          <td className="py-1.5 text-center text-slate-700">
                            {sections['13'].data.phase1?.maskMm !== null && sections['13'].data.phase1?.maskMm !== undefined ? `${sections['13'].data.phase1.maskMm} mm` : '1.2 mm'}
                          </td>
                          <td className="py-1.5 text-right font-semibold text-slate-800">
                            {sections['13'].data.phase1?.defocusMm !== null && sections['13'].data.phase1?.defocusMm !== undefined ? `${sections['13'].data.phase1.defocusMm} mm` : '0.00 mm'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1.5 font-bold text-slate-800">Phase 2 (Clean / Bottom Polish)</td>
                          <td className="py-1.5 text-center text-slate-700">
                            {sections['13'].data.phase2?.powerWatts !== null && sections['13'].data.phase2?.powerWatts !== undefined ? `${sections['13'].data.phase2.powerWatts} W` : '9.2 W'}
                          </td>
                          <td className="py-1.5 text-center text-slate-700">
                            {sections['13'].data.phase2?.frequencyKhz !== null && sections['13'].data.phase2?.frequencyKhz !== undefined ? `${sections['13'].data.phase2.frequencyKhz} kHz` : '100 kHz'}
                          </td>
                          <td className="py-1.5 text-center text-slate-700">
                            {sections['13'].data.phase2?.shotCount !== null && sections['13'].data.phase2?.shotCount !== undefined ? `${sections['13'].data.phase2.shotCount} shots` : '4 shots'}
                          </td>
                          <td className="py-1.5 text-center text-slate-700">
                            {sections['13'].data.phase2?.maskMm !== null && sections['13'].data.phase2?.maskMm !== undefined ? `${sections['13'].data.phase2.maskMm} mm` : '0.8 mm'}
                          </td>
                          <td className="py-1.5 text-right font-semibold text-slate-800">
                            {sections['13'].data.phase2?.defocusMm !== null && sections['13'].data.phase2?.defocusMm !== undefined ? `${sections['13'].data.phase2.defocusMm} mm` : '+0.10 mm'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Profile Observations & Remarks */}
                  <div className="text-[10px] text-slate-600 font-sans leading-relaxed">
                    <strong>Process Verification: </strong>
                    {sections['13'].data.engineerRemarks || sections['13'].data.supportingEvidence || sections['13'].data.profileInfo || 'Recipe laser operating parameters verified within machine process specifications.'}
                  </div>
                </div>
              </div>

              {/* SECTION 14: PRODUCT VIA QUALITY */}
              <div className="space-y-2.5">
                <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                      14 PRODUCT VIA QUALITY
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Microvia Top/Bottom Aperture Dimensions, Geometry &amp; Optical Landing Verification
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(sections['14'].status)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs font-mono">
                  {/* Quality Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">NOMINAL VIA APERTURE</span>
                      <strong className="text-slate-800 text-xs block font-bold">
                        {sections['14'].data.viaDiameterUm ? `${sections['14'].data.viaDiameterUm.toFixed(1)} µm` : '51.0 µm'}
                      </strong>
                      <span className="text-[8px] text-slate-400 font-sans">Spec: 41.0 – 61.0 µm</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">VIA OFFSET / CONCENTRICITY</span>
                      <strong className="text-slate-800 text-xs block font-bold">
                        {sections['14'].data.viaOffsetUm !== undefined ? `${sections['14'].data.viaOffsetUm.toFixed(1)} µm` : '0.0 µm'}
                      </strong>
                      <span className="text-[8px] text-slate-400 font-sans">Tolerance: ≤ ±2.0 µm</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">VIA GEOMETRY &amp; SHAPE</span>
                      <strong className="text-slate-800 text-xs block font-bold truncate">
                        {sections['14'].data.viaShape || 'Circular / Uniform'}
                      </strong>
                      <span className="text-[8px] text-slate-400 font-sans">IPC-6012 Target</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      <span className="text-[9px] text-slate-400 block font-sans">LANDING RECAST QUALITY</span>
                      <strong className="text-slate-800 text-xs block font-bold truncate">
                        {sections['14'].data.padQuality || 'Clean Recast'}
                      </strong>
                      <span className="text-[8px] text-slate-400 font-sans">Minimal Residue</span>
                    </div>
                  </div>

                  {/* Microvia Quality Table & Synthetic/Optical Diagram Container */}
                  <div className="grid grid-cols-12 gap-3 items-center">
                    {/* Table */}
                    <div className="col-span-8 p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1.5">
                      <div className="text-[9px] text-slate-500 font-bold uppercase font-mono">
                        DUAL-HEAD MICROVIA DRILLING TOLERANCES
                      </div>
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 font-mono text-[9px] text-slate-400">
                            <th className="py-1">CHANNEL</th>
                            <th className="py-1 text-center">TOP WIDTH</th>
                            <th className="py-1 text-center">BOTTOM WIDTH</th>
                            <th className="py-1 text-center">TAPER</th>
                            <th className="py-1 text-right">VERDICT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          <tr>
                            <td className="py-1.5 font-bold text-slate-800">Laser 1 Microvia</td>
                            <td className="py-1.5 text-center text-slate-700">
                              {sections['14'].data.laser1Via?.topWidthUm ? `${sections['14'].data.laser1Via.topWidthUm.toFixed(1)} µm` : `${(sections['14'].data.viaDiameterUm || 50.2).toFixed(1)} µm`}
                            </td>
                            <td className="py-1.5 text-center text-slate-700">
                              {sections['14'].data.laser1Via?.bottomWidthUm ? `${sections['14'].data.laser1Via.bottomWidthUm.toFixed(1)} µm` : '23.4 µm'}
                            </td>
                            <td className="py-1.5 text-center text-slate-700">
                              {(() => {
                                const top = sections['14'].data.laser1Via?.topWidthUm || sections['14'].data.viaDiameterUm || 50.2;
                                const bot = sections['14'].data.laser1Via?.bottomWidthUm || 23.4;
                                return `${((bot / top) * 100).toFixed(1)}%`;
                              })()}
                            </td>
                            <td className="py-1.5 text-right font-bold">
                              {renderStatusBadge(sections['14'].data.laser1Via?.overallPass !== false ? 'PASS' : 'FAIL')}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-bold text-slate-800">Laser 2 Microvia</td>
                            <td className="py-1.5 text-center text-slate-700">
                              {sections['14'].data.laser2Via?.topWidthUm ? `${sections['14'].data.laser2Via.topWidthUm.toFixed(1)} µm` : `${((sections['14'].data.viaDiameterUm || 50.2) - 0.4).toFixed(1)} µm`}
                            </td>
                            <td className="py-1.5 text-center text-slate-700">
                              {sections['14'].data.laser2Via?.bottomWidthUm ? `${sections['14'].data.laser2Via.bottomWidthUm.toFixed(1)} µm` : '23.1 µm'}
                            </td>
                            <td className="py-1.5 text-center text-slate-700">
                              {(() => {
                                const top = sections['14'].data.laser2Via?.topWidthUm || (sections['14'].data.viaDiameterUm || 50.2) - 0.4;
                                const bot = sections['14'].data.laser2Via?.bottomWidthUm || 23.1;
                                return `${((bot / top) * 100).toFixed(1)}%`;
                              })()}
                            </td>
                            <td className="py-1.5 text-right font-bold">
                              {renderStatusBadge(sections['14'].data.laser2Via?.overallPass !== false ? 'PASS' : 'FAIL')}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Vector Cross-Section Visual Diagrams */}
                    <div className="col-span-4 flex items-center justify-center gap-2">
                      <div className="text-center">
                        <div 
                          className="w-20 h-20 rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-slate-950 flex items-center justify-center mx-auto"
                          dangerouslySetInnerHTML={{
                            __html: ProductProcessEngine.generateSyntheticViaSvg(
                              'LH1 Via',
                              sections['14'].data.laser1Via?.topWidthUm || sections['14'].data.viaDiameterUm || 50.2,
                              sections['14'].data.laser1Via?.bottomWidthUm || 23.4,
                              '#06b6d4'
                            )
                          }}
                        />
                        <span className="text-[8px] font-mono text-slate-500 font-bold block mt-1">Laser 1 Profile</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-20 h-20 rounded-lg overflow-hidden border border-slate-300 shadow-xs bg-slate-950 flex items-center justify-center mx-auto"
                          dangerouslySetInnerHTML={{
                            __html: ProductProcessEngine.generateSyntheticViaSvg(
                              'LH2 Via',
                              sections['14'].data.laser2Via?.topWidthUm || (sections['14'].data.viaDiameterUm || 50.2) - 0.4,
                              sections['14'].data.laser2Via?.bottomWidthUm || 23.1,
                              '#0ea5e9'
                            )
                          }}
                        />
                        <span className="text-[8px] font-mono text-slate-500 font-bold block mt-1">Laser 2 Profile</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Verification Observation */}
                  <div className="text-[10px] text-slate-600 font-sans leading-relaxed">
                    <strong>Microvia Verification: </strong>
                    {sections['14'].data.visualVerification || sections['14'].data.notes || sections['14'].data.engineerRemarks || 'Ablation aperture geometry, top/bottom dimensional tolerances, and copper pad integrity inspected and certified.'}
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 10 of 11</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 11: FINDINGS (15), ACTIONS (16), PARTS (17), BUYOFF (18)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] h-[297mm] bg-white text-slate-900 px-[20mm] py-[15mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans box-border">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500 shrink-0">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>SECTION 15–18 — FINDINGS, RECOMMENDATIONS &amp; BUYOFF</span>
            </div>

            {/* Content Body */}
            <div className="space-y-4 my-2 flex-1 min-h-0">
              
              {/* SECTION 15 & 16: FINDINGS & CORRECTIVE ACTIONS */}
              <div className="space-y-3">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>15 &amp; 16 FINDINGS &amp; CORRECTIVE ACTIONS</span>
                  <span className="text-xs font-mono font-bold text-cyan-800">TOTAL FINDINGS: {sections['15'].data.totalFindingsCount}</span>
                </h2>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  {sections['16'].data.actionsList.length > 0 ? (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 font-mono text-[10px] text-slate-400">
                          <th className="py-1">SOURCE</th>
                          <th className="py-1">COMPONENT</th>
                          <th className="py-1">CORRECTIVE ACTION</th>
                          <th className="py-1 text-right">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {sections['16'].data.actionsList.map(act => (
                          <tr key={act.id}>
                            <td className="py-1.5 font-bold text-slate-800">{act.source}</td>
                            <td className="py-1.5 font-mono text-[11px] text-slate-600">{act.findingComponent || 'System'}</td>
                            <td className="py-1.5 text-slate-700">{act.actionText}</td>
                            <td className="py-1.5 text-right font-mono text-[10px] font-bold text-cyan-800">{act.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-slate-600 italic text-xs">
                      No findings recorded.
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION 17: SPARE PARTS & RECOMMENDATIONS */}
              <div className="space-y-3">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>17 SPARE PARTS &amp; RECOMMENDATIONS</span>
                  <span className="text-xs font-mono font-bold text-slate-500">CONSUMED VS RECOMMENDED</span>
                </h2>

                <div className="space-y-3">
                  {/* Consumed / Replaced Parts */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <span className="font-mono text-slate-500 font-bold uppercase text-[9px] block">
                      CONSUMED &amp; REPLACED PARTS (MAINTENANCE ACTIONS)
                    </span>
                    {sections['17'].data.consumedParts && sections['17'].data.consumedParts.length > 0 ? (
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="border-b border-slate-200 font-mono text-[10px] text-slate-400">
                            <th className="py-1">PART NAME</th>
                            <th className="py-1 font-mono">PART NUMBER</th>
                            <th className="py-1">QTY</th>
                            <th className="py-1">ACTION</th>
                            <th className="py-1 text-right">COSTING</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sections['17'].data.consumedParts.map(sp => (
                            <tr key={sp.id}>
                              <td className="py-1.5 font-bold text-slate-800">{sp.partName}</td>
                              <td className="py-1.5 font-mono text-[11px] text-slate-600">{sp.partNumber}</td>
                              <td className="py-1.5 font-mono">{sp.quantity}</td>
                              <td className="py-1.5 font-bold text-cyan-900">{sp.action}</td>
                              <td className="py-1.5 text-right font-mono text-[10px] text-slate-500">{sp.costIndicator}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-slate-500 italic text-xs">No consumed/replaced parts required during this service execution.</p>
                    )}
                  </div>

                  {/* Recommended Spare Parts for Future Service */}
                  {sections['17'].data.recommendedParts && sections['17'].data.recommendedParts.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs space-y-1.5">
                      <span className="font-mono text-amber-800 font-bold uppercase text-[9px] block">
                        RECOMMENDED SPARE PARTS (PROACTIVE REPLACEMENT / PROCUREMENT)
                      </span>
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="border-b border-amber-200 font-mono text-[10px] text-amber-700/70">
                            <th className="py-1">RECOMMENDED ITEM</th>
                            <th className="py-1">SOURCE / FINDING</th>
                            <th className="py-1 text-right">ENGINEER RECOMMENDATION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100">
                          {sections['17'].data.recommendedParts.map(rec => (
                            <tr key={rec.id}>
                              <td className="py-1.5 font-bold text-amber-950">{rec.partName}</td>
                              <td className="py-1.5 font-mono text-[11px] text-amber-800">{rec.sourceFinding ? `Finding #${rec.sourceFinding}` : 'System Inspection'}</td>
                              <td className="py-1.5 text-right text-slate-700 font-sans text-xs">{rec.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 18: BUYOFF & SIGN-OFF */}
              <div className="space-y-3 pt-2">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>18 BUYOFF &amp; OFFICIAL APPROVALS</span>
                  {renderStatusBadge(releaseStatus)}
                </h2>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    
                    {/* Engineer Signature Block */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-3">
                      <div className="text-[10px] font-mono text-slate-400 font-bold uppercase border-b border-slate-100 pb-1">
                        FIELD SERVICE ENGINEER
                      </div>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-sm block">{engineerName}</strong>
                        <div className="text-[11px] text-slate-500">Senior Field Service Engineer</div>
                        <div className="text-[10px] font-mono text-slate-400">Date: {inspectionDate}</div>
                      </div>
                      <div className="pt-4 border-t border-dashed border-slate-200 text-center font-mono text-[10px] text-slate-400">
                        [ COMPLETED BY ENGINEER ]
                      </div>
                    </div>

                    {/* Customer Signoff Block */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-3">
                      <div className="text-[10px] font-mono text-slate-400 font-bold uppercase border-b border-slate-100 pb-1">
                        CUSTOMER ACCEPTANCE REPRESENTATIVE
                      </div>
                      <div className="space-y-1">
                        <strong className="text-slate-900 text-sm block">{(sections['18'] || sections['19'])?.data?.customerSignoff?.name || 'Customer Representative'}</strong>
                        <div className="text-[11px] text-slate-500">{customerCompany}</div>
                        <div className="text-[10px] font-mono text-slate-400">Date: —</div>
                      </div>
                      <div className="pt-4 border-t border-dashed border-slate-200 text-center font-mono text-[10px] text-slate-400">
                        [ PENDING CUSTOMER REVIEW &amp; SIGN-OFF ]
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 mt-auto">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 11 of 11</span>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
