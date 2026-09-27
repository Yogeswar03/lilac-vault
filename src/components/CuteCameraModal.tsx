import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, RefreshCw, Trash2, Check, Sparkles, SwitchCamera, Crown, Palette } from 'lucide-react';
import { useVault } from '../context/VaultContext';

interface CuteCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ColorFilter {
  id: string;
  name: string;
  emoji: string;
  cssFilter: string;
  overlay?: string;
  moodTag: string;
  suggestedCaption: string;
}

interface FaceProp {
  id: string;
  name: string;
  emoji: string;
}

const COLOR_FILTERS: ColorFilter[] = [
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
    moodTag: 'Lavender Dream',
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

const FACE_PROPS: FaceProp[] = [
  { id: 'none', name: 'No Prop', emoji: '🚫' },
  { id: 'cat_ears', name: 'Cat Ears', emoji: '🐱' },
  { id: 'lavender_crown', name: 'Lavender Crown', emoji: '🪻' },
  { id: 'heart_blush', name: 'Heart Cheeks', emoji: '💕' },
  { id: 'angel_halo', name: 'Angel Halo', emoji: '😇' },
  { id: 'bunny_ears', name: 'Bunny Ears', emoji: '🐰' },
  { id: 'retro_shades', name: 'Star Shades', emoji: '🕶️' },
  { id: 'butterfly', name: 'Butterflies', emoji: '🦋' },
  { id: 'bear_ears', name: 'Teddy Bear', emoji: '🧸' },
  { id: 'sparkle_freckles', name: 'Star Freckles', emoji: '✨' },
];

// Returns SVG string for Face AR overlays
function getFacePropSvg(propId: string): string {
  switch (propId) {
    case 'cat_ears':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533" width="100%" height="100%">
        <!-- Left Cat Ear -->
        <polygon points="65,115 110,35 155,105" fill="#8B5CF6" stroke="#6D28D9" stroke-width="4" stroke-linejoin="round" />
        <polygon points="80,110 112,52 142,102" fill="#F472B6" />
        <!-- Right Cat Ear -->
        <polygon points="245,105 290,35 335,115" fill="#8B5CF6" stroke="#6D28D9" stroke-width="4" stroke-linejoin="round" />
        <polygon points="258,102 288,52 320,110" fill="#F472B6" />
        <!-- Soft Rosy Cheek Blush -->
        <ellipse cx="105" cy="305" rx="35" ry="18" fill="#F472B6" opacity="0.38" />
        <ellipse cx="295" cy="305" rx="35" ry="18" fill="#F472B6" opacity="0.38" />
        <!-- Whiskers Left -->
        <path d="M 45 295 Q 80 298 115 298 M 40 310 Q 78 312 115 312 M 45 325 Q 80 324 115 322" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.9" />
        <!-- Whiskers Right -->
        <path d="M 355 295 Q 320 298 285 298 M 360 310 Q 322 312 285 312 M 355 325 Q 320 324 285 322" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.9" />
        <!-- Pink Nose -->
        <polygon points="190,286 210,286 200,298" fill="#EC4899" />
      </svg>`;

    case 'lavender_crown':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533" width="100%" height="100%">
        <!-- Vine Arch -->
        <path d="M 65 140 Q 200 80 335 140" stroke="#16A34A" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.85" />
        <!-- Lavender Blossom Clusters -->
        <!-- Center-left -->
        <circle cx="160" cy="98" r="9" fill="#A855F7" />
        <circle cx="150" cy="92" r="8" fill="#C084FC" />
        <circle cx="170" cy="94" r="8" fill="#DDD6FE" />
        <circle cx="160" cy="85" r="7" fill="#8B5CF6" />
        <!-- Center -->
        <circle cx="200" cy="90" r="10" fill="#9333EA" />
        <circle cx="190" cy="82" r="8" fill="#C084FC" />
        <circle cx="210" cy="82" r="8" fill="#DDD6FE" />
        <circle cx="200" cy="74" r="7" fill="#A855F7" />
        <circle cx="200" cy="88" r="3.5" fill="#FEF08A" />
        <!-- Center-right -->
        <circle cx="240" cy="98" r="9" fill="#A855F7" />
        <circle cx="250" cy="92" r="8" fill="#C084FC" />
        <circle cx="230" cy="94" r="8" fill="#DDD6FE" />
        <circle cx="240" cy="85" r="7" fill="#8B5CF6" />
        <!-- Far left -->
        <circle cx="115" cy="115" r="8" fill="#9333EA" />
        <circle cx="105" cy="122" r="7" fill="#C084FC" />
        <circle cx="125" cy="118" r="7" fill="#DDD6FE" />
        <!-- Far right -->
        <circle cx="285" cy="115" r="8" fill="#9333EA" />
        <circle cx="295" cy="122" r="7" fill="#C084FC" />
        <circle cx="275" cy="118" r="7" fill="#DDD6FE" />
        <!-- Drifting Petals -->
        <ellipse cx="80" cy="65" rx="5" ry="8" fill="#C084FC" transform="rotate(-25 80 65)" opacity="0.8" />
        <ellipse cx="320" cy="75" rx="5" ry="8" fill="#DDD6FE" transform="rotate(25 320 75)" opacity="0.8" />
        <ellipse cx="195" cy="50" rx="4" ry="7" fill="#A855F7" transform="rotate(15 195 50)" opacity="0.9" />
      </svg>`;

    case 'heart_blush':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533" width="100%" height="100%">
        <!-- Soft Cheek Blush -->
        <ellipse cx="105" cy="305" rx="38" ry="20" fill="#FB7185" opacity="0.45" />
        <ellipse cx="295" cy="305" rx="38" ry="20" fill="#FB7185" opacity="0.45" />
        <!-- Left Cheek Hearts -->
        <path d="M 105 300 C 105 292 95 288 88 295 C 80 302 105 318 105 318 C 105 318 130 302 122 295 C 115 288 105 292 105 300 Z" fill="#F43F5E" opacity="0.9" />
        <path d="M 125 285 C 125 280 119 277 114 282 C 108 287 125 298 125 298 C 125 298 142 287 136 282 C 131 277 125 280 125 285 Z" fill="#FDA4AF" opacity="0.85" />
        <!-- Right Cheek Hearts -->
        <path d="M 295 300 C 295 292 285 288 278 295 C 270 302 295 318 295 318 C 295 318 320 302 312 295 C 305 288 295 292 295 300 Z" fill="#F43F5E" opacity="0.9" />
        <path d="M 275 285 C 275 280 269 277 264 282 C 258 287 275 298 275 298 C 275 298 292 287 286 282 C 281 277 275 280 275 285 Z" fill="#FDA4AF" opacity="0.85" />
        <!-- Floating Halo Hearts Above Head -->
        <path d="M 200 55 C 200 45 186 40 178 50 C 168 60 200 80 200 80 C 200 80 232 60 222 50 C 214 40 200 45 200 55 Z" fill="#FB7185" opacity="0.9" />
        <path d="M 140 70 C 140 62 128 58 122 66 C 114 74 140 90 140 90 C 140 90 166 74 158 66 C 152 58 140 62 140 70 Z" fill="#FDA4AF" opacity="0.8" />
        <path d="M 260 70 C 260 62 248 58 242 66 C 234 74 260 90 260 90 C 260 90 286 74 278 66 C 272 58 260 62 260 70 Z" fill="#FDA4AF" opacity="0.8" />
      </svg>`;

    case 'angel_halo':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533" width="100%" height="100%">
        <!-- Golden Glowing Angel Halo -->
        <ellipse cx="200" cy="55" rx="85" ry="22" stroke="#FBBF24" stroke-width="7" fill="none" opacity="0.95" />
        <ellipse cx="200" cy="53" rx="80" ry="18" stroke="#FEF08A" stroke-width="3" fill="none" opacity="0.9" />
        <!-- Halo Glow Aura -->
        <ellipse cx="200" cy="55" rx="92" ry="26" stroke="rgba(253, 224, 71, 0.4)" stroke-width="6" fill="none" />
        <!-- Star Sparkles on Forehead/Cheeks -->
        <!-- Center Sparkle -->
        <path d="M 200 135 Q 200 150 208 150 Q 200 150 200 165 Q 200 150 192 150 Q 200 150 200 135" fill="#FDE047" />
        <!-- Left Cheek Star -->
        <path d="M 100 290 Q 100 302 108 302 Q 100 302 100 314 Q 100 302 92 302 Q 100 302 100 290" fill="#FDE047" />
        <!-- Right Cheek Star -->
        <path d="M 300 290 Q 300 302 308 302 Q 300 302 300 314 Q 300 302 292 302 Q 300 302 300 290" fill="#FDE047" />
      </svg>`;

    case 'bunny_ears':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533" width="100%" height="100%">
        <!-- Left Bunny Ear -->
        <path d="M 95 145 C 80 15 130 15 135 145 Z" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="3.5" />
        <path d="M 102 135 C 92 40 122 40 126 135 Z" fill="#F472B6" opacity="0.85" />
        <!-- Right Bunny Ear -->
        <path d="M 265 145 C 270 15 320 15 305 145 Z" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="3.5" />
        <path d="M 274 135 C 278 40 308 40 298 135 Z" fill="#F472B6" opacity="0.85" />
        <!-- Soft Blush -->
        <ellipse cx="105" cy="305" rx="32" ry="18" fill="#F472B6" opacity="0.35" />
        <ellipse cx="295" cy="305" rx="32" ry="18" fill="#F472B6" opacity="0.35" />
        <!-- Pink Heart Nose -->
        <path d="M 200 286 C 200 280 192 277 187 282 C 180 288 200 298 200 298 C 200 298 220 288 213 282 C 208 277 200 280 200 286 Z" fill="#EC4899" />
        <!-- Bunny Whiskers -->
        <line x1="50" y1="298" x2="115" y2="304" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.9" />
        <line x1="45" y1="312" x2="115" y2="312" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.9" />
        <line x1="350" y1="298" x2="285" y2="304" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.9" />
        <line x1="355" y1="312" x2="285" y2="312" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.9" />
      </svg>`;

    case 'retro_shades':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533" width="100%" height="100%">
        <!-- Sunglasses Frame -->
        <!-- Left Lens -->
        <polygon points="120,225 155,235 150,268 115,268 85,245" fill="rgba(147, 51, 234, 0.85)" stroke="#7C3AED" stroke-width="4.5" stroke-linejoin="round" />
        <!-- Right Lens -->
        <polygon points="280,225 245,235 250,268 285,268 315,245" fill="rgba(147, 51, 234, 0.85)" stroke="#7C3AED" stroke-width="4.5" stroke-linejoin="round" />
        <!-- Bridge -->
        <path d="M 152 238 Q 200 230 248 238" stroke="#7C3AED" stroke-width="5" fill="none" stroke-linecap="round" />
        <!-- Star Glint on Left Lens -->
        <path d="M 105 240 Q 105 246 109 246 Q 105 246 105 252 Q 105 246 101 246 Q 105 246 105 240" fill="#FFFFFF" />
        <!-- Star Glint on Right Lens -->
        <path d="M 295 240 Q 295 246 299 246 Q 295 246 295 252 Q 295 246 291 246 Q 295 246 295 240" fill="#FFFFFF" />
      </svg>`;

    case 'butterfly':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533" width="100%" height="100%">
        <!-- Left Butterfly -->
        <g transform="translate(85, 100) rotate(-15)">
          <path d="M 0 0 C -25 -25 -30 10 0 5 C -25 15 -20 30 0 10" fill="#FDE047" stroke="#CA8A04" stroke-width="1.5" opacity="0.9" />
          <path d="M 0 0 C 25 -25 30 10 0 5 C 25 15 20 30 0 10" fill="#C084FC" stroke="#9333EA" stroke-width="1.5" opacity="0.9" />
          <line x1="0" y1="-8" x2="0" y2="12" stroke="#451A03" stroke-width="2" />
        </g>
        <!-- Right Butterfly -->
        <g transform="translate(315, 110) rotate(18)">
          <path d="M 0 0 C -25 -25 -30 10 0 5 C -25 15 -20 30 0 10" fill="#C084FC" stroke="#9333EA" stroke-width="1.5" opacity="0.9" />
          <path d="M 0 0 C 25 -25 30 10 0 5 C 25 15 20 30 0 10" fill="#FDE047" stroke="#CA8A04" stroke-width="1.5" opacity="0.9" />
          <line x1="0" y1="-8" x2="0" y2="12" stroke="#451A03" stroke-width="2" />
        </g>
        <!-- Center Tiny Butterfly -->
        <g transform="translate(200, 65) scale(0.7)">
          <path d="M 0 0 C -20 -20 -25 8 0 4 C -20 12 -16 25 0 8" fill="#FDE047" opacity="0.9" />
          <path d="M 0 0 C 20 -20 25 8 0 4 C 20 12 16 25 0 8" fill="#DDD6FE" opacity="0.9" />
        </g>
      </svg>`;

    case 'bear_ears':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533" width="100%" height="100%">
        <!-- Left Bear Ear -->
        <circle cx="95" cy="85" r="42" fill="#92400E" stroke="#78350F" stroke-width="3" />
        <circle cx="95" cy="85" r="26" fill="#FDE68A" />
        <!-- Right Bear Ear -->
        <circle cx="305" cy="85" r="42" fill="#92400E" stroke="#78350F" stroke-width="3" />
        <circle cx="305" cy="85" r="26" fill="#FDE68A" />
        <!-- Soft Peach Cheek Blush -->
        <ellipse cx="105" cy="305" rx="35" ry="18" fill="#FDBA74" opacity="0.45" />
        <ellipse cx="295" cy="305" rx="35" ry="18" fill="#FDBA74" opacity="0.45" />
        <!-- Bear Nose -->
        <ellipse cx="200" cy="288" rx="14" ry="10" fill="#451A03" />
      </svg>`;

    case 'sparkle_freckles':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 533" width="100%" height="100%">
        <!-- Star Freckles across cheeks and nose bridge -->
        <!-- Center nose -->
        <path d="M 200 278 Q 200 286 205 286 Q 200 286 200 294 Q 200 286 195 286 Q 200 286 200 278" fill="#FDE047" />
        <circle cx="185" cy="286" r="2.5" fill="#FFFFFF" opacity="0.9" />
        <circle cx="215" cy="286" r="2.5" fill="#FFFFFF" opacity="0.9" />
        <!-- Left Cheek Sparkles -->
        <path d="M 120 295 Q 120 304 126 304 Q 120 304 120 313 Q 120 304 114 304 Q 120 304 120 295" fill="#FDE047" />
        <circle cx="95" cy="305" r="3" fill="#FDE047" />
        <circle cx="140" cy="300" r="2" fill="#FFFFFF" />
        <circle cx="108" cy="318" r="2.5" fill="#DDD6FE" />
        <path d="M 85 285 Q 85 291 89 291 Q 85 291 85 297 Q 85 291 81 291 Q 85 291 85 285" fill="#FFFFFF" />
        <!-- Right Cheek Sparkles -->
        <path d="M 280 295 Q 280 304 286 304 Q 280 304 280 313 Q 280 304 274 304 Q 280 304 280 295" fill="#FDE047" />
        <circle cx="305" cy="305" r="3" fill="#FDE047" />
        <circle cx="260" cy="300" r="2" fill="#FFFFFF" />
        <circle cx="292" cy="318" r="2.5" fill="#DDD6FE" />
        <path d="M 315 285 Q 315 291 319 291 Q 315 291 315 297 Q 315 291 311 291 Q 315 291 315 285" fill="#FFFFFF" />
      </svg>`;

    default:
      return '';
  }
}

export const CuteCameraModal: React.FC<CuteCameraModalProps> = ({ isOpen, onClose }) => {
  const { uploadMemory, triggerSparkleExplosion } = useVault();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [activeTab, setActiveTab] = useState<'props' | 'colors'>('props'); // 'props' = Face filters, 'colors' = Lighting vibes
  const [activeColor, setActiveColor] = useState<ColorFilter>(COLOR_FILTERS[1]); // Default to Lavender
  const [activeProp, setActiveProp] = useState<FaceProp>(FACE_PROPS[1]); // Default to Cat Ears
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [caption, setCaption] = useState('Cute selfie with my favorite person 🪻✨');
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

  // Helper to draw Face Prop SVG onto canvas
  const drawFacePropToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!activeProp || activeProp.id === 'none') {
        resolve();
        return;
      }
      const svgString = getFacePropSvg(activeProp.id);
      if (!svgString) {
        resolve();
        return;
      }
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      img.src = url;
    });
  };

  // Snap the photo onto hidden canvas with both color filter & face prop baked in
  const handleCapture = async () => {
    if (!videoRef.current) return;

    // Screen flash animation
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

    // 1. If using front selfie camera, mirror horizontally for natural mirror selfie
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // 2. Apply CSS color filter
    ctx.filter = activeColor.cssFilter !== 'none' ? activeColor.cssFilter : 'none';

    // 3. Draw live video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Reset transform for overlays so they match screen coordinates
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 4. Apply color tint overlay if active
    if (activeColor.overlay) {
      ctx.filter = 'none';
      ctx.fillStyle = activeColor.overlay;
      ctx.fillRect(0, 0, width, height);
    }

    // 5. Draw Face Prop SVG overlay onto the canvas
    await drawFacePropToCanvas(ctx, width, height);

    // 6. Convert canvas to WebP Blob & preview URL
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

  // Retake / Discard captured selfie
  const handleRetakeOrDelete = () => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    startCamera();
  };

  // Save selfie directly to capsule memories
  const handleSaveToCapsule = async () => {
    if (!capturedBlob) return;

    setIsSaving(true);
    try {
      const file = new File(
        [capturedBlob],
        `Selfie-${Date.now()}.webp`,
        { type: 'image/webp' }
      );

      const propTag = activeProp.id !== 'none' ? activeProp.name.toLowerCase() : '';
      const tags = ['selfie', activeColor.id, propTag, 'cute'].filter(Boolean);

      await uploadMemory({
        file,
        caption: caption.trim() || activeColor.suggestedCaption,
        tags,
        date: new Date().toISOString().split('T')[0],
        aiMood: `${activeProp.emoji} ${activeColor.moodTag}`,
        folder: 'Cute Selfies 📸',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-lavender-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-purple-950 text-white rounded-3xl overflow-hidden shadow-2xl relative border border-purple-400/30 flex flex-col max-h-[96dvh]"
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
        <div className="p-3 sm:p-3.5 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeProp.id !== 'none' ? activeProp.emoji : activeColor.emoji}</span>
            <div>
              <h3 className="text-sm font-bold font-cute leading-none text-white flex items-center gap-1.5">
                <span>Cute AR Selfie Camera</span>
                <span className="text-xs">✨</span>
              </h3>
              <p className="text-[10px] text-purple-300">
                {capturedPhotoUrl ? 'Review & Save' : `${activeProp.name} • ${activeColor.name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!capturedPhotoUrl && (
              <button
                type="button"
                onClick={handleFlipCamera}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all shadow-xs"
                title="Flip Camera (Front / Back)"
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

        {/* Viewport: Live Stream with Face Prop Overlay OR Captured Photo */}
        <div className="relative aspect-[3/4] w-full bg-black overflow-hidden flex items-center justify-center select-none">
          {capturedPhotoUrl ? (
            /* Review Screen: Captured Snapshot */
            <div className="relative w-full h-full">
              <img
                src={capturedPhotoUrl}
                alt="Captured Selfie"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 border border-white/20 shadow-xs">
                <span>{activeProp.id !== 'none' ? activeProp.emoji : activeColor.emoji}</span>
                <span>{activeProp.name} • {activeColor.name}</span>
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
            /* Live Video Stream with Color Filter & Live Face AR Prop */
            <div className="relative w-full h-full overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  filter: activeColor.cssFilter,
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                }}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Tint Overlay if Color Filter specifies */}
              {activeColor.overlay && (
                <div
                  className="absolute inset-0 pointer-events-none transition-colors duration-300"
                  style={{ backgroundColor: activeColor.overlay }}
                />
              )}

              {/* Live Face AR Prop SVG Overlay */}
              {activeProp.id !== 'none' && (
                <div
                  className="absolute inset-0 pointer-events-none z-10 w-full h-full"
                  dangerouslySetInnerHTML={{ __html: getFacePropSvg(activeProp.id) }}
                />
              )}

              {/* Live Filter Indicator Pill */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/20">
                <span>{activeProp.emoji}</span>
                <span>{activeProp.name}</span>
                <span>•</span>
                <span>{activeColor.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls Area: Filter Switchers & Shutter OR Review Save/Retake */}
        <div className="p-3 sm:p-4 bg-purple-950/98 border-t border-purple-800/50 flex flex-col gap-2.5">
          {capturedPhotoUrl ? (
            /* REVIEW SCREEN: CAPTION INPUT + SAVE / RETAKE OPTIONS */
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                  Cute Selfie Caption:
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Caption this selfie..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-purple-900/60 border border-purple-600/50 text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs sm:text-sm font-medium"
                />
              </div>

              {/* Action Buttons: Retake / Delete vs Save to Capsule */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRetakeOrDelete}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-rose-900/40 text-rose-300 hover:text-white border border-rose-400/40 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  title="Discard selfie and retake"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Retake / Delete</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToCapsule}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-lavender-500 to-indigo-600 text-white font-bold text-xs shadow-cute hover:shadow-glow transition-all flex items-center justify-center gap-1.5 active:scale-95"
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
            /* LIVE CONTROLS: CATEGORY TABS (FACE PROPS vs COLOR GLOW) + SHUTTER */
            <div className="space-y-2.5">
              {/* Category Tab Switcher: Face Props 👑 vs Color Glow 🎨 */}
              <div className="flex p-0.5 bg-purple-900/80 rounded-2xl border border-purple-700/50 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('props')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'props'
                      ? 'bg-purple-600 text-white shadow-cute'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Face Filters ({FACE_PROPS.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('colors')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'colors'
                      ? 'bg-purple-600 text-white shadow-cute'
                      : 'text-purple-300 hover:text-white'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-purple-300" />
                  <span>Color Glow ({COLOR_FILTERS.length})</span>
                </button>
              </div>

              {/* Scrollable Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
                {activeTab === 'props'
                  ? /* Face Props Chips */
                    FACE_PROPS.map((prop) => {
                      const isSelected = activeProp.id === prop.id;
                      return (
                        <button
                          key={prop.id}
                          type="button"
                          onClick={() => setActiveProp(prop)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-cute scale-105 border border-purple-300'
                              : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50'
                          }`}
                        >
                          <span className="text-sm">{prop.emoji}</span>
                          <span>{prop.name}</span>
                        </button>
                      );
                    })
                  : /* Color Glow Chips */
                    COLOR_FILTERS.map((f) => {
                      const isSelected = activeColor.id === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setActiveColor(f);
                            setCaption(f.suggestedCaption);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-cute scale-105 border border-purple-300'
                              : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50'
                          }`}
                        >
                          <span className="text-sm">{f.emoji}</span>
                          <span>{f.name}</span>
                        </button>
                      );
                    })}
              </div>

              {/* Shutter Button Row */}
              <div className="flex items-center justify-center py-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.90 }}
                  onClick={handleCapture}
                  className="relative p-1.5 rounded-full border-4 border-purple-300 shadow-cute-lg bg-transparent flex items-center justify-center cursor-pointer group"
                  title="Snap Cute Selfie"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-lavender-100 via-white to-purple-200 shadow-cute flex items-center justify-center group-hover:brightness-110 transition-all">
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
