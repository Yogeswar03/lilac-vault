import { Memory, ReelSettings } from '../types';

export interface RenderProgress {
  currentSlide: number;
  totalSlides: number;
  percent: number;
  statusText: string;
}

// Generates cute dreamy ambient lofi chime chords using Web Audio API
export function createDreamyAudio(durationSeconds: number): {
  audioCtx: AudioContext;
  destinationNode: MediaStreamAudioDestinationNode;
  stop: () => void;
} {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const destinationNode = audioCtx.createMediaStreamDestination();

  // Master Gain
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.28, audioCtx.currentTime);
  masterGain.connect(destinationNode);
  masterGain.connect(audioCtx.destination); // Also audible during live preview

  // Dreamy chord frequencies: Cmaj9 -> Am9 -> Fmaj7 -> G6
  const chordNotes = [
    [261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9
    [220.00, 261.63, 329.63, 392.00, 493.88], // Am9
    [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj7
    [196.00, 246.94, 293.66, 392.00, 440.00], // G6
  ];

  const startTime = audioCtx.currentTime;
  const chordDuration = 3.5;
  const totalChords = Math.ceil(durationSeconds / chordDuration);

  for (let i = 0; i < totalChords; i++) {
    const chordTime = startTime + i * chordDuration;
    const notes = chordNotes[i % chordNotes.length];

    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();

      // Soft sine & gentle triangle for cozy lofi music-box chime
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, chordTime);

      // Gentle attack and soft warm decay
      const noteOffset = idx * 0.12; // Arpeggiated soft strum
      noteGain.gain.setValueAtTime(0.0001, chordTime + noteOffset);
      noteGain.gain.exponentialRampToValueAtTime(0.12 / (idx + 1), chordTime + noteOffset + 0.15);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, chordTime + chordDuration - 0.2);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(chordTime + noteOffset);
      osc.stop(chordTime + chordDuration);
    });
  }

  return {
    audioCtx,
    destinationNode,
    stop: () => {
      try {
        audioCtx.close();
      } catch {
        // Already closed
      }
    },
  };
}

// Preload HTML Image elements
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Create fallback colored placeholder canvas if image fails (e.g. CORS)
      const placeholder = document.createElement('canvas');
      placeholder.width = 600;
      placeholder.height = 800;
      const ctx = placeholder.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#E9D5FF';
        ctx.fillRect(0, 0, 600, 800);
        ctx.fillStyle = '#6B21A8';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ Lavender Memory ✨', 300, 400);
      }
      const fallbackImg = new Image();
      fallbackImg.src = placeholder.toDataURL();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = reject;
    };
  });
}

// Particle heart/sparkle class for video overlays
interface FloatingParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  opacity: number;
  emoji: string;
}

