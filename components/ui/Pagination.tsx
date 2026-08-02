"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  itemName?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  startIndex,
  endIndex,
  onPageChange,
  onItemsPerPageChange,
  itemName = 'item'
}: PaginationProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-8 py-4 w-full">
      {/* Info Teks */}
      <div className="text-sm text-gray-500 font-medium">
        Menampilkan <span className="font-bold text-gray-900">{totalItems === 0 ? 0 : startIndex + 1}</span> hingga <span className="font-bold text-gray-900">{Math.min(endIndex, totalItems)}</span> dari <span className="font-bold text-gray-900">{totalItems}</span> {itemName}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Dropdown Item per Halaman */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 font-medium">Per Halaman</span>
          <div className="relative group">
            <select
              className="appearance-none border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-bold bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            >
              {[5, 10, 20, 50].map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-primary pointer-events-none transition-colors" />
          </div>
        </div>

        {/* Tombol Navigasi Modern (Pill-style) */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-primary hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:hover:text-gray-500 transition-all"
          >
            <ChevronsLeft size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-primary hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:hover:text-gray-500 transition-all"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>

          {/* Indikator Halaman */}
          <div className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-sm font-bold text-primary mx-1 border border-gray-100">
            {currentPage} <span className="text-gray-400 font-medium">/ {totalPages > 0 ? totalPages : 1}</span>
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-primary hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:hover:text-gray-500 transition-all"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-primary hover:shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none disabled:hover:text-gray-500 transition-all"
          >
            <ChevronsRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}