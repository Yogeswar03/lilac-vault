import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VaultProvider, useVault } from './context/VaultContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { GalleryGrid } from './components/GalleryGrid';
import { MemoryLightbox } from './components/MemoryLightbox';
import { UploadModal } from './components/UploadModal';
import { AIReelModal } from './components/AIReelModal';
import { FullPageChat } from './components/FullPageChat';
import { EditProfileModal } from './components/EditProfileModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { OnboardingModal } from './components/OnboardingModal';
import { CloudSettingsModal } from './components/CloudSettingsModal';
import { CuteCameraModal } from './components/CuteCameraModal';
import { DemoSwitcherBar } from './components/DemoSwitcherBar';
import { LavenderLogo } from './components/LavenderLogo';
import { Camera } from 'lucide-react';
import { Memory } from './types';

const MainAppContent: React.FC = () => {
  const { vault, currentUser, isLoading, startDemoMode } = useVault();

  // Active Main View: 'gallery' or 'chat' (full page)
  const [activeView, setActiveView] = useState<'gallery' | 'chat'>('gallery');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReelOpen, setIsReelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isCloudSettingsOpen, setIsCloudSettingsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-lavender-50">
        <div className="animate-bounce mb-3">
          <LavenderLogo size={56} />
        </div>
        <p className="text-purple-900 font-bold font-cute text-sm">
          Opening Your Lavender Capsule... ✨
        </p>
      </div>
    );
  }

  // If no vault or no active user, show onboarding screen
  if (!vault || !currentUser) {
    return (
      <div className="min-h-screen sparkle-bg flex items-center justify-center p-4">
        <OnboardingModal
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          onOpenCloudSettings={() => setIsCloudSettingsOpen(true)}
        />
        <HowItWorksModal
          isOpen={isHowItWorksOpen}
          onClose={() => setIsHowItWorksOpen(false)}
          onStartDemo={startDemoMode}
        />
        <CloudSettingsModal
          isOpen={isCloudSettingsOpen}
          onClose={() => setIsCloudSettingsOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen sparkle-bg flex flex-col">
      {/* View 1: Full-Page Chat */}
      {activeView === 'chat' ? (
        <FullPageChat
          onBack={() => setActiveView('gallery')}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenReel={() => setIsReelOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenCamera={() => setIsCameraOpen(true)}
        />
      ) : (
        /* View 2: Memories Gallery & Hero */
        <div className="flex-1 flex flex-col pb-36">
          <Navbar
            activeView={activeView}
            onChangeView={setActiveView}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenReel={() => setIsReelOpen(true)}
            onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenCloudSettings={() => setIsCloudSettingsOpen(true)}
            onOpenCamera={() => setIsCameraOpen(true)}
          />

          <HeroBanner
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenReel={() => setIsReelOpen(true)}
            onOpenChat={() => setActiveView('chat')}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenCamera={() => setIsCameraOpen(true)}
          />

          <main className="flex-1">
            <GalleryGrid
              onSelectMemory={(mem) => setSelectedMemory(mem)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          </main>
        </div>
      )}

      {/* Global Modals (Accessible from both Gallery and Full-Page Chat) */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <CuteCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
      />

      <AIReelModal
        isOpen={isReelOpen}
        onClose={() => setIsReelOpen(false)}
      />

      <EditProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <MemoryLightbox
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onStartDemo={startDemoMode}
      />

      <CloudSettingsModal
        isOpen={isCloudSettingsOpen}
        onClose={() => setIsCloudSettingsOpen(false)}
      />

      {/* Big Prominent Bottom Floating Camera Button */}
      {activeView === 'gallery' && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsCameraOpen(true)}
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-purple-700 via-lavender-600 to-indigo-700 text-white shadow-cute-lg flex items-center justify-center border-4 border-white/95 ring-4 ring-purple-300/60 active:ring-purple-400 transition-all cursor-pointer group"
            title="Open Cute Selfie Camera 📸"
          >
            <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white transition-transform group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-yellow-300 items-center justify-center text-[10px] text-purple-950 font-bold">
                ✨
              </span>
            </span>
          </motion.button>
          <span className="mt-1 px-3 py-0.5 rounded-full bg-purple-950/85 backdrop-blur-md text-[11px] font-bold text-white shadow-cute border border-purple-400/30 tracking-wide">
            Selfie Camera 📸
          </span>
        </div>
      )}

      {/* Floating Perspective / Demo Switcher Bar */}
      <DemoSwitcherBar onOpenHowItWorks={() => setIsHowItWorksOpen(true)} />
    </div>
  );
};

export default function App() {
  return (
    <VaultProvider>
      <MainAppContent />
    </VaultProvider>
  );
}
