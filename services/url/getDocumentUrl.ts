import { supabase } from "@/lib/supabase";

export const getDocumentUrl = (
  fileName: string | null | undefined, 
  bucketName: 'events' | 'competitions'
): string => {
  // Return '#' jika tidak ada file
  if (!fileName) return "#";

  // Jika sudah berbentuk URL absolut atau root path
  if (fileName.startsWith("http") || fileName.startsWith("/")) return fileName;

  // Mengambil URL berdasarkan bucket yang dipilih
  const { data } = supabase.storage.from(bucketName).getPublicUrl(`guidebooks/${fileName}`);
  
  return data.publicUrl;
};