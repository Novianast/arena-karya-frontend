"use client";

import React from 'react';
import { X, LayoutList, Clock } from 'lucide-react';

// Terima props isOpen dan onClose agar modal bisa dimatikan dari luar
export function RegistrationModal({ 
  isOpen = true, // Ubah ke false jika mau default tertutup
  onClose = () => console.log('Tutup modal') 
}) {
  
  if (!isOpen) return null;

  return (
    // OVERLAY BACKGROUND (Gelap & blur di belakang modal)
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      
      {/* MODAL CONTAINER */}
      <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-2xl flex flex-col font-plex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="mt-1 text-foreground">
              <LayoutList className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans text-foreground">Formulir Pendaftaran</h2>
              <p className="text-sm text-default-gray mt-1">
                Cek kembali ringkasan pendaftaran, lalu kirim.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors text-default-gray hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY MODAL (Scrollable jika layar terlalu kecil) */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          
          {/* TABEL DATA EVENT & TIM */}
          {/* Menggunakan divide-y untuk otomatis memberi garis pembatas antar baris */}
          <div className="border border-padded-white rounded-xl divide-y divide-padded-white">
            <DataRow label="Event" value="Hackathon" />
            <DataRow label="Lomba Terpilih" value="UI/UX Website" />
            <DataRow label="Jenis Lomba" value="Tim" />
            <DataRow label="Nama Tim" value="Akatsuki" />
            
            {/* Bagian list anggota tim (Custom styling karena multi-baris) */}
            <div className="flex flex-col sm:flex-row justify-between py-3 px-4 gap-2">
              <span className="text-sm font-sans text-foreground">Anggota Tim</span>
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-plex font-bold text-foreground">Alif Uchiha - alif@test.com</span>
                <span className="text-sm font-plex font-bold text-foreground">Alif Uchiha - alif@test.com</span>
                <span className="text-sm font-plex font-bold text-foreground">Alif Uchiha - alif@test.com</span>
              </div>
            </div>
          </div>

          {/* TIKET RINCIAN PEMBAYARAN */}
          <div className="relative bg-[#FEFBE8] border border-yellow-200 rounded-xl overflow-hidden p-5">
            
            <h3 className="text-sm font-bold font-sans text-foreground mb-4 uppercase tracking-wide">
              Rincian Pembayaran
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="font-sans text-default-gray">Biaya Lomba</span>
                <span className="font-plex font-bold text-foreground">Rp 50.000</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-sans text-default-gray">Biaya Admin</span>
                <span className="font-plex font-bold text-foreground">Rp 3.000</span>
              </div>
            </div>

            {/* GARIS PUTUS-PUTUS & LUBANG TIKET 1 */}
            <div className="relative flex items-center w-full h-px my-4">
              <div className="absolute -left-[29px] w-5 h-5 bg-white border border-yellow-200 rounded-full"></div>
              <div className="w-full border-t border-dashed border-yellow-300"></div>
              <div className="absolute -right-[29px] w-5 h-5 bg-white border border-yellow-200 rounded-full"></div>
            </div>

            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-sm font-bold font-sans text-foreground">Total</p>
                <p className="text-xs font-plex text-default-gray mt-0.5">Harga Akumulasi</p>
              </div>
              <p className="text-xl font-bold font-sans text-foreground">Rp 53.000</p>
            </div>

            {/* GARIS PUTUS-PUTUS & LUBANG TIKET 2 */}
            <div className="relative flex items-center w-full h-px my-4">
              <div className="absolute -left-[29px] w-5 h-5 bg-white border border-yellow-200 rounded-full"></div>
              <div className="w-full border-t border-dashed border-yellow-300"></div>
              <div className="absolute -right-[29px] w-5 h-5 bg-white border border-yellow-200 rounded-full"></div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <p className="text-sm font-bold font-sans text-foreground">Deadline</p>
                <p className="text-xs font-plex text-default-gray mt-0.5">Biaya Harus dibayar sebelum waktu :</p>
              </div>
              <div className="bg-[#FDF3C7] border border-[#FDE68A] text-yellow-800 px-3 py-1.5 rounded flex items-center gap-2 shadow-sm">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold font-sans whitespace-nowrap">7 Hari | 14 Maret 2026</span>
              </div>
            </div>

          </div>

        </div>

        {/* FOOTER MODAL (Button Area) */}
        <div className="p-6 pt-2">
          <button className="w-full bg-primary hover:bg-primary-hover text-white font-sans font-medium py-3 rounded-lg transition-colors shadow-sm text-base">
            Kirim Pendaftaran
          </button>
        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Sub-Komponen untuk baris tabel agar kode lebih bersih
// ---------------------------------------------------------
function DataRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 gap-1">
      <span className="text-sm font-sans text-foreground">{label}</span>
      <span className="text-sm font-plex font-bold text-foreground sm:text-right">{value}</span>
    </div>
  );
}