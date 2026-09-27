import React from 'react';
import { motion } from 'framer-motion';
import { Images, PlusCircle, Camera, MessageCircle, Film, Sparkles } from 'lucide-react';

interface BottomNavDockProps {
  activeView: 'gallery' | 'chat';
  onChangeView: (view: 'gallery' | 'chat') => void;
  onOpenUpload: () => void;
  onOpenReel: () => void;
  onOpenCamera: () => void;
  chatMessageCount?: number;
}

export const BottomNavDock: React.FC<BottomNavDockProps> = ({
  activeView,
  onChangeView,
  onOpenUpload,
  onOpenReel,
  onOpenCamera,
  chatMessageCount = 0,
}) => {
  return (
    <nav
      aria-label="Main Navigation Dock"
      className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-[95vw] sm:max-w-lg px-2 select-none pointer-events-auto"
    >
      <div
        style={{ backgroundColor: '#180B2B' }}
        className="relative rounded-3xl p-2 shadow-2xl border-2 border-purple-400/60 shadow-purple-950/80 flex items-center justify-around gap-1 sm:gap-2"
      >
        {/* 1. Memories / Gallery View */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={() => onChangeView('gallery')}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-w-[54px] sm:min-w-[64px] ${
            activeView === 'gallery'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-cute border border-purple-300'
              : 'text-purple-100 hover:text-white bg-white/5 hover:bg-white/15'
          }`}
          title="Memories Gallery"
        >
          <Images className={`w-6 h-6 sm:w-7 sm:h-7 mb-0.5 ${activeView === 'gallery' ? 'text-white' : 'text-purple-200'}`} />
          <span className="text-[10px] sm:text-xs font-extrabold tracking-tight text-white">Memories</span>
        </motion.button>

        {/* 2. Add / Upload Photo */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={onOpenUpload}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-w-[54px] sm:min-w-[64px] text-purple-100 hover:text-white bg-white/5 hover:bg-white/15"
          title="Upload Memory (Photo / Video)"
        >
          <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 text-purple-200" />
          <span className="text-[10px] sm:text-xs font-extrabold tracking-tight text-white">Add Photo</span>
        </motion.button>

        {/* 3. CENTER: Big Cute Selfie Camera with Filters 📸 */}
        <div className="relative -mt-7 sm:-mt-9 flex flex-col items-center px-1">
          <motion.button
            whileHover={{ scale: 1.10 }}
            whileTap={{ scale: 0.90 }}
            type="button"
            onClick={onOpenCamera}
            className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-purple-600 via-lavender-500 to-indigo-600 text-white shadow-cute-lg flex items-center justify-center border-4 border-white ring-4 ring-purple-400/80 active:ring-purple-400 transition-all cursor-pointer group"
            title="Snap Cute Selfie with AR Face Filters 📸"
          >
            <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white transition-transform group-hover:scale-110 drop-shadow-sm" />

            {/* Sparkle ping dot */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-yellow-300 items-center justify-center text-[10px] text-purple-950 font-bold">
                ✨
              </span>
            </span>
          </motion.button>

          <span className="mt-1 text-[10px] sm:text-xs font-black text-yellow-300 uppercase tracking-wider drop-shadow-md">
            Camera
          </span>
        </div>

        {/* 4. Capsule Chat */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={() => onChangeView('chat')}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-w-[54px] sm:min-w-[64px] relative ${
            activeView === 'chat'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-cute border border-purple-300'
              : 'text-purple-100 hover:text-white bg-white/5 hover:bg-white/15'
          }`}
          title="Capsule Chat"
        >
          <div className="relative">
            <MessageCircle className={`w-6 h-6 sm:w-7 sm:h-7 mb-0.5 ${activeView === 'chat' ? 'text-white' : 'text-purple-200'}`} />
            {chatMessageCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black border border-white/60 shadow-xs animate-pulse">
                {chatMessageCount > 99 ? '99+' : chatMessageCount}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-extrabold tracking-tight text-white">Chat</span>
        </motion.button>

        {/* 5. AI Video Reel */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={onOpenReel}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all min-w-[54px] sm:min-w-[64px] text-purple-100 hover:text-white bg-white/5 hover:bg-white/15 relative group"
          title="AI Cinematic Video Reel"
        >
          <div className="relative">
            <Film className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 text-purple-200" />
            <Sparkles className="absolute -top-1 -right-2 w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <span className="text-[10px] sm:text-xs font-extrabold tracking-tight text-white">Reel</span>
        </motion.button>
      </div>
    </nav>
  );
};
