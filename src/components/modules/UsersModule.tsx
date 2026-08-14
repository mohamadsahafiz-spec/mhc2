import React, { useState } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  UserPlus, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  Clock, 
  X, 
  Edit3, 
  Check, 
  LogIn, 
  Shield, 
  Sparkles,
  User,
  Filter,
  MoreVertical,
  Briefcase,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Upload,
  Camera,
  RotateCcw
} from 'lucide-react';
import { SystemUser, UserRole, UserStatus, NavigationTab } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
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

  // Selected User for Profile Drawer/Modal
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(activeUser);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);

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

  // Role Badge Styling
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Administrator':
        return isDark 
          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
          : 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Senior Engineer':
        return isDark 
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
          : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Field Service Engineer':
        return isDark 
          ? 'bg-[#8B9DFF]/15 text-[#8B9DFF] border-[#8B9DFF]/30' 
          : 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Supervisor':
        return isDark 
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
          : 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Manager':
        return isDark 
          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' 
          : 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Viewer':
      default:
        return isDark 
          ? 'bg-slate-700/40 text-slate-300 border-slate-600/50' 
          : 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Status Badge Styling
  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'Online':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono border ${
            isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        );
      case 'Busy':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono border ${
            isDark ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Busy
          </span>
        );
      case 'On Leave':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono border ${
            isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            On Leave
          </span>
        );
      case 'Offline':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono border ${
            isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Offline
          </span>
        );
      case 'Inactive':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono border ${
            isDark ? 'bg-slate-900 text-slate-500 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Inactive
          </span>
        );
    }
  };

  // Get User Initials for Avatar
  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
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
      alert('Please provide at least Full Name and Email Address.');
      return;
    }

    const created: SystemUser = {
      id: `usr-${Date.now()}`,
      employeeId: newUserForm.employeeId || `EMP-EO-${Math.floor(8000 + Math.random() * 999)}`,
      fullName: newUserForm.fullName,
      email: newUserForm.email,
      phone: newUserForm.phone || '+60 12-000 0000',
      company: newUserForm.company || 'EO Technics',
      department: newUserForm.department || 'Service Operations',
      role: (newUserForm.role as UserRole) || 'Field Service Engineer',
      status: (newUserForm.status as UserStatus) || 'Online',
      lastLogin: 'Just registered',
      timezone: newUserForm.timezone || 'Asia/Kuala_Lumpur (UTC+08:00)',
      language: newUserForm.language || 'English (US)',
      accountStatus: 'Active',
      bio: newUserForm.bio || ''
    };

    onAddUser(created);
    setIsAddUserOpen(false);
    setSelectedUser(created);
  };

  const handleStartEdit = () => {
    if (selectedUser) {
      setEditForm(selectedUser);
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

  return (
    <div className="space-y-6 pb-12">
      {/* Module Title Header */}
      <div className={`p-6 rounded-2xl border transition-all duration-250 ${
        isDark ? 'bg-[#20252B] border-[#2B323A] text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                isDark ? 'bg-[#8B9DFF]/15 text-[#8B9DFF] border-[#8B9DFF]/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                USER MANAGEMENT • v0.7.5
              </span>
              <span className="text-[10px] font-mono text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Multi-Engineer Active ({users.length} Registered)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-[#8B9DFF]" />
              System Users & Directory
            </h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage field engineers, supervisors, administrators, and client accounts across global service operations.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddUserOpen(true)}
          >
            Add New User
          </Button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#2B323A]/50">
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141618] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-mono text-slate-400 block uppercase">TOTAL USERS</span>
            <p className="text-lg font-bold font-mono text-slate-100 dark:text-white mt-0.5">{users.length}</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141618] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-mono text-emerald-400 block uppercase">ONLINE NOW</span>
            <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {users.filter(u => u.status === 'Online').length}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141618] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-mono text-rose-400 block uppercase">ON FIELD / BUSY</span>
            <p className="text-lg font-bold font-mono text-rose-400 mt-0.5">
              {users.filter(u => u.status === 'Busy').length}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141618] border-[#2B323A]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-mono text-indigo-400 block uppercase">ACTIVE SIGNED-IN</span>
            <p className="text-xs font-bold truncate text-[#8B9DFF] mt-1.5">
              {activeUser.fullName}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Table + Profile Sidebar View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User List & Search Filters (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card>
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-[#2B323A]/50">
              <div className="relative w-full sm:w-64">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  placeholder="Search user, ID, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full text-xs rounded-xl pl-8 pr-3 py-1.5 border transition-all ${
                    isDark 
                      ? 'bg-[#141618] text-slate-200 border-[#2B323A] focus:border-[#8B9DFF]' 
                      : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-indigo-600'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`text-xs rounded-xl px-2.5 py-1.5 border font-mono ${
                    isDark ? 'bg-[#141618] text-slate-200 border-[#2B323A]' : 'bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                >
                  <option value="ALL">All Roles</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Field Service Engineer">Field Service Engineer</option>
                  <option value="Senior Engineer">Senior Engineer</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Manager">Manager</option>
                  <option value="Viewer">Viewer</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`text-xs rounded-xl px-2.5 py-1.5 border font-mono ${
                    isDark ? 'bg-[#141618] text-slate-200 border-[#2B323A]' : 'bg-slate-50 text-slate-900 border-slate-300'
                  }`}
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

            {/* Users Table (Simplified: 5 Columns, No Horizontal Scrolling) */}
            <div className="overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[10px] font-mono uppercase ${
                    isDark ? 'border-[#2B323A] text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    <th className="py-2.5 px-3 font-semibold w-2/5">Avatar & Full Name</th>
                    <th className="py-2.5 px-3 font-semibold w-1/5">Role</th>
                    <th className="py-2.5 px-3 font-semibold w-1/5">Department</th>
                    <th className="py-2.5 px-3 font-semibold w-1/6">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-1/6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B323A]/40">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No users match your criteria.
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
                          className={`transition-colors cursor-pointer group ${
                            isSelected 
                              ? isDark ? 'bg-[#8B9DFF]/10' : 'bg-indigo-50/70'
                              : isDark ? 'hover:bg-[#141618]/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* 1. Avatar & Full Name */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar user={u} size="md" showStatus={true} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className={`font-bold truncate ${
                                    isSelected ? 'text-[#8B9DFF] dark:text-[#8B9DFF]' : 'text-slate-100 dark:text-slate-100'
                                  }`}>
                                    {u.fullName}
                                  </p>
                                  {isActive && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-600 text-white uppercase shrink-0">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Role */}
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border inline-block truncate ${getRoleBadge(u.role)}`}>
                              {u.role}
                            </span>
                          </td>

                          {/* 3. Department */}
                          <td className="py-3 px-3 text-slate-300 dark:text-slate-300 truncate">
                            {u.department}
                          </td>

                          {/* 4. Status */}
                          <td className="py-3 px-3">
                            {getStatusBadge(u.status)}
                          </td>

                          {/* 5. Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isActive ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSetActiveUser(u);
                                    setSelectedUser(u);
                                  }}
                                  title="Set as Active Signed-in User"
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border shrink-0 ${
                                    isDark 
                                      ? 'bg-[#141618] border-[#2B323A] text-slate-300 hover:text-white hover:border-[#8B9DFF]' 
                                      : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300'
                                  }`}
                                >
                                  Switch User
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate('profile');
                                  }}
                                  title="Open My Profile"
                                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border shrink-0 ${
                                    isDark ? 'bg-[#8B9DFF]/15 border-[#8B9DFF]/40 text-[#8B9DFF] hover:bg-[#8B9DFF]/25' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                  }`}
                                >
                                  My Profile
                                </button>
                              )}

                              {!isActive && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUserToDelete(u);
                                  }}
                                  title="Delete User Account"
                                  className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                                    isDark 
                                      ? 'bg-[#141618] border-[#2B323A] text-slate-400 hover:text-rose-400 hover:border-rose-500/50' 
                                      : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300'
                                  }`}
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
          </Card>
        </div>

        {/* User Profile View Card (4 cols) */}
        <div className="lg:col-span-4">
          {selectedUser ? (
            <Card title="User Profile & Identity Details">
              <div className="space-y-5">
                {/* Profile Header Block */}
                <div className={`p-4 rounded-xl border text-center space-y-3 relative ${
                  isDark ? 'bg-[#141618] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-center">
                    <UserAvatar
                      user={selectedUser}
                      size="xl"
                      showStatus={true}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-100 dark:text-white flex items-center justify-center gap-1.5">
                      {selectedUser.fullName}
                      {activeUser.id === selectedUser.id && (
                        <ShieldCheck className="w-4 h-4 text-[#8B9DFF]" title="Active Signed-in User" />
                      )}
                    </h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {selectedUser.role} • {selectedUser.department}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getRoleBadge(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                    {getStatusBadge(selectedUser.status)}
                  </div>

                  {activeUser.id !== selectedUser.id ? (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full mt-2"
                      icon={<LogIn className="w-3.5 h-3.5" />}
                      onClick={() => onSetActiveUser(selectedUser)}
                    >
                      Set as Signed-in User
                    </Button>
                  ) : (
                    <div className="space-y-2 mt-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 font-mono">
                        <CheckCircle2 className="w-4 h-4" /> Active Signed-in Engineer
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        icon={<User className="w-3.5 h-3.5 text-[#8B9DFF]" />}
                        onClick={() => onNavigate('profile')}
                      >
                        Open My Profile
                      </Button>
                    </div>
                  )}
                </div>

                {/* Detailed Attributes Grid */}
                <div className="space-y-3 text-xs">
                  <div className={`p-3 rounded-xl border space-y-2.5 ${
                    isDark ? 'bg-[#141618] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-[#2B323A]/50">
                      <span className="font-bold text-slate-200">System Identity</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleStartEdit}
                          className={`text-[10px] font-mono font-bold hover:underline ${
                            isDark ? 'text-[#8B9DFF]' : 'text-indigo-600'
                          }`}
                        >
                          Edit Profile
                        </button>
                        {activeUser.id !== selectedUser.id && (
                          <>
                            <span className="text-slate-600">•</span>
                            <button
                              onClick={() => setUserToDelete(selectedUser)}
                              className="text-[10px] font-mono font-bold text-rose-400 hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">EMPLOYEE ID</span>
                        <span className="font-mono font-bold text-slate-200">{selectedUser.employeeId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">COMPANY</span>
                        <span className="font-semibold text-slate-200">{selectedUser.company}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">DEPARTMENT</span>
                        <span className="font-semibold text-slate-200">{selectedUser.department}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ACCOUNT STATUS</span>
                        <span className="font-semibold text-emerald-400">{selectedUser.accountStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border space-y-2.5 ${
                    isDark ? 'bg-[#141618] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="font-bold text-slate-200 block pb-2 border-b border-[#2B323A]/50">
                      Contact & Regional Meta
                    </span>

                    <div className="space-y-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-200 font-mono">{selectedUser.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-200 font-mono">{selectedUser.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-200 font-mono text-[10px] truncate">{selectedUser.timezone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-400 text-[10px]">Last Login: <strong className="text-slate-200">{selectedUser.lastLogin}</strong></span>
                      </div>
                    </div>
                  </div>

                  {selectedUser.bio && (
                    <div className={`p-3 rounded-xl border ${
                      isDark ? 'bg-[#141618] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase mb-1 font-bold">
                        BIO / CERTIFICATIONS
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        {selectedUser.bio}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card title="User Profile">
              <p className="text-xs text-slate-400 py-8 text-center">
                Select a user from the list to view profile details.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 ${
            isDark ? 'bg-[#181B1E] border-[#2B323A] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-[#2B323A]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Add New System User</h3>
                  <p className="text-xs text-slate-400">Register engineer or admin profile to multi-user registry</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sahafiz"
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-EO-8809"
                    value={newUserForm.employeeId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, employeeId: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border font-mono ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="sahafiz@eotechnics.com"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+60 12-345 6789"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border font-mono ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
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
                  <label className="block font-semibold mb-1 text-slate-300">Company</label>
                  <input
                    type="text"
                    value={newUserForm.company}
                    onChange={(e) => setNewUserForm({ ...newUserForm, company: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Bio & Specialty</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ultra-fast laser calibration specialist..."
                  value={newUserForm.bio}
                  onChange={(e) => setNewUserForm({ ...newUserForm, bio: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2B323A]">
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
                  Register System User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 ${
            isDark ? 'bg-[#181B1E] border-[#2B323A] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-[#2B323A]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Edit User Profile: {selectedUser.fullName}</h3>
                  <p className="text-xs text-slate-400">Update system attributes, contact, and role</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Employee ID</label>
                  <input
                    type="text"
                    value={editForm.employeeId || ''}
                    onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border font-mono ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
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
                  <label className="block font-semibold mb-1 text-slate-300">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UserStatus })}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Online">Online</option>
                    <option value="Busy">Busy</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Offline">Offline</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Company</label>
                  <input
                    type="text"
                    value={editForm.company || ''}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg border ${
                      isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Bio / Notes</label>
                <textarea
                  rows={2}
                  value={editForm.bio || ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg border ${
                    isDark ? 'bg-[#111315] border-[#2B323A] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2B323A]">
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
                  Save Profile Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal (ENGINEERING RULE #001) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 ${
            isDark ? 'bg-[#181B1E] border-[#2B323A] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 pb-4 border-b border-[#2B323A]">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-500">Confirm User Account Deletion</h3>
                <p className="text-xs text-slate-400">FSOS Engineering Rule #001 — Confirmation Required</p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#111315] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                  TARGET ACCOUNT TO BE REMOVED
                </span>
                <p className="font-bold text-sm text-slate-100 dark:text-white">
                  {userToDelete.fullName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-400">
                  <span>ID: <strong className="text-slate-200">{userToDelete.employeeId}</strong></span>
                  <span>•</span>
                  <span>{userToDelete.role}</span>
                  <span>•</span>
                  <span>{userToDelete.company}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Warning:</strong> Deleting this user account will permanently remove their profile and access permissions from the multi-engineer registry. This action is <strong>irreversible</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2B323A]">
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
                    setSelectedUser(users.find(u => u.id !== userToDelete.id) || null);
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
