"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEventForm } from "../EventFormContext";
import Toast from "@/components/ui/Toast";
import ConfirmPopup from "@/components/ui/ConfirmPopup";
import { Type, Image, FileText, Settings } from "lucide-react";
import PosterModal from "@/components/ui/PosterModal";

export default function OrganizerCreateEventPreviewPage() {
  const router = useRouter();
  const { formData, resetForm } = useEventForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("error");
  const [showToast, setShowToast] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string>("");

  useEffect(() => {
    if (isSuccess) return;

    if (!formData.title) {
      router.replace("/organizer/event/create/detail");
      return;
    }
    if (formData.posterFile) {
      setPosterUrl(URL.createObjectURL(formData.posterFile));
    }
  }, [formData, router, isSuccess]);

  const triggerToast = (msg: string, type: "success" | "error" = "error") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirm(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login Anda kedaluwarsa!");

      const { data: orgData, error: orgError } = await supabase
        .from("organizers")
        .select("organizer_id")
        .eq("profile_id", user.id)
        .single();

      if (orgError || !orgData) throw new Error("Data organizer tidak ditemukan.");

      const eventUniqueId = `ev_${Date.now()}`;
      const posterExt = formData.posterFile?.name.split(".").pop() || "png";
      const posterFileName = `poster_${eventUniqueId}.${posterExt}`;
      const guideExt = formData.guidebookFile?.name.split(".").pop() || "pdf";
      const guidebookFileName = `guidebook_${eventUniqueId}.${guideExt}`;

      if (formData.posterFile) {
        const { error: uploadPosterErr } = await supabase.storage
          .from("events")
          .upload(`posters/${posterFileName}`, formData.posterFile, { cacheControl: "3600", upsert: true });

        if (uploadPosterErr) throw new Error(`Gagal upload poster: ${uploadPosterErr.message}`);
      }

      if (formData.guidebookFile) {
        const { error: uploadGuideErr } = await supabase.storage
          .from("events")
          .upload(`guidenbooks/${guidebookFileName}`, formData.guidebookFile, { cacheControl: "3600", upsert: true });

        if (uploadGuideErr) throw new Error(`Gagal upload panduan teknis: ${uploadGuideErr.message}`);
      }

      const currentYear = new Date().getFullYear();
      const { error: insertError } = await supabase
        .from("events")
        .insert({
          organizer_id: orgData.organizer_id,
          package_payment_id: formData.package_payment_id,
          event_name: formData.title,
          year: currentYear,
          description: formData.description || null,
          start_date: formData.startDate,
          end_date: formData.endDate,
          location: formData.locationDetail,
          allow_multi_comp: formData.isMultiCompetition,
          poster: posterFileName,
          event_guidebook: guidebookFileName,
          status: "draft",
          is_published: false,
        });

      if (insertError) throw new Error(`Gagal menyimpan data event: ${insertError.message}`);

      const { error: updatePaymentErr } = await supabase
        .from("package_payments")
        .update({ status: "used" })
        .eq("payment_id", formData.package_payment_id);

      if (updatePaymentErr) throw new Error(`Gagal mengonfirmasi penggunaan paket: ${updatePaymentErr.message}`);

      triggerToast("Selamat! Event Anda berhasil dibuat sebagai Draft.", "success");
      setIsSuccess(true);
      resetForm();

      setTimeout(() => {
        router.push("/organizer/event");
      }, 2000);

    } catch (err: any) {
      triggerToast(err.message || "Terjadi kesalahan sistem, coba lagi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full font-sans text-gray-800 space-y-5 pb-10">
      <Toast message={toastMessage} type={toastType} show={showToast} />

      <ConfirmPopup
        isOpen={showConfirm}
        title={`Apakah Anda Yakin Ingin Membuat Event\n${formData.title.toUpperCase()} ?`}
        message="Event yang sudah dibuat tidak dapat diedit kembali. Pastikan data sudah benar sebelum event dibuat."
        onConfirm={handleFinalSubmit}
        onCancel={() => setShowConfirm(false)}
      />

      {/* ================= 1. CARD JUDUL EVENT ================= */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          {/* Ganti SVG ke Lucide Type disamakan dengan detail */}
          <Type className="w-5 h-5 text-gray-700 mt-0.5" strokeWidth={2} />
          <div>
            <h3 className="font-bold text-[15px] text-gray-900">Judul Event</h3>
            <p className="text-[13px] text-gray-500 mt-1">Review Judul dan Deskripsi Event yang akan dibuat</p>
          </div>
        </div>
        <div className="space-y-4 pl-8">
          <div>
            <p className="text-[12px] text-gray-500 mb-1">Judul Event</p>
            <h1 className="text-[18px] font-bold text-gray-900">{formData.title}</h1>
          </div>
          {formData.description && (
            <div>
              <p className="text-[12px] text-gray-500 mb-1">Deskripsi Event</p>
              <div className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3 text-[14px] text-gray-700 leading-relaxed font-normal">
                {formData.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= 2. CARD POSTER EVENT ================= */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          {/* Ganti SVG ke Lucide Image disamakan dengan detail */}
          <Image className="w-5 h-5 text-gray-700 mt-0.5" strokeWidth={2} />
          <div>
            <h3 className="font-bold text-[15px] text-gray-900">Poster Event</h3>
            <p className="text-[13px] text-gray-500 mt-1">Review Poster untuk Event</p>
          </div>
        </div>
        <div className="pl-8">
          <div className="relative rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center overflow-hidden h-[400px] w-full">
            {posterUrl ? (
              <PosterModal src={posterUrl} alt={formData.title} />
            ) : (
              <div className="py-20 text-[13px] text-gray-400 font-medium">Tidak ada poster yang diunggah</div>
            )}
          </div>
        </div>
      </div>

      {/* ================= 3. CARD PANDUAN TEKNIS ================= */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          {/* Ganti SVG ke Lucide FileText disamakan dengan detail */}
          <FileText className="w-5 h-5 text-gray-700 mt-0.5" strokeWidth={2} />
          <div>
            <h3 className="font-bold text-[15px] text-gray-900">Panduan Teknis</h3>
            <p className="text-[13px] text-gray-500 mt-1">Review File Panduan Teknis Event</p>
          </div>
        </div>
        <div className="pl-8">
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#eef2ff] text-primary font-bold text-[12px] px-3 py-2 rounded-lg">PDF</div>
              <div>
                <p className="text-[14px] font-bold text-gray-800">{formData.guidebookFile?.name || "Panduan_Teknis.pdf"}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  {formData.guidebookFile ? `${(formData.guidebookFile.size / (1024 * 1024)).toFixed(2)} MB` : "Belum ada file"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => formData.guidebookFile && window.open(URL.createObjectURL(formData.guidebookFile), "_blank")}
              disabled={!formData.guidebookFile}
              className="bg-primary border border-gray-300 text-white text-[13px] font-medium px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              Buka File
            </button>
          </div>
        </div>
      </div>

      {/* ================= 4. CARD PENGATURAN EVENT ================= */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <Settings className="w-5 h-5 text-gray-700 mt-0.5" strokeWidth={2} />
          <div>
            <h3 className="font-bold text-[15px] text-gray-900">Pengaturan Event</h3>
            <p className="text-[13px] text-gray-500 mt-1">Atur Detail Penting Event</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 pl-8">
          
          {/* Kolom Kiri: Tanggal & Lokasi */}
          <div className="space-y-6">
            <div>
              <label className="text-[14px] font-bold text-gray-800 block mb-1">Tanggal Event</label>
              <div className="flex gap-3 text-[13px] mt-2">
                <div className="border border-gray-200 bg-gray-50/50 rounded-md p-2 w-full text-gray-700 font-normal">Mulai: <strong className="font-bold">{formData.startDate || "-"}</strong></div>
                <div className="border border-gray-200 bg-gray-50/50 rounded-md p-2 w-full text-gray-700 font-normal">Selesai: <strong className="font-bold">{formData.endDate || "-"}</strong></div>
              </div>
            </div>

            <div>
              <label className="text-[14px] font-bold text-gray-800 block mb-1">Lokasi</label>
              <p className="text-[13px] text-gray-500 mb-3">Tempat berlangsungnya event</p>
              
              <div className="flex flex-col gap-2 mb-3">
                <label className="flex items-center gap-2 text-[12px] text-gray-500 cursor-not-allowed font-normal">
                  <input type="radio" checked={formData?.locationType === "online"} readOnly disabled className="w-3.5 h-3.5 accent-gray-400" /> Online
                </label>
                <label className="flex items-center gap-2 text-[12px] text-gray-500 cursor-not-allowed font-normal">
                  <input type="radio" checked={formData?.locationType === "offline"} readOnly disabled className="w-3.5 h-3.5 accent-gray-400" /> Offline
                </label>
              </div>

              <div className="relative">
                <div className="w-full border border-gray-200 bg-gray-50/50 rounded-md pl-3 pr-28 py-2 text-[13px] text-gray-700 font-medium break-all min-h-[38px] flex items-center">
                  {formData.locationDetail || "Belum ditentukan"}
                </div>
                {formData.locationDetail && (
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
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-blue-700 text-white text-[12px] font-normal px-3 py-1.5 rounded transition"
                  >
                    {formData?.locationType === "online" ? "Buka Link" : "Buka di Maps"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Multi Competition */}
          <div>
            <label className="text-[14px] font-bold text-gray-800 block mb-1">Multi Competition</label>
            <p className="text-[13px] text-gray-500 mb-3">Memperbolehkan Peserta yang aktif mengikuti satu lomba untuk mengikuti lomba lainnya</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[12px] text-gray-500 cursor-not-allowed font-normal">
                <input type="radio" checked={formData?.isMultiCompetition === true} readOnly disabled className="w-3.5 h-3.5 accent-gray-400" /> Ya
              </label>
              <label className="flex items-center gap-2 text-[12px] text-gray-500 cursor-not-allowed font-normal">
                <input type="radio" checked={formData?.isMultiCompetition === false} readOnly disabled className="w-3.5 h-3.5 accent-gray-400" /> Tidak
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 5. TOMBOL ACTION BAWAH ================= */}
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
          onClick={() => setShowConfirm(true)}
          disabled={isSubmitting}
          className="bg-primary hover:bg-blue-700 text-white text-[13px] font-bold px-8 py-2.5 rounded-lg transition disabled:bg-gray-400"
        >
          {isSubmitting ? "Memproses..." : "Simpan & Buat Event"}
        </button>
      </div>

    </div>
  );
}