"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { EntryPaymentModal } from "@/components/ui/EntryPaymentModal";
import { ArrowLeft, Trophy, X, User } from "lucide-react";
import RegistrationStage from "@/components/competition/participant/RegistrationStage";
import SubmissionStage from "@/components/competition/participant/SubmissionStage";
import Toast from "@/components/ui/Toast";
import ConfirmPopup from "@/components/ui/ConfirmPopup";
import PosterModal from '@/components/ui/PosterModal';
import { getProofImageUrl } from "@/services/url/getProofImage";

import { getPosterUrl } from "@/services/url/getPosterUrl";

export default function ParticipantCompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lombaId = params.competitionId as string;

  const [loading, setLoading] = useState(true);
  const [expandedTab, setExpandedTab] = useState<string>("");

  // States Data Database
  const [entryData, setEntryData] = useState<any>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [searchUsername, setSearchUsername] = useState("");
  const [invitations, setInvitations] = useState<any[]>([]);

  // States UI Interaktif
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  // STATE UNTUK TOAST
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000); // Toast akan hilang otomatis setelah 3 detik
  };

  // STATE UNTUK CONFIRM POPUP
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { }
  });

  useEffect(() => {
    if (lombaId) {
      fetchDetailLomba();

      const channel = supabase
        .channel(`competition-detail-${lombaId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "entries", filter: `entry_id=eq.${lombaId}` },
          () => {
            fetchDetailLomba();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "entry_members", filter: `entry_id=eq.${lombaId}` },
          () => {
            fetchDetailLomba();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "entry_payments", filter: `entry_id=eq.${lombaId}` },
          () => {
            fetchDetailLomba();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "stage_participants", filter: `entry_id=eq.${lombaId}` },
          () => {
            fetchDetailLomba();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "member_invitations", filter: `entry_id=eq.${lombaId}` },
          () => {
            fetchDetailLomba();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lombaId]);

  const fetchDetailLomba = async () => {
    setLoading(true);
    try {
      const { data: userAuth } = await supabase.auth.getUser();
      if (!userAuth.user) return;
      setCurrentUserId(userAuth.user.id);

      const { data: entry, error: entryError } = await supabase
        .from("entries")
        .select(`
          *,
          competitions ( *, events (*), entries (count), stages (*) ),
          entry_members ( *, participants (*) ),
          entry_payments (payment_id, order_id, status, proof_image, amount),
          stage_participants ( qualification_status, stages ( stage_name, stage_order ) ),
          member_invitations ( *, participants ( profile_id ) )
        `)
        .eq("entry_id", lombaId)
        .single();

      if (entryError || !entry) throw entryError;

      // Cek apakah user adalah member
      const isMember = entry.entry_members.some(
        (m: any) => m.participants?.profile_id === userAuth.user.id
      );

      // Definisikan compStages dan sps dari hasil query di atas
      const compStages = entry.competitions?.stages || [];
      const sps = entry.stage_participants || [];

      // Cari Tahap Lomba Aktif Berdasarkan Tanggal
      let activeStageOrder = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sortedStages = [...compStages].sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0));

      for (const stage of sortedStages) {
        if (stage.start_date) {
          const stageStartDate = new Date(stage.start_date + 'T00:00:00');
          stageStartDate.setHours(0, 0, 0, 0);
          if (today >= stageStartDate) {
            activeStageOrder = stage.stage_order;
          }
        }
      }

      // Cari Status dan Tahap Tertinggi Peserta Saat Ini
      let userHighestStageOrder = 0;
      let isUserEliminated = false;

      if (sps.length > 0) {
        const sortedSps = [...sps].sort((a, b) => (a.stages?.stage_order || 0) - (b.stages?.stage_order || 0));
        const lastSp = sortedSps[sortedSps.length - 1];

        userHighestStageOrder = lastSp.stages?.stage_order || 0;
        isUserEliminated = lastSp.qualification_status === 'eliminated';
      }

      // SECURITY CHECK
      if (
        !isMember ||
        entry.competitions?.status === 'end' ||
        (isUserEliminated && activeStageOrder > userHighestStageOrder)
      ) {
        router.push('/participant/competition');
        return;
      }

      const memberProfileIds = entry.entry_members.map((m: any) => m.participants?.profile_id).filter(Boolean);
      const invProfileIds = (entry.member_invitations || []).map((i: any) => i.participants?.profile_id).filter(Boolean);
      const allProfileIds = Array.from(new Set([...memberProfileIds, ...invProfileIds]));

      const { data: publicProfiles } = await supabase
        .from('public_profiles')
        .select('id, username, profile_image')
        .in('id', allProfileIds);

      const membersWithProfiles = entry.entry_members.map((m: any) => {
        const profileData = publicProfiles?.find((p: any) => p.id === m.participants?.profile_id);
        return {
          ...m,
          participants: { ...m.participants, profiles: profileData || null }
        };
      });

      const invitationsWithProfiles = (entry.member_invitations || []).map((inv: any) => {
        const profileData = publicProfiles?.find((p: any) => p.id === inv.participants?.profile_id);
        return {
          ...inv,
          participants: { ...inv.participants, profiles: profileData || null }
        };
      });

      setEntryData(entry);
      setCompetition(entry.competitions);
      setEventData(entry.competitions.events);
      setMembers(membersWithProfiles);
      setInvitations(invitationsWithProfiles);

      const payment = entry.entry_payments?.[0] || null;
      setPaymentData(payment);

      if (payment?.proof_image) {
        const leaderRecord = entry.entry_members.find((m: any) => m.participant_id === entry.leader_id);
        const leaderProfileId = leaderRecord?.participants?.profile_id;

        if (leaderProfileId) {
          const url = await getProofImageUrl('entry_payments', leaderProfileId, payment.proof_image);
          if (url) setProofImageUrl(url);
        }
      }

      const myMemberRecord = membersWithProfiles.find((m: any) => m.participants?.profile_id === userAuth.user?.id);
      if (myMemberRecord) setCurrentUserRole(myMemberRecord.role);

      const { data: stgs, error: stageError } = await supabase
        .from("stages")
        .select("*")
        .eq("competition_id", entry.competitions.competition_id)
        .order("stage_order", { ascending: true });

      if (stageError) throw stageError;

      // 1. Fetch Data Timelines & Stage Participants
      const stageIds = stgs.map((s: any) => s.stage_id);

      const { data: timelines } = await supabase
        .from("stage_timelines")
        .select("*")
        .in("stage_id", stageIds);

      const { data: stageParts } = await supabase
        .from("stage_participants")
        .select("*")
        .eq("entry_id", lombaId)
        .in("stage_id", stageIds);

      const now = new Date();

      // 2. Map Timeline & Participant ke tiap Stage
      let processedStages = (stgs || []).map((stage: any, index: number, arr: any[]) => {
        let isBlue = false;
        if (stage.status === 'ongoing') {
          isBlue = true;
        } else if (stage.status === 'completed') {
          const nextStage = arr[index + 1];
          if (nextStage && new Date(nextStage.start_date) > now) {
            isBlue = true;
          } else if (!nextStage) {
            isBlue = true;
          }
        }

        const stageTimelines = timelines?.filter(t => t.stage_id === stage.stage_id) || [];
        const stageParticipant = stageParts?.find(sp => sp.stage_id === stage.stage_id) || null;

        return { ...stage, isActiveUI: isBlue, stage_timelines: stageTimelines, stage_participant: stageParticipant };
      });

      // 3. Logika Auto-Eliminasi Jika Melewati Timeline Registrasi & Belum Bayar
      const regStageIndex = processedStages.findIndex((s: any) => s.stage_type === 'registration');
      if (regStageIndex !== -1) {
        const regStage = processedStages[regStageIndex];
        const regTimeline = regStage.stage_timelines.find((t: any) => t.timeline_type === 'registration');
        const sp = regStage.stage_participant;
        const hasPayment = !!payment?.proof_image;

        if (regTimeline && new Date(regTimeline.end_date) < now && !hasPayment && sp?.qualification_status !== 'eliminated') {
          const { data: upsertedSp } = await supabase
            .from('stage_participants')
            .upsert({
              stage_participant_id: sp?.stage_participant_id,
              stage_id: regStage.stage_id,
              entry_id: parseInt(lombaId),
              qualification_status: 'eliminated'
            }, { onConflict: 'stage_id, entry_id' })
            .select().single();

          processedStages[regStageIndex].stage_participant = upsertedSp;
        }
      }

      setStages(processedStages);

      const activeStage = processedStages.find((s: any) => s.isActiveUI);
      if (activeStage) setExpandedTab(activeStage.stage_id);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return "Belum Dimulai";
      case 'ongoing': return "Sedang Berjalan";
      case 'completed': return "Selesai";
      default: return status;
    }
  };

  const handleBayarMidtrans = async () => {
    if (isProcessingPay) return;
    setIsProcessingPay(true);

    try {
      const orderId = `INV-${lombaId}-${Date.now()}`;
      const amount = Math.round(competition.price || 0);

      // Simpan/Update data awal sebagai 'pending'
      if (paymentData?.payment_id) {
        const { error: updateError } = await supabase
          .from('entry_payments')
          .update({ order_id: orderId, amount: amount, status: 'pending' })
          .eq('payment_id', paymentData.payment_id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('entry_payments')
          .insert({
            order_id: orderId,
            competition_id: competition.competition_id,
            entry_id: parseInt(lombaId),
            amount: amount,
            status: 'pending'
          });
        if (insertError) throw insertError;
      }

      // Token Midtrans (Kirim username profil)
      const myProfile = members.find((m: any) => m.participants?.profile_id === currentUserId);
      const username = myProfile?.participants?.profiles?.username || "Peserta";

      const res = await fetch("/api/midtrans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: amount,
          first_name: username
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.token) throw new Error("Gagal mendapatkan token");

      // Panggil Popup Snap
      // @ts-ignore
      window.snap.pay(data.token, {
        onSuccess: async function () {
          await supabase
            .from('entry_payments')
            .update({ status: 'success' })
            .eq('order_id', orderId);

          showToast("Pembayaran berhasil! Silakan unggah bukti tangkapan layar.", "success");
          fetchDetailLomba();
        },
        onPending: function () {
          showToast("Menunggu pembayaran Anda.", "warning");
        },
        onError: function () {
          showToast("Pembayaran gagal.", "error");
        },
        onClose: function () {
          showToast("Popup ditutup sebelum pembayaran selesai.", "warning");
        }
      });

    } catch (error: any) {
      showToast(`Gagal: ${error.message}`, "error");
    } finally {
      setIsProcessingPay(false);
    }
  };

  const handleUploadBukti = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const leaderRecord = members.find((m: any) => m.role === 'leader');
      const leaderProfileId = leaderRecord?.participants?.profiles?.id;

      if (!leaderProfileId) throw new Error("Leader tim tidak ditemukan");

      const previewUrl = URL.createObjectURL(file);
      setUploadPreview(previewUrl);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `entry_payments/${leaderProfileId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // PASTIKAN DATA PEMBAYARAN SUDAH ADA
      if (paymentData?.payment_id) {
        const { error: updateError } = await supabase
          .from('entry_payments')
          .update({
            proof_image: filePath,
            status: 'success'
          })
          .eq('payment_id', paymentData.payment_id);

        if (updateError) throw updateError;
      } else {
        // Fallback keamanan jika user mencoba bypass UI
        throw new Error("Silakan lakukan pembayaran sistem terlebih dahulu sebelum mengunggah bukti.");
      }

      showToast("Bukti pembayaran berhasil diunggah!", "success");
      fetchDetailLomba();

    } catch (error: any) {
      showToast(`Gagal mengunggah bukti: ${error.message}`, "error");
      setUploadPreview(null);
    }
  };

  const searchUsersToInvite = async () => {
    if (!searchUsername) return;
    const { data: profiles, error: profileError } = await supabase
      .from('public_profiles')
      .select(`id, username, profile_image, email`)
      .eq('role_id', 4)
      .or(`username.ilike.%${searchUsername}%,email.ilike.%${searchUsername}%`)
      .limit(5);

    if (profileError || !profiles || profiles.length === 0) {
      setSearchResults([]);
      return;
    }

    const profileIds = profiles.map((p: any) => p.id);
    const { data: participants, error: partError } = await supabase
      .from('participants')
      .select('participant_id, profile_id, country')
      .in('profile_id', profileIds);

    if (partError) return;

    const formattedData = profiles.map((user: any) => {
      const partData = participants?.find((p: any) => p.profile_id === user.id);
      return {
        profile_id: user.id,
        username: user.username,
        profile_image: user.profile_image,
        email: user.email,
        country: partData?.country,
        participant_id: partData?.participant_id
      };
    }).filter((u: any) => u.participant_id);

    setSearchResults(formattedData);
  };

  const handleInviteMember = async (participantId: number) => {
    if (members.length >= competition.team_size_max) return alert("Tim sudah mencapai batas maksimal!");

    // Check if there is already a pending invitation for this participant in this entry
    const hasPending = invitations.some((inv: any) => inv.participant_id === participantId && inv.status === 'pending');
    if (hasPending) {
      showToast("Undangan untuk peserta ini sudah dikirim.", "warning");
      return;
    }

    const { error } = await supabase
      .from('member_invitations')
      .insert({
        entry_id: parseInt(lombaId),
        participant_id: participantId,
        status: 'pending'
      });

    if (error) {
      showToast("Gagal mengirim undangan.", "error");
    } else {
      showToast("Undangan berhasil dikirim!", "success");
      setIsInviteModalOpen(false);
      fetchDetailLomba();
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Batalkan Undangan?",
      message: "Apakah Anda yakin ingin membatalkan undangan untuk peserta ini?",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        const { error } = await supabase.from('member_invitations').delete().eq('invitation_id', invitationId);
        if (error) {
          showToast("Gagal membatalkan undangan.", "error");
        } else {
          showToast("Undangan berhasil dibatalkan.", "success");
          fetchDetailLomba();
        }
      }
    });
  };

  const handleKickMember = async (memberId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Anggota Tim?",
      message: "Apakah Anda yakin ingin menghapus peserta ini dari tim?",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        const { error } = await supabase.from('entry_members').delete().eq('member_id', memberId);
        if (error) {
          showToast("Gagal menghapus anggota.", "error");
        } else {
          showToast("Anggota berhasil dihapus.", "success");
          fetchDetailLomba();
        }
      }
    });
  };

  const handleBatalLomba = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Batal Ikut Lomba?",
      message: "Apakah Anda yakin ingin membatalkan keikutsertaan lomba ini?\nJika Anda sudah melakukan pembayaran, uang tidak dapat di-refund.",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        try {
          await supabase.from('entry_members').delete().eq('entry_id', lombaId);
          await supabase.from('stage_participants').delete().eq('entry_id', lombaId);
          await supabase.from('entry_payments').delete().eq('entry_id', lombaId);
          const { error } = await supabase.from('entries').delete().eq('entry_id', lombaId);
          if (error) throw error;

          showToast("Berhasil membatalkan lomba.", "success");
          setTimeout(() => router.push('/participant/home'), 1500);
        } catch (error) {
          showToast("Terjadi kesalahan saat membatalkan lomba.", "error");
          console.error(error);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-5 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white text-foreground">
      <main className="flex-1 flex flex-col w-full">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors cursor-pointer mb-5 w-fit">
          <ArrowLeft size={20} />
          <span className="font-sans text-s font-medium">Kembali</span>
        </button>

        {/* BANNER */}
        <div className="relative h-[240px] rounded-2xl overflow-hidden shadow-sm mb-6 bg-gray-100 border border-gray-200">
          <PosterModal
            src={getPosterUrl(eventData?.poster)}
            alt="Banner Lomba"
          />
        </div>

        {/* ACCORDION TAHAPAN */}
        <div className="space-y-4 mb-8">
          {stages.map((tahap) => (
            <div key={tahap.stage_id} className="flex flex-col">
              <div
                onClick={() => setExpandedTab(expandedTab === tahap.stage_id ? "" : tahap.stage_id)}
                className={`px-6 py-4 rounded-xl flex justify-between items-center border transition-all cursor-pointer ${tahap.isActiveUI
                  ? "bg-primary text-white border-transparent shadow-md"
                  : "bg-[#E0E0E0] text-gray-500 border-gray-300"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Trophy size={18} className={tahap.isActiveUI ? "text-white" : "text-gray-400"} />
                  <span className="font-sans font-bold text-sm tracking-wide">{tahap.stage_name}</span>
                </div>
                <span className={`font-sans text-sm font-semibold px-3 py-1 rounded-full ${tahap.isActiveUI ? "bg-black/10 text-white" : "bg-gray-300 text-gray-600"
                  }`}>
                  {getStatusLabel(tahap.status)}
                </span>
              </div>

              {expandedTab === tahap.stage_id && (
                <div className="mt-6 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">

                  {/* RENDER KOMPONEN BERDASARKAN STAGE_TYPE */}
                  {tahap.stage_type === 'registration' && (
                    <RegistrationStage
                      competition={competition}
                      eventData={eventData}
                      tahap={tahap}
                      paymentData={paymentData}
                      uploadPreview={uploadPreview}
                      proofImageUrl={proofImageUrl}
                      members={members}
                      invitations={invitations}
                      currentUserRole={currentUserRole}
                      currentUserId={currentUserId}
                      fileInputRef={fileInputRef}
                      handleUploadBukti={handleUploadBukti}
                      handleKickMember={handleKickMember}
                      handleCancelInvitation={handleCancelInvitation}
                      setIsInviteModalOpen={setIsInviteModalOpen}
                      setIsPaymentModalOpen={setIsPaymentModalOpen}
                      handleBatalLomba={handleBatalLomba}
                      handleBayarMidtrans={handleBayarMidtrans}
                      isProcessingPay={isProcessingPay}
                    />
                  )}

                  {(tahap.stage_type === 'submission' || tahap.stage_type === 'final') && (
                    <SubmissionStage
                      tahap={tahap}
                      competition={competition}
                      currentUserId={currentUserId}
                      eventData={eventData}
                      entryData={entryData}
                      members={members}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* MODAL INVITE */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Tambah Anggota Tim</h3>
              <button onClick={() => setIsInviteModalOpen(false)}><X size={22} /></button>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Cari username peserta..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-3 text-sm"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
              />
              <button onClick={searchUsersToInvite} className="bg-[#1E62FF] text-white px-3 py-2 rounded-lg">Cari</button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map(user => {
                const isAlreadyInTeam = members.some((m: any) => m.participants?.profile_id === user.profile_id);
                const hasPendingInvite = invitations.some((inv: any) => inv.participant_id === user.participant_id && inv.status === 'pending');

                return (
                  <div key={user.profile_id} className="flex justify-between items-center border border-gray-100 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                        {user.profile_image ? (
                          <img src={supabase.storage.from('profiles').getPublicUrl(`participants/${user.profile_image}`).data.publicUrl} alt="Profil" className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className="m-auto mt-2 text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-gray-800">{user.username}</p>
                        {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
                        {user.country && <p className="text-xs text-gray-400">{user.country}</p>}
                      </div>
                    </div>

                    {isAlreadyInTeam ? (
                      <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded shrink-0">Sudah di Tim</span>
                    ) : hasPendingInvite ? (
                      <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 shrink-0">Undangan Dikirim</span>
                    ) : (
                      <button onClick={() => handleInviteMember(user.participant_id)} className="text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md font-semibold text-blue-600 transition-colors shrink-0">
                        Tambah
                      </button>
                    )}
                  </div>
                );
              })}
              {searchResults.length === 0 && searchUsername && <p className="text-sm text-center text-gray-400 mt-4">Ketik nama dan klik cari</p>}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENDAFTARAN */}
      <EntryPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        competitionData={competition}
        eventData={eventData}
        paymentData={paymentData}
      />

      {/* TOAST NOTIFICATION */}
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* CONFIRM POPUP */}
      <ConfirmPopup
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}