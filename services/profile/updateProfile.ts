import { supabase } from '@/lib/supabase'

interface UpdateProfilePayload {
  username: string
  phone: string
  profile_image?: string
}

export async function updateProfile(
  userId: string,
  payload: UpdateProfilePayload
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}