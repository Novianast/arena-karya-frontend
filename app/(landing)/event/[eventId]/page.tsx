"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Flag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import PosterModal from '@/components/ui/PosterModal';

import { getPosterUrl } from "@/services/url/getPosterUrl";

// Helper Format Tanggal
const formatTanggal = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPeserta, setIsPeserta] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Ambil Data Event
        const { data: eventData, error } = await supabase
          .from('events')
          .select(`
            *,
            organizers ( organization_name ),
            competitions ( * )
          `)
          .eq('event_id', eventId)
          .single();

        if (error || !eventData) {
          router.push('/404');
          return;
        }
        setEvent(eventData);

        // Ambil Session Auth
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsLoggedIn(true);
          setIsPeserta(
            session.user?.user_metadata?.role === 'participant' || 
            session.user?.user_metadata?.role === 'peserta'
          );
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, router]);

  // Tampilkan loading state selama data sedang ditarik dari database
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium text-lg">Memuat detail event...</p>
      </div>
    );
  }

  // Pengaman jika event gagal ditarik
  if (!event) return null;

  // Logic Extract Data
  const organizerData = Array.isArray(event.organizers) ? event.organizers[0] : event.organizers;
  const namaPenyelenggara = organizerData?.organization_name || 'Penyelenggara Tidak Diketahui';

  const activeCompetitions = event.competitions?.filter((c: any) => c.status === 'active') || [];
  const jumlahLomba = activeCompetitions.length;
  
  const pelaksanaan = `${formatTanggal(event.start_date)} - ${formatTanggal(event.end_date)}`;
  const biaya = event.registration_fee === 0 || !event.registration_fee ? 'Gratis' : `Rp ${event.registration_fee}`;

  // Kelompokkan Kompetisi berdasarkan tanggal published_at
  const groupedCompetitions = activeCompetitions.reduce((acc: any, comp: any) => {
    const date = formatTanggal(comp.published_at) || '-';
    if (!acc[date]) acc[date] = [];
    acc[date].push(comp);
    return acc;
  }, {});

  // Dapatkan Public URL untuk file Juknis
  const { data: guidebookData } = supabase
    .storage
    .from('events')
    .getPublicUrl(`guidebooks/${event.event_guidebook}`);

  const juknisUrl = event.event_guidebook ? guidebookData.publicUrl : '#';

  return (
    <main className="min-h-screen pb-20 pt-20">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        
        {/* Tombol Kembali */}
        <Link 
          href="/event" 
          className="inline-flex items-center gap-2 bg-primary hover:bg-[#3367d6] text-white font-medium px-4 py-2 rounded-lg transition-colors mb-8 shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" />
          Kembali
        </Link>

        {/* --- SECTION ATAS: POSTER & DESKRIPSI --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Kolom Kiri: Poster */}
          <div className="lg:col-span-5">
            <div className="bg-white p-3 rounded-3xl shadow-md border border-gray-100 sticky top-24 min-h-[600px]">
              <div className="relative w-full h-full aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden">
                {(() => {
                  const imageUrl = getPosterUrl(event.poster, '/hackathon.png');

                  return (
                    <PosterModal src={imageUrl} alt={event.event_name} />
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Detail & Aksi */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Card Info Utama */}
            <div className="bg-white p-6 rounded-2xl border border-[#bed3f3] shadow-sm">
              <p className="text-[#4285F4] font-semibold text-lg mb-1">{namaPenyelenggara}</p>
              <h1 className="text-4xl font-extrabold text-[#4285F4] mb-3">{event.event_name}</h1>
              <div className="flex flex-wrap items-center text-sm text-[#4285F4] font-medium gap-2">
                <span>{jumlahLomba} Jenis Lomba</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]"></span>
                <span>{pelaksanaan}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]"></span>
                <span>{biaya}</span>
              </div>
            </div>

            {/* Card Deskripsi */}
            <div className="bg-white p-6 rounded-2xl border border-[#bed3f3] shadow-sm flex flex-col">
              <h2 className="text-xl font-bold mb-3 text-gray-900">Deskripsi Event</h2>
                <div className="text-gray-600 leading-relaxed text-sm lg:text-base h-48 overflow-y-auto pr-2">
                  {event.description || 'Tidak ada deskripsi event.'}
                </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-col gap-3">
              {/* Login Logic untuk Daftar */}
              {!isLoggedIn ? (
                <Link
                  href="/login"
                  className="w-full bg-primary hover:bg-[#3367d6] text-white text-center font-bold py-3.5 rounded-xl shadow-sm transition-colors"
                >
                  Login untuk Mendaftar
                </Link>
              ) : isPeserta ? (
                <Link
                  href={`/participant/home/event/${event.event_id}`}
                  className="w-full bg-primary hover:bg-[#3367d6] text-white text-center font-bold py-3.5 rounded-xl shadow-sm transition-colors"
                >
                  Daftar Event
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-400 text-white text-center font-bold py-3.5 rounded-xl shadow-sm cursor-not-allowed"
                >
                  Hanya Peserta yang Dapat Mendaftar
                </button>
              )}
              
              {/* Link Juknis */}
              <a 
                href={juknisUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`w-full text-white text-center font-bold py-3.5 rounded-xl shadow-sm transition-colors block ${
                  event.event_guidebook 
                    ? 'bg-[#fbbc05] hover:bg-[#e0a800]' 
                    : 'bg-gray-400 cursor-not-allowed pointer-events-none'
                }`}
              >
                {event.event_guidebook ? 'Lihat Petunjuk Teknis' : 'Juknis Belum Tersedia'}
              </a>
            </div>
          </div>
        </div>

        {/* SECTION BAWAH: TIMELINE / JADWAL */}
        <div className="max-w-4xl">
          {Object.keys(groupedCompetitions).map((date, idx) => (
            <div key={idx} className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{date}</h3>
              <div className="flex flex-col gap-3">
                {groupedCompetitions[date].map((item: any, itemIdx: number) => {
                  // Mapping tipe dari database
                  const typeDisplay = item.type === 'team' ? 'Tim' 
                                    : item.type === 'individual' ? 'Individu' 
                                    : item.type || 'Tidak ditentukan';

                  return (
                    <div key={itemIdx} className="bg-white p-4 lg:p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <Flag className="h-6 w-6 text-gray-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{item.competition_name}</h4>
                        <p className="text-sm text-gray-500 font-medium">
                          {typeDisplay}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}