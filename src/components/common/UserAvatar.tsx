import React, { useState, useEffect } from 'react';
import { SystemUser, EngineerProfile, UserStatus } from '../../types';

interface UserAvatarProps {
  user?: Partial<SystemUser> | Partial<EngineerProfile> | null;
  name?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  showStatus?: boolean;
  status?: UserStatus;
  className?: string;
}

export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'FE';
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

// Deterministic color palette for initial avatars
const AVATAR_COLORS = [
  'bg-indigo-600 text-white border-indigo-500',
  'bg-emerald-600 text-white border-emerald-500',
  'bg-sky-600 text-white border-sky-500',
  'bg-amber-600 text-white border-amber-500',
  'bg-violet-600 text-white border-violet-500',
  'bg-rose-600 text-white border-rose-500',
  'bg-cyan-600 text-white border-cyan-500',
  'bg-teal-600 text-white border-teal-500',
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name: nameProp,
  avatarUrl: avatarUrlProp,
  size = 'md',
  showStatus = false,
  status: statusProp,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  const userName = nameProp || (user as SystemUser)?.fullName || (user as EngineerProfile)?.name || 'Engineer';
  const avatarUrl = avatarUrlProp || user?.avatarUrl;
  const userStatus = statusProp || (user as SystemUser)?.status || 'Online';

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const initials = getInitials(userName);
  const colorClass = getColorForName(userName);

  // Size mapping
  let sizeClasses = 'w-8 h-8 text-xs';
  let badgeSizeClass = 'w-2 h-2 border';

  if (typeof size === 'number') {
    sizeClasses = `w-[${size}px] h-[${size}px] text-xs`;
  } else {
    switch (size) {
      case 'xs':
        sizeClasses = 'w-5 h-5 text-[9px] font-bold';
        badgeSizeClass = 'w-1.5 h-1.5 border-[0.5px]';
        break;
      case 'sm':
        sizeClasses = 'w-7 h-7 text-[10px] font-bold';
        badgeSizeClass = 'w-2 h-2 border';
        break;
      case 'md':
        sizeClasses = 'w-9 h-9 text-xs font-bold';
        badgeSizeClass = 'w-2.5 h-2.5 border-1.5';
        break;
      case 'lg':
        sizeClasses = 'w-12 h-12 text-sm font-bold';
        badgeSizeClass = 'w-3 h-3 border-2';
        break;
      case 'xl':
        sizeClasses = 'w-16 h-16 text-lg font-bold';
        badgeSizeClass = 'w-4 h-4 border-2';
        break;
      case '2xl':
        sizeClasses = 'w-20 h-20 text-xl font-bold';
        badgeSizeClass = 'w-4.5 h-4.5 border-2';
        break;
    }
  }

  // Status badge colors
  let statusColor = 'bg-emerald-500';
  if (userStatus === 'Busy') statusColor = 'bg-amber-500';
  if (userStatus === 'On Leave') statusColor = 'bg-sky-500';
  if (userStatus === 'Offline' || userStatus === 'Inactive') statusColor = 'bg-slate-400';

  return (
    <div className={`relative shrink-0 inline-flex items-center justify-center ${className}`}>
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={userName}
          onError={() => setImgError(true)}
          className={`${sizeClasses} rounded-full object-cover border border-slate-200 dark:border-[#2B323A] shadow-2xs`}
        />
      ) : (
        <div
          className={`${sizeClasses} ${colorClass} rounded-full flex items-center justify-center font-mono font-bold tracking-tight shadow-2xs border uppercase select-none`}
        >
          {initials}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-white dark:border-[#111315] ${statusColor} ${badgeSizeClass}`}
          title={`Status: ${userStatus}`}
        />
      )}
    </div>
  );
};
