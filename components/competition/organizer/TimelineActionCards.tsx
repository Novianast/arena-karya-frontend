"use client";

import { FileText, CreditCard, Users, Trophy, Sparkles, ArrowRight, MapPin, Link as LinkIcon, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/ui/Toast";

export default function TimelineActionCards({ group, competition, totalEntries, qualifiedParticipants }: any) {
  const router = useRouter();
  const isTeam = competition.type === 'team';
  const participantText = isTeam ? "Tim" : "Peserta";
  
  // 1. Logika Perbandingan Tanggal yang Tahan Banting (Anti Timezone Bug)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIsActive = (dateString?: string) => {
    if (!dateString) return false;
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0); // Paksa ke jam 00:00 lokal
    return today.getTime() >= targetDate.getTime();
  };

  const regTimeline = group.timelines.find((t: any) => t.timeline_type?.toLowerCase() === "registration");
  const preTimeline = group.timelines.find((t: any) => t.timeline_type?.toLowerCase() === "presentation");
  const annTimeline = group.timelines.find((t: any) => t.timeline_type?.toLowerCase() === "announcement");
  const awdTimeline = group.timelines.find((t: any) => t.timeline_type?.toLowerCase() === "award");

  const [editPresentation, setEditPresentation] = useState(false);
  const [presentationData, setPresentationData] = useState({
    location: preTimeline?.location || "",
    meeting_link: preTimeline?.meeting_link || ""
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" as any });

  const handleSavePresentation = async () => {
    if (!preTimeline) return;
    const { error } = await supabase
      .from('stage_timelines')
      .update({
        location: presentationData.location,
        meeting_link: presentationData.meeting_link
      })
      .eq('timeline_id', preTimeline.timeline_id);

    if (error) {
      setToast({ show: true, message: "Gagal menyimpan data", type: "error" });
    } else {
      setToast({ show: true, message: "Data presentasi berhasil disimpan", type: "success" });
      setEditPresentation(false);
      preTimeline.location = presentationData.location;
      preTimeline.meeting_link = presentationData.meeting_link;
    }
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const isVerifikasiActive = checkIsActive(regTimeline?.start_date);
  const isPengumumanActive = checkIsActive(annTimeline?.start_date);
  const isAwardActive = checkIsActive(awdTimeline?.start_date);

  // Helper untuk mendapatkan Stage ID yang benar
  const currentStageId = group.stageIds?.[group.stageIds.length - 1];

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      
      {/* 1. Card Informasi */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="border-b border-gray-100 p-4 bg-gray-50 flex items-center gap-2">
          <FileText size={18} className="text-gray-800" />
          <h3 className="font-bold text-gray-900 text-sm">Informasi</h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 leading-relaxed">
            Silahkan pantau dan kelola aksi penyelenggara pada menu di bawah ini. Pastikan untuk melakukan verifikasi pembayaran dari peserta lomba sebelum mengumumkan kelolosan ke babak selanjutnya.
          </p>
        </div>
      </div>

      {/* 2. Card Verifikasi Pembayaran */}
      {regTimeline && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="border-b border-gray-100 p-4 bg-gray-50 flex items-center gap-2">
            <CreditCard size={18} className="text-gray-800" />
            <h3 className="font-bold text-gray-900 text-sm">Verifikasi Pembayaran Peserta Lomba</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center rounded-lg border border-gray-200 p-4 bg-gray-50/50">
              <span className="text-sm font-semibold text-gray-600">Biaya Lomba</span>
              <span className="text-base font-bold text-gray-900">
                Rp {competition.price?.toLocaleString('id-ID')}
              </span>
            </div>
            <button 
              onClick={() => {
                const compName = encodeURIComponent(competition.competition_name);
                router.push(`/organizer/payment?competition=${compName}`);
              }}
              className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              Verifikasi Pembayaran <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 2b. Card Pengaturan Presentasi */}
      {preTimeline && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="border-b border-gray-100 p-4 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-gray-800" />
              <h3 className="font-bold text-gray-900 text-sm">Informasi Presentasi</h3>
            </div>
            {!editPresentation && (
              <button onClick={() => {
                setPresentationData({ location: preTimeline.location || "", meeting_link: preTimeline.meeting_link || "" });
                setEditPresentation(true);
              }} className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 font-medium">
                <Edit size={14} /> Edit
              </button>
            )}
          </div>
          <div className="p-5 space-y-4">
            {editPresentation ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lokasi Fisik</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600" value={presentationData.location} onChange={(e) => setPresentationData({...presentationData, location: e.target.value})} placeholder="Contoh: Gedung A Lantai 3" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Link Meeting (Zoom/Meet)</label>
                  <input type="url" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600" value={presentationData.meeting_link} onChange={(e) => setPresentationData({...presentationData, meeting_link: e.target.value})} placeholder="https://zoom.us/j/..." />
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={() => setEditPresentation(false)} className="px-4 py-2 text-xs text-gray-600 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200">Batal</button>
                  <button onClick={handleSavePresentation} className="px-4 py-2 text-xs text-white bg-blue-600 rounded-lg font-semibold hover:bg-blue-700">Simpan</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Lokasi Fisik</h4>
                  <p className="text-sm text-gray-900 font-medium mt-1">{preTimeline.location || "-"}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Link Meeting</h4>
                  {preTimeline.meeting_link ? (
                    <a href={preTimeline.meeting_link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline mt-1 flex items-center gap-1 font-medium"><LinkIcon size={14}/> Buka Link</a>
                  ) : (
                    <p className="text-sm text-gray-900 font-medium mt-1">-</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Card Kelolosan Peserta (HANYA JIKA BUKAN FINAL) */}
      {!group.isFinal && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="border-b border-gray-100 p-4 bg-gray-50 flex items-center gap-2">
            <Users size={18} className="text-gray-800" />
            <h3 className="font-bold text-gray-900 text-sm">Kelolosan {participantText}</h3>
          </div>
          <div className="p-5 space-y-4">
            <h4 className="text-sm font-bold text-gray-800">Kapasitas {participantText}</h4>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Jumlah {participantText} Terdaftar:</span>
              <div className="flex items-center gap-2 border border-gray-200 rounded px-3 py-1">
                <span className="font-bold">{totalEntries}</span> <Users size={14} className="text-gray-400" />
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Maksimal {participantText} Lolos:</span>
              <div className="flex items-center gap-2 border border-gray-200 rounded px-3 py-1 bg-gray-50">
                <span className="font-bold">{group.capacity}</span> <Users size={14} className="text-gray-400" />
              </div>
            </div>
            
            {isPengumumanActive ? (
              <Link 
                href={`/organizer/event/${competition.event_id}/competition/${competition.competition_id}/stage/${currentStageId}/qualification`}
                className="w-full mt-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                Loloskan {participantText} <ArrowRight size={16} />
              </Link>
            ) : (
              <div className="w-full mt-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200">
                Loloskan {participantText} <ArrowRight size={16} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Card Pengumuman Juara (HANYA JIKA FINAL) */}
      {group.isFinal && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="border-b border-gray-100 p-4 bg-gray-50 flex items-center gap-2">
            <Trophy size={18} className="text-gray-800" />
            <h3 className="font-bold text-gray-900 text-sm">Pengumuman Juara</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-semibold">Jumlah {participantText} Tersisa:</span>
              <div className="flex items-center gap-2 border border-gray-200 rounded px-3 py-1">
                <span className="font-bold">{qualifiedParticipants}</span> <Users size={14} className="text-gray-400" />
              </div>
            </div>
            
            {isPengumumanActive ? (
              <Link 
                href={`/organizer/event/${competition.event_id}/competition/${competition.competition_id}/stage/${currentStageId}/qualification`}
                className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                Umumkan Juara <ArrowRight size={16} />
              </Link>
            ) : (
              <div className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200">
                Umumkan Juara <ArrowRight size={16} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Card Pemberian Sertifikat (HANYA JIKA FINAL) */}
      {group.isFinal && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="border-b border-gray-100 p-4 bg-gray-50 flex items-center gap-2">
            <Sparkles size={18} className="text-gray-800" />
            <h3 className="font-bold text-gray-900 text-sm">Pemberian Sertifikat</h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Pemberian Sertifikat bisa berupa Link Luar atau Unggah File sertifikat kepada pemenang.
            </p>
            {isAwardActive ? (
              <Link 
                href={`/organizer/event/${competition.event_id}/competition/${competition.competition_id}/awards`}
                className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                Berikan Sertifikat <ArrowRight size={16} />
              </Link>
            ) : (
              <div className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200">
                Berikan Sertifikat <ArrowRight size={16} />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}