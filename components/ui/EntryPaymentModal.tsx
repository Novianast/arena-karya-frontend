"use client";

import React from 'react';
import { X, CreditCard, Copy, Building2 } from 'lucide-react';

interface EntryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionData: any; // competitions table data
  eventData: any;       // events table data
  paymentData: any;     // entry_payments table data
}

export function EntryPaymentModal({ 
  isOpen, 
  onClose,
  competitionData,
  eventData,
  paymentData
}: EntryPaymentModalProps) {
  
  if (!isOpen) return null;

  // --- Formatting Helpers ---
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return "-";
    const startDate = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const endDate = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Jika bulan dan tahun sama, bisa disingkat (opsional, tapi format dasar cukup aman)
    return `${startDate} - ${endDate}`;
  };

  const capitalizeFirstLetter = (string: string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // --- Data Mapping ---
  const compName = competitionData?.competition_name || "Lomba Tidak Diketahui";
  const compType = capitalizeFirstLetter(competitionData?.type || "Umum");
  const eventDateRange = formatDateRange(eventData?.start_date, eventData?.end_date);
  
  const orderId = paymentData?.order_id || "ORD-PENDING-000";
  const price = Number(competitionData?.price || 0);
  const formattedPrice = formatRupiah(price);

  return (
    // OVERLAY BACKGROUND
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      
      {/* MODAL CONTAINER (Max-width disesuaikan dengan referensi: 600px) */}
      <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-2xl flex flex-col font-sans overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="mt-1 text-gray-900">
              <CreditCard className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Detail Pembayaran</h2>
              <p className="text-sm text-gray-500 mt-1">
                Lakukan Pembayaran dengan Detail dibawah ini
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY MODAL */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          
          {/* SECTION 1: Lomba Terdaftar */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Lomba Terdaftar</p>
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <h3 className="font-bold text-[15px] text-gray-900 mb-1">{compName}</h3>
              <p className="text-[13px] text-gray-500 font-medium mb-0.5">{eventDateRange}</p>
              <p className="text-[12px] text-gray-400">{compType}</p>
            </div>
          </div>

          {/* SECTION 2: Ringkasan Pembayaran */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Ringkasan Pembayaran</p>
            <div className="border border-gray-200 rounded-xl bg-white flex flex-col">
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center text-[13.5px]">
                  <span className="text-gray-600">Order ID</span>
                  <span className="font-bold text-gray-900">{orderId}</span>
                </div>
                <div className="flex justify-between items-center text-[13.5px]">
                  <span className="text-gray-600">Biaya Lomba</span>
                  <span className="font-bold text-gray-900">{formattedPrice}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-gray-700 font-medium">Biaya Total</span>
                  <span className="text-lg font-bold text-gray-900">{formattedPrice}</span>
                </div>
              </div>
              
            </div>
          </div>

          {/* SECTION 3: Rekening Transfer */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Rekening Transfer</p>
            <div className="border border-[#A5C8FF] bg-[#EAF2FF] rounded-xl p-4 flex items-center gap-4">
              
              {/* Bank Logo Placeholder */}
              <div className="w-12 h-12 bg-[#D1E4FF] text-[#1E62FF] rounded-lg flex items-center justify-center shrink-0">
                <Building2 size={24} />
              </div>

              <div className="flex-1">
                <p className="text-[13px] font-bold text-[#1E62FF] mb-0.5">BCA</p>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[15px] font-bold text-gray-900 tracking-wide">450 995 5554</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText('4509955554')}
                    className="text-gray-500 hover:text-gray-800 transition-colors"
                    title="Salin Nomor Rekening"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-[12px] text-gray-500">Rasyankan Wiwok</p>
              </div>
              
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}