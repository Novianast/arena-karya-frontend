import { supabase } from '@/lib/supabase';

export async function getOrganizers(userId: string) {
    const { data, error } = await supabase
        .from("organizers")
        .select('*')
        .eq('user_id', userId)

    if (error) throw error;
    return data;
}