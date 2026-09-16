import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  UserPlus, 
  Check, 
  Mail, 
  Phone, 
  Globe, 
  X, 
  Edit3, 
  LogIn, 
  Trash2, 
  AlertTriangle, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { SystemUser, UserRole, UserStatus, NavigationTab } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { UserAvatar } from '../common/UserAvatar';

interface UsersModuleProps {
  users: SystemUser[];
  activeUser: SystemUser;
  onSetActiveUser: (user: SystemUser) => void;
  onAddUser: (user: SystemUser) => void;
  onUpdateUser: (user: SystemUser) => void;
  onDeleteUser?: (userId: string) => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const UsersModule: React.FC<UsersModuleProps> = ({
  users,
  activeUser,
  onSetActiveUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onNavigate
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected User for Inspector Pane
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(activeUser);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);

  // Sync selectedUser with activeUser if activeUser changes and was selected or not set
  useEffect(() => {
    if (!selectedUser || selectedUser.id === activeUser.id) {
      setSelectedUser(activeUser);
    }
  }, [activeUser]);

  // Edit User Form State
  const [editForm, setEditForm] = useState<Partial<SystemUser>>({});

  // New User Form State
  const [newUserForm, setNewUserForm] = useState<Partial<SystemUser>>({
    fullName: '',
    employeeId: `EMP-EO-${Math.floor(8000 + Math.random() * 999)}`,
    email: '',
    phone: '',
    company: 'EO Technics',
    department: 'Service Operations',
    role: 'Field Service Engineer',
    status: 'Online',
    timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
    language: 'English (US)',
    accountStatus: 'Active',
    bio: ''
  });

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      u.fullName.toLowerCase().includes(query) ||
      u.employeeId.toLowerCase().includes(query) ||
      u.company.toLowerCase().includes(query) ||
      u.department.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.fullName || !newUserForm.email) {
      return;
    }

    const created: SystemUser = {
      id: `usr-${Date.now()}`,
      employeeId: newUserForm.employeeId || `EMP-EO-${Math.floor(8000 + Math.random() * 999)}`,
      fullName: newUserForm.fullName.trim(),
      email: newUserForm.email.trim(),
      phone: newUserForm.phone?.trim() || '+60 12-000 0000',
      company: newUserForm.company?.trim() || 'EO Technics',
      department: newUserForm.department?.trim() || 'Service Operations',
      role: (newUserForm.role as UserRole) || 'Field Service Engineer',
      status: (newUserForm.status as UserStatus) || 'Online',
      lastLogin: 'Just registered',
      timezone: newUserForm.timezone || 'Asia/Kuala_Lumpur (UTC+08:00)',
      language: newUserForm.language || 'English (US)',
      accountStatus: 'Active',
      bio: newUserForm.bio?.trim() || ''
    };

