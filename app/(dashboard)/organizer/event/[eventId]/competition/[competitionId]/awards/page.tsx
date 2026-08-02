"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/ui/Toast";
import CompetitionHeaderCard from "@/components/competition/organizer/CompetitionHeaderCard";
import AwardsTable from "@/components/competition/organizer/AwardsTable";
import { UploadCertificateModal } from "@/components/competition/organizer/UploadCertificateModal";

export default function AwardsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const competitionId = params.competitionId as string;

  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState<any>(null);
  const [awards, setAwards] = useState<any[]>([]);
  const [isAwardActive, setIsAwardActive] = useState<boolean>(false);
  const [timelineInfo, setTimelineInfo] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message: string, type: string = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch Competition
      const compRes = await supabase.from('competitions').select('*').eq('competition_id', competitionId).single();

      if (compRes.data) setCompetition(compRes.data);

      // Fetch Award Timeline
      const { data: finalStage } = await supabase
        .from('stages')
        .select(`
          stage_timelines (
            timeline_type,
            start_date,
            end_date
          )
        `)
        .eq('competition_id', competitionId)
        .eq('stage_type', 'final')
        .single();

      if (finalStage?.stage_timelines) {
        const awardTimeline = finalStage.stage_timelines.find((t: any) => t.timeline_type === 'award');
        if (awardTimeline) {
          setTimelineInfo({ start: awardTimeline.start_date, end: awardTimeline.end_date });

          const now = new Date();
          const startDate = awardTimeline.start_date ? new Date(awardTimeline.start_date) : null;
          const endDate = awardTimeline.end_date ? new Date(awardTimeline.end_date) : null;

          if (endDate) {
            endDate.setHours(23, 59, 59, 999);
          }

          if (startDate && endDate) {
            setIsAwardActive(now >= startDate && now <= endDate);
          } else if (startDate && !endDate) {
            setIsAwardActive(now >= startDate);
          } else if (!startDate && endDate) {
            setIsAwardActive(now <= endDate);
          } else {
            // Jika tanggal tidak diset, biarkan aktif
            setIsAwardActive(true);
          }
        }
      }

      // Fetch Awards with Entries and Categories
      const { data: awardsData, error: awardsError } = await supabase
        .from('awards')
        .select(`
          award_id,
          certificate_file_path,
          certificate_external_url,
          entry_id,
          award_categories (category_name),
          entries!inner (
            entry_name,
            entry_type,
            competition_id
          )
        `)
        .eq('entries.competition_id', competitionId);

      if (awardsError) throw awardsError;

      // Fetch Team Members
      const teamEntryIds = awardsData
        .filter((a: any) => a.entries.entry_type === 'team')
        .map((a: any) => a.entry_id);

      let membersMap: Record<number, any[]> = {};

      if (teamEntryIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
          .from('entry_members')
          .select(`
            entry_id,
            participants (
              profiles ( full_name )
            )
          `)
          .in('entry_id', teamEntryIds);

        if (!membersError && membersData) {
          membersData.forEach((m: any) => {
            if (!membersMap[m.entry_id]) membersMap[m.entry_id] = [];
            membersMap[m.entry_id].push({
              name: m.participants?.profiles?.full_name || 'Unknown'
            });
          });
        }
      }

      // Format Rows
      const formattedRows = awardsData.map((a: any) => ({
        award_id: a.award_id,
        entry_id: a.entry_id,
        entry_name: a.entries.entry_name,
        entry_type: a.entries.entry_type,
        award_category_name: a.award_categories?.category_name || '-',
        certificate_file_path: a.certificate_file_path,
        certificate_external_url: a.certificate_external_url,
        members: membersMap[a.entry_id] || []
      }));

      setAwards(formattedRows);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      showToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [competitionId]);

  const handleOpenModal = (entryData: any) => {
    setSelectedEntry(entryData);
    setIsModalOpen(true);
  };

  const handleUploadSuccess = () => {
    fetchAllData();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-5 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary">
          <ChevronLeft className="text-xl" />
          Kembali ke timeline
        </button>
      </div>

      {competition && (
        <CompetitionHeaderCard competitionId={competitionId} />
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pemberian Sertifikat</h2>
            <p className="text-sm text-gray-500 mt-1">Unggah atau berikan link sertifikat kepada peserta yang mendapatkan gelar juara.</p>
          </div>

          {!isAwardActive && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              {timelineInfo.start && new Date() < new Date(timelineInfo.start)
                ? "Masa pemberian sertifikat belum dimulai"
                : "Masa pemberian sertifikat telah berakhir"}
            </div>
          )}
        </div>

        <div className="p-6">
          <AwardsTable
            rows={awards}
            onOpenUploadModal={handleOpenModal}
            isAwardActive={isAwardActive}
          />
        </div>
      </div>

      <UploadCertificateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        entryData={selectedEntry}
        eventId={eventId}
        competitionId={competitionId}
        isAwardActive={isAwardActive}
      />

      <Toast show={toast.show} message={toast.message} type={toast.type} />
    </div>
  );
}
