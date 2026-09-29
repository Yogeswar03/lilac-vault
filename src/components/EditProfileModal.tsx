import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Sparkles, Edit3, Trash2, Lock, Key, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profiles' | 'pin';
}

const AVATARS = ['🪻', '☕', '🌿', '✨', '📸', '🌙', '🎨', '🧁', '🌊', '🍓', '🧸', '🌸', '🦊', '💫'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profiles',
}) => {
  const { vault, currentUser, partnerUser, updateUserProfile, updateVaultPasscode, resetAllData } = useVault();

  const [activeTab, setActiveTab] = useState<'profiles' | 'pin'>(initialTab);

  // Profile Edit State
  const [targetUserId, setTargetUserId] = useState<string>(currentUser?.id || '');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🪻');
  const [profileSaved, setProfileSaved] = useState(false);

  // Security PIN State
  const [newPin, setNewPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [pinStatus, setPinStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  // Sync state whenever modal opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setPinStatus({ type: 'idle', message: '' });
      setNewPin('');
      setShowCurrentPin(false);
    }
  }, [isOpen, initialTab]);

  // Sync profile fields whenever targetUserId changes or vault.users updates
  useEffect(() => {
    if (isOpen && vault) {
      const activeId = targetUserId && vault.users.some((u) => u.id === targetUserId)
        ? targetUserId
        : (currentUser?.id || vault.users[0]?.id || '');

      setTargetUserId(activeId);
      const u = vault.users.find((user) => user.id === activeId);
      if (u) {
        setName(u.name);
        setAvatar(u.avatar);
      }
      setProfileSaved(false);
    }
  }, [isOpen, targetUserId, vault?.users, currentUser?.id]);

  if (!isOpen || !vault) return null;

  const currentPin = vault.passcode || vault.accessCode.replace(/\D/g, '').slice(-4).padStart(4, '0');

  const selectTarget = (uid: string) => {
    setTargetUserId(uid);
    const u = vault?.users.find((user) => user.id === uid);
    if (u) {
      setName(u.name);
      setAvatar(u.avatar);
      setProfileSaved(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetUserId) return;
    await updateUserProfile(targetUserId, name.trim(), avatar);
    setProfileSaved(true);
    setTimeout(() => {
      setProfileSaved(false);
      onClose();
    }, 600);
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = newPin.trim();
    if (cleanPin.length < 4) {
      setPinStatus({
        type: 'error',
        message: 'Security PIN must be at least 4 digits!',
      });
      return;
    }

    setIsUpdatingPin(true);
    setPinStatus({ type: 'idle', message: '' });

    try {
      const res = await updateVaultPasscode(cleanPin);
      if (res.success) {
        setPinStatus({
          type: 'success',
          message: '✨ Security PIN updated successfully! It is now active on all devices.',
        });
        setNewPin('');
      } else {
        setPinStatus({
          type: 'error',
          message: res.error || 'Failed to update PIN. Please try again.',
        });
      }
    } catch {
      setPinStatus({
        type: 'error',
        message: 'An unexpected error occurred while saving the PIN.',
      });
    } finally {
      setIsUpdatingPin(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-lavender-950/65 backdrop-blur-md overflow-y-auto min-h-[100dvh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-card rounded-3xl p-5 sm:p-7 shadow-2xl relative border border-lavender-200/90 my-auto max-h-[92dvh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-lavender-100 text-purple-700 transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Navigation Tabs (Nicknames vs Security PIN) */}
        <div className="flex p-1 bg-lavender-100/90 rounded-2xl mb-5 border border-lavender-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'profiles'
                ? 'bg-white text-purple-950 shadow-xs'
                : 'text-purple-700 hover:text-purple-950'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-purple-600" />
            <span>Nicknames & Avatars</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pin')}
            className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'pin'
                ? 'bg-white text-purple-950 shadow-xs'
                : 'text-purple-700 hover:text-purple-950'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>Security PIN 🔒</span>
          </button>
        </div>

        {/* TAB 1: Edit Nicknames & Avatars */}
        {activeTab === 'profiles' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold font-cute text-purple-950">
                Edit Nicknames & Avatars
              </h3>
              <p className="text-xs text-purple-700/80 mt-0.5">
                Personalize your nickname and your partner's avatar anytime!
              </p>
            </div>

            {/* User Selector Tab */}
            <div className="flex gap-2 p-1 bg-lavender-100/80 rounded-2xl mb-4 border border-lavender-200">
              {vault.users.map((user) => {
                const isSelected = targetUserId === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectTarget(user.id)}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-700 text-white shadow-cute'
                        : 'text-purple-700 hover:text-purple-950'
                    }`}
                  >
                    <span>{user.avatar}</span>
                    <span className="truncate">{user.name}</span>
                    {user.id === currentUser?.id ? ' (You)' : ''}
                  </button>
                );
              })}
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                  Nickname
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena 🪻"
                  className="w-full px-4 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-950 text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                  Choose Avatar Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform ${
                        avatar === emoji
                          ? 'bg-purple-700 text-white scale-110 shadow-cute'
                          : 'bg-white hover:bg-lavender-100 text-purple-900 border border-lavender-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white font-bold text-sm shadow-cute hover:brightness-105 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {profileSaved ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Updated! ✨</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Save Nickname 🪻</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* TAB 2: Vault Security PIN Settings */}
        {activeTab === 'pin' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="text-center mb-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center text-xl mb-2 shadow-xs border border-purple-200">
                <Lock className="w-6 h-6 text-purple-700" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-cute text-purple-950">
                Vault Security PIN
              </h3>
              <p className="text-xs text-purple-700/80 mt-1 max-w-xs mx-auto">
                Set or change your 4-digit PIN. This PIN protects your capsule and allows you to restore access on new phones.
              </p>
            </div>

            {/* Current PIN Card */}
            <div className="p-3.5 rounded-2xl bg-purple-50/90 border border-purple-200/90 flex items-center justify-between gap-3">
              <div>
                <span className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                  Current Active PIN
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-lg font-bold text-purple-950 tracking-widest bg-white px-2.5 py-0.5 rounded-lg border border-purple-200 shadow-2xs">
                    {showCurrentPin ? currentPin : '••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="p-1.5 rounded-lg text-purple-700 hover:text-purple-950 hover:bg-purple-100 transition-colors"
                    title={showCurrentPin ? 'Hide PIN' : 'Reveal PIN'}
                  >
                    {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900">
                  <ShieldCheck className="w-3 h-3 text-purple-700" />
                  {vault.passcode ? 'Custom PIN' : 'Default PIN'}
                </span>
                <span className="block text-[10px] text-purple-600 mt-1">
                  {vault.passcode ? 'Set by user' : 'From access key'}
                </span>
              </div>
            </div>

            {/* Set New PIN Form */}
            <form onSubmit={handleUpdatePin} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5">
                  Set New 4-Digit Security PIN
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="e.g. 1234"
                    className="w-full px-4 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-950 font-mono tracking-widest text-center text-base"
                    required
                  />
                  <Key className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <span className="block text-[11px] text-purple-600/80 mt-1">
                  Enter 4 to 8 numbers. Share this with your partner so you can both log in on any device.
                </span>
              </div>

              {/* Status Message */}
              {pinStatus.type === 'success' && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{pinStatus.message}</span>
                </div>
              )}

              {pinStatus.type === 'error' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{pinStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingPin || newPin.length < 4}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white font-bold text-sm shadow-cute hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>{isUpdatingPin ? 'Saving Security PIN...' : 'Save New Security PIN 🔒'}</span>
              </button>
            </form>
          </motion.div>
        )}

        {/* Reset Capsule Danger Option */}
        <div className="mt-5 pt-3.5 border-t border-lavender-200 text-center">
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to delete this capsule and clear all memories and chat? This cannot be undone.'
                )
              ) {
                resetAllData();
                onClose();
              }
            }}
            className="text-xs text-rose-500 hover:text-rose-700 font-semibold inline-flex items-center gap-1.5 transition-colors p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset & Delete Capsule</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
