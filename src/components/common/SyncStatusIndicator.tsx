import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CloudOff, RefreshCw, Clock, Monitor, AlertCircle, HardDrive } from 'lucide-react';
import { SyncEngine } from '../../utils/syncEngine';
import { SyncState } from '../../types/sync';
import { HamsterSyncLoader } from './HamsterSyncLoader';

interface SyncStatusIndicatorProps {
  isDark?: boolean;
  placement?: 'bottom-right' | 'top-left' | 'top-right' | 'top-center';
  fullWidth?: boolean;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  isDark = true,
  placement = 'top-left',
  fullWidth = false,
  className = '',
}) => {
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
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium font-mono transition-all bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>Synced</span>
          </div>
        );
      case 'syncing':
        const imgActivity = (syncState.pendingImageCount || 0) + (syncState.downloadingImageCount || 0);
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium font-mono transition-all bg-amber-500/10 border-amber-500/30 text-amber-300">
            <RefreshCw className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
            <span>{imgActivity > 0 ? `Syncing (${imgActivity})...` : 'Syncing...'}</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium font-mono transition-all bg-orange-500/10 border-orange-500/30 text-orange-300">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping shrink-0" />
            <span>Pending ({syncState.pendingCount})</span>
          </div>
        );
      case 'offline':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium font-mono transition-all bg-rose-500/10 border-rose-500/30 text-rose-300">
            <CloudOff className="w-3 h-3 text-rose-400 shrink-0" />
            <span>Offline</span>
          </div>
        );
    }
  };

  const getPopoverPlacementClass = () => {
    switch (placement) {
      case 'top-left':
        return 'bottom-full left-0 mb-2';
      case 'top-right':
        return 'bottom-full right-0 mb-2';
      case 'top-center':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom-right':
      default:
        return 'top-full right-0 mt-2';
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} ref={popoverRef}>
      {/* Compact Hamster Visual Sync Trigger */}
      <button
        id="cloud-sync-hamster-btn"
        onClick={() => setShowPopover(!showPopover)}
        title={`FSOS Cloud Sync (${syncState.deviceId}) — ${syncState.status}`}
        aria-label={`Cloud Sync status: ${syncState.status}. Click for device and sync controls.`}
        className="p-1 rounded-xl border border-theme-subtle/70 hover:border-theme-strong bg-raised/60 hover:bg-raised transition-all cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] shadow-sm group"
      >
        <HamsterSyncLoader 
          status={syncState.status} 
          size={44}
        />
      </button>

      {/* Sync Control Popover (Fits perfectly within sidebar bounds) */}
      {showPopover && (
        <div className={`absolute ${getPopoverPlacementClass()} w-[232px] rounded-modal border shadow-theme-popover backdrop-theme-surface p-3 z-50 bg-raised border-theme-default text-theme-primary`}>
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2 border-b border-theme-subtle mb-2.5">
            <div className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider font-theme-heading text-theme-primary">
                Cloud Replica Sync
              </h4>
            </div>
            {getStatusBadge()}
          </div>

          {/* Sync Stats List */}
          <div className="space-y-1.5 text-xs font-mono">
            {/* Current Device */}
            <div className="flex items-center justify-between bg-surface p-1.5 rounded-theme-sm border border-theme-subtle">
              <span className="text-theme-muted text-[10px] flex items-center gap-1">
                <Monitor className="w-3 h-3 text-[var(--color-primary)]" />
                Current Device:
              </span>
              {!isEditingDevice ? (
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[10px] text-[var(--color-primary)]">{syncState.deviceId}</span>
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
                    className="w-20 bg-surface border border-[var(--color-primary)] text-theme-primary text-[10px] px-1 py-0.5 rounded font-mono"
                  />
                  <button
                    onClick={() => handleDeviceChange(customDeviceName)}
                    className="bg-[var(--color-primary)] text-slate-950 text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>

            {/* Quick Switch Device Presets */}
            <div className="flex items-center justify-between text-[10px] text-theme-muted px-0.5 pt-0.5">
              <span>Switch Device:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDeviceChange('HOME-PC')}
                  className={`px-1.5 py-0.5 rounded border text-[9px] transition cursor-pointer ${
                    syncState.deviceId === 'HOME-PC' 
                      ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)] text-[var(--color-primary)] font-bold' 
                      : 'border-theme-subtle text-theme-muted hover:text-theme-primary'
                  }`}
                >
                  HOME-PC
                </button>
                <button
                  onClick={() => handleDeviceChange('STM-LAPTOP')}
                  className={`px-1.5 py-0.5 rounded border text-[9px] transition cursor-pointer ${
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
            <div className="flex items-center justify-between p-1.5 rounded-theme-sm bg-surface border border-theme-subtle text-[11px]">
              <span className="text-theme-muted flex items-center gap-1 text-[10px]">
                <Clock className="w-3 h-3 text-amber-400" />
                Last Cloud Sync:
              </span>
              <span className="font-bold text-[10px] text-theme-primary">
                {formatLastSync(syncState.lastSyncTime)}
              </span>
            </div>

            {/* Pending Upload Queue */}
            <div className="flex items-center justify-between p-1.5 rounded-theme-sm bg-surface border border-theme-subtle text-[11px]">
              <span className="text-theme-muted flex items-center gap-1 text-[10px]">
                <AlertCircle className="w-3 h-3 text-sky-400" />
                Pending Queue:
              </span>
              <span className={`font-bold text-[10px] ${syncState.pendingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {syncState.pendingCount} item{syncState.pendingCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cloud D1 Server Replica */}
            <div className="flex items-center justify-between p-1.5 rounded-theme-sm bg-surface border border-theme-subtle text-[11px]">
              <span className="text-theme-muted flex items-center gap-1 text-[10px]">
                <HardDrive className="w-3 h-3 text-emerald-400" />
                Cloud D1 Replica:
              </span>
              <span className="font-bold text-[10px] text-emerald-400">
                {syncState.serverRecordCount} records
              </span>
            </div>
          </div>

          {/* Sync Now Trigger Button */}
          <div className="mt-2.5 pt-2 border-t border-theme-subtle">
            <button
              onClick={handleManualSync}
              disabled={syncState.status === 'syncing'}
              className="w-full bg-[var(--color-primary)]/15 hover:bg-[var(--color-primary)]/25 text-[var(--color-primary)] border border-[var(--color-primary)]/40 font-bold text-xs py-1.5 px-3 rounded-button flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 font-theme-label"
            >
              <RefreshCw className={`w-3 h-3 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">{syncState.status === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

