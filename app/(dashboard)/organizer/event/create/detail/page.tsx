"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEventForm } from "../EventFormContext";
import Toast from "@/components/ui/Toast";
import { Type, Image, FileText, CloudUpload, Settings } from "lucide-react";

interface PackageData {
  payment_id: number;
  package_id: number;
  status: string;
  packages: {
    package_name: string;
    max_competitions: number;
  } | null;
}

export default function OrganizerCreateEventDetailPage() {
  const router = useRouter();
  const { formData, setFormData } = useEventForm();

  // State Manajemen Data & UI
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("error");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string, type: "success" | "error" = "error") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  useEffect(() => {
    const fetchVerifiedPackages = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: orgData, error: orgError } = await supabase
          .from("organizers")
          .select("organizer_id")
          .eq("profile_id", user.id)
          .single();

        if (orgError || !orgData) return;

        const { data, error } = await supabase
          .from("package_payments")
          .select(`payment_id, package_id, status, packages (package_name, max_competitions)`)
          .eq("organizer_id", orgData.organizer_id)
          .eq("status", "verified");

        if (error) throw error;

        if (data && data.length > 0) {
          const uniquePackages = data.filter(
            (v, i, a) => a.findIndex((t) => t.package_id === v.package_id) === i
          ) as unknown as PackageData[];

          setPackages(uniquePackages);

          if (!formData.package_payment_id) {
            const defaultPkg = uniquePackages[0];
            setFormData({
              ...formData,
              package_payment_id: defaultPkg.payment_id,
              package_id: defaultPkg.package_id,
              packageName: defaultPkg.packages?.package_name || "MAHAKARYA",
            });
          }
        }
      } catch (err: any) {
        console.error("Gagal memuat paket terverifikasi:", err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerifiedPackages();
  }, []);

  // ================= HANDLER VALIDASI & NEXT PAGE =================
  const handleNextStep = () => {
    if (!formData.title.trim()) return triggerToast("Judul Event wajib diisi sebelum melanjutkan!");
    if (!formData.startDate || !formData.endDate) return triggerToast("Rentang tanggal event harus ditentukan!");
    if (new Date(formData.startDate) > new Date(formData.endDate)) return triggerToast("Tanggal mulai tidak boleh melebihi tanggal selesai!");
    if (!formData.locationDetail.trim()) return triggerToast("Detail lokasi event wajib diisi!");
    if (!formData.posterFile) return triggerToast("Anda wajib mengunggah poster event!");
    if (!formData.guidebookFile) return triggerToast("Anda wajib mengunggah file panduan teknis (PDF)!");

    router.push("/organizer/event/create/preview");
  };

  if (isLoading) {
    return <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">Memuat data paket Anda...</div>;
  }

  if (packages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
        <h3 className="text-sm font-bold text-gray-900 mb-1">Tidak Ada Paket Aktif</h3>
        <p className="text-[13px] text-gray-500 max-w-sm mx-auto">
          Akun Anda belum memiliki transaksi paket yang berstatus <strong>verified</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full font-sans text-gray-800 space-y-5 pb-10">
      <Toast message={toastMessage} type={toastType} show={showToast} />

      {/* ================= 1. BANNER PAKET BIRU ================= */}
      <div 
        className="relative w-full h-[100px] rounded-xl flex items-center justify-between px-10 shadow-sm bg-primary border border-[#1e4eb0]/50"
        style={{
          backgroundImage: "url('/images/bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        <div className="relative z-10 flex items-center gap-10">
          <img 
            src="/logo/arka_white.png" 
            alt="Logo Arena Karya" 
            className="h-6 w-auto object-contain drop-shadow-sm" 
          />
          <div className="flex flex-col items-start justify-center">
            <div className="flex items-baseline gap-2">
              <h2 className="text-white text-[24px] font-bold tracking-wide drop-shadow-sm leading-tight">
                Paket
              </h2>
              <h2 className="text-[#F4B400] text-[24px] font-bold tracking-wide drop-shadow-sm leading-tight">
                {formData.packageName?.toUpperCase() || "MAHAKARYA"}
              </h2>
            </div>
            <div className="relative mt-1">
              <button type="button" className="bg-white text-primary text-[16px] font-normal px-4 py-1.5 rounded shadow-sm hover:bg-gray-100 transition duration-200 leading-none">
                Ganti Paket
              </button>
              {packages.length > 1 && (
                <select
                  value={formData.package_id || ""}
                  onChange={(e) => {
                    const selectedId = Number(e.target.value);
                    const selected = packages.find((p) => p.package_id === selectedId);
                    if (selected) {
                      setFormData({
                        ...formData,
                        package_id: selected.package_id,
                        package_payment_id: selected.payment_id,
                        packageName: selected.packages?.package_name || "Karya",
                      });
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.package_id} value={pkg.package_id}>{pkg.packages?.package_name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-white rounded-md px-6 py-2 min-w-[120px] flex flex-col items-center justify-center shadow-sm">
          <span className="text-primary text-[12px] font-normal mb-0.5">Paket Tersisa</span>
          <span className="text-primary text-[24px] font-bold leading-none">1</span>
        </div>
      </div>

      {/* ================= 2. CARD JUDUL EVENT ================= */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <Type className="w-5 h-5 text-gray-700 mt-0.5" strokeWidth={2} />
          <div>
            <h3 className="font-bold text-[15px] text-gray-900">Judul Event</h3>
            <p className="text-[13px] text-gray-500 mt-1">Tuliskan Judul dan Deskripsi Event yang ingin dibuat</p>
          </div>
        </div>
        <div className="space-y-4 pl-8">
          <input
            type="text"
            placeholder="Title Event"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[14px] outline-none transition focus:border-blue-500 placeholder:text-gray-400 font-normal"
          />
          <textarea
            rows={4}
            placeholder="Deskripsi"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-[14px] outline-none transition focus:border-blue-500 placeholder:text-gray-400 resize-none font-normal"
          />
        </div>
      </div>

      {/* ================= 3. CARD POSTER EVENT ================= */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <Image className="w-5 h-5 text-gray-700 mt-0.5" strokeWidth={2} />
          <div>
            <h3 className="font-bold text-[15px] text-gray-900">Poster Event</h3>
            <p className="text-[13px] text-gray-500 mt-1">Upload Poster untuk Event</p>
          </div>
        </div>
        <div className="pl-8">
          <div className="relative border-2 border-dashed border-[#b3d4ff] rounded-xl p-10 flex flex-col items-center justify-center bg-white transition hover:bg-gray-50/50">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, posterFile: e.target.files?.[0] || null })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Ganti Ikon Awan disamakan untuk Poster ke Lucide CloudUpload */}
            <div className="bg-[#eef2ff] text-primary flex items-center justify-center w-14 h-14 rounded-xl mb-4">
              <CloudUpload className="w-7 h-7" strokeWidth={2} />
            </div>
            <p className="text-[14px] font-bold text-gray-800 mb-1">
              {formData.posterFile ? formData.posterFile.name : "Pilih atau Drag file untuk Upload"}
            </p>
            <p className="text-[12px] text-gray-400 mb-6">Disarankan PNG, JPG, JPEG, dengan aspect ratio 3:4</p>
            <button type="button" className="bg-primary text-white text-[13px] font-medium px-6 py-2 rounded-md pointer-events-none">
              Pilih File
            </button>
          </div>
        </div>
      </div>

      {/* ================= 4. CARD PANDUAN TEKNIS ================= */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-700 mt-0.5" strokeWidth={2} />
          <div>
            <h3 className="font-bold text-[15px] text-gray-900">Panduan Teknis</h3>
            <p className="text-[13px] text-gray-500 mt-1">Upload File Panduan Teknis Event</p>
          </div>
        </div>
        <div className="pl-8">
          <div className="relative border-2 border-dashed border-[#b3d4ff] rounded-xl p-10 flex flex-col items-center justify-center bg-white transition hover:bg-gray-50/50">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFormData({ ...formData, guidebookFile: e.target.files?.[0] || null })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Ganti Ikon Awan disamakan untuk Panduan ke Lucide CloudUpload */}
            <div className="bg-[#eef2ff] text-primary flex items-center justify-center w-14 h-14 rounded-xl mb-4">
              <CloudUpload className="w-7 h-7" strokeWidth={2} />
            </div>
            <p className="text-[14px] font-bold text-gray-800 mb-1">
              {formData.guidebookFile ? formData.guidebookFile.name : "Pilih atau Drag file untuk Upload"}
            </p>
            <p className="text-[12px] text-gray-400 mb-6">Disarankan PDF, maks ukuran 5MB</p>
            <button type="button" className="bg-primary text-white text-[13px] font-medium px-6 py-2 rounded-md pointer-events-none">
              Pilih File
            </button>
          </div>
        </div>
      </div>

      {/* ================= 5. CARD PENGATURAN EVENT ================= */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <Settings className="w-5 h-5 text-gray-700 mt-0.5" strokeWidth={2} />
          <div>
            <h3 className="font-bold text-[15px] text-gray-900">Pengaturan Event</h3>
            <p className="text-[13px] text-gray-500 mt-1">Atur Detail Penting Event</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 pl-8">
          
          {/* Kolom Kiri: Tanggal & Lokasi Dinamis */}
          <div className="space-y-6">
            <div>
              <label className="text-[14px] font-bold text-gray-800 block mb-1">Tanggal Event</label>
              <div className="flex gap-3 text-[13px] mt-2">
                <input type="date" value={formData?.startDate || ""} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="border rounded p-2" />
                <input type="date" value={formData?.endDate || ""} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="border rounded p-2" />
              </div>
            </div>

            <div>
              <label className="text-[14px] font-bold text-gray-800 block mb-1">Lokasi</label>
              <p className="text-[13px] text-gray-500 mb-3">Tempat berlangsungnya event</p>
              
              <div className="flex flex-col gap-2 mb-3">
                <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer font-normal">
                  <input type="radio" checked={formData?.locationType === "online"} onChange={() => setFormData({...formData, locationType: "online"})} className="w-3.5 h-3.5 accent-primary" /> Online
                </label>
                <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer font-normal">
                  <input type="radio" checked={formData?.locationType === "offline"} onChange={() => setFormData({...formData, locationType: "offline"})} className="w-3.5 h-3.5 accent-primary" /> Offline
                </label>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder={formData?.locationType === "online" ? "Link Meeting (Zoom/GMeet)" : "Detail Lokasi / Alamat"}
                  value={formData?.locationDetail || ""}
                  onChange={(e) => setFormData({...formData, locationDetail: e.target.value})}
                  className="w-full border border-gray-300 rounded-md pl-3 pr-24 py-2 text-[13px] outline-none"
                />
                <button 
                  type="button" 
                  onClick={() => {
                    if (formData?.locationDetail) {
                      window.open(
                        formData.locationType === "online" 
                          ? (formData.locationDetail.startsWith("http") ? formData.locationDetail : `https://${formData.locationDetail}`)
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.locationDetail)}`,
                        "_blank"
                      );
                    }
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary text-white text-[12px] font-normal px-3 py-1.5 rounded"
                >
                  {formData?.locationType === "online" ? "Buka Link" : "Buka di Maps"}
                </button>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Multi Competition */}
          <div>
            <label className="text-[14px] font-bold text-gray-800 block mb-1">Multi Competition</label>
            <p className="text-[13px] text-gray-500 mb-3">Memperbolehkan Peserta yang aktif mengikuti satu lomba untuk mengikuti lomba lainnya</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer font-normal">
                <input type="radio" checked={formData?.isMultiCompetition === true} onChange={() => setFormData({...formData, isMultiCompetition: true})} className="w-3.5 h-3.5 accent-primary" /> Ya
              </label>
              <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer font-normal">
                <input type="radio" checked={formData?.isMultiCompetition === false} onChange={() => setFormData({...formData, isMultiCompetition: false})} className="w-3.5 h-3.5 accent-primary" /> Tidak
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 6. TOMBOL ACTION BAWAH ================= */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-[#e5e7eb] hover:bg-gray-300 text-gray-700 text-[13px] font-bold px-8 py-2.5 rounded-lg transition"
        >
          Kembali
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          className="bg-primary hover:bg-blue-700 text-white text-[13px] font-bold px-8 py-2.5 rounded-lg transition"
        >
          Selanjutnya
        </button>
      </div>

    </div>
  );
}