export class VideoReelRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private memories: Memory[];
  private settings: ReelSettings;
  private loadedImages: Map<string, HTMLImageElement> = new Map();
  private particles: FloatingParticle[] = [];
  private isCancelled = false;

  constructor(canvas: HTMLCanvasElement, memories: Memory[], settings: ReelSettings) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2d context');
    this.ctx = context;
    this.memories = memories;
    this.settings = settings;

    // Standard 9:16 Reel resolution
    this.canvas.width = 720;
    this.canvas.height = 1280;

    // Initialize floating hearts
    const emojis = ['💜', '🌸', '✨', '💖', '⭐'];
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: 16 + Math.random() * 16,
        speedY: 0.6 + Math.random() * 1.2,
        opacity: 0.4 + Math.random() * 0.5,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      });
    }
  }

  public cancel() {
    this.isCancelled = true;
  }

  public async preloadAll(): Promise<void> {
    for (const mem of this.memories) {
      if (mem.type === 'image') {
        const img = await preloadImage(mem.mediaUrl);
        this.loadedImages.set(mem.id, img);
      }
    }
  }

  // Draw floating particles
  private drawParticles() {
    this.ctx.save();
    for (const p of this.particles) {
      this.ctx.font = `${p.size}px sans-serif`;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillText(p.emoji, p.x, p.y);

      p.y -= p.speedY;
      if (p.y < -20) {
        p.y = this.canvas.height + 20;
        p.x = Math.random() * this.canvas.width;
      }
    }
    this.ctx.restore();
  }

  // Draw cute vignette border
  private drawVignette() {
    const { width, height } = this.canvas;
    const gradient = this.ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.35,
      width / 2,
      height / 2,
      width * 0.75
    );
    gradient.addColorStop(0, 'rgba(88, 28, 135, 0)');
    gradient.addColorStop(1, 'rgba(88, 28, 135, 0.4)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    // Cute border
    this.ctx.strokeStyle = 'rgba(233, 213, 255, 0.5)';
    this.ctx.lineWidth = 14;
    this.ctx.strokeRect(14, 14, width - 28, height - 28);
  }

  // Draw title intro slide
  private drawIntroSlide(progress: number) {
    const { width, height } = this.canvas;

    // Background gradient
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#581C87');
    bgGrad.addColorStop(0.5, '#7E22CE');
    bgGrad.addColorStop(1, '#9333EA');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, width, height);

    this.drawParticles();

    // Fade in and slight scale
    const alpha = Math.min(1, progress * 2.5);
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.textAlign = 'center';

    // Sparkle badge
    this.ctx.font = '52px sans-serif';
    this.ctx.fillText('🌸 💜 ✨', width / 2, height / 2 - 140);

    // Title
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 50px Quicksand, sans-serif';
    this.ctx.fillText(this.settings.title || 'Our Secret Memories', width / 2, height / 2 - 40);

    // Subtitle
    this.ctx.fillStyle = '#E9D5FF';
    this.ctx.font = '600 28px Nunito, sans-serif';
    this.ctx.fillText('Strictly for the two of us ✨', width / 2, height / 2 + 30);

    // Date
    this.ctx.font = '22px Nunito, sans-serif';
    this.ctx.fillStyle = '#DDD6FE';
    const dateStr = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    this.ctx.fillText(`Recorded in ${dateStr}`, width / 2, height / 2 + 90);

    this.ctx.restore();
    this.drawVignette();
  }

  // Draw slide with Ken Burns motion
  private drawImageSlide(memory: Memory, slideProgress: number) {
    const { width, height } = this.canvas;
    const img = this.loadedImages.get(memory.id);

    // Fill background with soft lavender
    this.ctx.fillStyle = '#2E1065';
    this.ctx.fillRect(0, 0, width, height);

    if (img) {
      this.ctx.save();

      // Ken Burns: smooth zoom from 1.0 to 1.15 and subtle pan
      const scale = 1.0 + slideProgress * 0.12;
      const panX = Math.sin(slideProgress * Math.PI) * 15;
      const panY = (slideProgress - 0.5) * 20;

      this.ctx.translate(width / 2 + panX, height / 2 + panY - 50);
      this.ctx.scale(scale, scale);

      // Center and cover image
      const imgAspect = img.width / img.height;
      const targetWidth = width * 0.92;
      const targetHeight = targetWidth / imgAspect;

      // Polaroid shadow
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      this.ctx.shadowBlur = 30;
      this.ctx.shadowOffsetY = 15;

      // Polaroid white border
      const pBorder = 14;
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(
        -targetWidth / 2 - pBorder,
        -targetHeight / 2 - pBorder,
        targetWidth + pBorder * 2,
        targetHeight + pBorder * 2 + 50
      );

      // Reset shadow
      this.ctx.shadowColor = 'transparent';

      // Draw the actual photo inside polaroid
      this.ctx.drawImage(img, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);

      this.ctx.restore();
    }

    this.drawParticles();
    this.drawVignette();

    // Cute Bottom Caption Card (Glass style)
    const cardY = height - 260;
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(30, 10, 60, 0.85)';
    this.ctx.beginPath();
    this.ctx.roundRect(40, cardY, width - 80, 190, 24);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(216, 180, 254, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Author & Tag
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#E9D5FF';
    this.ctx.font = 'bold 22px Nunito, sans-serif';
    this.ctx.fillText(`${memory.uploaderAvatar} ${memory.uploaderName}`, 70, cardY + 45);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#C4B5FD';
    this.ctx.font = '18px Nunito, sans-serif';
    this.ctx.fillText(memory.date, width - 70, cardY + 45);

    // Caption text (wrapped)
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '22px Quicksand, sans-serif';
    const caption = memory.caption || 'A precious memory 🌸';
    this.wrapText(caption, 70, cardY + 95, width - 140, 28);

    // AI Mood chip
    if (memory.aiMood) {
      this.ctx.fillStyle = '#A855F7';
      this.ctx.beginPath();
      this.ctx.roundRect(70, cardY + 140, 180, 28, 14);
      this.ctx.fill();
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 15px Nunito, sans-serif';
      this.ctx.fillText(`✨ ${memory.aiMood}`, 82, cardY + 160);
    }

    this.ctx.restore();
  }

  // Draw Outro Slide
  private drawOutroSlide(progress: number) {
    const { width, height } = this.canvas;
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#7E22CE');
    bgGrad.addColorStop(1, '#3B0764');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, width, height);

    this.drawParticles();

    const alpha = Math.min(1, progress * 2.5);
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.textAlign = 'center';

    this.ctx.font = '64px sans-serif';
    this.ctx.fillText('💜 ♾️ 🌸', width / 2, height / 2 - 100);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 44px Quicksand, sans-serif';
    this.ctx.fillText('To Many More Memories', width / 2, height / 2);

    this.ctx.fillStyle = '#DDD6FE';
    this.ctx.font = '24px Nunito, sans-serif';
    this.ctx.fillText('Created with LilacVault 💜', width / 2, height / 2 + 60);

    this.ctx.restore();
    this.drawVignette();
  }

  private wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
      if (lineCount >= 2) {
        line += '...';
        this.ctx.fillText(line, x, y);
        return;
      }
      const testLine = line + words[n] + ' ';
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        this.ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
        lineCount++;
      } else {
        line = testLine;
      }
    }
    if (lineCount < 2) {
      this.ctx.fillText(line, x, y);
    }
  }

  // Record and export as WebM video with Audio!
  public async renderVideo(onProgress?: (progress: RenderProgress) => void): Promise<Blob> {
    await this.preloadAll();
    this.isCancelled = false;

    const slideDuration = this.settings.durationPerSlide || 3.5;
    const totalMemories = this.memories.length;
    // Total slides = 1 (Intro) + totalMemories + 1 (Outro)
    const totalSlideCount = totalMemories + 2;
    const totalDurationSeconds = totalSlideCount * slideDuration;

    // Setup Audio
    const audio = createDreamyAudio(totalDurationSeconds);

    // Setup Canvas Stream & MediaRecorder
    const canvasStream = this.canvas.captureStream(30); // 30 FPS
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audio.destinationNode.stream.getAudioTracks(),
    ]);

    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 3000000, // 3Mbps crisp quality
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.start();

    // Animation Loop
    const fps = 30;
    const frameInterval = 1000 / fps;
    const totalFrames = totalDurationSeconds * fps;
    let currentFrame = 0;

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.isCancelled || currentFrame >= totalFrames) {
          clearInterval(interval);
          recorder.stop();
          audio.stop();

          recorder.onstop = () => {
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            resolve(videoBlob);
          };
          return;
        }

        const currentTimeSeconds = (currentFrame / fps);
        const slideIndex = Math.floor(currentTimeSeconds / slideDuration);
        const slideProgress = (currentTimeSeconds % slideDuration) / slideDuration;

        if (slideIndex === 0) {
          this.drawIntroSlide(slideProgress);
          onProgress?.({
            currentSlide: 1,
            totalSlides: totalSlideCount,
            percent: Math.round((currentFrame / totalFrames) * 100),
            statusText: 'Composing Intro Card... ✨',
          });
        } else if (slideIndex <= totalMemories) {
          const mem = this.memories[slideIndex - 1];
          this.drawImageSlide(mem, slideProgress);
          onProgress?.({
            currentSlide: slideIndex + 1,
            totalSlides: totalSlideCount,
            percent: Math.round((currentFrame / totalFrames) * 100),
            statusText: `Animating ${mem.uploaderName}'s memory... 🌸`,
          });
        } else {
          this.drawOutroSlide(slideProgress);
          onProgress?.({
            currentSlide: totalSlideCount,
            totalSlides: totalSlideCount,
            percent: Math.round((currentFrame / totalFrames) * 100),
            statusText: 'Wrapping with love & music... 💜',
          });
        }

        currentFrame++;
      }, frameInterval);
    });
  }
}

