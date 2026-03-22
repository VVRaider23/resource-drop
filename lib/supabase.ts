import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Tag = 'design' | 'product' | 'tech' | 'career' | 'general'

export interface Resource {
  id: string
  title: string
  url: string
  tag: Tag
  submitted_by: string
  created_at: string
}
