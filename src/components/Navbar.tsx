import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Lock, LogOut, Cloud, Share2 } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { isSupabaseConfigured } from '../services/supabase';
import { LavenderLogo } from './LavenderLogo';
import { shareInviteLink } from '../services/shareInvite';

interface NavbarProps {
  activeView?: 'gallery' | 'chat';
  onChangeView?: (view: 'gallery' | 'chat') => void;
  onOpenUpload?: () => void;
  onOpenReel?: () => void;
  onOpenHowItWorks: () => void;
  onOpenProfile: () => void;
  onOpenCloudSettings: () => void;
  onOpenCamera?: () => void;
  onOpenBucketList?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHowItWorks,
  onOpenProfile,
  onOpenCloudSettings,
  onOpenBucketList,
}) => {
  const { vault, currentUser, partnerUser, logoutUser } = useVault();

  // Calculate days together
  const daysTogether = React.useMemo(() => {
    if (!vault?.createdAt) return 1;
    const start = new Date(vault.createdAt).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [vault?.createdAt]);

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-lavender-200/90 px-3.5 py-2.5 sm:px-6 sm:py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo + Day Counter */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <LavenderLogo size={36} className="sm:w-[42px] sm:h-[42px] flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-purple-950 via-lavender-700 to-indigo-800 bg-clip-text text-transparent font-cute truncate">
                {vault?.name || 'LilacVault'}
              </h1>

              {/* Status pill on tablet/desktop */}
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-lavender-100 text-purple-800 font-bold border border-lavender-200 flex-shrink-0">
                <Lock className="w-3 h-3 text-purple-600" />
                {vault?.isLocked ? 'Strictly 2 Paired' : '1/2 Waiting'}
              </span>

              {/* Quick Invite Partner button if waiting */}
              {!vault?.isLocked && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    if (vault?.accessCode) {
                      shareInviteLink({
                        code: vault.accessCode,
                        vaultName: vault.name,
                        hostName: currentUser?.name,
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs transition-colors flex-shrink-0"
                  title="Share invite link with partner"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Invite 📲</span>
                </motion.button>
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-purple-700/80 font-medium truncate">
              <span>Day {daysTogether}</span>
              <span className="mx-1">•</span>
              <span className="text-purple-900 font-semibold">{currentUser?.name?.split(' ')[0]}</span>
              <span className="mx-0.5">&</span>
              <span className="text-purple-900 font-semibold">{partnerUser ? partnerUser.name?.split(' ')[0] : 'Waiting...'}</span>
            </p>
          </div>
        </div>

        {/* Right Utilities (Bucket List + Cloud + Tour + Profile + Logout) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Places & Bucket List */}
          {onOpenBucketList && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenBucketList}
              className="p-2 rounded-xl text-purple-700 hover:text-purple-950 bg-lavender-50 hover:bg-lavender-100 border border-lavender-200 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Places We Want to Go & Bucket List 🗺️"
            >
              <span className="text-sm">🗺️</span>
              <span className="hidden md:inline text-[11px]">Bucket List</span>
            </motion.button>
          )}

          {/* Cloud Sync Status */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenCloudSettings}
            className={`p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold ${
              isSupabaseConfigured()
                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                : 'text-purple-700 hover:bg-lavender-100 bg-lavender-50 border border-lavender-200'
            }`}
            title={isSupabaseConfigured() ? 'Cloud Sync Active 🟢' : 'Connect Cloud Database ☁️'}
          >
            <Cloud className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline text-[11px]">
              {isSupabaseConfigured() ? 'Cloud 🟢' : 'Sync ☁️'}
            </span>
          </motion.button>

          {/* How It Works Tour */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenHowItWorks}
            className="p-2 text-purple-600 hover:text-purple-900 rounded-xl hover:bg-lavender-100 transition-colors"
            title="How this 2-user capsule works"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>

          {/* User Profile Avatar */}
          <div className="flex items-center pl-1 sm:pl-2 border-l border-lavender-200">
            <button
              onClick={onOpenProfile}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border-2 border-lavender-300 hover:border-purple-600 flex items-center justify-center text-base sm:text-lg shadow-sm transition-all hover:scale-105"
              title={`Logged in as ${currentUser?.name} • Tap to edit nickname`}
            >
              {currentUser?.avatar || '🪻'}
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Lock capsule & log out of ${currentUser?.name}? Your photos and chat will remain safely saved.`)) {
                  logoutUser();
                }
              }}
              title="Lock Capsule / Switch Profile"
              className="ml-1 p-1 text-purple-700 hover:text-purple-950 hover:bg-lavender-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
