import React from 'react';

interface LavenderLogoProps {
  size?: number;
  className?: string;
}

export const LavenderLogo: React.FC<LavenderLogoProps> = ({ size = 40, className = '' }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-2xl bg-gradient-to-tr from-purple-800 via-lavender-600 to-indigo-500 p-2 flex items-center justify-center shadow-cute text-white relative flex-shrink-0 ${className}`}
    >
      {/* Sleek Minimalist Botanical Lavender Emblem SVG */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-white"
      >
        {/* Main Stem */}
        <path
          d="M24 42V16"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-lavender-200"
        />
        {/* Left Leaves/Petals */}
        <ellipse cx="19" cy="30" rx="3.5" ry="2" transform="rotate(-30 19 30)" fill="#E9D5FF" />
        <ellipse cx="18" cy="23" rx="3.5" ry="2.2" transform="rotate(-35 18 23)" fill="#DDD6FE" />
        <ellipse cx="19" cy="16" rx="3" ry="2" transform="rotate(-40 19 16)" fill="#C4B5FD" />
        {/* Right Leaves/Petals */}
        <ellipse cx="29" cy="27" rx="3.5" ry="2" transform="rotate(30 29 27)" fill="#E9D5FF" />
        <ellipse cx="30" cy="20" rx="3.5" ry="2.2" transform="rotate(35 30 20)" fill="#DDD6FE" />
        <ellipse cx="29" cy="14" rx="3" ry="2" transform="rotate(40 29 14)" fill="#C4B5FD" />
        {/* Top Bud & Sparkles */}
        <circle cx="24" cy="9" r="2.8" fill="#FFFFFF" />
        <circle cx="34" cy="11" r="1.5" fill="#FDE047" className="animate-pulse" />
        <circle cx="14" cy="14" r="1.2" fill="#FDE047" />
      </svg>
    </div>
  );
};
