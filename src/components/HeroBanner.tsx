import React, { useState } from 'react';
import { Sparkles, Lock, Copy, Check, Plus, Film, MessageCircle, Edit3 } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface HeroBannerProps {
  onOpenUpload: () => void;
  onOpenReel: () => void;
  onOpenChat: () => void;
  onOpenProfile: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenUpload,
  onOpenReel,
  onOpenChat,
  onOpenProfile,
}) => {
  const { vault, currentUser, partnerUser, memories } = useVault();
  const [copied, setCopied] = useState(false);

  // Calculate days together
  const daysTogether = React.useMemo(() => {
    if (!vault?.createdAt) return 1;
    const start = new Date(vault.createdAt).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [vault?.createdAt]);

  const handleCopyCode = () => {
    if (vault?.accessCode) {
      navigator.clipboard.writeText(vault.accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-lavender-950 to-indigo-950 text-white p-6 sm:p-8 shadow-cute-lg border border-purple-400/25">
        {/* Soft lavender ambient glow circles */}
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-lavender-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-52 h-52 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left Column: Greeting & Days Counter */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-lavender-200 border border-white/10 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Private 2-User Memory Capsule</span>
              </span>

              {vault?.isLocked ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-lavender-200 border border-purple-400/30 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-lavender-300" />
                  <span>Strictly 2 Paired (Locked) 🔒</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                  <span>⏳ 1/2 Waiting for Partner</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold font-cute tracking-tight text-white flex items-center gap-2">
              <span>{vault?.name || 'Our Lavender Capsule'}</span>
              <span className="text-2xl">✨</span>
            </h2>

            <p className="text-xs sm:text-sm text-lavender-200/90 max-w-xl leading-relaxed">
              A private, distraction-free space for our favorite moments, travel photos, and shared memories.
            </p>

            {/* Connection badge (Click to edit nicknames) */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-3 pt-2 text-left group hover:opacity-90 transition-opacity"
              title="Click to edit nicknames & avatars"
            >
              <div className="flex items-center -space-x-2">
                <div className="w-10 h-10 rounded-full bg-white text-purple-950 border-2 border-lavender-400 flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform">
                  {currentUser?.avatar || '🪻'}
                </div>
                <div className="w-10 h-10 rounded-full bg-white text-purple-950 border-2 border-purple-400 flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform">
                  {partnerUser?.avatar || '☕'}
                </div>
              </div>
              <div className="text-xs font-semibold text-lavender-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold">{currentUser?.name}</span> &{' '}
                  <span className="text-white font-bold">{partnerUser ? partnerUser.name : 'Waiting for Friend...'}</span>
                  <Edit3 className="w-3 h-3 text-lavender-300 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="block text-[11px] text-lavender-300">
                  {daysTogether} days recorded • {memories.length} memories saved
                </span>
              </div>
            </button>
          </div>

          {/* Right Column: Code Card & Fast Actions */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-3">
            {/* Access Code Box */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-lavender-100">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-lavender-300">
                  Capsule Access Key
                </span>
                <span className="text-[10px] text-lavender-300 font-semibold">Strict 2-User Limit</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-base sm:text-lg font-mono font-bold tracking-widest text-white bg-black/30 px-3 py-1 rounded-xl">
                  {vault?.accessCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                  title="Copy Key"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenUpload}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-lavender-600 to-indigo-600 text-white font-bold text-xs shadow-cute hover:brightness-105 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Memory</span>
              </button>
              <button
                onClick={onOpenChat}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageCircle className="w-4 h-4 text-lavender-200" />
                <span>Chat</span>
              </button>
              <button
                onClick={onOpenReel}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-1.5 transition-all"
                title="Make Video Reel"
              >
                <Film className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
