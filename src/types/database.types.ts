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
