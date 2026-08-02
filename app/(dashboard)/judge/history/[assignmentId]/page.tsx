"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { getAssignmentSummary } from "@/services/judge/judgeSummary"; 
import Toast from "@/components/ui/Toast";
import Pagination from "@/components/ui/Pagination";
import SummaryTable from "@/components/ui/SummaryTable";
import LocationButton from "@/components/ui/LocationButton";

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;
  const [judgeId, setJudgeId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [headerInfo, setHeaderInfo] = useState<any>({});
  const [criteria, setCriteria] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<number, Record<number, number | string>>>({});
  const [ranks, setRanks] = useState<Record<number, { avg_judge: number; judge_rank: number }>>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

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
      setTimeout(() => router.push('/judge/history'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) {
      fetchSummaryData();
    }
  }, [assignmentId]);

  // Pagination Logic
  const totalItems = submissions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = submissions.slice(startIndex, startIndex + itemsPerPage);

  if (loading) return <div className="p-8 text-center">Memuat detail riwayat...</div>;

  return (
    <div className="w-full bg-white text-foreground">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* HEADER */}
      <div className="bg-white mb-5 px-4">
        <div>
          <p className="text-xl font-bold text-primary">{headerInfo.eventName}</p>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-lg font-semibold text-gray-900">{headerInfo.compName}</h1>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wide">
              {headerInfo.compType === 'team' ? 'Tim' : 'Individu'}
            </span>
            {headerInfo.evaluationType && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full uppercase tracking-wide">
                {headerInfo.evaluationType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500 font-medium">Tahap: {headerInfo.stageName} (Riwayat Penilaian)</p>
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
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="w-full flex-1 py-6">
        <SummaryTable 
          submissions={currentItems}
          criteria={criteria}
          competitionType={headerInfo.compType}
          scores={scores}
          ranks={ranks}
          onOpenFile={() => {}}
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

      {/* FOOTER NAVIGATION */}
      <div className="sticky bottom-0 z-20 px-6 py-3 border-t border-gray-100 bg-white">
        <Link 
          href="/judge/history"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition border border-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Riwayat
        </Link>
      </div>
    </div>
  );
}