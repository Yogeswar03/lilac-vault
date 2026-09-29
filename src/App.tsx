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
import { BucketListModal } from './components/BucketListModal';
import { DemoSwitcherBar } from './components/DemoSwitcherBar';
import { BottomNavDock } from './components/BottomNavDock';
import { LavenderLogo } from './components/LavenderLogo';
import { Memory } from './types';

const MainAppContent: React.FC = () => {
  const { vault, currentUser, isLoading, startDemoMode, chatMessages, unreadChatCount, markChatAsRead, bucketList } = useVault();

  // Active Main View: 'gallery' or 'chat' (full page)
  const [activeView, setActiveView] = useState<'gallery' | 'chat'>('gallery');

  // Mark chat as read whenever chat view is active or new messages arrive while in chat
  React.useEffect(() => {
    if (activeView === 'chat') {
      markChatAsRead();
    }
  }, [activeView, chatMessages.length, markChatAsRead]);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReelOpen, setIsReelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'profiles' | 'pin'>('profiles');
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isCloudSettingsOpen, setIsCloudSettingsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isBucketListOpen, setIsBucketListOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const handleOpenProfile = (tab: 'profiles' | 'pin' = 'profiles') => {
    setProfileTab(tab);
    setIsProfileOpen(true);
  };

  const pendingBucketCount = bucketList.filter((b) => !b.isCompleted).length;

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
          onOpenProfile={() => handleOpenProfile('profiles')}
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
            onOpenProfile={handleOpenProfile}
            onOpenCloudSettings={() => setIsCloudSettingsOpen(true)}
            onOpenCamera={() => setIsCameraOpen(true)}
            onOpenBucketList={() => setIsBucketListOpen(true)}
          />

          <HeroBanner
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenReel={() => setIsReelOpen(true)}
            onOpenChat={() => setActiveView('chat')}
            onOpenProfile={handleOpenProfile}
            onOpenCamera={() => setIsCameraOpen(true)}
            onOpenBucketList={() => setIsBucketListOpen(true)}
          />

          <main className="flex-1">
            <GalleryGrid
              onSelectMemory={(mem) => setSelectedMemory(mem)}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenBucketList={() => setIsBucketListOpen(true)}
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

      <BucketListModal
        isOpen={isBucketListOpen}
        onClose={() => setIsBucketListOpen(false)}
      />

      <AIReelModal
        isOpen={isReelOpen}
        onClose={() => setIsReelOpen(false)}
      />

      <EditProfileModal
        isOpen={isProfileOpen}
        initialTab={profileTab}
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

      {/* Bottom Navigation Dock: Big Center Camera with Larger, Finger-Friendly Navigation Buttons */}
      {activeView === 'gallery' && (
        <BottomNavDock
          activeView={activeView}
          onChangeView={setActiveView}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenReel={() => setIsReelOpen(true)}
          onOpenCamera={() => setIsCameraOpen(true)}
          onOpenBucketList={() => setIsBucketListOpen(true)}
          bucketCount={pendingBucketCount}
          chatMessageCount={unreadChatCount}
        />
      )}

      {/* Floating Perspective / Demo Switcher Bar (Only in demo mode & gallery view) */}
      {activeView === 'gallery' && <DemoSwitcherBar onOpenHowItWorks={() => setIsHowItWorksOpen(true)} />}
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
