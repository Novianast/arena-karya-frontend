"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  icon?: React.ReactNode;
  label?: string; // Teks default jika ingin statis, jika tidak akan pakai label dari opsi terpilih
  value: string;
  options: Option[];
  onChange: (val: string) => void;
}

export default function FilterDropdown({ icon, label, value, options, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Menutup dropdown jika user klik di luar area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Menentukan teks yang tampil di tombol
  const displayLabel = label || options.find(o => o.value === value)?.label || 'Pilih';

  return (
    <div className="relative h-full flex items-center" ref={dropdownRef}>
      {/* Tombol Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full bg-white rounded-md px-3 py-2 shadow-sm border border-padded-white hover:bg-gray-50 transition-colors h-full"
      >
        {icon && <span className="mr-2 shrink-0">{icon}</span>}
        <span className="text-sm text-foreground flex-1 text-left truncate">{displayLabel}</span>
        <ChevronDown className="h-4 w-4 text-default-gray ml-2 shrink-0" />
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-3 right-0 w-48 bg-white border-1 border-padded-white rounded-xl shadow-lg z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Segitiga / Panah penunjuk ke atas */}
          <div className="absolute -top-[9px] right-6 w-4 h-4 bg-white border-t-1 border-l-1 border-padded-white transform rotate-45 rounded-tl-sm pointer-events-none"></div>
          
          {/* List Opsi dengan Radio Button Custom */}
          <div className="flex flex-col gap-1 relative z-10 bg-white rounded-xl">
            {options.map((opt) => (
              <label 
                key={opt.value} 
                className="flex items-center gap-3 p-2.5 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false); // Tutup setelah memilih
                }}
              >
                {/* Custom Radio Button */}
                <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#1A73E8] flex items-center justify-center shrink-0">
                  {value === opt.value && (
                    <div className="w-2.5 h-2.5 bg-[#1A73E8] rounded-full"></div>
                  )}
                </div>
                <span className="text-[15px] text-[#2A2A2A]">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}