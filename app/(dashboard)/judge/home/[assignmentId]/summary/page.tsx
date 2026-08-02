"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getAssignmentSummary } from "@/services/judge/judgeSummary"; 
import { supabase } from "@/lib/supabase"; 
import Toast from "@/components/ui/Toast";
import Pagination from "@/components/ui/Pagination";
import SummaryTable from "@/components/ui/SummaryTable";
import ConfirmPopup from "@/components/ui/ConfirmPopup";


export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [loading, setLoading] = useState(true);
  const [judgeId, setJudgeId] = useState<number | null>(null);
  const [headerInfo, setHeaderInfo] = useState<any>({});
  const [criteria, setCriteria] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  const [scores, setScores] = useState<Record<number, Record<number, number | string>>>({});
  const [ranks, setRanks] = useState<Record<number, { avg_judge: number; judge_rank: number }>>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const showToast = (message: string, type: string = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
    const data = await getAssignmentSummary(assignmentId);
    
    setJudgeId(data.judgeId);
    setHeaderInfo(data.headerInfo);
    setCriteria(data.criteria);
    setSubmissions(data.submissions);
    setScores(data.scores);
    setRanks(data.ranks);

    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Gagal memuat data rekap atau penugasan tidak ditemukan. Mengalihkan...", "error");
      setTimeout(() => router.push('/judge/home'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) {
      fetchSummaryData();
    }
  }, [assignmentId]);

  const handleOpenFile = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from('submissions').createSignedUrl(filePath, 3600);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (err) {
      showToast("Gagal membuka file karya.", "error");
    }
  };

  const handleSelesaiClick = () => {
    // Cek apakah semua submission memiliki nilai untuk semua kriteria
    let isIncomplete = false;
    for (const sub of submissions) {
      for (const crit of criteria) {
        const currentScore = scores[sub.submission_id]?.[crit.criteria_id];      
        if (currentScore === undefined || currentScore === null || currentScore === "") {
          isIncomplete = true;
          break;
        }
      }
    }

    if (isIncomplete) {
      showToast("Gagal: Masih ada karya atau kriteria yang belum Anda nilai!", "error");
      return;
    }

    setIsPopupOpen(true);
  };

  const handleConfirmSelesai = async () => {
    setIsCompleting(true);
    try {
      const { error } = await supabase
        .from('judge_assignments')
        .update({ status: 'completed' })
        .eq('assignment_id', assignmentId);

      if (error) throw error;
      
      showToast("Penilaian berhasil diselesaikan!", "success");
      setIsPopupOpen(false);
      
      // Redirect ke riwayat setelah 1.5 detik
      setTimeout(() => {
        router.push('/judge/history');
      }, 1500);

    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan sistem.", "error");
      setIsCompleting(false);
    }
  };

  // Pagination Logic
  const totalItems = submissions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = submissions.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <div className="p-8 text-center">Memuat halaman rekap...</div>;

  return (
    <div className="w-full bg-white text-foreground">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      
      <ConfirmPopup 
        isOpen={isPopupOpen}
        title={
          <>
            Selesaikan Penilaian Penjurian<br/>
            {headerInfo.stageName} ?
          </>
        }
        message="Nilai akan disimpan permanen ke Sistem dan status penugasan akan diselesaikan."
        onCancel={() => setIsPopupOpen(false)}
        onConfirm={handleConfirmSelesai}
      />

      {/* HEADER */}
      <div className="bg-white mb-5 px-4">
        <div>
          <p className="text-xl font-bold text-primary">{headerInfo.eventName}</p>
          <h1 className="text-lg font-semibold text-gray-900">{headerInfo.compName}</h1>
          <p className="text-s text-gray-500 font-medium">Tahap: {headerInfo.stageName} (Rangkuman Nilai)</p>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="w-full flex-1 py-6">
        <SummaryTable 
          submissions={currentItems}
          criteria={criteria}
          competitionType={headerInfo.compType}
          scores={scores}
          ranks={ranks}
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
          href={`/judge/home/${assignmentId}`}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition border border-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali Menilai
        </Link>

        <button 
          onClick={handleSelesaiClick}
          disabled={isCompleting}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompleting ? "Memproses..." : "Selesai Menilai"}
          <CheckCircle className="h-4 w-4" />
        </button>

      </div>
    </div>
  );
}