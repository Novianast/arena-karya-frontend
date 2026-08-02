"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardBannerHeader from "@/components/ui/DashboardBannerHeader";
import { CalendarDays, PlayCircle, FileText, CheckCircle, Filter } from "lucide-react";
import EventCard from "@/components/competition/organizer/OrganizerEventCard";
import Pagination from '@/components/ui/Pagination';
import FilterDropdown from '@/components/ui/FilterDropdown';
import Toast from '@/components/ui/Toast';

export default function OrganizerEventPage() {
  const router = useRouter();

  // State Data
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalEvent: 0, activeEvent: 0, draftEvent: 0, endEvent: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // State Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("Terbaru");

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // State Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Helper Toast
  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    const fetchOrganizerEvents = async () => {
      try {
        setIsLoading(true);

        // Ambil user login
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Ambil organizer_id
        const { data: organizer, error: orgError } = await supabase
          .from("organizers")
          .select("organizer_id")
          .eq("profile_id", user.id)
          .single();

        if (orgError || !organizer) {
          showToast("Gagal mengambil data penyelenggara", "error");
          setIsLoading(false);
          return;
        }

        // Ambil data events milik penyelenggara terpilih
        const { data: events, error: eventError } = await supabase
          .from("events")
          .select(`
            *,
            package_payments(packages(package_name)),
            competitions(competition_id, status)
          `)
          .eq("organizer_id", organizer.organizer_id)
          .eq("competitions.status", "active")
          .order("created_at", { ascending: false });

        if (eventError) throw eventError;

        // Map datanya untuk menghitung jumlah item di dalam array competitions
        const safeEvents = (events || []).map((event: any) => ({
          ...event,
          competition_count: event.competitions?.length || 0
        }));

        setAllEvents(safeEvents);

        // Hitung Statistik (Sesuai desain baru)
        setStats({
          totalEvent: safeEvents.length,
          activeEvent: safeEvents.filter((e) => e.status === "active").length,
          draftEvent: safeEvents.filter((e) => e.status === "draft").length,
          endEvent: safeEvents.filter((e) => e.status === "end").length,
        });

      } catch (error) {
        console.error("Error fetching events:", error);
        showToast("Terjadi kesalahan saat memuat data event", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizerEvents();
  }, [router]);

  // Reset ke halaman 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, packageFilter, statusFilter, sortOrder]);

  // Logika Filter & Sorting
  const filteredEvents = useMemo(() => {
    return allEvents
      .filter((event) => {
        // Filter Pencarian Nama
        const matchSearch = event.event_name.toLowerCase().includes(searchQuery.toLowerCase());

        // Filter Paket
        const pkgName = event.package_payments?.packages?.package_name || "MAHAKARYA";
        const matchPackage = packageFilter === "all" || pkgName.toUpperCase() === packageFilter.toUpperCase();

        // Filter Status
        const matchStatus = statusFilter === "all" || event.status === statusFilter;

        return matchSearch && matchPackage && matchStatus;
      })
      .sort((a, b) => {
        // Logika Sorting (Terbaru / Terlama berdasarkan tanggal dibuat)
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();

        if (sortOrder === 'Terbaru') {
          return dateB - dateA; // Terbesar ke terkecil
        } else {
          return dateA - dateB; // Terkecil ke terbesar
        }
      });
  }, [allEvents, searchQuery, packageFilter, statusFilter, sortOrder]);

  // Logika Pagination
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data event Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* --- BANNER HEADER --- */}
      <div className="mb-6">
        <DashboardBannerHeader
          icon={<CalendarDays className="h-6 w-6 text-white" />}
          title="Event"
          subtitle="Kelola dan Pantau Event yang Anda Selenggarakan"
          showSearchFilter={true}
          searchQuery={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
          searchPlaceholder="Telusuri Event yang Anda Kelola"
          customFilters={
            <>
              {/* Filter Paket Dropdown */}
              <FilterDropdown
                icon={<Filter className="h-4 w-4 text-gray-400" />}
                value={packageFilter}
                onChange={setPackageFilter}
                options={[
                  { label: "Semua Paket", value: "all" },
                  { label: "Mahakarya", value: "MAHAKARYA" },
                  { label: "Karya", value: "KARYA" },
                  { label: "Karsa", value: "KARSA" },
                ]}
              />

              {/* Filter Status Dropdown */}
              <FilterDropdown
                icon={<Filter className="h-4 w-4 text-gray-400" />}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: "Semua Event", value: "all" },
                  { label: "Aktif", value: "active" },
                  { label: "Draft", value: "draft" },
                  { label: "Berakhir", value: "end" },
                ]}
              />

              {/* Dropdown Filter Urutan */}
              <FilterDropdown
                value={sortOrder}
                onChange={setSortOrder}
                options={[
                  { label: 'Terbaru', value: 'Terbaru' },
                  { label: 'Terlama', value: 'Terlama' }
                ]}
              />
            </>
          }
        />
      </div>

      {/* --- STATISTIK & TOMBOL BUAT EVENT --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-2">
        <div className="flex flex-wrap items-center gap-3">

          {/* Card Total Event */}
          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-padded-white">
            <span className="text-lg font-bold text-blue-600">{stats.totalEvent}</span>
            <span className="text-xs font-medium text-gray-500">Total Event</span>
          </div>

          {/* Card Event Berjalan */}
          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-padded-white">
            <PlayCircle className="h-4 w-4 text-green-500" />
            <span className="text-lg font-bold text-gray-800">{stats.activeEvent}</span>
            <span className="text-xs font-medium text-gray-500">Event Berjalan</span>
          </div>

          {/* Card Event Draft */}
          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-padded-white">
            <FileText className="h-4 w-4 text-amber-500" />
            <span className="text-lg font-bold text-gray-800">{stats.draftEvent}</span>
            <span className="text-xs font-medium text-gray-500">Dalam Draft</span>
          </div>

          {/* Card Event Selesai */}
          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-padded-white">
            <CheckCircle className="h-4 w-4 text-purple-500" />
            <span className="text-lg font-bold text-gray-800">{stats.endEvent}</span>
            <span className="text-xs font-medium text-gray-500">Event Selesai</span>
          </div>

        </div>

        {/* Tombol Buat Event Baru */}
        <Link
          href="/organizer/event/create/package"
          className="bg-primary hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all shrink-0 flex items-center justify-center gap-2"
        >
          <span className="text-base font-bold">+</span>
          Buat Event Baru
        </Link>
      </div>

      {/* --- DAFTAR EVENT (GRID) --- */}
      <div className="bg-transparent mb-6">
        {currentEvents.length === 0 ? (
          <div className="bg-white text-center py-16 text-sm text-gray-400 border border-dashed border-gray-300 rounded-2xl">
            {allEvents.length === 0
              ? "Belum ada event yang kamu buat."
              : "Tidak ada event yang sesuai dengan filter pencarian."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {currentEvents.map((event: any) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* --- PAGINATION --- */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemName="Event"
        />
      )}

      {/* --- TOAST NOTIFICATION --- */}
      <Toast show={toast.show} message={toast.message} type={toast.type as any} />
    </div>
  );
}