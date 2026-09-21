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
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium font-mono transition-all bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>Synced</span>
          </div>
        );
      case 'syncing':
        const imgActivity = (syncState.pendingImageCount || 0) + (syncState.downloadingImageCount || 0);
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium font-mono transition-all bg-amber-500/10 border-amber-500/30 text-amber-300">
            <RefreshCw className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
            <span>{imgActivity > 0 ? `Syncing (${imgActivity} img)...` : 'Syncing...'}</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium font-mono transition-all bg-orange-500/10 border-orange-500/30 text-orange-300">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping shrink-0" />
            <span>Pending ({syncState.pendingCount})</span>
          </div>
        );
      case 'offline':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium font-mono transition-all bg-rose-500/10 border-rose-500/30 text-rose-300">
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
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-button border transition-all cursor-pointer bg-raised border-theme-default text-theme-primary hover:bg-surface hover:border-theme-strong font-theme-label"
      >
        <Cloud className={`w-3.5 h-3.5 ${syncState.online ? 'text-[var(--color-primary)]' : 'text-theme-muted'}`} />
        {getStatusBadge()}
      </button>

      {/* Sync Control Popover */}
      {showPopover && (
        <div className="absolute right-0 mt-2 w-72 rounded-modal border shadow-theme-popover backdrop-theme-surface p-3.5 z-50 bg-raised border-theme-default text-theme-primary">
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-theme-subtle mb-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[var(--color-primary)]" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-theme-heading text-theme-primary">
                Cloud Replica Sync
              </h4>
            </div>
            {getStatusBadge()}
          </div>

          {/* Sync Stats List */}
          <div className="space-y-2 text-xs font-mono">
            {/* Current Device */}
            <div className="flex items-center justify-between bg-surface p-2 rounded-theme-sm border border-theme-subtle">
              <span className="text-theme-muted text-[11px] flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Current Device:
              </span>
              {!isEditingDevice ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[var(--color-primary)]">{syncState.deviceId}</span>
                  <button 
                    onClick={() => setIsEditingDevice(true)} 
                    className="text-[9px] text-theme-muted hover:text-theme-primary underline cursor-pointer"
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
                    className="w-24 bg-surface border border-[var(--color-primary)] text-theme-primary text-[11px] px-1 py-0.5 rounded font-mono"
                  />
                  <button
                    onClick={() => handleDeviceChange(customDeviceName)}
                    className="bg-[var(--color-primary)] text-slate-950 text-[10px] px-1.5 py-0.5 rounded font-bold cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>

            {/* Quick Switch Device Presets */}
            <div className="flex items-center justify-between text-[10px] text-theme-muted px-1 pt-0.5">
              <span>Switch Device View:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDeviceChange('HOME-PC')}
                  className={`px-1.5 py-0.5 rounded border transition cursor-pointer ${
                    syncState.deviceId === 'HOME-PC' 
                      ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)] text-[var(--color-primary)] font-bold' 
                      : 'border-theme-subtle text-theme-muted hover:text-theme-primary'
                  }`}
                >
                  HOME-PC
                </button>
                <button
                  onClick={() => handleDeviceChange('STM-LAPTOP')}
                  className={`px-1.5 py-0.5 rounded border transition cursor-pointer ${
                    syncState.deviceId === 'STM-LAPTOP' 
                      ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)] text-[var(--color-primary)] font-bold' 
                      : 'border-theme-subtle text-theme-muted hover:text-theme-primary'
                  }`}
                >
                  STM-LAPTOP
                </button>
              </div>
            </div>

            {/* Last Sync Time */}
            <div className="flex items-center justify-between p-1.5 rounded-theme-sm bg-surface border border-theme-subtle">
              <span className="text-theme-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Last Cloud Sync:
              </span>
              <span className="font-bold text-theme-primary">
                {formatLastSync(syncState.lastSyncTime)}
              </span>
            </div>

            {/* Pending Upload Queue */}
            <div className="flex items-center justify-between p-1.5 rounded-theme-sm bg-surface border border-theme-subtle">
              <span className="text-theme-muted flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                Pending Queue:
              </span>
              <span className={`font-bold ${syncState.pendingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {syncState.pendingCount} item{syncState.pendingCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cloud D1 Server Replica */}
            <div className="flex items-center justify-between p-1.5 rounded-theme-sm bg-surface border border-theme-subtle">
              <span className="text-theme-muted flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                Cloud D1 Replica:
              </span>
              <span className="font-bold text-emerald-400">
                {syncState.serverRecordCount} records
              </span>
            </div>
          </div>

          {/* Sync Now Trigger Button */}
          <div className="mt-3.5 pt-2 border-t border-theme-subtle">
            <button
              onClick={handleManualSync}
              disabled={syncState.status === 'syncing'}
              className="w-full bg-[var(--color-primary)]/15 hover:bg-[var(--color-primary)]/25 text-[var(--color-primary)] border border-[var(--color-primary)]/40 font-bold text-xs py-1.5 px-3 rounded-button flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 font-theme-label"
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
