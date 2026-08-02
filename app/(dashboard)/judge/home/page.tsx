'use client';

import React, { useState, useEffect } from 'react';
import DashboardBannerHeader from '@/components/ui/DashboardBannerHeader';
import FilterDropdown from '@/components/ui/FilterDropdown';
import Toast from '@/components/ui/Toast';
import Pagination from '@/components/ui/Pagination';
import { supabase } from '@/lib/supabase';
import {
  Trophy,
  Award,
  PlayCircle,
  Clock,
  Home,
  CalendarDays,
  Filter,
  Loader2
} from 'lucide-react';
import TaskCard, { TaskType } from '@/components/judge/JudgeTaskCard';
import { fetchJudgeData } from '@/services/judge/judgeAssignments';

export default function JudgeHomePage() {
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
  const [itemsPerPage, setItemsPerPage] = useState(6); // Default menampilkan 6 card

  // --- DATA STATES ---
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvent: 0,
    karyaDinilai: 0,
    tugasAktif: 0,
    undanganBaru: 0,
  });

  const timeFilterOptions = [
    { label: 'Semua Waktu', value: 'semua' },
    { label: 'Hari Ini', value: 'hari_ini' },
    { label: 'Besok', value: 'besok' },
    { label: 'Tanggal Spesifik', value: 'tanggal_spesifik' },
  ];

  const statusFilterOptions = [
    { label: 'Semua Status', value: 'semua' },
    { label: 'Berlangsung', value: 'berlangsung' },
    { label: 'Segera', value: 'segera' },
  ];

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('judge-home-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'judge_assignments' },
        () => {
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'judge_invitations' },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Reset pagination ke halaman 1 setiap kali filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTime, filterStatus, specificDate]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { tasks: parsedTasks, stats: assignmentsStats } = await fetchJudgeData('active');
      setStats(assignmentsStats);
      setTasks(parsedTasks);
    } catch (error: any) {
      showToast(`Gagal memuat data: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIKA FILTERING ---
  const filteredTasks = tasks.filter((task) => {
    // 1. Pencarian (Search)
    const matchesSearch =
      task.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.competitionName.toLowerCase().includes(searchQuery.toLowerCase());

    const now = new Date();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const taskStart = new Date(task.startDate); taskStart.setHours(0, 0, 0, 0);
    const taskEnd = new Date(task.endDate); taskEnd.setHours(23, 59, 59, 999);

    // 2. Filter Waktu
    let matchesTime = true;
    if (filterTime === 'hari_ini') {
      matchesTime = today >= taskStart && today <= taskEnd;
    } else if (filterTime === 'besok') {
      matchesTime = tomorrow >= taskStart && tomorrow <= taskEnd;
    } else if (filterTime === 'tanggal_spesifik' && specificDate) {
      // Menghindari timezone shift
      const [year, month, day] = specificDate.split('-');
      const selected = new Date(Number(year), Number(month) - 1, Number(day));
      selected.setHours(0, 0, 0, 0);
      matchesTime = selected >= taskStart && selected <= taskEnd;
    }

    // 3. Filter Status
    let matchesStatus = true;
    if (filterStatus === 'berlangsung') {
      matchesStatus = now >= taskStart && now <= taskEnd;
    } else if (filterStatus === 'segera') {
      matchesStatus = now < taskStart;
    }

    return matchesSearch && matchesTime && matchesStatus;
  });

  // --- LOGIKA PAGINATION ---
  const totalItems = filteredTasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Data yang akan dirender untuk halaman saat ini
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  return (
    <div className="w-full bg-white text-foreground pb-10">

      {/* HEADER & FILTER SECTION */}
      <div className="flex flex-col gap-4">
        <DashboardBannerHeader
          icon={<Home className="h-6 w-6 text-white" />}
          title="Beranda"
          subtitle="Pantau ringkasan aktivitas dan tugas penilaian Anda di sini"
          searchPlaceholder="Telusuri Event atau Lomba Penugasan Anda"
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

              {/* Dropdown Filter Urutan Waktu */}
              <FilterDropdown
                icon={<CalendarDays className="w-4 h-4 text-gray-500" />}
                value={filterTime}
                options={timeFilterOptions}
                onChange={(val: string) => setFilterTime(val)}
              />

              {/* Input Tanggal Spesifik (Muncul jika filterTime == 'tanggal_spesifik') */}
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
      </div>

      {/* STATISTIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard
          icon={<Trophy className="text-blue-500" size={24} />}
          bgIcon="bg-blue-100"
          title="Total Event"
          value={isLoading ? "..." : stats.totalEvent.toString()}
          desc="Event yang telah diselesaikan"
        />
        <StatCard
          icon={<Award className="text-purple-500" size={24} />}
          bgIcon="bg-purple-100"
          title="Karya Telah Dinilai"
          value={isLoading ? "..." : stats.karyaDinilai.toString()}
          desc="Babak lomba dinilai"
        />
        <StatCard
          icon={<PlayCircle className="text-green-500" size={24} />}
          bgIcon="bg-green-100"
          title="Penilaian Aktif"
          value={isLoading ? "..." : stats.tugasAktif.toString()}
          desc="Menunggu proses penilaian"
        />
        <StatCard
          icon={<Clock className="text-orange-500" size={24} />}
          bgIcon="bg-orange-100"
          title="Undangan Baru"
          value={isLoading ? "..." : stats.undanganBaru.toString()}
          desc="Belum direspons"
        />
      </div>

      {/* 3. TUGAS SECTION */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-800">Tugas</h2>
        <p className="text-sm text-gray-500 mb-4">Tugas Penjurian yang anda Terima</p>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-500">Memuat data penugasan...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Belum ada tugas penjurian yang sesuai dengan filter.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentTasks.map((task: TaskType) => (
                <TaskCard key={task.id} task={task} mode="active" />
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
                  setCurrentPage(1); // Reset ke hal 1 saat mengganti jumlah item per halaman
                }}
                itemName="tugas"
              />
            )}
          </>
        )}
      </div>

      {/* RENDER TOAST COMPONENT DI SINI */}
      <Toast
        show={toastConfig.show}
        message={toastConfig.message}
        type={toastConfig.type}
      />
    </div>
  );
}

function StatCard({ icon, bgIcon, title, value, desc }: { icon: React.ReactNode, bgIcon: string, title: string, value: string, desc: string }) {
  return (
    <div className="flex items-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className={`p-4 rounded-lg ${bgIcon} mr-4`}>
        {icon}
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase">{title}</h4>
        <p className="text-2xl font-bold text-gray-800 leading-none my-1">{value}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </div>
  );
}