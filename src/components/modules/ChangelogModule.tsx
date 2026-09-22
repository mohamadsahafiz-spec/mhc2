import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Filter, 
  Layers, 
  History, 
  ArrowLeft,
  CheckCircle2,
  Tag,
  Settings as SettingsIcon,
  ChevronsUpDown
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { getAuthoritativeChangelog, ChangelogEntry } from '../../utils/changelogParser';
import { APP_VERSION } from '../../constants/version';
import { NavigationTab } from '../../types';
import { mechanicalPressConfig, motionTimings, motionEasings } from '../../theme/motion';

interface ChangelogModuleProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const ChangelogModule: React.FC<ChangelogModuleProps> = ({ onNavigate }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const prefersReducedMotion = Boolean(useReducedMotion());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('all');
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>(() => ({
    [APP_VERSION]: true // Expand latest version by default
  }));

  const changelogEntries = useMemo(() => {
    return getAuthoritativeChangelog();
  }, []);

  // Determine available milestone families
  const milestoneFamilies = useMemo(() => {
    return [
      { id: 'all', label: 'All Releases' },
      { id: 'v3.4', label: 'v3.4.x (Current)' },
      { id: 'v3.3', label: 'v3.3.x' },
      { id: 'v3.1', label: 'v3.1.x' },
      { id: 'v3.0', label: 'v3.0.x' },
      { id: 'v2.6', label: 'v2.6.x' },
      { id: 'v2.5', label: 'v2.5.x' },
      { id: 'v2.4', label: 'v2.4.x' },
      { id: 'v2.3', label: 'v2.3.x' },
      { id: 'v2.2', label: 'v2.2.x' },
      { id: 'v2.1', label: 'v2.1.x' },
      { id: 'v2.0', label: 'v2.0.x' },
      { id: 'v1.x', label: 'v1.x Series' },
      { id: 'v0.x', label: 'v0.x Early Beta' }
    ];
  }, []);

  // Filter entries based on search and milestone
  const filteredEntries = useMemo(() => {
    let result = changelogEntries;

    if (selectedMilestone !== 'all') {
      if (selectedMilestone === 'v1.x') {
        result = result.filter(e => e.version.startsWith('v1.'));
      } else if (selectedMilestone === 'v0.x') {
        result = result.filter(e => e.version.startsWith('v0.'));
      } else {
        result = result.filter(e => e.version.startsWith(selectedMilestone));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(e => {
        if (e.version.toLowerCase().includes(q)) return true;
        if (e.title.toLowerCase().includes(q)) return true;
        if (e.date.toLowerCase().includes(q)) return true;
        if (e.rawBody.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    return result;
  }, [changelogEntries, selectedMilestone, searchQuery]);

  const toggleExpand = (version: string) => {
    setExpandedVersions(prev => ({
      ...prev,
      [version]: !prev[version]
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    filteredEntries.forEach(e => {
      next[e.version] = true;
    });
    setExpandedVersions(next);
  };

  const collapseAll = () => {
    setExpandedVersions({});
  };

  // Helper to format changelog bullet points with bold prefixes and clean code blocks
  const renderItemLine = (line: string, idx: number) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const isSubBullet = line.startsWith('  -') || line.startsWith('    -');
    const cleanLine = trimmed.replace(/^-\s+/, '').replace(/^\*\s+/, '');

    // Parse **bold** markers
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(cleanLine)) !== null) {
      if (match.index > lastIndex) {
        parts.push(cleanLine.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className={isDark ? 'text-slate-100 font-semibold' : 'text-slate-900 font-semibold'}>
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < cleanLine.length) {
      parts.push(cleanLine.substring(lastIndex));
    }

    return (
      <li 
        key={idx} 
        className={`leading-relaxed text-xs sm:text-sm flex items-start gap-2 ${
          isSubBullet ? 'ml-4 sm:ml-6 mt-1 text-slate-400' : 'mt-2 text-slate-300'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
          isSubBullet ? 'bg-slate-500' : 'bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.5)]'
        }`} />
        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
          {parts.length > 0 ? parts : cleanLine}
        </span>
      </li>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Bar */}
      <div className={`p-5 sm:p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#16191D] border-[#2B323A]/80' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${
              isDark ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600'
            }`}>
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Release History & Changelog
              </h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Authoritative release record parsed directly from <span className="font-mono font-medium">CHANGELOG.md</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onNavigate && (
            <motion.button
              whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
              onClick={() => onNavigate('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                isDark 
                  ? 'bg-[#1F242C] border-[#2B323A] text-slate-300 hover:bg-[#262C36]' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </motion.button>
          )}
          <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-2 ${
            isDark ? 'bg-[#111315] border-[#2B323A] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
            <span>Active {APP_VERSION}</span>
          </div>
        </div>
      </div>

      {/* 2. Search, Milestone Filter & Expand Controls */}
      <div className={`p-4 rounded-xl border space-y-3.5 transition-colors ${
        isDark ? 'bg-[#16191D] border-[#2B323A]/80' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`} />
            <input
              type="text"
              placeholder="Search version, feature, milestone, or component..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs sm:text-sm border transition-colors outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark 
                  ? 'bg-[#111315] border-[#2B323A] text-slate-200 placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <motion.button
                whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                Clear
              </motion.button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
              onClick={expandAll}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isDark 
                  ? 'bg-[#1F242C] border-[#2B323A] text-slate-300 hover:bg-[#262C36]' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Expand All
            </motion.button>
            <motion.button
              whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
              onClick={collapseAll}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isDark 
                  ? 'bg-[#1F242C] border-[#2B323A] text-slate-300 hover:bg-[#262C36]' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Collapse All
            </motion.button>
          </div>
        </div>

        {/* Milestone Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className={`text-[11px] font-semibold uppercase tracking-wider shrink-0 mr-1 ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Milestones:
          </span>
          {milestoneFamilies.map(fam => {
            const isSelected = selectedMilestone === fam.id;
            return (
              <motion.button
                key={fam.id}
                whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
                onClick={() => setSelectedMilestone(fam.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                  isSelected
                    ? isDark 
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold shadow-[0_0_10px_rgba(56,189,248,0.15)]' 
                      : 'bg-cyan-50 border-cyan-300 text-cyan-800 font-semibold'
                    : isDark 
                      ? 'bg-[#1F242C] border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#262C36]' 
                      : 'bg-slate-100 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {fam.label}
              </motion.button>
            );
          })}
        </div>

        {/* Result Status */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-700/20">
          <span>
            Showing <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{filteredEntries.length}</strong> of {changelogEntries.length} releases
          </span>
          {selectedMilestone !== 'all' && (
            <motion.button
              whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
              onClick={() => setSelectedMilestone('all')}
              className="text-cyan-400 hover:underline"
            >
              Reset filter
            </motion.button>
          )}
        </div>
      </div>

      {/* 3. Release Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className={`p-8 text-center rounded-xl border ${
            isDark ? 'bg-[#16191D] border-[#2B323A]/80 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
            <p className="text-sm font-medium">No release notes match your search criteria.</p>
            <motion.button
              whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
              onClick={() => { setSearchQuery(''); setSelectedMilestone('all'); }}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500 text-slate-950 font-semibold shadow-[0_0_12px_rgba(56,189,248,0.35)]"
            >
              Clear Search & Filters
            </motion.button>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isExpanded = expandedVersions[entry.version] || (searchQuery.trim().length > 0);
            const isCurrent = entry.version === APP_VERSION;

            return (
              <div 
                key={entry.version}
                id={`release-${entry.version.replace(/\./g, '-')}`}
                className={`rounded-xl border transition-all ${
                  isCurrent
                    ? isDark 
                      ? 'bg-[#16191D] border-cyan-500/40 shadow-[0_0_24px_-4px_rgba(56,189,248,0.2)]' 
                      : 'bg-white border-cyan-500/50 shadow-sm'
                    : isDark 
                      ? 'bg-[#16191D] border-[#2B323A]/80' 
                      : 'bg-white border-slate-200'
                }`}
              >
                {/* Release Card Header */}
                <motion.button
                  whileTap={prefersReducedMotion ? undefined : mechanicalPressConfig.subtleTap}
                  onClick={() => toggleExpand(entry.version)}
                  className={`w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:opacity-95 transition-opacity`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 p-1 rounded-md transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-mono text-xs sm:text-sm font-bold px-2 py-0.5 rounded border ${
                          isCurrent
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : isDark 
                              ? 'bg-[#1F242C] text-slate-200 border-[#2B323A]' 
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {entry.version}
                        </span>

                        {isCurrent && (
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.4)]">
                            Current Active
                          </span>
                        )}

                        <span className={`text-xs flex items-center gap-1 font-medium ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {entry.date || 'Unspecified date'}
                        </span>
                      </div>

                      <h3 className={`text-sm sm:text-base font-semibold truncate ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {entry.title || 'Operational Release'}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] font-mono hidden sm:inline-block ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {entry.sections.length} {entry.sections.length === 1 ? 'section' : 'sections'}
                    </span>
                    <span className={`px-2 py-1 rounded text-[11px] font-mono ${
                      isDark ? 'bg-[#111315] text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isExpanded ? 'Hide' : 'Details'}
                    </span>
                  </div>
                </motion.button>

                {/* Release Card Body */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: motionTimings.standard, ease: motionEasings.smooth }}
                      className={`overflow-hidden px-4 pb-5 pt-1 sm:px-6 sm:pb-6 border-t space-y-4 ${
                        isDark ? 'border-[#2B323A]/50 bg-[#14171A]/50' : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      {entry.sections.map((sec, sIdx) => (
                        <div key={sIdx} className="space-y-2">
                          {sec.heading && (
                            <h4 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 pt-2 ${
                              isDark ? 'text-cyan-400' : 'text-cyan-700'
                            }`}>
                              <Tag className="w-3 h-3" />
                              {sec.heading}
                            </h4>
                          )}
                          <ul className="space-y-1">
                            {sec.items.map((line, lIdx) => renderItemLine(line, lIdx))}
                          </ul>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
