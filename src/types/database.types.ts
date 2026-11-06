export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          email: string
          avatar_url: string | null
          bio: string | null
          account_type: 'user' | 'listener' | 'doctor' | 'admin'
          date_of_birth: string | null
          age_confirmed: boolean
          location: string | null
          phone: string | null
          is_verified: boolean
          is_active: boolean
          last_seen_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          email: string
          avatar_url?: string | null
          bio?: string | null
          account_type?: 'user' | 'listener' | 'doctor' | 'admin'
          date_of_birth?: string | null
          age_confirmed?: boolean
          location?: string | null
          phone?: string | null
          is_verified?: boolean
          is_active?: boolean
          last_seen_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          email?: string
          avatar_url?: string | null
          bio?: string | null
          account_type?: 'user' | 'listener' | 'doctor' | 'admin'
          date_of_birth?: string | null
          age_confirmed?: boolean
          location?: string | null
          phone?: string | null
          is_verified?: boolean
          is_active?: boolean
          last_seen_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          mood: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          mood?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          mood?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      mood_logs: {
        Row: {
          id: string
          user_id: string
          mood: string
          intensity: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mood: string
          intensity: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mood?: string
          intensity?: number
          notes?: string | null
          created_at?: string
        }
      }
      communities: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          member_count: number
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          member_count?: number
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          member_count?: number
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      listeners: {
        Row: {
          id: string
          user_id: string
          name: string
          specialties: string[]
          bio: string | null
          rating: number
          reviews_count: number
          availability: Json | null
          avatar_url: string | null
          professional_title: string | null
          qualifications: string[] | null
          license_number: string | null
          specialization: string[] | null
          years_of_experience: number | null
          education: string | null
          languages: string[] | null
          consultation_fee: number | null
          accepts_new_patients: boolean
          verification_status: 'pending' | 'verified' | 'rejected'
          verification_documents: string[] | null
          verified_at: string | null
          verified_by: string | null
          allow_messages: boolean
          is_doctor: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          specialties: string[]
          bio?: string | null
          rating?: number
          reviews_count?: number
          availability?: Json | null
          avatar_url?: string | null
          professional_title?: string | null
          qualifications?: string[] | null
          license_number?: string | null
          specialization?: string[] | null
          years_of_experience?: number | null
          education?: string | null
          languages?: string[] | null
          consultation_fee?: number | null
          accepts_new_patients?: boolean
          verification_status?: 'pending' | 'verified' | 'rejected'
          verification_documents?: string[] | null
          verified_at?: string | null
          verified_by?: string | null
          allow_messages?: boolean
          is_doctor?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          specialties?: string[]
          bio?: string | null
          rating?: number
          reviews_count?: number
          availability?: Json | null
          avatar_url?: string | null
          professional_title?: string | null
          qualifications?: string[] | null
          license_number?: string | null
          specialization?: string[] | null
          years_of_experience?: number | null
          education?: string | null
          languages?: string[] | null
          consultation_fee?: number | null
          accepts_new_patients?: boolean
          verification_status?: 'pending' | 'verified' | 'rejected'
          verification_documents?: string[] | null
          verified_at?: string | null
          verified_by?: string | null
          allow_messages?: boolean
          is_doctor?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          community_id: string | null
          title: string
          description: string | null
          event_date: string
          location: string | null
          attendee_count: number
          max_attendees: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id?: string | null
          title: string
          description?: string | null
          event_date: string
          location?: string | null
          attendee_count?: number
          max_attendees?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          community_id?: string | null
          title?: string
          description?: string | null
          event_date?: string
          location?: string | null
          attendee_count?: number
          max_attendees?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      connection_requests: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          user_id_1: string
          user_id_2: string
          connected_at: string
        }
        Insert: {
          id?: string
          user_id_1: string
          user_id_2: string
          connected_at?: string
        }
        Update: {
          id?: string
          user_id_1?: string
          user_id_2?: string
          connected_at?: string
        }
      }
      feed_posts: {
        Row: {
          id: string
          author_id: string
          content: string
          post_type: 'text' | 'poll' | 'article'
          visibility: 'public' | 'connections' | 'private'
          media_urls: string[] | null
          tags: string[] | null
          likes_count: number
          comments_count: number
          is_edited: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          post_type?: 'text' | 'poll' | 'article'
          visibility?: 'public' | 'connections' | 'private'
          media_urls?: string[] | null
          tags?: string[] | null
          likes_count?: number
          comments_count?: number
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          content?: string
          post_type?: 'text' | 'poll' | 'article'
          visibility?: 'public' | 'connections' | 'private'
          media_urls?: string[] | null
          tags?: string[] | null
          likes_count?: number
          comments_count?: number
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          participant_1_id: string
          participant_2_id: string
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          participant_1_id: string
          participant_2_id: string
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          participant_1_id?: string
          participant_2_id?: string
          last_message_at?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string | null
          message_type: 'text' | 'voice' | 'system'
          voice_url: string | null
          voice_duration: number | null
          is_read: boolean
          is_edited: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content?: string | null
          message_type?: 'text' | 'voice' | 'system'
          voice_url?: string | null
          voice_duration?: number | null
          is_read?: boolean
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string | null
          message_type?: 'text' | 'voice' | 'system'
          voice_url?: string | null
          voice_duration?: number | null
          is_read?: boolean
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      doctor_reviews: {
        Row: {
          id: string
          doctor_id: string
          reviewer_id: string
          booking_id: string | null
          rating: number
          comment: string | null
          is_verified_booking: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          reviewer_id: string
          booking_id?: string | null
          rating: number
          comment?: string | null
          is_verified_booking?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          reviewer_id?: string
          booking_id?: string | null
          rating?: number
          comment?: string | null
          is_verified_booking?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          reason?: string | null
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_id: string | null
          report_type: 'user' | 'post' | 'message' | 'community'
          entity_id: string
          reason: string
          description: string | null
          status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
          resolved_by: string | null
          resolved_at: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_id?: string | null
          report_type: 'user' | 'post' | 'message' | 'community'
          entity_id: string
          reason: string
          description?: string | null
          status?: 'pending' | 'investigating' | 'resolved' | 'dismissed'
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_id?: string | null
          report_type?: 'user' | 'post' | 'message' | 'community'
          entity_id?: string
          reason?: string
          description?: string | null
          status?: 'pending' | 'investigating' | 'resolved' | 'dismissed'
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          notification_type: 'connection_request' | 'connection_accepted' | 'message' | 'comment' | 'like' | 'mention' | 'review' | 'system'
          title: string
          message: string
          data: Json | null
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: 'connection_request' | 'connection_accepted' | 'message' | 'comment' | 'like' | 'mention' | 'review' | 'system'
          title: string
          message: string
          data?: Json | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: 'connection_request' | 'connection_accepted' | 'message' | 'comment' | 'like' | 'mention' | 'review' | 'system'
          title?: string
          message?: string
          data?: Json | null
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          parent_comment_id: string | null
          is_edited: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          parent_comment_id?: string | null
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          parent_comment_id?: string | null
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_users_connected: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      is_user_blocked: {
        Args: { blocker_user_id: string; blocked_user_id: string }
        Returns: boolean
      }
      get_connection_status: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
