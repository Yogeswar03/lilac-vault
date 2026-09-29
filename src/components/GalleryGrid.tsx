import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MessageCircle,
  Film,
  Heart,
  LayoutGrid,
  Columns,
  Trash2,
  Folder,
  FolderPlus,
  X,
  ArrowLeft,
  Plus,
  MapPin,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { Memory } from '../types';
import { useVault } from '../context/VaultContext';

interface GalleryGridProps {
  onSelectMemory: (memory: Memory) => void;
  onOpenUpload: () => void;
  onOpenBucketList?: () => void;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  onSelectMemory,
  onOpenUpload,
  onOpenBucketList,
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
    bucketList,
  } = useVault();

  // Navigation: null = Landing Page (Folders only); string = Inside specific folder ('__all__' for all memories)
  const [openedFolder, setOpenedFolder] = useState<string | null>(null);

  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'mine' | 'theirs' | 'starred'>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Gallery view mode when inside a folder: 'grid' vs 'feed'
  const [layoutMode, setLayoutMode] = useState<'grid' | 'feed'>('grid');

  // Bucket list counters
  const totalBucket = bucketList.length;
  const completedBucket = bucketList.filter((b) => b.isCompleted).length;
  const pendingBucket = totalBucket - completedBucket;

  // Filter memories when inside an opened folder
  const currentFolderMemories = memories.filter((mem) => {
    if (openedFolder && openedFolder !== '__all__') {
      if (mem.folder !== openedFolder) return false;
    }
    if (activeTag && !mem.tags.includes(activeTag)) return false;
    if (filter === 'photo' && mem.type !== 'image') return false;
    if (filter === 'video' && mem.type !== 'video') return false;
    if (filter === 'mine' && mem.uploaderId !== currentUser?.id) return false;
    if (filter === 'theirs' && mem.uploaderId === currentUser?.id) return false;
    if (filter === 'starred' && (!currentUser || !mem.hearts.includes(currentUser.id))) return false;
    return true;
  });

  // Extract all unique tags for the currently opened folder
  const folderTags = Array.from(new Set(currentFolderMemories.flatMap((m) => m.tags)));

  // Handle creating a new folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFolderName.trim();
    if (clean) {
      await addFolder(clean);
      setNewFolderName('');
      setIsCreatingFolder(false);
      setOpenedFolder(clean);
      setActiveFolder(clean);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* ======================================================== */}
      {/* VIEW 1: LANDING PAGE — SHOW FOLDERS ONLY                 */}
      {/* ======================================================== */}
      {openedFolder === null ? (
        <div className="space-y-6">
          {/* Quick Bucket List / Places We Want to Go Banner */}
          {onOpenBucketList && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={onOpenBucketList}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-cute border border-purple-400/30 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/15 group-hover:scale-105 transition-transform flex-shrink-0">
                  🗺️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold font-cute text-white">
                      Places We Want to Go & Bucket List
                    </h3>
                    <span className="text-xs">✨</span>
                  </div>
                  <p className="text-xs text-lavender-200/90 font-medium">
                    {totalBucket > 0
                      ? `${pendingBucket} places to visit • ${completedBucket} visited together`
                      : 'Create your shared travel wishlist & dream destinations'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-lavender-300" />
                  <span>Open Bucket List</span>
                </span>
              </div>
            </motion.div>
          )}

          {/* Folders Section Header */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <Folder className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-cute text-purple-950">
                  Our Memory Folders
                </h3>
                <p className="text-xs text-purple-600 font-medium">
                  Tap an album to view photos or create a new folder
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-cute transition-all"
            >
              <FolderPlus className="w-4 h-4 stroke-[2.5]" />
              <span>+ New Folder</span>
            </motion.button>
          </div>

          {/* Folders Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5">
            {/* 1. All Photos & Videos Collection Album (if memories exist) */}
            {memories.length > 0 && (
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setOpenedFolder('__all__');
                  setActiveFolder('All');
                }}
                className="group relative cursor-pointer rounded-3xl overflow-hidden glass-card border border-purple-200 shadow-cute hover:shadow-glow transition-all flex flex-col"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-tr from-purple-800 via-indigo-700 to-lavender-600">
                  {memories[0]?.mediaUrl ? (
                    <img
                      src={memories[0].mediaUrl}
                      alt="All Memories Cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-90"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-3">
                    <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                      {memories.length} item{memories.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-white/95 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold font-cute text-purple-950 flex items-center gap-1.5">
                      <span>📸</span>
                      <span>All Memories</span>
                    </h4>
                    <p className="text-[11px] text-purple-600 mt-0.5 font-medium">
                      Complete photo & video vault
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 mt-2 flex items-center gap-1">
                    <span>View all →</span>
                  </span>
                </div>
              </motion.div>
            )}

            {/* 2. User-Created Folders */}
            {folders.map((folderName) => {
              const folderMems = memories.filter((m) => m.folder === folderName);
              const coverMemory = folderMems[0];
              const count = folderMems.length;

              return (
                <motion.div
                  key={folderName}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setOpenedFolder(folderName);
                    setActiveFolder(folderName);
                  }}
                  className="group relative cursor-pointer rounded-3xl overflow-hidden glass-card border border-lavender-200/90 shadow-cute hover:shadow-glow transition-all flex flex-col"
                >
                  {/* Folder Cover Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-tr from-purple-100 via-lavender-100 to-indigo-100">
                    {coverMemory ? (
                      <img
                        src={coverMemory.mediaUrl}
                        alt={folderName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-purple-300">
                        <Folder className="w-10 h-10 mb-1 opacity-70" />
                        <span className="text-[10px] font-semibold text-purple-500">Empty folder</span>
                      </div>
                    )}

                    {/* Scrim with Count */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex items-end justify-between p-2.5 sm:p-3">
                      <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                        {count} item{count !== 1 ? 's' : ''}
                      </span>

                      {/* Delete folder button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Delete folder "${folderName}"? Photos inside will remain safe in your vault.`
                            )
                          ) {
                            deleteFolder(folderName);
                          }
                        }}
                        className="p-1.5 rounded-full bg-black/40 hover:bg-rose-600 text-white/80 hover:text-white backdrop-blur-md transition-colors opacity-90 sm:opacity-0 group-hover:opacity-100"
                        title={`Delete folder "${folderName}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Folder Info */}
                  <div className="p-3 sm:p-4 bg-white/95 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold font-cute text-purple-950 truncate">
                        {folderName}
                      </h4>
                      <p className="text-[11px] text-purple-600 mt-0.5 font-medium">
                        {count > 0 ? `${count} memor${count === 1 ? 'y' : 'ies'}` : 'Tap to add photos'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 mt-2 flex items-center gap-1">
                      <span>Open album →</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {/* 3. "+ Create New Folder" Action Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreatingFolder(true)}
              className="cursor-pointer rounded-3xl p-5 border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50/70 transition-all flex flex-col items-center justify-center text-center min-h-[170px] sm:min-h-[210px] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-purple-200 transition-all mb-2.5">
                <Plus className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold font-cute text-purple-950">
                + Create Folder
              </h4>
              <p className="text-[11px] text-purple-600 mt-1 max-w-[140px]">
                Organize trips, selfies, or special dates
              </p>
            </motion.div>
          </div>

          {/* Empty state when user has created 0 folders and has 0 memories */}
          {folders.length === 0 && memories.length === 0 && (
            <div className="py-12 px-4 text-center rounded-3xl glass-card border border-dashed border-lavender-300 max-w-lg mx-auto">
              <div className="text-4xl mb-3">📁✨</div>
              <h3 className="text-base sm:text-lg font-bold font-cute text-purple-950">
                No folders created yet!
              </h3>
              <p className="text-xs text-purple-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Create your first custom folder (like &quot;Our Trips ✈️&quot;, &quot;Weekend Dates ☕&quot;, or &quot;Cute Selfies 📸&quot;) to start collecting moments together.
              </p>
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs shadow-cute hover:shadow-glow transition-all inline-flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Create Your First Folder</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* VIEW 2: INSIDE OPENED FOLDER — SHOW PHOTOS GRID          */
        /* ======================================================== */
        <div className="space-y-4">
          {/* Navigation Bar: ← Back to Folders */}
          <div className="p-3 sm:p-4 rounded-3xl bg-white/90 backdrop-blur-md border border-lavender-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setOpenedFolder(null);
                  setActiveFolder('All');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition-all shadow-2xs flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Folders</span>
              </motion.button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-lg font-bold font-cute text-purple-950 truncate">
                    {openedFolder === '__all__' ? '📸 All Memories' : `📁 ${openedFolder}`}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold flex-shrink-0">
                    {currentFolderMemories.length} item{currentFolderMemories.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Add Photo Button pre-selecting this folder */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (openedFolder !== '__all__') {
                    setActiveFolder(openedFolder);
                  }
                  onOpenUpload();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-cute transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Add to this folder</span>
              </motion.button>
            </div>
          </div>

          {/* Filter and View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
              <button
                onClick={() => {
                  setFilter('all');
                  setActiveTag(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  filter === 'all' && !activeTag
                    ? 'bg-purple-700 text-white shadow-cute'
                    : 'bg-white/80 hover:bg-lavender-100 text-purple-900 border border-lavender-200'
                }`}
              >
                All ({currentFolderMemories.length})
              </button>

              <button
                onClick={() => {
                  setFilter('starred');
                  setActiveTag(null);
                }}
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
                onClick={() => {
                  setFilter('video');
                  setActiveTag(null);
                }}
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
                  onClick={() => {
                    setFilter('mine');
                    setActiveTag(null);
                  }}
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
                  onClick={() => {
                    setFilter('theirs');
                    setActiveTag(null);
                  }}
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

            {/* Layout Mode (Grid vs Polaroid) */}
            <div className="flex items-center gap-2">
              {folderTags.length > 0 && (
                <div className="hidden md:flex items-center gap-1 text-xs">
                  <span className="text-purple-400 font-bold mr-1">#</span>
                  {folderTags.slice(0, 4).map((tag) => (
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

              <div className="flex items-center p-1 bg-lavender-100/90 rounded-2xl border border-lavender-200 shadow-2xs">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    layoutMode === 'grid'
                      ? 'bg-white text-purple-950 shadow-xs'
                      : 'text-purple-700 hover:text-purple-950'
                  }`}
                  title="Gallery Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-purple-600" />
                  <span>Grid</span>
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

          {/* Folder Media Grid or Empty State */}
          {currentFolderMemories.length === 0 ? (
            <div className="p-12 text-center glass-card rounded-3xl border border-dashed border-lavender-300 my-4">
              <div className="text-4xl mb-3">📁✨</div>
              <h3 className="text-base sm:text-lg font-bold text-purple-900 font-cute">
                No memories in this folder yet
              </h3>
              <p className="text-xs text-purple-600 mt-1 max-w-sm mx-auto">
                Add your favorite photos or videos to start filling up this album!
              </p>
              <button
                onClick={() => {
                  if (openedFolder !== '__all__') {
                    setActiveFolder(openedFolder);
                  }
                  onOpenUpload();
                }}
                className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white font-bold text-xs shadow-cute hover:shadow-glow transition-all inline-flex items-center gap-1.5"
              >
                <span>+ Upload to this Folder</span>
              </button>
            </div>
          ) : layoutMode === 'grid' ? (
            /* MULTI-COLUMN GALLERY GRID */
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4"
            >
              <AnimatePresence>
                {currentFolderMemories.map((memory) => {
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

                        {/* Top Uploader Avatar Pill */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 max-w-[calc(100%-55px)]">
                          <div className="px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/20">
                            <span>{memory.uploaderAvatar}</span>
                            <span className="truncate max-w-[55px] sm:max-w-none">
                              {memory.uploaderName.split(' ')[0]}
                            </span>
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
                              if (
                                window.confirm(
                                  `Delete this memory ("${memory.caption || 'memory'}") from your capsule?`
                                )
                              ) {
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
            /* POLAROID STORY FEED */
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {currentFolderMemories.map((memory) => {
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

                          {memory.aiMood && (
                            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/20">
                              <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                              <span>{memory.aiMood}</span>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  `Delete this memory ("${memory.caption || 'memory'}") from your capsule?`
                                )
                              ) {
                                deleteMemory(memory.id);
                              }
                            }}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/45 hover:bg-rose-600 text-white/80 hover:text-white backdrop-blur-md transition-all shadow-sm z-10"
                            title="Delete this memory"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

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

                        <div
                          onClick={() => onSelectMemory(memory)}
                          className="pt-3.5 px-1.5"
                        >
                          <p className="text-sm font-semibold text-purple-950 font-cute leading-snug line-clamp-2">
                            {memory.caption}
                          </p>

                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            {memory.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[10px] font-medium"
                              >
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
      )}

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
            <form onSubmit={handleCreateFolder} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  Folder Name & Emoji
                </label>
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
    </div>
  );
};
