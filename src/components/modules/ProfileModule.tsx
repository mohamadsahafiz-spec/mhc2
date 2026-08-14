import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Globe, 
  Clock, 
  ShieldCheck, 
  Camera, 
  Upload, 
  Trash2, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  BadgeCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { SystemUser, UserRole, UserStatus, NavigationTab } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { UserAvatar } from '../common/UserAvatar';

interface ProfileModuleProps {
  activeUser: SystemUser;
  onUpdateUser: (updatedUser: SystemUser) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  activeUser,
  onUpdateUser,
  onNavigate
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [formData, setFormData] = useState<SystemUser>({ ...activeUser });
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);

    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Invalid image format. Please upload JPG, PNG, or WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File size exceeds 5 MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const updated = { ...formData, avatarUrl: url };
      setFormData(updated);
      onUpdateUser(updated);
      setShowPhotoMenu(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Handle Remove Photo / Restore Default
  const handleRemovePhoto = () => {
    const updated = { ...formData, avatarUrl: undefined };
    setFormData(updated);
    onUpdateUser(updated);
    setShowPhotoMenu(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Submit Profile Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-r from-[#181B1E] via-[#1A1D21] to-[#141618] border-[#2B323A]' 
          : 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white border-indigo-950 shadow-md'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Interactive Profile Photo (PART 3) */}
            <div className="relative group shrink-0" ref={photoMenuRef}>
              <div 
                onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                className="relative cursor-pointer rounded-full p-1 bg-white/10 backdrop-blur-md border border-white/20 transition-transform duration-200 group-hover:scale-105"
                title="Click to manage profile photo"
              >
                <UserAvatar user={formData} size="2xl" showStatus={true} status={formData.status} />
                
                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 p-2">
                  <Camera className="w-5 h-5 text-indigo-300" />
                  <span>Edit Photo</span>
                </div>
              </div>

              {/* Photo Action Popover Menu */}
              {showPhotoMenu && (
                <div className={`absolute left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-56 rounded-xl border shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 ${
                  isDark ? 'bg-[#181B1E] border-[#2B323A] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="p-2 border-b border-[#2B323A]/50 mb-1">
                    <p className="text-[11px] font-bold text-slate-200">Profile Photo Actions</p>
                    <p className="text-[9px] text-slate-400">JPG, PNG, WEBP • Max 5 MB</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
                      isDark ? 'hover:bg-[#20252B] text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-[#8B9DFF]" />
                    <span>{formData.avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>

                  {formData.avatarUrl && (
                    <>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
                          isDark ? 'hover:bg-[#20252B] text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Restore Default Initials</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {formData.fullName}
                  <BadgeCheck className="w-5 h-5 text-emerald-400" />
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase">
                  {formData.role}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                {formData.company} • {formData.department} • ID: <strong className="text-white">{formData.employeeId}</strong>
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                <Mail className="w-3 h-3 text-indigo-300" /> {formData.email}
                <span className="text-slate-500">•</span>
                <Phone className="w-3 h-3 text-indigo-300" /> {formData.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('users')}
              icon={<User className="w-3.5 h-3.5" />}
            >
              View All Users
            </Button>
          </div>
        </div>

        {photoError && (
          <div className="mt-4 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{photoError}</span>
          </div>
        )}
      </div>

      {/* Main Profile Editor */}
      <Card title="My Engineer Profile & Account Credentials">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity & Contact Section */}
          <div className="space-y-4">
            <h3 className={`text-xs font-mono uppercase font-bold tracking-wider flex items-center gap-2 pb-2 border-b ${
              isDark ? 'text-slate-400 border-[#2B323A]' : 'text-slate-600 border-slate-200'
            }`}>
              <ShieldCheck className="w-4 h-4 text-[#8B9DFF]" />
              1. Personal & Professional Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isDark 
                      ? 'bg-[#141618] border-[#2B323A] text-slate-200 focus:border-[#8B9DFF]' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Employee ID
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.employeeId}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono text-slate-400 cursor-not-allowed ${
                    isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-100 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isDark 
                      ? 'bg-[#141618] border-[#2B323A] text-slate-200 focus:border-[#8B9DFF]' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isDark 
                      ? 'bg-[#141618] border-[#2B323A] text-slate-200 focus:border-[#8B9DFF]' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isDark 
                      ? 'bg-[#141618] border-[#2B323A] text-slate-200 focus:border-[#8B9DFF]' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isDark 
                      ? 'bg-[#141618] border-[#2B323A] text-slate-200 focus:border-[#8B9DFF]' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Role & Status Section */}
          <div className="space-y-4">
            <h3 className={`text-xs font-mono uppercase font-bold tracking-wider flex items-center gap-2 pb-2 border-b ${
              isDark ? 'text-slate-400 border-[#2B323A]' : 'text-slate-600 border-slate-200'
            }`}>
              <Briefcase className="w-4 h-4 text-[#8B9DFF]" />
              2. Operational Role & Real-Time Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Assigned Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isDark 
                      ? 'bg-[#141618] border-[#2B323A] text-slate-200 focus:border-[#8B9DFF]' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                  }`}
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Senior Engineer">Senior Engineer</option>
                  <option value="Field Service Engineer">Field Service Engineer</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Manager">Manager</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Real-Time Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isDark 
                      ? 'bg-[#141618] border-[#2B323A] text-slate-200 focus:border-[#8B9DFF]' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                  }`}
                >
                  <option value="Online">Online</option>
                  <option value="Busy">Busy (In Cleanroom / On Site)</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Regional Timezone
                </label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  placeholder="e.g. Asia/Kuala_Lumpur (UTC+08:00)"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isDark 
                      ? 'bg-[#141618] border-[#2B323A] text-slate-200 focus:border-[#8B9DFF]' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Bio & Field Notes */}
          <div className="space-y-4">
            <h3 className={`text-xs font-mono uppercase font-bold tracking-wider flex items-center gap-2 pb-2 border-b ${
              isDark ? 'text-slate-400 border-[#2B323A]' : 'text-slate-600 border-slate-200'
            }`}>
              <Layers className="w-4 h-4 text-[#8B9DFF]" />
              3. Specialized Qualifications & Bio
            </h3>

            <div>
              <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                Specialized Technical Qualifications / Bio
              </label>
              <textarea
                rows={3}
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="e.g. Lead Field Engineer certified for TRUMPF TruMicro ultra-fast laser systems and ASML stepper alignment."
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  isDark 
                    ? 'bg-[#141618] border-[#2B323A] text-slate-200 focus:border-[#8B9DFF]' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#2B323A]/60 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Profile Changes Saved Successfully
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono">
                Changes apply instantly across all FSOS modules.
              </span>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
