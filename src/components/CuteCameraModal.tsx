import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, RefreshCw, Trash2, Check, Sparkles, SwitchCamera, Film, Heart } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface CuteCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CameraFilter {
  id: string;
  name: string;
  emoji: string;
  cssFilter: string;
  overlay?: string;
  moodTag: string;
  suggestedCaption: string;
}

const CUTE_FILTERS: CameraFilter[] = [
  {
    id: 'none',
    name: 'Natural',
    emoji: '✨',
    cssFilter: 'none',
    moodTag: 'Pure Moments',
    suggestedCaption: 'Just us being cute today ✨',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    emoji: '🪻',
    cssFilter: 'contrast(106%) brightness(108%) saturate(120%) hue-rotate(275deg)',
    overlay: 'rgba(168, 85, 247, 0.12)',
    moodTag: 'Lavender Vibes',
    suggestedCaption: 'Lavender dream selfie with my favorite person 🪻',
  },
  {
    id: 'rosy',
    name: 'Rosy Glow',
    emoji: '🌸',
    cssFilter: 'contrast(105%) brightness(112%) saturate(125%) hue-rotate(345deg)',
    overlay: 'rgba(244, 114, 182, 0.14)',
    moodTag: 'Sweet Moments',
    suggestedCaption: 'Rosy cheeks & happy smiles 🌸',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    emoji: '☀️',
    cssFilter: 'contrast(110%) brightness(108%) saturate(135%) sepia(25%)',
    overlay: 'rgba(251, 191, 36, 0.12)',
    moodTag: 'Golden Hour Glow',
    suggestedCaption: 'Caught the golden hour light today ☀️✨',
  },
  {
    id: 'vintage',
    name: 'Vintage Film',
    emoji: '🎞️',
    cssFilter: 'contrast(115%) brightness(96%) sepia(35%) saturate(85%)',
    overlay: 'rgba(180, 83, 9, 0.08)',
    moodTag: 'Nostalgic Film',
    suggestedCaption: 'Retro polaroid memory 📸',
  },
  {
    id: 'pastel',
    name: 'Sweet Candy',
    emoji: '💖',
    cssFilter: 'contrast(98%) brightness(115%) saturate(135%) hue-rotate(315deg)',
    overlay: 'rgba(236, 72, 153, 0.12)',
    moodTag: 'Candy Pastel',
    suggestedCaption: 'Feeling cute today 💖',
  },
  {
    id: 'midnight',
    name: 'Moonlight',
    emoji: '🌙',
    cssFilter: 'contrast(112%) brightness(96%) saturate(95%) hue-rotate(185deg)',
    overlay: 'rgba(56, 189, 248, 0.10)',
    moodTag: 'Midnight Calm',
    suggestedCaption: 'Late night cozy moments 🌙',
  },
  {
    id: 'mocha',
    name: 'Cozy Mocha',
    emoji: '🧸',
    cssFilter: 'contrast(108%) brightness(102%) saturate(110%) sepia(30%)',
    overlay: 'rgba(120, 53, 15, 0.10)',
    moodTag: 'Cozy Cafe',
    suggestedCaption: 'Warm coffee vibes with you ☕🧸',
  },
  {
    id: 'mono',
    name: 'Chic Noir',
    emoji: '🖤',
    cssFilter: 'grayscale(100%) contrast(125%) brightness(105%)',
    moodTag: 'Timeless Monochrome',
    suggestedCaption: 'A timeless black & white memory 🖤',
  },
];

