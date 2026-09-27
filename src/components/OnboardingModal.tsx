import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock, Key, Users, ArrowRight, PlayCircle } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { LavenderLogo } from './LavenderLogo';

const AVATAR_OPTIONS = ['🪻', '☕', '🌿', '✨', '📸', '🌙', '🎨', '🧁', '🌊', '🍓', '🧸', '🌸'];

export const OnboardingModal: React.FC<{ onOpenHowItWorks: () => void }> = ({ onOpenHowItWorks }) => {
  const { createVault, joinVault, startDemoMode } = useVault();
  const [tab, setTab] = useState<'create' | 'join' | 'demo'>('demo');

  // Form states
  const [vaultName, setVaultName] = useState('Our Lavender Capsule ✨');
  const [hostName, setHostName] = useState('');
  const [hostAvatar, setHostAvatar] = useState('🪻');

  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerAvatar, setPartnerAvatar] = useState('☕');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setErrorMessage('Please enter your nickname!');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await createVault(vaultName, hostName, hostAvatar);
    } catch {
      setErrorMessage('Failed to create capsule. Please try again!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) {
      setErrorMessage('Please enter the 6-character access code!');
      return;
    }
    if (!partnerName.trim()) {
      setErrorMessage('Please enter your nickname!');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await joinVault(accessCodeInput.trim(), partnerName, partnerAvatar);
      if (!res.success) {
        setErrorMessage(res.error || 'Could not join capsule.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lavender-950/50 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-lavender-200"
      >
        {/* Soft corner glows */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-300/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-300/30 rounded-full blur-2xl pointer-events-none" />

        {/* Minimalist Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <LavenderLogo size={60} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-cute text-purple-950 tracking-tight flex items-center justify-center gap-1.5">
            <span>LilacVault</span>
            <span className="text-xl">✨</span>
          </h2>
          <p className="text-sm text-purple-800/80 mt-1 max-w-xs mx-auto">
            A private, aesthetic memory capsule strictly reserved for <strong className="text-purple-900">two people</strong>.
          </p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-lavender-100 text-purple-800 border border-lavender-200">
              <Lock className="w-3 h-3 text-purple-600" />
              Strict 2-User Lock 🔒
            </span>
            <button
              onClick={onOpenHowItWorks}
              className="text-xs text-purple-700 font-semibold underline hover:text-purple-950 ml-1"
            >
              See how it works
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-lavender-100/90 rounded-2xl mb-6 border border-lavender-200 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => { setTab('demo'); setErrorMessage(''); }}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'demo'
                ? 'bg-white text-purple-950 shadow-sm'
                : 'text-purple-700 hover:text-purple-950'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>⚡ Showcase Demo</span>
          </button>
          <button
            onClick={() => { setTab('create'); setErrorMessage(''); }}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'create'
                ? 'bg-white text-purple-950 shadow-sm'
                : 'text-purple-700 hover:text-purple-950'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-purple-600" />
            <span>Create Capsule</span>
          </button>
          <button
            onClick={() => { setTab('join'); setErrorMessage(''); }}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'join'
                ? 'bg-white text-purple-950 shadow-sm'
                : 'text-purple-700 hover:text-purple-950'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
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
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                Capsule Name
              </label>
              <input
                type="text"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                placeholder="e.g. Our Lavender Capsule ✨"
                className="w-full px-4 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                Your Nickname
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. Elena 🪻"
                className="w-full px-4 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                Choose Your Avatar
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setHostAvatar(emoji)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform ${
                      hostAvatar === emoji
                        ? 'bg-purple-700 text-white scale-110 shadow-cute'
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

        {/* Tab 3: Join Friend */}
        {tab === 'join' && (
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleJoin}
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                Friend's Access Code
              </label>
              <input
                type="text"
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. LILAC-777"
                className="w-full px-4 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 font-mono tracking-widest text-center text-base"
                required
              />
              <span className="text-[11px] text-purple-600 mt-1 block">
                Enter the 6-character code provided by your friend.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                Your Nickname
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g. Liam ☕"
                className="w-full px-4 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                Choose Your Avatar
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setPartnerAvatar(emoji)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform ${
                      partnerAvatar === emoji
                        ? 'bg-purple-700 text-white scale-110 shadow-cute'
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
              {isSubmitting ? 'Verifying Code...' : 'Join Capsule & Lock In 🔒'}
            </button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
};
