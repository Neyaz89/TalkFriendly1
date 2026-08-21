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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
