"use client";

import React, {
  useEffect,
  useState
} from "react";
import { 
  Camera, 
  Save,
  User, 
  X,
  Loader2,
  Pencil,
  Info,
  Building2,
  UserRound,
  XCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ConfirmPopup from "@/components/ui/ConfirmPopup";
import Toast from "@/components/ui/Toast";
import BannerHeader from '@/components/ui/DashboardBannerHeader';

export default function OrganizerProfilePage() {
  /* ========================================
     POPUP & TOAST
  ======================================== */
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  /* ========================================
     PROFILE & ORGANIZATION STATE
  ======================================== */
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("/images/default-avatar.png");
  const [uploading, setUploading] = useState(false);
  const [currentImageName, setCurrentImageName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Organizers Table Fields
  const [organizationName, setOrganizationName] = useState("");
  const [organizationWebsite, setOrganizationWebsite] = useState("");
  const [organizationDescription, setOrganizationDescription] = useState("");
  const [organizationAddress, setOrganizationAddress] = useState("");

  // PIC Fields
  const [picName, setPicName] = useState("");
  const [picPhone, setPicPhone] = useState("");

  /* ========================================
     FETCH PROFILE
  ======================================== */
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      /* FETCH PROFILE */
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) {
        setFullName(profile.username || "");
        setEmail(user.email || "");
        if (profile.profile_image) {
          setCurrentImageName(profile.profile_image);
          const { data } = supabase.storage.from("profiles").getPublicUrl(`organizers/${profile.profile_image}`);
          setProfileImage(data.publicUrl);
        } else {
          setProfileImage("/images/default-avatar.png");
        }
      }

      /* FETCH ORGANIZER */
      const { data: organizer } = await supabase.from("organizers").select("*").eq("profile_id", user.id).single();
      if (organizer) {
        setOrganizationName(organizer.organization_name || "");
        setOrganizationWebsite(organizer.website || "");
        setOrganizationDescription(organizer.organization_description || "");
        setOrganizationAddress(organizer.address || "");
        setPicName(organizer.pic_name || "");
        setPicPhone(organizer.pic_phone || "");
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat profil!";
      showToast(errorMessage, "error");
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  }

  /* ========================================
     IMAGE HANDLER
  ======================================== */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { 
      showToast("Ukuran foto maksimal 2MB", "error");
      return;
    }
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  /* ========================================
     SAVE & DISCARD
  ======================================== */
  const handleValidateAndConfirm = () => {
    if (!fullName.trim()) return showToast("Nama Lengkap tidak boleh kosong!", "error");
    if (!organizationName.trim()) return showToast("Nama Organisasi tidak boleh kosong!", "error");
    if (!picName.trim()) return showToast("Nama PIC tidak boleh kosong!", "error");
    if (!picPhone.trim()) return showToast("Nomor Telepon PIC tidak boleh kosong!", "error");

    setConfirmDialog({
      isOpen: true,
      title: "Simpan Perubahan Profil?",
      message: "Apakah Anda yakin ingin mengubah profil Anda?",
      onConfirm: handleConfirm
    });
  };

  const handleConfirm = async () => {
    try {
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let finalProfileImage = currentImageName;
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("profiles")
          .upload(`organizers/${fileName}`, selectedFile);

        if (uploadError) throw uploadError;
        
        finalProfileImage = fileName;

        if (currentImageName) {
          await supabase.storage.from("profiles").remove([`organizers/${currentImageName}`]);
        }
        
        setCurrentImageName(fileName);
        const { data } = supabase.storage.from("profiles").getPublicUrl(`organizers/${fileName}`);
        setProfileImage(data.publicUrl);
      }

      await supabase.from("profiles").update({
        username: fullName,
        phone: picPhone, 
        profile_image: finalProfileImage,
      }).eq("id", user.id);

      await supabase.from("organizers").update({
        organization_name: organizationName,
        website: organizationWebsite,
        organization_description: organizationDescription,
        address: organizationAddress,
        pic_name: picName,
        pic_phone: picPhone,
      }).eq("profile_id", user.id);

      setPreviewImage(null);
      setSelectedFile(null);
      setIsEditing(false); 
      showToast("Profil berhasil diperbarui!", "success");
      
      fetchProfile();

    } catch (error) {
      console.error("Save profile error:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan!";
      showToast(errorMessage, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDiscardChanges = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setIsEditing(false);
    fetchProfile();
  };

  return (
    <div className="min-h-screen bg-white">
        {/* --- BANNER HEADER --- */}
        <BannerHeader 
          icon={<User className="h-6 w-6 text-white" />}
          title={isEditing ? "Edit Profile" : "Profile"}
          subtitle={isEditing ? "Edit Profile Organisasi Anda" : "Kelola Profile Organisasi Anda"}
          showSearchFilter={false}
        />

        {/* CARD */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 md:p-8 md:pb-6 flex flex-col gap-4">
          
          {/* UPLOAD AVATAR & USER INFO SECTION */}
          {isEditing ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <div className="relative group">
                <label className="relative block w-[100px] h-[100px] rounded-full overflow-hidden border border-gray-200 shadow-sm cursor-pointer">
                  <img 
                    src={previewImage || profileImage || "/images/default-avatar.png"} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="text-white h-6 w-6" />
                  </div>
                  <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={handleFileSelect} />
                </label>
                
                {previewImage && (
                  <button
                    type="button"
                    onClick={() => { setPreviewImage(null); setSelectedFile(null); }}
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
                  <input type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={handleFileSelect} />
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
                    src={profileImage || "/images/default-avatar.png"} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-slate-800 font-sans leading-tight">
                  {fullName || "-"}
                </h2>
                <p className="text-[14px] text-gray-500 mt-1 font-sans">
                  {email || "-"}
                </p>
              </div>
            </div>
          )}

          <div className="h-[1px] w-full bg-[#E2E8F0] my-4" />

          {/* INFORMASI PRIBADI (Edit Mode Only) */}
          {isEditing && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="inline-flex items-center gap-1.5">
                  <Info size={20} className="text-gray-600"/>
                  <h3 className="font-bold text-slate-800 text-[16px] font-sans">
                    Informasi Pribadi
                  </h3>
                </div>
                <p className="text-[13px] text-gray-500 font-medium font-sans">
                  Data Diri diisi untuk Kepentingan Administrasi dan Perlombaan
                </p>
              </div>

              {/* BORDER WRAPPER */}
              <div className="rounded-md border border-gray-300 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                <div className="flex flex-col">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 border border-gray-300 rounded-lg px-4 text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all bg-white text-gray-900 font-sans"
                    placeholder="Nama Lengkap"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email</label>
                  <input
                    type="text"
                    value={email}
                    disabled
                    className="w-full h-11 border border-gray-200 rounded-lg px-4 text-[13px] outline-none bg-gray-100 text-gray-400 cursor-not-allowed font-sans"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Email tidak bisa dirubah</p>
                </div>
              </div>
            </section>
          )}

          {/* DETAIL ORGANISASI */}
          <section className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-1.5">
                <Building2 size={20} className="text-gray-600"/>
                <h3 className="font-bold text-slate-800 text-[16px] font-sans">
                  Detail Organisasi
                </h3>
              </div>
              <p className="text-[13px] text-gray-500 font-medium font-sans">
                Data Organisasi diisi untuk Kepentingan Administrasi dan Perlombaan
              </p>
            </div>

            {/* BORDER WRAPPER */}
            <div className="rounded-md border border-gray-300 p-6 bg-white">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Nama Organisasi</label>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full h-11 border border-gray-300 rounded-lg px-4 text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all bg-white text-gray-900 font-sans"
                      placeholder="Nama Organisasi"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Website Organisasi</label>
                    <input
                      type="text"
                      value={organizationWebsite}
                      onChange={(e) => setOrganizationWebsite(e.target.value)}
                      className="w-full h-11 border border-gray-300 rounded-lg px-4 text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all bg-white text-gray-900 font-sans"
                      placeholder="Website Organisasi"
                    />
                  </div>

                  <div className="flex flex-col md:col-span-2">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Deskripsi Organisasi</label>
                    <textarea
                      value={organizationDescription}
                      onChange={(e) => setOrganizationDescription(e.target.value)}
                      rows={3}
                      className="w-full p-4 border border-gray-300 rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all bg-white text-gray-900 resize-none min-h-[90px] font-sans"
                      placeholder="Deskripsi Organisasi"
                    />
                  </div>

                  <div className="flex flex-col md:col-span-2">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Alamat Organisasi</label>
                    <textarea
                      value={organizationAddress}
                      onChange={(e) => setOrganizationAddress(e.target.value)}
                      rows={3}
                      className="w-full p-4 border border-gray-300 rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all bg-white text-gray-900 resize-none min-h-[90px] font-sans"
                      placeholder="Alamat Organisasi"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 bg-white flex flex-col justify-center min-h-[64px]">
                    <span className="text-[12px] text-gray-500 font-medium">Nama Organisasi</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-0.5">{organizationName || "-"}</span>
                  </div>

                  <div className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 bg-white flex flex-col justify-center min-h-[64px]">
                    <span className="text-[12px] text-gray-500 font-medium">Website Organisasi</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-0.5">{organizationWebsite || "-"}</span>
                  </div>

                  <div className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 bg-white flex flex-col justify-center min-h-[64px] md:col-span-2">
                    <span className="text-[12px] text-gray-500 font-medium">Deskripsi Organisasi</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-0.5 whitespace-pre-wrap">{organizationDescription || "-"}</span>
                  </div>

                  <div className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 bg-white flex flex-col justify-center min-h-[64px] md:col-span-2">
                    <span className="text-[12px] text-gray-500 font-medium">Alamat Organisasi</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-0.5 whitespace-pre-wrap">{organizationAddress || "-"}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* INFORMASI PIC */}
          <section className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-1.5">
                <UserRound size={20} className="text-gray-600"/>
                <h3 className="font-bold text-slate-800 text-[16px] font-sans">
                  Informasi PIC
                </h3>
              </div>
              <p className="text-[13px] text-gray-500 font-medium font-sans">
                Data PIC diisi untuk pertanggung jawaban Organisasi Anda
              </p>
            </div>

            {/* BORDER WRAPPER */}
            <div className="rounded-md border border-gray-300 p-6 bg-white">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Nama PIC</label>
                    <input
                      type="text"
                      value={picName}
                      onChange={(e) => setPicName(e.target.value)}
                      className="w-full h-11 border border-gray-300 rounded-lg px-4 text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all bg-white text-gray-900 font-sans"
                      placeholder="Nama PIC"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Nomor PIC</label>
                    <input
                      type="text"
                      value={picPhone}
                      onChange={(e) => setPicPhone(e.target.value)}
                      className="w-full h-11 border border-gray-300 rounded-lg px-4 text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all bg-white text-gray-900 font-sans"
                      placeholder="Nomor PIC"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 bg-white flex flex-col justify-center min-h-[64px]">
                    <span className="text-[12px] text-gray-500 font-medium">Nama PIC</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-0.5">{picName || "-"}</span>
                  </div>

                  <div className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 bg-white flex flex-col justify-center min-h-[64px]">
                    <span className="text-[12px] text-gray-500 font-medium">Nomor PIC</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-0.5">{picPhone || "-"}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ACTION BUTTON */}
          <div className="mt-4 flex flex-col gap-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleValidateAndConfirm}
                  disabled={uploading}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-[14px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Perubahan</span>
                </button>
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  disabled={uploading}
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

      {/* CONFIRM POPUP */}
      <ConfirmPopup 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
      />

      {/* TOAST NOTIFICATION */}
      <Toast show={toast.show} message={toast.message} type={toast.type as "success" | "error"} />
    </div>
  );
}