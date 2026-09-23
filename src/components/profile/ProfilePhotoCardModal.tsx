import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  RotateCcw, 
  Trash2, 
  X, 
  ShieldCheck, 
  User as UserIcon,
  Sparkles,
  Sliders
} from 'lucide-react';
import { SystemUser, UserStatus } from '../../types';
import { getInitials } from '../common/UserAvatar';

interface ProfilePhotoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Partial<SystemUser>;
  onUploadPhoto: (file: File) => void;
  onRestoreInitials: () => void;
  onRemovePhoto: () => void;
  isDark: boolean;
}

export const ProfilePhotoCardModal: React.FC<ProfilePhotoCardModalProps> = ({
  isOpen,
  onClose,
  user,
  onUploadPhoto,
  onRestoreInitials,
  onRemovePhoto,
  isDark,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCornerRevealed, setIsCornerRevealed] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPhoto(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  const fullName = user.fullName || 'Service Engineer';
  const initials = getInitials(fullName);
  const employeeId = user.employeeId || 'EMP-EO';
  const role = user.role || 'Field Service Engineer';
  const status = user.status || 'Online';
  const hasCustomAvatar = Boolean(user.avatarUrl);

  const getStatusColor = (s: UserStatus) => {
    switch (s) {
      case 'Online': return 'bg-emerald-400';
      case 'Busy': return 'bg-amber-400';
      case 'On Leave': return 'bg-sky-400';
      case 'Offline':
      default: return 'bg-slate-400';
    }
  };

  const modalContent = (
    <div 
      id="profile-photo-card-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        data-testid="profile-card-file-input"
      />

      <div className="flex flex-col items-center gap-4 max-w-full">
        {/* The Expandable Interactive Photo Card (Uiverse-inspired corner interaction) */}
        <div 
          onMouseEnter={() => setIsCornerRevealed(true)}
          onMouseLeave={() => setIsCornerRevealed(false)}
          className={`profile-photo-card group relative w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96 rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300 select-none ${
            isDark 
              ? 'bg-[#181C22] border-[#343D49] shadow-black/80' 
              : 'bg-slate-900 border-slate-700 shadow-slate-900/50'
          }`}
        >
          {/* Card Media Surface (Enlarged High-Resolution Photo or Stylized Initials) */}
          {hasCustomAvatar ? (
            <img
              src={user.avatarUrl}
              alt={fullName}
              className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 text-center overflow-hidden">
              {/* Subtle technical background grid */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }}
              />
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shadow-inner relative z-10 transition-transform duration-500 group-hover:scale-110">
                <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-white">
                  {initials}
                </span>
              </div>
              <p className="mt-3 text-xs text-indigo-200/70 font-mono relative z-10">
                Default Initials Avatar
              </p>
            </div>
          )}

          {/* Top-Right Header Overlay: Close Button */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile photo card"
              className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom-Right Plaque: Engineer Identity */}
          <div className="absolute bottom-3 right-3 z-20 max-w-[62%] p-2.5 sm:p-3 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md text-white shadow-xl pointer-events-none transition-all duration-300 group-hover:bg-black/75">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(status)} shrink-0`} />
              <p className="text-xs sm:text-sm font-semibold truncate leading-tight">{fullName}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/75 font-mono">
              <span>{employeeId}</span>
              <span>•</span>
              <span className="truncate">{role}</span>
            </div>
          </div>

          {/* Uiverse-Inspired Nested Sliding Corner Controls (Bottom-Left) */}
          <div className="absolute bottom-0 left-0 z-30 p-2.5 sm:p-3">
            {/* Sliding Corner Menu Box Container */}
            <div className={`flex flex-col gap-2 transition-all duration-300 ease-out ${
              isCornerRevealed 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-1 opacity-90 sm:translate-y-2 sm:opacity-75'
            }`}>
              {/* 1. Upload / Change Photo Action */}
              <button
                type="button"
                id="btn-card-change-photo"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-400/40 backdrop-blur-md shadow-lg transition-all duration-200 cursor-pointer hover:scale-102 hover:shadow-indigo-500/25 active:scale-98"
                title={hasCustomAvatar ? 'Change Photo' : 'Upload Photo'}
              >
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
                <span className="text-xs font-medium">
                  {hasCustomAvatar ? 'Change Photo' : 'Upload Photo'}
                </span>
              </button>

              {/* 2. Restore Default Initials (if custom photo is active) */}
              {hasCustomAvatar && (
                <button
                  type="button"
                  id="btn-card-restore-initials"
                  onClick={() => {
                    onRestoreInitials();
                    onClose();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-400/40 backdrop-blur-md shadow-lg transition-all duration-200 cursor-pointer hover:scale-102 hover:shadow-amber-500/25 active:scale-98"
                  title="Restore Default Initials"
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
                  <span className="text-xs font-medium">Restore Initials</span>
                </button>
              )}

              {/* 3. Remove Photo (if custom photo is active) */}
              {hasCustomAvatar && (
                <button
                  type="button"
                  id="btn-card-remove-photo"
                  onClick={() => {
                    onRemovePhoto();
                    onClose();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-400/40 backdrop-blur-md shadow-lg transition-all duration-200 cursor-pointer hover:scale-102 hover:shadow-rose-500/25 active:scale-98"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />
                  <span className="text-xs font-medium">Remove Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Accessibility Helper Hint */}
        <p className="text-[11px] font-mono text-slate-300/80 text-center select-none">
          Click outside or press Escape to dismiss
        </p>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
