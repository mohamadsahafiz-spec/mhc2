import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  FileText,
  Lock,
  Unlock,
  MapPin,
  Compass,
  ArrowRight,
  Plus,
  Search,
  Check,
  X,
  Layers
} from 'lucide-react';
import { SystemUser, UserRole, UserStatus, NavigationTab, WorkspaceMode, Plant, Customer } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { UserAvatar } from '../common/UserAvatar';
import { Button } from '../common/Button';
import { CANONICAL_TIMEZONES } from '../../constants/timezones';
import { ServiceCoverageMap } from '../profile/ServiceCoverageMap';
import { ManageCoverageModal } from '../profile/ManageCoverageModal';
import { ProfilePhotoCardModal } from '../profile/ProfilePhotoCardModal';

interface ProfileModuleProps {
  activeUser: SystemUser;
  currentUserRole?: UserRole;
  workspaceMode?: WorkspaceMode;
  plants?: Plant[];
  customers?: Customer[];
  onUpdateUser: (updatedUser: SystemUser) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  activeUser,
  currentUserRole,
  workspaceMode,
  plants = [],
  customers = [],
  onUpdateUser,
  onNavigate
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Determine administrative authorization using the existing role & workspace model
  const effectiveRole = currentUserRole || activeUser.role;
  const isAuthorizedAdmin = 
    effectiveRole === 'Administrator' || 
    workspaceMode === 'FOUNDER_MODE';

