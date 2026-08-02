"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/ui/Toast";
import QualificationTable from "@/components/competition/organizer/QualificationTable";
import CompetitionHeaderCard from "@/components/competition/organizer/CompetitionHeaderCard";

export default function QualificationPage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = params.competitionId as string;
  const stageId = params.stageId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Data State
  const [competition, setCompetition] = useState<any>(null);
  const [stage, setStage] = useState<any>(null);
  const [judges, setJudges] = useState<any[]>([]);
  const [awardCategories, setAwardCategories] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [isAnnounced, setIsAnnounced] = useState(false);
  const [isBeforeAnnouncement, setIsBeforeAnnouncement] = useState(false);
  const [announcementStartDate, setAnnouncementStartDate] = useState<string | null>(null);

  // Input State
  const [selectedQualifications, setSelectedQualifications] = useState<Record<number, boolean>>({});
  const [selectedAwards, setSelectedAwards] = useState<Record<number, number | "">>({});

  const showToast = (message: string, type: string = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Competition & Event (untuk organizer_id)
        const { data: compData } = await supabase
          .from("competitions")
          .select("*, events (event_name, organizer_id)")
          .eq("competition_id", competitionId)
          .single();
        setCompetition(compData);

        // Fetch Stage & Timelines
        const { data: stageData } = await supabase
          .from("stages")
          .select("*, stage_timelines(*)")
          .eq("stage_id", stageId)
          .single();
        setStage(stageData);

        if (stageData?.stage_timelines) {
          const annTimeline = stageData.stage_timelines.find((t: any) => t.timeline_type === 'announcement');
          if (annTimeline?.start_date) {
            setAnnouncementStartDate(annTimeline.start_date);
            const targetDate = new Date(annTimeline.start_date);
            targetDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            setIsBeforeAnnouncement(today.getTime() < targetDate.getTime());
          }
        }

        // Fetch Juri yang ditugaskan ke babak ini
        const { data: judgeData } = await supabase
          .from("judge_assignments")
          .select(`
            judge_id,
            judges ( institution, profiles ( username, profile_image ) )
          `)
          .eq("stage_id", stageId)
          .eq("status", "active")
          .limit(5);
        setJudges(judgeData || []);

        // Fetch Gelar Juara (jika final)
        if (stageData?.stage_type === 'final') {
          const { data: awardData } = await supabase
            .from("award_categories")
            .select("*")
            .eq("organizer_id", compData.events.organizer_id)
            .order("order", { ascending: true });
          setAwardCategories(awardData || []);
        }

        // Fetch Stage Participants + Entries + Submissions + Evaluations
        const { data: participants } = await supabase
          .from("stage_participants")
          .select(`
            stage_participant_id,
            qualification_status,
            entries (
              entry_id,
              entry_name,
              submissions (
                submission_id, file_url, link_url,
                evaluations ( judge_id, score )
              )
            )
          `)
          .eq("stage_id", stageId);

        // --- MENGOLAH DATA MATEMATIKA ---
        let processedRows: any[] = [];

        participants?.forEach((p: any) => {
          // Cari submission milik stage ini
          const entriesArr: any = p.entries;
          const entry = Array.isArray(entriesArr) ? entriesArr[0] : entriesArr;
          const submission = entry?.submissions?.[0];
          const evals = submission?.evaluations || [];

          // Kalkulasi rata-rata per juri
          const judgeScores: Record<number, number> = {};
          const judgeEvalCounts: Record<number, number> = {};

          evals.forEach((ev: any) => {
            if (!judgeScores[ev.judge_id]) {
              judgeScores[ev.judge_id] = 0;
              judgeEvalCounts[ev.judge_id] = 0;
            }
            judgeScores[ev.judge_id] += ev.score;
            judgeEvalCounts[ev.judge_id] += 1;
          });

          let totalScoreAllJudges = 0;
          let judgesCount = 0;

          Object.keys(judgeScores).forEach(jId => {
            const avgForJudge = judgeScores[Number(jId)] / judgeEvalCounts[Number(jId)];
            judgeScores[Number(jId)] = avgForJudge;

            totalScoreAllJudges += avgForJudge;
            judgesCount += 1;
          });

          // Skor Akhir = Rata-rata dari skor rata-rata semua juri
          const finalScore = judgesCount > 0 ? (totalScoreAllJudges / judgesCount) : 0;

          processedRows.push({
            participantId: p.stage_participant_id,
            entryId: entry?.entry_id,
            entryName: entry?.entry_name || "Tanpa Nama",
            fileUrl: submission?.file_url,
            linkUrl: submission?.link_url,
            judgeScores,
            finalScore,
            rank: 0,
            dbStatus: p.qualification_status
          });
        });

        // Sorting by Final Score Descending
        processedRows.sort((a, b) => b.finalScore - a.finalScore);

        // Terapkan Rank & Auto-Check Logic
        const initialChecks: Record<number, boolean> = {};
        const isFinal = stageData?.stage_type === 'final';
        const maxQualified = stageData?.max_qualified || 0;

        // Cek apakah juara sudah pernah diumumkan (jika babak final)
        let hasAnnounced = false;
        if (isFinal) {
          const entryIds = processedRows.map(r => r.entryId).filter(Boolean);
          if (entryIds.length > 0) {
            const { data: existingAwards } = await supabase
              .from("awards")
              .select("entry_id, category_id")
              .in("entry_id", entryIds);

            if (existingAwards && existingAwards.length > 0) {
              hasAnnounced = true;
              const awardsMap: any = {};
              existingAwards.forEach(aw => {
                const pId = processedRows.find(r => r.entryId === aw.entry_id)?.participantId;
                if (pId) awardsMap[pId] = aw.category_id;
              });
              setSelectedAwards(awardsMap);
            }
          }
        }
        setIsAnnounced(hasAnnounced);

        processedRows.forEach((row, index) => {
          row.rank = index + 1;

          // Logika Kelulusan: Jika status di DB sudah 'qualified', tetapkan true
          if (row.dbStatus === 'qualified') {
            initialChecks[row.participantId] = true;
          }
          // Logika Auto-Check: Jika belum final, dan masuk kuota ranking teratas
          else if (!isFinal && maxQualified > 0 && row.rank <= maxQualified && row.finalScore > 0) {
            initialChecks[row.participantId] = true;
          } else {
            initialChecks[row.participantId] = false;
          }
        });

        setRows(processedRows);
        setSelectedQualifications(initialChecks);

      } catch (error: any) {
        showToast(error.message || "Gagal memuat data", "error");
      } finally {
        setLoading(false);
      }
    };

    if (competitionId && stageId) fetchData();
  }, [competitionId, stageId]);

  // --- Handlers ---
  const handleToggleQualification = (participantId: number) => {
    setSelectedQualifications(prev => ({
      ...prev,
      [participantId]: !prev[participantId]
    }));
  };

  const handleAwardChange = (participantId: number, categoryId: number | "") => {
    setSelectedAwards(prev => ({
      ...prev,
      [participantId]: categoryId
    }));

    // Auto qualified jika dapat juara
    if (categoryId !== "") {
      setSelectedQualifications(prev => ({ ...prev, [participantId]: true }));
    }
  };

  const handleOpenFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from('submissions').createSignedUrl(filePath, 3600);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (err) {
      showToast("Gagal membuka file", "error");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const isFinal = stage?.stage_type === 'final';

      if (isFinal) {
        // Validasi: pastikan setiap peserta memiliki gelar juara yang dipilih
        const allHaveAwards = rows.every(row => !!selectedAwards[row.participantId]);
        if (!allHaveAwards) {
          showToast("Kolom juara harus diisi untuk SEMUA peserta sebelum mengumumkan pemenang!", "error");
          setSaving(false);
          return;
        }
      }

      // Update Qualification Status di stage_participants
      const updatePromises = rows.map(row => {
        const isQualified = selectedQualifications[row.participantId];
        return supabase
          .from("stage_participants")
          .update({
            qualification_status: isQualified ? 'qualified' : 'eliminated',
            final_score: row.finalScore,
            rank_position: row.rank,
            decided_by: competition?.events?.organizer_id
          })
          .eq("stage_participant_id", row.participantId);
      });

      await Promise.all(updatePromises);

      // Jika Final, Simpan Gelar Juara ke tabel awards
      if (isFinal) {
        const organizerId = competition?.events?.organizer_id;

        const awardInserts: any[] = [];
        rows.forEach(row => {
          const awardId = selectedAwards[row.participantId];
          if (awardId && organizerId) {
            awardInserts.push({
              category_id: awardId,
              entry_id: row.entryId,
              decided_by: organizerId
            });
          }
        });

        if (awardInserts.length > 0) {
          await supabase.from("awards").insert(awardInserts);
        }
      }

      showToast(isFinal ? "Juara berhasil diumumkan!" : "Kelulusan berhasil disimpan!", "success");
      setTimeout(() => router.back(), 2000);

    } catch (error: any) {
      showToast(error.message || "Terjadi kesalahan saat menyimpan", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-5 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const isFinal = stage?.stage_type === 'final';

  return (
    <div className="min-h-screen bg-white">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary">
          <ChevronLeft className="text-xl" />
          Kembali ke timeline
        </button>
      </div>

      <CompetitionHeaderCard
        competitionId={competitionId}
        activeStageId={Number(stageId)}
      />

      <div className="mt-8 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{isFinal ? "Pengumuman Juara" : "Kelulusan Peserta"}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isFinal ? "Tetapkan gelar juara berdasarkan hasil akhir penjurian." : "Tentukan peserta yang berhak lolos ke babak selanjutnya."}
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          {isBeforeAnnouncement && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              {isFinal ? "Masa pengumuman juara belum dimulai" : "Masa pengumuman kelulusan belum dimulai"}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (isFinal && isAnnounced) || isBeforeAnnouncement}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors ${((isFinal && isAnnounced) || isBeforeAnnouncement)
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
          >
            <Save size={18} />
            {saving ? "Menyimpan..." : (isFinal && isAnnounced) ? "Telah Diumumkan" : isBeforeAnnouncement ? "Belum Waktunya" : (isFinal ? "Umumkan Juara" : "Loloskan Peserta")}
          </button>
        </div>
      </div>

      <QualificationTable
        isFinal={isFinal}
        judges={judges}
        rows={rows}
        awardCategories={awardCategories}
        selectedQualifications={selectedQualifications}
        selectedAwards={selectedAwards}
        onToggleQualification={handleToggleQualification}
        onAwardChange={handleAwardChange}
        onOpenFile={handleOpenFile}
        isAnnounced={isAnnounced || isBeforeAnnouncement}
      />
    </div>
  );
}