import { supabase } from "@/lib/supabase";

export const DEFAULT_POSTER = "/images/alea_ecta_est.png";

export const getPosterUrl = (
  poster: string | null | undefined,
  fallback: string = DEFAULT_POSTER
): string => {
  if (!poster) return fallback;
  
  if (poster.startsWith("/") || poster.startsWith("http")) return poster;
  
  const { data } = supabase.storage.from("events").getPublicUrl(`posters/${poster}`);
  
  return data.publicUrl;
};