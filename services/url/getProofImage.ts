import { supabase } from "@/lib/supabase";

/**
 * Mendapatkan Signed URL untuk bukti pembayaran
 * @param type 'entry_payments' | 'package_payments'
 * @param profileId ID profil pengunggah
 * @param proofImage Nama file atau path dari proof_image
 * @returns signed URL string atau null
 */
export async function getProofImageUrl(type: 'entry_payments' | 'package_payments', profileId: string, proofImage: string): Promise<string | null> {
  if (!proofImage || !profileId) return null;
  
  const fileNameOnly = proofImage.split('/').pop();
  
  try {
    const { data: signedData, error } = await supabase.storage
      .from('payment_proofs')
      .createSignedUrl(`${type}/${profileId}/${fileNameOnly}`, 60 * 60);

    if (error) {
      console.error(`Error getting signed URL for ${type}:`, error);
      return null;
    }

    return signedData?.signedUrl || null;
  } catch (err) {
    console.error("Error in getProofImage:", err);
    return null;
  }
}
