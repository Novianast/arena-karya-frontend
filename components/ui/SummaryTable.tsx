"use client";
import { Info, Link as LinkIcon, Users, FileText } from "lucide-react";
import Tooltip from "./Tooltip";
import Link from "next/link";

interface SummaryTableProps {
  submissions: any[];
  criteria: any[];
  competitionType: string;
  scores: Record<number, Record<number, number | string>>;
  ranks: Record<number, { avg_judge: number; judge_rank: number }>;
  onOpenFile: (filePath: string) => void;
  startIndex: number;
}

export default function SummaryTable({
  submissions,
  criteria,
  competitionType,
  scores,
  ranks,
  onOpenFile,
  startIndex
}: SummaryTableProps) {
  return (
    <div className="w-full max-h-[65vh] overflow-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 font-semibold text-center w-12">No</th>
            <th className="px-4 py-3 font-semibold">Nama {competitionType === 'team' ? 'Tim' : 'Peserta'}</th>
            <th className="px-4 py-3 font-semibold text-center w-32">Karya</th>
            
            {/* Kolom Kriteria Dinamis */}
            {criteria.map((crit) => (
              <th key={crit.criteria_id} className="px-4 py-3 font-semibold text-center w-28">
                <div className="flex items-center justify-center gap-1">
                  <span>{crit.name}</span>
                  <Tooltip
                    content={
                      <div className="text-left">
                        <p className="font-bold border-b border-gray-600 pb-1 mb-1">{crit.name} ({crit.weight}%)</p>
                      </div>
                    }
                  >
                    <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                  </Tooltip>
                </div>
              </th>
            ))}
            
            <th className="px-4 py-3 font-semibold text-center w-32 text-blue-700">Rata-rata Nilai</th>
            <th className="px-4 py-3 font-semibold text-center w-24 text-blue-700">Rank</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {submissions.length === 0 ? (
            <tr>
              <td colSpan={criteria.length + 5} className="py-8 text-center text-gray-500">
                Tidak ada data peserta/karya yang ditemukan.
              </td>
            </tr>
          ) : (
            submissions.map((sub, idx) => {
              const entryName = sub.entries?.entry_name || "Tanpa Nama";
              const members = sub.entries?.entry_members || [];
              const rankData = ranks[sub.submission_id];

              return (
                <tr key={sub.submission_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-center">{startIndex + idx + 1}</td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      {entryName}
                      {competitionType === 'team' && members.length > 0 && (
                        <Tooltip
                          content={
                            <div className="text-left">
                              <p className="font-bold border-b border-gray-600 pb-1 mb-1">Anggota Tim</p>
                              <ul className="text-xs text-gray-300 list-disc pl-4 space-y-1">
                                {members.map((m: any) => (
                                  <li key={m.member_id}>{m.participants?.profiles?.username || 'Unknown'}</li>
                                ))}
                              </ul>
                            </div>
                          }
                        >
                          <Users className="h-4 w-4 text-blue-500 cursor-pointer" />
                        </Tooltip>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-2">
                      {sub.file_url && (
                        <button
                          onClick={() => onOpenFile(sub.file_url)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                        >
                          <FileText className="h-3.5 w-3.5" /> File
                        </button>
                      )}
                      {sub.link_url && (
                        <Link 
                          href={sub.link_url.startsWith('http') ? sub.link_url : `https://${sub.link_url}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition"
                        >
                          <LinkIcon className="h-3.5 w-3.5" /> Link
                        </Link>
                      )}
                      {!sub.file_url && !sub.link_url && (
                         <span className="text-gray-400 italic text-xs">Kosong</span>
                      )}
                    </div>
                  </td>

                  {/* Nilai per Kriteria (Read-only) */}
                  {criteria.map((crit) => {
                    const score = scores[sub.submission_id]?.[crit.criteria_id];
                    return (
                      <td key={crit.criteria_id} className="px-4 py-3 text-center text-gray-700 font-medium">
                        {score !== undefined && score !== "" ? score : (
                          <span className="text-red-400 text-xs italic">Kosong</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Rata-rata dan Rank dari View */}
                  <td className="px-4 py-3 text-center font-bold text-blue-600">
                    {rankData?.avg_judge !== undefined ? Number(rankData.avg_judge).toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">
                    {rankData?.judge_rank !== undefined ? rankData.judge_rank : '-'}
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