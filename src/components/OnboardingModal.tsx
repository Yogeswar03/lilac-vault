import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock, Key, Users, ArrowRight, PlayCircle, LogIn, CheckCircle, Cloud, Share2, Clipboard, Link as LinkIcon, Check } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { isSupabaseConfigured } from '../services/supabase';
import { LavenderLogo } from './LavenderLogo';
import { extractCodeFromUrlOrInput, shareInviteLink, copyInviteLink } from '../services/shareInvite';
import { getActiveUserId } from '../services/storage';

const AVATAR_OPTIONS = ['🪻', '☕', '🌿', '✨', '📸', '🌙', '🎨', '🧁', '🌊', '🍓', '🧸', '🌸'];

export const OnboardingModal: React.FC<{
  onOpenHowItWorks: () => void;
  onOpenCloudSettings: () => void;
}> = ({ onOpenHowItWorks, onOpenCloudSettings }) => {
  const { vault, createVault, joinVault, startDemoMode, loginUser, loginWithCode, verifyVaultPasscode } = useVault();

  // Tab state: 'profiles' | 'create' | 'join' | 'demo'
  const [tab, setTab] = useState<'profiles' | 'create' | 'join' | 'demo'>(() => {
    return vault ? 'profiles' : 'demo';
  });

  // Keep tab updated if vault is detected
  useEffect(() => {
    if (vault && tab !== 'create' && tab !== 'join' && tab !== 'demo') {
      setTab('profiles');
    }
  }, [vault]);

  // Form states
  const [vaultName, setVaultName] = useState('Our Lavender Capsule ✨');
  const [hostName, setHostName] = useState('');
  const [hostAvatar, setHostAvatar] = useState('🪻');
  const [customPasscodeInput, setCustomPasscodeInput] = useState('');

  const [accessCodeInput, setAccessCodeInput] = useState(vault?.accessCode || '');
  const [partnerName, setPartnerName] = useState('');
  const [partnerAvatar, setPartnerAvatar] = useState('☕');

  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Security & Locked Capsule states
  const [isLockedCapsuleShield, setIsLockedCapsuleShield] = useState(false);
  const [lockedCapsuleUsers, setLockedCapsuleUsers] = useState<Array<{ id: string; name: string; avatar: string; role: string }> | null>(null);
  const [codeMatchedUsers, setCodeMatchedUsers] = useState<Array<{ id: string; name: string; avatar: string; role: string }> | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);

  // Check URL search parameters for ?join=CODE or ?code=CODE on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const rawCode = params.get('join') || params.get('code');
    if (rawCode) {
      const clean = extractCodeFromUrlOrInput(rawCode);
      if (clean) {
        setTab('join');
        setAccessCodeInput(clean);
        handleAutoVerifyInvite(clean);
      }
    }
  }, []);

  const handleAutoVerifyInvite = async (code: string) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setPinError('');
    setIsPinVerified(false);
    try {
      const codeResult = await loginWithCode(code);
      if (codeResult.success && codeResult.users) {
        if (codeResult.users.length >= 2) {
          // Strictly locked (2/2) -> Display locked capsule shield!
          setIsLockedCapsuleShield(true);
          setLockedCapsuleUsers(codeResult.users);
          setCodeMatchedUsers(null);
        } else {
          setIsLockedCapsuleShield(false);
          setLockedCapsuleUsers(null);
          setCodeMatchedUsers(null);
          const host = codeResult.users[0]?.name || 'Partner';
          setSuccessNotice(`✨ Connected via invite to ${host}'s capsule! Enter your nickname below to pair:`);
        }
      } else {
        setErrorMessage(codeResult.error || `Invite code "${code}" not found. Verify code or connect Cloud Sync!`);
      }
    } catch {
      // quiet fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasteLinkOrCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        const clean = extractCodeFromUrlOrInput(text);
        if (clean) {
          setAccessCodeInput(clean);
          handleAutoVerifyInvite(clean);
        }
      }
    } catch {
      // clipboard permission fallback
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setErrorMessage('Please enter your nickname!');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await createVault(vaultName, hostName, hostAvatar, customPasscodeInput);
    } catch {
      setErrorMessage('Failed to create capsule. Please try again!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCodeOrJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = extractCodeFromUrlOrInput(accessCodeInput);
    if (!code) {
      setErrorMessage('Please enter the access code or invite link (e.g. LILAC-777)!');
      return;
    }

    setErrorMessage('');
    setPinError('');
    setIsSubmitting(true);

    try {
      // Step 1: Check code against server
      const codeResult = await loginWithCode(code);
      if (!codeResult.success || !codeResult.users) {
        setErrorMessage(codeResult.error || 'Access code not found. Please verify the code.');
        setIsSubmitting(false);
        return;
      }

      // If capsule already has 2 members, display the Locked Capsule Shield
      if (codeResult.users.length >= 2) {
        setIsLockedCapsuleShield(true);
        setLockedCapsuleUsers(codeResult.users);
        setCodeMatchedUsers(null);
        setIsSubmitting(false);
        return;
      }

      // If capsule has 1 member (Host), and user provided partnerName -> proceed to join
      if (partnerName.trim()) {
        const joinResult = await joinVault(code, partnerName.trim(), partnerAvatar);
        if (!joinResult.success) {
          setErrorMessage(joinResult.error || 'Could not join capsule.');
        } else {
          // Clean URL params after successful join
          if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } else {
        // Prompt them to enter their nickname to finish pairing
        setSuccessNotice(`Capsule verified! Enter your nickname below to join with ${codeResult.users[0]?.name}.`);
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPinForRestore = () => {
    handleUnlockAndEnter();
  };

  const handleUnlockAndEnter = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('Please enter your 4-digit PIN!');
      return;
    }
    const isValid = verifyVaultPasscode(pinInput);
    if (!isValid) {
      setPinError('Incorrect 4-digit security PIN! Access denied.');
      return;
    }

    setPinError('');
    setIsSubmitting(true);

    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lilac_session_unlocked', 'true');
      }

      // Check which user to log into
      const savedUserId = getActiveUserId();
      const targetUser =
        vault?.users.find((u) => u.id === savedUserId) ||
        (vault?.users.length === 1 ? vault.users[0] : null);

      if (targetUser) {
        // Direct entry into capsule!
        const res = await loginUser(targetUser.id, pinInput);
        if (res.success) {
          setIsPinVerified(true);
          if (typeof window !== 'undefined' && window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          return;
        }
      }

      // If multiple users and none saved on this device yet, unlock so user can pick their profile
      setIsPinVerified(true);
      if (lockedCapsuleUsers) {
        setCodeMatchedUsers(lockedCapsuleUsers);
      } else if (vault?.users) {
        setCodeMatchedUsers(vault.users);
      }
    } catch {
      setPinError('Failed to enter capsule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginWithPin = async (userId: string) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await loginUser(userId, pinInput);
      if (res && !res.success) {
        setErrorMessage(res.error || 'Could not log in.');
      } else {
        if (typeof window !== 'undefined' && window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch {
      setErrorMessage('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-lavender-950/65 backdrop-blur-md overflow-y-auto min-h-[100dvh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-3xl p-5 sm:p-7 shadow-2xl relative border border-lavender-200/90 my-auto max-h-[92dvh] overflow-y-auto"
      >
        {/* Soft corner glow lights */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-300/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-300/30 rounded-full blur-2xl pointer-events-none" />

        {/* Minimalist Lavender Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center mb-2">
            <LavenderLogo size={48} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-cute text-purple-950 tracking-tight flex items-center justify-center gap-1.5">
            <span>LilacVault</span>
            <span className="text-lg">✨</span>
          </h2>
          <p className="text-xs text-purple-800/80 mt-1 max-w-xs mx-auto">
            A private memory capsule strictly reserved for <strong className="text-purple-900 font-bold">two people</strong>.
          </p>

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-lavender-100 text-purple-800 border border-lavender-200">
              <Lock className="w-3 h-3 text-purple-600" />
              Strict 2-User Lock 🔒
            </span>

            <button
              type="button"
              onClick={onOpenCloudSettings}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
                isSupabaseConfigured()
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-lavender-100 hover:bg-lavender-200 text-purple-800 border-lavender-300'
              }`}
              title="Configure Cloud Sync across 2 phones"
            >
              <Cloud className="w-3 h-3 text-purple-600" />
              <span>{isSupabaseConfigured() ? 'Cloud Active 🟢' : 'Connect Cloud ☁️'}</span>
            </button>

            <button
              onClick={onOpenHowItWorks}
              className="text-[11px] text-purple-700 font-semibold underline hover:text-purple-950 ml-0.5"
            >
              How it works
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-lavender-100/90 rounded-2xl mb-4 border border-lavender-200 text-xs font-bold">
          {vault && (
            <button
              onClick={() => { setTab('profiles'); setErrorMessage(''); setSuccessNotice(''); }}
              className={`flex-1 py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
                tab === 'profiles'
                  ? 'bg-white text-purple-950 shadow-xs'
                  : 'text-purple-700 hover:text-purple-950'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-purple-600" />
              <span>Login</span>
            </button>
          )}

          <button
            onClick={() => { setTab('demo'); setErrorMessage(''); setSuccessNotice(''); }}
            className={`flex-1 py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
              tab === 'demo'
                ? 'bg-white text-purple-950 shadow-xs'
                : 'text-purple-700 hover:text-purple-950'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Showcase</span>
          </button>

          <button
            onClick={() => { setTab('create'); setErrorMessage(''); setSuccessNotice(''); }}
            className={`flex-1 py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
              tab === 'create'
                ? 'bg-white text-purple-950 shadow-xs'
                : 'text-purple-700 hover:text-purple-950'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-purple-600" />
            <span>Create</span>
          </button>

          <button
            onClick={() => { setTab('join'); setErrorMessage(''); setSuccessNotice(''); }}
            className={`flex-1 py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
              tab === 'join'
                ? 'bg-white text-purple-950 shadow-xs'
                : 'text-purple-700 hover:text-purple-950'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Join Code</span>
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div className="mb-3.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span className="leading-snug">{errorMessage}</span>
            </div>
            {!isSupabaseConfigured() && (
              <button
                type="button"
                onClick={onOpenCloudSettings}
                className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors self-start shadow-xs"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Configure Free Cloud Sync (2 Phones)</span>
              </button>
            )}
          </div>
        )}

        {successNotice && (
          <div className="mb-3.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Tab 0: Active Capsule / Profiles Login */}
        {tab === 'profiles' && vault && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3.5"
          >
            <div className="p-3.5 rounded-2xl bg-lavender-50/90 border border-lavender-200 text-purple-950 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-purple-950 text-sm truncate">{vault.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold flex-shrink-0">
                  {vault.isLocked ? 'Strictly 2 Paired' : '1/2 Waiting'}
                </span>
              </div>
              <p className="text-purple-700">
                Access Code: <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded text-purple-900 border border-lavender-200">{vault.accessCode}</code>
              </p>
            </div>

            {!isPinVerified ? (
              <div className="space-y-3.5 p-4 rounded-2xl bg-purple-50/90 border border-purple-200 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 flex items-center justify-center text-2xl border border-purple-200 shadow-xs">
                  🔒
                </div>
                <div>
                  <h4 className="font-bold text-sm text-purple-950 font-cute">This Vault is Locked 🔒</h4>
                  <p className="text-xs text-purple-800/80 mt-1 max-w-xs mx-auto">
                    Enter your 4-digit security PIN to enter your capsule:
                  </p>
                </div>

                <form onSubmit={handleUnlockAndEnter} className="space-y-3 max-w-xs mx-auto">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      maxLength={8}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="4-digit PIN"
                      autoFocus
                      className="flex-1 px-3 py-2.5 rounded-xl border border-purple-300 text-purple-950 text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:brightness-105 text-white font-bold text-xs shadow-cute flex items-center gap-1 transition-all"
                    >
                      <span>{isSubmitting ? 'Entering...' : 'Enter 🔓'}</span>
                    </button>
                  </div>
                  {pinError && <p className="text-[11px] text-rose-600 font-medium">⚠️ {pinError}</p>}
                </form>

                <div className="pt-2 border-t border-purple-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setTab('create');
                      setErrorMessage('');
                      setSuccessNotice('');
                    }}
                    className="text-xs text-purple-700 hover:text-purple-950 underline font-semibold"
                  >
                    Not your capsule? Create your own private capsule ✨
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-bold text-purple-900 uppercase tracking-wider text-left pt-1">
                  Select Your Profile to Enter:
                </div>
                {vault.users.map((user) => (
                  <motion.button
                    key={user.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLoginWithPin(user.id)}
                    className="w-full p-3 rounded-2xl bg-white hover:bg-lavender-50 border border-lavender-200 hover:border-purple-500 shadow-xs flex items-center gap-3 transition-all text-left group"
                  >
                    <span className="text-2xl w-10 h-10 rounded-xl bg-lavender-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      {user.avatar}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-purple-950 truncate flex items-center gap-1.5">
                        <span>{user.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold capitalize">
                          {user.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-purple-600 font-medium">
                        Tap to enter memory capsule →
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {vault.users.length < 2 && (
              <div className="space-y-2 mt-2">
                <button
                  onClick={() => {
                    setTab('join');
                    setAccessCodeInput(vault.accessCode);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white font-bold text-xs shadow-cute hover:shadow-glow flex items-center justify-center gap-2 transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span>+ Join as Friend 2 (Partner)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await shareInviteLink({
                        code: vault.accessCode,
                        vaultName: vault.name,
                        hostName: vault.users[0]?.name,
                      });
                      if (res.status === 'copied' || res.status === 'shared') {
                        setSuccessNotice(res.message);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-lavender-100 hover:bg-lavender-200 text-purple-900 border border-purple-300 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5 text-purple-700" />
                    <span>Share Invite Link 📲</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyInviteLink(vault.accessCode);
                      if (ok) {
                        setCopiedLink(true);
                        setSuccessNotice('Invite link copied to clipboard! 📋 Send it to your friend.');
                        setTimeout(() => setCopiedLink(false), 3000);
                      }
                    }}
                    className="py-2.5 px-3 rounded-2xl bg-white hover:bg-lavender-50 text-purple-900 border border-lavender-300 font-bold text-xs shadow-2xs flex items-center justify-center gap-1 transition-all"
                    title="Copy direct invite link"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <LinkIcon className="w-4 h-4 text-purple-600" />}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 text-center">
              <span className="text-[11px] text-purple-600">
                Returning device? Your session auto-resumes next time you open the app!
              </span>
            </div>
          </motion.div>
        )}

        {/* Tab 1: Instant Showcase Demo Mode */}
        {tab === 'demo' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-2xl bg-lavender-50/80 border border-lavender-200 text-purple-950 text-sm">
              <div className="flex items-center gap-2 font-bold text-purple-950 mb-1">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Instant Showcase & Portfolio Tour</span>
              </div>
              <p className="text-xs text-purple-800/90 leading-relaxed">
                Explore the live demo between <strong>Elena 🪻</strong> and <strong>Liam ☕</strong> with cafe matchas, sunset hikes, capsule chat, and the AI video reel maker!
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startDemoMode}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white font-bold shadow-cute-lg hover:shadow-glow flex items-center justify-center gap-2 text-base transition-all"
            >
              <PlayCircle className="w-5 h-5" />
              <span>Launch 1-Click Interactive Demo</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* Tab 2: Create Vault (Host) */}
        {tab === 'create' && (
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreate}
            className="space-y-3.5 text-left"
          >
            <div>
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                Capsule Name
              </label>
              <input
                type="text"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                placeholder="e.g. Our Lavender Capsule ✨"
                className="w-full px-3.5 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                Your Nickname
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. Elena 🪻"
                className="w-full px-3.5 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 text-base"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                4-Digit Security PIN (Optional)
              </label>
              <input
                type="password"
                maxLength={8}
                value={customPasscodeInput}
                onChange={(e) => setCustomPasscodeInput(e.target.value)}
                placeholder="e.g. 1234 (Auto-generated if left blank)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 font-mono tracking-widest text-center text-base"
              />
              <span className="text-[11px] text-purple-600 mt-1 block">
                🔒 Protects your capsule from third parties if you share the app link.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                Choose Your Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setHostAvatar(emoji)}
                    className={`h-9 rounded-xl flex items-center justify-center text-lg transition-transform ${
                      hostAvatar === emoji
                        ? 'bg-purple-700 text-white scale-105 shadow-cute'
                        : 'bg-white/80 hover:bg-lavender-100 text-purple-900 border border-lavender-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-lavender-50 rounded-xl border border-lavender-200 text-xs text-purple-800">
              💡 <strong>How it works:</strong> Creating this capsule generates an access key (e.g. <code className="bg-purple-100 px-1 py-0.5 rounded font-mono text-purple-900">LILAC-777</code>) to send to your friend.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white font-bold shadow-cute hover:shadow-glow flex items-center justify-center gap-2 text-sm transition-all"
            >
              {isSubmitting ? 'Creating Capsule...' : 'Create Capsule & Get Key ✨'}
            </button>
          </motion.form>
        )}

        {/* Tab 3: Join Friend / Code Login */}
        {tab === 'join' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3.5 text-left"
          >
            {/* Case 1: Capsule is strictly locked (2/2 Paired) and PIN not verified */}
            {isLockedCapsuleShield && !isPinVerified ? (
              <div className="text-center py-3 px-1 space-y-3.5">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-100 flex items-center justify-center text-3xl shadow-cute border border-purple-200">
                  🔒
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-950 font-cute">
                    This Vault is Locked 🔒
                  </h3>
                  <p className="text-xs text-purple-800/80 leading-relaxed max-w-sm mx-auto mt-1">
                    This vault is locked. LilacVault memory capsules are strictly private spaces reserved for 2 paired members only.
                  </p>
                </div>

                {/* Primary CTA for third-party friends: create their own capsule! */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLockedCapsuleShield(false);
                      setLockedCapsuleUsers(null);
                      setShowPinEntry(false);
                      setPinError('');
                      setTab('create');
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white font-bold text-sm shadow-cute hover:shadow-glow flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Create Your Own Private Capsule ✨</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Secondary CTA: Device restoration for the 2 owners */}
                <div className="pt-3 border-t border-lavender-200 text-center">
                  {!showPinEntry ? (
                    <button
                      type="button"
                      onClick={() => setShowPinEntry(true)}
                      className="text-[11px] text-purple-600 hover:text-purple-900 font-semibold underline inline-flex items-center gap-1"
                    >
                      <Key className="w-3 h-3" />
                      <span>Already a member restoring on a new phone? Enter PIN</span>
                    </button>
                  ) : (
                    <div className="space-y-2 mt-2 p-3 bg-purple-50/80 rounded-2xl border border-purple-200 text-left">
                      <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                        Enter 4-Digit Capsule PIN:
                      </label>
                      <form onSubmit={handleUnlockAndEnter} className="flex gap-2">
                        <input
                          type="password"
                          maxLength={8}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          placeholder="4-digit PIN"
                          className="flex-1 px-3 py-2 rounded-xl border border-purple-300 text-purple-950 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs"
                        >
                          {isSubmitting ? 'Verifying...' : 'Verify PIN'}
                        </button>
                      </form>
                      {pinError && <p className="text-[11px] text-rose-600 font-medium">⚠️ {pinError}</p>}
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLockedCapsuleShield(false);
                      setLockedCapsuleUsers(null);
                      setShowPinEntry(false);
                      setPinError('');
                    }}
                    className="text-xs text-purple-600 underline"
                  >
                    Enter a different access code
                  </button>
                </div>
              </div>
            ) : isPinVerified && codeMatchedUsers && codeMatchedUsers.length > 0 ? (
              /* Case 2: PIN successfully verified by owner on new device */
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>PIN Verified! Tap your profile to log in on this device:</span>
                </div>
                <div className="space-y-2">
                  {codeMatchedUsers.map((user) => (
                    <motion.button
                      key={user.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLoginWithPin(user.id)}
                      className="w-full p-3 rounded-2xl bg-white hover:bg-lavender-50 border border-lavender-200 hover:border-purple-500 shadow-xs flex items-center gap-3 transition-all text-left"
                    >
                      <span className="text-2xl w-10 h-10 rounded-xl bg-lavender-100 flex items-center justify-center flex-shrink-0">
                        {user.avatar}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-purple-950 truncate">
                          {user.name}
                        </div>
                        <div className="text-[11px] text-purple-600 font-medium">
                          Restore session as {user.name} →
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCodeMatchedUsers(null);
                    setIsPinVerified(false);
                    setIsLockedCapsuleShield(false);
                  }}
                  className="text-xs text-purple-700 underline text-center block w-full mt-2"
                >
                  Enter a different code
                </button>
              </div>
            ) : (
              /* Case 3: Standard Join / Verify Form */
              <form onSubmit={handleVerifyCodeOrJoin} className="space-y-3.5">
                {!isSupabaseConfigured() && (
                  <div className="p-3 bg-lavender-50 rounded-xl border border-lavender-200 text-xs text-purple-800 flex items-start gap-2">
                    <Cloud className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span>Joining from a separate phone? </span>
                      <button
                        type="button"
                        onClick={onOpenCloudSettings}
                        className="font-bold underline text-purple-900 hover:text-purple-950"
                      >
                        Connect Free Cloud Sync
                      </button>
                      <span> so phones can talk to each other!</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Friend's Access Code or Invite Link
                    </label>
                    <button
                      type="button"
                      onClick={handlePasteLinkOrCode}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-950 px-2 py-0.5 rounded-lg bg-lavender-100 hover:bg-lavender-200 border border-lavender-200 transition-colors"
                      title="Paste invite link or code from clipboard"
                    >
                      <Clipboard className="w-3 h-3 text-purple-600" />
                      <span>Paste Link/Code</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={accessCodeInput}
                    onChange={(e) => {
                      const extracted = extractCodeFromUrlOrInput(e.target.value);
                      setAccessCodeInput(extracted);
                      setErrorMessage('');
                    }}
                    placeholder="e.g. LILAC-777 or paste full invite link"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 font-mono tracking-widest text-center text-base"
                    required
                  />
                  <span className="text-[11px] text-purple-600 mt-1 block">
                    ✨ Opening your friend's link fills and pairs this code automatically!
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                    Your Nickname (if joining for first time)
                  </label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="e.g. Liam ☕"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                    Choose Your Avatar
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setPartnerAvatar(emoji)}
                        className={`h-9 rounded-xl flex items-center justify-center text-lg transition-transform ${
                          partnerAvatar === emoji
                            ? 'bg-purple-700 text-white scale-105 shadow-cute'
                            : 'bg-white/80 hover:bg-lavender-100 text-purple-900 border border-lavender-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white font-bold shadow-cute hover:shadow-glow flex items-center justify-center gap-2 text-sm transition-all"
                >
                  {isSubmitting ? 'Verifying Code...' : 'Connect to Capsule 🔒'}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
