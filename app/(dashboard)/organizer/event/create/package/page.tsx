"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ConfirmPopup from '@/components/ui/ConfirmPopup';
import PaymentModal from './PaymentModal';
import Toast from '@/components/ui/Toast';
import { Trophy, Flag, FileUp, Headphones, ArrowLeft } from 'lucide-react';

export default function OrganizerSelectPackagePage() {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ id: string; name: string; price: number } | null>(null);

  // State dinamis untuk menampung data dari Supabase
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [ownedCount, setOwnedCount] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToastMsg = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  useEffect(() => {
    const fetchDatabase = async () => {
      try {
        // 1. Ambil Data Master Paket dari Tabel 'packages'
        const { data: dbPackages, error: pkgError } = await supabase
          .from('packages')
          .select('*')
          .order('package_id', { ascending: true }); // Urutkan dari ID terkecil

        if (pkgError) throw pkgError;

        // Transformasi data database ke bentuk UI yang siap render beserta iconnya
        if (dbPackages) {
          const formattedPackages = dbPackages.map((dbPkg) => {
            const features = [
              { text: `Maksimal ${dbPkg.max_competitions} Jenis Lomba`, icon: <Trophy size={20} strokeWidth={1.5} className="text-[#1E62FF]" /> },
              { text: `Maksimal ${dbPkg.max_stages} Babak Lomba`, icon: <Flag size={20} strokeWidth={1.5} className="text-[#1E62FF]" /> },
            ];

            // Tentukan teks upload format sesuai string Enum di DB
            let uploadText = "Format Unggahan Bebas";
            if (dbPkg.upload_format === 'doc_img') uploadText = "Unggahan Dokumen & Gambar";
            if (dbPkg.upload_format === 'doc_img_vid') uploadText = "Unggahan Dokumen, Gambar & Tautan Video";
            features.push({ text: uploadText, icon: <FileUp size={20} strokeWidth={1.5} className="text-[#1E62FF]" /> });

            // Fitur khusus Mahakarya (Bisa dicek dari nama)
            if (dbPkg.package_name.toLowerCase() === 'mahakarya') {
              features.push({ text: "Prioritas Dukungan Teknis", icon: <Headphones size={20} strokeWidth={1.5} className="text-[#1E62FF]" /> });
            }

            return {
              id: dbPkg.package_id.toString(), // Jadikan string agar aman dilempar ke modal
              name: dbPkg.package_name,
              desc: dbPkg.description || `Pilihan paket ${dbPkg.package_name}`,
              price: Number(dbPkg.price), // Pastikan formatnya angka
              features: features,
              isIdeal: dbPkg.package_name.toLowerCase() === 'karya' // Hardcode penanda banner biru
            };
          });
          setPackagesList(formattedPackages);
        }

        // 2. Ambil Jumlah Kuota Paket Milik User dari Tabel 'package_payments'
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Ambil organizer_id milik user (profiles.id) yang sedang login
          const { data: organizer, error: orgError } = await supabase
            .from('organizers')
            .select('organizer_id')
            .eq('profile_id', user.id)
            .single();

          if (organizer && !orgError) {
            // Gunakan organizer_id untuk mencari payment yang sudah 'verified'
            const { data: payments, error: payError } = await supabase
              .from('package_payments')
              .select('package_id')
              .eq('organizer_id', organizer.organizer_id)
              .eq('status', 'verified'); // Filter status

            if (!payError && payments) {
              const counts: Record<string, number> = {};
              payments.forEach((row) => {
                const strId = row.package_id.toString();
                counts[strId] = (counts[strId] || 0) + 1;
              });
              setOwnedCount(counts);
            }
          } else {
             console.error("Organizer tidak ditemukan atau error:", orgError);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data dari Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatabase();
  }, []);

  const handleUsePackage = () => {
    router.push('/organizer/event/create/detail');
  };

  const handleOpenPayment = (pkg: { id: string; name: string; price: number }) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const handlePaymentUploaded = () => {
    setIsModalOpen(false);
    showToastMsg("Bukti pembayaran berhasil diunggah! Mohon tunggu verifikasi admin.", "success");
  };

  if (isLoading) {
    return <div className="w-full min-h-screen flex items-center justify-center text-gray-500">Memuat data paket...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-[#1E62FF] transition-colors cursor-pointer mb-8 w-fit group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-sans text-sm font-semibold">Kembali</span>
        </button>

        <div className="w-full rounded-[2rem] border border-gray-100 bg-white relative p-6 lg:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-gray-50 pb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Pilihan Paket</h1>
              <p className="text-base text-gray-500">Pilih atau beli paket untuk mulai membuat event baru</p>
            </div>
            
            {/* Lencana Kuota (UI Diperbarui) */}
            <div className="flex gap-3 mt-6 md:mt-0 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
              {packagesList.map((pkg) => (
                <div key={`badge-${pkg.id}`} className="bg-blue-50 border border-blue-100/50 rounded-2xl px-5 py-3 flex flex-col items-center justify-center min-w-[110px] transition-all hover:bg-blue-50">
                  <span className="text-[11px] text-primary font-bold mb-1 uppercase tracking-wider">{pkg.name}</span>
                  <span className="text-3xl font-black text-primary leading-none">
                    {ownedCount[pkg.id] || 0}
                  </span>
                  <span className="text-[10px] text-blue-400 mt-1 font-medium">Tersedia</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {packagesList.map((pkg) => {
              const hasQuota = (ownedCount[pkg.id] || 0) > 0;
              const isIdeal = pkg.isIdeal;

              return (
                <div 
                  key={pkg.id} 
                  className={`group relative bg-white rounded-3xl p-8 lg:p-10 flex flex-col border transition-all duration-300 ease-out ${
                    isIdeal 
                      ? 'border-blue-200 bg-gradient-to-b from-blue-50/30 to-white shadow-md shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/60 hover:-translate-y-2' 
                      : 'border-gray-100 hover:border-blue-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-2'
                  }`}
                >
                  {isIdeal && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-[#1E62FF] text-white text-[12px] font-bold px-6 py-1.5 rounded-full uppercase tracking-widest z-10 shadow-lg shadow-blue-500/30">
                      Pilihan Ideal
                    </div>
                  )}

                  <h3 className={`text-2xl font-bold mb-2 ${isIdeal ? 'text-[#1E62FF]' : 'text-gray-800'}`}>
                    {pkg.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-8 h-10 leading-relaxed">{pkg.desc}</p>
                  
                  <div className="mb-10">
                    <span className="text-sm font-semibold text-gray-400">Mulai dari</span>
                    <p className="text-[38px] lg:text-[42px] font-extrabold text-gray-900 tracking-tight mt-1">
                      <span className="text-2xl text-gray-400 font-medium mr-1">Rp</span>
                      {pkg.price.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <ul className="space-y-5 mb-10 flex-1">
                    {pkg.features.map((feat: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-4 text-[15px] text-gray-600">
                        <div className="shrink-0 mt-0.5 bg-blue-100 p-1.5 rounded-lg group-hover:scale-110 transition-transform duration-300">
                          {feat.icon}
                        </div>
                        <span className="leading-relaxed font-medium">{feat.text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6 border-t border-gray-50">
                    {hasQuota ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={handleUsePackage} 
                          className="bg-gradient-to-r from-[#1E62FF] to-blue-700 text-white rounded-xl py-3.5 text-[14px] font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 active:scale-95"
                        >
                          Gunakan
                        </button>
                        <button 
                          onClick={() => handleOpenPayment(pkg)} 
                          className="bg-white text-[#1E62FF] border border-[#1E62FF] rounded-xl py-3.5 text-[14px] font-bold hover:bg-blue-50 transition-colors active:scale-95"
                        >
                          Beli Lagi
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleOpenPayment(pkg)} 
                        className="w-full bg-gray-900 text-white rounded-xl py-4 text-[15px] font-bold hover:bg-[#1E62FF] hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 active:scale-95"
                      >
                        Beli Paket
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <PaymentModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          packageData={selectedPackage}
          onUploadSuccess={handlePaymentUploaded}
          onError={(msg) => showToastMsg(msg, "error")}
        />

        <Toast show={toast.show} message={toast.message} type={toast.type} />

        {isConfirmOpen && (
          <ConfirmPopup
            isOpen={isConfirmOpen}
            title="Konfirmasi Pengiriman"
            message="Apakah Anda yakin ingin melanjutkan proses transaksi ini?"
            onConfirm={() => setIsConfirmOpen(false)}
            onCancel={() => setIsConfirmOpen(false)}
          />
        )}
      </div>
    </div>
  );
}