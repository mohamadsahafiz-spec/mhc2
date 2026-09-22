import React from 'react';

export interface HamsterSyncLoaderProps {
  status: 'synced' | 'syncing' | 'pending' | 'offline';
  className?: string;
  size?: number; // pixel size for wheel diameter, defaults to 44
}

export const HamsterSyncLoader: React.FC<HamsterSyncLoaderProps> = ({
  status,
  className = '',
  size = 44,
}) => {
  const isSyncing = status === 'syncing';
  const stateClass = isSyncing 
    ? 'wheel-and-hamster--syncing' 
    : 'wheel-and-hamster--synced';

  // 12em is the SVG/CSS box size, so fontSize = size / 12
  const fontSizePx = size / 12;

  return (
    <div
      role="img"
      aria-label={isSyncing ? 'Active Cloud Sync in progress' : 'Cloud Sync idle and synchronized'}
      className={`wheel-and-hamster ${stateClass} ${className}`}
      style={{ fontSize: `${fontSizePx}px`, width: `${size}px`, height: `${size}px` }}
    >
      <div className="wheel" />
      <div className="hamster">
        <div className="hamster__body">
          <div className="hamster__head">
            <div className="hamster__ear" />
            <div className="hamster__eye" />
            <div className="hamster__nose" />
          </div>
          <div className="hamster__limb hamster__limb--fr" />
          <div className="hamster__limb hamster__limb--fl" />
          <div className="hamster__limb hamster__limb--br" />
          <div className="hamster__limb hamster__limb--bl" />
          <div className="hamster__tail" />
        </div>
      </div>
      <div className="spoke" />
    </div>
  );
};
