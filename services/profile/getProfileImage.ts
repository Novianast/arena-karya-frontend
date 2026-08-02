import { supabase } from '@/lib/supabase';

export const getProfileImageUrl = (fileName: string | null, role: string) => {
    if (!fileName) return "/images/default-avatar.png";
    if (fileName.startsWith("http") || fileName.startsWith("data:")) return fileName;
    
    const { data } = supabase.storage.from("profiles").getPublicUrl(`${role}/${fileName}`);
    return data.publicUrl;
};