  const [formData, setFormData] = useState<SystemUser>({ ...activeUser });
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPhotoCardOpen, setIsPhotoCardOpen] = useState(false);

  // Service Coverage Assignment State
  const [isManageCoverageOpen, setIsManageCoverageOpen] = useState(false);

  // Sync state when activeUser prop changes
  useEffect(() => {
    setFormData({ ...activeUser });
  }, [activeUser]);

  // Stage Photo Upload from File into form lifecycle
  const handleFileSelected = (file: File) => {
    setPhotoError(null);

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Invalid image format. Supported formats: JPG, PNG, WEBP.');
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Stage Remove Photo / Restore Default Initials into form lifecycle
  const handleRemovePhoto = () => {
    const updated = { ...formData, avatarUrl: undefined };
    setFormData(updated);
    onUpdateUser(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Service Location Assignment Handlers
  const currentAssignedIds = useMemo(() => {
    return formData.assignedServiceLocations || [];
  }, [formData.assignedServiceLocations]);

  // Resolved list of assigned plant entities
  const assignedPlants = useMemo(() => {
    return currentAssignedIds
      .map(id => plants.find(p => p.id === id))
      .filter((p): p is Plant => Boolean(p));
  }, [currentAssignedIds, plants]);

  // Save Coverage from ManageCoverageModal
  const handleSaveCoverage = (selectedPlantIds: string[]) => {
    if (!isAuthorizedAdmin) return;
    setFormData(prev => ({ ...prev, assignedServiceLocations: selectedPlantIds }));
  };

  // Submit Profile Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Identity Field Editability & Assignment enforcement:
    // If authorized admin/founder: allow employeeId, role, and assignedServiceLocations changes.
    // If standard engineer: strictly lock to original activeUser.employeeId, activeUser.role, and activeUser.assignedServiceLocations to prevent self-elevation.
    const safeData: SystemUser = {
      ...formData,
      employeeId: isAuthorizedAdmin ? formData.employeeId : activeUser.employeeId,
      role: isAuthorizedAdmin ? formData.role : activeUser.role,
      assignedServiceLocations: isAuthorizedAdmin ? formData.assignedServiceLocations : activeUser.assignedServiceLocations
    };

    onUpdateUser(safeData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getStatusBadgeStyle = (status: UserStatus) => {
    switch (status) {
      case 'Online':
        return isDark 
          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80' 
          : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Busy':
        return isDark 
          ? 'bg-amber-950/60 text-amber-400 border-amber-800/80' 
          : 'bg-amber-50 text-amber-700 border-amber-200';
      case 'On Leave':
        return isDark 
          ? 'bg-blue-950/60 text-blue-400 border-blue-800/80' 
          : 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Offline':
      default:
        return isDark 
          ? 'bg-slate-900 text-slate-400 border-slate-700' 
          : 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // Check if current timezone exists in canonical options, otherwise provide fallback option
  const isCustomTimezone = Boolean(
    formData.timezone && 
    !CANONICAL_TIMEZONES.some(tz => tz.value === formData.timezone)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Engineer Identity Header (Calm Industrial Surface) */}
      <div 
        className={`p-5 rounded-lg border transition-colors ${
          isDark 
            ? 'bg-[#16191D] border-[#2B323A]' 
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Interactive Profile Photo (Opens Expandable Photo Card) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsPhotoCardOpen(true)}
                aria-label="View and manage profile photo card"
                className={`relative group rounded-full p-0.5 border cursor-pointer transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-slate-400 ${
                  isDark 
                    ? 'border-[#2B323A] hover:border-slate-500 bg-[#1C2026]' 
                    : 'border-slate-200 hover:border-slate-300 bg-slate-100'
                }`}
              >
                <UserAvatar user={formData} size="xl" showStatus={true} status={formData.status} />
                
                {/* Subtle Camera Hover Indicator */}
                <div className="absolute inset-0 rounded-full bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-slate-200 text-[10px] font-medium p-1">
                  <Camera className="w-4 h-4 text-slate-300" />
                  <span className="text-[9px]">Expand</span>
                </div>
              </button>
            </div>

            {/* Core Identity Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className={`text-lg font-semibold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {formData.fullName || 'Service Engineer'}
                </h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border uppercase ${
                  isDark ? 'bg-[#1C2026] text-slate-300 border-[#3D4754]' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {formData.role}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusBadgeStyle(formData.status)}`}>
                  {formData.status}
                </span>
              </div>
              <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {formData.company} • {formData.department} • <span className="text-slate-500">ID:</span> <span className={isDark ? 'text-slate-200' : 'text-slate-800 font-semibold'}>{formData.employeeId}</span>
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-2 pt-0.5">
                <span>{formData.email}</span>
                {formData.phone && (
                  <>
                    <span>•</span>
                    <span>{formData.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('users')}
              icon={<User className="w-3.5 h-3.5" />}
            >
              Engineers Directory
            </Button>
          </div>
        </div>

        {photoError && (
          <div className="mt-3 p-2.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{photoError}</span>
          </div>
        )}
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`p-5 rounded-lg border transition-colors ${
          isDark 
            ? 'bg-[#16191D] border-[#2B323A]' 
            : 'bg-white border-slate-200 shadow-xs'
        }`}>
          {/* Section 2: Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Personal Information
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">Account Identity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label 
                  htmlFor="profile-fullname" 
                  className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  Full Name
                </label>
                <input
                  id="profile-fullname"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-3 py-2 rounded border text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                    isDark 
                      ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 placeholder-slate-600 focus:border-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label 
                    htmlFor="profile-empid" 
                    className={`block text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    Employee ID
                  </label>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    {isAuthorizedAdmin ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" /> Admin Editable
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Read-Only
                      </span>
                    )}
                  </span>
                </div>
                <input
                  id="profile-empid"
                  type="text"
                  disabled={!isAuthorizedAdmin}
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className={`w-full px-3 py-2 rounded border text-xs font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                    !isAuthorizedAdmin
                      ? isDark 
                        ? 'bg-[#111315] border-[#2B323A] text-slate-500 cursor-not-allowed' 
                        : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      : isDark
                        ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 focus:border-slate-400'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                  }`}
                />
              </div>

              <div>
                <label 
                  htmlFor="profile-email" 
                  className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  Corporate Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 rounded border text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                    isDark 
                      ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 placeholder-slate-600 focus:border-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  }`}
                />
              </div>

              <div>
                <label 
                  htmlFor="profile-phone" 
                  className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 rounded border text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                    isDark 
                      ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 placeholder-slate-600 focus:border-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  }`}
                />
              </div>

              <div>
                <label 
                  htmlFor="profile-company" 
                  className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  Organization / Company
                </label>
                <input
                  id="profile-company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className={`w-full px-3 py-2 rounded border text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                    isDark 
                      ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 placeholder-slate-600 focus:border-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  }`}
                />
              </div>

              <div>
                <label 
                  htmlFor="profile-department" 
                  className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  Department / Unit
                </label>
                <input
                  id="profile-department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={`w-full px-3 py-2 rounded border text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                    isDark 
                      ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 placeholder-slate-600 focus:border-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Operational Profile */}
          <div className="space-y-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Operational Profile
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">Service Assignment</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label 
                    htmlFor="profile-role" 
                    className={`block text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    System Security Role
                  </label>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    {isAuthorizedAdmin ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" /> Admin Managed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Managed
                      </span>
                    )}
                  </span>
                </div>
                {isAuthorizedAdmin ? (
                  <select
                    id="profile-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className={`w-full px-3 py-2 rounded border text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                      isDark 
                        ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 focus:border-slate-400' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                    }`}
                  >
                    <option value="Field Service Engineer">Field Service Engineer</option>
                    <option value="Senior Engineer">Senior Engineer</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Manager">Manager</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                ) : (
                  <input
                    id="profile-role"
                    type="text"
                    disabled
                    value={formData.role}
                    className={`w-full px-3 py-2 rounded border text-xs font-medium cursor-not-allowed ${
                      isDark 
                        ? 'bg-[#111315] border-[#2B323A] text-slate-400' 
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  />
                )}
                <p className="text-[10px] text-slate-500 mt-1">
                  {isAuthorizedAdmin 
                    ? 'Administrator privilege enabled for system access governance.' 
                    : 'Assigned by system administrator in the Engineers Directory.'}
                </p>
              </div>

              <div>
                <label 
                  htmlFor="profile-status" 
                  className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  Operational Status
                </label>
                <select
                  id="profile-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                  className={`w-full px-3 py-2 rounded border text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                    isDark 
                      ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 focus:border-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                  }`}
                >
                  <option value="Online">Online</option>
                  <option value="Busy">Busy (In Cleanroom / On Site)</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Offline">Offline</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Active availability across service missions.
                </p>
              </div>

              <div>
                <label 
                  htmlFor="profile-timezone" 
                  className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                >
                  Regional Timezone
                </label>
                <select
                  id="profile-timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className={`w-full px-3 py-2 rounded border text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono ${
                    isDark 
                      ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 focus:border-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                  }`}
                >
                  {isCustomTimezone && (
                    <option value={formData.timezone}>
                      {formData.timezone} (Preserved Custom)
                    </option>
                  )}
                  {CANONICAL_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Used for cleanroom schedule alignment.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Technical Qualifications & Bio */}
          <div className="space-y-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Technical Qualifications & Field Bio
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">Professional Record</span>
            </div>

            <div>
              <label 
                htmlFor="profile-bio" 
                className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
              >
                Specialized Qualifications / Field Profile
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Field service qualifications, optical certifications, and equipment specializations..."
                className={`w-full px-3 py-2 rounded border text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 ${
                  isDark 
                    ? 'bg-[#1C2026] border-[#2B323A] text-slate-200 placeholder-slate-600 focus:border-slate-400' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-500'
                }`}
              />
            </div>
          </div>

          {/* Section 5: Service Coverage & Interactive Geographic Map */}
          <div className="space-y-4 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <h2 className={`text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Service Coverage & Territory Map
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {assignedPlants.length} of {plants.length} Sites Covered
                </span>
                {isAuthorizedAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsManageCoverageOpen(true)}
                    icon={<Compass className="w-3.5 h-3.5 text-slate-400" />}
                  >
                    Manage Coverage
                  </Button>
                )}
              </div>
            </div>

            {/* REAL VISIBLE OPENSTREETMAP COMPONENT */}
            <ServiceCoverageMap
              assignedPlants={assignedPlants}
              allPlants={plants}
              userTimezone={formData.timezone}
              isAuthorizedAdmin={isAuthorizedAdmin}
              onManageCoverageClick={isAuthorizedAdmin ? () => setIsManageCoverageOpen(true) : undefined}
            />

            {/* List of Assigned Locations */}
            {assignedPlants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {assignedPlants.map((plant) => (
                  <div 
                    key={plant.id}
                    className={`p-3.5 rounded-lg border flex items-start justify-between gap-3 transition-colors ${
                      isDark 
                        ? 'bg-[#111315] border-[#2B323A] hover:border-slate-600' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded shrink-0 border mt-0.5 ${
                        isDark ? 'bg-[#1C2026] border-[#2B323A] text-sky-400' : 'bg-white border-slate-200 text-indigo-600'
                      }`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                            {plant.customerName}
                          </p>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            isDark ? 'bg-[#181B1E] text-slate-400 border-[#2B323A]' : 'bg-white text-slate-600 border-slate-200'
                          }`}>
                            {plant.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span>{plant.location || 'Location not specified'}</span>
                        </p>
                        {plant.timezone && (
                          <p className="text-[10px] text-slate-400 font-mono pt-0.5">
                            TZ: {plant.timezone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Remove Action (Only for authorized admin) */}
                    {isAuthorizedAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = currentAssignedIds.filter(id => id !== plant.id);
                          setFormData(prev => ({ ...prev, assignedServiceLocations: updated }));
                        }}
                        title="Remove service location coverage"
                        aria-label={`Remove coverage for ${plant.customerName} ${plant.name}`}
                        className={`p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 ${
                          isDark ? 'hover:bg-rose-950/40' : 'hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Honest Informative Location Summary */
              <div className={`p-3.5 rounded-lg border ${
                isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded shrink-0 border ${
                    isDark ? 'bg-[#1C2026] border-[#2B323A] text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      No service locations assigned.
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {isAuthorizedAdmin 
                        ? 'Click "Manage Coverage" to select customer sites and configure active service coverage for this engineer profile.'
                        : 'The map above reflects regional semiconductor manufacturing facilities. Direct facility dispatch assignments can be configured by an administrator.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Save State & Action Footer */}
          <div className="pt-5 mt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              {saveSuccess ? (
                <span className="text-xs font-medium text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile updated and synchronized.
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Updates reflect across Daily Work, MHC inspections, and the Engineers Directory.
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Save className="w-3.5 h-3.5" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </div>
      </form>

      {/* Manage Service Coverage Modal */}
      <ManageCoverageModal
        isOpen={isManageCoverageOpen}
        onClose={() => setIsManageCoverageOpen(false)}
        allPlants={plants}
        customers={customers}
        assignedPlantIds={currentAssignedIds}
        onSaveCoverage={handleSaveCoverage}
      />

      {/* Expandable Profile Photo Card Modal */}
      <ProfilePhotoCardModal
        isOpen={isPhotoCardOpen}
        onClose={() => setIsPhotoCardOpen(false)}
        user={formData}
        onUploadPhoto={handleFileSelected}
        onRestoreInitials={handleRemovePhoto}
        onRemovePhoto={handleRemovePhoto}
        isDark={isDark}
      />
    </div>
  );
};
