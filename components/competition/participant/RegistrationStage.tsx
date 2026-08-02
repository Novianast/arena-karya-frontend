"use client";

import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  Hourglass, FileText, CheckCircle2, X, AlertTriangle, 
  UploadCloud, Sparkles, CreditCard, UserPlus
} from "lucide-react";

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-[170px_10px_1fr] gap-2">
    <span className="text-gray-500">{label}</span>
    <span>:</span>
    <span className="font-semibold text-gray-800">{value}</span>
  </div>
);

export default function RegistrationStage({
  competition, eventData, tahap, paymentData, uploadPreview, proofImageUrl,
  members, invitations, currentUserRole, currentUserId, fileInputRef,
  handleUploadBukti, handleKickMember, handleCancelInvitation, setIsInviteModalOpen, setIsPaymentModalOpen,
  handleBatalLomba, // Menerima prop batal lomba
  handleBayarMidtrans,
  isProcessingPay
}: any) {
  
  // Dapatkan timeline tipe 'registration' untuk batas waktu pembayaran
  const registrationTimeline = tahap.stage_timelines?.find((t: any) => t.timeline_type === 'registration');
  const paymentEndDateObj = new Date(registrationTimeline?.end_date || tahap.end_date); // Deadline Bayar
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stageStartDateObj = new Date(tahap.start_date);
  stageStartDateObj.setHours(0, 0, 0, 0);
  const stageEndDateObj = new Date(tahap.end_date); // Deadline Stage (Untuk Invite)
  stageEndDateObj.setHours(0, 0, 0, 0);

  const diffTime = paymentEndDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isPaymentExpired = today > paymentEndDateObj;
  const isStageNotStarted = today < stageStartDateObj;
  const isStageExpired = today >= stageEndDateObj;

  const hasProof = !!uploadPreview || !!paymentData?.proof_image;
  const isVerified = paymentData?.status === 'verified';
  const isEliminated = tahap.stage_participant?.qualification_status === 'eliminated';

  // Pembayaran Midtrans dianggap selesai jika statusnya success atau verified
  const isPaidViaMidtrans = paymentData?.status === 'success' || paymentData?.status === 'verified';

  // Aksi bayar & batal dinonaktifkan jika waktu bayar habis, tereliminasi, sudah diverifikasi, atau Stage Start Date belum dimulai
  const isActionDisabled = isPaymentExpired || isVerified || isEliminated || isStageNotStarted;

  // Aksi tim (Invite & Kick) dinonaktifkan jika Stage Start Date belum dimulai, Stage End Date habis, tereliminasi, atau sudah diverifikasi
  const isTeamActionDisabled = isStageExpired || isVerified || isEliminated || isStageNotStarted;

  const sortedMembers = [...members].sort((a, b) => {
    if (a.participants?.profiles?.id === currentUserId) return -1;
    if (b.participants?.profiles?.id === currentUserId) return 1;
    return 0;
  });

  // Helper competition type
  const getParticipantText = (competition: any) => {
    return competition?.type === 'team'
      ? `Tim`
      : ``;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8">
      {/* Kolom Kiri: Deskripsi, Detail, Timeline */}
      <div className="space-y-6">
        
        {/* Banner Eliminasi */}
        {isEliminated && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 items-center shadow-sm">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-red-700 text-lg">{getParticipantText(competition)} Anda Telah Dieliminasi</h3>
              <p className="text-sm text-red-600 mt-1">{getParticipantText(competition)} Anda gagal mengikuti tahapan lomba karena tidak mengirimkan bukti pembayaran hingga batas waktu yang ditentukan.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Deskripsi Lomba</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{competition?.description}</p>
        </div>

        {/* Info Lomba */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Detail Tahapan Lomba</h2>
          <div className="space-y-3 text-sm">
            <DetailItem label="Tanggal Mulai" value={new Date(tahap.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <DetailItem label="Tanggal Akhir" value={new Date(tahap.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
            {competition?.type === 'team' && (
              <>
                <DetailItem label="Min Peserta" value={`${competition.team_size_min} Orang`} />
                <DetailItem label="Max Peserta" value={`${competition.team_size_max} Orang`} />
              </>
            )}
            <DetailItem label="Total Pendaftar Lomba" value={competition?.type === 'team' ? `${competition?.entries?.[0]?.count || 0} Tim` : `${competition?.entries?.[0]?.count || 0} Orang`} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-lg mb-6">Timeline Lomba</h2>
          <div className="space-y-0">
            {/* CheckCircle / Pending mengikuti value paymentData */}
            {[
              {
                title: "Pendaftaran & Registrasi",
                desc: `${getParticipantText(competition)} Peserta Melakukan Pendaftaran`,
                icon: <CheckCircle2 size={18} strokeWidth={2.5} />,
                status: "done"
              },
              {
                title: "Pengiriman Bukti",
                desc: `${getParticipantText(competition)} Peserta Mengirimkan Bukti Pembayaran`,
                icon: <UploadCloud size={18} strokeWidth={2.5} />,
                status: paymentData?.proof_image ? "done" : (isEliminated ? "error" : "current")
              },
              {
                title: "Verifikasi Bukti",
                desc: "Panitia sedang melakukan verifikasi",
                icon: <Sparkles size={18} strokeWidth={2.5} />,
                status: paymentData?.status === 'verified' ? "done" : (paymentData?.status === 'rejected' || isEliminated ? "error" : (paymentData?.proof_image ? "current" : "upcoming"))
              }
            ].map((item, idx, arr) => {
              const isLast = idx === arr.length - 1;
              const isDone = item.status === "done";
              const isCurrent = item.status === "current";
              const isUpcoming = item.status === "upcoming";
              const isError = item.status === "error";

              const iconBg = (isDone || isCurrent) ? "bg-primary text-white shadow-sm" : "bg-gray-50 text-gray-400 border border-gray-200";
              const lineColor = (isDone || isCurrent) ? "bg-primary" : "bg-transparent";

              return (
                <div key={idx} className="flex gap-5 min-h-[85px]">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-[42px] h-[42px] rounded-full flex justify-center items-center z-10 ${iconBg}`}>
                      {item.icon}
                    </div>
                    {!isLast && <div className={`w-[3px] flex-1 my-1 rounded-full ${lineColor}`} />}
                  </div>

                  <div className="flex-1 pt-2 flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-sans font-bold text-sm text-gray-900">{item.title}</h3>
                      <p className="font-sans text-sm text-gray-400 mt-0.5">{item.desc}</p>
                      {isError && paymentData?.status === 'rejected' && <p className="text-sm font-bold text-red-500 mt-1">Ditolak - Harap kirim ulang bukti</p>}
                    </div>

                    <div className="shrink-0 mt-1 flex items-center">
                      {isDone && <CheckCircle2 className="text-[#10B981]" size={22} strokeWidth={2.5} />}
                      {isCurrent && !isError && <div className="w-5 h-5 rounded-full bg-[#F59E0B] flex items-center justify-center shadow-sm"><span className="text-xs text-white font-extrabold leading-none pb-1 tracking-widest">...</span></div>}
                      {isUpcoming && !isError && <div className="w-5 h-5 rounded-full border-2 border-gray-200" />}
                      {isError && <X className="text-white bg-red-500 rounded-full p-0.5" size={20} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Dokumen, Pembayaran, Anggota */}
      <div className="space-y-6">
        {/* Dokumen */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-black" /> Dokumen Lomba
          </h2>
          <div onClick={() => competition?.guidebook_url && window.open(supabase.storage.from("competitions").getPublicUrl(`guidebooks/${competition.guidebook_url}`).data.publicUrl)} className="border border-gray-200 rounded-xl flex justify-between items-stretch hover:shadow-md transition-shadow cursor-pointer overflow-hidden group">
            <div className="p-4 flex-1 flex flex-col justify-center">
              <h3 className="text-sm font-bold text-gray-800 underline decoration-gray-400 underline-offset-4 group-hover:text-blue-600 transition-colors">Aturan Lomba {competition?.competition_name || "Lomba"}</h3>
              <p className="text-sm font-semibold text-gray-400 mt-1.5">PDF</p>
            </div>
            <div className="w-24 bg-gray-900 relative shrink-0">
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <FileText className="text-white/40" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Pembayaran */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-lg text-blue-600 mb-1">Bayar Pendaftaran</h2>
          <p className="text-sm text-gray-500 mb-4">Silahkan lakukan pembayaran untuk melanjutkan Lomba</p>

          {isPaymentExpired && !isVerified ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center justify-center shadow-inner">
              <p className="font-bold text-lg text-red-600">Batas waktu pengiriman bukti telah ditutup</p>
            </div>
          ) : (
            <div className="bg-[#FFFDF0] border border-[#F0E6A0] rounded-xl p-4 mb-4 relative">
              <div className="flex justify-between items-end border-b border-dashed border-[#F0E6A0] pb-3 mb-3 relative">
                <div className="absolute -left-5 bottom-[-8px] w-4 h-4 bg-white rounded-full border-r border-[#F0E6A0]"></div>
                <div className="absolute -right-5 bottom-[-8px] w-4 h-4 bg-white rounded-full border-l border-[#F0E6A0]"></div>
                <div><p className="font-bold text-s text-gray-800">Total</p><p className="text-xs text-gray-500">Harga Akumulasi</p></div>
                <h3 className="font-bold text-lg text-gray-900">Rp {competition?.price?.toLocaleString('id-ID')}</h3>
              </div>
              <div className="flex justify-between items-center">
                <div><p className="font-bold text-s text-gray-800">Deadline Registrasi</p><p className="text-xs text-gray-500">Biaya Harus Dibayar Sebelum Batas Waktu Berakhir</p></div>
                <div className="bg-[#F9F0B3] px-3 py-1.5 rounded-md text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Hourglass size={12} className="text-gray-700" />
                  {diffDays > 0 ? `${diffDays} Hari` : (diffDays === 0 ? 'Hari Ini' : 'Lewat')} | {paymentEndDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
              <p className="text-s font-semibold mb-2"><span style={{ color: 'red' }} className="text-sm align-middle"> *</span> Harap diperhatikan, biaya pendaftaran yang sudah dibayarkan tidak dapat dikembalikan dalam kondisi apa pun.</p>
          </div>

          {hasProof && (
            <div className={`text-sm font-medium p-3 rounded-lg mb-4 flex items-start gap-2 border ${isVerified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
              {isVerified ? <CheckCircle2 size={14} className="shrink-0 mt-[1px] text-green-600" /> : <Hourglass size={14} className="shrink-0 mt-[1px] text-yellow-600" />}
              <p>{isVerified ? "Pembayaran telah diverifikasi. Proses pendaftaran selesai." : "Bukti pembayaran telah terkirim. Panitia akan segera melakukan verifikasi."}</p>
            </div>
          )}

          {hasProof && (
            <div className="mb-4">
              <p className="text-s font-semibold mb-2">Preview Bukti:</p>
              <div className="w-full h-40 relative bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden p-2">
                {uploadPreview || proofImageUrl ? (
                  <img src={uploadPreview || proofImageUrl} alt="Bukti Pembayaran" className="max-w-full max-h-full object-contain rounded-md" />
                ) : (
                  <p className="text-sm text-gray-400 font-medium text-center">
                    Gambar tidak dapat dimuat atau<br/>Bukti telah diunggah oleh Ketua Tim
                  </p>
                )}
              </div>
            </div>
          )}

          <input type="file" className="hidden" ref={fileInputRef} onChange={handleUploadBukti} accept="image/*" disabled={isActionDisabled} />

          <div className="grid grid-cols-2 gap-3">
            {/* Tombol Bayar Midtrans */}
            <button 
              disabled={isActionDisabled || isPaidViaMidtrans || isProcessingPay} 
              onClick={handleBayarMidtrans} 
              className={`text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${(isActionDisabled || isPaidViaMidtrans || isProcessingPay) ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-[#3B71CA] hover:bg-blue-700 text-white shadow-sm'}`}
            >
              <CreditCard size={14} /> 
              {isPaidViaMidtrans ? "Tagihan Lunas" : (isProcessingPay ? "Memproses..." : "Bayar Pendaftaran")}
            </button>

            {/* Tombol Kirim Bukti */}
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={paymentData?.status === 'verified' || (!isPaidViaMidtrans && paymentData?.status !== 'rejected')} 
              className={`text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${(paymentData?.status === 'verified' || (!isPaidViaMidtrans && paymentData?.status !== 'rejected')) ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-[#3B71CA] hover:bg-blue-700 text-white shadow-sm'}`}
            >
              {paymentData?.status === 'verified' ? (
                <><CheckCircle2 size={14} /> Bukti Diterima</>
              ) : (
                <><UploadCloud size={14} /> {hasProof ? "Kirim Ulang Bukti" : "Kirim Bukti"}</>
              )}
            </button>
          </div>
        </div>

        {/* Manajemen Anggota */}
        {competition?.type === 'team' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Peserta Tim ({members.length}/{competition?.team_size_max})</h2>
              {currentUserRole === 'leader' && (
                <button 
                  onClick={() => setIsInviteModalOpen(true)} 
                  disabled={isTeamActionDisabled}
                  className={`text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm ${isTeamActionDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" : "bg-[#FFD02F] hover:bg-[#e6ba25] text-gray-900"}`}
                >
                  <UserPlus size={20} /> Invite Peserta
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {sortedMembers.map((m: any) => (
                <div key={m.member_id} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative">
                    <Image src={m.participants?.profiles?.profile_image ? supabase.storage.from("profiles").getPublicUrl(`participants/${m.participants.profiles.profile_image}`).data.publicUrl : "/images/default-avatar.png"} alt="Profil" fill className="object-cover" />
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate text-gray-800">{m.participants?.profiles?.username || 'Peserta'} {m.role === 'leader' ? '(Ketua)' : ''}</span>
                  {currentUserRole === 'leader' && m.role !== 'leader' && !isTeamActionDisabled && (
                    <button onClick={() => handleKickMember(m.member_id)} className="text-red-400 hover:text-red-600 ml-1"><X size={20} /></button>
                  )}
                </div>
              ))}

              {/* Kartu Undangan dengan Warna Status */}
              {(invitations || []).map((inv: any) => {
                const isPending = inv.status === 'pending';
                const isRejected = inv.status === 'rejected';
                const isAccepted = inv.status === 'accepted';

                // Jika sudah accepted dan sudah masuk members, skip
                if (isAccepted) return null;

                const cardClass = isPending
                  ? 'bg-yellow-100 border-yellow-400'
                  : isRejected
                  ? 'bg-red-50 border-red-300'
                  : 'bg-white border-gray-200';

                const badgeClass = isPending
                  ? 'text-yellow-800 bg-yellow-200'
                  : isRejected
                  ? 'text-red-700 bg-red-100'
                  : 'text-gray-600 bg-gray-100';

                const badgeLabel = isPending ? 'Menunggu' : isRejected ? 'Ditolak' : inv.status;

                return (
                  <div key={inv.invitation_id} className={`flex items-center gap-2 border px-4 py-2 rounded-xl shadow-sm ${cardClass}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative shrink-0">
                      <Image 
                        src={inv.participants?.profiles?.profile_image ? supabase.storage.from("profiles").getPublicUrl(`participants/${inv.participants.profiles.profile_image}`).data.publicUrl : "/images/default-avatar.png"} 
                        alt="Profil" 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium max-w-[120px] truncate text-gray-800">
                        {inv.participants?.profiles?.username || 'Peserta'}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded w-fit mt-0.5 ${badgeClass}`}>{badgeLabel}</span>
                    </div>
                    {isPending && currentUserRole === 'leader' && !isTeamActionDisabled && (
                      <button onClick={() => handleCancelInvitation(inv.invitation_id)} className="text-yellow-600 hover:text-yellow-800 ml-1"><X size={20} /></button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Batal Lomba */}
        <button 
          onClick={handleBatalLomba}
          disabled={isActionDisabled}
          className={`w-full text-sm font-semibold py-3 rounded-xl flex justify-center items-center gap-2 transition ${isActionDisabled ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white border border-red-500'}`}
        >
          <AlertTriangle size={14} /> Batal Ikut Lomba
        </button>
      </div>
    </div>
  );
}