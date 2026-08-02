"use client";

import { useState } from "react";
import { Users, FileCheck, ArrowRight, X } from "lucide-react";
import JudgeModal from "./JudgeModal";
import CriteriaModal from "./CriteriaModal";

interface StageListProps {
  stages: any[];
}

// Helper Translasi Timeline
const translateTimeline = (type: string) => {
  const map: Record<string, string> = {
    registration: "Pendaftaran",
    submission: "Pengumpulan Karya",
    presentation: "Presentasi",
    judging: "Masa Penjurian",
    announcement: "Pengumuman",
    award: "Pemberian Penghargaan",
  };
  return map[type] || type;
};

// Helper Format Tanggal
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
};

export default function StageList({ stages }: StageListProps) {
  const [judgeModal, setJudgeModal] = useState<{ isOpen: boolean; title: string; ids: number[] }>({ isOpen: false, title: "", ids: [] });
  const [criteriaModal, setCriteriaModal] = useState<{ isOpen: boolean; title: string; ids: number[] }>({ isOpen: false, title: "", ids: [] });

  const romanize = (num: number) => {
    const lookup: Record<string, number> = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '';
    for (let i in lookup) {
      while (num >= lookup[i]) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman;
  };

  const groupedBabak: any[] = [];
  let currentBabakIndex = -1;
  let babakCount = 0;

  // Pastikan stages di-sort berdasarkan stage_order
  const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order);

  sortedStages.forEach((stage) => {
    if (stage.stage_type === 'registration') {
      babakCount = 1;
      groupedBabak.push({
        title: romanize(babakCount),
        stageName: 'Pendaftaran', // default, akan tertimpa
        stageIds: [stage.stage_id],
        timelines: [...(stage.stage_timelines || [])],
        capacity: "-",
        capacityLabel: "Peserta Lolos",
        isRegistrationOnly: true
      });
      currentBabakIndex = 0;
    } else {
      let capacityStr = String(stage.max_qualified);
      let labelStr = stage.stage_type === 'final' ? "Pemenang" : "Peserta Lolos";

      if (currentBabakIndex >= 0 && groupedBabak[currentBabakIndex].isRegistrationOnly) {
        // Merge ke babak I
        groupedBabak[currentBabakIndex].stageName = stage.stage_name;
        groupedBabak[currentBabakIndex].stageIds.push(stage.stage_id);
        groupedBabak[currentBabakIndex].timelines.push(...(stage.stage_timelines || []));
        groupedBabak[currentBabakIndex].capacity = capacityStr;
        groupedBabak[currentBabakIndex].capacityLabel = labelStr;
        groupedBabak[currentBabakIndex].isRegistrationOnly = false;
      } else {
        babakCount++;
        groupedBabak.push({
          title: romanize(babakCount),
          stageName: stage.stage_name,
          stageIds: [stage.stage_id],
          timelines: [...(stage.stage_timelines || [])],
          capacity: capacityStr,
          capacityLabel: labelStr
        });
        currentBabakIndex = groupedBabak.length - 1;
      }
    }
  });

  return (
    <div className="space-y-8">
      {groupedBabak.map((babak, idx) => (
        <div key={idx} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          
          {/* Header Card Babak */}
          <div className="bg-gray-50 border-b border-gray-200 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white font-bold text-lg">
                {babak.title}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{babak.stageName}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                <Users size={16} className="text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {babak.capacity} <span className="text-gray-500 font-normal">{babak.capacityLabel}</span>
                </span>
              </div>
              
              <button 
                onClick={() => setJudgeModal({ isOpen: true, title: babak.stageName, ids: babak.stageIds })}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Lihat Juri <ArrowRight size={16} />
              </button>
              
              <button 
                onClick={() => setCriteriaModal({ isOpen: true, title: babak.stageName, ids: babak.stageIds })}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Lihat Kriteria <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Table Timeline Internal */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium w-16">No</th>
                  <th className="px-6 py-3 font-medium">Tahapan</th>
                  <th className="px-6 py-3 font-medium">Tanggal Mulai</th>
                  <th className="px-6 py-3 font-medium">Tanggal Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {babak.timelines.length > 0 ? (
                  [...babak.timelines].sort((a, b) => a.timeline_order - b.timeline_order).map((timeline: any, tIdx: number) => (
                    <tr key={timeline.timeline_id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-900">{tIdx + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{translateTimeline(timeline.timeline_type)}</td>
                      <td className="px-6 py-4">{formatDate(timeline.start_date)}</td>
                      <td className="px-6 py-4">{formatDate(timeline.end_date)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Belum ada tahapan yang dijadwalkan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Render Component Modals */}
      <JudgeModal 
        isOpen={judgeModal.isOpen} 
        onClose={() => setJudgeModal({ ...judgeModal, isOpen: false })} 
        babakTitle={judgeModal.title} 
        stageIds={judgeModal.ids} 
      />
      
      <CriteriaModal 
        isOpen={criteriaModal.isOpen} 
        onClose={() => setCriteriaModal({ ...criteriaModal, isOpen: false })} 
        babakTitle={criteriaModal.title} 
        stageIds={criteriaModal.ids} 
      />
    </div>
  );
}