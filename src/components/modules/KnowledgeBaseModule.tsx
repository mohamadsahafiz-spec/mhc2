import React, { useState } from 'react';
import { BookOpen, Search, FileText, AlertTriangle, ChevronRight, CheckCircle2, ShieldCheck, Download, ExternalLink, Wrench, Clock, FileCheck } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

interface SOPItem {
  code: string;
  title: string;
  category: string;
  readTime: string;
  lastUpdated: string;
  summary: string;
  steps: string[];
  requiredTools: string[];
  safetyClass: string;
}

export const KnowledgeBaseModule: React.FC = () => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeSop, setActiveSop] = useState<SOPItem | null>(null);

  const sops: SOPItem[] = [
    {
      code: 'SOP-LSR-001',
      title: 'TRUMPF TruMicro 7000 Series Cleanroom ISO 4 Gowning & Safety Protocol',
      category: 'Laser Safety',
      readTime: '8 min',
      lastUpdated: '2026-06-15',
      summary: 'Mandatory ISO Class 4 gowning, electrostatic discharge (ESD) grounding, and Class 4 High-Power Laser Safety curtain interlock entry procedures.',
      safetyClass: 'Class 4 Laser / ISO 4 Cleanroom',
      requiredTools: ['ESD Wrist Strap', 'Laser Safety Eyewear (OD 7+ @ 1030nm)', 'Cleanroom Nitrile Gloves', 'Particulate Counter'],
      steps: [
        'Perform 30-second air shower cycle before entering primary gowning anteroom.',
        'Don ESD-rated booties, cleanroom hood, and full coveralls in sequence according to top-down rule.',
        'Verify laser keylock is in SECURE/OFF position before entering the main processing enclosure.',
        'Inspect Class 4 laser safety curtains for optical pinholes or thermal degradation.',
        'Power on ambient particulate counter and confirm cleanroom particle count is below 10 particles/m³ (>0.5µm).'
      ]
    },
    {
      code: 'SOP-CAL-004',
      title: 'Galvanometer Scanning Motor Gain Realignment & Field Distortion Correction',
      category: 'Calibration',
      readTime: '12 min',
      lastUpdated: '2026-07-10',
      summary: 'Precision calibration of dual-axis galvanometer motor feedback gains, field grid distortion matrix mapping, and step response latency adjustment.',
      safetyClass: 'Class 1 Interlocked / Maintenance Mode',
      requiredTools: ['Grid Target Alignment Plate (9-point)', 'Thermal Beam Profiler', 'Hex Key Set (Metric)', 'Oscilloscope'],
      steps: [
        'Mount precision quartz alignment grid onto galvo focal plane.',
        'Fire low-power pilot diode (635nm) at 1% output power.',
        'Adjust X-axis galvo motor servo gain pot until step latency is below 12 microseconds.',
        'Adjust Y-axis galvo motor damping until overshoot is less than 0.5%.',
        'Execute automated 81-point grid scan to compute 2D field distortion matrix and upload parameters to galvo controller memory.'
      ]
    },
    {
      code: 'ERR-LSR-402',
      title: 'Diode Pump Array Forward Voltage Spike Troubleshooting & Swap Guide',
      category: 'Error Diagnostic',
      readTime: '5 min',
      lastUpdated: '2026-05-22',
      summary: 'Troubleshooting steps for error code ERR-402 indicating diode driver over-voltage spike during pulsed laser discharge.',
      safetyClass: 'Electrical Hazard / High Voltage',
      requiredTools: ['Fluke True-RMS Multimeter', 'Insulated Hand Tools', 'Thermal Paste (High Conductivity)', 'Torque Wrench'],
      steps: [
        'Lock out tag out (LOTO) 480V 3-phase mains supply to the laser power unit.',
        'Wait 5 minutes for main capacitor bank to bleed residual charge below 12V DC.',
        'Measure forward voltage drop across diode stack terminal connectors.',
        'If voltage delta exceeds 2.8V per bar, isolate and replace degraded diode module array.',
        'Reapply high-thermal-conductivity paste and torque mounting bolts to 3.5 Nm.'
      ]
    },
    {
      code: 'SOP-CHIL-009',
      title: 'Deionized Water Cooling Filter Cartridge Swap & System De-aeration',
      category: 'Maintenance',
      readTime: '10 min',
      lastUpdated: '2026-07-02',
      summary: 'Procedure for replacing the 0.2µm deionized cooling water filter, flushing ion-exchange resin, and bleeding micro-air bubbles from laser head cooling jacket.',
      safetyClass: 'Hydraulic / Fluid Pressure',
      requiredTools: ['Filter Housing Spanner Wrench', '0.2µm Polypropylene Filter Cartridge', 'Conductivity Meter', 'Catch Basin'],
      steps: [
        'Isolate cooling loop ball valves at chiller inlet and outlet ports.',
        'Depressurize cooling line via manual bleed valve into catch basin.',
        'Unscrew filter canister using spanner wrench and dispose of spent cartridge.',
        'Insert fresh 0.2µm filter cartridge and lubricate Viton O-ring with DI-water compatible grease.',
        'Re-open valves, start chiller pump, and open manual air-bleed vent on top of laser head until bubble-free laminar stream is observed.'
      ]
    }
  ];

  const categories = ['ALL', 'Laser Safety', 'Calibration', 'Error Diagnostic', 'Maintenance'];

  const filteredSops = sops.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                          s.code.toLowerCase().includes(search.toLowerCase()) ||
                          s.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12 transition-all duration-300">
      {/* Knowledge Workspace Header */}
      <div className={`p-6 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase border ${
              isDark ? 'bg-[#8B9DFF]/20 text-[#8B9DFF] border-[#8B9DFF]/30' : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}>
              EXECUTIVE DOCUMENTATION
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ISO 9001 Compliant SOPs</span>
          </div>
          <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Field Engineering Knowledge Base & Standard Manuals</h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Verified cleanroom procedures, optical calibration manuals, and error diagnostic protocols for laser field engineers.
          </p>
        </div>

        <div className={`flex items-center gap-2 font-mono text-xs px-3 py-2 rounded-xl border ${
          isDark ? 'bg-[#111315] text-slate-300 border-[#2B323A]' : 'bg-slate-100 text-slate-600 border-slate-200'
        }`}>
          <FileCheck className={`w-4 h-4 ${isDark ? 'text-[#7FD4A6]' : 'text-emerald-600'}`} />
          <span>4 Verified SOP Documents</span>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className={`flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border shadow-xs ${
        isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-white border-slate-200'
      }`}>
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search SOPs, manuals, or error codes (e.g. ERR-402)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full text-xs rounded-xl pl-9 pr-4 py-2.5 border transition-all placeholder:text-slate-400 ${
              isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100 focus:border-[#8B9DFF]' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
            }`}
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
                selectedCategory === cat
                  ? isDark ? 'bg-[#8B9DFF] text-slate-950 border-[#8B9DFF] font-bold' : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : isDark ? 'bg-[#111315] text-slate-400 border-[#2B323A] hover:text-slate-200' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* SOP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSops.map((sop) => (
          <div
            key={sop.code}
            onClick={() => setActiveSop(sop)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
              isDark
                ? 'bg-[#1A1D21] border-[#2B323A] hover:border-[#8B9DFF]/60'
                : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                  isDark ? 'bg-[#8B9DFF]/15 text-[#8B9DFF] border-[#8B9DFF]/30' : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {sop.code}
                </span>
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                  isDark ? 'bg-[#111315] text-slate-400 border-[#2B323A]' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {sop.category}
                </span>
              </div>

              <h3 className={`text-sm font-bold transition-colors mb-2 leading-snug ${
                isDark ? 'text-slate-100 group-hover:text-[#8B9DFF]' : 'text-slate-900 group-hover:text-blue-600'
              }`}>
                {sop.title}
              </h3>

              <p className={`text-xs leading-relaxed mb-4 line-clamp-2 font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {sop.summary}
              </p>
            </div>

            <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono ${
              isDark ? 'border-[#2B323A] text-slate-400' : 'border-slate-100 text-slate-500'
            }`}>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {sop.readTime} read
              </span>

              <span className={`font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${
                isDark ? 'text-[#8B9DFF]' : 'text-blue-600'
              }`}>
                View Operational Manual
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* SOP Detail Modal Viewer */}
      {activeSop && (
        <Modal
          isOpen={!!activeSop}
          onClose={() => setActiveSop(null)}
          title={`${activeSop.code}: ${activeSop.title}`}
        >
          <div className={`space-y-6 text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {/* Header Meta */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded ${
                  isDark ? 'bg-[#8B9DFF]/20 text-[#8B9DFF]' : 'bg-blue-100 text-blue-700'
                }`}>
                  {activeSop.code}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                  isDark ? 'bg-[#E98A8A]/15 text-[#E98A8A] border-[#E98A8A]/30' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  Classification: {activeSop.safetyClass}
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{activeSop.summary}</p>
            </div>

            {/* Required Tools */}
            <div>
              <h4 className={`font-mono font-bold uppercase text-[11px] mb-2 flex items-center gap-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}>
                <Wrench className={`w-3.5 h-3.5 ${isDark ? 'text-[#8B9DFF]' : 'text-blue-600'}`} />
                Required Equipment & PPE
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeSop.requiredTools.map((tool, idx) => (
                  <span key={idx} className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    • {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Step-by-Step Procedure */}
            <div>
              <h4 className={`font-mono font-bold uppercase text-[11px] mb-3 flex items-center gap-1.5 ${
                isDark ? 'text-slate-200' : 'text-slate-900'
              }`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#7FD4A6]' : 'text-emerald-600'}`} />
                Sequential Operational Protocol
              </h4>
              <ol className="space-y-2.5">
                {activeSop.steps.map((step, idx) => (
                  <li key={idx} className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <span className={`w-5 h-5 rounded-full font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 ${
                      isDark ? 'bg-[#8B9DFF] text-slate-950' : 'bg-blue-600 text-white'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Footer Action */}
            <div className={`pt-4 border-t flex justify-end gap-3 ${isDark ? 'border-[#2B323A]' : 'border-slate-200'}`}>
              <Button variant="ghost" onClick={() => setActiveSop(null)}>Close Manual</Button>
              <Button variant="primary" icon={<Download className="w-3.5 h-3.5" />} onClick={() => window.print()}>
                Print SOP Sheet
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
