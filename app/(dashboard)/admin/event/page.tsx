"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardBannerHeader from "@/components/ui/DashboardBannerHeader";
import { CalendarDays, PlayCircle, CheckCircle, Filter, XCircle } from "lucide-react";
import Pagination from '@/components/ui/Pagination';
import FilterDropdown from '@/components/ui/FilterDropdown';
import Toast from '@/components/ui/Toast';
import EventListTable from "@/components/admin/EventListTable";
import ConfirmPopup from "@/components/ui/ConfirmPopup";

export default function AdminEventPage() {
  const router = useRouter();

  // State Data
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalEvent: 0, activeEvent: 0, endEvent: 0, cancelledEvent: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // State Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("Terbaru");

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // State Confirm Popup
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  // Helper Toast
  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        setIsLoading(true);

        // Ambil data semua events (Admin melihat semua)
        const { data: events, error: eventError } = await supabase
          .from("events")
          .select(`
            event_id,
            event_name,
            start_date,
            end_date,
            status,
            created_at,
            organizers(organization_name),
            package_payments(packages(package_name)),
            competitions(
              competition_id, 
              competition_name, 
              status, 
              type, 
              price, 
              stages(stage_name, status)
            )
          `)
          .order("created_at", { ascending: false });

        if (eventError) throw eventError;

        // Map datanya untuk menghitung jumlah item di dalam array competitions
        const safeEvents = (events || []).map((event: any) => ({
          ...event,
          competition_count: event.competitions?.length || 0
        }));

        setAllEvents(safeEvents);

        // Hitung Statistik (Excluding drafts)
        const nonDraftEvents = safeEvents.filter((e) => e.status !== "draft");
        setStats({
          totalEvent: nonDraftEvents.length,
          activeEvent: safeEvents.filter((e) => e.status === "active").length,
          endEvent: safeEvents.filter((e) => e.status === "end").length,
          cancelledEvent: safeEvents.filter((e) => e.status === "cancelled").length,
        });

      } catch (error) {
        console.error("Error fetching events:", error);
        showToast("Terjadi kesalahan saat memuat data event", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllEvents();
  }, []);

  const handleStatusChange = (eventId: number, newStatus: string) => {
    const event = allEvents.find(e => e.event_id === eventId);
    if (!event) return;

    const statusMap: Record<string, string> = {
      draft: "Draft",
      active: "Aktif",
      end: "Selesai",
      cancelled: "Dibatalkan",
    };

    setConfirmConfig({
      isOpen: true,
      title: "Ubah Status Event",
      message: `Apakah Anda yakin ingin mengubah status event "${event.event_name}" dari ${statusMap[event.status] || event.status} menjadi ${statusMap[newStatus]}?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('events')
            .update({ status: newStatus as any })
            .eq('event_id', eventId);

          if (error) throw error;

          // Update local state
          setAllEvents(prev => prev.map(e =>
            e.event_id === eventId ? { ...e, status: newStatus } : e
          ));

          showToast(`Status event berhasil diubah menjadi ${statusMap[newStatus] || newStatus}`);
        } catch (error) {
          console.error("Error updating status:", error);
          showToast("Gagal mengubah status event", "error");
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleCompetitionStatusChange = async (competitionId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('competitions')
        .update({ status: newStatus as any })
        .eq('competition_id', competitionId);

      if (error) throw error;

      // Update local state deeply
      setAllEvents(prev => prev.map(event => ({
        ...event,
        competitions: event.competitions?.map((comp: any) =>
          comp.competition_id === competitionId ? { ...comp, status: newStatus } : comp
        )
      })));

      showToast(`Status lomba berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      console.error("Error updating competition status:", error);
      showToast("Gagal mengubah status lomba", "error");
    }
  };

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
        const pkgName = event.package_payments?.packages?.package_name || "-";
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
      {/* Confirm Popup */}
      <ConfirmPopup
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
      />

      {/* --- BANNER HEADER --- */}
      <div className="mb-6">
        <DashboardBannerHeader
          icon={<CalendarDays className="h-6 w-6 text-white" />}
          title="Event"
          subtitle="Pantau Keseluruhan Event di Platform"
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
                  { label: "Selesai", value: "end" },
                  { label: "Dibatalkan", value: "cancelled" },
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

      {/* --- STATISTIK --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-2">
        <div className="flex flex-wrap items-center gap-3">

          {/* Card Total Event */}
          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-gray-200">
            <span className="text-lg font-bold text-blue-600">{stats.totalEvent}</span>
            <span className="text-xs font-medium text-gray-500">Total Event</span>
          </div>

          {/* Card Event Berjalan */}
          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-gray-200">
            <PlayCircle className="h-4 w-4 text-green-500" />
            <span className="text-lg font-bold text-gray-800">{stats.activeEvent}</span>
            <span className="text-xs font-medium text-gray-500">Event Berjalan</span>
          </div>

          {/* Card Event Selesai */}
          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-gray-200">
            <CheckCircle className="h-4 w-4 text-purple-500" />
            <span className="text-lg font-bold text-gray-800">{stats.endEvent}</span>
            <span className="text-xs font-medium text-gray-500">Event Selesai</span>
          </div>

          {/* Card Event Dibatalkan */}
          <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-gray-200 ">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-lg font-bold text-gray-800">{stats.cancelledEvent}</span>
            <span className="text-xs font-medium text-gray-500">Event Dibatalkan</span>
          </div>

        </div>
      </div>

      {/* --- DAFTAR EVENT (TABLE) --- */}
      <div className="bg-transparent mb-6">
        <EventListTable
          data={currentEvents}
          loading={isLoading}
          onStatusChange={handleStatusChange}
          onCompetitionStatusChange={handleCompetitionStatusChange}
          emptyMessage={allEvents.length === 0 ? "Belum ada event yang dibuat." : "Tidak ada event yang sesuai dengan filter pencarian."}
        />
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