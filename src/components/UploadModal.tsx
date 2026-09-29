import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Camera, Film, Sparkles, Tag, Calendar, Heart, Check, Plus, Trash2 } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { generateAICaptionSuggestion } from '../services/aiReelGenerator';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QueuedMedia {
  id: string;
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

const COMMON_TAGS = ['cafe', 'picnic', 'sunset', 'laugh', 'roadtrip', 'silly', 'boba', 'cozy', 'selfie', 'date'];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { uploadMemory, currentUser, folders, activeFolder } = useVault();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [queuedMedia, setQueuedMedia] = useState<QueuedMedia[]>([]);
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedFolder, setSelectedFolder] = useState<string>(() => (activeFolder && activeFolder !== 'All' ? activeFolder : (folders[0] || '')));
  const [isCustomFolder, setIsCustomFolder] = useState(() => folders.length === 0);
  const [customFolderName, setCustomFolderName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['cozy']);
  const [aiMood, setAiMood] = useState('Sweet Moments');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadIndex, setUploadIndex] = useState<{ current: number; total: number } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Sync default folder when activeFolder changes
  useEffect(() => {
    if (activeFolder && activeFolder !== 'All') {
      setSelectedFolder(activeFolder);
    }
  }, [activeFolder]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      queuedMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    };
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newItems: QueuedMedia[] = files.map((file) => ({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isVideo: file.type.startsWith('video'),
      }));

      setQueuedMedia((prev) => [...prev, ...newItems]);

      // Auto-suggest AI caption if caption is still blank
      if (!caption) {
        const ai = generateAICaptionSuggestion(selectedTags);
        setCaption(ai.caption);
        setAiMood(ai.mood);
      }
    }
    // Reset file input so user can re-pick same files if needed
    if (e.target) e.target.value = '';
  };

  const removeMedia = (id: string) => {
    setQueuedMedia((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((m) => m.id !== id);
    });
  };

  const clearAllMedia = () => {
    queuedMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setQueuedMedia([]);
  };

  const handleTriggerAI = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const ai = generateAICaptionSuggestion(selectedTags);
      setCaption(ai.caption);
      setAiMood(ai.mood);
      setIsGeneratingAI(false);
    }, 400);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (queuedMedia.length === 0) return;

    setIsUploading(true);
    const finalFolder = (isCustomFolder && customFolderName.trim())
      ? customFolderName.trim()
      : selectedFolder;

    const total = queuedMedia.length;
    try {
      for (let i = 0; i < total; i++) {
        setUploadIndex({ current: i + 1, total });
        const media = queuedMedia[i];
        const itemCaption = total > 1 && caption
          ? `${caption.trim()} (${i + 1}/${total})`
          : (caption.trim() || 'A precious memory 🌸');

        await uploadMemory({
          file: media.file,
          caption: itemCaption,
          tags: selectedTags,
          date,
          aiMood,
          folder: finalFolder,
        });
      }

      // Cleanup and close
      clearAllMedia();
      setCaption('');
      setIsCustomFolder(false);
      setCustomFolderName('');
      onClose();
    } catch (err) {
      console.error('Batch upload error:', err);
      alert('Some items failed to upload. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
      setUploadIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-lavender-950/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass-card rounded-3xl p-5 sm:p-6 shadow-2xl relative border border-lavender-200 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-lavender-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentUser?.avatar || '🌸'}</span>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-cute text-purple-950">Add Memories</h3>
              <p className="text-xs text-purple-600">
                {queuedMedia.length > 0
                  ? `${queuedMedia.length} photo${queuedMedia.length > 1 ? 's' : ''} selected`
                  : `Uploading as ${currentUser?.name}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isUploading) {
                clearAllMedia();
                onClose();
              }
            }}
            disabled={isUploading}
            className="p-1.5 rounded-full hover:bg-lavender-100 text-purple-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* File Picker / Multi-Image Preview Box */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {queuedMedia.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 sm:h-44 rounded-2xl border-2 border-dashed border-lavender-300 hover:border-purple-500 bg-lavender-50/50 hover:bg-lavender-100/60 flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-cute flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-purple-900">
                  Tap to pick multiple Photos or Videos
                </div>
                <div className="text-xs text-purple-600/80 mt-1">
                  Select 1 or many photos at once from your gallery ✨
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-purple-900">
                    Selected ({queuedMedia.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-2.5 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Add More</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearAllMedia}
                      disabled={isUploading}
                      className="text-xs text-purple-500 hover:text-rose-600 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Horizontal Scrollable Thumbnails Grid */}
                <div className="flex gap-2 overflow-x-auto p-2 bg-slate-900/5 rounded-2xl border border-lavender-200 max-h-36 no-scrollbar">
                  {queuedMedia.map((item, idx) => (
                    <div
                      key={item.id}
                      className="relative flex-shrink-0 w-24 h-28 rounded-xl overflow-hidden bg-slate-900 shadow-xs border border-lavender-300 group"
                    >
                      {item.isVideo ? (
                        <video src={item.previewUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.previewUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                      )}

                      {/* Video badge */}
                      {item.isVideo && (
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] flex items-center gap-0.5">
                          <Film className="w-2.5 h-2.5" />
                        </div>
                      )}

                      {/* Index badge */}
                      <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black/60 text-white text-[9px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>

                      {/* Remove button */}
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={() => removeMedia(item.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center shadow-xs"
                          title="Remove photo"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Folder Selection */}
          <div>
            <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1.5">
              Save To Folder 📁
            </label>
            <div className="flex gap-2">
              <select
                value={isCustomFolder ? '__custom__' : selectedFolder}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomFolder(true);
                  } else {
                    setIsCustomFolder(false);
                    setSelectedFolder(e.target.value);
                  }
                }}
                disabled={isUploading}
                className="w-full px-3 py-2 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-950 text-xs font-semibold"
              >
                {folders.map((f) => (
                  <option key={f} value={f}>
                    📁 {f}
                  </option>
                ))}
                <option value="__custom__">+ Create New Folder...</option>
              </select>
            </div>
            {isCustomFolder && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="New folder name & emoji (e.g. Vacation 🌊)"
                  value={customFolderName}
                  onChange={(e) => setCustomFolderName(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-3 py-2 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-950 text-xs font-medium"
                  required
                />
              </div>
            )}
          </div>

          {/* Caption with AI Suggester */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Caption & Story
              </label>
              <button
                type="button"
                onClick={handleTriggerAI}
                disabled={isGeneratingAI || isUploading}
                className="text-xs font-semibold text-purple-700 hover:text-purple-950 flex items-center gap-1 bg-purple-100/70 hover:bg-purple-100 px-2 py-0.5 rounded-full transition-colors"
              >
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>{isGeneratingAI ? 'Thinking...' : 'AI Caption ✨'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isUploading}
              placeholder="What made this moment special? 🌸"
              className="w-full px-3.5 py-2 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 text-sm resize-none"
            />
          </div>

          {/* Date & AI Mood */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                Date Taken
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isUploading}
                className="w-full px-3 py-1.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                Vibe / Mood
              </label>
              <input
                type="text"
                value={aiMood}
                onChange={(e) => setAiMood(e.target.value)}
                disabled={isUploading}
                placeholder="e.g. Cozy Sunset"
                className="w-full px-3 py-1.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 text-xs font-medium"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={isUploading}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-lavender-100 text-purple-700 hover:bg-lavender-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit with Progress */}
          <button
            type="submit"
            disabled={queuedMedia.length === 0 || isUploading}
            className={`w-full py-3 rounded-2xl font-bold shadow-cute transition-all flex items-center justify-center gap-2 text-sm ${
              queuedMedia.length > 0 && !isUploading
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:brightness-105'
                : 'bg-purple-200 text-purple-400 cursor-not-allowed'
            }`}
          >
            {isUploading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>
                  {uploadIndex
                    ? `Uploading ${uploadIndex.current} of ${uploadIndex.total}...`
                    : 'Compressing & Saving...'}
                </span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-white" />
                <span>
                  {queuedMedia.length > 1
                    ? `Save ${queuedMedia.length} Memories to Our Vault 💜`
                    : 'Save to Our Vault 💜'}
                </span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
