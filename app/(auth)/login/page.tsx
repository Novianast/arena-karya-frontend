"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import { resendVerificationWithBrevo } from "@/app/actions/auth";
import { Eye, EyeOff } from "lucide-react";
import Toast from "@/components/ui/Toast";
import Banner from "@/components/sections/Banner";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [needVerification, setNeedVerification] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedCooldown = localStorage.getItem('resendCooldownExpiry');
    if (savedCooldown) {
      const remaining = Math.floor((parseInt(savedCooldown) - Date.now()) / 1000);
      if (remaining > 0) {
        setResendCooldown(remaining);
      } else {
        localStorage.removeItem('resendCooldownExpiry');
      }
    }
  }, []);

  // Cooldown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else if (resendCooldown === 0) {
      localStorage.removeItem('resendCooldownExpiry');
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setNeedVerification(true);
        setToast({ show: true, message: "Email Anda belum diverifikasi. Silakan klik tombol kirim ulang di bawah.", type: "error" });
      } else {
        setNeedVerification(false);
        setToast({ show: true, message: error.message, type: "error" });
      }

      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000);

      return;
    }

    const user = data.user
    
    if (user.user_metadata?.role_data) {
      const { processRegistration } = await import("@/app/actions/auth");
      const regResult = await processRegistration();
      if (regResult.error) {
        setToast({ show: true, message: regResult.error, type: "error" });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
        return;
      }
    }

    const { data: profile, error: errProfile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (errProfile || !profile) {
      setToast({
        show: true,
        message: "Profile tidak ditemukan",
        type: "error",
      });

      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return;
    }

    setToast({
      show: true,
      message: "Login berhasil!",
      type: "success",
    });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2000);

    console.log("Data user:", user);
    console.log("Data profile:", profile);

    switch (Number(profile.role_id)) {
      case 1:
        router.push('/admin/home')
        break
      case 2:
        router.push('/organizer/home')
        break
      case 3:
        router.push('/judge/home')
        break
      case 4:
        router.push('/participant/home')
        break
      default:
        setToast({
          show: true,
          message: "Role tidak valid",
          type: "error",
        });

        setTimeout(() => {
          setToast((prev) => ({ ...prev, show: false }));
        }, 3000);
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setToast({ show: true, message: "Silakan masukkan alamat email Anda terlebih dahulu", type: "error" });
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
      return;
    }

    setIsResending(true);
    try {
      const result = await resendVerificationWithBrevo(email);
      if (result.error) {
        setToast({ show: true, message: result.error, type: "error" });
      } else {
        setToast({ show: true, message: "Tautan verifikasi baru telah dikirim ke email Anda!", type: "success" });
        setResendCooldown(60); 
        localStorage.setItem('resendCooldownExpiry', (Date.now() + 60000).toString());
      }
    } catch (err: any) {
      setToast({ show: true, message: err.message || "Terjadi kesalahan", type: "error" });
    } finally {
      setIsResending(false);
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white overflow-hidden">
      {/* SISI KIRI - Gambar Full */}
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

      {/* SISI KANAN - Form Content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 lg:p-24 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">

          <div className="mb-8">
            <Image
              src="/logo/logo.png"
              alt="Logo Arena Karya"
              width={220}
              height={100}
              className="object-contain"
            />
          </div>

          <div className="mb-10">
            <h1 className="text-[32px] font-bold text-[#2A2A2A] leading-tight">Selamat Datang</h1>
            <p className="text-[14px] text-gray-500">Masuk ke akun Anda</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-600">Email</label>
              <input
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[13px] font-medium text-gray-600">Password</label>
                <Link href="/forgot-password" className="text-[12px] font-semibold text-[#3B82F6] underline hover:text-[#2563EB]">
                  Lupa Kata Sandi?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <button onClick={handleLogin} className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white py-2.5 rounded-lg font-bold text-[16px] transition-all shadow-lg shadow-blue-100">
              Masuk
            </button>
            <p className="text-center text-[14px] text-gray-500">
              Belum punya akun? <Link href="/register" className="text-[#1A73E8] font-semibold hover:underline">Daftar</Link>
            </p>
            {needVerification && (
              <div className="text-center mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-800 mb-2 font-medium">Email Anda belum diverifikasi.</p>
                <button 
                  onClick={handleResendVerification} 
                  disabled={isResending || resendCooldown > 0}
                  className={`text-[13px] font-bold px-4 py-2 rounded-md transition-all shadow-sm ${
                    isResending || resendCooldown > 0 
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                      : "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200"
                  }`}
                >
                  {isResending 
                    ? "Mengirim ulang..." 
                    : resendCooldown > 0 
                      ? `Tunggu ${resendCooldown} detik` 
                      : "Kirim Ulang Tautan Verifikasi"}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
      />
    </div>
  )
}