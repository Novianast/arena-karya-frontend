'use client';

import React, { useState, useEffect } from 'react';
import DashboardBannerHeader from '@/components/ui/DashboardBannerHeader';
import FilterDropdown from '@/components/ui/FilterDropdown';
import Pagination from '@/components/ui/Pagination';
import Toast from '@/components/ui/Toast';
import { fetchJudgeData } from '@/services/judge/judgeAssignments';
import { History, CalendarDays, Filter, Loader2 } from 'lucide-react';
import TaskCard, { TaskType } from '@/components/judge/JudgeTaskCard';

export default function JudgeHistoryPage() {
  // --- TOAST STATE ---
  const [toastConfig, setToastConfig] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastConfig({ show: true, message, type });
    setTimeout(() => {
      setToastConfig(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // --- FILTER & SEARCH STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTime, setFilterTime] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [specificDate, setSpecificDate] = useState('');

  // --- PAGINATION STATES ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- DATA STATES ---
  const [historyTasks, setHistoryTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FILTER OPTIONS ---
  const timeFilterOptions = [
    { label: 'Semua Waktu', value: 'semua' },
    { label: 'Tanggal Spesifik', value: 'tanggal_spesifik' },
  ];

  const statusFilterOptions = [
    { label: 'Semua Status', value: 'semua' },
    { label: 'Selesai', value: 'selesai' },
    { label: 'Dibatalkan', value: 'dibatalkan' },
  ];

  useEffect(() => {
    fetchHistoryData();
  }, []);

  // Reset pagination ke halaman 1 setiap kali filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTime, filterStatus, specificDate]);

  const fetchHistoryData = async () => {
    setIsLoading(true);
    try {
      const { tasks: parsedHistory } = await fetchJudgeData('history');
      setHistoryTasks(parsedHistory);
    } catch (error: any) {
      showToast(`Gagal memuat riwayat: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIKA FILTERING ---
  const filteredHistory = historyTasks.filter((task) => {
    // 1. Pencarian (Search)
    const matchesSearch =
      task.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.competitionName.toLowerCase().includes(searchQuery.toLowerCase());

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const taskStart = new Date(task.startDate); taskStart.setHours(0, 0, 0, 0);
    const taskEnd = new Date(task.endDate); taskEnd.setHours(23, 59, 59, 999);

    // 2. Filter Waktu
    let matchesTime = true;
    if (filterTime === 'tanggal_spesifik' && specificDate) {
      const [year, month, day] = specificDate.split('-');
      const selected = new Date(Number(year), Number(month) - 1, Number(day));
      selected.setHours(0, 0, 0, 0);
      matchesTime = selected >= taskStart && selected <= taskEnd;
    }

    // 3. Filter Status
    let matchesStatus = true;
    if (filterStatus === 'selesai') {
      matchesStatus = task.statusAssignment === 'completed';
    } else if (filterStatus === 'dibatalkan') {
      matchesStatus = task.statusAssignment === 'cancelled';
    }

    return matchesSearch && matchesTime && matchesStatus;
  });

  // --- LOGIKA PAGINATION ---
  const totalItems = filteredHistory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Data yang akan dirender untuk halaman saat ini
  const currentTasks = filteredHistory.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col gap-6 w-full pb-10 relative">

      {/* HEADER & FILTER SECTION */}
      <DashboardBannerHeader
        icon={<History className="h-6 w-6 text-white" />}
        title="Riwayat"
        subtitle="Pantau riwayat tugas penilaian Anda yang telah selesai atau dibatalkan"
        searchPlaceholder="Telusuri Event atau Lomba"
        onSearchChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        customFilters={
          <div className="flex items-center gap-2">
            {/* Dropdown Filter Status */}
            <FilterDropdown
              icon={<Filter className="w-4 h-4 text-gray-500" />}
              value={filterStatus}
              options={statusFilterOptions}
              onChange={(val: string) => setFilterStatus(val)}
            />

            {/* Dropdown Filter Waktu */}
            <FilterDropdown
              icon={<CalendarDays className="w-4 h-4 text-gray-500" />}
              value={filterTime}
              options={timeFilterOptions}
              onChange={(val: string) => setFilterTime(val)}
            />

            {/* Input Tanggal Spesifik */}
            {filterTime === 'tanggal_spesifik' && (
              <input
                type="date"
                className="border border-padded-white shadow-sm rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500 h-full bg-white"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
              />
            )}
          </div>
        }
      />

      {/* TUGAS SECTION */}
      <div className="mt-2">
        <h2 className="text-lg font-bold text-gray-800">Daftar Riwayat Penugasan</h2>

        {isLoading ? (
          <div className="flex justify-center items-center py-10 mt-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">Memuat riwayat...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-10 mt-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Belum ada riwayat penugasan yang sesuai dengan filter.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {currentTasks.map((task: TaskType) => (
                <TaskCard key={task.id} task={task} mode="history" />
              ))}
            </div>

            {/* KOMPONEN PAGINATION */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(items) => {
                  setItemsPerPage(items);
                  setCurrentPage(1);
                }}
                itemName="riwayat tugas"
              />
            )}
          </>
        )}
      </div>

      {/* TOAST COMPONENT */}
      <Toast
        show={toastConfig.show}
        message={toastConfig.message}
        type={toastConfig.type}
      />
    </div>
  );
}