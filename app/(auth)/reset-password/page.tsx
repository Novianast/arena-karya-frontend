"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Toast from "@/components/ui/Toast";
import Banner from "@/components/sections/Banner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });


  // Helper Toast
  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast("Password tidak cocok", "error");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        showToast(error.message, "error");
      }
      else {
        showToast("Password berhasil diperbarui! Silakan login kembali", "success");
        
        // Keluarkan pengguna dari sesi sementara
        await supabase.auth.signOut(); 
        
        // Gunakan 'replace' agar tidak bisa kembali pakai tombol Back
        setTimeout(() => router.replace("/login"), 2000); 
      }
    } catch (err) {
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* KIRI: Background Image (Setengah Layar) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Banner className="h-full min-h-screen">
          <div className="text-center px-12 relative z-10 flex flex-col items-center justify-center h-full">
            <h2 className="font-serif text-4xl xl:text-5xl font-bold text-white mb-6 drop-shadow-md">
              Arena Karya
            </h2>
            <p className="text-blue-100 text-lg xl:text-xl max-w-md mx-auto leading-relaxed">
              Platform digital terpadu untuk digitalisasi proses pendaftaran, pengumpulan karya, dan penjurian.
            </p>
          </div>
        </Banner>
      </div>

      {/* KANAN: Form Reset (Setengah Layar) */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Image
              src="/logo/logo.png"
              alt="Logo Arena Karya"
              width={220}
              height={100}
              className="object-contain"
            />
          </div>

          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Atur Ulang Kata Sandi
          </h1>
          <p className="mb-8 text-sm text-gray-600">
            Silakan masukkan kata sandi baru Anda
          </p>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-600 block">Kata Sandi Baru</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-600 block">Konfirmasi Kata Sandi</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 rounded-lg bg-[#3B82F6] py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-70"
            >
              {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
            </button>
          </form>
          <div className="mt-8 text-center text-[13px] text-gray-600">
            Tiba-tiba ingat? <Link href="/login" className="font-semibold text-[#3B82F6] underline hover:text-[#2563EB]">Login</Link>
          </div>
        </div>
      </div>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}