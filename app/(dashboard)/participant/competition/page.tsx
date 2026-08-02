"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import BannerHeader from '@/components/ui/DashboardBannerHeader';
import FilterDropdown from '@/components/ui/FilterDropdown';
import Pagination from "@/components/ui/Pagination";
import {
  Search,
  Filter,
  Radio,
  GraduationCap,
  User,
  ChevronRight,
  UserCircle,
  Trophy,
  Flag,
  Users,
  Banknote,
  CalendarDays
} from 'lucide-react';

export default function ParticipantCompetitionPage() {
  // STATE UNTUK SEARCH DAN FILTER
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTahap, setFilterTahap] = useState('Semua');
  const [sortOrder, setSortOrder] = useState('Terbaru');

  // STATE UNTUK DATA LOMBA DARI DATABASE
  const [daftarLomba, setDaftarLomba] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE UNTUK PAGINATION
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
  
    // Reset ke halaman 1 jika ada perubahan filter atau pencarian
    useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery, filterTahap, sortOrder, itemsPerPage]);

  useEffect(() => {
    const fetchLomba = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error('Error fetching user:', userError);
          setIsLoading(false);
          return;
        }

        const { data: participantData, error: participantError } = await supabase
          .from('participants')
          .select('participant_id')
          .eq('profile_id', userData.user.id)
          .single();

        if (participantError || !participantData) {
          console.error('Error fetching participant:', participantError);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('entries')
          .select(`
            entry_id,
            entry_members!inner(participant_id),
            competitions (
              competition_name,
              description,
              type,
              team_size_max,
              max_teams,
              max_participants,
              price,
              status,
              entries (count),
              events (
                event_name,
                start_date,
                end_date,
                organizers (
                  organization_name
                )
              ),
              stages (
                stage_name,
                stage_order,
                start_date,
                end_date,
                status
              )
            ),
            entry_payments (
              status
            ),
            stage_participants (
              qualification_status,
              stages (
                stage_name,
                stage_order
              )
            ),
            awards (
              award_id
            )
          `)
          .eq('entry_members.participant_id', participantData.participant_id);

        if (error) {
          console.error('Error fetching lomba:', error);
          return;
        }

        if (data) {
          // FORMAT & KALKULASI DATA DAHULU
          const processedData = data.map((item: any) => {
            const comp = item.competitions || {};
            const event = comp.events || {};
            const organizer = event.organizers || {};
            const compStages = comp.stages || [];
            const sps = item.stage_participants || [];

            // Cari Tahap Lomba Aktif Berdasarkan Tanggal
            let activeStageName = 'Pendaftaran';
            let activeStageOrder = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const sortedStages = [...compStages].sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0));
            
            for (const stage of sortedStages) {
              if (stage.start_date) {
                const stageStartDate = new Date(stage.start_date + 'T00:00:00');
                stageStartDate.setHours(0, 0, 0, 0);
                if (today >= stageStartDate) {
                  activeStageName = stage.stage_name;
                  activeStageOrder = stage.stage_order;
                }
              }
            }

            // Cari Status dan Tahap Tertinggi Peserta Saat Ini
            let userHighestStageOrder = 0;
            let isUserEliminated = false;

            if (sps.length > 0) {
              // Urutkan tahapan yang diikuti peserta berdasarkan stage_order
              const sortedSps = [...sps].sort((a, b) => (a.stages?.stage_order || 0) - (b.stages?.stage_order || 0));
              const lastSp = sortedSps[sortedSps.length - 1]; // Ambil tahap terakhir
              
              userHighestStageOrder = lastSp.stages?.stage_order || 0;
              isUserEliminated = lastSp.qualification_status === 'eliminated';
            }

            // Tentukan Apakah Lomba Masih Boleh Tampil
            let shouldShow = true;
            
            // Lomba disembunyikan dari daftar jika statusnya sudah benar-benar 'end'
            if (comp.status === 'end') {
              shouldShow = false; 
            } else if (isUserEliminated && activeStageOrder > userHighestStageOrder) {
              // Jika peserta tereliminasi DAN lomba sudah beralih ke tahap selanjutnya (Order Lomba > Order Peserta),
              // maka sembunyikan lomba dari daftar "Berlangsung".
              shouldShow = false;
            }

            // Siapkan Data UI
            const paymentStatus = (item.entry_payments && item.entry_payments.length > 0)
              ? item.entry_payments[0].status
              : 'Belum Bayar';

            const jumlah_entries = (comp.entries && comp.entries.length > 0) ? comp.entries[0].count : 0;
            let sisaTimPribCalc = '-';
            if (comp.type === 'individual' && comp.max_participants) {
              sisaTimPribCalc = `sisa ${comp.max_participants - jumlah_entries}/${comp.max_participants} peserta`;
            } else if (comp.type === 'team' && comp.max_teams) {
              sisaTimPribCalc = `sisa ${comp.max_teams - jumlah_entries}/${comp.max_teams} tim`;
            }

            const startDate = event.start_date ? new Date(event.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            const endDate = event.end_date ? new Date(event.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            const dateRange = (startDate && endDate) ? `${startDate} - ${endDate}` : (startDate || 'Belum ditentukan');

            const biaya = comp.price && Number(comp.price) > 0
              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(comp.price))
              : 'Gratis';

            const statusAktifUI = comp.status === 'active' ? 'Berlangsung' : (comp.status === 'end' ? 'Selesai' : 'Draft');
            const statusPembayaranUI = biaya === 'Gratis'
              ? 'Gratis'
              : (paymentStatus === 'terverifikasi' ? 'Lunas' : (paymentStatus === 'pending' ? 'Menunggu Pembayaran' : (paymentStatus === 'ditolak' ? 'Ditolak' : paymentStatus)));

            let waktuSisaText = 'Berakhir dalam - hari';
            if (event.end_date) {
              const endDateObj = new Date(event.end_date + 'T00:00:00');
              const diffTime = endDateObj.getTime() - today.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays > 0) waktuSisaText = `Berakhir dalam ${diffDays} hari`;
              else if (diffDays === 0) waktuSisaText = 'Berakhir hari ini';
              else waktuSisaText = 'Sudah berakhir';
            }

            return {
              id: item.entry_id,
              shouldShow,
              isUserEliminated,
              statusAktif: statusAktifUI,
              waktuSisa: waktuSisaText,
              tagsKategori: comp.type === 'team' ? 'Tim' : 'Individu',
              sisaTimPrib: sisaTimPribCalc,
              title: comp.competition_name || 'Tanpa Judul',
              description: comp.description || 'Tidak ada deskripsi',
              penyelenggara: organizer.organization_name || '-',
              event: event.event_name || '-',
              tahap: activeStageName, 
              ketentuan: comp.type === 'team' ? `Tim (Max ${comp.team_size_max || '-'} Orang)` : 'Individu',
              biaya: biaya,
              dateRange: dateRange,
              statusPembayaran: statusPembayaranUI
            };
          });
          // FILTER DATA YANG BOLEH TAMPIL
          const finalData = processedData.filter((item: any) => item.shouldShow);
          setDaftarLomba(finalData);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLomba();
  }, []);

  // 3. LOGIKA FILTERING & SORTING
  const filteredAndSortedCompetitions = daftarLomba
    .filter((lomba) => {
      const matchesSearch =
        lomba.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lomba.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lomba.penyelenggara.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTahap = filterTahap === 'Semua' || lomba.tahap === filterTahap;

      return matchesSearch && matchesTahap;
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

    // LOGIKA PAGINATION
    const totalItems = filteredAndSortedCompetitions.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    // Memotong data yang akan ditampilkan sesuai halaman
    const currentCompetitions = filteredAndSortedCompetitions.slice(startIndex, endIndex);

  return (
    <div className="w-full bg-white text-foreground">
      {/* --- BANNER HEADER --- */}
      <BannerHeader 
        icon={<Flag className="h-6 w-6 text-white" />}
        title="Lomba yang Diikuti"
        subtitle="Lihat dan Jelajahi Lomba yang Anda Ikuti"
        showSearchFilter={true}
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        searchPlaceholder="Telusuri Nama Event atau Lomba..."
        customFilters={
          <>
            {/* Dropdown Filter Tahap */}
            <FilterDropdown
              icon={<Filter className="h-4 w-4 text-default-gray" />}
              value={filterTahap}
              onChange={setFilterTahap}
              options={[
                { label: 'Semua Tahap', value: 'Semua' },
                { label: 'Pendaftaran', value: 'Pendaftaran' },
                { label: 'Penyisihan', value: 'Penyisihan' },
                { label: 'Final', value: 'Final' }
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

      {/* --- LIST KARTU LOMBA --- */}
      <div className="flex flex-col gap-5 pb-10">

        {filteredAndSortedCompetitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Search className="h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-lg font-bold text-gray-700">Lomba tidak ditemukan</h3>
            <p className="text-sm text-gray-500">Coba ubah kata kunci atau filter pencarian Anda.</p>
          </div>
        ) : (
          currentCompetitions.map((lomba) => (
            <div key={lomba.id} className="bg-white border border-padded-white rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-2 duration-300">

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#CCFFC5] text-arka-green text-[12px] font-normal px-3 py-1.5 rounded-md">
                    <Radio className="h-4 w-4" />
                    <span>{lomba.statusAktif}</span>
                    <span className="w-[1px] h-3 bg-arka-green mx-1"></span>
                    <span>{lomba.waktuSisa}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[rgba(244,180,0,0.49)] text-[#2A2A2A] text-[12px] font-normal px-3 py-1.5 rounded-md">
                    <GraduationCap className="h-4 w-4" /> Umum | SD/MI | SMP/MTS | SMA/SMK | Universitas/Politeknik
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#C9E0FF] text-primary text-[12px] font-normal px-3 py-1.5 rounded-md">
                    <User className="h-4 w-4" /> {lomba.sisaTimPrib}
                  </div>
                </div>

                <Link 
                  href={`/participant/competition/${lomba.id}`}
                  className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-[15px] font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  Lihat Detail <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <h3 className="text-[20px] font-bold text-[#2A2A2A] mb-1.5">{lomba.title}</h3>
              <p className="text-[16px] text-[#777777] mb-6 leading-relaxed line-clamp-2 max-w-6xl">{lomba.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-default-gray/70">
                    <UserCircle className="h-4 w-4" />
                    <span className="text-[16px] font-normal text-[#777777]">Penyelenggara</span>
                  </div>
                  <span className="text-[16px] font-medium text-[#2A2A2A]">{lomba.penyelenggara}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-default-gray/70">
                    <Trophy className="h-4 w-4" />
                    <span className="text-[16px] font-normal text-[#777777]">Event</span>
                  </div>
                  <span className="text-[16px] font-medium text-[#2A2A2A]">{lomba.event}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-default-gray/70">
                    <Flag className="h-4 w-4" />
                    <span className="text-[16px] font-normal text-[#777777]">Tahap</span>
                  </div>
                  <span className="text-[16px] font-medium text-[#2A2A2A]">{lomba.tahap}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-default-gray/70">
                    <Users className="h-4 w-4" />
                    <span className="text-[16px] font-normal text-[#777777]">Ketentuan Peserta</span>
                  </div>
                  <span className="text-[16px] font-medium text-[#2A2A2A]">{lomba.ketentuan}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-default-gray/70">
                    <Banknote className="h-4 w-4" />
                    <span className="text-[16px] font-normal text-[#777777]">Biaya</span>
                  </div>
                  <span className="text-[16px] font-medium text-[#2A2A2A]">{lomba.biaya}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-padded-white pt-4 mt-2">
                <div className="flex items-center gap-2 text-[#2A2A2A]">
                  <div className="bg-[#C9E0FF] p-1.5 rounded-md">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-[16px] font-medium">{lomba.dateRange}</span>
                </div>

                {lomba.statusPembayaran === 'Menunggu Pembayaran' && (
                  <div className="mt-4 md:mt-0 bg-[rgba(255,213,0,0.2)] text-accent text-[15px] font-semibold px-4 py-2 rounded-lg">
                    Menunggu Pembayaran
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>
      
      {/* PAGINATION */}
      {currentCompetitions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemName="lomba"
        />
      )}
      
    </div>
  );
}