'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Flag,
  FileText,
  Info,
  User,
  Phone,
  Search,
  Trash2
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/ui/Toast';
import PosterModal from '@/components/ui/PosterModal';
import ConfirmPopup from '@/components/ui/ConfirmPopup';

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

import { getPosterUrl } from "@/services/url/getPosterUrl";

export default function CompetitionRegistrationPage() {
  const params = useParams();
  const router = useRouter();

  const eventId = params.eventId as string;
  const competitionId = params.competitionId as string;

  const [event, setEvent] = useState<any>(null);
  const [competition, setCompetition] = useState<any>(null);

  const [leaderProfile, setLeaderProfile] = useState<any>(null);
  const [leaderParticipant, setLeaderParticipant] = useState<any>(null);
  const [leaderEducation, setLeaderEducation] = useState<any>(null);
  const [leaderEmail, setLeaderEmail] = useState('');

  // Form states
  const [teamName, setTeamName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [members, setMembers] = useState<any[]>([]); // List of added members

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Status states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stage states
  const [stageDates, setStageDates] = useState({
    startDate: null as string | null,
    endDate: null as string | null,
    registrationDeadline: null as string | null
  });

  // Toast
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // State Confirm Pop Up
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { }
  });

  useEffect(() => {
    if (!eventId || !competitionId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch Event Details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('event_id', eventId)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);

        // Fetch Competition Details
        const { data: compData, error: compError } = await supabase
          .from('competitions')
          .select('*')
          .eq('competition_id', competitionId)
          .single();

        if (compError) throw compError;
        setCompetition(compData);

        // Fetch Stages
        const { data: stagesData, error: stagesError } = await supabase
          .from('stages')
          .select('stage_id, start_date, end_date, stage_type')
          .eq('competition_id', competitionId);

        if (stagesError) throw stagesError;

        let compStartDate = null;
        let compEndDate = null;
        let regStageId = null;

        if (stagesData && stagesData.length > 0) {
          // Filter dan cari Min start_date dan Max end_date
          const validStarts = stagesData
            .filter(s => s.start_date)
            .map(s => new Date(s.start_date).getTime());

          const validEnds = stagesData
            .filter(s => s.end_date)
            .map(s => new Date(s.end_date).getTime());

          if (validStarts.length > 0) compStartDate = new Date(Math.min(...validStarts)).toISOString();
          if (validEnds.length > 0) compEndDate = new Date(Math.max(...validEnds)).toISOString();

          // Cari stage_id untuk tahap pendaftaran
          const regStage = stagesData.find(s => s.stage_type === 'registration');
          if (regStage) regStageId = regStage.stage_id;
        }

        let regDeadline = null;

        // Fetch Batas Waktu Pendaftaran dari stage_timelines
        if (regStageId) {
          const { data: timelineData, error: timelineError } = await supabase
            .from('stage_timelines')
            .select('end_date')
            .eq('stage_id', regStageId)
            .eq('timeline_type', 'registration')
            .maybeSingle(); // Menggunakan maybeSingle agar tidak error jika data kosong

          if (timelineError) throw timelineError;
          if (timelineData) regDeadline = timelineData.end_date;
        }

        // Simpan tanggal-tanggal yang telah dihitung ke dalam state
        setStageDates({
          startDate: compStartDate,
          endDate: compEndDate,
          registrationDeadline: regDeadline
        });

        // Fetch current logged-in user profile, participant & education info
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setLeaderEmail(user.email || '');

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profile) {
            setLeaderProfile(profile);
            setWhatsapp(profile.phone || '');

            const { data: participant } = await supabase
              .from('participants')
              .select('*')
              .eq('profile_id', user.id)
              .single();

            if (participant) {
              setLeaderParticipant(participant);

              const { data: edu } = await supabase
                .from('participant_education')
                .select('*')
                .eq('participant_id', participant.participant_id)
                .single();

              setLeaderEducation(edu);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching registration data:', err);
        showToast(err.message || 'Gagal memuat data pendaftaran.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, competitionId]);

  const handleSearchParticipants = async () => {
    if (!searchQuery.trim()) return;
    try {
      setIsSearching(true);
      // Cari profile dari view public_profiles
      const { data: profiles, error: profileError } = await supabase
        .from('public_profiles')
        .select('id, username, profile_image')
        .eq('role_id', 4)
        .neq('id', leaderProfile?.id)
        .ilike('username', `%${searchQuery}%`)
        .limit(5);

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        setSearchResults([]);
        return;
      }

      // Ambil participant_id dan data edukasi berdasar profile_id yang ketemu
      const profileIds = profiles.map((p: any) => p.id);
      const { data: participantsData, error: partError } = await supabase
        .from('participants')
        .select(`
          participant_id,
          profile_id,
          participant_education ( institution_name )
        `)
        .in('profile_id', profileIds);

      if (partError) throw partError;

      // Mapping data dan hapus yang sudah menjadi anggota
      const existingMemberIds = members.map(m => m.participant_id);
      const formattedData = profiles.map((user: any) => {
        const partData = participantsData?.find((p: any) => p.profile_id === user.id);
        return {
          participant_id: partData?.participant_id,
          profiles: { username: user.username, profile_image: user.profile_image, phone: '-' },
          participant_education: partData?.participant_education
        };
      }).filter((u: any) => u.participant_id && !existingMemberIds.includes(u.participant_id));

      setSearchResults(formattedData);
    } catch (err: any) {
      console.error('Error searching participants:', err);
      showToast('Gagal mencari partisipan.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const addMember = (participant: any) => {
    const maxAllowedMembers = (competition?.team_size_max || 3) - 1;
    if (members.length >= maxAllowedMembers) {
      showToast(`Jumlah anggota tim (termasuk ketua) maksimal ${competition?.team_size_max} orang.`, 'error');
      return;
    }

    const newMember = {
      participant_id: participant.participant_id,
      username: participant.profiles?.username || 'Anggota',
      phone: participant.profiles?.phone || '-',
      institution: participant.participant_education?.[0]?.institution_name ||
        participant.participant_education?.institution_name || '-'
    };

    setMembers([...members, newMember]);

    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMember = (index: number) => {
    const updated = [...members];
    updated.splice(index, 1);
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!leaderParticipant) {
      showToast('Profil Anda tidak lengkap. Silakan lengkapi di menu Profile.', 'error');
      return;
    }

    // Validasi multi-comp jika tidak diizinkan oleh event
    if (event && !event.allow_multi_comp) {
      const { data: eventComps } = await supabase
        .from('competitions')
        .select('competition_id')
        .eq('event_id', event.event_id);

      if (eventComps && eventComps.length > 0) {
        const compIds = eventComps.map(c => c.competition_id);
        const { data: existingMemberships } = await supabase
          .from('entry_members')
          .select('entry_id, entries!inner (competition_id)')
          .eq('participant_id', leaderParticipant.participant_id)
          .in('entries.competition_id', compIds);

        if (existingMemberships && existingMemberships.length > 0) {
          showToast('Anda sudah terdaftar di lomba lain pada event ini.', 'error');
          return;
        }
      }
    }

    if (competition?.type === 'team') {
      if (!teamName.trim()) {
        showToast('Nama Tim harus diisi.', 'error');
        return;
      }
      const totalMembers = members.length + 1;
      if (competition.team_size_min && totalMembers < competition.team_size_min) {
        showToast(`Minimal jumlah tim adalah ${competition.team_size_min} orang.`, 'error');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Ambil tahapan pendaftaran dengan stage_order terkecil
      const { data: stagesData, error: stageError } = await supabase
        .from('stages')
        .select('stage_id, status')
        .eq('competition_id', competition.competition_id)
        .eq('stage_type', 'registration')
        .order('stage_order', { ascending: true })
        .limit(1);

      if (stageError) throw stageError;
      const regStage = stagesData?.[0];

      // Cek apakah pendaftaran lomba sudah ditutup
      if (competition?.status === 'end' || regStage?.status === 'completed') {
        showToast('Pendaftaran untuk lomba ini telah ditutup', 'error');
        setIsSubmitting(false);
        return;
      }
      if (!regStage) {
        showToast('Tahap pendaftaran belum diatur oleh penyelenggara.', 'error');
        setIsSubmitting(false);
        return;
      }

      if (stageDates.registrationDeadline) {
        const deadlineDate = new Date(stageDates.registrationDeadline);
        const today = new Date();

        if (today > deadlineDate) {
          showToast('Batas waktu pendaftaran telah berakhir.', 'error');
          setIsSubmitting(false);
          return;
        }
      }

      // Memunculkan Popup Konfirmasi
      setIsSubmitting(false);
      setConfirmDialog({
        isOpen: true,
        title: "Konfirmasi Pendaftaran",
        message: "Pastikan data dan anggota tim sudah benar. Anda tidak dapat mengubah atau membatalkannya nanti.",
        onConfirm: () => processRegistration(regStage.stage_id)
      });

    } catch (err: any) {
      console.error('Submit check error:', err);
      showToast('Terjadi kesalahan saat memverifikasi lomba.', 'error');
      setIsSubmitting(false);
    }
  };

  const processRegistration = async (registrationStageId: number) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setIsSubmitting(true);

    try {
      // Insert ke tabel entries
      const { data: entryData, error: entryError } = await supabase
        .from('entries')
        .insert({
          competition_id: competition.competition_id,
          leader_id: leaderParticipant.participant_id,
          entry_type: competition.type === 'team' ? 'team' : 'individual',
          entry_name: competition.type === 'team' ? teamName : leaderProfile.username,
        })
        .select()
        .single();

      if (entryError) {
        if (entryError.code === '23505') throw new Error('Anda sudah terdaftar dalam kompetisi ini.');
        throw entryError;
      }

      // Insert array ke entry_members (Ketua + Anggota)
      const membersToInsert = [
        { entry_id: entryData.entry_id, participant_id: leaderParticipant.participant_id, role: 'leader' },
        ...members.map(m => ({ entry_id: entryData.entry_id, participant_id: m.participant_id, role: 'member' }))
      ];
      const { error: membersError } = await supabase.from('entry_members').insert(membersToInsert);
      if (membersError) throw membersError;

      // Insert ke entry_payments dengan status 'pending'
      const orderId = `INV-${competition.competition_id}-${Date.now()}`;
      const { error: paymentError } = await supabase
        .from('entry_payments')
        .insert({
          order_id: orderId,
          competition_id: competition.competition_id,
          entry_id: entryData.entry_id,
          amount: competition.price || 0,
          status: 'pending'
        });
      if (paymentError) throw paymentError;

      // Insert ke stage_participants sesuai stage_id tahap registrasi
      const { error: stagePartError } = await supabase
        .from('stage_participants')
        .insert({
          stage_id: registrationStageId,
          entry_id: entryData.entry_id,
          qualification_status: 'pending'
        });
      if (stagePartError) throw stagePartError;

      showToast('Pendaftaran berhasil!', 'success');
      setTimeout(() => router.push(`/participant/competition/${entryData.entry_id}`), 2000);

    } catch (err: any) {
      console.error('Registration process error:', err);
      showToast(err.message || 'Gagal mengirimkan pendaftaran.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 font-medium text-lg">Memuat form pendaftaran...</p>
      </div>
    );
  }

  if (!event || !competition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-red-500 font-semibold text-lg mb-4">Event atau Kompetisi tidak ditemukan.</p>
        <button onClick={() => router.back()} className="bg-primary text-white px-6 py-2 rounded-lg">Kembali</button>
      </div>
    );
  }

  // Banner image poster or default
  const bannerUrl = getPosterUrl(event.poster, "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=1000&auto=format&fit=crop");

  // Event guidebook URL
  let juknisUrl = '#';
  if (event.event_guidebook) {
    const { data: guidebookData } = supabase
      .storage
      .from('events')
      .getPublicUrl(`guidebooks/${event.event_guidebook}`);
    juknisUrl = guidebookData?.publicUrl || '#';
  }

  const isTeam = competition.type === 'team';

  return (
    <div className="w-full bg-white text-foreground">
      <main className="flex-1 flex flex-col w-full">
        {/* HEADER KEMBALI */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors cursor-pointer mb-5 w-fit">
          <ArrowLeft size={20} />
          <span className="font-sans text-s font-medium">Kembali</span>
        </button>

        {/* GRID LAYOUT (Kiri: Form, Kanan: Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

          {/* KOLOM KIRI: FORM PENDAFTARAN */}
          <div className="lg:col-span-2 space-y-8">

            {/* Banner Image */}
            <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden bg-gray-200">
              <PosterModal
                src={bannerUrl}
                alt="Banner Lomba"
              />
            </div>

            {/* Title Section */}
            <div>
              <h1 className="text-2xl font-bold font-sans text-foreground mb-1">Form Pendaftaran</h1>
              <p className="text-sm text-foreground font-sans font-medium">
                Silahkan daftar sebelum dapat mengikuti Perlombaan
              </p>
            </div>

            {/* Main Form Elements */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Input: Nama Tim */}
              {isTeam && (
                <div className="space-y-2">
                  <label className="block text-sm font-sans font-medium text-foreground">Nama Tim</label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Nama dari Tim yang akan mengikuti Lomba"
                    className="w-full border border-padded-white rounded-md px-4 py-2.5 font-plex text-sm text-foreground placeholder:text-default-gray focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
                  />
                </div>
              )}

              {/* Grid 2 Kolom untuk Input Baris ke-2 & ke-3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Input: Nama Ketua Tim */}
                <div className="space-y-2">
                  <label className="block text-sm font-sans font-medium text-foreground">
                    {isTeam ? 'Nama Ketua Tim' : 'Nama Lengkap'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={leaderProfile?.username || ''}
                    className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-plex text-sm text-gray-500 bg-gray-50 focus:outline-none"
                  />
                </div>

                {/* Input: Email Ketua Tim */}
                <div className="space-y-2">
                  <label className="block text-sm font-sans font-medium text-foreground">
                    {isTeam ? 'Email Ketua Tim' : 'Email'}
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={leaderEmail}
                    className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-plex text-sm text-gray-500 bg-gray-50 focus:outline-none"
                  />
                </div>

                {/* Select: Institusi */}
                <div className="space-y-2">
                  <label className="block text-sm font-sans font-medium text-foreground">Institusi/Sekolah/Universitas</label>
                  <input
                    type="text"
                    readOnly
                    value={leaderEducation?.institution_name || 'Belum diisi di profil'}
                    className="w-full border border-gray-200 rounded-md px-4 py-2.5 font-plex text-sm text-gray-500 bg-gray-50 focus:outline-none"
                  />
                </div>

                {/* Input: Nomor Whatsapp */}
                <div className="space-y-2">
                  <label className="block text-sm font-sans font-medium text-foreground">Nomor Telepon / Whatsapp</label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Nomor Whatsapp aktif"
                    className="w-full border border-padded-white rounded-md px-4 py-2.5 font-plex text-sm text-foreground placeholder:text-default-gray focus:outline-none focus:border-primary bg-white"
                  />
                </div>

              </div>

              {/* SEARCH & ADD TEAM MEMBERS (For Team Competition) */}
              {isTeam && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-base font-bold font-sans text-foreground">Cari & Tambah Anggota Tim</h3>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-default-gray absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchParticipants())}
                        placeholder="Cari partisipan berdasarkan username..."
                        className="w-full pl-9 pr-4 py-2.5 border border-padded-white rounded-md font-plex text-sm text-foreground focus:outline-none focus:border-primary bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchParticipants}
                      disabled={isSearching}
                      className="px-5 py-2.5 bg-primary text-white font-sans font-medium text-sm rounded-md hover:bg-primary-hover transition-colors"
                    >
                      {isSearching ? 'Mencari...' : 'Cari'}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="border border-padded-white rounded-md bg-white divide-y divide-gray-100 max-h-48 overflow-y-auto shadow-sm">
                      {searchResults.map((participant) => (
                        <div key={participant.participant_id} className="flex justify-between items-center p-3 text-sm">
                          <div>
                            <p className="font-bold text-foreground">{participant.profiles?.username}</p>
                            <p className="text-xs text-default-gray">
                              Instansi: {participant.participant_education?.[0]?.institution_name || participant.participant_education?.institution_name || '-'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addMember(participant)}
                            className="bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 px-3 py-1 rounded text-xs font-semibold"
                          >
                            Tambah
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery && searchResults.length === 0 && !isSearching && (
                    <p className="text-xs text-gray-500 italic">Tekan Cari untuk menemukan partisipan.</p>
                  )}
                </div>
              )}

              {/* Input: Jumlah Anggota Tim (Custom Counter) */}
              {isTeam && (
                <div className="space-y-2 pt-2">
                  <label className="block text-sm font-sans font-medium text-foreground">Jumlah Anggota Tim (Termasuk Ketua)</label>
                  <div className="flex items-center gap-2">
                    <div className="relative w-32 border border-padded-white rounded-md bg-white overflow-hidden flex items-center">
                      <User className="w-4 h-4 text-foreground absolute left-3" />
                      <input
                        type="text"
                        value={members.length + 1}
                        readOnly
                        className="w-full pl-9 pr-3 py-2 font-plex text-sm text-foreground focus:outline-none bg-transparent"
                      />
                    </div>
                    <span className="text-xs text-default-gray">
                      Min: {competition.team_size_min || 1} | Max: {competition.team_size_max || 3}
                    </span>
                  </div>
                </div>
              )}

              {/* List Anggota Tim */}
              {isTeam && (
                <div className="space-y-2 pt-2">
                  <label className="block text-sm font-sans font-medium text-foreground">Daftar Anggota Tim</label>
                  <div className="border border-padded-white rounded-lg p-2 bg-white">

                    {/* Leader Row */}
                    <div className="grid grid-cols-12 gap-2 p-3 text-sm font-plex text-primary border-b border-padded-white/50 items-center">
                      <div className="col-span-1 font-sans font-semibold">1</div>
                      <div className="col-span-4 font-semibold truncate">{leaderProfile?.username}</div>
                      <div className="col-span-3">Ketua Tim (Anda)</div>
                      <div className="col-span-4 truncate text-right text-xs text-default-gray">{leaderEducation?.institution_name || '-'}</div>
                    </div>

                    {/* Members Rows */}
                    {members.map((member, idx) => (
                      <div key={member.participant_id} className="grid grid-cols-12 gap-2 p-3 text-sm font-plex text-foreground border-b border-padded-white/50 last:border-b-0 items-center">
                        <div className="col-span-1 font-sans text-default-gray">{idx + 2}</div>
                        <div className="col-span-4 truncate font-medium">{member.username}</div>
                        <div className="col-span-3 text-default-gray">Anggota Tim</div>
                        <div className="col-span-3 truncate text-xs text-default-gray">{member.institution}</div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeMember(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {members.length === 0 && (
                      <div className="p-3 text-center text-xs text-default-gray italic">
                        Belum ada anggota tim tambahan yang ditambahkan.
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 rounded-md border border-primary text-primary font-sans font-medium text-sm hover:bg-blue-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-md bg-primary text-white font-sans font-medium text-sm hover:bg-primary-hover transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
                </button>
              </div>

            </form>
          </div>

          {/* KOLOM KANAN: SIDEBAR */}
          <div className="lg:col-span-1 space-y-6">

            <div className="bg-white rounded-xl border border-padded-white p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold font-sans text-foreground">Informasi Lomba</h2>
                <Info className="w-5 h-5 text-foreground" />
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-default-gray mt-0.5" />
                  <div>
                    <p className="text-xs text-default-gray font-plex mb-0.5">Tanggal Pelaksanaan</p>
                    <p className="text-sm font-bold font-sans text-foreground">
                      {stageDates.startDate && stageDates.endDate
                        ? `${formatTanggal(stageDates.startDate)} - ${formatTanggal(stageDates.endDate)}`
                        : 'Belum ditentukan'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-default-gray mt-0.5" />
                  <div>
                    <p className="text-xs text-default-gray font-plex mb-0.5">Tipe Lomba</p>
                    <p className="text-sm font-bold font-sans text-foreground capitalize">
                      {competition.type === 'team' ? 'Tim' : 'Individu'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-default-gray mt-0.5" />
                  <div>
                    <p className="text-xs text-default-gray font-plex mb-0.5">Batas waktu Pendaftaran</p>
                    <p className="text-sm font-bold font-sans text-foreground">
                      {stageDates.registrationDeadline
                        ? formatTanggal(stageDates.registrationDeadline)
                        : 'Belum ditentukan'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Flag className="w-5 h-5 text-default-gray mt-0.5" />
                  <div>
                    <p className="text-xs text-default-gray font-plex mb-0.5">Tempat Pelaksanaan Lomba</p>
                    <p className="text-sm font-bold font-sans text-foreground">{event.location || 'Online'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-padded-white p-6 shadow-sm">
              <h2 className="text-base font-bold font-sans flex items-center gap-2 border-b border-padded-white pb-4 mb-4">
                <FileText className="w-5 h-5 text-foreground" /> Dokumen
              </h2>

              {event.event_guidebook ? (
                <a
                  href={juknisUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-padded-white rounded-lg p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium font-sans text-foreground truncate group-hover:text-primary transition-colors">
                      Juknis - {event.event_name}
                    </p>
                    <p className="text-xs text-default-gray mt-1">PDF</p>
                  </div>
                </a>
              ) : (
                <p className="text-sm text-gray-500">Juknis belum tersedia</p>
              )}
            </div>

            <div className="bg-primary rounded-xl border border-primary p-6 shadow-sm text-white">
              <h2 className="text-lg font-bold font-sans mb-1">Butuh bantuan ?</h2>
              <p className="text-sm font-plex opacity-90 mb-5">
                Hubungi kami jika ada Masalah mendaftar lomba
              </p>

              <a
                href="https://wa.me/6281328872526"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-primary flex items-center px-4 py-2 rounded-md font-sans text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <Phone className="w-3 h-3 text-primary" />
                </span>
                0813-2887-2526
              </a>
            </div>

          </div>

        </div>
      </main>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
      />

      {/* Confirm Pop Up */}
      <ConfirmPopup
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}