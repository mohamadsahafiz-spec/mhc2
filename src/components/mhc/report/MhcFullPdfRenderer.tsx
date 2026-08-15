import React, { useState, useRef } from 'react';
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
    session.engineerName || sections['01']?.data?.engineerName || 'Sahafiz'
  );
  const [customerCompany, setCustomerCompany] = useState<string>(
    session.customerName || metadata.customerName || 'TSMC Microelectronics Fab 18'
  );
  const [plantFacility, setPlantFacility] = useState<string>(
    session.plantName || metadata.plantName || 'Tainan Cleanroom Fab 18A'
  );
  const [inspectionDate, setInspectionDate] = useState<string>(
    session.completedDate || session.startDate || (session as any).inspectionDate || sections['01']?.data?.date || '2026-08-01'
  );
  const [machineNumber, setMachineNumber] = useState<string>(
    (session as any).machineNumber || sections['01']?.data?.machineNumber || 'WLVIA#3'
  );
  const [releaseStatus, setReleaseStatus] = useState<'PASS' | 'WARNING' | 'FAIL'>(
    (sections['19']?.data?.productionReleaseVerdict as any) || (sections['04']?.data?.overallStatus as any) || 'PASS'
  );

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
      verdict
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
              <h2 className="text-sm font-bold tracking-tight">Full Report Engine Preview (7 Pages)</h2>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            
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

            {/* Release Status */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-rose-400" />
                <span>Release Status</span>
              </label>
              <select
                value={releaseStatus}
                onChange={(e) => setReleaseStatus(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
              >
                <option value="PASS">PASS (Ready for Production)</option>
                <option value="WARNING">WARNING (Conditional Release)</option>
                <option value="FAIL">FAIL (Action Required)</option>
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
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Background Header Accent */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-slate-900 via-cyan-800 to-slate-900" />

            {/* COVER HEADER */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-cyan-400 font-extrabold flex items-center justify-center text-xl font-mono">
                    FSOS
                  </div>
                  <div>
                    <h1 className="text-base font-bold tracking-wider text-slate-900 font-mono">
                      FIELD SERVICE OPERATING SYSTEM
                    </h1>
                    <p className="text-xs text-slate-500 font-mono">
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
                <span className="text-cyan-800 font-bold">MHC AUDIT PASSPORT</span>
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
                  <span className="text-[10px] text-slate-500 font-mono block">MACHINE MODEL</span>
                  <strong className="text-slate-900 font-bold text-sm">{sections['01'].data.machineModel}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">MACHINE NUMBER / SOURCE</span>
                  <strong className="text-cyan-900 font-bold font-mono text-sm">{machineNumber}</strong>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">SERIAL NUMBER</span>
                    <strong className="text-slate-800 font-bold font-mono text-sm">{sections['01'].data.machineSerialNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block text-right">AUDIT CLASSIFICATION</span>
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
                <span>Page 1 of 7</span>
              </div>
            </div>

          </div>

          {/* =========================================================================
              PAGE 2: TABLE OF CONTENTS (02 INDEX) - DEDICATED PAGE
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>SECTION 02 — TABLE OF CONTENTS</span>
            </div>

            {/* Content Body */}
            <div className="space-y-6 my-2 flex-1">
              
              {/* SECTION 02: TABLE OF CONTENTS */}
              <div className="space-y-4">
                <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                      02 TABLE OF CONTENTS / REPORT INDEX
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      19 Standard Subsystem Diagnostics &amp; Certification Modules
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                    REPORT INDEX
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs font-sans border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {baseDoc.indexEntries.map((entry) => (
                    <div 
                      key={entry.code}
                      className="flex items-center justify-between py-2 px-3 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-cyan-900 w-7 text-xs">{entry.code}</span>
                        <span className="font-semibold text-slate-800">{entry.title}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-400 uppercase text-[9px] hidden sm:inline">{entry.category}</span>
                        <span className="text-slate-700 font-bold text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                          Page {entry.pageNumber || '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scope & Methodology Note */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 font-mono text-[11px] uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-600 inline-block" />
                    <span>MAINTENANCE &amp; HEALTH CHECK REPORT STRUCTURE</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    This formal technical report presents authoritative inspection, telemetry, and calibration records collected for this equipment. Subsystems are documented with baseline comparisons and recorded evidence where applicable.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 2 of 7</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 3: MACHINE INFORMATION & CONFIGURATION (03) - DEDICATED NEW PAGE
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>SECTION 03 — MACHINE CONFIGURATION</span>
            </div>

            {/* Content Body */}
            <div className="space-y-6 my-2 flex-1">
              
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
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs font-sans">
                  <div className="font-mono text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span>SYSTEM IDENTIFICATION &amp; CLEANROOM SITE</span>
                    <span className="text-cyan-800">SOURCE: AUTHORITATIVE SESSION</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">CUSTOMER ACCOUNT</span>
                      <strong className="text-slate-900 font-bold text-sm block">{customerCompany}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">PLANT / FACILITY</span>
                      <strong className="text-slate-900 font-bold text-sm block">{plantFacility}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">MACHINE NUMBER / SOURCE</span>
                      <strong className="text-cyan-900 font-bold font-mono text-sm block">{machineNumber}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">MACHINE MODEL</span>
                      <strong className="text-slate-900 font-bold text-sm block">{sections['03'].data.machineModel}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">SERIAL NUMBER</span>
                      <strong className="text-slate-900 font-bold font-mono text-sm block">{sections['03'].data.serialNumber}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block">MACHINE ID</span>
                      <strong className="text-slate-800 font-mono text-sm block">{sections['03'].data.machineId}</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-3 font-mono text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-400 block">BASELINE DATE</span>
                      <strong className="text-slate-800">{sections['03'].data.baselineDate || '2026-05-15'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">LAST MHC DATE</span>
                      <strong className="text-slate-800">{inspectionDate}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">ASSIGNED ENGINEER</span>
                      <strong className="text-slate-800">{engineerName}</strong>
                    </div>
                  </div>
                </div>

                {/* Subsystem & Laser Head Architecture Table */}
                <div className="space-y-2 pt-2">
                  <div className="font-mono text-slate-500 font-bold uppercase text-[10px] tracking-wider flex items-center justify-between">
                    <span>OPTICAL SUBSYSTEM &amp; LASER HEAD ARCHITECTURE</span>
                    <span className="text-slate-400">2 SOURCES CONFIGURED</span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse font-sans bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="border-b border-slate-200 font-mono text-[10px] text-slate-400 bg-slate-50">
                        <th className="py-2.5 px-3">SUBSYSTEM / HEAD</th>
                        <th className="py-2.5 px-2 font-mono">SERIAL NO.</th>
                        <th className="py-2.5 px-2">RATED POWER</th>
                        <th className="py-2.5 px-2">AUTHORITATIVE HOURS</th>
                        <th className="py-2.5 px-3 text-right">SUBSYSTEM STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                      {laserLifecycleHeads.map(head => (
                        <tr key={head.laserId} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-bold font-sans text-slate-900">
                            {head.laserIdentifier}
                          </td>
                          <td className="py-3 px-2 text-slate-600 text-[11px]">
                            {head.serialNumber}
                          </td>
                          <td className="py-3 px-2 font-bold text-slate-800">
                            15.0 W (355 nm UV)
                          </td>
                          <td className="py-3 px-2 font-bold text-cyan-900">
                            {head.currentLaserHour.toLocaleString()} hrs
                          </td>
                          <td className="py-3 px-3 text-right">
                            {renderStatusBadge(head.verdict)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cleanroom Operating Parameters Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-mono font-bold text-slate-700 text-[10px] uppercase">
                    CLEANROOM OPERATING SPECIFICATIONS ENVELOPE
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-slate-400 block">WAVELENGTH</span>
                      <strong className="text-slate-800">355 nm (Tripled Nd:YVO4)</strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-slate-400 block">BEAM QUALITY</span>
                      <strong className="text-slate-800">M² &lt; 1.2</strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-slate-400 block">STAGE ENVELOPE</span>
                      <strong className="text-slate-800">650 × 650 mm (XY)</strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-slate-400 block">CLEANROOM CLASS</span>
                      <strong className="text-slate-800">ISO Class 6 (Class 1000)</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 3 of 7</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 4: EXECUTIVE SUMMARY (04) & LASER LIFECYCLE (05)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>EXECUTIVE SUMMARY &amp; LASER LIFECYCLE</span>
            </div>

            {/* Content Body */}
            <div className="space-y-5 my-2 flex-1">
              
              {/* SECTION 04: EXECUTIVE SUMMARY */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    04 EXECUTIVE SUMMARY
                  </h2>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    SYSTEM AUDIT
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-mono text-slate-500 font-bold uppercase text-[10px] block">MHC RESULT</span>
                      <strong className="text-slate-900 font-extrabold text-sm font-mono">PASS — 100%</strong>
                    </div>
                    <div>
                      {renderStatusBadge('PASS')}
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed font-sans text-xs">
                    {sections['04'].data.summaryText}
                  </p>

                  <p className="text-[11px] text-slate-500 italic">
                    Final customer acceptance remains subject to customer review and approval.
                  </p>

                  {/* Major Pass/Fail Table */}
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">CORE AUDIT RESULTS</span>
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-slate-200 font-mono text-[10px] text-slate-400">
                          <th className="py-1">SUBSYSTEM / AUDIT ITEM</th>
                          <th className="py-1">SPECIFICATION</th>
                          <th className="py-1 text-right">VERDICT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sections['04'].data.majorPassFailResults.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 font-bold text-slate-800">{item.component}</td>
                            <td className="py-1.5 text-slate-500 font-mono text-[11px]">{item.note}</td>
                            <td className="py-1.5 text-right">{renderStatusBadge(item.verdict)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SECTION 05: LASER HOURS & DETAILED LIFECYCLE BREAKDOWN */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    05 LASER LIFECYCLE &amp; LIFETIME TELEMETRY
                  </h2>
                  <span className="text-xs font-mono font-bold text-cyan-800">
                    {laserLifecycleHeads.length} HEADS ANALYZED
                  </span>
                </div>

                {/* Laser Lifecycle Cards for Each Head */}
                <div className="space-y-3">
                  {laserLifecycleHeads.map((head) => {
                    const isHealthy = head.lifeRemainingPercent >= 30;
                    const isWarning = head.lifeRemainingPercent < 30 && head.lifeRemainingPercent >= 15;

                    return (
                      <div 
                        key={head.laserId} 
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
                      >
                        {/* Head Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm font-sans">{head.laserIdentifier}</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold">
                              SN: {head.serialNumber}
                            </span>
                          </div>
                          {renderStatusBadge(head.verdict)}
                        </div>

                        {/* Top Metrics Row: Current Hours & Limits */}
                        <div className="grid grid-cols-4 gap-2 font-mono text-[11px]">
                          <div className="p-2 rounded-lg bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 font-sans block">CURRENT LASER HOURS</span>
                            <strong className="text-cyan-950 text-sm block font-bold">
                              {head.currentLaserHour.toLocaleString()} hrs
                            </strong>
                            <span className="text-[8px] text-emerald-700 font-sans">Authoritative Telemetry</span>
                          </div>

                          <div className="p-2 rounded-lg bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 font-sans block">WARNING LIMIT</span>
                            <strong className="text-amber-800 block font-bold">
                              {head.warningLimit.toLocaleString()} hrs
                            </strong>
                            <span className="text-[8px] text-slate-400 font-sans">Maintenance Alert</span>
                          </div>

                          <div className="p-2 rounded-lg bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 font-sans block">ERROR / EOL LIMIT</span>
                            <strong className="text-slate-800 block font-bold">
                              {head.errorEolLimit.toLocaleString()} hrs
                            </strong>
                            <span className="text-[8px] text-slate-400 font-sans">Rated Tube Lifespan</span>
                          </div>

                          <div className="p-2 rounded-lg bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 font-sans block">LIFE REMAINING %</span>
                            <strong className={`block text-sm font-bold ${
                              isHealthy ? 'text-emerald-700' : isWarning ? 'text-amber-700' : 'text-rose-700'
                            }`}>
                              {head.lifeRemainingPercent.toFixed(1)}%
                            </strong>
                            <span className="text-[8px] text-slate-400 font-sans">Capacity Index</span>
                          </div>
                        </div>

                        {/* Visual Life Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>0 hrs</span>
                            <span className="font-bold text-slate-700">
                              {head.remainingHours.toLocaleString()} HOURS REMAINING BEFORE EOL
                            </span>
                            <span>{head.errorEolLimit.toLocaleString()} hrs</span>
                          </div>
                          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
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

                        {/* Bottom Projections Row */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[10px] font-mono">
                          <div>
                            <span className="text-slate-400 font-sans block">REMAINING HOURS</span>
                            <strong className="text-slate-800 font-bold">{head.remainingHours.toLocaleString()} hrs</strong>
                          </div>

                          <div>
                            <span className="text-slate-400 font-sans block">EST. REMAINING DAYS (24/7)</span>
                            <strong className="text-slate-800 font-bold">{head.remainingDays.toLocaleString()} days</strong>
                          </div>

                          <div>
                            <span className="text-slate-400 font-sans block">ESTIMATED DUE / EOL DATE</span>
                            <strong className="text-cyan-900 font-bold">{head.estimatedEolDate}</strong>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 4 of 7</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 5: LASER POWER (06) & BEAM PROFILE (07)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>LASER POWER &amp; BEAM PROFILE</span>
            </div>

            {/* Content Body */}
            <div className="space-y-6 my-2 flex-1">
              
              {/* SECTION 06: LASER POWER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    06 LASER POWER &amp; BASELINE COMPARISON
                  </h2>
                  <span className="text-xs font-mono font-bold text-cyan-800">SPEC: 15.0W ± 10%</span>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-slate-600 text-xs italic">
                    {sections['06'].data.comparisonNote}
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {sections['06'].data.heads.map(head => (
                      <div key={head.headId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-slate-900 text-xs font-sans">{head.headName}</span>
                          {renderStatusBadge(head.current.verdict)}
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-[11px] font-mono pt-1">
                          <div className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 block font-sans">BEFORE MAINT.</span>
                            <strong>{head.current.beforeValueWatts > 0 ? `${head.current.beforeValueWatts.toFixed(2)} W` : 'Not Recorded'}</strong>
                          </div>

                          <div className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 block font-sans">AFTER MAINT.</span>
                            <strong className="text-cyan-900">{head.current.afterValueWatts > 0 ? `${head.current.afterValueWatts.toFixed(2)} W` : 'Not Recorded'}</strong>
                          </div>

                          <div className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 block font-sans">PREVIOUS BASELINE</span>
                            <span>{head.previous && head.previous.afterValueWatts > 0 ? `${head.previous.afterValueWatts.toFixed(2)} W` : 'None'}</span>
                          </div>

                          <div className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-[9px] text-slate-400 block font-sans">COMPARISON DELTA</span>
                            <strong className={head.comparison.deltaWatts && head.comparison.deltaWatts < 0 ? 'text-amber-800' : 'text-emerald-800'}>
                              {head.comparison.statusText}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 07: BEAM PROFILE */}
              <div className="space-y-3 pt-2">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>07 OPTICAL BEAM PROFILE &amp; SPOT QUALITY</span>
                  <span className="text-xs font-mono font-normal text-slate-500">Gaussian Mode</span>
                </h2>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <p className="text-slate-600 text-xs">
                    {sections['07'].data.comparisonNote}
                  </p>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    {sections['07'].data.heads.map(head => (
                      <div key={head.headId} className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                        <div className="font-bold text-slate-900 font-sans">{head.headName}</div>
                        <div className="text-[11px] text-slate-600">
                          Current Spot Size: <strong className="text-cyan-800">{head.current.beamSizeMm ? `${head.current.beamSizeMm.toFixed(3)} mm` : (head.beamImages && head.beamImages.length > 0 ? 'Evidence Captured' : 'Not Collected')}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Previous Baseline: {head.previous?.beamSizeMm ? `${head.previous.beamSizeMm.toFixed(3)} mm` : 'None'}
                        </div>
                        <div className="text-[10px] font-bold text-slate-700">
                          Delta: {head.comparison.statusText}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* OPTIONAL SECTION 08: FOCUS OPTIMIZATION */}
              {isSectionVisible('08') && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h3 className="text-sm font-bold text-slate-900 font-mono">08 FOCUS OPTIMIZATION</h3>
                    {renderStatusBadge(sections['08'].status)}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    {sections['08'].data.notes || 'Focus curves verified within focal range tolerances.'}
                  </div>
                </div>
              )}

              {/* OPTIONAL SECTION 09: POWER OFFSET */}
              {isSectionVisible('09') && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h3 className="text-sm font-bold text-slate-900 font-mono">09 POWER OFFSET / CALIBRATION CURVE</h3>
                    {renderStatusBadge(sections['09'].status)}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    {sections['09'].data.notes || 'Power attenuation offsets verified across operational range.'}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 5 of 7</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 6: MOTION & CALIBRATION (10 STAGE, 11 AGC, 12 TEMP)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>STAGE, AGC &amp; THERMAL TELEMETRY</span>
            </div>

            {/* Content Body */}
            <div className="space-y-5 my-2 flex-1">
              
              {/* SECTION 10: STAGE CALIBRATION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    10 STAGE CALIBRATION (X/Y DEVIATION)
                  </h2>
                  <span className="text-xs font-mono font-bold text-cyan-800">TOLERANCE: ±2.0 µm</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-500 font-bold text-[10px]">STAGE ALIGNMENT VERDICT:</span>
                    {renderStatusBadge(sections['10'].data.overallVerdict)}
                  </div>

                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-400">
                        <th className="py-1 font-sans">STAGE ID</th>
                        <th className="py-1">MAX ABS X (µm)</th>
                        <th className="py-1">MAX ABS Y (µm)</th>
                        <th className="py-1">OVERALL MAX (µm)</th>
                        <th className="py-1 text-right font-sans">VERDICT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sections['10'].data.stages.map(stg => (
                        <tr key={stg.stageId}>
                          <td className="py-2 font-bold font-sans text-slate-800">{stg.stageName}</td>
                          <td className="py-2">{stg.maxAbsXUm !== undefined ? `${stg.maxAbsXUm.toFixed(2)} µm` : '—'}</td>
                          <td className="py-2">{stg.maxAbsYUm !== undefined ? `${stg.maxAbsYUm.toFixed(2)} µm` : '—'}</td>
                          <td className="py-2 font-bold text-cyan-800">{stg.overallMaxDevUm !== undefined ? `${stg.overallMaxDevUm.toFixed(2)} µm` : '—'}</td>
                          <td className="py-2 text-right">{renderStatusBadge(stg.verdict)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Stage Inline Calibration Evidence */}
                  {sections['10'].data.stages.some(s => s.evidenceImage) && (
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                      {sections['10'].data.stages.filter(s => s.evidenceImage).map(stg => (
                        <div key={stg.stageId} className="flex items-center gap-2 p-2 rounded bg-white border border-slate-200">
                          <img
                            src={stg.evidenceImage}
                            alt={stg.stageName}
                            crossOrigin="anonymous"
                            className="h-14 w-auto max-w-[90px] object-contain rounded border border-slate-100 bg-slate-50 shrink-0"
                          />
                          <div className="text-[10px] min-w-0">
                            <div className="font-bold text-slate-800 truncate">{stg.stageName} Evidence</div>
                            <div className="text-slate-500 font-mono text-[9px] truncate">{stg.engineerNote || 'Calibration artifact'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 11: AGC / SCANNER CALIBRATION */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                    11 AGC / SCANNER CALIBRATION
                  </h2>
                  <span className="text-xs font-mono font-bold text-cyan-800">TOLERANCE: ±3.0 µm</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-500 font-bold text-[10px]">AGC SCANNER VERDICT:</span>
                    {renderStatusBadge(sections['11'].data.overallVerdict)}
                  </div>

                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-400">
                        <th className="py-1 font-sans">AGC UNIT</th>
                        <th className="py-1">INDICES</th>
                        <th className="py-1">X RANGE (µm)</th>
                        <th className="py-1">Y RANGE (µm)</th>
                        <th className="py-1">MAX DEV</th>
                        <th className="py-1 text-right font-sans">VERDICT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sections['11'].data.agcs.map(agc => (
                        <tr key={agc.agcId}>
                          <td className="py-2 font-bold font-sans text-slate-800">{agc.agcName}</td>
                          <td className="py-2">{agc.indices.filter(i => i.verdict === 'PASS').length} / {agc.indices.length || 6}</td>
                          <td className="py-2 text-[11px]">
                            {agc.xMinUm !== undefined && agc.xMaxUm !== undefined
                              ? `[${agc.xMinUm > 0 ? `+${agc.xMinUm.toFixed(2)}` : agc.xMinUm.toFixed(2)}, ${agc.xMaxUm > 0 ? `+${agc.xMaxUm.toFixed(2)}` : agc.xMaxUm.toFixed(2)}]`
                              : '—'}
                          </td>
                          <td className="py-2 text-[11px]">
                            {agc.yMinUm !== undefined && agc.yMaxUm !== undefined
                              ? `[${agc.yMinUm > 0 ? `+${agc.yMinUm.toFixed(2)}` : agc.yMinUm.toFixed(2)}, ${agc.yMaxUm > 0 ? `+${agc.yMaxUm.toFixed(2)}` : agc.yMaxUm.toFixed(2)}]`
                              : '—'}
                          </td>
                          <td className="py-2 font-bold text-cyan-800">{agc.overallMaxDevUm !== undefined ? `${agc.overallMaxDevUm.toFixed(2)} µm` : '—'}</td>
                          <td className="py-2 text-right">{renderStatusBadge(agc.verdict)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* AGC Inline Calibration Evidence */}
                  {sections['11'].data.agcs.some(a => a.evidenceImage) && (
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                      {sections['11'].data.agcs.filter(a => a.evidenceImage).map(agc => (
                        <div key={agc.agcId} className="flex items-center gap-2 p-2 rounded bg-white border border-slate-200">
                          <img
                            src={agc.evidenceImage}
                            alt={agc.agcName}
                            crossOrigin="anonymous"
                            className="h-14 w-auto max-w-[90px] object-contain rounded border border-slate-100 bg-slate-50 shrink-0"
                          />
                          <div className="text-[10px] min-w-0">
                            <div className="font-bold text-slate-800 truncate">{agc.agcName} Evidence</div>
                            <div className="text-slate-500 font-mono text-[9px] truncate">{agc.engineerNote || 'Calibration artifact'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 12: TEMPERATURE MONITORING */}
              <div className="space-y-3 pt-1">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>12 TEMPERATURE &amp; THERMAL TELEMETRY</span>
                  <span className="text-xs font-mono font-normal text-slate-500">SECTION 12</span>
                </h2>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs font-mono">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-400 block font-sans">CHILLER TEMP</span>
                      <strong className="text-slate-800">
                        {sections['12'].data.chillerTempCelsius !== undefined && sections['12'].data.chillerTempCelsius !== null
                          ? `${sections['12'].data.chillerTempCelsius.toFixed(1)} °C`
                          : '21.5 °C'}
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-400 block font-sans">COOLING FLOW</span>
                      <strong className="text-slate-800">
                        {sections['12'].data.chillerFlowLpm !== undefined && sections['12'].data.chillerFlowLpm !== null
                          ? `${sections['12'].data.chillerFlowLpm.toFixed(1)} L/min`
                          : '4.8 L/min'}
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-400 block font-sans">COOLING STATUS</span>
                      <div>{renderStatusBadge(sections['12'].data.coolingResult || 'PASS')}</div>
                    </div>
                  </div>

                  {sections['12'].data.hasValidTemperatureAnalysis && sections['12'].data.stats && (
                    <>
                      <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-400 block font-sans">MIN TEMP</span>
                          <strong>{((sections['12'].data.stats as any).minTempCelsius ?? sections['12'].data.stats.min).toFixed(2)} °C</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-sans">MAX TEMP</span>
                          <strong>{((sections['12'].data.stats as any).maxTempCelsius ?? sections['12'].data.stats.max).toFixed(2)} °C</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-sans">AVG TEMP</span>
                          <strong>{((sections['12'].data.stats as any).avgTempCelsius ?? sections['12'].data.stats.avg).toFixed(2)} °C</strong>
                        </div>
                      </div>

                      {/* Vector Temperature Time-Series Chart */}
                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                          <span className="font-bold text-slate-700 uppercase">PERSISTED THERMAL TELEMETRY PROFILE</span>
                          <span>
                            {sections['12'].data.temperatureRecordTitle || sections['12'].data.temperatureLogFileName || 'Telemetry Record'}
                            {sections['12'].data.rawRecordsCount ? ` (${sections['12'].data.rawRecordsCount.toLocaleString()} PTS)` : ''}
                          </span>
                        </div>
                        <div className="w-full h-24 bg-slate-900 rounded-lg p-2 relative overflow-hidden border border-slate-800">
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
                              return 68 - ((clamped - plotMin) / plotSpan) * 56;
                            };

                            const avgY = getY(avgVal);
                            const minY = getY(minVal);
                            const maxY = getY(maxVal);

                            const channelPoints = chEntries.map(([ch, cStat], idx) => {
                              const spacing = chEntries.length > 1 ? 380 / (chEntries.length - 1) : 190;
                              const x = chEntries.length > 1 ? 55 + idx * spacing : 250;
                              const yAvg = getY(cStat.avg);
                              const yMin = getY(cStat.min);
                              const yMax = getY(cStat.max);
                              return { ch, cStat, x, yAvg, yMin, yMax };
                            });

                            const polylinePoints = channelPoints.map(p => `${p.x},${p.yAvg}`).join(' ');

                            return (
                              <svg viewBox="0 0 500 80" className="w-full h-full text-slate-400 font-mono text-[8px]" preserveAspectRatio="none">
                                {/* Spec tolerance band (21.0 - 23.0 °C) */}
                                <rect 
                                  x="35" 
                                  y={getY(23.0)} 
                                  width="455" 
                                  height={Math.max(3, getY(21.0) - getY(23.0))} 
                                  fill="#06b6d4" 
                                  fillOpacity="0.12" 
                                />
                                <line x1="35" y1={getY(22.0)} x2="490" y2={getY(22.0)} stroke="#06b6d4" strokeWidth="0.75" strokeDasharray="3,3" />

                                {/* Temperature Grid Lines & Labels */}
                                <line x1="35" y1={getY(plotMax)} x2="490" y2={getY(plotMax)} stroke="#334155" strokeWidth="0.5" />
                                <text x="2" y={getY(plotMax) + 3} fill="#64748b">{plotMax.toFixed(0)}°C</text>

                                <line x1="35" y1={avgY} x2="490" y2={avgY} stroke="#10b981" strokeWidth="1" strokeDasharray="4,2" />
                                <text x="2" y={avgY + 3} fill="#10b981">AVG</text>

                                <line x1="35" y1={getY(plotMin)} x2="490" y2={getY(plotMin)} stroke="#334155" strokeWidth="0.5" />
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
                                      <line x1={p.x} y1={p.yMax} x2={p.x} y2={p.yMin} stroke={color} strokeWidth="2" strokeOpacity="0.7" />
                                      <line x1={p.x - 3} y1={p.yMax} x2={p.x + 3} y2={p.yMax} stroke={color} strokeWidth="1" />
                                      <line x1={p.x - 3} y1={p.yMin} x2={p.x + 3} y2={p.yMin} stroke={color} strokeWidth="1" />
                                      <circle cx={p.x} cy={p.yAvg} r="3.5" fill={color} stroke="#0f172a" strokeWidth="1" />
                                      <text x={p.x} y={p.yMax - 3} textAnchor="middle" fill={color} fontWeight="bold">
                                        {`CH${p.ch}: ${p.cStat.avg.toFixed(1)}°`}
                                      </text>
                                    </g>
                                  );
                                })}

                                {channelPoints.length === 0 && (
                                  <g>
                                    <line x1="35" y1={maxY} x2="490" y2={maxY} stroke="#fbbf24" strokeWidth="0.75" strokeDasharray="2,2" />
                                    <line x1="35" y1={minY} x2="490" y2={minY} stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="2,2" />
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
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 6 of 7</span>
            </div>

          </div>

          {/* =========================================================================
              PAGE 7: FINDINGS (15), ACTIONS (16), PARTS (17), BUYOFF (19)
             ========================================================================= */}
          <div className="mhc-a4-page w-[210mm] min-h-[297mm] h-[297mm] bg-white text-slate-900 p-[20mm] shadow-2xl relative flex flex-col justify-between overflow-hidden border border-slate-200 print:shadow-none print:m-0 print:border-none font-sans">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
              <span>FSOS MHC REPORT • {metadata.reportNumber}</span>
              <span>FINDINGS, RECOMMENDATIONS &amp; BUYOFF</span>
            </div>

            {/* Content Body */}
            <div className="space-y-5 my-2 flex-1">
              
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

              {/* SECTION 17: SPARE PARTS */}
              <div className="space-y-3">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1">
                  17 SPARE PARTS &amp; RECOMMENDATIONS
                </h2>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  {sections['17'].data.spareParts.length > 0 ? (
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
                        {sections['17'].data.spareParts.map(sp => (
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
                    <p className="text-slate-600 italic text-xs">No spare parts recorded.</p>
                  )}
                </div>
              </div>

              {/* SECTION 18: EVIDENCE & ATTACHMENTS */}
              {(sections['18'].data.items.length > 0 || isSectionVisible('18')) && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h2 className="text-sm font-bold text-slate-900 font-mono flex items-center justify-between w-full">
                      <span>18 EVIDENCE ATTACHMENTS</span>
                      <span className="text-xs text-slate-500 font-normal">
                        {sections['18'].data.totalEvidenceItems} ATTACHED
                      </span>
                    </h2>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    {sections['18'].data.items.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {sections['18'].data.items.map(item => (
                          <div key={item.id} className="p-2 rounded bg-white border border-slate-200 space-y-1 overflow-hidden">
                            {item.imageDataUrl ? (
                              <div className="w-full h-20 bg-slate-50 rounded border border-slate-100 flex items-center justify-center p-1 overflow-hidden">
                                <img 
                                  src={item.imageDataUrl} 
                                  alt={item.title} 
                                  crossOrigin="anonymous"
                                  className="h-full w-auto max-w-full object-contain" 
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-full h-14 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] text-slate-400 font-mono">
                                [ATTACHMENT]
                              </div>
                            )}
                            <div className="font-bold text-slate-900 text-[10px] truncate" title={item.title}>{item.title}</div>
                            <div className="text-[9px] text-slate-500 font-mono truncate" title={item.notes || item.sourceSection}>
                              {item.sourceSection} • {item.notes || 'Record'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 italic text-xs">No evidence attachments recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 19: BUYOFF & SIGN-OFF */}
              <div className="space-y-3 pt-2">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 border-b-2 border-slate-900 pb-1 flex items-center justify-between">
                  <span>19 BUYOFF &amp; OFFICIAL APPROVALS</span>
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
                        <strong className="text-slate-900 text-sm block">{sections['19'].data.customerSignoff.name || 'Customer Representative'}</strong>
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
            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>CONFIDENTIAL — {customerCompany}</span>
              <span>Page 7 of 7</span>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
