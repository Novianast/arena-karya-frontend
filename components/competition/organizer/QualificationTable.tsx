"use client";

import { Link as LinkIcon, FileText, Info, Award, UserCheck } from "lucide-react";
import Link from "next/link";
import Tooltip from "@/components/ui/Tooltip";
import { supabase } from "@/lib/supabase";

interface QualificationTableProps {
  isFinal: boolean;
  judges: any[];
  rows: any[];
  awardCategories: any[];
  selectedQualifications: Record<number, boolean>;
  selectedAwards: Record<number, number | "">;
  onToggleQualification: (participantId: number) => void;
  onAwardChange: (participantId: number, categoryId: number | "") => void;
  onOpenFile: (url: string) => void;
  isAnnounced?: boolean;
}

export default function QualificationTable({
  isFinal,
  judges,
  rows,
  awardCategories,
  selectedQualifications,
  selectedAwards,
  onToggleQualification,
  onAwardChange,
  onOpenFile,
  isAnnounced = false,
}: QualificationTableProps) {

  // Helper untuk mendapatkan gambar profil juri
  const getImageUrl = (fileName: string | null) => {
    if (!fileName) return "/placeholder-avatar.png";
    if (fileName.startsWith("http")) return fileName;
    return supabase.storage.from("profiles").getPublicUrl(`judges/${fileName}`).data.publicUrl;
  };

  return (
    <div className="w-full max-h-[65vh] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-4 font-semibold text-center w-12">No</th>
            <th className="px-4 py-4 font-semibold min-w-[180px]">Nama Peserta/Tim</th>
            <th className="px-4 py-4 font-semibold text-center min-w-[140px]">Link Karya</th>
            
            {/* Header Juri Dinamis (Maksimal 5) */}
            {judges.map((judge, idx) => (
              <th key={judge.judge_id} className="px-2 py-4 font-semibold text-center min-w-[100px]">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="truncate max-w-[70px]">Juri {idx + 1}</span>
                  <Tooltip
                    content={
                      <div className="flex items-center gap-3 text-left p-1">
                        <img 
                          src={getImageUrl(judge.judges?.profiles?.profile_image)} 
                          alt="Profil Juri" 
                          className="w-10 h-10 rounded-full object-cover bg-gray-800"
                        />
                        <div>
                          <p className="font-bold text-white">{judge.judges?.profiles?.username || "Nama Juri"}</p>
                          <p className="text-xs text-gray-300">{judge.judges?.institution || "Instansi"}</p>
                        </div>
                      </div>
                    }
                  >
                    <Info className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors" />
                  </Tooltip>
                </div>
              </th>
            ))}

            <th className="px-4 py-4 font-semibold text-center w-24">Skor Akhir</th>
            <th className="px-4 py-4 font-semibold text-center w-20">Rank</th>
            
            {/* Kolom Aksi Dinamis berdasarkan Final/Penyisihan */}
            <th className="px-4 py-4 font-semibold text-center min-w-[180px]">
              <div className="flex items-center justify-center gap-1.5">
                {isFinal ? "Gelar Juara" : "Kelulusan"}
                <Tooltip
                  content={
                    <div className="text-left w-48">
                      <p className="text-xs text-gray-100">
                        {isFinal 
                          ? "Berikan gelar juara pada peserta lomba."
                          : "Centang untuk meloloskan peserta ke babak selanjutnya."}
                      </p>
                    </div>
                  }
                >
                  <Info className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-pointer" />
                </Tooltip>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
             <tr>
               <td colSpan={judges.length + 6} className="py-12 text-center text-gray-400">
                 Belum ada data peserta atau evaluasi.
               </td>
             </tr>
          ) : (
            rows.map((row, idx) => {
              const isChecked = selectedQualifications[row.participantId] || false;
              const isTopRank = row.rank === 1;

              return (
                <tr key={row.participantId} className={`transition-colors ${isChecked ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-center font-medium text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{row.entryName}</td>
                  
                  {/* Kolom Karya[cite: 7] */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      {row.fileUrl && (
                        <button onClick={() => onOpenFile(row.fileUrl)} className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                          <FileText className="h-3.5 w-3.5" /> File
                        </button>
                      )}
                      {row.linkUrl && (
                        <Link href={row.linkUrl.startsWith('http') ? row.linkUrl : `https://${row.linkUrl}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                          <LinkIcon className="h-3.5 w-3.5" /> Link
                        </Link>
                      )}
                      {!row.fileUrl && !row.linkUrl && <span className="text-gray-400 italic text-xs">-</span>}
                    </div>
                  </td>

                  {/* Nilai Rata-rata Tiap Juri */}
                  {judges.map((judge) => (
                    <td key={judge.judge_id} className="px-2 py-3 text-center font-medium text-blue-600">
                      {row.judgeScores[judge.judge_id] !== undefined 
                        ? row.judgeScores[judge.judge_id].toFixed(1) 
                        : <span className="text-gray-300">-</span>}
                    </td>
                  ))}

                  {/* Skor Akhir & Rank */}
                  <td className="px-4 py-3 text-center font-bold text-red-500">{row.finalScore > 0 ? row.finalScore.toFixed(2) : '-'}</td>
                  <td className="px-4 py-3 text-center font-black text-blue-700">{row.rank > 0 ? row.rank : '-'}</td>

                  {/* Aksi: Checkbox (Penyisihan) / Dropdown (Final) */}
                  <td className="px-4 py-3 text-center">
                    {isFinal ? (
                      <select
                        value={selectedAwards[row.participantId] || ""}
                        onChange={(e) => onAwardChange(row.participantId, e.target.value ? Number(e.target.value) : "")}
                        disabled={isAnnounced}
                        className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          selectedAwards[row.participantId] ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold' : 'bg-white border-gray-300 text-gray-600'
                        } ${isAnnounced ? 'opacity-70 cursor-not-allowed bg-gray-100 text-gray-500' : ''}`}
                      >
                        <option value="">-- Beri Gelar Juara --</option>
                        {awardCategories.map(cat => (
                          <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex justify-center">
                        <label className="relative flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="peer sr-only"
                            checked={isChecked}
                            disabled={isAnnounced}
                            onChange={() => onToggleQualification(row.participantId)}
                          />
                          <div className={`h-6 w-6 rounded border-2 bg-white flex items-center justify-center transition-all ${
                            isAnnounced ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-70" : "border-gray-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 hover:border-blue-400"
                          }`}>
                            <UserCheck className={`h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100 ${isChecked ? 'opacity-100' : ''}`} strokeWidth={3} />
                          </div>
                        </label>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}