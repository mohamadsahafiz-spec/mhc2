import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, Clock, Laptop, Monitor, AlertCircle, HardDrive } from 'lucide-react';
import { SyncEngine } from '../../utils/syncEngine';
import { SyncState } from '../../types/sync';

interface SyncStatusIndicatorProps {
  isDark?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ isDark = true }) => {
  const [syncState, setSyncState] = useState<SyncState>(SyncEngine.getState());
  const [showPopover, setShowPopover] = useState(false);
  const [customDeviceName, setCustomDeviceName] = useState(syncState.deviceId);
  const [isEditingDevice, setIsEditingDevice] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = SyncEngine.subscribe((newState) => {
      setSyncState(newState);
      if (!isEditingDevice) {
        setCustomDeviceName(newState.deviceId);
      }
    });
    return unsubscribe;
  }, [isEditingDevice]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
        setIsEditingDevice(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSync = () => {
    SyncEngine.processQueue();
  };

  const handleDeviceChange = (newId: string) => {
    SyncEngine.setDeviceId(newId);
    setCustomDeviceName(newId);
    setIsEditingDevice(false);
  };

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      if (diffMs < 10000) return 'Just now';
      if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s ago`;
      if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Unknown';
    }
  };

  const getStatusBadge = () => {
    switch (syncState.status) {
      case 'synced':
        return (
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium font-mono transition-all ${
            isDark 
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>Synced</span>
          </div>
        );
      case 'syncing':
        return (
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium font-mono transition-all ${
            isDark 
              ? 'bg-amber-950/60 border-amber-800/80 text-amber-300' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <RefreshCw className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
            <span>Syncing...</span>
          </div>
        );
      case 'pending':
        return (
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium font-mono transition-all ${
            isDark 
              ? 'bg-orange-950/60 border-orange-800/80 text-orange-300' 
              : 'bg-orange-50 border-orange-200 text-orange-800'
          }`}>
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping shrink-0" />
            <span>Pending ({syncState.pendingCount})</span>
          </div>
        );
      case 'offline':
      default:
        return (
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium font-mono transition-all ${
            isDark 
              ? 'bg-rose-950/60 border-rose-800/80 text-rose-300' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <CloudOff className="w-3 h-3 text-rose-400 shrink-0" />
            <span>Offline</span>
          </div>
        );
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => setShowPopover(!showPopover)}
        title={`FSOS Automatic Cloud Protection (${syncState.deviceId})`}
        className={`flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg border transition-all cursor-pointer ${
          isDark 
            ? 'bg-[#1A1D21] border-[#2B323A] hover:bg-[#20252B] hover:border-slate-600' 
            : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
        }`}
      >
        <Cloud className={`w-3.5 h-3.5 ${syncState.online ? 'text-[#8B9DFF]' : 'text-slate-500'}`} />
        {getStatusBadge()}
      </button>

      {/* Sync Control Popover */}
      {showPopover && (
        <div className={`absolute right-0 mt-2 w-72 rounded-xl border shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 ${
          isDark ? 'bg-[#181B1E] border-[#2B323A] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#8B9DFF]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Cloud Replica Sync
              </h4>
            </div>
            {getStatusBadge()}
          </div>

          {/* Sync Stats List */}
          <div className="space-y-2 text-xs font-mono">
            {/* Current Device */}
            <div className="flex items-center justify-between bg-[#111315]/80 p-2 rounded border border-[#2B323A]">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                Current Device:
              </span>
              {!isEditingDevice ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#8B9DFF]">{syncState.deviceId}</span>
                  <button 
                    onClick={() => setIsEditingDevice(true)} 
                    className="text-[9px] text-slate-500 hover:text-slate-300 underline"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customDeviceName}
                    onChange={(e) => setCustomDeviceName(e.target.value)}
                    className="w-24 bg-slate-900 border border-indigo-500 text-slate-100 text-[11px] px-1 py-0.5 rounded font-mono"
                  />
                  <button
                    onClick={() => handleDeviceChange(customDeviceName)}
                    className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>

            {/* Quick Switch Device Presets */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
              <span>Switch Device View:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDeviceChange('HOME-PC')}
                  className={`px-1.5 py-0.5 rounded border transition ${
                    syncState.deviceId === 'HOME-PC' 
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold' 
                      : 'border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  HOME-PC
                </button>
                <button
                  onClick={() => handleDeviceChange('STM-LAPTOP')}
                  className={`px-1.5 py-0.5 rounded border transition ${
                    syncState.deviceId === 'STM-LAPTOP' 
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold' 
                      : 'border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  STM-LAPTOP
                </button>
              </div>
            </div>

            {/* Last Sync Time */}
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Last Cloud Sync:
              </span>
              <span className="font-bold text-slate-200">
                {formatLastSync(syncState.lastSyncTime)}
              </span>
            </div>

            {/* Pending Upload Queue */}
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                Pending Queue:
              </span>
              <span className={`font-bold ${syncState.pendingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {syncState.pendingCount} item{syncState.pendingCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cloud D1 Server Replica */}
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                Cloud D1 Replica:
              </span>
              <span className="font-bold text-emerald-400">
                {syncState.serverRecordCount} records
              </span>
            </div>
          </div>

          {/* Sync Now Trigger Button */}
          <div className="mt-3.5 pt-2 border-t border-slate-800">
            <button
              onClick={handleManualSync}
              disabled={syncState.status === 'syncing'}
              className="w-full bg-[#8B9DFF]/20 hover:bg-[#8B9DFF]/30 text-[#8B9DFF] border border-[#8B9DFF]/40 font-bold text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{syncState.status === 'syncing' ? 'Syncing with Cloud...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
