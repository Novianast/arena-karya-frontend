"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BannerHeader from '@/components/ui/DashboardBannerHeader';
import FilterDropdown from '@/components/ui/FilterDropdown';
import Toast from '@/components/ui/Toast';
import Pagination from '@/components/ui/Pagination';
import {
  Search,
  Filter,
  ChevronDown,
  History,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Calendar,
  Info,
  AlignLeft,
  ExternalLink,
  Download
} from 'lucide-react';

export default function ParticipantHistoryPage() {
  // STATE UNTUK SEMUA FITUR INTERAKTIF
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipe, setFilterTipe] = useState('Semua');
  const [sortOrder, setSortOrder] = useState('Terbaru');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // STATE UNTUK TOAST
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // Kembali ke halaman 1 setiap kali user melakukan pencarian atau mengubah filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTipe, sortOrder, itemsPerPage]);

  interface RiwayatLomba {
    id: number;
    title: string;
    event: string;
    penyelenggara: string;
    lokasi: string;
    tanggal: string;
    tipe: string;
    avatars: string[];
    hasil: string;
    hasilColor: string;
    sertifikatFile: string | null;
    sertifikatLink: string | null;
  }

  const [dataRiwayat, setDataRiwayat] = useState<RiwayatLomba[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();

        let entryIds: string[] = [];
        const isUserLoggedIn = !!userData?.user;

        if (isUserLoggedIn) {
          const { data: participantData, error: participantError } = await supabase
            .from('participants')
            .select('participant_id')
            .eq('profile_id', userData.user.id)
            .single();

          if (!participantError && participantData) {
            const { data: memberData, error: memberError } = await supabase
              .from('entry_members')
              .select('entry_id')
              .eq('participant_id', participantData.participant_id);

            if (memberData) {
              entryIds = memberData.map(m => m.entry_id);
            }
          }

          if (entryIds.length === 0) {
            setIsLoading(false);
            return;
          }
        }

        let query = supabase
          .from('entries')
          .select(`
            entry_id,
            competitions (
              competition_name,
              type,
              status,
              events (
                event_name,
                location,
                start_date,
                end_date,
                organizers (
                  organization_name
                )
              )
            ),
            awards (
              certificate_file_path, 
              certificate_external_url,
              award_categories (
                category_name
              )
            ),
            entry_members (
              participants (
                profile_id
              )
            ),
            stage_participants (
              qualification_status
            )
          `);

        if (isUserLoggedIn && entryIds.length > 0) {
          query = query.in('entry_id', entryIds);
        }

        const { data, error } = await query;

        if (error) {
          setErrorMsg('Error fetching entries: ' + error.message);
          throw error;
        }

        if (data) {
          // FETCH PUBLIC PROFILES
          const allProfileIds = new Set<string>();
          data.forEach((item: any) => {
            item.entry_members?.forEach((m: any) => {
              if (m.participants?.profile_id) allProfileIds.add(m.participants.profile_id);
            });
          });

          // Fetch gambar dari public_profiles
          const { data: publicProfiles } = await supabase
            .from('public_profiles')
            .select('id, profile_image')
            .in('id', Array.from(allProfileIds));

          const profileMap = new Map();
          publicProfiles?.forEach((p: any) => {
            profileMap.set(p.id, p.profile_image);
          });

          const formatted: RiwayatLomba[] = data.reduce((acc: RiwayatLomba[], item: any) => {
            const comp = item.competitions;
            if (!comp) return acc;

            const sps = item.stage_participants || [];
            const isEliminated = sps.some((sp: any) => sp.qualification_status === 'eliminated');
            const isEnded = comp.status === 'end';
            const hasAward = item.awards && item.awards.length > 0;

            // Hanya tampilkan lomba yang sudah selesai, peserta tereliminasi, atau sudah mendapat juara
            if (!isEnded && !isEliminated && !hasAward) {
              return acc;
            }

            const event = comp.events;
            const organizer = event?.organizers || {};

            const startDate = event?.start_date ? new Date(event.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            const endDate = event?.end_date ? new Date(event.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            const dateRange = (startDate && endDate) ? `${startDate} - ${endDate}` : (startDate || 'Belum ditentukan');

            let hasil = 'Peserta';
            let hasilColor = 'bg-[#E5E7EB] text-[#4B5563]';
            let sertifikatFile = null;
            let sertifikatLink = null;

            if (item.awards && item.awards.length > 0) {
              sertifikatFile = item.awards[0]?.certificate_file_path;
              sertifikatLink = item.awards[0]?.certificate_external_url;
              
              const catName = item.awards[0]?.award_categories?.category_name;
              if (catName) {
                hasil = catName;
                if (catName.toLowerCase().includes('1')) hasilColor = 'bg-primary text-white';
                else if (catName.toLowerCase().includes('2')) hasilColor = 'bg-primary text-white';
                else if (catName.toLowerCase().includes('3')) hasilColor = 'bg-primary text-white';
                else hasilColor = 'bg-[rgba(244,180,0,0.49)] text-[#2A2A2A]';
              }
            } else if (isEliminated) {
              hasil = 'Tereliminasi';
              hasilColor = 'bg-red-100 text-red-600';
            }

            const avatars = (item.entry_members || []).map((m: any) => {
              const profileId = m.participants?.profile_id;
              const fileName = profileId ? profileMap.get(profileId) : null;
              if (!fileName) return '/images/default-avatar.png';
              if (fileName.startsWith('http')) return fileName;
              const { data: imgData } = supabase.storage
                .from('profiles')
                .getPublicUrl(`participants/${fileName}`);
              return imgData.publicUrl;
            });

            acc.push({
              id: item.entry_id,
              title: comp.competition_name || 'Tanpa Judul',
              event: event?.event_name || '-',
              penyelenggara: organizer.organization_name || '-',
              lokasi: event?.location || 'Online',
              tanggal: dateRange,
              tipe: comp.type === 'team' ? 'Tim' : 'Individu',
              avatars: avatars,
              hasil: hasil,
              hasilColor: hasilColor,
              sertifikatFile: sertifikatFile,
              sertifikatLink: sertifikatLink
            });
            return acc;
          }, [] as RiwayatLomba[]);

          setDataRiwayat(formatted);
        }
      } catch (error: any) {
        console.error('Error fetching riwayat:', error);
        if (!errorMsg) setErrorMsg(error?.message || 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiwayat();
  }, []);

  // Handler Download/Buka Sertifikat
  const handleDownloadSertifikat = async (filePath: string | null, externalUrl: string | null) => {
    // Prioritaskan link eksternal jika ada
    if (externalUrl) {
      window.open(externalUrl, '_blank');
      return;
    }

    // Generate Signed URL jika pakai storage Supabase
    if (filePath) {
      try {
        const { data, error } = await supabase.storage
          .from('certificates')
          .createSignedUrl(filePath, 60 * 60); // Berlaku 1 jam
          
        if (error) throw error;
        if (data) window.open(data.signedUrl, '_blank');
      } catch (error: any) {
        console.error("Error downloading certificate:", error);
        showToast("Gagal mengunduh sertifikat: " + error.message, "error");
      }
    }
  };

  // LOGIKA FILTERING & SORTING
  const filteredAndSortedData = dataRiwayat
    .filter((lomba) => {
      // Pencarian text
      const matchesSearch =
        lomba.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lomba.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lomba.penyelenggara.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter Tipe (Tim / Individu / Semua)
      const matchesTipe = filterTipe === 'Semua' || lomba.tipe === filterTipe;

      return matchesSearch && matchesTipe;
    })
    .sort((a, b) => {
      // Sorting Terbaru/Terlama berdasarkan ID
      if (sortOrder === 'Terbaru') {
        return b.id - a.id;
      } else {
        return a.id - b.id;
      }
    });

  // LOGIKA PAGINATION
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  return (
    <div className="w-full bg-white text-foreground">
      {/* --- BANNER HEADER --- */}
      <BannerHeader 
        icon={<History className="h-6 w-6 text-white" />}
        title="Riwayat"
        subtitle="Rekap Ulang Lomba-lomba yang pernah anda Ikuti"
        showSearchFilter={true}
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        searchPlaceholder="Telusuri Nama Event atau Lomba..."
        customFilters={
          <>
            {/* Dropdown Filter Event */}
            <FilterDropdown
              icon={<Filter className="h-4 w-4 text-default-gray" />}
              value={filterTipe}
              onChange={setFilterTipe}
              options={[
                { label: 'Semua Tipe', value: 'Semua' },
                { label: 'Tim', value: 'Tim' },
                { label: 'Individu', value: 'Individu' }
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

      {/* --- TABEL RIWAYAT --- */}
      <div className="overflow-x-auto border border-padded-white rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="border-b border-padded-white text-[#777777] text-sm">
              <th className="px-6 py-4 font-semibold w-16 text-center">No</th>
              <th className="px-6 py-4 font-semibold">
                <div className="flex items-center gap-2">
                  <AlignLeft className="w-4 h-4" /> Event dan Lomba
                </div>
              </th>
              <th className="px-6 py-4 font-semibold">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Penyelenggara
                </div>
              </th>
              <th className="px-6 py-4 font-semibold">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Lokasi
                </div>
              </th>
              <th className="px-6 py-4 font-semibold">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Tanggal Pelaksanaan
                </div>
              </th>
              <th className="px-6 py-4 font-semibold border-l border-padded-white">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Tim/Individu
                </div>
              </th>
              <th className="px-6 py-4 font-semibold">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" /> Hasil Lomba
                </div>
              </th>
              <th className="px-6 py-4 font-semibold">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" /> Sertifikat
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-padded-white">

            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
                  Loading data...
                </td>
              </tr>
            ) : errorMsg ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-red-500 font-medium">
                  {errorMsg}
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
                  Lomba tidak ditemukan. Coba ubah kata kunci atau filter pencarian Anda.
                </td>
              </tr>
            ) : (
              currentData.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">

                  <td className="px-6 py-6 align-top text-sm font-bold text-[#2A2A2A] text-center">
                    {startIndex + index + 1}
                  </td>

                  <td className="px-6 py-6 align-top min-w-[320px]">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2 mb-1">
                        <span className="flex items-center gap-1 bg-[rgba(244,180,0,0.49)] text-[#2A2A2A] text-[10px] font-medium px-2 py-0.5 rounded border border-[#F4B400]/30">
                          <GraduationCap className="h-3 w-3" /> Umum | SD/MI | SMP/MTS | SMA/SMK | Universitas/Politeknik
                        </span>
                      </div>
                      <h4 className="text-[14px] font-bold text-[#2A2A2A] leading-snug">{row.title}</h4>
                      <span className="text-[12px] font-semibold text-[#777777] uppercase">{row.event}</span>
                    </div>
                  </td>

                  <td className="px-6 py-6 align-top">
                    <span className="text-[14px] font-medium text-[#2A2A2A]">{row.penyelenggara}</span>
                  </td>

                  <td className="px-6 py-6 align-top">
                    {row.lokasi.toLowerCase() !== 'online' ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.lokasi)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent border border-[#D8D7D7] rounded-md text-[12px] font-medium hover:bg-yellow-600 transition-colors max-w-[200px] text-left"
                      >
                        <span className="truncate">{row.lokasi}</span> <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-[14px] font-medium text-[#2A2A2A]">{row.lokasi}</span>
                    )}
                  </td>

                  <td className="px-6 py-6 align-top">
                    <span className="text-[14px] font-medium text-[#2A2A2A]">{row.tanggal}</span>
                  </td>

                  <td className="px-6 py-6 align-top border-l border-padded-white">
                    <div className="flex flex-col gap-2">
                      <span className="text-[14px] font-medium text-[#2A2A2A]">{row.tipe}</span>
                      {row.avatars.filter((url: string) => url && (url.startsWith('/') || url.startsWith('http'))).length > 0 && (
                        <div className="flex -space-x-4">
                          {/* Hanya merender maksimal 5 gambar */}
                          {row.avatars.slice(0, 5).map((avatar: string, i: number) => {
                            const isLastImage = i === 4 && row.avatars.length > 5;
                            const remainingCount = row.avatars.length - 4; 
                            return (
                              <div key={i} className="w-12 h-12 rounded-full border border-white overflow-hidden bg-gray-200 relative z-10">
                                {/* Gambar Profil */}
                                <img 
                                  src={avatar} 
                                  alt={`Peserta ${i + 1}`} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-avatar.png'; }} 
                                />
                                {/* Overlay Gelap dengan Angka (Hanya muncul di gambar ke-5 jika sisa peserta masih ada) */}
                                {isLastImage && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                                    +{remainingCount}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-6 align-top">
                    <span className={`inline-block px-4 py-1.5 rounded-md text-[13px] font-semibold ${row.hasilColor}`}>
                      {row.hasil}
                    </span>
                  </td>

                  <td className="px-6 py-6 align-top">
                    {(row.sertifikatFile || row.sertifikatLink) ? (
                      <button
                        onClick={() => handleDownloadSertifikat(row.sertifikatFile, row.sertifikatLink)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF2FF] text-[#1E62FF] border border-[#A5C8FF] rounded-md text-[12px] font-semibold hover:bg-blue-200 transition-colors shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" /> Unduh Di sini
                      </button>
                    ) : (
                      <span className="text-[12px] font-medium text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded border border-dashed border-gray-200 block text-center">
                        Tidak ada sertifikat
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* --- PAGINATION --- */}
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

      {/* TOAST NOTIFICATION */}
      <Toast show={toast.show} message={toast.message} type={toast.type as any} />
    </div>
  );
}