export const CuteCameraModal: React.FC<CuteCameraModalProps> = ({ isOpen, onClose }) => {
  const { uploadMemory, triggerSparkleExplosion, currentUser } = useVault();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [activeFilter, setActiveFilter] = useState<CameraFilter>(CUTE_FILTERS[1]); // Default to Lavender
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [caption, setCaption] = useState(CUTE_FILTERS[1].suggestedCaption);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start live camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1080 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Camera access was denied or is unavailable on this device. Please allow camera permissions.');
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen && !capturedPhotoUrl) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, capturedPhotoUrl, startCamera, stopCamera]);

  if (!isOpen) return null;

  // Toggle front vs back camera
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Change filter
  const handleSelectFilter = (filter: CameraFilter) => {
    setActiveFilter(filter);
    if (!capturedPhotoUrl) {
      setCaption(filter.suggestedCaption);
    }
  };

  // Snap the photo onto hidden canvas with filter baked in
  const handleCapture = () => {
    if (!videoRef.current) return;

    // Screen flash
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply mirror reflection if using front selfie camera
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // Apply CSS filter
    ctx.filter = activeFilter.cssFilter !== 'none' ? activeFilter.cssFilter : 'none';

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Apply color overlay if filter has one
    if (activeFilter.overlay) {
      ctx.filter = 'none';
      ctx.fillStyle = activeFilter.overlay;
      ctx.fillRect(0, 0, width, height);
    }

    // Convert canvas to blob & preview url
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setCapturedBlob(blob);
          setCapturedPhotoUrl(url);
          stopCamera();
        }
      },
      'image/webp',
      0.92
    );
  };

  // Retake / Delete captured selfie
  const handleRetakeOrDelete = () => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    startCamera();
  };

  // Save selfie to capsule memory gallery
  const handleSaveToCapsule = async () => {
    if (!capturedBlob) return;

    setIsSaving(true);
    try {
      const file = new File(
        [capturedBlob],
        `Selfie-${Date.now()}.webp`,
        { type: 'image/webp' }
      );

      await uploadMemory({
        file,
        caption: caption.trim() || activeFilter.suggestedCaption,
        tags: ['selfie', activeFilter.id, 'cute'],
        date: new Date().toISOString().split('T')[0],
        aiMood: activeFilter.moodTag,
      });

      triggerSparkleExplosion();
      onClose();

      // Reset
      setCapturedPhotoUrl(null);
      setCapturedBlob(null);
    } catch (err) {
      console.error('Failed to save selfie:', err);
      alert('Could not save selfie. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-lavender-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-purple-950 text-white rounded-3xl overflow-hidden shadow-2xl relative border border-purple-400/30 flex flex-col max-h-[95dvh]"
      >
        {/* Shutter Screen Flash Overlay */}
        <AnimatePresence>
          {isFlashActive && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Top Header Bar */}
        <div className="p-3.5 flex items-center justify-between z-20 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeFilter.emoji}</span>
            <div>
              <h3 className="text-sm font-bold font-cute leading-none text-white">
                Cute Selfie Camera
              </h3>
              <p className="text-[10px] text-purple-300">
                {capturedPhotoUrl ? 'Review & Save' : `${activeFilter.name} Filter`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!capturedPhotoUrl && (
              <button
                type="button"
                onClick={handleFlipCamera}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all shadow-xs"
                title="Flip Front / Back Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport: Live Stream OR Captured Photo */}
        <div className="relative aspect-[3/4] w-full bg-black overflow-hidden flex items-center justify-center select-none">
          {capturedPhotoUrl ? (
            /* Review Preview of Captured Snapshot */
            <div className="relative w-full h-full">
              <img
                src={capturedPhotoUrl}
                alt="Captured Selfie"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/20">
                <span>{activeFilter.emoji}</span>
                <span>{activeFilter.name}</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Error Fallback */
            <div className="p-6 text-center text-purple-200 space-y-3">
              <Camera className="w-12 h-12 text-purple-400 mx-auto opacity-70" />
              <p className="text-xs leading-relaxed max-w-xs mx-auto">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs shadow-cute"
              >
                Try Again
              </button>
            </div>
          ) : (
            /* Live Video Stream with Live Filter Preview */
            <div className="relative w-full h-full overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  filter: activeFilter.cssFilter,
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                }}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Tint Overlay if Filter Specifies */}
              {activeFilter.overlay && (
                <div
                  className="absolute inset-0 pointer-events-none transition-colors duration-300"
                  style={{ backgroundColor: activeFilter.overlay }}
                />
              )}

              {/* Subtle Live Mood Tag */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/20">
                <span>{activeFilter.emoji}</span>
                <span>{activeFilter.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Area: Either Filter Bar + Shutter OR Review Save/Delete Buttons */}
        <div className="p-3.5 sm:p-4 bg-purple-950/95 border-t border-purple-800/40 flex flex-col gap-3">
          {capturedPhotoUrl ? (
            /* REVIEW SCREEN: CAPTION INPUT + SAVE / DELETE OPTIONS */
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                  Add a Cute Caption:
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Caption this selfie..."
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-900/60 border border-purple-600/50 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs sm:text-sm font-medium"
                />
              </div>

              {/* Action Buttons: Delete / Retake vs Save */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetakeOrDelete}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-rose-900/40 text-rose-300 hover:text-white border border-rose-400/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  title="Discard this photo and retake"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Retake / Delete</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToCapsule}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-lavender-500 to-indigo-600 text-white font-bold text-xs shadow-cute hover:shadow-glow transition-all flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save to Capsule 🪻</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* LIVE CAMERA CONTROLS: FILTER CAROUSEL + SHUTTER BUTTON */
            <div className="space-y-3">
              {/* Filter Carousel Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
                {CUTE_FILTERS.map((f) => {
                  const isSelected = activeFilter.id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelectFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-cute scale-105 border border-purple-300'
                          : 'bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-700/50'
                      }`}
                    >
                      <span>{f.emoji}</span>
                      <span>{f.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Shutter Button Row */}
              <div className="flex items-center justify-center py-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={handleCapture}
                  className="relative p-1 rounded-full border-4 border-purple-300 shadow-cute-lg bg-transparent flex items-center justify-center group"
                  title="Snap Cute Selfie"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-lavender-200 via-white to-purple-200 shadow-cute flex items-center justify-center group-hover:brightness-110 transition-all">
                    <Sparkles className="w-6 h-6 text-purple-700" />
                  </div>
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
