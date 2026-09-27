import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Smartphone, Database, Film, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDemo?: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onStartDemo,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      icon: <Lock className="w-6 h-6 text-purple-600" />,
      title: '1. Strict 2-User Pairing Protocol',
      badge: 'Zero Noise, 100% Intimacy',
      description:
        'Unlike social networks designed for thousands of followers, LilacVault is architected with a strict 2-seat limit. The host creates the space and generates a 6-character Secret Key (e.g. LILAC-777). Once your bestie enters the key, the vault automatically shifts to LOCKED status. Any third party attempting to join is denied access.',
      bullets: [
        'Single-use pairing handshakes',
        'Strict 2-occupant state guard',
        'Private nicknames and custom lavender badges',
      ],
    },
    {
      icon: <Smartphone className="w-6 h-6 text-pink-600" />,
      title: '2. Mobile Camera Roll & Fast Compression',
      badge: 'Native Gallery Integration',
      description:
        'Tapping "+ Upload" triggers the native mobile file picker directly opening your iOS/Android Photo Library or Camera. To prevent multi-megabyte 4K phone photos from freezing the device, our client-side compression pipeline downsizes images into crisp WebP in under 200ms before saving.',
      bullets: [
        'Direct HTML5 accept="image/*,video/*" trigger',
        'Client-side Canvas WebP compressor (12MB -> 300KB)',
        'Full support for videos and photos',
      ],
    },
    {
      icon: <Database className="w-6 h-6 text-indigo-600" />,
      title: '3. Dual-Tier Storage Architecture',
      badge: 'IndexedDB + Cloud Sync',
      description:
        'Standard localStorage fails at 5MB (about 1 photo). We implemented an enterprise IndexedDB engine that stores hundreds of high-resolution photos and videos right on the device. For syncing two physical phones across cities, a clean Supabase / Firebase adapter is ready to connect with 1GB free S3 storage.',
      bullets: [
        'IndexedDB local sandbox (multi-gigabyte capacity)',
        'Zero monthly cloud fees required to use locally',
        'Modular cloud adapter ready for real-time remote sync',
      ],
    },
    {
      icon: <Film className="w-6 h-6 text-purple-600" />,
      title: '4. AI Cinematic Video Reel Maker',
      badge: 'In-Browser Video Engine',
      description:
        'Turns selected memories into a smooth, dreamy vertical video montage. Uses HTML5 Canvas with dynamic Ken Burns motion, soft lavender sparkles, custom title cards, and synthesizes a lofi chime soundtrack with the Web Audio API. You can preview and export the reel as a real .webm video with 1 click!',
      bullets: [
        'Smooth Ken Burns pan & zoom interpolation',
        'Floating pastel sparkles and Polaroid borders',
        'Synthesized Web Audio soundtrack + 1-click video download',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lavender-950/50 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl glass-card rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-lavender-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-lavender-100 text-purple-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Architecture & Showcase Tour</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-cute text-purple-950">
            How LilacVault Works
          </h2>
          <p className="text-xs sm:text-sm text-purple-700/80 mt-1 max-w-md mx-auto">
            A technical and architectural tour of the private 2-user memory capsule.
          </p>
        </div>

        {/* Step Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`p-3 rounded-2xl text-left border transition-all ${
                activeStep === idx
                  ? 'bg-purple-600 text-white shadow-cute border-purple-600'
                  : 'bg-white/70 text-purple-800 hover:bg-lavender-100 border-lavender-200'
              }`}
            >
              <div className="text-xs font-bold opacity-80">Step {idx + 1}</div>
              <div className="text-xs font-semibold truncate mt-0.5">
                {step.title.split('. ')[1]}
              </div>
            </button>
          ))}
        </div>

        {/* Active Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="p-5 rounded-2xl bg-lavender-50/70 border border-lavender-200 mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-white shadow-sm border border-lavender-200">
                {steps[activeStep].icon}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-purple-950 font-cute">
                  {steps[activeStep].title}
                </h3>
                <span className="inline-block text-[11px] font-bold text-purple-600 bg-purple-100/80 px-2 py-0.5 rounded-md">
                  {steps[activeStep].badge}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-purple-900/90 leading-relaxed mb-4">
              {steps[activeStep].description}
            </p>

            <div className="space-y-1.5 pt-2 border-t border-lavender-200">
              {steps[activeStep].bullets.map((bullet, bIdx) => (
                <div key={bIdx} className="flex items-center gap-2 text-xs font-medium text-purple-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-600 font-medium">
              Step {activeStep + 1} of {steps.length}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep((prev) => prev + 1)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            {onStartDemo && (
              <button
                onClick={() => {
                  onClose();
                  onStartDemo();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-cute transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch Interactive Demo</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
