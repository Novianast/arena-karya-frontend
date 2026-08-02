"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Camera,
  Save,
  X,
  Loader2,
  Pencil,
  Info,
  School,
  XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ConfirmPopup from "@/components/ui/ConfirmPopup";
import Toast from "@/components/ui/Toast";
import BannerHeader from '@/components/ui/DashboardBannerHeader';
import { EDUCATION_OPTIONS, PREFIX_OPTIONS, SUFFIX_OPTIONS } from "@/lib/constants/education";

const defaultAvatar = "/images/default-avatar.png";

export default function JudgeProfilePage() {
  /* ========================================
     STATE
  ======================================== */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [preview, setPreview] = useState(defaultAvatar);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [oldProfileImage, setOldProfileImage] = useState<string | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    speciality: "",
    bio: "",
    lastEducation: "bachelor",
    institution: "",
    prefix: "",
    suffix: "",
  });

  /* ========================================
     FUNCTIONS
  ======================================== */
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        showToast("error", "User belum login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          username,
          profile_image,
          phone,
          judges (
            bio,
            speciality,
            institution,
            last_education,
            prefix,
            suffix
          )
        `)
        .eq("id", user.id)
        .single();

      if (error) throw error;

      const judge = Array.isArray(data.judges) ? data.judges[0] : data.judges;

      setForm({
        username: data.username || "",
        email: user.email || "",
        phone: data.phone || "",
        speciality: judge?.speciality || "",
        bio: judge?.bio || "",
        lastEducation: judge?.last_education || "bachelor",
        institution: judge?.institution || "",
        prefix: judge?.prefix || "",
        suffix: judge?.suffix || "",
      });

      setOldProfileImage(data.profile_image || null);

      if (data.profile_image) {
        const { data: publicUrl } = supabase.storage
          .from("profiles")
          .getPublicUrl(`judges/${data.profile_image}`);

        setPreview(publicUrl.publicUrl);
      } else {
        setPreview(defaultAvatar);
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Gagal mengambil data profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Ukuran foto maksimal 2 MB");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      showToast("error", "Format foto harus PNG, JPEG, atau JPG");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setSaving(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        showToast("error", "User belum login");
        return;
      }

      let newFileName = oldProfileImage;

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        newFileName = `${user.id}-${Date.now()}.${fileExt}`;

        // MENGHAPUS file lama agar storage tidak bocor/menumpuk
        if (oldProfileImage) {
          await supabase.storage
            .from("profiles")
            .remove([`judges/${oldProfileImage}`]);
        }

        // UPLOAD file baru
        const { error: uploadError } = await supabase.storage
          .from("profiles")
          .upload(`judges/${newFileName}`, selectedFile, {
            upsert: true,
          });

        if (uploadError) throw uploadError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: form.username,
          phone: form.phone,
          profile_image: newFileName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { error: judgeError } = await supabase
        .from("judges")
        .update({
          bio: form.bio,
          speciality: form.speciality,
          institution: form.institution,
          last_education: form.lastEducation,
          prefix: form.prefix,
          suffix: form.suffix,
        })
        .eq("profile_id", user.id);

      if (judgeError) throw judgeError;

      setOldProfileImage(newFileName);
      setSelectedFile(null);
      setIsEditing(false);
      showToast("success", "Profil berhasil diupdate!");
      
      fetchProfile();
    } catch (error) {
      console.error(error);
      showToast("error", "Profil gagal diupdate");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setPreview(oldProfileImage ? supabase.storage.from("profiles").getPublicUrl(`judges/${oldProfileImage}`).data.publicUrl : defaultAvatar);
    setSelectedFile(null);
    setIsEditing(false);
    fetchProfile(); // Reset data
  };

  // Helper untuk View Mode
  const educationLevelName = EDUCATION_OPTIONS.find(lvl => lvl.value === form.lastEducation)?.label || form.lastEducation;
  const prefixName = PREFIX_OPTIONS.find(p => p.value === form.prefix)?.label || form.prefix;
  const suffixName = SUFFIX_OPTIONS.find(s => s.value === form.suffix)?.label || form.suffix;

  /* ========================================
     RENDER
  ======================================== */
  if (loading) {
    return (
      <main className="min-h-screen bg-white px-10 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1A73E8] animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* --- BANNER HEADER --- */}
      <BannerHeader 
        icon={<User className="h-6 w-6 text-white" />}
        title={isEditing ? "Edit Profile" : "Profile"}
        subtitle={isEditing ? "Edit Profile dan Data Diri anda" : "Kelola Profile dan Data diri anda"}
        showSearchFilter={false}
      />

      {/* CARD WRAPPER */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8 md:pb-6 flex flex-col gap-4">
        
        {/* AVATAR & USER INFO SECTION */}
        {isEditing ? (
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="relative group">
              <label className="relative block w-[100px] h-[100px] rounded-full overflow-hidden border border-gray-200 shadow-sm cursor-pointer">
                <img 
                  src={preview} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  onError={() => setPreview(defaultAvatar)}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="text-white h-6 w-6" />
                </div>
                <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={handleUpload} />
              </label>
              
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setPreview(oldProfileImage ? supabase.storage.from("profiles").getPublicUrl(`judges/${oldProfileImage}`).data.publicUrl : defaultAvatar);
                    setSelectedFile(null);
                  }}
                  className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white hover:bg-red-600 shadow-md transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
              <label className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 cursor-pointer shadow-sm w-fit mx-auto sm:mx-0">
                <Camera className="w-4 h-4 text-white" />
                <span>Unggah Foto Profile Baru</span>
                <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={handleUpload} />
              </label>
              <p className="text-xs text-gray-500 mt-2.5 font-sans">
                Disarankan foto Berukuran <span className="font-bold text-gray-700">800 x 800</span> dengan format <span className="font-bold text-gray-700">.PNG, .JPEG, .JPG</span> - maks. <span className="font-bold text-gray-700">2 MB</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5 font-sans">
                Foto berbentuk Persegi dianjurkan
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="relative">
              <div className="relative block w-[100px] h-[100px] rounded-full overflow-hidden border border-gray-200 shadow-sm">
                <img 
                  src={preview} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  onError={() => setPreview(defaultAvatar)}
                />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-slate-800 font-sans leading-tight">
                {form.username || "-"}
              </h2>
              <p className="text-[14px] text-gray-500 mt-1 font-sans">
                {form.email || "-"}
              </p>
            </div>
          </div>
        )}

        <div className="h-[1px] w-full bg-[#E2E8F0] my-4" />

        {/* INFORMASI PRIBADI */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-1.5">
              <Info size={20} className="text-gray-600"/>
              <h3 className="font-bold text-slate-800 text-[16px] font-sans">
                Informasi Pribadi
              </h3>
            </div>
            <p className="text-[13px] text-gray-500 font-medium font-sans">
              Data Diri diisi untuk Kepentingan Administrasi dan Penjurian
            </p>
          </div>

          <div className="rounded-md border border-gray-300 p-6 bg-white">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Nama Lengkap"
                  value={form.username}
                  onChange={(value) => setForm((prev) => ({ ...prev, username: value }))}
                  placeholder="Masukkan nama lengkap"
                />

                <div className="flex flex-col">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email</label>
                  <input
                    type="text"
                    value={form.email}
                    disabled
                    className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] outline-none bg-gray-100 text-gray-400 cursor-not-allowed font-sans"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Email tidak bisa dirubah</p>
                </div>

                <InputField
                  label="Keahlian Spesifik"
                  value={form.speciality}
                  onChange={(value) => setForm((prev) => ({ ...prev, speciality: value }))}
                  placeholder="Contoh: Web Development, AI, dll"
                />

                <InputField
                  label="Nomor Telepon"
                  value={form.phone}
                  onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                  placeholder="Masukkan nomor telepon"
                />

                <div className="md:col-span-2">
                  <TextareaField
                    label="Bio Singkat"
                    value={form.bio}
                    placeholder="Ceritakan sedikit tentang latar belakang penjurian Anda..."
                    onChange={(value) => setForm((prev) => ({ ...prev, bio: value }))}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ViewField label="Keahlian Spesifik" value={form.speciality} />
                <ViewField label="Nomor Telepon" value={form.phone} />
                <ViewField label="Bio Singkat" value={form.bio} colSpan />
              </div>
            )}
          </div>
        </section>

        {/* DATA PENDIDIKAN */}
        <section className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-1.5">
              <School size={20} className="text-gray-600"/>
              <h3 className="font-bold text-slate-800 text-[16px] font-sans">
                Data Pendidikan & Gelar
              </h3>
            </div>
            <p className="text-[13px] text-gray-500 font-medium font-sans">
              Data Pendidikan Anda diisi untuk Kepentingan Administrasi dan Profil Penjurian
            </p>
          </div>

          <div className="rounded-md border border-gray-300 p-6 bg-white">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  label="Pendidikan Terakhir"
                  value={form.lastEducation}
                  options={EDUCATION_OPTIONS}
                  onChange={(value) => setForm((prev) => ({ ...prev, lastEducation: value }))}
                />

                <InputField
                  label="Nama Instansi Pendidikan"
                  value={form.institution}
                  onChange={(value) => setForm((prev) => ({ ...prev, institution: value }))}
                  placeholder="Universitas / Sekolah"
                />

                <SelectField
                  label="Gelar Depan"
                  value={form.prefix}
                  options={PREFIX_OPTIONS}
                  onChange={(value) => setForm((prev) => ({ ...prev, prefix: value }))}
                />

                <SelectField
                  label="Gelar Belakang"
                  value={form.suffix}
                  options={SUFFIX_OPTIONS}
                  onChange={(value) => setForm((prev) => ({ ...prev, suffix: value }))}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ViewField label="Pendidikan Terakhir" value={educationLevelName} />
                <ViewField label="Nama Instansi Pendidikan" value={form.institution} />
                <ViewField label="Gelar Depan" value={prefixName} />
                <ViewField label="Gelar Belakang" value={suffixName} />
              </div>
            )}
          </div>
        </section>

        {/* ACTION BUTTONS */}
        <div className="mt-4 flex flex-col gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={saving}
                className="w-full h-11 flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-[14px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Perubahan</span>
              </button>
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={saving}
                className="w-full h-11 flex items-center justify-center gap-2 bg-red-500 border border-gray-300 hover:bg-red-600 text-white rounded-lg text-[14px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                <span>Buang Perubahan</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full h-11 flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-[14px] font-semibold transition-all duration-200 cursor-pointer shadow-sm"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      <ConfirmPopup
        isOpen={showConfirm}
        title="Apakah anda yakin ingin mengubah Profile anda?"
        message="Profile yang telah diedit dapat diubah kembali jika terdapat kesalahan input data"
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      />

      <Toast show={toast.show} type={toast.type as "success" | "error"} message={toast.message} />
    </main>
  );
}

/* ========================================
   COMPONENTS
======================================== */

function ViewField({ label, value, colSpan = false }: { label: string, value: string, colSpan?: boolean }) {
  return (
    <div className={`border border-[#E2E8F0] rounded-lg px-4 py-2.5 bg-white flex flex-col justify-center min-h-[64px] ${colSpan ? 'md:col-span-2' : ''}`}>
      <span className="text-[12px] text-gray-500 font-medium">{label}</span>
      <span className="text-[14px] font-bold text-gray-900 mt-0.5 whitespace-pre-wrap">{value || "-"}</span>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col">
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full h-11 border rounded-lg px-4 text-[13px] outline-none transition-all font-sans ${
          disabled
            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
            : "border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8]"
        }`}
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[13px] outline-none transition-all font-sans bg-white text-gray-900 focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] resize-none min-h-[90px]"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full h-11 border border-gray-300 rounded-lg px-3 text-[13px] outline-none transition-all font-sans bg-white text-gray-900 focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8]"
      >
        {options.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}