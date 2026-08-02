"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Toast from "@/components/ui/Toast";
import Banner from "@/components/sections/Banner";
import { resetPasswordWithBrevo } from "@/app/actions/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
    

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await resetPasswordWithBrevo(email);

      if (result.error) {
        setToast({
          show: true,
          message: result.error,
          type: "error",
        });
      } else {
        setToast({
          show: true,
          message: "Cek email kamu untuk link reset password!",
          type: "success",
        });
      }

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
    } catch (err) {
      setToast({
        show: true,
        message: "Terjadi kesalahan sistem",
        type: "error",
      });

      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
    } finally {
      setLoading(false);
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

      {/* KANAN: Form Lupa Password (Setengah Layar) */}
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
            Lupa Kata Sandi
          </h1>
          <p className="mb-8 text-sm text-gray-600">
            Masukkan email Anda untuk mengatur ulang kata sandi
          </p>

          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-1.5"> 
              <label htmlFor="email" className="text-[13px] font-medium text-gray-600 block">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan Email Anda"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#1A73E8]/10 focus:border-[#1A73E8] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#3B82F6] py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-70"
            >
              {loading ? "Memproses..." : "Kirim Tautan Reset"}
            </button>
          </form>
          <div className="mt-8 text-center text-[13px] text-gray-600">
            Kembali ke <Link href="/login" className="font-semibold text-[#3B82F6] underline hover:text-[#2563EB]">Login</Link>
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