    onAddUser(created);
    setIsAddUserOpen(false);
    setSelectedUser(created);
  };

  const handleStartEdit = () => {
    if (selectedUser) {
      setEditForm({ ...selectedUser });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedUser && editForm) {
      const updated = { ...selectedUser, ...editForm } as SystemUser;
      onUpdateUser(updated);
      setSelectedUser(updated);
      setIsEditing(false);
    }
  };

  const onlineCount = users.filter(u => u.status === 'Online').length;
  const busyCount = users.filter(u => u.status === 'Busy').length;

  // Restrained semantic status indicator
  const renderStatus = (status: UserStatus) => {
    let dotColor = 'bg-slate-400';
    let labelColor = 'text-slate-500 dark:text-slate-400';

    if (status === 'Online') {
      dotColor = 'bg-emerald-500';
      labelColor = 'text-emerald-700 dark:text-emerald-400';
    } else if (status === 'Busy' || status === 'On Leave') {
      dotColor = 'bg-amber-500';
      labelColor = 'text-amber-700 dark:text-amber-400';
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className={labelColor}>{status}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Quiet Industrial Telemetry */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              Engineers Directory
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Field engineers, operational roles, and session access across service operations.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddUserOpen(true)}
            className="self-start sm:self-center shrink-0"
          >
            Add User
          </Button>
        </div>

        {/* Quiet Telemetry Line */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400 py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-[#16191D] border border-slate-200 dark:border-[#262B33]">
          <div className="flex items-center gap-2">
            <span>Total:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">{users.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Online:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">{onlineCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>On Field:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">{busyCount}</span>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-slate-400 dark:text-slate-500">Session Operator:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {activeUser.fullName}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Master / Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Master Directory (7 cols / ~60%) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-lg pl-8 pr-7 py-2 border bg-white dark:bg-[#16191D] text-slate-900 dark:text-slate-100 border-slate-200 dark:border-[#2B323A] focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs rounded-lg px-2.5 py-2 border bg-white dark:bg-[#16191D] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2B323A] focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 w-full sm:w-auto font-mono"
              >
                <option value="ALL">All Roles</option>
                <option value="Field Service Engineer">Field Service Engineer</option>
                <option value="Senior Engineer">Senior Engineer</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Administrator">Administrator</option>
                <option value="Manager">Manager</option>
                <option value="Viewer">Viewer</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-lg px-2.5 py-2 border bg-white dark:bg-[#16191D] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2B323A] focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 w-full sm:w-auto font-mono"
              >
                <option value="ALL">All Statuses</option>
                <option value="Online">Online</option>
                <option value="Busy">Busy</option>
                <option value="On Leave">On Leave</option>
                <option value="Offline">Offline</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          <div className="rounded-xl border bg-white dark:bg-[#1A1D21] border-slate-200 dark:border-[#2B323A] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#2B323A] text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#141618]">
                    <th className="py-2.5 px-3.5 font-medium">Engineer</th>
                    <th className="py-2.5 px-3 font-medium hidden sm:table-cell">Role & Department</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 px-3.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#252A31]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 px-4 text-center">
                        <div className="max-w-sm mx-auto space-y-1.5">
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {users.length === 0 ? 'No registered engineers' : 'No matching engineers found'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {users.length === 0 
                              ? 'The directory is currently empty. Register an engineer using the Add User button.'
                              : 'Adjust your search query or filter settings.'}
                          </p>
                          {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? (
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setRoleFilter('ALL');
                                setStatusFilter('ALL');
                              }}
                              className="text-xs font-mono text-slate-600 dark:text-slate-400 hover:underline pt-1 inline-block"
                            >
                              Reset filters
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isActive = activeUser.id === u.id;
                      const isSelected = selectedUser?.id === u.id;

                      return (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`transition-colors cursor-pointer ${
                            isSelected 
                              ? isDark 
                                ? 'bg-[#22272E] border-l-2 border-l-slate-400' 
                                : 'bg-slate-100/90 border-l-2 border-l-slate-600'
                              : isDark 
                                ? 'hover:bg-[#1F2329] border-l-2 border-l-transparent' 
                                : 'hover:bg-slate-50 border-l-2 border-l-transparent'
                          }`}
                        >
                          {/* 1. Engineer Identity */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-3">
                              <UserAvatar user={u} size="sm" showStatus={false} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`font-semibold truncate text-xs ${
                                    isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                                  }`}>
                                    {u.fullName}
                                  </span>
                                  {isActive && (
                                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-normal">
                                      (Current)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                                  {u.employeeId}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Role & Department (Readable Text, No Rainbow Badges) */}
                          <td className="py-3 px-3 hidden sm:table-cell">
                            <div className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate">
                              {u.role}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {u.department}
                            </div>
                          </td>

                          {/* 3. Status */}
                          <td className="py-3 px-3">
                            {renderStatus(u.status)}
                          </td>

                          {/* 4. Action */}
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              {!isActive ? (
                                <button
                                  onClick={() => {
                                    onSetActiveUser(u);
                                    setSelectedUser(u);
                                  }}
                                  title="Switch active session operator to this user"
                                  className="px-2.5 py-1 rounded text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A3038] border border-slate-300 dark:border-[#38404B] transition-colors"
                                >
                                  Switch
                                </button>
                              ) : (
                                <button
                                  onClick={() => onNavigate('profile')}
                                  title="Open My Profile settings"
                                  className="px-2.5 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:underline transition-colors"
                                >
                                  My Profile
                                </button>
                              )}

                              {!isActive && (
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  title="Delete User Record"
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Selected Engineer Inspector (5 cols / ~40%) */}
        <div className="lg:col-span-5">
          {selectedUser ? (
            <div className="rounded-xl border bg-white dark:bg-[#1A1D21] border-slate-200 dark:border-[#2B323A] overflow-hidden shadow-xs">
              {/* Inspector Header */}
              <div className="p-4 border-b border-slate-200 dark:border-[#2B323A] bg-slate-50/50 dark:bg-[#16191D]">
                <div className="flex items-start gap-3.5">
                  <UserAvatar user={selectedUser} size="lg" showStatus={false} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base text-slate-900 dark:text-white truncate">
                      {selectedUser.fullName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
                      <span>{selectedUser.employeeId}</span>
                      <span>•</span>
                      <span>{selectedUser.company}</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                      {selectedUser.role} · {selectedUser.department}
                    </div>
                    <div className="mt-2">
                      {renderStatus(selectedUser.status)}
                    </div>
                  </div>
                </div>

                {/* Session Notice / Switch Action */}
                <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-[#262B33] flex items-center justify-between gap-2">
                  {activeUser.id === selectedUser.id ? (
                    <div className="flex items-center justify-between w-full text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active Session Operator
                      </span>
                      <button
                        onClick={() => onNavigate('profile')}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 hover:underline"
                      >
                        Profile Settings
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-slate-500">Directory Record</span>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<LogIn className="w-3.5 h-3.5" />}
                        onClick={() => onSetActiveUser(selectedUser)}
                      >
                        Switch Session Operator
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Inspector Content Sheet */}
              <div className="p-4 space-y-4 text-xs">
                {/* Section 1: Operational Information */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <span>Operational Details</span>
                    <button
                      onClick={handleStartEdit}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 lowercase font-sans font-medium"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 pt-1">
                    <div>
                      <div className="text-[11px] text-slate-500">Company</div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedUser.company}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Department</div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedUser.department}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Account Status</div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedUser.accountStatus}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Last Activity</div>
                      <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">{selectedUser.lastLogin}</div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact & Region */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#252A31] space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Contact & Region
                  </div>
                  <div className="space-y-2 pt-1 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-xs">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-xs">{selectedUser.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs truncate">{selectedUser.timezone}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Notes / Specialization */}
                {selectedUser.bio && (
                  <div className="pt-3 border-t border-slate-100 dark:border-[#252A31] space-y-1.5">
                    <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Specialization & Notes
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {selectedUser.bio}
                    </p>
                  </div>
                )}

                {/* Section 4: Actions Footer */}
                <div className="pt-4 border-t border-slate-200 dark:border-[#262B33] flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={handleStartEdit}
                  >
                    Edit Profile
                  </Button>

                  {selectedUser.id !== activeUser.id ? (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => setUserToDelete(selectedUser)}
                    >
                      Delete
                    </Button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Active user protected
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-white dark:bg-[#1A1D21] border-slate-200 dark:border-[#2B323A] p-8 text-center text-xs text-slate-400">
              Select an engineer from the directory list to view profile details.
            </div>
          )}
        </div>
      </div>

      {/* 3. Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border p-6 bg-white dark:bg-[#181B1E] border-slate-200 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2B323A]">
              <div>
                <h3 className="font-semibold text-base">Add New Engineer</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Register a field engineer or team member</p>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sahafiz"
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-EO-8809"
                    value={newUserForm.employeeId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, employeeId: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border font-mono bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="sahafiz@eotechnics.com"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+60 12-345 6789"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border font-mono bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  >
                    <option value="Field Service Engineer">Field Service Engineer</option>
                    <option value="Senior Engineer">Senior Engineer</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Manager">Manager</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Company</label>
                  <input
                    type="text"
                    value={newUserForm.company}
                    onChange={(e) => setNewUserForm({ ...newUserForm, company: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Specialization & Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Laser calibration and field service specialist..."
                  value={newUserForm.bio}
                  onChange={(e) => setNewUserForm({ ...newUserForm, bio: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#2B323A]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Register Engineer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit User Modal */}
      {isEditing && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border p-6 bg-white dark:bg-[#181B1E] border-slate-200 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2B323A]">
              <div>
                <h3 className="font-semibold text-base">Edit Profile: {selectedUser.fullName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update system attributes, contact, and operational status</p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Employee ID</label>
                  <input
                    type="text"
                    value={editForm.employeeId || ''}
                    onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border font-mono bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  >
                    <option value="Field Service Engineer">Field Service Engineer</option>
                    <option value="Senior Engineer">Senior Engineer</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Manager">Manager</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UserStatus })}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  >
                    <option value="Online">Online</option>
                    <option value="Busy">Busy</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Offline">Offline</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Company</label>
                  <input
                    type="text"
                    value={editForm.company || ''}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Specialization & Notes</label>
                <textarea
                  rows={2}
                  value={editForm.bio || ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-[#111315] border-slate-300 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#2B323A]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<Check className="w-3.5 h-3.5" />}
                  onClick={handleSaveEdit}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border p-6 bg-white dark:bg-[#181B1E] border-slate-200 dark:border-[#2B323A] text-slate-900 dark:text-slate-100 shadow-xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-[#2B323A]">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-rose-600 dark:text-rose-400">Confirm Account Deletion</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">FSOS Explicit Confirmation Requirement</p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 rounded-lg border bg-slate-50 dark:bg-[#111315] border-slate-200 dark:border-[#2B323A]">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                  Target Account
                </span>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  {userToDelete.fullName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500">
                  <span>ID: <strong className="text-slate-700 dark:text-slate-300">{userToDelete.employeeId}</strong></span>
                  <span>•</span>
                  <span>{userToDelete.role}</span>
                  <span>•</span>
                  <span>{userToDelete.company}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Warning:</strong> Deleting this account will remove this engineer from the directory. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#2B323A]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (onDeleteUser) {
                    onDeleteUser(userToDelete.id);
                  }
                  if (selectedUser?.id === userToDelete.id) {
                    setSelectedUser(users.find(u => u.id !== userToDelete.id) || activeUser);
                  }
                  setUserToDelete(null);
                }}
              >
                Permanently Delete User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
