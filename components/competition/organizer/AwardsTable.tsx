"use client";

import { Award, UploadCloud, CheckCircle } from "lucide-react";

interface AwardsTableProps {
  rows: any[];
  onOpenUploadModal: (entryData: any) => void;
  isAwardActive?: boolean;
}

export default function AwardsTable({ rows, onOpenUploadModal, isAwardActive = false }: AwardsTableProps) {
  return (
    <div className="w-full max-h-[65vh] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-4 font-semibold text-center w-12">No</th>
            <th className="px-4 py-4 font-semibold min-w-[180px]">Nama Peserta/Tim</th>
            <th className="px-4 py-4 font-semibold text-center min-w-[140px]">Gelar Juara</th>
            <th className="px-4 py-4 font-semibold text-center min-w-[140px]">Sertifikat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-12 text-center text-gray-400">
                Belum ada data peserta yang mendapatkan penghargaan.
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const hasCertificate = !!(row.certificate_file_path || row.certificate_external_url);

              return (
                <tr key={row.entry_id} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-center font-medium text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900">{row.entry_name}</p>
                    {row.members && row.members.length > 0 && (
                      <p className="text-[11px] text-gray-500 mt-1 truncate max-w-[250px]">
                        {row.members.map((m: any) => m.name).join(", ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs">
                      <Award size={14} />
                      {row.award_category_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {hasCertificate ? (
                      <button 
                        onClick={() => onOpenUploadModal(row)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                          !isAwardActive 
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200" 
                            : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                        }`}
                      >
                        <CheckCircle size={14} />
                        {!isAwardActive ? "Lihat" : "Ganti / Lihat"}
                      </button>
                    ) : (
                      <button 
                        onClick={() => onOpenUploadModal(row)}
                        disabled={!isAwardActive}
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-xs transition-colors shadow-sm ${
                          !isAwardActive
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <UploadCloud size={14} />
                        Unggah
                      </button>
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
