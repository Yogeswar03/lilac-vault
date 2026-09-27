import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Film, Plus, HelpCircle, Lock, MessageCircle, LogOut } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { LavenderLogo } from './LavenderLogo';

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenReel: () => void;
  onOpenHowItWorks: () => void;
  onOpenChat: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  onOpenReel,
  onOpenHowItWorks,
  onOpenChat,
  onOpenProfile,
}) => {
  const { vault, currentUser, partnerUser, chatMessages, resetAllData } = useVault();

  // Calculate days together
  const daysTogether = React.useMemo(() => {
    if (!vault?.createdAt) return 1;
    const start = new Date(vault.createdAt).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [vault?.createdAt]);

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-lavender-200/90 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Aesthetic Minimalist Brand / Logo */}
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
            <LavenderLogo size={42} />
          </motion.div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-950 via-lavender-700 to-indigo-800 bg-clip-text text-transparent font-cute">
                {vault?.name || 'LilacVault'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-lavender-100 text-purple-800 font-bold border border-lavender-200">
                <Lock className="w-3 h-3 text-purple-600" />
                {vault?.isLocked ? 'Strictly 2 Paired 🔒' : '1/2 Waiting'}
              </span>
            </div>
            <p className="text-xs text-purple-700/80 font-medium flex items-center gap-1">
              <span>Day {daysTogether} of our journey</span>
              <span>•</span>
              <span className="text-purple-900 font-semibold">{currentUser?.name}</span>
              <span>&</span>
              <span className="text-purple-900 font-semibold">{partnerUser ? partnerUser.name : 'Waiting...'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Chat Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenChat}
            className="relative flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl bg-white hover:bg-lavender-50 text-purple-900 border border-lavender-200 transition-colors shadow-xs"
            title="Open Chat"
          >
            <MessageCircle className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">Chat</span>
            {chatMessages.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {chatMessages.length}
              </span>
            )}
          </motion.button>

          {/* AI Video Reel Maker */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenReel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-cute hover:shadow-glow transition-all"
          >
            <Film className="w-4 h-4" />
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden md:inline">AI Video Reel</span>
          </motion.button>

          {/* Upload Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-600 text-white shadow-cute hover:brightness-105 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Upload</span>
          </motion.button>

          {/* How It Works Tour */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenHowItWorks}
            className="p-2 text-purple-600 hover:text-purple-900 rounded-xl hover:bg-lavender-100 transition-colors"
            title="How this 2-user capsule works"
          >
            <HelpCircle className="w-5 h-5" />
          </motion.button>

          {/* User profile / Logout */}
          <div className="flex items-center pl-1 sm:pl-2 border-l border-lavender-200">
            <button
              onClick={onOpenProfile}
              className="w-9 h-9 rounded-full bg-white border-2 border-lavender-300 hover:border-purple-600 flex items-center justify-center text-lg shadow-sm transition-all hover:scale-105"
              title={`Logged in as ${currentUser?.name} • Tap to edit nickname`}
            >
              {currentUser?.avatar || '🪻'}
            </button>
            <button
              onClick={() => {
                if (window.confirm('Reset capsule data or switch account?')) {
                  resetAllData();
                }
              }}
              title="Reset / Switch Account"
              className="ml-1 p-1 text-purple-400 hover:text-purple-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
