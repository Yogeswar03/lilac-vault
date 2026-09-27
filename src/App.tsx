import React, { useState } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { GalleryGrid } from './components/GalleryGrid';
import { MemoryLightbox } from './components/MemoryLightbox';
import { UploadModal } from './components/UploadModal';
import { AIReelModal } from './components/AIReelModal';
import { CapsuleChatModal } from './components/CapsuleChatModal';
import { EditProfileModal } from './components/EditProfileModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { OnboardingModal } from './components/OnboardingModal';
import { DemoSwitcherBar } from './components/DemoSwitcherBar';
import { LavenderLogo } from './components/LavenderLogo';
import { Memory } from './types';

const MainAppContent: React.FC = () => {
  const { vault, currentUser, isLoading, startDemoMode } = useVault();

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReelOpen, setIsReelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
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
        <OnboardingModal onOpenHowItWorks={() => setIsHowItWorksOpen(true)} />
        <HowItWorksModal
          isOpen={isHowItWorksOpen}
          onClose={() => setIsHowItWorksOpen(false)}
          onStartDemo={startDemoMode}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen sparkle-bg flex flex-col pb-20">
      {/* Top Navbar */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenReel={() => setIsReelOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Hero Banner with Days Counter & Vault Key */}
      <HeroBanner
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenReel={() => setIsReelOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Memory Gallery */}
      <main className="flex-1">
        <GalleryGrid
          onSelectMemory={(mem) => setSelectedMemory(mem)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
      </main>

      {/* Modals & Overlays */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <AIReelModal
        isOpen={isReelOpen}
        onClose={() => setIsReelOpen(false)}
      />

      <CapsuleChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
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

      {/* Bottom Floating Demo / Perspective Switcher */}
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
