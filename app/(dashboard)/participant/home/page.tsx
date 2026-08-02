"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import BannerHeader from '@/components/ui/DashboardBannerHeader';
import FilterDropdown from '@/components/ui/FilterDropdown';
import PosterModal from '@/components/ui/PosterModal';
import Pagination from '@/components/ui/Pagination';
import {
  Filter,
  ChevronRight,
  User,
  MapPin,
  Trophy,
  Home,
  Calendar,
  GraduationCap,
  Radio
} from 'lucide-react';

// HELPER FUNCTIONS
const formatTanggal = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const calculateDaysLeft = (endDateStr: string) => {
  if (!endDateStr) return '';
  const end = new Date(endDateStr);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Berakhir';
  return `Berakhir dalam ${diffDays} hari`;
};

export default function EventDashboard() {
  // STATE UNTUK DATA
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE UNTUK SEARCH DAN FILTER
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('Semua');
  const [sortOrder, setSortOrder] = useState('Terbaru');

  // STATE UNTUK PAGINATION
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset ke halaman 1 jika ada perubahan filter atau pencarian
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterLocation, sortOrder, itemsPerPage]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            organizers (
              organization_name
            ),
            competitions (
              status
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setEvents(data || []);
      } catch (err: any) {
        console.error("Gagal memuat event:", err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // LOGIKA FILTERING & SORTING
  const filteredAndSortedEvents = events
    .filter((event) => {
      // Logika Pencarian Teks
      const searchLower = searchQuery.toLowerCase();
      const eventName = (event.event_name || '').toLowerCase();

      const organizerData = Array.isArray(event.organizers) ? event.organizers[0] : event.organizers;
      const orgName = (organizerData?.organization_name || '').toLowerCase();

      const matchesSearch = eventName.includes(searchLower) || orgName.includes(searchLower);

      // Logika Filter Lokasi (Online vs Offline)
      let matchesLocation = true;
      const eventLoc = (event.location || '').toLowerCase();

      if (filterLocation === 'Offline') {
        matchesLocation = eventLoc !== 'online'; // Jika Offline, cari yang SELAIN string "online"
      } else if (filterLocation === 'Online') {
        matchesLocation = eventLoc === 'online'; // Jika Online, cari yang SAMA DENGAN string "online"
      }

      return matchesSearch && matchesLocation;
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
  const totalItems = filteredAndSortedEvents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  // Memotong data yang akan ditampilkan sesuai halaman
  const currentEvents = filteredAndSortedEvents.slice(startIndex, endIndex);

  return (
    <div className="w-full bg-white text-foreground">
      {/* --- BANNER HEADER --- */}
      <BannerHeader
        icon={<Home className="h-6 w-6 text-white" />}
        title="Beranda"
        subtitle="Jelajahi Beranda Anda dan Temukan Lomba-Lomba Menarik"
        showSearchFilter={true}
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        searchPlaceholder="Telusuri Nama Event atau Penyelenggara..."
        customFilters={
          <>
            {/* Dropdown Filter Event */}
            <FilterDropdown
              icon={<Filter className="h-4 w-4 text-default-gray" />}
              value={filterLocation}
              onChange={setFilterLocation}
              options={[
                { label: 'Semua Lokasi', value: 'Semua' },
                { label: 'Offline', value: 'Offline' },
                { label: 'Online', value: 'Online' }
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

      {/* EVENT LIST */}
      <section className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 font-medium font-sans">
            Memuat daftar event...
          </div>
        ) : filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-medium font-sans">
            Event tidak ditemukan atau belum tersedia.
          </div>
        ) : (
          // Render dari currentEvents
          currentEvents.map((event) => (
            <EventCard key={event.event_id} event={event} />
          ))
        )}

        {/* PAGINATION */}
        {currentEvents.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemName="event"
          />
        )}
      </section>
    </div>
  );
}

// ==========================================
// EVENT CARD COMPONENT
// ==========================================
function EventCard({ event }: { event: any }) {
  const daysLeft = calculateDaysLeft(event.end_date);
  const totalLomba = event.competitions?.length || 0;

  // Dapatkan public URL dari bucket 'events' dan folder 'posters'
  let imageUrl = "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=1000&auto=format&fit=crop";

  if (event.poster) {
    const { data: imgData } = supabase
      .storage
      .from('events')
      .getPublicUrl(`posters/${event.poster}`);
    imageUrl = imgData?.publicUrl || imageUrl;
  }

  const organizerData = Array.isArray(event.organizers) ? event.organizers[0] : event.organizers;
  const namaPenyelenggara = organizerData?.organization_name || 'Penyelenggara';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-padded-white overflow-hidden flex flex-col md:flex-row transition-shadow hover:shadow-md">

      {/* Gambar Thumbnail */}
      <div className="w-full md:w-[300px] min-h-[220px] relative bg-gray-100 overflow-hidden shrink-0">
        <PosterModal
          src={imageUrl}
          alt={event.event_name}
        />
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="flex flex-col space-y-4">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1.5 bg-[#CCFFC5] text-arka-green text-[12px] font-normal px-3 py-1.5 rounded-md">
                <Radio className="h-4 w-4" />
                <span>Berlangsung</span>
                <span className="w-[1px] h-3 bg-arka-green mx-1"></span>
                <span>{daysLeft}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[rgba(244,180,0,0.49)] text-[#2A2A2A] text-[12px] font-normal px-3 py-1.5 rounded-md">
                <GraduationCap className="h-4 w-4" /> Umum | SD/MI | SMP/MTS | SMA/SMK | Universitas/Politeknik
              </div>
            </div>

            <Link
              href={`/participant/home/event/${event.event_id}`}
              className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-5 py-2 rounded-md transition-colors flex items-center gap-1 font-sans shadow-sm whitespace-nowrap"
            >
              Lihat Detail <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div>
            <h3 className="text-xl md:text-2xl font-bold font-sans text-foreground mb-2">
              {event.event_name}
            </h3>
            <p className="text-sm font-sans text-default-gray leading-relaxed line-clamp-2 max-w-4xl">
              {event.description || 'Tidak ada deskripsi event.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-padded-white/60">
            <div>
              <p className="text-sm text-default-gray flex items-center gap-1 mb-1"><User size={16} /> Penyelenggara</p>
              <p className="text-sm font-semibold text-foreground font-sans truncate">{namaPenyelenggara}</p>
            </div>
            <div>
              <p className="text-sm text-default-gray flex items-center gap-1 mb-1"><MapPin size={16} /> Lokasi</p>
              <p className="text-sm font-semibold text-foreground font-sans truncate">{event.location || 'Online'}</p>
            </div>
            <div>
              <p className="text-sm text-default-gray flex items-center gap-1 mb-1"><Calendar size={16} /> Pelaksanaan</p>
              <p className="text-sm font-semibold text-[#1A73E8] font-sans truncate">
                {formatTanggal(event.start_date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-default-gray flex items-center gap-1 mb-1"><Trophy size={16} /> Jumlah Lomba</p>
              <p className="text-sm font-semibold text-foreground font-sans">{totalLomba} Jenis Lomba</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}