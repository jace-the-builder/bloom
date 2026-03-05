import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Event = {
  id: string
  name: string
  date: string
  created_at: string
}

export type Flower = {
  id: string
  event_id: string
  contributor_name: string
  mantra: string
  flower_image_url: string
  bouquet_position_x: number
  bouquet_position_y: number
  bouquet_rotation: number
  stem_variant: number
  created_at: string
}

export async function getAllEvents(): Promise<Event[]> {
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getMostRecentEvent(): Promise<Event | null> {
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}
