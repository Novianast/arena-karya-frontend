"use client";

import React from 'react';
import { Search } from 'lucide-react';

interface DashboardBannerHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  showSearchFilter?: boolean;
  // Props untuk Search Bar
  searchQuery?: string;
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder?: string;
  customFilters?: React.ReactNode;
}

export default function DashboardBannerHeader({
  icon,
  title,
  subtitle,
  showSearchFilter = true,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  customFilters,
}: DashboardBannerHeaderProps) {
  return (
    <div
      className={`relative mb-6 p-6 flex flex-col
      ${showSearchFilter ? 'md:p-8 justify-between min-h-[160px]' : 'justify-center min-h-[100px]'}`}
    >

      {/* LAYER BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-[#1A73E8] bg-[url('/images/bg.png')] bg-cover bg-center rounded-xl overflow-hidden pointer-events-none"></div>

      {/* LAYER TEKS */}
      <div className={`relative z-10 flex flex-col ${showSearchFilter ? 'mb-4' : ''}`}>
        <div className="flex items-center gap-4">
          {icon && <div className="flex-shrink-0 text-white">{icon}</div>}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white tracking-wide leading-tight">{title}</h1>
            <p className="text-white/80 text-sm mt-1 leading-tight">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* LAYER PENCARIAN & FILTER */}
      {showSearchFilter && (
        <div className="relative z-20 flex flex-col md:flex-row gap-3 mt-auto">
          {/* Default Search Bar */}
          <div className="flex-1 flex items-center bg-white rounded-md px-3 py-2 shadow-sm border border-transparent focus-within:border-primary transition-colors">
            <Search className="h-4 w-4 text-default-gray mr-2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full bg-transparent outline-none text-sm text-foreground placeholder-default-gray"
              value={searchQuery}
              onChange={onSearchChange}
            />
          </div>

          {/* Area Custom Filter */}
          {customFilters && (
            <div className="flex gap-3">
              {customFilters}
            </div>
          )}
        </div>
      )}
    </div>
  );
}