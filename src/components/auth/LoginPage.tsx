import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, Check, Sparkles, KeyRound } from 'lucide-react';
import { SystemUser, WorkspaceMode, UserSession } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { FSOSWaferMark } from '../common/FSOSWaferMark';

interface LoginPageProps {
  users?: SystemUser[];
  activeUser?: SystemUser;
  onLogin?: (selectedUser: SystemUser, rememberMe: boolean, initialMode: WorkspaceMode) => void;
  onLoginSuccess?: (session: UserSession) => void;
  savedWorkspaceMode?: WorkspaceMode;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users = [],
  activeUser,
  onLogin,
  onLoginSuccess,
  savedWorkspaceMode = 'MHC_MODE'
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const defaultUser: SystemUser = activeUser || users[0] || {
    id: 'usr-8801',
    employeeId: 'EMP-EO-8801',
    fullName: 'Sahafiz',
    email: 'sahafiz@eotechnics.com',
    phone: '+60 12-882 1042',
    company: 'EO Technics',
    department: 'Service Operations',
    role: 'Field Service Engineer',
    status: 'Online',
    lastLogin: 'Active now',
    timezone: 'Asia/Kuala_Lumpur (UTC+08:00)',
    language: 'English (US)',
    accountStatus: 'Active',
    bio: 'Lead Field Engineer specialized in TRUMPF TruMicro ultra-fast laser systems.'
  };

  const [selectedUserId, setSelectedUserId] = useState<string>(activeUser?.id || users[0]?.id || 'usr-8801');
  const [emailInput, setEmailInput] = useState<string>(activeUser?.email || defaultUser.email || 'sahafiz@eotechnics.com');
  const [passwordInput, setPasswordInput] = useState<string>('••••••••••••');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [preferredMode, setPreferredMode] = useState<WorkspaceMode>(savedWorkspaceMode || 'MHC_MODE');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const u = users.find(usr => usr.id === userId);
    if (u) {
      setEmailInput(u.email);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const userToLogin = users.find(u => u.id === selectedUserId) || activeUser || defaultUser;
      if (onLogin) {
        onLogin(userToLogin, rememberMe, preferredMode);
      }
      if (onLoginSuccess) {
        const session: UserSession = {
          isAuthenticated: true,
          userId: userToLogin.id,
          engineerName: userToLogin.fullName,
          profilePhoto: userToLogin.avatar,
          role: userToLogin.role,
          company: userToLogin.company || 'EO Technics',
          department: userToLogin.department || 'Field Engineering',
          operationalStatus: userToLogin.status || 'Active',
          lastLogin: new Date().toISOString(),
          workspaceMode: preferredMode
        };
        onLoginSuccess(session);
      }
      setIsSubmitting(false);
    }, 350);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-250 select-none ${
      isDark ? 'bg-[#0E1012] text-[#F3F4F6]' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Container Frame */}
      <div className={`w-full max-w-md rounded-2xl border p-8 shadow-2xl transition-all ${
        isDark ? 'bg-[#14171A] border-[#2B323A]' : 'bg-white border-slate-300'
      }`}>
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 mb-2 shadow-inner">
            <FSOSWaferMark className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black tracking-wider uppercase font-mono">FSOS</h1>
          <p className="text-xs font-bold font-mono tracking-widest text-indigo-500 uppercase">
            FIELD SERVICE OPERATIONS SYSTEM
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} font-medium`}>
            Precision Field Engineering Platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Engineer Profile Switcher */}
          {users.length > 0 && (
            <div className="space-y-1.5">
              <label className={`block text-[11px] font-mono font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Select Field Engineer Account
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
                className={`w-full text-xs font-medium rounded-xl p-2.5 border transition-all ${
                  isDark
                    ? 'bg-[#1C2024] border-[#2B323A] text-slate-100 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} — {u.role} ({u.company})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Email / Engineer ID */}
          <div className="space-y-1.5">
            <label className={`block text-[11px] font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Email / Engineer ID
            </label>
            <div className="relative">
              <User className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="engineer@eotechnics.com"
                className={`w-full text-xs rounded-xl pl-9 pr-3 py-2.5 border font-mono transition-all ${
                  isDark
                    ? 'bg-[#1C2024] border-[#2B323A] text-slate-100 placeholder-slate-600 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                }`}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className={`block text-[11px] font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full text-xs rounded-xl pl-9 pr-3 py-2.5 border font-mono transition-all ${
                  isDark
                    ? 'bg-[#1C2024] border-[#2B323A] text-slate-100 placeholder-slate-600 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                }`}
              />
            </div>
          </div>

          {/* Workspace Mode Choice on Entry */}
          <div className="space-y-1.5 pt-1">
            <label className={`block text-[11px] font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Target Operational Workspace
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreferredMode('MHC_MODE')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 ${
                  preferredMode === 'MHC_MODE'
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400 font-bold'
                    : isDark
                      ? 'bg-[#1C2024] border-[#2B323A] text-slate-400 hover:text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>MHC Mode</span>
                  {preferredMode === 'MHC_MODE' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Focused Health Check</span>
              </button>

              <button
                type="button"
                onClick={() => setPreferredMode('FOUNDER_MODE')}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 ${
                  preferredMode === 'FOUNDER_MODE'
                    ? 'bg-purple-600/15 border-purple-500 text-purple-400 font-bold'
                    : isDark
                      ? 'bg-[#1C2024] border-[#2B323A] text-slate-400 hover:text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>Founder Mode</span>
                  {preferredMode === 'FOUNDER_MODE' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Complete Platform</span>
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Remember session</span>
            </label>
            <span className="text-[11px] font-mono text-indigo-400 cursor-pointer hover:underline">
              Reset Key
            </span>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Authenticating Session...</span>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Badge */}
        <div className={`mt-6 pt-4 border-t flex items-center justify-between text-[11px] font-mono ${
          isDark ? 'border-[#2B323A] text-slate-500' : 'border-slate-200 text-slate-500'
        }`}>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            CLEANROOM AUTH READY
          </span>
          <span className="font-bold text-slate-400">System Version v0.8.1</span>
        </div>
      </div>
    </div>
  );
};
