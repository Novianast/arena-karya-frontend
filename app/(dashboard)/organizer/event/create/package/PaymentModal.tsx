"use client";

import React, { useState, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { X, CreditCard, Upload, Loader2, Image as ImageIcon, ArrowLeft } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: { id: string; name: string; price: number } | null;
  onUploadSuccess: (filePath: string, amount: number) => void;
  onError?: (message: string) => void;
}

export default function PaymentModal({ isOpen, onClose, packageData, onUploadSuccess, onError }: PaymentModalProps) {
  // State 1 = Detail Rekening, State 2 = Upload Bukti Bayar (Tugas Poin 6)
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  if (!isOpen || !packageData) return null;

  // Handler Pilih Gambar Bukti
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // Proses Upload ke Bucket & Insert ke Tabel (Tugas Poin 7 & 8)
  const handleUploadPayment = async () => {
    if (!file) {
      alert("Silakan pilih file bukti transfer terlebih dahulu!");
      return;
    }

    try {
      setUploading(true);

      // 1. Ambil data user/organizer yang sedang login
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
      }

      // Ambil data organizer (untuk mendapatkan integer organizer_id)
      const { data: orgData, error: orgError } = await supabase
        .from('organizers')
        .select('organizer_id')
        .eq('profile_id', user.id)
        .single();

      if (orgError || !orgData) {
        throw new Error("Data penyelenggara/organizer tidak ditemukan.");
      }

      const organizerIdInt = orgData.organizer_id;

      // 2. Siapkan format nama file sesuai Tugas Poin 7: {datenow()}.{ext}
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      // Path lengkap di bucket: package_payments/{profile_id}/{fileName}
      // RLS policy: auth.uid()::text = (storage.foldername(name))[2]
      // Jadi folder kedua harus profile_id (UUID user.id)
      const bucketPath = `package_payments/${user.id}/${fileName}`;

      // 3. Upload file fisik ke Bucket Supabase: payment_proofs
      const { error: storageError } = await supabase.storage
        .from('payment_proofs')
        .upload(bucketPath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        console.error("Gagal upload gambar:", storageError);
        throw new Error(`Gagal mengunggah gambar ke bucket Supabase: ${storageError.message}`);
      }

      // Generate order_id unik karena required NOT NULL di DB
      const orderId = `PKG-${user.id.substring(0, 8).toUpperCase()}-${Date.now()}`;

      // 4. Insert data transaksi ke tabel package_payments (Tugas Poin 8)
      const { error: insertError } = await supabase
        .from('package_payments')
        .insert({
          order_id: orderId,
          organizer_id: organizerIdInt,
          package_id: parseInt(packageData.id),
          amount: packageData.price,
          proof_image: bucketPath,
          profile_id: user.id,
          status: 'pending'
        });

      if (insertError) {
        console.error("Gagal insert database:", insertError);
        throw new Error(`Gagal menyimpan data transaksi ke database: ${insertError.message}`);
      }

      // 5. Jika sukses, picu callback sukses untuk memunculkan ConfirmPopup di halaman utama
      onUploadSuccess(bucketPath, packageData.price);
      
      // Reset state internal modal
      setFile(null);
      setPreviewUrl(null);
      setStep(1);

    } catch (error: any) {
      console.error("Error Transaksi:", error);
      const errorMessage = error.message || "Gagal memproses pembayaran.";
      if (onError) {
        onError(`Terjadi kesalahan: ${errorMessage}`);
      } else {
        alert(`Terjadi kesalahan: ${errorMessage}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setStep(1);
    setFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden relative border border-gray-100">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-50">
                <ArrowLeft size={16} />
              </button>
            )}
            <h3 className="font-bold text-gray-900 text-base">
              {step === 1 ? "Detail Pembayaran" : "Upload Bukti Transfer"}
            </h3>
          </div>
          <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Isi Konten Berdasarkan State (Step) */}
        <div className="p-6">
          
          {/* STATE 1: INFORMASI REKENING DUMMY */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Total Tagihan ({packageData.name})</span>
                <p className="text-2xl font-bold text-[#1E62FF] mt-1">
                  Rp {packageData.price.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rekening Tujuan Transfer:</p>
                
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Bank</span>
                    <span className="font-bold text-gray-800 flex items-center gap-1">
                      <CreditCard size={14} className="text-[#1E62FF]" /> Bank BCA
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Nomor Rekening</span>
                    <span className="font-mono font-bold text-gray-900 tracking-wider">1234 5678 90</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Atas Nama</span>
                    <span className="font-semibold text-gray-800">PT Arena Karya Nusantara</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-[#1E62FF] text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                Saya Sudah Transfer
              </button>
            </div>
          )}

          {/* STATE 2: UPLOAD BUKTI TRANSAKSI */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Pastikan struk transfer mencantumkan nominal sebesar <strong className="text-gray-700">Rp {packageData.price.toLocaleString('id-ID')}</strong> agar verifikasi lancar.
                </p>
              </div>

              {/* Wadah Upload File Gambar */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  id="proof-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                
                <label
                  htmlFor="proof-upload"
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[160px] ${
                    previewUrl ? 'border-blue-300 bg-blue-50/10' : 'border-gray-300 hover:border-[#1E62FF] bg-gray-50/50'
                  }`}
                >
                  {previewUrl ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      <img 
                        src={previewUrl} 
                        alt="Preview Bukti" 
                        className="max-h-28 object-contain rounded-lg shadow-sm border border-gray-100" 
                      />
                      <span className="text-[11px] text-gray-400 font-medium truncate max-w-[200px]">
                        {file?.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 text-[#1E62FF]">
                        <Upload size={20} />
                      </div>
                      <p className="text-xs font-bold text-gray-700 mt-1">Pilih Foto Bukti Transfer</p>
                      <p className="text-[10px] text-gray-400">Mendukung format PNG, JPG, atau JPEG</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Tombol Eksekusi Upload */}
              <button
                onClick={handleUploadPayment}
                disabled={uploading || !file}
                className="w-full bg-[#1E62FF] text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sedang Mengunggah...
                  </>
                ) : (
                  <>
                    <ImageIcon size={16} />
                    Kirim Bukti Pembayaran
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}