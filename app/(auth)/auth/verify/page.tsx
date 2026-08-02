"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { processRegistration } from "@/app/actions/auth";
import Image from "next/image";

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Memverifikasi akun Anda...");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;

    const handleVerification = async () => {
      let currentSession = null;

      // 1. Coba parse manual dari URL Hash jika ada
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const errorDesc = params.get('error_description');

        if (errorDesc) {
          if (mounted) {
            setStatus("Tautan mungkin sudah digunakan atau kedaluwarsa. Silakan coba login.");
            setTimeout(() => router.push("/login"), 3000);
          }
          return;
        }

        if (accessToken && refreshToken) {
          if (mounted) setStatus("Memvalidasi sesi Anda...");
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (!error && data.session) {
            currentSession = data.session;
          }
        }
      }

      // 2. Jika tidak ada di hash, coba getSession (mungkin sudah diset sebelumnya)
      if (!currentSession) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session && !sessionError) {
          currentSession = session;
        }
      }
      
      if (!currentSession) {
        if (mounted) {
          setStatus("Tautan mungkin sudah digunakan. Silakan coba login.");
          setTimeout(() => router.push("/login"), 3000);
        }
        return;
      }

      if (mounted) setStatus("Memproses data profil Anda...");

      // Jalankan proses RPC di server action
      try {
        const result = await processRegistration();
        
        if (result.error) {
          if (mounted) {
            setStatus("Gagal memproses pendaftaran: " + result.error);
            setTimeout(() => router.push("/login?error=" + encodeURIComponent(result.error || "Gagal memproses data")), 3000);
          }
          return;
        }

        if (mounted) setStatus("Verifikasi berhasil! Mengarahkan ke dashboard...");

        // Cek URL params barangkali ini dari reset password (recovery)
        const params = new URLSearchParams(window.location.search);
        const nextUrl = params.get('next');
        
        setTimeout(() => {
          if (nextUrl) {
            router.push(nextUrl);
          } else {
            router.push(`/${result.role || ''}/home`);
          }
        }, 1500);

      } catch (err: any) {
        if (mounted) {
          setStatus("Terjadi kesalahan sistem.");
          setTimeout(() => router.push("/login?error=Terjadi kesalahan sistem"), 3000);
        }
      }
    };

    if (!isProcessing) {
      setIsProcessing(true);
      handleVerification();
    }

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center max-w-md w-full mx-4">
        <Image
          src="/logo/logo.png"
          alt="Logo Arena Karya"
          width={150}
          height={60}
          className="object-contain mb-8"
        />
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-800 text-center">{status}</h2>
        <p className="text-sm text-gray-500 mt-4 text-center">Mohon tunggu sebentar, jangan tutup halaman ini.</p>
      </div>
    </div>
  );
}
