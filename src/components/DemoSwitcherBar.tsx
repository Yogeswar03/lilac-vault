import React from 'react';
import { motion } from 'framer-motion';
import { Users, RotateCcw, Sparkles, Check, HelpCircle } from 'lucide-react';
import { useVault } from '../context/VaultContext';

export const DemoSwitcherBar: React.FC<{ onOpenHowItWorks: () => void }> = ({ onOpenHowItWorks }) => {
  const { vault, currentUser, switchActiveUser, isDemoMode, startDemoMode } = useVault();

  if (!vault || vault.users.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[94%] sm:w-auto px-4 py-2.5 rounded-full glass-card border border-purple-300 shadow-cute-lg flex items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-full bg-purple-100 text-purple-700">
          <Users className="w-3.5 h-3.5" />
        </span>
        <span className="font-bold text-purple-950 hidden sm:inline">
          {isDemoMode ? 'Showcase Switcher:' : 'Active Perspective:'}
        </span>
      </div>

      {/* Switcher Buttons */}
      <div className="flex items-center gap-1.5 bg-lavender-100/80 p-1 rounded-full border border-lavender-200">
        {vault.users.map((user) => {
          const isActive = currentUser?.id === user.id;
          return (
            <button
              key={user.id}
              onClick={() => switchActiveUser(user.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-cute scale-105'
                  : 'text-purple-700 hover:text-purple-950'
              }`}
            >
              <span>{user.avatar}</span>
              <span>{user.name.split(' ')[0]}</span>
              {isActive && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          );
        })}
      </div>

      {/* Reset or Help Tour */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenHowItWorks}
          className="p-1.5 rounded-full hover:bg-lavender-100 text-purple-700 transition-colors"
          title="See How it Works"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {isDemoMode && (
          <button
            onClick={() => {
              if (window.confirm('Reset demo back to sample memories?')) {
                startDemoMode();
              }
            }}
            className="p-1.5 rounded-full hover:bg-lavender-100 text-purple-700 transition-colors"
            title="Reset Demo Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
