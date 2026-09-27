import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Download, Trash2, Calendar, Sparkles, Send } from 'lucide-react';
import { Memory } from '../types';
import { useVault } from '../context/VaultContext';

interface MemoryLightboxProps {
  memory: Memory | null;
  onClose: () => void;
}

export const MemoryLightbox: React.FC<MemoryLightboxProps> = ({ memory, onClose }) => {
  const { currentUser, toggleHeart, addNote, deleteMemory } = useVault();
  const [newNoteText, setNewNoteText] = useState('');
  const [showSparkleBurst, setShowSparkleBurst] = useState(false);

  if (!memory) return null;

  const isLiked = currentUser && memory.hearts.includes(currentUser.id);

  const handleHeartClick = () => {
    toggleHeart(memory.id);
    setShowSparkleBurst(true);
    setTimeout(() => setShowSparkleBurst(false), 800);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNote(memory.id, newNoteText);
    setNewNoteText('');
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to remove this memory from your capsule?')) {
      deleteMemory(memory.id);
      onClose();
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = memory.mediaUrl;
    a.download = `LilacVault-${memory.date}-${memory.id}.${memory.type === 'video' ? 'webm' : 'jpg'}`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-lavender-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl max-h-[92vh] glass-card rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative border border-lavender-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/70 hover:bg-white text-purple-900 shadow-sm transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Side (Left) */}
        <div
          onDoubleClick={handleHeartClick}
          className="relative flex-1 bg-lavender-950/90 flex items-center justify-center min-h-[300px] md:min-h-[500px] p-2 select-none overflow-hidden"
        >
          {memory.type === 'video' ? (
            <video
              src={memory.mediaUrl}
              controls
              autoPlay
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
          ) : (
            <img
              src={memory.mediaUrl}
              alt={memory.caption}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
          )}

          {/* Double Tap Sparkle Burst Animation */}
          <AnimatePresence>
            {showSparkleBurst && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Sparkles className="w-24 h-24 text-yellow-300 drop-shadow-glow" />
              </motion.div>
            )}
          </AnimatePresence>

          <span className="absolute bottom-3 left-3 text-[11px] text-white/60 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
            💡 Double-click photo to favorite
          </span>
        </div>

        {/* Story & Notes Side (Right) */}
        <div className="w-full md:w-96 p-5 sm:p-6 flex flex-col bg-white/95 overflow-y-auto max-h-[50vh] md:max-h-[85vh]">
          {/* Top Info */}
          <div className="flex items-center justify-between pb-3 border-b border-lavender-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{memory.uploaderAvatar}</span>
              <div>
                <div className="text-sm font-bold text-purple-950 font-cute">
                  {memory.uploaderName}
                </div>
                <div className="text-xs text-purple-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{memory.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleDownload}
                className="p-2 rounded-xl text-purple-600 hover:bg-lavender-100 transition-colors"
                title="Download Memory"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                title="Delete from Capsule"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Caption */}
          <div className="py-4">
            <p className="text-base text-purple-950 font-cute font-medium leading-relaxed">
              "{memory.caption}"
            </p>

            {memory.aiMood && (
              <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-lavender-100 text-purple-800 text-xs font-semibold">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>{memory.aiMood}</span>
              </div>
            )}

            {/* Tags */}
            {memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {memory.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-semibold text-purple-700 bg-lavender-50 border border-lavender-200 px-2 py-0.5 rounded-md"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reaction Bar */}
          <div className="py-3 px-3.5 rounded-2xl bg-lavender-50 border border-lavender-200 flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
              <Heart className={`w-4 h-4 ${isLiked ? 'text-purple-700 fill-purple-700' : 'text-purple-400'}`} />
              <span>{memory.hearts.length} {memory.hearts.length === 1 ? 'Favorite' : 'Favorites'}</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleHeartClick}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isLiked
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-white text-purple-700 hover:bg-lavender-100 border border-lavender-300'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
              <span>{isLiked ? 'Favorited ✨' : 'Favorite'}</span>
            </motion.button>
          </div>

          {/* Interactive Sticky Notes */}
          <div className="flex-1 flex flex-col min-h-0">
            <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>Memory Notes ({memory.notes.length})</span>
            </h4>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
              {memory.notes.length === 0 ? (
                <div className="text-center py-6 text-purple-400 text-xs italic">
                  No notes yet. Add a quick memory note! 📝
                </div>
              ) : (
                memory.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-950 font-medium"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-purple-900 flex items-center gap-1">
                        <span>{note.userAvatar}</span>
                        <span>{note.userName}</span>
                      </span>
                      <span className="text-[10px] text-purple-400">
                        {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="leading-snug">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add note input */}
            <form onSubmit={handleAddNote} className="flex items-center gap-1.5 pt-2 border-t border-lavender-100">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Leave a note on this memory..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-lavender-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-lavender-50/50 text-purple-950"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-purple-700 text-white hover:bg-purple-800 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
