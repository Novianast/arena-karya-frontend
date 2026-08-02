"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileText, CheckCircle2, AlertTriangle, UploadCloud,
  X, Upload, File, Clock, XCircle, Trophy, Sparkles,
  Hourglass
} from "lucide-react";
import Image from "next/image";
import { UploadKaryaModal } from "@/components/ui/UploadKaryaModal";

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-[170px_10px_1fr] gap-2">
    <span className="text-gray-500">{label}</span>
    <span>:</span>
    <span className="font-semibold text-gray-800">{value}</span>
  </div>
);

export default function SubmissionStage({ tahap, competition, currentUserId, eventData, entryData, members }: any) {
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [awardData, setAwardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stageParticipant, setStageParticipant] = useState<any>(tahap.stage_participant);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [signedFileUrl, setSignedFileUrl] = useState<string | null>(null);

  // Certificate
  const [signedCertificateUrl, setSignedCertificateUrl] = useState<string | null>(null);

  // isFinal
  const isFinal = tahap.stage_type === 'final';

  // Timelines
  const submissionTl = tahap.stage_timelines?.find((t: any) => t.timeline_type === 'submission');
  const judgingTl = tahap.stage_timelines?.find((t: any) => t.timeline_type === 'judging');
  const announcementTl = tahap.stage_timelines?.find((t: any) => t.timeline_type === 'announcement');
  const awardTl = tahap.stage_timelines?.find((t: any) => t.timeline_type === 'award');

  // Time
  const today = new Date();
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const submissionStartDateObj = new Date(submissionTl?.start_date || tahap.start_date);
  submissionStartDateObj.setHours(0, 0, 0, 0);

  // Helper Selisih Hari Pengumuman
  const submissionEndDateObj = new Date(submissionTl?.end_date || tahap.end_date);
  submissionEndDateObj.setHours(0, 0, 0, 0);
  const diffSubTime = submissionEndDateObj.getTime() - todayMidnight.getTime();
  const diffSubDays = Math.ceil(diffSubTime / (1000 * 60 * 60 * 24));

  const isSubmissionNotStarted = today < submissionStartDateObj;
  const isSubmissionExpired = today > submissionEndDateObj;
  const isEliminated = stageParticipant?.qualification_status === 'eliminated';
  const isQualified = stageParticipant?.qualification_status === 'qualified';

  // Helper Selisih Hari Pengumuman
  const announcementStartDateObj = new Date(announcementTl?.start_date || tahap.end_date);
  announcementStartDateObj.setHours(0, 0, 0, 0);
  const diffAnnTime = announcementStartDateObj.getTime() - todayMidnight.getTime();
  const diffAnnDays = Math.ceil(diffAnnTime / (1000 * 60 * 60 * 24));

  // Helper Selisih Hari Penghargaan
  const awardStartDateObj = new Date(awardTl?.start_date || tahap.end_date);
  awardStartDateObj.setHours(0, 0, 0, 0);
  const diffAwardTime = awardStartDateObj.getTime() - todayMidnight.getTime();
  const diffAwardDays = Math.ceil(diffAwardTime / (1000 * 60 * 60 * 24));

  // Member
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

  useEffect(() => {
    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('stage_id', tahap.stage_id)
        .eq('entry_id', entryData.entry_id)
        .maybeSingle();

      if (data) {
        setSubmissionData(data);
        // Meminta URL aman (Signed URL) yang berlaku selama 1 jam
        if (data.file_url) {
          const { data: signedData } = await supabase.storage
            .from('submissions')
            .createSignedUrl(data.file_url, 60 * 60);
          if (signedData) setSignedFileUrl(signedData.signedUrl);
        }
      }

      // Jika Stage Final, Fetch Data Penghargaan/Awards
      if (isFinal) {
        const { data: awardRes } = await supabase
          .from('awards')
          .select('*, award_categories(category_name)')
          .eq('entry_id', entryData.entry_id)
          .maybeSingle();

        if (awardRes) {
          setAwardData(awardRes);
          if (awardRes.certificate_file_path) {
            const { data: signedCert } = await supabase.storage
              .from('certificates')
              .createSignedUrl(awardRes.certificate_file_path, 60 * 60);
            if (signedCert) setSignedCertificateUrl(signedCert.signedUrl);
          }
        }
      }

      // Auto Eliminate jika lewat batas waktu dan belum submit
      if (!data && isSubmissionExpired && stageParticipant?.qualification_status !== 'eliminated') {
        const { data: updatedSp } = await supabase
          .from('stage_participants')
          .upsert({
            stage_participant_id: stageParticipant?.stage_participant_id,
            stage_id: tahap.stage_id,
            entry_id: entryData.entry_id,
            qualification_status: 'eliminated'
          }, { onConflict: 'stage_id, entry_id' })
          .select().single();

        if (updatedSp) setStageParticipant(updatedSp);
      }
    } catch (error) {
      console.log("Belum ada submission atau error fetch");
    } finally {
      setLoading(false);
    }
  };

  // Helper status timeline
  const getTimelineStatus = (tl: any) => {
    if (!tl) return "upcoming";
    const start = new Date(tl.start_date);
    const end = new Date(tl.end_date);
    if (today < start) return "upcoming";
    if (today >= start && today <= end) return "current";
    return "done";
  };

  const subStatus = submissionData ? "done" : (isEliminated ? "error" : getTimelineStatus(submissionTl));
  const judStatus = getTimelineStatus(judgingTl);
  const annStatus = getTimelineStatus(announcementTl);
  const awdStatus = getTimelineStatus(awardTl);

  const hasAward = !!awardData;
  const rankTitle = hasAward ? awardData.award_categories?.category_name : "Finalis";

  // Konfigurasi Item Timeline Dasar
  const timelineItems = [
    {
      title: "Pengiriman Karya",
      desc: `${getParticipantText(competition)} Peserta Mengirimkan Karya terbaik Mereka ke Website`,
      status: subStatus,
      icon: <UploadCloud size={18} strokeWidth={2.5} />
    },
    {
      title: "Penjurian",
      desc: `Juri Menilai Karya dari ${getParticipantText(competition)} Peserta yang Telah Dikirim`,
      status: judStatus,
      icon: <FileText size={18} strokeWidth={2.5} />
    },
    {
      title: isFinal ? "Pengumuman Pemenang" : "Pengumuman",
      desc: isFinal ? "Pengumuman Pemenang Lomba" : `Pengumuman Kelulusan ${getParticipantText(competition)} Peserta`,
      status: annStatus,
      icon: <CheckCircle2 size={18} strokeWidth={2.5} />
    }
  ];

  // Tambah item 'Penghargaan' jika stage_type = final
  if (isFinal) {
    timelineItems.push({
      title: "Pemberian Penghargaan",
      desc: "Panitia memberikan Penghargaan pemenang Lomba",
      status: awdStatus,
      icon: <Sparkles size={18} strokeWidth={2.5} />
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-5 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8">
      {/* Kolom Kiri: Deskripsi, Detail, Timeline */}
      <div className="space-y-6">
        {/* Banner Eliminasi */}
        {isEliminated && !submissionData && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 items-center shadow-sm">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-red-700 text-lg">{getParticipantText(competition)} Anda Telah Dieliminasi</h3>
              <p className="text-sm text-red-600 mt-1">{getParticipantText(competition)} Anda melewati batas waktu pengiriman karya.</p>
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

        {/* TIMELINE STAGE */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-lg mb-6">Timeline Lomba</h2>
          <div className="space-y-0">
            {timelineItems.map((item, idx, arr) => {
              const isLast = idx === arr.length - 1;
              const isDone = item.status === "done";
              const isCurrent = item.status === "current";
              const isUpcoming = item.status === "upcoming";
              const isError = item.status === "error";

              const iconBg = (isDone || isCurrent) ? "bg-primary text-white shadow-sm" : "bg-gray-50 text-gray-400 border border-gray-200";
              const lineColor = (isDone || isCurrent) ? "bg-primary" : "bg-gray-200";

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
                      {isError && idx === 0 && <p className="text-sm font-bold text-red-500 mt-1">Dieliminasi - Melewati batas waktu</p>}
                    </div>

                    <div className="shrink-0 mt-1 flex items-center">
                      {isDone && <CheckCircle2 className="text-[#10B981]" size={22} strokeWidth={2.5} />}
                      {isCurrent && !isError && (
                        <div className="w-5 h-5 rounded-full bg-[#F59E0B] flex items-center justify-center shadow-sm">
                          <span className="text-xs text-white font-extrabold leading-none pb-1 tracking-widest">...</span>
                        </div>
                      )}
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

      {/* Kolom Kanan: Dokumen, Upload Karya, Anggota */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={18} /> Dokumen Lomba
          </h2>
          <div
            onClick={() => competition?.guidebook_url && window.open(supabase.storage.from("competitions").getPublicUrl(`guidebooks/${competition.guidebook_url}`).data.publicUrl)}
            className="border border-gray-200 rounded-xl flex justify-between items-stretch hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
          >
            <div className="p-5 flex-1 flex flex-col justify-center">
              <h3 className="text-sm font-bold text-gray-800 underline decoration-gray-400 underline-offset-4 group-hover:text-primary transition-colors">Aturan Lomba {competition?.competition_name}</h3>
              <p className="text-sm font-semibold text-gray-400 mt-1.5">PDF</p>
            </div>
            <div className="w-24 bg-gray-900 relative shrink-0">
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <FileText className="text-white/40" size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* CARD PENGIRIMAN KARYA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {!submissionData ? (
            // BELUM UPLOAD
            <div className="p-6">
              <h2 className="font-bold text-lg text-primary">Unggah Karya</h2>
              <p className="text-sm text-primary mb-6">Silahkan unggah karya {getParticipantText(competition)} Anda sesuai dengan ketentuan lomba</p>

              <div className="border-t border-gray-100 pt-5 flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-s text-gray-900">Deadline</h3>
                  <p className="text-sm text-gray-500">Karya harus diunggah sebelum waktu:</p>
                </div>
                <div className="bg-[#D1E4FF] px-3 py-1.5 rounded-lg text-sm font-bold text-primary flex items-center gap-1.5">
                  <Hourglass size={14} />
                  {diffSubDays > 0 ? `${diffSubDays} Hari` : (diffSubDays === 0 ? 'Hari Ini' : 'Lewat')} | {submissionEndDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              <button
                disabled={isSubmissionExpired || isEliminated || isSubmissionNotStarted}
                onClick={() => setIsModalOpen(true)}
                className={`w-full py-3 rounded-lg flex justify-center items-center gap-2 font-bold text-sm transition-colors ${isSubmissionExpired || isEliminated
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-blue-700 text-white shadow-md"
                  }`}
              >
                <Upload size={18} /> {isSubmissionNotStarted ? "Belum Dimulai" : "Upload Karya"}
              </button>
            </div>
          ) : (
            // SUDAH UPLOAD (PREVIEW)
            <div className="p-6">
              <h2 className="font-bold text-lg text-primary">Unggah Karya</h2>
              <p className="text-sm text-primary mb-6">Karya {getParticipantText(competition)} Anda telah diunggah</p>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <div>
                  <h3 className="font-bold text-s text-gray-900">{submissionData.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{submissionData.description || "Tidak ada deskripsi"}</p>
                </div>

                {submissionData.file_url && (
                  <div
                    onClick={() => signedFileUrl && window.open(signedFileUrl, '_blank')}
                    className="border border-gray-200 rounded-xl flex justify-between items-stretch cursor-pointer hover:shadow-md transition-shadow overflow-hidden group"
                  >
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-primary transition-colors">{submissionData.file_url.split('/').pop()}</p>
                      <p className="text-sm text-gray-400 mt-0.5">Berkas Terunggah (Klik untuk buka)</p>
                    </div>
                    <div className="w-24 bg-gray-800 relative shrink-0">
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <File size={28} className="text-white/40" />
                      </div>
                    </div>
                  </div>
                )}

                {submissionData.link_url && (
                  <div>
                    <h4 className="font-bold text-s mb-1">Link Pendukung</h4>
                    <a href={submissionData.link_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all">
                      {submissionData.link_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CARD PENGUMUMAN (Tampil jika sudah upload) */}
        {submissionData && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {annStatus === "upcoming" || stageParticipant?.qualification_status === 'pending' ? (
              // Countdown Pengumuman
              <div className="p-6">
                <h2 className="font-bold text-lg text-primary">{isFinal ? "Pengumuman Pemenang" : "Pengumuman Kelulusan"}</h2>
                <p className="text-sm text-primary mb-6">{isFinal ? "Mohon menunggu pengumuman pemenang" : "Mohon menunggu pengumuman kelulusan"}</p>
                <div className="border-t border-gray-100 pt-5 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Pengumuman</h3>
                    <p className="text-sm text-gray-500">{isFinal ? "Pengumuman pemenang akan diumumkan pada:" : "Hasil kelulusan akan diumumkan pada:"}</p>
                  </div>
                  <div className="bg-[#D1E4FF] px-3 py-1.5 rounded-lg text-sm font-bold text-primary flex items-center gap-1.5">
                    <Clock size={14} />
                    {diffAnnDays > 0 ? `${diffAnnDays} Hari` : (diffAnnDays === 0 ? 'Hari Ini' : 'Lewat')} | {new Date(announcementTl?.start_date || tahap.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ) : (
              // Hasil Pengumuman
              <div className="p-6">
                <h2 className="font-bold text-lg text-primary">{isFinal ? "Pengumuman Pemenang" : "Pengumuman Kelulusan"}</h2>
                <p className="text-sm text-primary mb-6">{isFinal ? "Hasil lomba telah diumumkan" : "Hasil kelulusan telah diumumkan"}</p>

                <div className="border-t border-gray-100 pt-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-s text-gray-900">{isFinal ? (hasAward ? "Juara" : "Peringkat Anda") : "Status"}</span>

                    {isFinal ? (
                      hasAward ? (
                        <div className="bg-primary text-white px-6 py-1.5 rounded-md font-bold text-sm tracking-wider flex items-center gap-1">
                          <Trophy size={14} /> {rankTitle}
                        </div>
                      ) : (
                        <div className="bg-[#FECACA] text-[#DC2626] px-6 py-1.5 rounded-md font-bold text-sm tracking-wider flex items-center gap-1">
                          <X size={14} /> Finalis
                        </div>
                      )
                    ) : (
                      <div className={`px-6 py-1.5 rounded-md font-bold text-sm tracking-wider ${isQualified ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FED7D7] text-[#C53030]'}`}>
                        {isQualified ? <span className="flex items-center gap-1"><CheckCircle2 size={14} /> LOLOS</span> : <span className="flex items-center gap-1"><XCircle size={14} /> TIDAK LOLOS</span>}
                      </div>
                    )}

                  </div>
                  <div>
                    <h4 className="font-bold text-s mb-1">Keterangan:</h4>
                    <p className="text-sm font-medium">
                      {isFinal ? (
                        hasAward
                          ? `Selamat! ${getParticipantText(competition)} Anda berhasil meraih ${rankTitle} pada Lomba ${competition?.competition_name}. Silakan menunggu informasi selanjutnya terkait penerimaan penghargaan.`
                          : `${getParticipantText(competition)} Anda berhasil menjadi finalis pada Lomba ${competition?.competition_name}. Terima kasih atas partisipasinya dan semoga sukses di kesempatan berikutnya.`
                      ) : (
                        isQualified
                          ? `Selamat! ${getParticipantText(competition)} Anda dinyatakan lolos tahap ini. Silahkan menunggu informasi selanjutnya.`
                          : `Mohon maaf, ${getParticipantText(competition)} Anda belum berhasil lolos pada tahap ini. Semoga sukses di kesempatan berikutnya.`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CARD PENGHARGAAN (Hanya Tampil Jika Final & Pengumuman Sudah Keluar) */}
        {isFinal && annStatus !== "upcoming" && stageParticipant?.qualification_status !== 'pending' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
            {awdStatus === "upcoming" ? (
              <div className="p-6">
                <h2 className="font-bold text-lg text-primary">Pemberian Penghargaan</h2>
                <p className="text-sm text-primary mb-6">Penghargaan sedang diproses</p>
                <div className="border-t border-gray-100 pt-5 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Penghargaan</h3>
                    <p className="text-sm text-gray-500">Perkiraan waktu penerimaan</p>
                  </div>
                  <div className="bg-[#D1E4FF] px-3 py-1.5 rounded-lg text-sm font-bold text-primary flex items-center gap-1.5">
                    <Clock size={14} />
                    {diffAwardDays > 0 ? `${diffAwardDays} Hari` : (diffAwardDays === 0 ? 'Hari Ini' : 'Lewat')} | {new Date(awardTl?.start_date || tahap.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <h2 className="font-bold text-lg text-primary">Pemberian Penghargaan</h2>
                <p className="text-sm text-primary mb-6">Penghargaan telah tersedia. Silakan unduh di bawah ini.</p>
                <div className="border-t border-gray-100 pt-5">
                  {(awardData?.certificate_file_path || awardData?.certificate_external_url) ? (
                    <div
                      onClick={() => {
                        if (awardData.certificate_external_url) window.open(awardData.certificate_external_url, '_blank');
                        else if (signedCertificateUrl) window.open(signedCertificateUrl, '_blank');
                      }}
                      className="border border-gray-200 rounded-xl flex justify-between items-stretch cursor-pointer hover:shadow-md transition-shadow overflow-hidden group"
                    >
                      <div className="p-5 flex-1 flex flex-col justify-center">
                        <h3 className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-primary transition-colors">
                          Sertifikat {hasAward ? 'Juara' : 'Finalis'} Lomba {competition?.competition_name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">PDF / Tautan</p>
                      </div>
                      <div className="w-24 bg-gray-800 relative shrink-0">
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                          <File className="text-white/40" size={28} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm">
                      Sertifikat belum diunggah oleh panitia.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manajemen Anggota */}
        {competition?.type === 'team' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Peserta Tim ({members.length}/{competition?.team_size_max})</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortedMembers.map((m: any) => (
                <div key={m.member_id} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative">
                    <Image src={m.participants?.profiles?.profile_image ? supabase.storage.from("profiles").getPublicUrl(`participants/${m.participants.profiles.profile_image}`).data.publicUrl : "/images/default-avatar.png"} alt="Profil" fill className="object-cover" />
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate text-gray-800">{m.participants?.profiles?.username || 'Peserta'} {m.role === 'leader' ? '(Ketua)' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL UPLOAD KARYA */}
      <UploadKaryaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={() => fetchSubmission()}
        competition={competition}
        eventData={eventData}
        tahap={tahap}
        entryData={entryData}
      />
    </div>
  );
}