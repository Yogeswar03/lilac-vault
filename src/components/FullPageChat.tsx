import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, Plus, Film, MessageCircle, Heart, Lock, Trash2, Camera } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { LavenderLogo } from './LavenderLogo';

interface FullPageChatProps {
  onBack: () => void;
  onOpenUpload: () => void;
  onOpenReel: () => void;
  onOpenProfile: () => void;
  onOpenCamera: () => void;
}

const QUICK_PROMPTS = [
  'Remember this day? 🪻',
  'Check out the latest photo! ✨',
  'Hope you have an awesome day! ☀️',
  'We need to do this again soon! ☕',
  'Added this to our highlight reel 📸',
  'Love this memory 🌸',
];

export const FullPageChat: React.FC<FullPageChatProps> = ({
  onBack,
  onOpenUpload,
  onOpenReel,
  onOpenProfile,
  onOpenCamera,
}) => {
  const { vault, chatMessages, currentUser, partnerUser, sendChatMessage, deleteChatMessage, triggerSparkleExplosion, markChatAsRead } = useVault();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll and mark as read on mount and when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    markChatAsRead();
  }, [chatMessages.length, markChatAsRead]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText, 'text');
    setInputText('');
    inputRef.current?.focus();
  };

  const handleQuickPrompt = (prompt: string) => {
    sendChatMessage(prompt, 'text');
  };

  const handleSendSparkles = () => {
    sendChatMessage('✨ Sent you a wave of sparkles! 🪻', 'sparkle_burst');
    triggerSparkleExplosion();
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-b from-lavender-50 via-lavender-100/40 to-lavender-100/60 overflow-hidden">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 glass-panel border-b border-lavender-200/90 px-3 py-2.5 sm:px-6 sm:py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Back button + Partner Details */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white hover:bg-lavender-100 text-purple-900 border border-lavender-200 shadow-xs flex items-center gap-1.5 transition-all text-xs sm:text-sm font-bold flex-shrink-0"
              title="Return to Gallery"
            >
              <ArrowLeft className="w-4 h-4 text-purple-700" />
              <span className="hidden sm:inline">Memories</span>
            </motion.button>

            {/* Partner Avatar & Status */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <button
                  onClick={onOpenProfile}
                  className="w-10 h-10 rounded-full bg-white border-2 border-lavender-300 hover:border-purple-600 flex items-center justify-center text-xl shadow-xs transition-transform hover:scale-105"
                  title="Click to edit profile & nicknames"
                >
                  {partnerUser?.avatar || '☕'}
                </button>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-xs" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-purple-950 font-cute truncate">
                    {partnerUser ? partnerUser.name : 'Waiting for Partner...'}
                  </h2>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] px-2 py-0.2 rounded-full bg-lavender-200/70 text-purple-800 font-semibold">
                    <Lock className="w-2.5 h-2.5" />
                    Strictly 2 Members
                  </span>
                </div>
                <p className="text-[11px] text-purple-700/80 font-medium truncate flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Private Capsule Chat</span>
                  <span className="hidden sm:inline">• {vault?.name}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions on the Right */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Sparkle Wave Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendSparkles}
              className="p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold rounded-xl bg-white hover:bg-yellow-50 text-amber-600 border border-yellow-200 shadow-xs flex items-center gap-1.5 transition-all"
              title="Send a wave of sparkles"
            >
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="hidden md:inline">Sparkles</span>
            </motion.button>

            {/* Quick Upload shortcut */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenUpload}
              className="p-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-cute hover:brightness-105 flex items-center gap-1.5 transition-all"
              title="Add photo to capsule"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Add Photo</span>
            </motion.button>

            {/* AI Reel Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenReel}
              className="hidden lg:flex p-2 rounded-xl text-purple-700 hover:bg-lavender-100 transition-colors"
              title="Open AI Reel Maker"
            >
              <Film className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Messages Scrollable Area */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 max-w-4xl mx-auto w-full space-y-3">
        {chatMessages.length === 0 ? (
          <div className="min-h-[55vh] flex flex-col items-center justify-center text-center p-6 text-purple-500">
            <div className="w-16 h-16 rounded-3xl bg-lavender-100 text-purple-700 flex items-center justify-center text-3xl mb-3 shadow-cute">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-purple-950 font-cute">
              Your Private 2-Person Chat ✨
            </h3>
            <p className="text-xs sm:text-sm text-purple-700/80 mt-1 max-w-md leading-relaxed">
              No one else has access to this space. Share daily updates, sweet notes, or tap any prompt below to get started!
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
              {QUICK_PROMPTS.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-lavender-50 text-purple-900 border border-lavender-200 shadow-xs transition-all active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {/* Soft Date Divider */}
            <div className="flex items-center justify-center my-3">
              <span className="px-3 py-0.5 rounded-full bg-lavender-200/60 text-purple-800 text-[10px] font-bold tracking-wider uppercase border border-lavender-200">
                Shared Memories Capsule
              </span>
            </div>

            {chatMessages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const isSpecial = msg.type === 'sparkle_burst';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-1.5 max-w-[85%] sm:max-w-[70%]">
                    {!isMe && (
                      <span className="text-lg mb-1 flex-shrink-0" title={msg.senderName}>
                        {msg.senderAvatar}
                      </span>
                    )}

                    <div>
                      {!isMe && (
                        <div className="text-[10px] font-bold text-purple-800 ml-1 mb-0.5">
                          {msg.senderName}
                        </div>
                      )}

                      <div className="flex items-center gap-1 group/msg">
                        {isMe && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this message?')) {
                                deleteChatMessage(msg.id);
                              }
                            }}
                            className="opacity-40 hover:opacity-100 p-1 text-purple-400 hover:text-rose-500 rounded transition-all flex-shrink-0"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}

                        <div
                          onClick={() => {
                            if (isSpecial) triggerSparkleExplosion();
                          }}
                          className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium leading-relaxed shadow-xs transition-all ${
                            isSpecial
                              ? 'bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white font-bold shadow-cute cursor-pointer active:scale-95'
                              : isMe
                              ? 'bg-gradient-to-r from-purple-700 to-lavender-600 text-white rounded-br-xs'
                              : 'bg-white text-purple-950 border border-lavender-200 rounded-bl-xs'
                          }`}
                          title={isSpecial ? 'Tap to burst sparkles! ✨' : undefined}
                        >
                          {msg.text}
                        </div>

                        {!isMe && (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this message?')) {
                                deleteChatMessage(msg.id);
                              }
                            }}
                            className="opacity-40 hover:opacity-100 p-1 text-purple-400 hover:text-rose-500 rounded transition-all flex-shrink-0"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isMe && (
                      <span className="text-lg mb-1 flex-shrink-0" title={msg.senderName}>
                        {msg.senderAvatar}
                      </span>
                    )}
                  </div>

                  <div className={`flex items-center gap-1 text-[10px] text-purple-400 mt-0.5 px-1 font-sans ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && (
                      partnerUser?.lastReadAt && new Date(msg.createdAt).getTime() <= new Date(partnerUser.lastReadAt).getTime() ? (
                        <span className="text-purple-600 font-extrabold tracking-tighter ml-1 inline-flex items-center text-xs" title="Read by partner">
                          ✓✓
                        </span>
                      ) : (
                        <span className="text-purple-400 font-bold ml-1 inline-flex items-center text-xs" title="Sent to capsule">
                          ✓
                        </span>
                      )
                    )}
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Bottom Sticky Controls & Input Bar */}
      <footer className="z-30 glass-panel bg-white/95 backdrop-blur-md border-t border-lavender-200 shadow-cute-lg flex-shrink-0">
        <div className="max-w-4xl mx-auto p-2 sm:p-3">
          {/* Quick Prompt Pills Bar */}
          <div className="pb-2 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex-shrink-0 flex items-center gap-1 pl-1">
              <Sparkles className="w-3 h-3 text-purple-600" /> Prompts:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(prompt)}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-lavender-50 hover:bg-lavender-100 text-purple-900 border border-lavender-200 whitespace-nowrap shadow-xs transition-all active:scale-95 flex-shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Form Input */}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${partnerUser ? partnerUser.name : 'friend'}...`}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-lavender-50 border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-950 text-base"
            />

            {/* Cute Selfie Camera Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenCamera}
              className="p-2.5 rounded-2xl bg-lavender-100 hover:bg-lavender-200 text-purple-700 border border-lavender-200 transition-colors flex items-center justify-center flex-shrink-0"
              title="Open Cute Selfie Camera 📸"
            >
              <Camera className="w-5 h-5 text-purple-700" />
            </motion.button>

            {/* Sparkle Wave Quick Burst */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendSparkles}
              className="p-2.5 rounded-2xl bg-lavender-100 hover:bg-lavender-200 text-purple-700 border border-lavender-200 transition-colors flex items-center justify-center flex-shrink-0"
              title="Send Sparkle Burst"
            >
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </motion.button>

            {/* Send Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!inputText.trim()}
              className={`p-2.5 px-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
                inputText.trim()
                  ? 'bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white shadow-cute hover:brightness-105'
                  : 'bg-lavender-100 text-purple-300 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold">Send</span>
            </motion.button>
          </form>
        </div>
      </footer>
    </div>
  );
};
