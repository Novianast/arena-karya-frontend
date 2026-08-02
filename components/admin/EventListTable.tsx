"use client";

import React, { useState } from "react";
import { PlayCircle, CheckCircle, XCircle, FileText, ChevronDown } from "lucide-react";
import ConfirmPopup from "@/components/ui/ConfirmPopup";

interface EventListTableProps {
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  onStatusChange?: (eventId: number, newStatus: string) => void;
  onCompetitionStatusChange?: (competitionId: number, newStatus: string) => void;
}

export default function EventListTable({
  data,
  loading = false,
  emptyMessage = "Tidak ada event yang ditemukan.",
  onStatusChange,
  onCompetitionStatusChange,
}: EventListTableProps) {
  const [selectedEventCompetitions, setSelectedEventCompetitions] = useState<any[] | null>(null);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return "-";
    }
  };

  const handleOpenCompetitions = (competitions: any[]) => {
    setSelectedEventCompetitions(competitions);
    setShowCompetitionModal(true);
  };

  const handleCloseModal = () => {
    setShowCompetitionModal(false);
    setTimeout(() => setSelectedEventCompetitions(null), 200);
  };

  const handleCompetitionStatusChangeClick = (comp: any, newStatus: string) => {
    if (comp.status === newStatus) return;

    const statusMap: Record<string, string> = {
      draft: "Draft",
      ready: "Siap",
      active: "Aktif",
      end: "Selesai",
      cancelled: "Dibatalkan",
    };

    setConfirmConfig({
      isOpen: true,
      title: "Ubah Status Lomba",
      message: `Apakah Anda yakin ingin mengubah status lomba "${comp.competition_name}" dari ${statusMap[comp.status] || comp.status} menjadi ${statusMap[newStatus]}?`,
      onConfirm: () => {
        if (onCompetitionStatusChange) {
          onCompetitionStatusChange(comp.competition_id, newStatus);
          
          // Update local modal state so UI reflects immediately after confirmation
          setSelectedEventCompetitions(prev => 
            prev ? prev.map(c => c.competition_id === comp.competition_id ? { ...c, status: newStatus } : c) : null
          );
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <>
      <ConfirmPopup
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold w-12">No</th>
                <th className="px-6 py-4 font-bold">Nama Event</th>
                <th className="px-6 py-4 font-bold">Penyelenggara</th>
                <th className="px-6 py-4 font-bold">Paket</th>
                <th className="px-6 py-4 font-bold">Tanggal Mulai</th>
                <th className="px-6 py-4 font-bold">Tanggal Berakhir</th>
                <th className="px-6 py-4 font-bold text-center">Lomba</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  const pkgName = item.package_payments?.packages?.package_name || "-";
                  const organizerName = item.organizers?.organization_name || "-";
                  const competitions = item.competitions || [];

                  return (
                    <tr key={item.event_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.event_name}</td>
                      <td className="px-6 py-4 text-gray-600">{organizerName}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 font-medium">
                          {pkgName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(item.start_date)}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(item.end_date)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenCompetitions(competitions)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium rounded-lg transition-colors border border-blue-200"
                        >
                          Lihat Lomba ({competitions.length})
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative inline-block w-[130px]">
                          <select
                            value={item.status}
                            onChange={(e) => onStatusChange && onStatusChange(item.event_id, e.target.value)}
                            className={`w-full text-xs font-semibold rounded-lg pl-3 pr-8 py-2 border outline-none cursor-pointer appearance-none transition-colors
                              ${item.status === 'active' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                item.status === 'end' ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' :
                                  item.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                                    'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                              }
                            `}
                          >
                            <option value="active" className="bg-white text-gray-900 font-medium">Aktif</option>
                            <option value="end" className="bg-white text-gray-900 font-medium">Selesai</option>
                            <option value="cancelled" className="bg-white text-gray-900 font-medium">Dibatalkan</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lomba */}
      {showCompetitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Daftar Lomba</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {selectedEventCompetitions && selectedEventCompetitions.length > 0 ? (
                <div className="space-y-4">
                  {selectedEventCompetitions.map((comp) => {
                    // Cek stage yang sedang berjalan (status = ongoing/active)
                    const ongoingStages = comp.stages?.filter((s: any) => s.status === 'ongoing' || s.status === 'active') || [];

                    return (
                      <div key={comp.competition_id} className="p-4 border border-gray-200 rounded-xl hover:border-blue-200 transition-colors bg-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900 text-base">{comp.competition_name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium capitalize">
                                Tipe: {comp.type || 'Individual'}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
                                Biaya: {comp.price && comp.price > 0 ? `Rp ${comp.price.toLocaleString('id-ID')}` : 'Gratis'}
                              </span>
                            </div>
                          </div>
                          {comp.status === 'draft' || comp.status === 'ready' ? (
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border
                              ${comp.status === 'ready' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}
                            `}>
                              {comp.status === 'ready' ? 'Siap' : 'Draft'}
                            </span>
                          ) : (
                            <div className="relative inline-block w-[130px]">
                              <select
                                value={comp.status}
                                onChange={(e) => handleCompetitionStatusChangeClick(comp, e.target.value)}
                                className={`w-full text-xs font-semibold rounded-lg pl-3 pr-8 py-2 border outline-none cursor-pointer appearance-none transition-colors
                                  ${comp.status === 'active' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                    comp.status === 'end' ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' :
                                      comp.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                                        'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                  }
                                `}
                              >
                                <option value="active" className="bg-white text-gray-900 font-medium">Aktif</option>
                                <option value="end" className="bg-white text-gray-900 font-medium">Selesai</option>
                                <option value="cancelled" className="bg-white text-gray-900 font-medium">Dibatalkan</option>
                              </select>
                              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Tahapan Sedang Berjalan:</p>
                          {ongoingStages.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {ongoingStages.map((stage: any, idx: number) => (
                                <span key={idx} className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                  {stage.stage_name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">Tidak ada tahapan yang sedang berjalan.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Belum ada lomba di event ini.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
