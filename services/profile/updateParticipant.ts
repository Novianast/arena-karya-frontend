import { supabase } from '@/lib/supabase'

interface UpdateParticipantPayload {
  birth_date: string
  gender: string
  address: string
}

export async function updateParticipant(
  participantId: string,
  payload: UpdateParticipantPayload
) {
  const { data, error } = await supabase
    .from('participants')
    .update(payload)
    .eq('id', participantId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}