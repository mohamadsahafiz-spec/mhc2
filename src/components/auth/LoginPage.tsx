import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Lock, User, ArrowRight, Check, Loader2 } from 'lucide-react';
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
  const prefersReducedMotion = useReducedMotion();

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
    bio: 'Field Service Engineer certified for precision laser systems and cleanroom diagnostics.'
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
    if (isSubmitting) return;
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
          profilePhoto: userToLogin.avatarUrl,
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
    }, prefersReducedMotion ? 100 : 320);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.28,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: prefersReducedMotion ? 0 : 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 4 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.2,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-200 select-none ${
      isDark ? 'bg-[#101216] text-[#F3F4F6]' : 'bg-[#F4F6F9] text-slate-900'
    }`}>
      {/* Subtle Engineering Grid Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(${isDark ? '#FFFFFF' : '#0F172A'} 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
        aria-hidden="true"
      />

      {/* Main Login Composition */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`w-full max-w-md rounded-xl border p-6 sm:p-8 shadow-xl relative z-10 transition-colors ${
          isDark 
            ? 'bg-[#16191E] border-[#272E38] shadow-black/40' 
            : 'bg-white border-slate-200/90 shadow-slate-900/5'
        }`}
      >
        {/* Brand Header */}
        <motion.div variants={itemVariants} className="text-center space-y-1.5 mb-7">
          <div className="flex justify-center mb-3">
            <div className={`inline-flex items-center justify-center p-2 rounded-xl border transition-colors ${
              isDark 
                ? 'bg-[#1C2128] border-[#2E3642]' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <FSOSWaferMark className="w-9 h-9" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            FSOS
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Field Service Operations System
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Precision Field Engineering Platform
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Engineer Account Selector */}
          {users.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label 
                htmlFor="account-select" 
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Field Engineer Account
              </label>
              <select
                id="account-select"
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
                className={`w-full text-xs font-medium rounded-lg px-3 py-2 border transition-colors focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-[#1B1F26] border-[#282E37] text-slate-100 focus:ring-slate-400 focus:border-slate-400'
                    : 'bg-white border-slate-200 text-slate-900 focus:ring-slate-500 focus:border-slate-500'
                }`}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} — {u.role} ({u.company || 'EO Technics'})
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          {/* Email / Engineer ID */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label 
              htmlFor="email-input" 
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Email / Engineer ID
            </label>
            <div className="relative">
              <User className={`w-4 h-4 absolute left-3 top-2.5 pointer-events-none ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                id="email-input"
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="engineer@eotechnics.com"
                className={`w-full text-xs rounded-lg pl-9 pr-3 py-2 border font-mono transition-colors focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-[#1B1F26] border-[#282E37] text-slate-100 placeholder-slate-600 focus:ring-slate-400 focus:border-slate-400'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-slate-500 focus:border-slate-500'
                }`}
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label 
              htmlFor="password-input" 
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3 top-2.5 pointer-events-none ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                id="password-input"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full text-xs rounded-lg pl-9 pr-3 py-2 border font-mono transition-colors focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-[#1B1F26] border-[#282E37] text-slate-100 placeholder-slate-600 focus:ring-slate-400 focus:border-slate-400'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-slate-500 focus:border-slate-500'
                }`}
              />
            </div>
          </motion.div>

          {/* Workspace Mode Selection */}
          <motion.div variants={itemVariants} className="space-y-1.5 pt-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Target Workspace Mode
            </label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Target Workspace Mode">
              <button
                type="button"
                role="radio"
                aria-checked={preferredMode === 'MHC_MODE'}
                onClick={() => setPreferredMode('MHC_MODE')}
                className={`p-2.5 rounded-lg border text-left transition-all flex flex-col gap-0.5 focus:outline-none focus:ring-1 ${
                  preferredMode === 'MHC_MODE'
                    ? isDark
                      ? 'bg-[#222831] border-slate-400 text-slate-100 font-semibold shadow-sm focus:ring-slate-400'
                      : 'bg-slate-50 border-slate-900 text-slate-900 font-semibold shadow-sm focus:ring-slate-900'
                    : isDark
                      ? 'bg-[#1B1F26] border-[#282E37] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>MHC Mode</span>
                  {preferredMode === 'MHC_MODE' && (
                    <Check className={`w-3.5 h-3.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`} />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                  Focused Health Check
                </span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={preferredMode === 'FOUNDER_MODE'}
                onClick={() => setPreferredMode('FOUNDER_MODE')}
                className={`p-2.5 rounded-lg border text-left transition-all flex flex-col gap-0.5 focus:outline-none focus:ring-1 ${
                  preferredMode === 'FOUNDER_MODE'
                    ? isDark
                      ? 'bg-[#222831] border-slate-400 text-slate-100 font-semibold shadow-sm focus:ring-slate-400'
                      : 'bg-slate-50 border-slate-900 text-slate-900 font-semibold shadow-sm focus:ring-slate-900'
                    : isDark
                      ? 'bg-[#1B1F26] border-[#282E37] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span>Founder Mode</span>
                  {preferredMode === 'FOUNDER_MODE' && (
                    <Check className={`w-3.5 h-3.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`} />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                  Complete Platform
                </span>
              </button>
            </div>
          </motion.div>

          {/* Remember Session */}
          <motion.div variants={itemVariants} className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-slate-400"
              />
              <span className="text-slate-600 dark:text-slate-300 text-xs">
                Remember session
              </span>
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Local Session
            </span>
          </motion.div>

          {/* Primary Action Button */}
          <motion.div variants={itemVariants} className="pt-2">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.008 }}
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.992 }}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                isDark
                  ? 'bg-slate-100 hover:bg-white text-slate-900 focus:ring-slate-400 focus:ring-offset-[#16191E]'
                  : 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-900 focus:ring-offset-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </motion.button>
          </motion.div>
        </form>

        {/* Footer / Environment Info */}
        <motion.div 
          variants={itemVariants}
          className={`mt-6 pt-4 border-t flex items-center justify-between text-[11px] ${
            isDark ? 'border-[#272E38] text-slate-500' : 'border-slate-100 text-slate-400'
          }`}
        >
          <span>EO Technics Engineering</span>
          <span>Local Authentication</span>
        </motion.div>
      </motion.div>
    </div>
  );
};
