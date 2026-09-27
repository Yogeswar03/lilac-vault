import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock, Copy, Check, Plus, Film, MessageCircle, Edit3, Camera, Share2, Link as LinkIcon } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { shareInviteLink, copyInviteLink } from '../services/shareInvite';

interface HeroBannerProps {
  onOpenUpload: () => void;
  onOpenReel: () => void;
  onOpenChat: () => void;
  onOpenProfile: () => void;
  onOpenCamera: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenUpload,
  onOpenReel,
  onOpenChat,
  onOpenProfile,
  onOpenCamera,
}) => {
  const { vault, currentUser, partnerUser, memories } = useVault();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

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

  const handleShareLink = async () => {
    if (!vault?.accessCode) return;
    const res = await shareInviteLink({
      code: vault.accessCode,
      vaultName: vault.name,
      hostName: currentUser?.name,
    });
    if (res.status === 'shared') {
      setShareToast('✨ Shared invite sheet opened!');
      setTimeout(() => setShareToast(null), 3500);
    } else if (res.status === 'copied') {
      setLinkCopied(true);
      setShareToast('📋 Invite link copied! Send it on WhatsApp/iMessage.');
      setTimeout(() => {
        setLinkCopied(false);
        setShareToast(null);
      }, 3500);
    }
  };

  const handleCopyDirectLink = async () => {
    if (!vault?.accessCode) return;
    const ok = await copyInviteLink(vault.accessCode);
    if (ok) {
      setLinkCopied(true);
      setShareToast('📋 Invite link copied to clipboard!');
      setTimeout(() => {
        setLinkCopied(false);
        setShareToast(null);
      }, 3000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-lavender-950 to-indigo-950 text-white p-4 sm:p-8 shadow-cute-lg border border-purple-400/25">
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
            {/* Access Code Box & Share Link */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-lavender-100 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-lavender-300">
                  Capsule Access Key
                </span>
                <span className="text-[10px] text-lavender-300 font-semibold">Strict 2-User Limit</span>
              </div>

              {/* Code display + copy code */}
              <div className="flex items-center gap-2">
                <code className="text-base sm:text-lg font-mono font-bold tracking-widest text-white bg-black/30 px-3 py-1 rounded-xl flex-1 text-center">
                  {vault?.accessCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors flex-shrink-0"
                  title="Copy raw access code"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Share Invite Link Buttons */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleShareLink}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-lavender-500 to-indigo-500 hover:brightness-110 text-white font-bold text-xs shadow-cute flex items-center justify-center gap-1.5 transition-all"
                  title="Share invite link via WhatsApp, iMessage, Instagram"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Link 📲</span>
                </motion.button>

                <button
                  type="button"
                  onClick={handleCopyDirectLink}
                  className="py-2 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-1 transition-all flex-shrink-0"
                  title="Copy direct invite link"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span className="text-emerald-200">Copied!</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5 text-lavender-200" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Toast feedback */}
              {shareToast && (
                <div className="p-2 rounded-xl bg-purple-900/90 border border-purple-400/40 text-[11px] text-lavender-100 font-medium text-center">
                  {shareToast}
                </div>
              )}

              {/* Waiting for partner notice */}
              {!vault?.isLocked && (
                <div className="pt-1.5 border-t border-white/10 text-[11px] text-amber-200 flex items-center gap-1.5">
                  <span className="animate-pulse">✨</span>
                  <span>Tap <strong>Share Link</strong> — your friend pairs in 1 tap without typing codes!</span>
                </div>
              )}
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
                onClick={onOpenCamera}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 flex items-center justify-center gap-1.5 transition-all"
                title="Cute Selfie Camera with Filters 📸"
              >
                <Camera className="w-4 h-4 text-yellow-300" />
                <span className="hidden sm:inline">Selfie</span>
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
