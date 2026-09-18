import React, { useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { Lock, User, ArrowRight, Check, Loader2, CheckCircle2 } from 'lucide-react';
import { SystemUser, WorkspaceMode, UserSession } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { FSOSWaferMark } from '../common/FSOSWaferMark';
import { LoginBackground } from './LoginBackground';

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
  const [loginState, setLoginState] = useState<'idle' | 'authenticating' | 'success'>('idle');

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const u = users.find(usr => usr.id === userId);
    if (u) {
      setEmailInput(u.email);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginState !== 'idle') return;
    setLoginState('authenticating');

    const authDelay = prefersReducedMotion ? 120 : 380;
    const successDelay = prefersReducedMotion ? 80 : 260;

    setTimeout(() => {
      setLoginState('success');

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
      }, successDelay);
    }, authDelay);
  };

  const panelVariants = {
    hidden: { 
      opacity: 0, 
      y: prefersReducedMotion ? 0 : 16,
      scale: prefersReducedMotion ? 1 : 0.98
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.45,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: prefersReducedMotion ? 0 : 0.05,
        delayChildren: prefersReducedMotion ? 0 : 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.98,
      y: prefersReducedMotion ? 0 : -8,
      transition: { duration: 0.2, ease: 'easeIn' }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const waferRingVariants = {
    hidden: { opacity: 0, rotate: -30, scale: 0.85 },
    visible: {
      opacity: 1,
      rotate: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.65,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-200 select-none ${
      isDark ? 'bg-[#0E1013] text-[#F3F4F6]' : 'bg-[#F2F5F8] text-slate-900'
    }`}>
      {/* Animated Precision Environment Background */}
      <LoginBackground isDark={isDark} />

      {/* Main Login Composition Panel */}
      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate={loginState === 'success' ? 'exit' : 'visible'}
        className={`w-full max-w-md rounded-2xl border p-7 sm:p-8 relative z-10 transition-all ${
          isDark 
            ? 'bg-[#15181E]/95 border-[#272F3B] shadow-2xl shadow-black/60 backdrop-blur-sm' 
            : 'bg-white/95 border-slate-200/90 shadow-2xl shadow-slate-900/10 backdrop-blur-sm'
        }`}
      >
        {/* Deliberate FSOS Brand Mark Presentation */}
        <motion.div variants={itemVariants} className="text-center space-y-3 mb-6">
          <div className="flex justify-center items-center">
            <div className="relative flex items-center justify-center w-20 h-20">
              {/* Outer Mechanical Precision Alignment Ring */}
              <motion.svg
                variants={waferRingVariants}
                className="absolute inset-0 w-full h-full pointer-events-none opacity-60 dark:opacity-50"
                viewBox="0 0 80 80"
                fill="none"
              >
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke={isDark ? '#38BDF8' : '#0F172A'}
                  strokeWidth="0.8"
                  strokeDasharray="4 6"
                  strokeOpacity="0.4"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="38.5"
                  stroke={isDark ? '#64748B' : '#94A3B8'}
                  strokeWidth="0.5"
                  strokeOpacity="0.3"
                />
                {/* 4 Optical Crosshair Ticks */}
                <line x1="40" y1="1" x2="40" y2="5" stroke={isDark ? '#38BDF8' : '#0F172A'} strokeWidth="1" />
                <line x1="40" y1="75" x2="40" y2="79" stroke={isDark ? '#38BDF8' : '#0F172A'} strokeWidth="1" />
                <line x1="1" y1="40" x2="5" y2="40" stroke={isDark ? '#38BDF8' : '#0F172A'} strokeWidth="1" />
                <line x1="75" y1="40" x2="79" y2="40" stroke={isDark ? '#38BDF8' : '#0F172A'} strokeWidth="1" />
              </motion.svg>

              {/* Unconstrained, Crisp FSOS Wafer Mark */}
              <motion.div
                initial={{ scale: prefersReducedMotion ? 1 : 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex items-center justify-center"
              >
                <FSOSWaferMark className="w-14 h-14 sm:w-16 sm:h-16" />
              </motion.div>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
              FSOS
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold bg-slate-100 dark:bg-[#1E232B] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#2C3542]">
              Field Service Operations System
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              Precision Field Engineering Platform
            </p>
          </div>
        </motion.div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field Engineer Account Dropdown */}
          {users.length > 0 && (
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label 
                htmlFor="account-select" 
                className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300"
              >
                Field Engineer Account
              </label>
              <select
                id="account-select"
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
                className={`w-full text-xs font-medium rounded-lg px-3 py-2.5 border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  isDark
                    ? 'bg-[#1A1E25] border-[#29323F] text-slate-100 focus:ring-slate-400 focus:border-slate-400 focus:ring-offset-[#15181E]'
                    : 'bg-white border-slate-200 text-slate-900 focus:ring-slate-900 focus:border-slate-900 focus:ring-offset-white'
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
              className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300"
            >
              Email / Engineer ID
            </label>
            <div className="relative">
              <User className={`w-4 h-4 absolute left-3 top-3 pointer-events-none ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                id="email-input"
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="engineer@eotechnics.com"
                className={`w-full text-xs rounded-lg pl-9 pr-3 py-2.5 border font-mono transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  isDark
                    ? 'bg-[#1A1E25] border-[#29323F] text-slate-100 placeholder-slate-600 focus:ring-slate-400 focus:border-slate-400 focus:ring-offset-[#15181E]'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-slate-900 focus:border-slate-900 focus:ring-offset-white'
                }`}
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div variants={itemVariants} className="space-y-1.5">
            <label 
              htmlFor="password-input" 
              className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3 top-3 pointer-events-none ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                id="password-input"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full text-xs rounded-lg pl-9 pr-3 py-2.5 border font-mono transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  isDark
                    ? 'bg-[#1A1E25] border-[#29323F] text-slate-100 placeholder-slate-600 focus:ring-slate-400 focus:border-slate-400 focus:ring-offset-[#15181E]'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-slate-900 focus:border-slate-900 focus:ring-offset-white'
                }`}
              />
            </div>
          </motion.div>

          {/* Workspace Mode Selection with Animated Mechanical Indicator */}
          <motion.div variants={itemVariants} className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
              Target Workspace Mode
            </label>
            <div 
              className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl border relative ${
                isDark ? 'bg-[#14171D] border-[#272F3B]' : 'bg-slate-100/90 border-slate-200'
              }`}
              role="radiogroup" 
              aria-label="Target Workspace Mode"
            >
              {/* MHC Mode Option */}
              <button
                type="button"
                role="radio"
                aria-checked={preferredMode === 'MHC_MODE'}
                onClick={() => setPreferredMode('MHC_MODE')}
                className={`relative p-2.5 rounded-lg text-left transition-colors flex flex-col gap-0.5 focus:outline-none z-10 ${
                  preferredMode === 'MHC_MODE'
                    ? isDark ? 'text-slate-100' : 'text-slate-900'
                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {preferredMode === 'MHC_MODE' && (
                  <motion.div
                    layoutId="activeWorkspaceMode"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className={`absolute inset-0 rounded-lg border shadow-sm ${
                      isDark 
                        ? 'bg-[#222933] border-slate-400/80 shadow-black/40' 
                        : 'bg-white border-slate-900/80 shadow-slate-900/5'
                    }`}
                  />
                )}
                <div className="relative z-10 flex items-center justify-between text-xs font-semibold">
                  <span>MHC Mode</span>
                  {preferredMode === 'MHC_MODE' && (
                    <Check className={`w-3.5 h-3.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`} />
                  )}
                </div>
                <span className="relative z-10 text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                  Focused Health Check
                </span>
              </button>

              {/* Founder Mode Option */}
              <button
                type="button"
                role="radio"
                aria-checked={preferredMode === 'FOUNDER_MODE'}
                onClick={() => setPreferredMode('FOUNDER_MODE')}
                className={`relative p-2.5 rounded-lg text-left transition-colors flex flex-col gap-0.5 focus:outline-none z-10 ${
                  preferredMode === 'FOUNDER_MODE'
                    ? isDark ? 'text-slate-100' : 'text-slate-900'
                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {preferredMode === 'FOUNDER_MODE' && (
                  <motion.div
                    layoutId="activeWorkspaceMode"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className={`absolute inset-0 rounded-lg border shadow-sm ${
                      isDark 
                        ? 'bg-[#222933] border-slate-400/80 shadow-black/40' 
                        : 'bg-white border-slate-900/80 shadow-slate-900/5'
                    }`}
                  />
                )}
                <div className="relative z-10 flex items-center justify-between text-xs font-semibold">
                  <span>Founder Mode</span>
                  {preferredMode === 'FOUNDER_MODE' && (
                    <Check className={`w-3.5 h-3.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`} />
                  )}
                </div>
                <span className="relative z-10 text-[10px] text-slate-500 dark:text-slate-400 font-normal">
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
              <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">
                Remember session
              </span>
            </label>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              LOCAL-FIRST
            </span>
          </motion.div>

          {/* Primary Action Button */}
          <motion.div variants={itemVariants} className="pt-2">
            <motion.button
              type="submit"
              disabled={loginState !== 'idle'}
              whileHover={{ scale: prefersReducedMotion ? 1 : 1.008 }}
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.992 }}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-80 shadow-md ${
                loginState === 'success'
                  ? 'bg-emerald-600 text-white focus:ring-emerald-500'
                  : isDark
                    ? 'bg-slate-100 hover:bg-white text-slate-900 focus:ring-slate-400 focus:ring-offset-[#15181E]'
                    : 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-900 focus:ring-offset-white'
              }`}
            >
              <AnimatePresence mode="wait">
                {loginState === 'authenticating' && (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AUTHENTICATING SESSION...</span>
                  </motion.div>
                )}

                {loginState === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                    <span>AUTHENTICATION CONFIRMED</span>
                  </motion.div>
                )}

                {loginState === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <span>SIGN IN TO WORKSPACE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </form>

        {/* Footer Technical Metadata */}
        <motion.div 
          variants={itemVariants}
          className={`mt-6 pt-4 border-t flex items-center justify-between text-[11px] font-mono ${
            isDark ? 'border-[#242C37] text-slate-500' : 'border-slate-100 text-slate-400'
          }`}
        >
          <span>EO TECHNICS</span>
          <span>CERTIFIED OPERATING SYSTEM</span>
        </motion.div>
      </motion.div>
    </div>
  );
};
