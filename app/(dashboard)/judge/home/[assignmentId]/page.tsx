"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Save, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/ui/Toast";
import Pagination from "@/components/ui/Pagination";
import EvaluationTable from "@/components/judge/EvaluationTable";
import LocationButton from "@/components/ui/LocationButton";

export default function JudgingPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId;

  const [loading, setLoading] = useState(true);
  const [judgeId, setJudgeId] = useState<number | null>(null);
  const [headerInfo, setHeaderInfo] = useState<any>({});
  const [criteria, setCriteria] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // State Form & Filter
  const [scores, setScores] = useState<Record<number, Record<number, number | string>>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'graded' | 'ungraded'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [isDirty, setIsDirty] = useState(false);

  const showToast = (message: string, type: string = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ambil Judge ID & Info Assignment
      const { data: assignmentData, error: assignError } = await supabase
        .from("judge_assignments")
        .select(`
          judge_id,
          stage_id,
          status,
          stages (
            stage_name,
            competition_id,
            stage_order,
            competitions (
              competition_name, type, status,
              events (event_name, location, status)
            ),
            stage_timelines (
              timeline_type,
              start_date,
              end_date,
              meeting_link,
              location
            )
          )
        `)
        .eq("assignment_id", assignmentId)
        .single();

      if (assignError || !assignmentData) throw assignError;

      // Fix TS errors by casting to any since Supabase types might infer 1-to-1 as array
      const stages: any = assignmentData.stages;

      // Verifikasi undangan sudah diterima
      if (stages?.competition_id) {
        const { data: invData } = await supabase
          .from('judge_invitations')
          .select('status')
          .eq('judge_id', assignmentData.judge_id)
          .eq('competition_id', stages.competition_id)
          .single();

        if (!invData || invData.status !== 'accepted') {
          throw new Error("Anda belum menerima undangan untuk tugas ini.");
        }
      }

      // Validasi Draft
      {
        const comp = stages?.competitions;
        const event = comp?.events;
        if (comp?.status === 'draft' || event?.status === 'draft') {
          throw new Error("Lomba ini belum diterbitkan (draft).");
        }
      }

      // Validasi Status Penugasan
      const currentStatus = assignmentData.status;

      if (currentStatus === 'completed' || currentStatus === 'cancelled') {
        showToast(`Tugas ini telah ${currentStatus === 'completed' ? 'Selesai' : 'Dibatalkan'}. Mengalihkan ke riwayat...`, "error");
        setTimeout(() => {
          router.push(`/judge/history/${assignmentId}`);
        }, 2000);
        return;
      }

      // Cek Tanggal Penjurian
      const judgingTimeline = stages?.stage_timelines?.find(
        (t: any) => t.timeline_type === 'judging'
      );

      if (judgingTimeline) {
        const now = new Date();
        const start = new Date(judgingTimeline.start_date);
        const end = new Date(judgingTimeline.end_date);
        end.setHours(23, 59, 59, 999);

        if (now < start) {
          showToast("Penjurian belum dimulai. Mengalihkan ke Beranda...", "error");
          setTimeout(() => router.push('/judge/home'), 2000);
          return;
        }

        if (now > end) {
          showToast("Waktu penjurian sudah berakhir. Mengalihkan ke Beranda...", "error");
          setTimeout(() => router.push('/judge/home'), 2000);
          return;
        }
      }

      const stgId = assignmentData.stage_id;
      setJudgeId(assignmentData.judge_id);

      const comp = stages?.competitions;
      const ev = comp?.events;
      const typeTimeline = stages?.stage_timelines?.find(
        (t: any) => t.timeline_type === 'submission' || t.timeline_type === 'presentation'
      );

      let evaluationType = 'Belum Ditentukan';
      let taskLocation = ev?.location || 'Online';
      let meetingLink = null;
      let physicalLocation = null;

      if (typeTimeline?.timeline_type === 'submission') {
        evaluationType = 'Karya';
        taskLocation = 'Online';
      } else if (typeTimeline?.timeline_type === 'presentation') {
        evaluationType = 'Presentasi';
        if (typeTimeline.meeting_link) {
          taskLocation = 'Online';
          meetingLink = typeTimeline.meeting_link;
        } else if (typeTimeline.location) {
          taskLocation = typeTimeline.location;
          physicalLocation = typeTimeline.location;
        } else {
          taskLocation = 'Online';
        }
      }

      setHeaderInfo({
        eventName: ev?.event_name,
        compName: comp?.competition_name,
        stageName: stages?.stage_name,
        compType: comp?.type,
        evaluationType,
        location: taskLocation,
        meetingLink,
        physicalLocation,
      });

      // 2. Ambil Kriteria
      const { data: critData } = await supabase
        .from("evaluation_criteria")
        .select("*")
        .eq("stage_id", stgId)
        .order("criteria_id", { ascending: true });
      setCriteria(critData || []);

      // 3. Ambil Submissions + Entry Members + Existing Evaluations
      let rawSubmissions: any[] = [];
      const { data: subData } = await supabase
        .from("submissions")
        .select(`
          submission_id, file_url, link_url,
          entries (
            entry_name,
            entry_members (
              member_id,
              participants ( profiles ( username ) )
            )
          ),
          evaluations ( criteria_id, score, notes )
        `)
        .eq("stage_id", stgId);

      rawSubmissions = subData || [];

      // Fallback if presentation and no submissions
      if (rawSubmissions.length === 0) {
        const compId = stages?.competition_id;
        let order = stages?.stage_order - 1;
        let foundSubmissions = false;

        while (order > 0 && !foundSubmissions) {
          const { data: prevStage } = await supabase
            .from('stages')
            .select('stage_id')
            .eq('competition_id', compId)
            .eq('stage_order', order)
            .single();
          
          if (prevStage) {
            const { data: prevSubData } = await supabase
              .from("submissions")
              .select(`
                submission_id, file_url, link_url,
                entries (
                  entry_name,
                  entry_members (
                    member_id,
                    participants ( profiles ( username ) )
                  )
                ),
                evaluations ( criteria_id, score, notes )
              `)
              .eq("stage_id", prevStage.stage_id);
              
            if (prevSubData && prevSubData.length > 0) {
              rawSubmissions = prevSubData;
              foundSubmissions = true;
            }
          }
          order--;
        }
      }

      const formattedSubmissions = rawSubmissions;
      setSubmissions(formattedSubmissions);

      // 4. Map Evaluasi sebelumnya ke state
      const initialScores: any = {};
      const initialNotes: any = {};

      formattedSubmissions.forEach((sub: any) => {
        const myEvals = sub.evaluations || [];

        if (myEvals.length > 0) {
          initialScores[sub.submission_id] = {};
          myEvals.forEach((ev: any) => {
            initialScores[sub.submission_id][ev.criteria_id] = ev.score;
            if (ev.notes && !initialNotes[sub.submission_id]) {
              initialNotes[sub.submission_id] = ev.notes;
            }
          });
        }
      });
      setScores(initialScores);
      setNotes(initialNotes);

    } catch (err) {
      console.error(err);
      showToast("Gagal memuat data atau penugasan tidak ditemukan. Mengalihkan...", "error");
      setTimeout(() => router.push('/judge/home'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleScoreChange = (submissionId: number, criteriaId: number, value: string) => {
    let numVal = parseFloat(value);
    if (numVal > 100) value = "100";
    if (numVal < 0) value = "0";

    setScores((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [criteriaId]: value,
      },
    }));
    setIsDirty(true);
  };

  const handleNoteChange = (submissionId: number, value: string) => {
    setNotes((prev) => ({ ...prev, [submissionId]: value }));
    setIsDirty(true);
  };

  useEffect(() => {
    if (!isDirty) return;

    const timeoutId = setTimeout(() => {
      handleSaveAll(true);
      setIsDirty(false);
    }, 2000); // Jeda 2 detik setelah selesai mengetik

    return () => clearTimeout(timeoutId);
  }, [scores, notes, isDirty]);

  const handleSaveAll = async (isAutoSave = false) => {
    if (!judgeId) return;

    // Siapkan array data untuk upsert
    const upsertData: any[] = [];

    Object.keys(scores).forEach((subIdStr) => {
      const subId = parseInt(subIdStr);
      const subScores = scores[subId];
      const subNote = notes[subId] || null;

      Object.keys(subScores).forEach((critIdStr, idx) => {
        const critId = parseInt(critIdStr);
        const scoreVal = subScores[critId];

        if (scoreVal !== "" && scoreVal !== null && scoreVal !== undefined) {
          upsertData.push({
            submission_id: subId,
            judge_id: judgeId,
            criteria_id: critId,
            score: parseFloat(scoreVal.toString()),
            // Simpan note hanya di kriteria pertama untuk submission ini agar tidak redundan
            notes: idx === 0 ? subNote : null
          });
        }
      });
    });

    if (upsertData.length === 0) return;

    try {
      const { error } = await supabase
        .from('evaluations')
        .upsert(upsertData, { onConflict: 'submission_id, judge_id, criteria_id' });

      if (error) throw error;

      showToast(isAutoSave ? "Perubahan tersimpan otomatis!" : "Perubahan berhasil tersimpan!", "success");
    } catch (error) {
      console.error(error);
      showToast("Gagal menyimpan perubahan", "error");
    }
  };

  // --- Handler Buka File (Signed URL) ---
  const handleOpenFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('submissions')
        .createSignedUrl(filePath, 60 * 60); // URL berlaku selama 1 jam (3600 detik)

      if (error) throw error;

      if (data?.signedUrl) {
        // Buka file di tab baru
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error("Error generating signed URL:", err);
      showToast("Gagal membuka file karya. Pastikan akses Anda valid.", "error");
    }
  };

  // --- Filter & Pagination Logic ---
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Filter Search
      const entryName = sub.entries?.entry_name?.toLowerCase() || "";
      if (searchQuery && !entryName.includes(searchQuery.toLowerCase())) return false;

      // 2. Filter Status Dinilai
      const subScores = scores[sub.submission_id] || {};
      const isGraded = criteria.length > 0 && criteria.every(c =>
        subScores[c.criteria_id] !== undefined && subScores[c.criteria_id] !== ""
      );

      if (filterStatus === "graded" && !isGraded) return false;
      if (filterStatus === "ungraded" && isGraded) return false;

      return true;
    });
  }, [submissions, searchQuery, filterStatus, scores, criteria]);

  // Pagination Slice
  const totalItems = filteredSubmissions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filter changes
  useEffect(() => setCurrentPage(1), [searchQuery, filterStatus, itemsPerPage]);

  if (loading) return <div className="p-8 text-center">Memuat halaman penilaian...</div>;

  return (
    <div className="w-full bg-white text-foreground">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* HEADER */}
      <div className="bg-white mb-5 px-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <p className="text-xl font-bold text-primary">{headerInfo.eventName}</p>
            <h1 className="text-lg font-semibold text-gray-900">{headerInfo.compName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500 font-medium">Tahap: {headerInfo.stageName}</p>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin size={14} />
                <span>{headerInfo.location}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {headerInfo.meetingLink && (
                <LocationButton type="meeting" urlOrLocation={headerInfo.meetingLink} />
              )}
              {headerInfo.physicalLocation && (
                <LocationButton type="physical" urlOrLocation={headerInfo.physicalLocation} />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Telusuri peserta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="graded">Sudah Dinilai</option>
              <option value="ungraded">Belum Dinilai</option>
            </select>
          </div>
        </div>
      </div>

      {/* STICKY ACTION BAR TOP */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wide">
            {headerInfo.compType === 'team' ? 'Tim' : 'Individu'}
          </span>
          {headerInfo.evaluationType && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full uppercase tracking-wide">
              {headerInfo.evaluationType}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-green-700 bg-green-50 border border-green-200 transition-all">
          <Save className="h-4 w-4" />
          {isDirty ? 'Menyimpan...' : 'Perubahan tersimpan otomatis'}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="w-full flex-1 py-6">
        <EvaluationTable
          submissions={currentItems}
          criteria={criteria}
          competitionType={headerInfo.compType}
          scores={scores}
          notes={notes}
          onScoreChange={handleScoreChange}
          onNoteChange={handleNoteChange}
          onOpenFile={handleOpenFile}
          startIndex={startIndex}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            startIndex={startIndex}
            endIndex={startIndex + itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemName="Karya"
          />
        )}
      </div>

      {/* STICKY FOOTER NAVIGATION */}
      <div className="sticky bottom-0 z-20 px-6 py-3 flex items-center justify-between">
        <Link
          href={`/judge/home/${assignmentId}/summary`}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition ml-auto"
        >
          Lanjut ke Rekap
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}