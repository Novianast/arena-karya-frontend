export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string
  avatar_url?: string
}

export interface Participant {
  id: string
  user_id: string
  birth_date: string
  gender: string
  address: string
}

export interface ParticipantEducation {
  id: string
  participant_id: string
  school_name: string
  education_level: string
  major: string
  graduation_year: number
}