// AI Caption & Mood Generator Helper
export function generateAICaptionSuggestion(tags: string[]): { caption: string; mood: string } {
  const suggestions = [
    { caption: "Core memory unlocked with the best person in the universe ✨", mood: "Golden Nostalgia" },
    { caption: "Uncontrollable laughter, matcha lattes, and endless talks 🌸☕", mood: "Lofi Cafe Vibes" },
    { caption: "The kind of sunset you wish you could pause forever 🌅💜", mood: "Pastel Dream" },
    { caption: "Proof that we are completely incapable of taking a serious photo 😂📸", mood: "Playful Chaos" },
    { caption: "Best friendship in the world and nothing else comes close 💖", mood: "Eternal Warmth" },
    { caption: "Late night road trip and our favorite playlist on repeat 🚗🎶", mood: "Midnight Energy" },
  ];

  if (tags.includes('cafe') || tags.includes('food')) {
    return { caption: "Cafe runs and sweetest conversations with my favorite human 🍰✨", mood: "Cozy Gourmet" };
  }
  if (tags.includes('sunset') || tags.includes('picnic')) {
    return { caption: "Golden hour glow and pastel skies with you 🌅🌾", mood: "Pastel Sunset" };
  }

  return suggestions[Math.floor(Math.random() * suggestions.length)];
}
