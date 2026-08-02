"use client";

import { useEffect, useState } from "react";
import { Flag, List, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CompetitionHeaderCardProps {
  competitionId: string;
  activeStageId?: number;
}

// Helpers
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
};

const translateTimeline = (type: string) => {
  const map: Record<string, string> = {
    registration: "Pendaftaran",
    submission: "Pengumpulan",
    judging: "Penjurian",
    announcement: "Pengumuman",
    award: "Penghargaan",
  };
  return map[type] || type;
};

// Map Stage Name ke Romawi
const formatStageToRoman = (stageName?: string | null) => {
  if (!stageName) return "-";
  const lowerName = stageName.toLowerCase();
  
  if (lowerName === "pendaftaran") return "I";
  if (lowerName.startsWith("babak ")) return stageName.substring(6).trim();
  
  return stageName;
};

export default function CompetitionHeaderCard({
  competitionId,
  activeStageId,
}: CompetitionHeaderCardProps) {
  const [data, setData] = useState({
    competitionName: "",
    status: "",
    minStartDate: null as string | null,
    maxEndDate: null as string | null,
    activeStageName: null as string | null,
    activeTimelineType: null as string | null,
    isFinalStage: false,
    participantCount: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!competitionId) return;
      setLoading(true);

      try {
        // 1. Competition info
        const { data: comp } = await supabase
          .from("competitions")
          .select("competition_name, status")
          .eq("competition_id", competitionId)
          .single();

        // 2. Participant count
        const { count } = await supabase
          .from("entries")
          .select("*", { count: "exact", head: true })
          .eq("competition_id", competitionId);

        // 3. Stages and Timelines
        const { data: stages } = await supabase
          .from("stages")
          .select(`
            stage_id, stage_name, stage_type,
            stage_timelines ( timeline_type, start_date, end_date )
          `)
          .eq("competition_id", competitionId)
          .order("stage_id", { ascending: true });

        let minDate: Date | null = null;
        let maxDate: Date | null = null;
        let currentActiveType: string | null = null;
        let currentActiveStageName: string | null = null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (stages) {
          stages.forEach((stg: any) => {
            if (activeStageId && stg.stage_id === activeStageId) {
               currentActiveStageName = stg.stage_name;
            }

            stg.stage_timelines?.forEach((tl: any) => {
              if (tl.start_date) {
                const start = new Date(tl.start_date);
                start.setHours(0, 0, 0, 0);
                if (!minDate || start < minDate) minDate = start;
              }
              if (tl.end_date) {
                const end = new Date(tl.end_date);
                end.setHours(23, 59, 59, 999);
                if (!maxDate || end > maxDate) maxDate = end;
              }

              if (tl.start_date && tl.end_date) {
                const start = new Date(tl.start_date);
                const end = new Date(tl.end_date);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                
                if (today >= start && today <= end) {
                  currentActiveType = tl.timeline_type;
                  if (!activeStageId) {
                     currentActiveStageName = stg.stage_name;
                  }
                }
              }
            });
          });
        }

        let isEnded = comp?.status === 'end';
        if (maxDate && today.getTime() > (maxDate as Date).getTime()) {
          isEnded = true;
        }

        let isFinal = false;

        if (isEnded && stages && stages.length > 0) {
          const finalStage = stages.find((s: any) => s.stage_type === 'final') || stages[stages.length - 1];
          currentActiveStageName = finalStage.stage_name;
          currentActiveType = "Selesai";
          isFinal = true;
        } else if (stages) {
          const activeStageObj = stages.find((s: any) => s.stage_name === currentActiveStageName);
          if (activeStageObj && activeStageObj.stage_type === 'final') {
            isFinal = true;
          }
        }

        setData({
          competitionName: comp?.competition_name || "-",
          status: comp?.status || "draft",
          minStartDate: minDate ? (minDate as Date).toISOString() : null,
          maxEndDate: maxDate ? (maxDate as Date).toISOString() : null,
          activeStageName: currentActiveStageName,
          activeTimelineType: currentActiveType,
          isFinalStage: isFinal,
          participantCount: count || 0
        });
      } catch (err) {
        console.error("Failed to fetch competition header data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [competitionId, activeStageId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-40 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-2 divide-x divide-gray-200">
          <div className="flex items-center gap-3 pl-0 md:pl-6 px-4">
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            <div><div className="h-4 w-16 bg-gray-200 rounded mb-1"></div><div className="h-3 w-10 bg-gray-200 rounded"></div></div>
          </div>
          <div className="flex items-center gap-3 pl-6 px-4">
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            <div><div className="h-4 w-16 bg-gray-200 rounded mb-1"></div><div className="h-3 w-10 bg-gray-200 rounded"></div></div>
          </div>
          <div className="flex items-center gap-3 pl-6">
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            <div><div className="h-4 w-16 bg-gray-200 rounded mb-1"></div><div className="h-3 w-10 bg-gray-200 rounded"></div></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{data.competitionName}</h1>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${data.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current"></span>
            {data.status === 'active' ? 'Aktif' : 'Selesai'}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          {formatDate(data.minStartDate)} - {formatDate(data.maxEndDate)}
        </p>
      </div>

      <div className="flex items-center gap-2 divide-x divide-gray-200">
        <div className="flex items-center gap-3 pl-0 md:pl-6 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <Flag className="text-xl" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">
              {formatStageToRoman(data.activeStageName)}
              {data.isFinalStage && !formatStageToRoman(data.activeStageName)}
            </p>
            <p className="text-xs text-gray-500">Babak</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 pl-6 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
            <List className="text-xl" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">
              {data.activeTimelineType ? translateTimeline(data.activeTimelineType) : "-"}
            </p>
            <p className="text-xs text-gray-500">Tahapan</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Users className="text-xl" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">{data.participantCount || "-"}</p>
            <p className="text-xs text-gray-500">Jumlah Peserta</p>
          </div>
        </div>
      </div>
    </div>
  );
}