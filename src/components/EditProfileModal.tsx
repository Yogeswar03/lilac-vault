import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, User, Sparkles, Edit3 } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = ['🪻', '☕', '🌿', '✨', '📸', '🌙', '🎨', '🧁', '🌊', '🍓', '🧸', '🌸', '🦊', '💫'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { vault, currentUser, partnerUser, updateUserProfile } = useVault();

  // Selected user to edit (defaults to currentUser)
  const [targetUserId, setTargetUserId] = useState<string>(currentUser?.id || '');
  const targetUser = vault?.users.find((u) => u.id === targetUserId) || currentUser;

  const [name, setName] = useState(targetUser?.name || '');
  const [avatar, setAvatar] = useState(targetUser?.avatar || '🪻');
  const [saved, setSaved] = useState(false);

  // Sync state if target changes
  const selectTarget = (uid: string) => {
    setTargetUserId(uid);
    const u = vault?.users.find((user) => user.id === uid);
    if (u) {
      setName(u.name);
      setAvatar(u.avatar);
      setSaved(false);
    }
  };

  if (!isOpen || !vault) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await updateUserProfile(targetUserId, name.trim(), avatar);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lavender-950/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-card rounded-3xl p-6 shadow-2xl relative border border-lavender-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-lavender-100 text-purple-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-lavender-100 text-purple-700 mx-auto flex items-center justify-center text-xl mb-2 shadow-xs">
            <Edit3 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold font-cute text-purple-950">
            Edit Nicknames & Avatars
          </h3>
          <p className="text-xs text-purple-700/80 mt-1">
            Personalize your nickname and your partner's nickname anytime!
          </p>
        </div>

        {/* Tab to select which user to edit */}
        <div className="flex gap-2 p-1 bg-lavender-100 rounded-2xl mb-5 border border-lavender-200">
          {vault.users.map((user) => {
            const isSelected = targetUserId === user.id;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => selectTarget(user.id)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-700 text-white shadow-cute'
                    : 'text-purple-700 hover:text-purple-950'
                }`}
              >
                <span>{user.avatar}</span>
                <span>{user.name}</span>
                {user.id === currentUser?.id ? ' (You)' : ''}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
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
            {saved ? (
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
    </div>
  );
};
