import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle, Film, Heart } from 'lucide-react';
import { Memory } from '../types';
import { useVault } from '../context/VaultContext';

interface GalleryGridProps {
  onSelectMemory: (memory: Memory) => void;
  onOpenUpload: () => void;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  onSelectMemory,
  onOpenUpload,
}) => {
  const { memories, currentUser, partnerUser, toggleHeart } = useVault();
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'mine' | 'theirs' | 'starred'>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Filter memories
  const filteredMemories = memories.filter((mem) => {
    if (activeTag && !mem.tags.includes(activeTag)) return false;
    if (filter === 'photo' && mem.type !== 'image') return false;
    if (filter === 'video' && mem.type !== 'video') return false;
    if (filter === 'mine' && mem.uploaderId !== currentUser?.id) return false;
    if (filter === 'theirs' && mem.uploaderId === currentUser?.id) return false;
    if (filter === 'starred' && (!currentUser || !mem.hearts.includes(currentUser.id))) return false;
    return true;
  });

  // Extract all unique tags
  const allTags = Array.from(new Set(memories.flatMap((m) => m.tags)));

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <button
            onClick={() => { setFilter('all'); setActiveTag(null); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'all' && !activeTag
                ? 'bg-purple-700 text-white shadow-cute'
                : 'bg-white/80 hover:bg-lavender-100 text-purple-900 border border-lavender-200'
            }`}
          >
            All Memories ({memories.length})
          </button>

          <button
            onClick={() => { setFilter('starred'); setActiveTag(null); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filter === 'starred'
                ? 'bg-purple-700 text-white shadow-cute'
                : 'bg-white/80 hover:bg-lavender-100 text-purple-800 border border-lavender-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Favorites</span>
          </button>

          <button
            onClick={() => { setFilter('video'); setActiveTag(null); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              filter === 'video'
                ? 'bg-purple-700 text-white shadow-cute'
                : 'bg-white/80 hover:bg-lavender-100 text-purple-900 border border-lavender-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>

          {currentUser && (
            <button
              onClick={() => { setFilter('mine'); setActiveTag(null); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'mine'
                  ? 'bg-purple-700 text-white shadow-cute'
                  : 'bg-white/80 hover:bg-lavender-100 text-purple-900 border border-lavender-200'
              }`}
            >
              By {currentUser.name}
            </button>
          )}

          {partnerUser && (
            <button
              onClick={() => { setFilter('theirs'); setActiveTag(null); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'theirs'
                  ? 'bg-purple-700 text-white shadow-cute'
                  : 'bg-white/80 hover:bg-lavender-100 text-purple-900 border border-lavender-200'
              }`}
            >
              By {partnerUser.name}
            </button>
          )}
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1">
            <span className="text-purple-400 font-bold mr-1">#</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeTag === tag
                    ? 'bg-purple-800 text-white'
                    : 'bg-lavender-100/80 text-purple-800 hover:bg-lavender-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid Content */}
      {filteredMemories.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-3xl border border-dashed border-lavender-300 my-8">
          <div className="text-4xl mb-3">🪻</div>
          <h3 className="text-lg font-bold text-purple-900 font-cute">No memories in this view yet</h3>
          <p className="text-xs text-purple-600 mt-1 max-w-sm mx-auto">
            Upload your first photo or video to add it to your lavender timeline.
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white font-bold text-xs shadow-cute hover:shadow-glow transition-all inline-flex items-center gap-1.5"
          >
            <span>+ Upload Photo or Video</span>
          </button>
        </div>
      ) : (
        <motion.div
          layout
          className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5 space-y-5"
        >
          <AnimatePresence>
            {filteredMemories.map((memory) => {
              const isLiked = currentUser && memory.hearts.includes(currentUser.id);
              return (
                <motion.div
                  key={memory.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="break-inside-avoid"
                >
                  <div className="polaroid-frame rounded-2xl cursor-pointer group relative overflow-hidden bg-white">
                    {/* Media Container */}
                    <div
                      onClick={() => onSelectMemory(memory)}
                      className="relative overflow-hidden rounded-xl bg-purple-100/50 aspect-auto"
                    >
                      {memory.type === 'video' ? (
                        <div className="relative">
                          <video
                            src={memory.mediaUrl}
                            className="w-full h-auto object-cover rounded-xl"
                            muted
                            playsInline
                            loop
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-cute text-purple-800">
                              <Film className="w-5 h-5 ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={memory.mediaUrl}
                          alt={memory.caption}
                          loading="lazy"
                          className="w-full h-auto object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                        />
                      )}

                      {/* AI Mood Sticker Badge */}
                      {memory.aiMood && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/20">
                          <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                          <span>{memory.aiMood}</span>
                        </div>
                      )}

                      {/* Quick Favorite Reaction Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHeart(memory.id);
                        }}
                        className={`absolute bottom-2 right-2 p-2 rounded-full backdrop-blur-md transition-transform active:scale-125 shadow-sm ${
                          isLiked
                            ? 'bg-purple-700 text-white'
                            : 'bg-white/80 text-purple-600 hover:bg-white'
                        }`}
                        title="Favorite this memory"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : 'fill-purple-200'}`} />
                      </button>
                    </div>

                    {/* Polaroid Bottom Caption Area */}
                    <div
                      onClick={() => onSelectMemory(memory)}
                      className="pt-3 px-1"
                    >
                      <p className="text-xs sm:text-sm font-semibold text-purple-950 font-cute leading-snug line-clamp-2">
                        {memory.caption}
                      </p>

                      <div className="mt-2 pt-2 border-t border-lavender-100 flex items-center justify-between text-[11px] text-purple-500">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{memory.uploaderAvatar}</span>
                          <span className="text-purple-900 font-semibold">{memory.uploaderName}</span>
                          <span>•</span>
                          <span>{memory.date}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {memory.hearts.length > 0 && (
                            <span className="flex items-center gap-0.5 text-purple-700 font-bold">
                              <Heart className="w-3 h-3 fill-purple-700" />
                              <span>{memory.hearts.length}</span>
                            </span>
                          )}
                          {memory.notes.length > 0 && (
                            <span className="flex items-center gap-0.5 text-purple-600 font-bold">
                              <MessageCircle className="w-3 h-3" />
                              <span>{memory.notes.length}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
