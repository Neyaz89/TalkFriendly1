/**
 * Video Conferencing Service (Jitsi Meet)
 * 
 * Handles video meeting creation for appointments.
 * Using Jitsi Meet - completely free, open-source, no credit card required.
 */

import type {
  CreateMeetingResponse,
} from '@/types';

// ============================================================================
// Service Functions
// ============================================================================

export const videoService = {
  /**
   * Create a new video meeting for an appointment
   * Using Jitsi Meet - free, no API key needed!
   */
  async createMeeting(appointmentId: string): Promise<CreateMeetingResponse> {
    try {
      console.log('🎥 Creating Jitsi Meet room for appointment:', appointmentId);

      // Generate unique room name
      const roomName = `TalkFriendly-${appointmentId}-${Date.now()}`;
      
      // Jitsi Meet URL (using public instance - 100% free)
      const meetingUri = `https://meet.jit.si/${roomName}`;

      console.log('✅ Jitsi Meet room created:', meetingUri);

      return {
        space_name: roomName,
        meeting_uri: meetingUri,
        meeting_code: roomName,
      };
    } catch (error: any) {
      console.error('❌ Error creating video meeting:', error.message);
      
      // Jitsi is so simple it rarely fails, but just in case
      return this.generateMockMeetLink(appointmentId);
    }
  },

  /**
   * Create meeting with custom configuration
   */
  async createMeetingWithTokens(
    appointmentId: string,
    hostName: string,
    participantName: string
  ): Promise<{
    room_url: string;
    host_url: string;
    participant_url: string;
  }> {
    // Jitsi doesn't need separate tokens - first person to join becomes moderator
    const meeting = await this.createMeeting(appointmentId);
    
    return {
      room_url: meeting.meeting_uri,
      host_url: meeting.meeting_uri,
      participant_url: meeting.meeting_uri,
    };
  },

  /**
   * Generate mock meeting link (fallback)
   */
  generateMockMeetLink(appointmentId: string): CreateMeetingResponse {
    const part1 = Math.random().toString(36).substring(2, 5);
    const part2 = Math.random().toString(36).substring(2, 6);
    const part3 = Math.random().toString(36).substring(2, 5);
    const meetingCode = `${part1}-${part2}-${part3}`;
    
    return {
      space_name: `mock_${appointmentId}`,
      meeting_uri: `https://meet.jit.si/TalkFriendly-${meetingCode}`,
      meeting_code: meetingCode,
    };
  },

  /**
   * Test video service configuration
   */
  async testConfiguration(): Promise<{
    configured: boolean;
    errors: string[];
  }> {
    // Jitsi doesn't need configuration - it's always ready!
    return {
      configured: true,
      errors: [],
    };
  },
};

// Export for backward compatibility
export const googleMeetService = videoService;