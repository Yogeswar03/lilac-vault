import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Sparkles, MessageCircle } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface CapsuleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHAT_PROMPTS = [
  'Remember this day? 🪻',
  'Check out the latest photo! ✨',
  'Hope you are having an awesome day! ☀️',
  'We need to do this again soon! ☕',
  'Added this to our highlight reel 📸',
];

export const CapsuleChatModal: React.FC<CapsuleChatModalProps> = ({ isOpen, onClose }) => {
  const { chatMessages, currentUser, partnerUser, sendChatMessage, triggerSparkleExplosion } = useVault();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText, 'text');
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    sendChatMessage(prompt, 'text');
  };

  const handleSendSparkles = () => {
    sendChatMessage('✨ Sent you a wave of sparkles! 🪻', 'sparkle_burst');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-lavender-950/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg h-[85vh] max-h-[700px] glass-card rounded-3xl flex flex-col shadow-2xl relative border border-lavender-200 overflow-hidden"
      >
        {/* Chat Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-purple-800 via-lavender-700 to-indigo-700 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/30">
                {partnerUser?.avatar || '☕'}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-purple-800" />
            </div>

            <div>
              <div className="text-sm font-bold font-cute flex items-center gap-1.5">
                <span>{partnerUser ? partnerUser.name : 'Waiting for Partner'}</span>
                <span>🪻</span>
              </div>
              <p className="text-[11px] text-lavender-100 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                <span>Private 2-user shared space</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSendSparkles}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-yellow-300 transition-colors text-xs font-bold flex items-center gap-1"
              title="Send sparkles"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="px-3 py-2 bg-lavender-50/90 border-b border-lavender-200 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600" /> Quick:
          </span>
          {CHAT_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(prompt)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white hover:bg-lavender-100 text-purple-900 border border-lavender-200 whitespace-nowrap shadow-xs transition-all active:scale-95"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-lavender-50/40 via-white/80 to-lavender-100/30">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-purple-400">
              <div className="w-14 h-14 rounded-full bg-lavender-100 flex items-center justify-center text-2xl mb-2 text-purple-700">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-purple-900 font-cute">Capsule Chat</h4>
              <p className="text-xs text-purple-600 mt-1 max-w-xs">
                Leave notes, share links, or tap a quick prompt to message your partner in this vault.
              </p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const isSpecial = msg.type === 'sparkle_burst';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-1.5 max-w-[82%]">
                    {!isMe && (
                      <span className="text-sm mb-1">{msg.senderAvatar}</span>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium shadow-xs leading-relaxed ${
                        isSpecial
                          ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold shadow-cute'
                          : isMe
                          ? 'bg-gradient-to-r from-purple-700 to-lavender-600 text-white rounded-br-xs'
                          : 'bg-white text-purple-950 border border-lavender-200 rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {isMe && (
                      <span className="text-sm mb-1">{msg.senderAvatar}</span>
                    )}
                  </div>

                  <span className="text-[10px] text-purple-400 mt-0.5 px-1 font-sans">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-white/95 border-t border-lavender-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-lavender-50/70 border border-lavender-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-950 text-xs sm:text-sm"
          />

          <button
            type="button"
            onClick={handleSendSparkles}
            className="p-2.5 rounded-2xl bg-lavender-50 hover:bg-lavender-100 text-purple-600 border border-lavender-200 transition-colors"
            title="Send sparkles"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
          </button>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`p-2.5 rounded-2xl font-bold transition-all flex items-center justify-center ${
              inputText.trim()
                ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-cute hover:brightness-105'
                : 'bg-lavender-100 text-purple-300 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
