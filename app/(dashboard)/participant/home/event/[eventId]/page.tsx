"use client";

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  Trophy,
  Flag,
  GraduationCap,
  Users,
  FileText,
  ChevronRight,
  Radio,
  Circle
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  const [organizer, setOrganizer] = useState<any>(null);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [registeredEntries, setRegisteredEntries] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  

  // Schedule states
  const [compSchedules, setCompSchedules] = useState<Record<number, { regStart: string | null, regDeadline: string | null }>>({});
  const todayTime = new Date().getTime();

  useEffect(() => {
    if (!eventId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch Event and Competitions
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            organizers (
              organization_name
            ),
            competitions (
              *,
              entries (
                count
              )
            )
          `)
          .eq('event_id', eventId)
          .single();

        if (eventError) {
          throw new Error(eventError.message);
        }

        if (eventData) {
          setEvent(eventData);
          setOrganizer(Array.isArray(eventData.organizers) ? eventData.organizers[0] : eventData.organizers);
          setCompetitions(eventData.competitions || []);

          // Fetch current user and participant info
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: participantData } = await supabase
              .from('participants')
              .select('participant_id')
              .eq('profile_id', user.id)
              .single();

            if (participantData) {
              // Fetch user's registered entries in these competitions
              const compIds = (eventData.competitions || []).map((c: any) => c.competition_id);
              if (compIds.length > 0) {
                const { data: membersData } = await supabase
                  .from('entry_members')
                  .select(`
                    entry_id,
                    entries (
                      competition_id,
                      entry_payments (
                        status
                      )
                    )
                  `)
                  .eq('participant_id', participantData.participant_id);

                if (membersData) {
                  const regMap: Record<number, any> = {};
                  membersData.forEach((item: any) => {
                    const entry = item.entries;
                    if (entry && compIds.includes(entry.competition_id)) {
                      regMap[entry.competition_id] = {
                        entry_id: item.entry_id,
                        paymentStatus: Array.isArray(entry.entry_payments)
                          ? entry.entry_payments[0]?.status
                          : entry.entry_payments?.status
                      };
                    }
                  });
                  setRegisteredEntries(regMap);
                }
              }
            }
          }
        }

        // Fetch Stages
        const compIds = (eventData.competitions || []).map((c: any) => c.competition_id);
        let stagesData: any[] = [];
        if (compIds.length > 0) {
          const { data, error: stagesError } = await supabase
            .from('stages')
            .select('stage_id, competition_id, start_date, end_date, stage_type') // Pastikan ambil competition_id
            .in('competition_id', compIds);

          if (stagesError) throw stagesError;
          if (data) stagesData = data;
        }

        // Filter hanya stage pendaftaran
        const regStages = stagesData.filter(s => s.stage_type === 'registration');
        const regStageIds = regStages.map(s => s.stage_id);

        // Fetch timeline pendaftaran
        let timelinesData: any[] = [];
        if (regStageIds.length > 0) {
          const { data: timelineData, error: timelineError } = await supabase
            .from('stage_timelines')
            .select('stage_id, end_date')
            .in('stage_id', regStageIds)
            .eq('timeline_type', 'registration');

          if (timelineError) throw timelineError;
          if (timelineData) timelinesData = timelineData;
        }

        // Map jadwal ke masing-masing competition_id
        const schedules: Record<number, { regStart: string | null, regDeadline: string | null }> = {};
        compIds.forEach((id: number) => {
          const stage = regStages.find(s => s.competition_id === id);
          const timeline = stage ? timelinesData.find(t => t.stage_id === stage.stage_id) : null;
          schedules[id] = {
            regStart: stage?.start_date || null,
            regDeadline: timeline?.end_date || null
          };
        });
        setCompSchedules(schedules);

      } catch (err: any) {
        console.error('Error fetching event details:', err);
        setErrorMsg(err.message || 'Gagal memuat detail event.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 font-medium text-lg">Memuat detail event...</p>
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <p className="text-red-500 font-semibold text-lg mb-4">{errorMsg || 'Event tidak ditemukan.'}</p>
        <button
          onClick={() => router.push('participant/home')}
          className="bg-primary text-white px-6 py-2 rounded-lg"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const pelaksanaan = `${formatTanggal(event.start_date)} - ${formatTanggal(event.end_date)}`;
  const namaPenyelenggara = organizer?.organization_name || 'Penyelenggara';

  // Get public URL for guidebook
  let juknisUrl = '#';
  if (event.event_guidebook) {
    const { data: guidebookData } = supabase
      .storage
      .from('events')
      .getPublicUrl(`guidebooks/${event.event_guidebook}`);
    juknisUrl = guidebookData?.publicUrl || '#';
  }

  return (
    <div className="w-full bg-white text-foreground">
      <main className="flex-1 flex flex-col w-full">
        {/* BACK BUTTON */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors cursor-pointer mb-5 w-fit">
          <ArrowLeft size={20} />
          <span className="font-sans text-s font-medium">Kembali</span>
        </button>

        {/* HERO HEADER */}
        <section className="bg-white rounded-xl border border-padded-white shadow-sm overflow-hidden flex flex-col mb-6">
          <div className="w-full h-48 md:h-64 bg-primary relative">
            {event.poster && (
              <PosterModal
                src={getPosterUrl(event.poster)}
                alt={event.event_name}
              />
            )}
          </div>

          <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-sans text-foreground mb-2">{event.event_name}</h1>
              <div className="flex items-center text-sm font-bold font-sans text-default-gray">
                <div className="w-6 h-6 rounded bg-blue-50 text-primary flex items-center justify-center mr-2">
                  <Calendar size={16} />
                </div>
                {pelaksanaan}
              </div>
            </div>
          </div>
        </section>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* KIRI - KONTEN UTAMA */}
          <div className="lg:col-span-2 space-y-6">

            <section className="bg-white rounded-xl border border-padded-white p-6 shadow-sm">
              <h2 className="text-lg font-bold font-sans mb-2">Deskripsi Event</h2>
              <p className="text-sm font-plex text-default-gray leading-relaxed mb-6 whitespace-pre-line">
                {event.description || 'Tidak ada deskripsi event.'}
              </p>

              <h2 className="text-lg font-bold font-sans mb-4">Informasi Event</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2">
                <div>
                  <p className="text-sm text-default-gray flex items-center gap-1.5 mb-1"><User size={16} /> Penyelenggara</p>
                  <p className="text-sm font-medium text-foreground font-sans">{namaPenyelenggara}</p>
                </div>
                <div>
                  <p className="text-sm text-default-gray flex items-center gap-1.5 mb-1"><MapPin size={16} /> Lokasi</p>
                  <p className="text-sm font-medium text-foreground font-sans">{event.location || 'Online'}</p>
                </div>
                <div>
                  <p className="text-sm text-default-gray flex items-center gap-1.5 mb-1"><Trophy size={16} /> Jumlah Lomba</p>
                  <p className="text-sm font-medium text-foreground font-sans">{competitions.length} Jenis Lomba</p>
                </div>
                <div>
                  <p className="text-sm text-default-gray flex items-center gap-1.5 mb-1"><Flag size={16} /> Multi Lomba</p>
                  <p className="text-sm font-medium text-foreground font-sans">{event.allow_multi_comp ? 'Ya' : 'Tidak'}</p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-lg font-bold font-sans">Daftar Lomba</h2>
                <span className="text-sm text-default-gray font-plex">{competitions.length} Jenis Lomba</span>
              </div>

              <div className="space-y-4">
                {competitions.map((comp) => {
                  let status: 'belum_terdaftar' | 'belum_dibuka' | 'ditutup' | 'menunggu_pembayaran' | 'terdaftar' | 'berakhir' | 'terdaftar_lain' = 'belum_terdaftar';

                  const isRegisteredInEvent = Object.keys(registeredEntries).length > 0;
                  const allowMultiComp = event.allow_multi_comp;
                  const regData = registeredEntries[comp.competition_id];

                  // Ambil jadwal khusus untuk lomba ini
                  const schedule = compSchedules[comp.competition_id] || { regStart: null, regDeadline: null };
                  const regStartTime = schedule.regStart ? new Date(schedule.regStart).getTime() : null;
                  const regDeadlineTime = schedule.regDeadline ? new Date(schedule.regDeadline).getTime() : null;

                  // Logika pengecekan
                  if (comp.status === 'end' || comp.status === 'cancelled') {
                    status = 'berakhir';
                  } else if (regStartTime && todayTime < regStartTime) {
                    status = 'belum_dibuka';
                  } else if (regDeadlineTime && todayTime > regDeadlineTime) {
                    status = 'ditutup';
                  } else if (regData) {
                    if (regData.paymentStatus === 'verified' || Number(comp.price) === 0) {
                      status = 'terdaftar';
                    } else {
                      status = 'menunggu_pembayaran';
                    }
                  } else if (isRegisteredInEvent && !allowMultiComp) {
                    status = 'terdaftar_lain';
                  }

                  return (
                    <LombaCard
                      key={comp.competition_id}
                      comp={comp}
                      status={status}
                      eventId={eventId}
                      entryId={regData?.entry_id}
                    />
                  );
                })}
              </div>
            </section>

          </div>

          {/* KANAN - SIDEBAR */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-padded-white shadow-sm">
              <h2 className="font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-foreground" /> Dokumen Event
              </h2>

              <div 
                onClick={() => event?.event_guidebook && window.open(supabase.storage.from("events").getPublicUrl(`guidebooks/${event.event_guidebook}`).data.publicUrl)} 
                className="border border-gray-200 rounded-xl flex justify-between items-stretch hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
              >
                <div className="p-5 flex-1 flex flex-col justify-center">
                  <h3 className="text-sm font-bold text-gray-800 underline decoration-gray-400 underline-offset-4 group-hover:text-primary transition-colors">Juknis Event {event?.event_name}</h3>
                  <p className="text-sm font-semibold text-gray-400 mt-1.5">PDF</p>
                </div>
                <div className="w-24 bg-gray-900 relative shrink-0">
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <FileText className="text-white/40" size={28} />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// ==========================================
// KOMPONEN REUSABLE: LombaCard
// ==========================================
function LombaCard({
  comp,
  status,
  eventId,
  entryId
}: {
  comp: any,
  status: 'belum_terdaftar' | 'belum_dibuka' | 'ditutup' | 'menunggu_pembayaran' | 'terdaftar' | 'berakhir' | 'terdaftar_lain',
  eventId: string,
  entryId?: number
}) {
  const isEnded = status === 'berakhir';

  const statusConfig = {
    belum_terdaftar: { label: 'Belum Terdaftar', bg: 'bg-gray-100', text: 'text-gray-500' },
    belum_dibuka: {label: 'Pendaftaran Belum Dibuka', bg: 'bg-gray-100', text: 'text-gray-500'},
    ditutup: { label: 'Pendaftaran Ditutup', bg: 'bg-red-100', text: 'text-red-500' },
    menunggu_pembayaran: { label: 'Menunggu Pembayaran', bg: 'bg-yellow-50', text: 'text-yellow-600' },
    terdaftar: { label: 'Terdaftar', bg: 'bg-green-100', text: 'text-green-600' },
    berakhir: { label: 'Berakhir', bg: 'bg-red-100', text: 'text-red-500' },
    terdaftar_lain: { label: 'Hanya Bisa Daftar Satu Lomba', bg: 'bg-red-50', text: 'text-red-500' },
  };

  const { label, bg, text } = statusConfig[status];

  const registeredCount = Array.isArray(comp.entries) ? comp.entries[0]?.count || 0 : comp.entries?.count || 0;

  let sisaPendaftaran = '';
  if (comp.type === 'individual') {
    sisaPendaftaran = comp.max_participants ? `Sisa ${comp.max_participants - registeredCount}/${comp.max_participants} Peserta` : 'Kuota tidak dibatasi';
  } else {
    sisaPendaftaran = comp.max_teams ? `Sisa ${comp.max_teams - registeredCount}/${comp.max_teams} Tim` : 'Kuota tidak dibatasi';
  }

  const formattedPrice = comp.price && Number(comp.price) > 0
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(comp.price))
    : 'Gratis';

  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${isEnded ? 'border-gray-200 opacity-90' : 'border-padded-white hover:shadow-md'}`}>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
        <div className="flex flex-wrap gap-2 items-center">
          {!isEnded ? (
            <div className="flex items-center gap-1.5 bg-[#CCFFC5] text-arka-green text-[12px] font-normal px-3 py-1.5 rounded-md">
              <Radio className="h-4 w-4"/>
              <span>Berlangsung</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#FFCCCC] text-arka-red text-[12px] font-normal px-3 py-1.5 rounded-md">
              <Circle className="h-3 w-3" fill="currentColor" stroke="none" />
              <span>Berakhir</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-[rgba(244,180,0,0.49)] text-[#2A2A2A] text-[12px] font-normal px-3 py-1.5 rounded-md">
            <GraduationCap className="h-4 w-4" /> Umum | SD/MI | SMP/MTS | SMA/SMK | Universitas/Politeknik
          </div>
          <span className="flex items-center gap-1.5 bg-blue-200 text-primary text-[12px] font-normal px-3 py-1.5 rounded-md">
            <Users className="w-3 h-3 mr-1" /> {sisaPendaftaran}
          </span>
        </div>

        {/* LOGIC TOMBOL DAN ROUTING */}
        {entryId && comp.status == 'end' ? (
          <button
            disabled
            className="px-4 py-1.5 rounded-md text-sm font-sans font-medium flex items-center transition-colors bg-gray-300 text-gray-600 cursor-not-allowed shadow-sm"
          >
            Terdaftar
          </button>
        ) : isEnded ? (
          <button
            disabled
            className="px-4 py-1.5 rounded-md text-sm font-sans font-medium flex items-center transition-colors bg-gray-400 text-white cursor-not-allowed"
          >
            Daftar
          </button>
        ) : status === 'terdaftar_lain' ? (
          <button
            disabled
            className="px-4 py-1.5 rounded-md text-sm font-sans font-medium flex items-center transition-colors bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm"
          >
            Daftar
          </button>
        ) : status === 'belum_dibuka' || status === 'ditutup' ? (
          <button
            disabled
            className="px-4 py-1.5 rounded-md text-sm font-sans font-medium flex items-center transition-colors bg-gray-300 text-gray-500 cursor-not-allowed shadow-sm"
          >
            Daftar
          </button>
        ) : status === 'belum_terdaftar' ? (
          <Link
            href={`/participant/home/event/${eventId}/register/${comp.competition_id}`}
            className="px-4 py-1.5 rounded-md text-sm font-sans font-medium flex items-center transition-colors bg-primary hover:bg-primary-hover text-white shadow-sm"
          >
            Daftar
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        ) : (
          <Link
            href={`/participant/competition/${entryId}`}
            className="px-4 py-1.5 rounded-md text-sm font-sans font-medium flex items-center transition-colors bg-green-600 hover:bg-green-700 text-white shadow-sm"
          >
            Detail
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold font-sans text-foreground">{comp.competition_name}</h3>
        <p className="text-sm font-plex text-default-gray mt-1 leading-relaxed whitespace-pre-line">
          {comp.description || 'Tidak ada deskripsi.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-padded-white/60">
        <div>
          <p className="text-sm text-default-gray flex items-center gap-1 mb-1"><Trophy size={16} /> Tipe Kompetisi</p>
          <p className="text-sm font-semibold text-foreground font-sans capitalize">{comp.type === 'team' ? 'Tim' : 'Individu'}</p>
        </div>
        <div>
          <p className="text-sm text-default-gray flex items-center gap-1 mb-1"><Users size={16} /> Ketentuan Anggota</p>
          <p className="text-sm font-semibold text-foreground font-sans">
            {comp.type === 'team' ? `${comp.team_size_min || 1} - ${comp.team_size_max || 3} Orang` : '1 Orang'}
          </p>
        </div>
        <div>
          <p className="text-sm text-default-gray flex items-center gap-1 mb-1"><MapPin size={16} /> Biaya Pendaftaran</p>
          <p className="text-sm font-semibold text-[#1A73E8] font-sans">{formattedPrice}</p>
        </div>
        <div>
          <p className="text-sm text-default-gray flex items-center gap-1 mb-1"><Flag size={16} /> Status Pendaftaran</p>
          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-sans uppercase tracking-wider ${bg} ${text}`}>
            {label}
          </span>
        </div>
      </div>

    </div>
  );
}
