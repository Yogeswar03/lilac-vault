import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Camera, Film, Sparkles, Tag, Calendar, Heart, Check } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { generateAICaptionSuggestion } from '../services/aiReelGenerator';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_TAGS = ['cafe', 'picnic', 'sunset', 'laugh', 'roadtrip', 'silly', 'boba', 'cozy'];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { uploadMemory, currentUser, folders, activeFolder } = useVault();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedFolder, setSelectedFolder] = useState<string>(() => (activeFolder !== 'All' ? activeFolder : 'General ✨'));
  const [isCustomFolder, setIsCustomFolder] = useState(false);
  const [customFolderName, setCustomFolderName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['cozy']);
  const [aiMood, setAiMood] = useState('Sweet Moments');
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Auto-trigger AI caption idea
      const ai = generateAICaptionSuggestion(selectedTags);
      if (!caption) {
        setCaption(ai.caption);
        setAiMood(ai.mood);
      }
    }
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
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const finalFolder = (isCustomFolder && customFolderName.trim())
        ? customFolderName.trim()
        : selectedFolder;

      await uploadMemory({
        file: selectedFile,
        caption: caption.trim() || 'A precious memory 🌸',
        tags: selectedTags,
        date,
        aiMood,
        folder: finalFolder,
      });
      onClose();
      // Reset
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setIsCustomFolder(false);
      setCustomFolderName('');
    } catch (err) {
      console.error(err);
      alert('Failed to upload memory. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lavender-950/50 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass-card rounded-3xl p-6 shadow-2xl relative border border-lavender-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-lavender-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentUser?.avatar || '🌸'}</span>
            <div>
              <h3 className="text-lg font-bold font-cute text-purple-950">Add a Memory</h3>
              <p className="text-xs text-purple-600">Uploading as {currentUser?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-lavender-100 text-purple-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* File Picker / Preview Box */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-44 rounded-2xl border-2 border-dashed border-lavender-300 hover:border-purple-500 bg-lavender-50/50 hover:bg-lavender-100/60 flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-cute flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-purple-900">
                  Tap to pick from Gallery or Camera
                </div>
                <div className="text-xs text-purple-600/80 mt-1">
                  Supports high-res mobile photos and video clips
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-lavender-300 max-h-56 flex items-center justify-center">
                {selectedFile?.type.startsWith('video') ? (
                  <video src={previewUrl} controls className="max-h-56 w-full object-contain" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="max-h-56 w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm hover:bg-black/80"
                >
                  Change
                </button>
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
                disabled={isGeneratingAI}
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
                placeholder="e.g. Cozy Sunset"
                className="w-full px-3 py-1.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/90 text-purple-950 text-xs font-medium"
              />
            </div>
          </div>

          {/* Folder Selection */}
          <div>
            <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1.5">
              Folder 📁
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
                  className="w-full px-3 py-2 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-950 text-xs font-medium"
                  required
                />
              </div>
            )}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className={`w-full py-3 rounded-2xl font-bold shadow-cute transition-all flex items-center justify-center gap-2 text-sm ${
              selectedFile && !isUploading
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:brightness-105'
                : 'bg-purple-200 text-purple-400 cursor-not-allowed'
            }`}
          >
            {isUploading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Compressing & Saving...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-white" />
                <span>Save to Our Vault 💜</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
