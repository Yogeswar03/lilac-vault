/**
 * Helper utility for sharing capsule invite links and auto-extracting codes.
 */

export function getInviteLink(code: string): string {
  if (typeof window === 'undefined') return '';
  const cleanCode = code.trim().toUpperCase();
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?join=${encodeURIComponent(cleanCode)}`;
}

/**
 * Extracts a clean uppercase 6+ character code from either raw text or full URL
 * e.g. "https://lilac-vault.vercel.app/?join=LILAC-777" -> "LILAC-777"
 * e.g. "lilac-777" -> "LILAC-777"
 */
export function extractCodeFromUrlOrInput(input: string): string {
  if (!input) return '';
  let str = input.trim();

  // If input looks like a URL or query parameter
  if (str.includes('http://') || str.includes('https://') || str.includes('?') || str.includes('&') || str.includes('#')) {
    try {
      // Normalise URL to parse search params
      const parsedUrl = new URL(str.startsWith('http') ? str : `https://example.com/${str.replace(/^\//, '')}`);
      const paramCode = parsedUrl.searchParams.get('join') || parsedUrl.searchParams.get('code');
      if (paramCode) {
        return paramCode.trim().toUpperCase();
      }

      // Check hash fragment
      if (parsedUrl.hash) {
        const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#\/?/, ''));
        const hashCandidate = hashParams.get('join') || hashParams.get('code');
        if (hashCandidate) {
          return hashCandidate.trim().toUpperCase();
        }
      }
    } catch {
      // Fallback regex if URL parse fails
      const match = str.match(/(?:join|code)=([A-Za-z0-9_-]+)/i);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
  }

  // Remove quotes, brackets, and whitespace
  return str.replace(/['"<>\s]/g, '').toUpperCase();
}

export interface ShareResult {
  status: 'shared' | 'copied' | 'cancelled' | 'error';
  link: string;
  message: string;
}

/**
 * Invokes native mobile Web Share sheet (WhatsApp, iMessage, etc.)
 * or seamlessly falls back to copying link to clipboard.
 */
export async function shareInviteLink(options: {
  code: string;
  vaultName?: string;
  hostName?: string;
}): Promise<ShareResult> {
  const link = getInviteLink(options.code);
  const title = options.vaultName ? `${options.vaultName} ✨` : 'LilacVault Private Capsule ✨';
  const text = options.hostName
    ? `Hey! Join my private memory capsule on LilacVault 🪻 Tap to pair instantly: ${link}`
    : `Join my private memory capsule on LilacVault ✨ Tap to pair instantly: ${link}`;

  // Check if Web Share API is available (iOS Safari, Android Chrome, etc.)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text,
        url: link,
      });
      return {
        status: 'shared',
        link,
        message: 'Invite link shared successfully! ✨',
      };
    } catch (err: unknown) {
      const isAbort = err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'));
      if (isAbort) {
        return {
          status: 'cancelled',
          link,
          message: 'Share cancelled',
        };
      }
      // If native share failed, proceed to clipboard copy fallback
    }
  }

  // Fallback: Copy direct to clipboard
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      return {
        status: 'copied',
        link,
        message: 'Invite link copied to clipboard! 📋 Send it to your friend to connect in 1 click.',
      };
    }
  } catch {
    // Clipboard failed
  }

  return {
    status: 'error',
    link,
    message: `Share this link with your friend: ${link}`,
  };
}

/**
 * Direct copy link to clipboard with fallback
 */
export async function copyInviteLink(code: string): Promise<boolean> {
  const link = getInviteLink(code);
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      return true;
    }
  } catch {
    // fallback
  }
  return false;
}
