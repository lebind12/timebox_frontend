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
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high'
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high'
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      timeboxes: {
        Row: {
          id: string
          user_id: string
          todo_id: string | null
          date: string
          start_time: string
          duration_minutes: number
          title: string
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          todo_id?: string | null
          date: string
          start_time: string
          duration_minutes?: number
          title: string
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          todo_id?: string | null
          date?: string
          start_time?: string
          duration_minutes?: number
          title?: string
          is_completed?: boolean
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

export type Todo = Database['public']['Tables']['todos']['Row']
export type TodoInsert = Database['public']['Tables']['todos']['Insert']
export type TodoUpdate = Database['public']['Tables']['todos']['Update']

export type Timebox = Database['public']['Tables']['timeboxes']['Row']
export type TimeboxInsert = Database['public']['Tables']['timeboxes']['Insert']
export type TimeboxUpdate = Database['public']['Tables']['timeboxes']['Update']
