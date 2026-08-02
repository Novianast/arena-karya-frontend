import { supabase } from '@/lib/supabase'

interface UpdateEducationPayload {
  institution_name: string
  education_level: string
  province?: string
  regency?: string
  district?: string
  school_address?: string
}

export async function updateEducation(
  educationId: string,
  payload: UpdateEducationPayload
) {
  const { data, error } = await supabase
    .from('participant_education')
    .update(payload)
    .eq('id', educationId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}