import { supabase } from '@/lib/supabase'

export async function getEducation(participantId: string) {
  const { data, error } = await supabase
    .from('participant_education')
    .select('*')
    .eq('participant_id', participantId)

  if (error) {
    throw error
  }

  return data
}