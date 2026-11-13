/**
 * Meeting URL utilities
 * Validates and detects meeting platform from URLs
 */

export type MeetingProvider = 
  | 'google_meet' 
  | 'zoom' 
  | 'microsoft_teams' 
  | 'jitsi'
  | 'webex'
  | 'gotomeeting'
  | 'other';

export interface MeetingUrlValidation {
  isValid: boolean;
  provider: MeetingProvider | null;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Meeting provider patterns
 */
const PROVIDER_PATTERNS: Record<MeetingProvider, RegExp[]> = {
  google_meet: [
    /^https?:\/\/(meet\.google\.com|g\.co\/meet)/i,
  ],
  zoom: [
    /^https?:\/\/([a-z0-9-]+\.)?zoom\.us/i,
    /^https?:\/\/([a-z0-9-]+\.)?zoom\.com/i,
  ],
  microsoft_teams: [
    /^https?:\/\/teams\.microsoft\.com/i,
    /^https?:\/\/teams\.live\.com/i,
  ],
  jitsi: [
    /^https?:\/\/meet\.jit\.si/i,
    /^https?:\/\/([a-z0-9-]+\.)?jitsi\./i,
  ],
  webex: [
    /^https?:\/\/([a-z0-9-]+\.)?webex\.com/i,
  ],
  gotomeeting: [
    /^https?:\/\/([a-z0-9-]+\.)?gotomeeting\.com/i,
    /^https?:\/\/([a-z0-9-]+\.)?goto\.com/i,
  ],
  other: [], // Fallback for any other URL
};

/**
 * Provider display information
 */
export const PROVIDER_INFO: Record<MeetingProvider, { name: string; icon: string }> = {
  google_meet: { name: 'Google Meet', icon: '🎥' },
  zoom: { name: 'Zoom', icon: '📹' },
  microsoft_teams: { name: 'Microsoft Teams', icon: '💬' },
  jitsi: { name: 'Jitsi Meet', icon: '🎬' },
  webex: { name: 'Cisco Webex', icon: '📞' },
  gotomeeting: { name: 'GoToMeeting', icon: '🖥️' },
  other: { name: 'Video Meeting', icon: '🔗' },
};

/**
 * Detect meeting provider from URL
 */
export function detectMeetingProvider(url: string): MeetingProvider {
  const cleanUrl = url.trim().toLowerCase();

  for (const [provider, patterns] of Object.entries(PROVIDER_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(cleanUrl))) {
      return provider as MeetingProvider;
    }
  }

  return 'other';
}

/**
 * Validate and sanitize meeting URL
 */
export function validateMeetingUrl(url: string): MeetingUrlValidation {
  // Trim whitespace
  const trimmed = url.trim();

  // Check if empty
  if (!trimmed) {
    return {
      isValid: false,
      provider: null,
      error: 'Meeting URL is required',
    };
  }

  // Check if it's a valid URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch (error) {
    return {
      isValid: false,
      provider: null,
      error: 'Invalid URL format. Please enter a complete URL (e.g., https://meet.google.com/abc-defg-hij)',
    };
  }

  // Check protocol (must be http or https)
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      provider: null,
      error: 'URL must use http:// or https:// protocol',
    };
  }

  // Prefer HTTPS
  if (parsedUrl.protocol === 'http:') {
    parsedUrl.protocol = 'https:';
  }

  // Check for suspicious patterns (basic security)
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /on\w+=/i, // onclick=, onerror=, etc.
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(trimmed))) {
    return {
      isValid: false,
      provider: null,
      error: 'URL contains suspicious content',
    };
  }

  // Detect provider
  const provider = detectMeetingProvider(trimmed);

  // Return sanitized URL
  return {
    isValid: true,
    provider,
    sanitizedUrl: parsedUrl.toString(),
  };
}

/**
 * Format meeting URL for display (truncate if too long)
 */
export function formatMeetingUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;
  
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    const path = parsedUrl.pathname;
    
    if (domain.length + path.length <= maxLength) {
      return `${domain}${path}`;
    }
    
    return `${domain}${path.substring(0, maxLength - domain.length - 3)}...`;
  } catch (error) {
    return url.substring(0, maxLength - 3) + '...';
  }
}

/**
 * Generate meeting link for backward compatibility
 * (for appointments without custom URLs)
 */
export function generateJitsiUrl(appointmentId: string): string {
  const roomName = `TalkFriendly-${appointmentId}-${Date.now()}`;
  return `https://meet.jit.si/${roomName}`;
}

/**
 * Check if URL is a default generated Jitsi URL
 */
export function isGeneratedJitsiUrl(url: string): boolean {
  return /^https?:\/\/meet\.jit\.si\/TalkFriendly-/i.test(url);
}

/**
 * Get provider-specific join instructions
 */
export function getMeetingInstructions(provider: MeetingProvider): string {
  const instructions: Record<MeetingProvider, string> = {
    google_meet: 'Click to join the Google Meet video call. You may need to sign in with your Google account.',
    zoom: 'Click to join the Zoom meeting. You may be prompted to download the Zoom app or join via browser.',
    microsoft_teams: 'Click to join the Microsoft Teams meeting. You may need to sign in with your Microsoft account.',
    jitsi: 'Click to join the Jitsi video call. No account or download required.',
    webex: 'Click to join the Webex meeting. You may need to download the Webex app.',
    gotomeeting: 'Click to join the GoToMeeting session. You may need to download the app.',
    other: 'Click to join the video meeting.',
  };

  return instructions[provider];
}
