"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, User, MapPin, Calendar, List, Banknote } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PosterModal from '@/components/ui/PosterModal';

import { getPosterUrl } from "@/services/url/getPosterUrl";

// Helper untuk format tanggal
const formatTanggal = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export default function EventPage() {  
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("terbaru");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Data otomatis saat searchQuery atau sortOrder berubah
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        let query = supabase
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
          .eq('status', 'active');

        // Logic Pencarian (Berdasarkan nama event)
        if (searchQuery) {
          query = query.ilike('event_name', `%${searchQuery}%`);
        }

        // Logic Filter / Sorting
        switch (sortOrder) {
          case 'terbaru':
            query = query.order('created_at', { ascending: false });
            break;
          case 'terlama':
            query = query.order('created_at', { ascending: true });
            break;
          case 'naik':
            query = query.order('event_name', { ascending: true }); // A - Z
            break;
          case 'turun':
            query = query.order('event_name', { ascending: false }); // Z - A
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;
        
        setEvents(data || []);
      } catch (error: any) {
        console.error("Gagal load data:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce: Menunda fetch
    const timeoutId = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, sortOrder]);

  return (
    <main className="min-h-screen bg-white text-gray-900 pb-20 pt-28 ">
      {/* Search Section */}
      <section className="flex flex-col items-center pb-12 px-4 text-center">
        <h1 className="text-4xl font-extrabold mb-2">Cari Event</h1>
        
        {/* Container Search & Filter */}
        <div ref={filterRef} className="relative w-full max-w-3xl mt-6">
          <Search className="absolute left-5 top-3.5 h-5 w-5 text-[#4285F4]" />
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-12 pr-14 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-[#4285F4] outline-none shadow-sm transition-all"
            placeholder="Cari Hackaton..."
          />
          
          {/* Tombol Filter */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="absolute right-4 top-2.5 p-1 text-[#4285F4] hover:bg-blue-50 rounded-full transition-colors"
          >
            <Filter className="h-6 w-6" />
          </button>

          {/* Dropdown Filter */}
          {isFilterOpen && (
            <div className="absolute right-0 top-14 w-44 bg-white border border-[#4285F4] rounded-xl shadow-lg p-3 z-20 text-left">
              {/* Segitiga penunjuk atas */}
              <div className="absolute -top-2 right-5 w-4 h-4 bg-white border-t border-l border-[#4285F4] transform rotate-45"></div>
              
              <div className="relative z-10 flex flex-col gap-3 mt-1">
                {[
                  { id: 'terbaru', label: 'Terbaru' },
                  { id: 'terlama', label: 'Terlama' },
                  { id: 'naik', label: 'Urut Naik' },
                  { id: 'turun', label: 'Urut Turun' },
                ].map((option) => (
                  <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="sortOrder"
                      value={option.id}
                      checked={sortOrder === option.id}
                      onChange={(e) => {
                        setSortOrder(e.target.value);
                        setIsFilterOpen(false); // Tutup otomatis saat dipilih
                      }}
                      className="w-4 h-4 text-[#4285F4] focus:ring-[#4285F4] border-gray-300 cursor-pointer"
                    />
                    <span className="text-gray-700 text-sm font-medium group-hover:text-[#4285F4] transition-colors">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Grid List Event */}
      <section className="max-w-6xl mx-auto px-4">
        {/* Header Event Berlangsung */}
        <div className="mb-8 text-left">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2">
            Event Berlangsung
          </h2>
          <p className="text-xl text-gray-600">
            Jelajahi Event Arena Karya yang sedang berlangsung, dan jangan lewatkan kesempatan untuk meraih juara!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isLoading ? (
            <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-500 font-medium">
              Memuat event...
            </div>
          ) : events.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-500 font-medium">
              Event yang kamu cari tidak ditemukan.
            </div>
          ) : (
            events.map((event) => {
              // LOGIC EXTRACT:
              const organizerData = Array.isArray(event.organizers) ? event.organizers[0] : event.organizers;
              const namaPenyelenggara = organizerData?.organization_name || 'Penyelenggara Tidak Diketahui';

              const tanggalMulai = formatTanggal(event.start_date);
              const tanggalSelesai = formatTanggal(event.end_date);
              const pelaksanaan = tanggalMulai && tanggalSelesai 
                ? `${tanggalMulai} - ${tanggalSelesai}`
                : (tanggalMulai || 'Tanggal TBA');

              const jumlahLomba = event.competitions?.filter((comp: any) => comp.status === 'active').length || 0;

              const imageUrl = getPosterUrl(event.poster, '/hackathon.png');
              
              return (
                <div key={event.event_id} className="bg-white border border-[#bed3f3] rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md">
                  
                  {/* Bagian Gambar */}
                  <div className="w-full aspect-[4/5] relative bg-gray-100 overflow-hidden"> 
                    <PosterModal src={imageUrl} alt={event.event_name || 'Poster Event'} />
                  </div>

                  {/* Konten */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-2xl font-bold mb-1">{event.event_name}</h3>
                    <p className="text-gray-500 mb-6 line-clamp-2">{event.description}</p>

                    <div className="space-y-3 mb-8 flex-grow">
                      {/* Penyelenggara */}
                      <div className="flex items-center">
                        <User className="h-6 w-6 mr-4 text-black" />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Penyelenggara</span>
                          <span className="text-sm font-semibold leading-tight">{namaPenyelenggara}</span>
                        </div>
                      </div>

                      {/* Lokasi */}
                      <div className="flex items-center">
                        <MapPin className="h-6 w-6 mr-4 text-black" />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Lokasi</span>
                          <span className="text-sm font-semibold leading-tight">{event.location || 'Semarang'}</span>
                        </div>
                      </div>

                      {/* Pelaksanaan */}
                      <div className="flex items-center">
                        <Calendar className="h-6 w-6 mr-4 text-black" />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Pelaksanaan</span>
                          <span className="text-sm font-semibold leading-tight">{pelaksanaan}</span>
                        </div>
                      </div>

                      {/* Jumlah Lomba */}
                      <div className="flex items-center">
                        <List className="h-6 w-6 mr-4 text-black" />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Jumlah Lomba</span>
                          <span className="text-sm font-semibold leading-tight">{jumlahLomba}</span>
                        </div>
                      </div>
                    </div>

                    <Link 
                      href={`/event/${event.event_id}`} 
                      className="block w-full text-center bg-primary hover:bg-[#3367d6] text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      Detail Event
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}