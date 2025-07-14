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
          username: string | null
          full_name: string | null
          role: 'parent' | 'family' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          role?: 'parent' | 'family' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          role?: 'parent' | 'family' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      memories: {
        Row: {
          id: string
          title: string
          description: string | null
          memory_date: string
          created_by: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          memory_date: string
          created_by?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          memory_date?: string
          created_by?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      media_files: {
        Row: {
          id: string
          memory_id: string | null
          file_path: string
          file_type: 'image' | 'video' | null
          file_size: number | null
          thumbnail_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          memory_id?: string | null
          file_path: string
          file_type?: 'image' | 'video' | null
          file_size?: number | null
          thumbnail_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          memory_id?: string | null
          file_path?: string
          file_type?: 'image' | 'video' | null
          file_size?: number | null
          thumbnail_path?: string | null
          created_at?: string
        }
      }
      people: {
        Row: {
          id: string
          name: string
          birth_date: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          birth_date?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          birth_date?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      memory_people: {
        Row: {
          memory_id: string
          person_id: string
          created_at: string
        }
        Insert: {
          memory_id: string
          person_id: string
          created_at?: string
        }
        Update: {
          memory_id?: string
          person_id?: string
          created_at?: string
        }
      }
      memory_tags: {
        Row: {
          memory_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          memory_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          memory_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      albums: {
        Row: {
          id: string
          name: string
          description: string | null
          cover_image_id: string | null
          created_by: string | null
          is_public: boolean
          password_hash: string | null
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          cover_image_id?: string | null
          created_by?: string | null
          is_public?: boolean
          password_hash?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          cover_image_id?: string | null
          created_by?: string | null
          is_public?: boolean
          password_hash?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          resource_title: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          resource_title?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          resource_title?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      trash: {
        Row: {
          id: string
          resource_type: string
          resource_id: string
          original_data: Json
          deleted_by: string | null
          deleted_at: string
          permanent_delete_at: string
          restored: boolean
          restored_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resource_type: string
          resource_id: string
          original_data: Json
          deleted_by?: string | null
          deleted_at?: string
          permanent_delete_at?: string
          restored?: boolean
          restored_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resource_type?: string
          resource_id?: string
          original_data?: Json
          deleted_by?: string | null
          deleted_at?: string
          permanent_delete_at?: string
          restored?: boolean
          restored_at?: string | null
          created_at?: string
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
