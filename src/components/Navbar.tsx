import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Film, Plus, HelpCircle, Lock, MessageCircle, LogOut, Camera } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { LavenderLogo } from './LavenderLogo';

interface NavbarProps {
  activeView: 'gallery' | 'chat';
  onChangeView: (view: 'gallery' | 'chat') => void;
  onOpenUpload: () => void;
  onOpenReel: () => void;
  onOpenHowItWorks: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onChangeView,
  onOpenUpload,
  onOpenReel,
  onOpenHowItWorks,
  onOpenProfile,
}) => {
  const { vault, currentUser, partnerUser, chatMessages, logoutUser } = useVault();

  // Calculate days together
  const daysTogether = React.useMemo(() => {
    if (!vault?.createdAt) return 1;
    const start = new Date(vault.createdAt).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [vault?.createdAt]);

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-lavender-200/90 px-3 py-2.5 sm:px-6 sm:py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Aesthetic Minimalist Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChangeView('gallery')}
            className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none flex-shrink-0"
            title="Go to Memories Gallery"
          >
            <LavenderLogo size={36} className="sm:w-[42px] sm:h-[42px]" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-purple-950 via-lavender-700 to-indigo-800 bg-clip-text text-transparent font-cute truncate max-w-[130px] sm:max-w-none">
                  {vault?.name || 'LilacVault'}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-lavender-100 text-purple-800 font-bold border border-lavender-200 flex-shrink-0">
                  <Lock className="w-3 h-3 text-purple-600" />
                  {vault?.isLocked ? 'Strictly 2 Paired' : '1/2 Waiting'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-purple-700/80 font-medium truncate">
                <span>Day {daysTogether}</span>
                <span className="mx-1">•</span>
                <span className="text-purple-900 font-semibold">{currentUser?.name?.split(' ')[0]}</span>
                <span className="mx-0.5">&</span>
                <span className="text-purple-900 font-semibold">{partnerUser ? partnerUser.name?.split(' ')[0] : 'Waiting...'}</span>
              </p>
            </div>
          </motion.button>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center p-1 bg-lavender-100/90 rounded-2xl border border-lavender-200 text-xs font-bold shadow-2xs">
          <button
            onClick={() => onChangeView('gallery')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeView === 'gallery'
                ? 'bg-white text-purple-950 shadow-xs'
                : 'text-purple-700 hover:text-purple-950'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Memories</span>
          </button>

          <button
            onClick={() => onChangeView('chat')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 relative ${
              activeView === 'chat'
                ? 'bg-white text-purple-950 shadow-xs'
                : 'text-purple-700 hover:text-purple-950'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>Chat</span>
            {chatMessages.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* AI Video Reel Maker */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenReel}
            className="flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-cute hover:shadow-glow transition-all"
            title="AI Video Reel"
          >
            <Film className="w-4 h-4" />
            <Sparkles className="hidden sm:inline w-3.5 h-3.5 text-yellow-300 ml-1 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden md:inline ml-1">Reel</span>
          </motion.button>

          {/* Upload Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenUpload}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-600 text-white shadow-cute hover:brightness-105 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Upload</span>
          </motion.button>

          {/* How It Works Tour */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenHowItWorks}
            className="hidden sm:flex p-2 text-purple-600 hover:text-purple-900 rounded-xl hover:bg-lavender-100 transition-colors"
            title="How this 2-user capsule works"
          >
            <HelpCircle className="w-5 h-5" />
          </motion.button>

          {/* User profile / Logout */}
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
              className="ml-1 p-1 text-purple-400 hover:text-purple-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
