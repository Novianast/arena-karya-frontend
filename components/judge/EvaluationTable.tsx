"use client";
import { Info, Link as LinkIcon, Users, FileText} from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import Link from "next/link";

interface EvaluationTableProps {
  submissions: any[];
  criteria: any[];
  competitionType: string;
  scores: Record<number, Record<number, number | string>>;
  notes: Record<number, string>;
  onScoreChange: (submissionId: number, criteriaId: number, value: string) => void;
  onNoteChange: (submissionId: number, value: string) => void;
  onOpenFile: (filePath: string) => void;
  startIndex: number;
}

export default function EvaluationTable({
  submissions,
  criteria,
  competitionType,
  scores,
  notes,
  onScoreChange,
  onNoteChange,
  onOpenFile,
  startIndex
}: EvaluationTableProps) {
  return (
    <div className="w-full max-h-[65vh] overflow-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 font-semibold text-center w-12">No</th>
            <th className="px-4 py-3 font-semibold w-[22%] min-w-[200px]">Nama {competitionType === 'team' ? 'Tim' : 'Peserta'}</th>
            <th className="px-4 py-3 font-semibold text-center w-[20%] min-w-[180px]">Karya</th>

            {/* Render Kolom Kriteria Dinamis */}
            {criteria.map((crit) => (
              <th key={crit.criteria_id} className="px-4 py-3 font-semibold text-center min-w-[140px] w-auto">
                <div className="flex items-center justify-center gap-1">
                  <span>{crit.name}</span>
                  <Tooltip
                    content={
                      <div className="text-left">
                        <p className="font-bold border-b border-gray-600 pb-1 mb-1">{crit.name} ({crit.weight}%)</p>
                        <p className="text-xs text-gray-300">{crit.description}</p>
                      </div>
                    }
                  >
                    <Info className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-pointer" />
                  </Tooltip>
                </div>
              </th>
            ))}
            <th className="px-4 py-3 font-semibold w-[22%] min-w-[200px]">Catatan (Opsional)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {submissions.length === 0 ? (
            <tr>
              <td colSpan={criteria.length + 4} className="py-8 text-center text-gray-500">
                Tidak ada data peserta/karya yang ditemukan.
              </td>
            </tr>
          ) : (
            submissions.map((sub, idx) => {
              const entryName = sub.entries?.entry_name || "Tanpa Nama";
              const members = sub.entries?.entry_members || [];

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

                  {/* Kolom Karya */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-2">
                      {/* Tombol File URL */}
                      {sub.file_url && (
                        <button
                          onClick={() => onOpenFile(sub.file_url)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Buka File
                        </button>
                      )}

                      {/* Tombol Link URL */}
                      {sub.link_url && (
                        <Link
                          href={sub.link_url.startsWith('http') ? sub.link_url : `https://${sub.link_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          Link Karya
                        </Link>
                      )}

                      {/* Jika Keduanya Kosong */}
                      {!sub.file_url && !sub.link_url && (
                        <span className="text-gray-400 italic text-xs">Belum upload</span>
                      )}
                    </div>
                  </td>

                  {/* Input Skor */}
                  {criteria.map((crit) => (
                    <td key={crit.criteria_id} className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        placeholder="0-100"
                        value={scores[sub.submission_id]?.[crit.criteria_id] ?? ""}
                        onChange={(e) => onScoreChange(sub.submission_id, crit.criteria_id, e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                      />
                    </td>
                  ))}

                  <td className="px-4 py-3">
                    <textarea
                      rows={1}
                      placeholder="Tambahkan catatan..."
                      value={notes[sub.submission_id] || ""}
                      onChange={(e) => onNoteChange(sub.submission_id, e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                    />
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