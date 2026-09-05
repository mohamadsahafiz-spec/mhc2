import React, { useMemo } from 'react';
import { RefreshCw, User } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { getAuthoritativeChangelog } from '../../utils/changelogParser';

interface SettingsProps {
  onResetData: () => void;
}

export const SettingsModule: React.FC<SettingsProps> = ({ onResetData }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const changelog = useMemo(() => getAuthoritativeChangelog(), []);

  const renderFormattedLine = (line: string) => {
    const isSubItem = line.startsWith('  - ') || line.startsWith('    - ');
    const cleanLine = line.replace(/^\s*[-*]\s+/, '');
    const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

    return (
      <span className={`inline leading-relaxed ${isSubItem ? 'pl-2 block text-slate-400/90' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={i} className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={i} className={`px-1 py-0.5 rounded font-mono text-[11px] ${isDark ? 'bg-slate-800 text-sky-300' : 'bg-slate-200 text-sky-800'}`}>
                {part.slice(1, -1)}
              </code>
            );
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={i} className={`italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {part.slice(1, -1)}
              </em>
            );
          }
          return part;
        })}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Structured Changelog */}
      <Card
        title="Authoritative Engineering Milestone Changelog"
        subtitle={`Derived directly from single source of truth CHANGELOG.md (${changelog.length} milestone releases)`}
      >
        <div className="space-y-4">
          {changelog.map((entry) => (
            <div
              key={entry.version}
              className={`p-4 rounded-xl border text-xs space-y-3 ${
                isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#2B323A]/60 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[#8B9DFF]">{entry.version}</span>
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{entry.title}</span>
                </div>
                {entry.date && <span className="font-mono text-slate-400 whitespace-nowrap">{entry.date}</span>}
              </div>

              <div className="space-y-2.5">
                {entry.sections.map((sec, sIdx) => (
                  <div key={sIdx} className="space-y-1.5">
                    {sec.heading && (
                      <h4 className="font-bold text-[11px] uppercase tracking-wider text-sky-400/90 pt-1">
                        {sec.heading}
                      </h4>
                    )}
                    <ul className="space-y-1 list-disc pl-4 text-slate-400">
                      {sec.items.map((item, iIdx) => (
                        <li key={iIdx}>
                          {renderFormattedLine(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* System Data & Workspace Management */}
      <Card title="System Data & Workspace Management">
        <div className="space-y-4 text-xs">
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <p className="font-bold text-sm text-[#E98A8A]">Reset Local Workspace State</p>
              <p className="text-slate-400 mt-0.5">Restores default contracts, machines, schedule, tasks, and MHC audit records.</p>
            </div>
            <Button variant="danger" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onResetData}>
              Reset State
            </Button>
          </div>

          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#141618] border-[#2B323A] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2 font-bold text-xs text-[#8B9DFF] mb-1">
              <User className="w-4 h-4" />
              <span>Engineer Profile Governance</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Personal identity details, avatar photo management, contact preferences, and certifications have been centralized under <strong>My Profile</strong> in accordance with FSOS Identity Standard v0.7.5.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
