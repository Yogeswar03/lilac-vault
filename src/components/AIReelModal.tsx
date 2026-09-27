import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Film, Download, Play, Music, Check, RefreshCw, Eye } from 'lucide-react';
import { Memory, ReelSettings, ReelTheme } from '../types';
import { useVault } from '../context/VaultContext';
import { VideoReelRenderer, RenderProgress } from '../services/aiReelGenerator';

interface AIReelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIReelModal: React.FC<AIReelModalProps> = ({ isOpen, onClose }) => {
  const { memories, vault } = useVault();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Settings
  const [theme, setTheme] = useState<ReelTheme>('lavender-dream');
  const [reelTitle, setReelTitle] = useState('Our Secret Memories ✨');
  const [slideDuration, setSlideDuration] = useState(3.5);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    memories.filter((m) => m.type === 'image').slice(0, 6).map((m) => m.id)
  );

  // Render & Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<RenderProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const rendererRef = useRef<VideoReelRenderer | null>(null);

  if (!isOpen) return null;

  const imageMemories = memories.filter((m) => m.type === 'image');

  const toggleSelectMemory = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAutoSelect = () => {
    // Select top 5-6 loved memories
    const sorted = [...imageMemories].sort((a, b) => b.hearts.length - a.hearts.length);
    setSelectedIds(sorted.slice(0, 6).map((m) => m.id));
  };

  const handleExportVideo = async () => {
    if (!canvasRef.current) return;
    const chosenMemories = imageMemories.filter((m) => selectedIds.includes(m.id));
    if (chosenMemories.length === 0) {
      alert('Please select at least 1 photo for your video reel!');
      return;
    }

    setIsExporting(true);
    setDownloadUrl(null);
    setExportProgress({ currentSlide: 0, totalSlides: chosenMemories.length + 2, percent: 0, statusText: 'Preparing AI Reel...' });

    const settings: ReelSettings = {
      theme,
      title: reelTitle.trim() || 'Our Lavender Story',
      durationPerSlide: slideDuration,
      includeMusic: true,
      selectedMemoryIds: selectedIds,
    };

    const renderer = new VideoReelRenderer(canvasRef.current, chosenMemories, settings);
    rendererRef.current = renderer;

    try {
      const videoBlob = await renderer.renderVideo((progress) => {
        setExportProgress(progress);
      });

      const url = URL.createObjectURL(videoBlob);
      setDownloadUrl(url);

      // Trigger automatic download
      const a = document.createElement('a');
      a.href = url;
      a.download = `LilacReel-${Date.now()}.webm`;
      a.click();
    } catch (err) {
      console.error('Failed to generate video reel:', err);
      alert('Could not render video. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-lavender-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[92vh] glass-card rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col md:flex-row gap-6 border border-lavender-200 overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            rendererRef.current?.cancel();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-lavender-100 text-purple-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Reel Preview Canvas */}
        <div className="w-full md:w-5/12 flex flex-col items-center justify-center bg-lavender-900/90 rounded-2xl p-4 text-center relative overflow-hidden">
          <div className="text-xs text-lavender-200 font-bold mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Reel Canvas (9:16 Story Format)</span>
          </div>

          <div className="relative w-full max-w-[260px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-4 border-lavender-300/40 bg-black flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
            />

            {!isExporting && !downloadUrl && (
              <div className="absolute inset-0 bg-lavender-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white">
                <Film className="w-12 h-12 text-lavender-300 mb-2 animate-bounce" />
                <div className="font-bold text-sm font-cute">AI Video Reel Ready</div>
                <div className="text-[11px] text-lavender-300 mt-1 max-w-[180px]">
                  {selectedIds.length} photos selected • Lofi Chime Audio included
                </div>
              </div>
            )}
          </div>

          {/* Export Progress Display */}
          {isExporting && exportProgress && (
            <div className="mt-3 w-full max-w-[260px]">
              <div className="flex justify-between text-[11px] text-lavender-200 font-bold mb-1">
                <span>{exportProgress.statusText}</span>
                <span>{exportProgress.percent}%</span>
              </div>
              <div className="w-full bg-lavender-950 rounded-full h-2 overflow-hidden border border-lavender-400/30">
                <div
                  className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${exportProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {downloadUrl && (
            <div className="mt-3 w-full max-w-[260px]">
              <a
                href={downloadUrl}
                download="OurLavenderReel.webm"
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-cute hover:brightness-105 flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Re-download Video File</span>
              </a>
            </div>
          )}
        </div>

        {/* Right Side: Settings & Memory Picker */}
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xl font-bold font-cute text-purple-950">
                  AI Cinematic Video Reel Maker
                </h3>
                <p className="text-xs text-purple-600">
                  Creates Ken Burns video montages with floating sparkles and lofi music
                </p>
              </div>
            </div>

            {/* Title Card Input */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                Video Title
              </label>
              <input
                type="text"
                value={reelTitle}
                onChange={(e) => setReelTitle(e.target.value)}
                placeholder="e.g. Our Best Days Ever ✨"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-950 font-cute font-semibold"
              />
            </div>

            {/* Slide Duration */}
            <div className="mt-3">
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                Slide Transition Speed
              </label>
              <div className="flex gap-2">
                {[2.5, 3.5, 5.0].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSlideDuration(sec)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      slideDuration === sec
                        ? 'bg-purple-600 text-white shadow-cute'
                        : 'bg-lavender-100 text-purple-700 hover:bg-lavender-200'
                    }`}
                  >
                    {sec}s {sec === 3.5 ? '(Recommended)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Picker */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                  Select Photos ({selectedIds.length} chosen)
                </label>
                <button
                  type="button"
                  onClick={handleAutoSelect}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-950 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Curate Best</span>
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-lavender-200 rounded-2xl bg-lavender-50/50">
                {imageMemories.map((mem) => {
                  const isSelected = selectedIds.includes(mem.id);
                  return (
                    <div
                      key={mem.id}
                      onClick={() => toggleSelectMemory(mem.id)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        isSelected
                          ? 'border-purple-600 scale-95 shadow-cute'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={mem.mediaUrl}
                        alt={mem.caption}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Soundtrack Info */}
            <div className="mt-3 p-3 rounded-2xl bg-purple-50 border border-purple-100 flex items-center gap-2.5 text-xs text-purple-800">
              <div className="p-1.5 rounded-lg bg-white text-purple-600 shadow-sm">
                <Music className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-bold">Includes Lofi Chime Soundtrack</div>
                <div className="text-[11px] text-purple-600">
                  Synthesized chord progressions (Cmaj9 - Am9 - Fmaj7) embedded in video
                </div>
              </div>
            </div>
          </div>

          {/* Render Action Button */}
          <div className="pt-2">
            <button
              onClick={handleExportVideo}
              disabled={isExporting || selectedIds.length === 0}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-cute-lg transition-all flex items-center justify-center gap-2 ${
                !isExporting && selectedIds.length > 0
                  ? 'bg-gradient-to-r from-purple-600 via-lavender-600 to-pink-500 text-white hover:brightness-105 hover:shadow-glow'
                  : 'bg-purple-200 text-purple-400 cursor-not-allowed'
              }`}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Video Reel...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>Generate & Download Video Reel 🌸</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
