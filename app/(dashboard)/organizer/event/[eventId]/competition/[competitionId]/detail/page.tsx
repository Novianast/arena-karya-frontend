"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, CreditCard, ChevronLeft, Landmark } from "lucide-react";
import Toast from "@/components/ui/Toast";
import CompetitionHeaderCard from "@/components/competition/organizer/CompetitionHeaderCard";
import StageList from "@/components/competition/organizer/StageList";
import { getDocumentUrl } from "@/services/url/getDocumentUrl";
import { getCompetitionDetailData } from "@/services/competition/getCompetitionDetail";

// Helper Functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
};

export default function OrganizerCompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();

  // States
  const [activeTab, setActiveTab] = useState("informasi");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message: string, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!params.competitionId) return;
        // Panggil service yang telah dipisah
        const result = await getCompetitionDetailData(params.competitionId as string);
        setData(result);
      } catch (error: any) {
        showToast(error.message || "Gagal memuat data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.competitionId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-5 border-primary border-t-transparent"></div>
      </div>
    );
  }
  if (!data?.competition) return <div className="flex min-h-screen items-center justify-center bg-white">Data tidak ditemukan.</div>;

  const { competition, activeStage, activeTimeline, participantCount, minStartDate, maxEndDate } = data;

  return (
    <div className="min-h-screen bg-white">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* Tombol Kembali */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary mb-6 transition-colors"
      >
        <ChevronLeft className="text-xl" />
        Kembali ke event
      </button>

      {/* Competition Header Card */}
      <CompetitionHeaderCard
        competitionId={params.competitionId as string}
      />

      {/* Tabs Layout */}
      <div className="flex bg-gray-100 p-2 rounded-4xl w-fit border border-gray-200 mb-6">
        <button
          onClick={() => handleTabChange("informasi")}
          className={`px-6 py-2 rounded-2xl font-semibold text-sm transition-all ${activeTab === "informasi" ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
        >
          Informasi
        </button>
        <button
          onClick={() => handleTabChange("tahapan")}
          className={`px-6 py-2 rounded-2xl font-semibold text-sm transition-all ${activeTab === "tahapan" ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
        >
          Tahapan
        </button>
      </div>

      {/* Render Konten Berdasarkan Tab */}
      {activeTab === "informasi" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kolom Kiri */}
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Deskripsi Lomba</h2>
              <p className="text-sm text-gray-600 leading-relaxed text-justify">
                {competition.description || "Belum ada deskripsi lomba."}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Detail Lomba</h2>
              <div className="space-y-4 text-sm">
                <div className="flex">
                  <span className="w-48 text-gray-500">Tipe Lomba</span>
                  <span className="mr-4">:</span>
                  <span className="font-semibold capitalize">{competition.type === 'team' ? `Tim` : `Individu`}</span>
                </div>
                <div className="flex">
                  <span className="w-48 text-gray-500">Tanggal Mulai Lomba</span>
                  <span className="mr-4">:</span>
                  <span className="font-semibold">{formatDate(minStartDate)}</span>
                </div>
                <div className="flex">
                  <span className="w-48 text-gray-500">Tanggal Akhir Lomba</span>
                  <span className="mr-4">:</span>
                  <span className="font-semibold">{formatDate(maxEndDate)}</span>
                </div>

                {competition.type === 'team' && (
                  <>
                    <div className="flex">
                      <span className="w-48 text-gray-500">Min Peserta Lomba</span>
                      <span className="mr-4">:</span>
                      <span className="font-semibold">{competition.team_size_min} Orang per Tim</span>
                    </div>
                    <div className="flex">
                      <span className="w-48 text-gray-500">Max Peserta Lomba</span>
                      <span className="mr-4">:</span>
                      <span className="font-semibold">{competition.team_size_max} Orang per Tim</span>
                    </div>
                  </>
                )}

                <div className="flex">
                  <span className="w-48 text-gray-500">Max {competition.type === 'team' ? `Tim` : `Peserta`} Terdaftar</span>
                  <span className="mr-4">:</span>
                  <span className="font-semibold">
                    {competition.type === 'team' ? `${competition.max_teams || 0} Tim` : `${competition.max_participants || 0} Orang`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-xl text-gray-800" />
                <h2 className="text-lg font-bold text-gray-900">Panduan Lomba</h2>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <a
                  href={getDocumentUrl(competition.guidebook_url, 'competitions')}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 underline decoration-gray-400 underline-offset-4">
                      Aturan Lomba {competition.competition_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF</p>
                  </div>
                  <div className="h-12 w-12 rounded bg-gray-800 bg-cover bg-center" style={{ backgroundImage: "url('/placeholder-pdf.png')" }}></div>
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="text-xl text-gray-800" />
                <h2 className="text-lg font-bold text-gray-900">Pembayaran Lomba</h2>
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Biaya Pendaftaran</p>
                  <div className="flex justify-between items-center rounded-lg border border-gray-200 p-4">
                    <span className="text-sm text-gray-600">Biaya Lomba</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(competition.price || 0)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Rekening Provider</p>
                  <div className="flex items-center gap-4 rounded-lg border border-gray-200 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100 text-blue-600">
                      <Landmark className="text-xl" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-600">BCA</p>
                      <p className="text-sm font-bold text-gray-900">450 995 5554</p>
                      <p className="text-xs text-gray-500">Rasyankan Wiwok</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Tahapan */}
      {activeTab === "tahapan" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <StageList stages={data?.stages || []} />
        </div>
      )}
    </div>
  );
}