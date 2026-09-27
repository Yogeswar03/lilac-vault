import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle, Film, Heart, LayoutGrid, Columns, Trash2, Folder, FolderPlus, X } from 'lucide-react';
import { Memory } from '../types';
import { useVault, DEFAULT_FOLDERS } from '../context/VaultContext';

interface GalleryGridProps {
  onSelectMemory: (memory: Memory) => void;
  onOpenUpload: () => void;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  onSelectMemory,
  onOpenUpload,
}) => {
  const {
    memories,
    currentUser,
    partnerUser,
    toggleHeart,
    deleteMemory,
    folders,
    activeFolder,
    setActiveFolder,
    addFolder,
    deleteFolder,
  } = useVault();
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'mine' | 'theirs' | 'starred'>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Gallery view mode: 'grid' (aesthetic 2-4 columns) vs 'feed' (spacious polaroid cards)
  const [layoutMode, setLayoutMode] = useState<'grid' | 'feed'>('grid');

  // Filter memories
  const filteredMemories = memories.filter((mem) => {
    if (activeFolder !== 'All') {
      const memFolder = mem.folder || 'General ✨';
      if (memFolder !== activeFolder) return false;
    }
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* 📁 Folders Segregation Bar */}
      <div className="mb-4 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-lavender-200 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950 uppercase tracking-wider">
            <Folder className="w-4 h-4 text-purple-700" />
            <span>Folders</span>
          </div>
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold transition-all shadow-2xs"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ New Folder</span>
          </button>
        </div>

        {/* Scrollable Folder Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveFolder('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFolder === 'All'
                ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-cute'
                : 'bg-white hover:bg-lavender-100 text-purple-900 border border-lavender-200'
            }`}
          >
            <span>📁 All</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeFolder === 'All' ? 'bg-white/20 text-white' : 'bg-lavender-100 text-purple-800'}`}>
              {memories.length}
            </span>
          </button>

          {folders.map((folderName) => {
            const count = memories.filter((m) => (m.folder || 'General ✨') === folderName).length;
            const isSelected = activeFolder === folderName;
            const isDefault = DEFAULT_FOLDERS.includes(folderName);

            return (
              <div key={folderName} className="relative group/folder flex-shrink-0">
                <button
                  onClick={() => setActiveFolder(folderName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-cute'
                      : 'bg-white hover:bg-lavender-100 text-purple-900 border border-lavender-200'
                  }`}
                >
                  <span>{folderName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-lavender-100 text-purple-800'}`}>
                    {count}
                  </span>
                </button>

                {!isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete folder "${folderName}"? Memories in this folder will be moved to General ✨.`)) {
                        deleteFolder(folderName);
                      }
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] flex items-center justify-center opacity-80 sm:opacity-0 group-hover/folder:opacity-100 transition-opacity shadow-xs"
                    title={`Delete folder ${folderName}`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create New Folder Modal */}
      {isCreatingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lavender-950/60 backdrop-blur-md">
          <div className="w-full max-w-sm glass-card rounded-3xl p-5 shadow-2xl relative border border-lavender-200">
            <button
              onClick={() => setIsCreatingFolder(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-lavender-100 text-purple-700"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-3 text-purple-950 font-bold font-cute text-base">
              <FolderPlus className="w-5 h-5 text-purple-700" />
              <span>Create New Folder</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newFolderName.trim()) {
                  addFolder(newFolderName.trim());
                  setActiveFolder(newFolderName.trim());
                  setNewFolderName('');
                  setIsCreatingFolder(false);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">Folder Name & Emoji</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Anniversary 💖, Beach Trip 🏖️"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-950 text-sm font-semibold"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 hover:bg-lavender-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-cute"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and View Mode Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <button
            onClick={() => { setFilter('all'); setActiveTag(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              filter === 'all' && !activeTag
                ? 'bg-purple-700 text-white shadow-cute'
                : 'bg-white/80 hover:bg-lavender-100 text-purple-900 border border-lavender-200'
            }`}
          >
            All ({memories.length})
          </button>

          <button
            onClick={() => { setFilter('starred'); setActiveTag(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
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
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
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
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'mine'
                  ? 'bg-purple-700 text-white shadow-cute'
                  : 'bg-white/80 hover:bg-lavender-100 text-purple-900 border border-lavender-200'
              }`}
            >
              By {currentUser.name.split(' ')[0]}
            </button>
          )}

          {partnerUser && (
            <button
              onClick={() => { setFilter('theirs'); setActiveTag(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'theirs'
                  ? 'bg-purple-700 text-white shadow-cute'
                  : 'bg-white/80 hover:bg-lavender-100 text-purple-900 border border-lavender-200'
              }`}
            >
              By {partnerUser.name.split(' ')[0]}
            </button>
          )}
        </div>

        {/* View Layout Toggle: Gallery Grid vs Polaroid Feed */}
        <div className="flex items-center gap-2">
          {/* Tag chips */}
          {allTags.length > 0 && (
            <div className="hidden md:flex items-center gap-1 text-xs">
              <span className="text-purple-400 font-bold mr-1">#</span>
              {allTags.slice(0, 4).map((tag) => (
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

          {/* Grid / Feed Toggle Buttons */}
          <div className="flex items-center p-1 bg-lavender-100/90 rounded-2xl border border-lavender-200 shadow-2xs">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                layoutMode === 'grid'
                  ? 'bg-white text-purple-950 shadow-xs'
                  : 'text-purple-700 hover:text-purple-950'
              }`}
              title="Aesthetic Gallery Grid (2-4 columns)"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
              <span>Gallery</span>
            </button>

            <button
              onClick={() => setLayoutMode('feed')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                layoutMode === 'feed'
                  ? 'bg-white text-purple-950 shadow-xs'
                  : 'text-purple-700 hover:text-purple-950'
              }`}
              title="Polaroid Story Cards"
            >
              <Columns className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Polaroid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
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
      ) : layoutMode === 'grid' ? (
        /* MODE 1: AESTHETIC MULTI-COLUMN GALLERY GRID (2 cols on mobile, 4-5 on desktop) */
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4"
        >
          <AnimatePresence>
            {filteredMemories.map((memory) => {
              const isLiked = currentUser && memory.hearts.includes(currentUser.id);
              return (
                <motion.div
                  key={memory.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className="group relative cursor-pointer"
                  onClick={() => onSelectMemory(memory)}
                >
                  <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-purple-100/50 border border-lavender-200/90 shadow-2xs group-hover:shadow-cute transition-all duration-300">
                    {/* Media item */}
                    {memory.type === 'video' ? (
                      <div className="relative w-full h-full">
                        <video
                          src={memory.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          loop
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-xs text-purple-800">
                            <Film className="w-4 h-4 ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={memory.mediaUrl}
                        alt={memory.caption}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}

                    {/* Top Uploader Avatar Pill & Folder Badge */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 max-w-[calc(100%-55px)]">
                      <div className="px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/20">
                        <span>{memory.uploaderAvatar}</span>
                        <span className="truncate max-w-[55px] sm:max-w-none">{memory.uploaderName.split(' ')[0]}</span>
                      </div>
                      <div className="px-1.5 py-0.5 rounded-md bg-purple-950/75 backdrop-blur-md text-[9px] font-bold text-lavender-200 border border-purple-400/20 truncate max-w-full">
                        📁 {memory.folder || 'General ✨'}
                      </div>
                    </div>

                    {/* Top Right Actions: Mood sticker + Delete */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                      {memory.aiMood && (
                        <div className="hidden sm:flex px-1.5 py-0.5 rounded-full bg-purple-900/60 backdrop-blur-md text-[9px] font-bold text-yellow-300 items-center gap-0.5 border border-purple-300/30">
                          <Sparkles className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete this memory ("${memory.caption || 'memory'}") from your capsule?`)) {
                            deleteMemory(memory.id);
                          }
                        }}
                        className="p-1 rounded-full bg-black/45 hover:bg-rose-600 text-white/80 hover:text-white backdrop-blur-md transition-all shadow-xs"
                        title="Delete this memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom Scrim with Caption and Heart */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-2.5 pt-6 text-white flex items-end justify-between gap-1.5">
                      <p className="text-[11px] sm:text-xs font-semibold font-cute line-clamp-1 truncate flex-1">
                        {memory.caption}
                      </p>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHeart(memory.id);
                        }}
                        className={`p-1.5 rounded-full backdrop-blur-md transition-transform active:scale-125 flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold ${
                          isLiked ? 'text-rose-400 bg-white/20' : 'text-white/80 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400' : 'fill-none'}`} />
                        {memory.hearts.length > 0 && <span>{memory.hearts.length}</span>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* MODE 2: POLAROID STORY FEED (Detailed cards) */
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
                  className="flex flex-col"
                >
                  <div className="polaroid-frame rounded-3xl cursor-pointer group relative overflow-hidden bg-white h-full flex flex-col justify-between shadow-cute">
                    {/* Media Container with Consistent 4:5 Aspect Ratio */}
                    <div
                      onClick={() => onSelectMemory(memory)}
                      className="relative overflow-hidden rounded-2xl bg-purple-100/50 aspect-[4/5] w-full flex-shrink-0"
                    >
                      {memory.type === 'video' ? (
                        <div className="relative w-full h-full">
                          <video
                            src={memory.mediaUrl}
                            className="w-full h-full object-cover rounded-2xl"
                            muted
                            playsInline
                            loop
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-cute text-purple-800">
                              <Film className="w-6 h-6 ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={memory.mediaUrl}
                          alt={memory.caption}
                          loading="lazy"
                          className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                        />
                      )}

                      {/* AI Mood Sticker Badge */}
                      {memory.aiMood && (
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/20">
                          <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                          <span>{memory.aiMood}</span>
                        </div>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete this memory ("${memory.caption || 'memory'}") from your capsule?`)) {
                            deleteMemory(memory.id);
                          }
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/45 hover:bg-rose-600 text-white/80 hover:text-white backdrop-blur-md transition-all shadow-sm z-10"
                        title="Delete this memory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHeart(memory.id);
                        }}
                        className={`absolute bottom-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-transform active:scale-125 shadow-sm ${
                          isLiked
                            ? 'bg-purple-700 text-white'
                            : 'bg-white/85 text-purple-600 hover:bg-white'
                        }`}
                        title="Favorite this memory"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : 'fill-purple-200'}`} />
                      </button>
                    </div>

                    {/* Polaroid Bottom Caption Area */}
                    <div
                      onClick={() => onSelectMemory(memory)}
                      className="pt-3.5 px-1.5"
                    >
                      <p className="text-sm font-semibold text-purple-950 font-cute leading-snug line-clamp-2">
                        {memory.caption}
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg bg-lavender-100 text-purple-800 text-[10px] font-bold border border-lavender-200">
                          📁 {memory.folder || 'General ✨'}
                        </span>
                        {memory.tags.slice(0, 3).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[10px] font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2.5 pt-2.5 border-t border-lavender-100 flex items-center justify-between text-[11px] text-purple-500">
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete this memory ("${memory.caption || 'memory'}")?`)) {
                                deleteMemory(memory.id);
                              }
                            }}
                            className="p-1 text-purple-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors ml-0.5"
                            title="Delete memory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
