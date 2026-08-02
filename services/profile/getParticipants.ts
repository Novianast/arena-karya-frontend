import { supabase } from '@/lib/supabase'

export async function getParticipants(userId: string) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    throw error
  }

  return data
}