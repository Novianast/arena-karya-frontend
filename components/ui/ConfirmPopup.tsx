"use client";

import { Info } from "lucide-react";

type Props = {
  isOpen: boolean;
  title: React.ReactNode;
  message: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmPopup({ isOpen, title, message, onCancel, onConfirm }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div className="relative w-[470px] rounded-2xl bg-white px-12 py-8 text-center shadow-lg animate-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute right-5 top-4 text-2xl text-gray-400 hover:text-black transition-colors"
        >
          ×
        </button>

        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <Info className="h-8 w-8 text-[#1E62FF]" />
        </div>

        <h2 className="mb-4 text-[16px] font-bold leading-6 text-gray-900 whitespace-pre-wrap">
          {title}
        </h2>

        <p className="mb-8 text-[13px] leading-relaxed text-gray-600 whitespace-pre-wrap">
          {message}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onCancel}
            className="h-11 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
            className="h-11 rounded-xl bg-[#1E62FF] font-bold text-white hover:bg-blue-700 transition-colors text-sm"
          >
            Ya, Lanjut
          </button>
        </div>
      </div>
    </div>
  );
}