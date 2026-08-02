"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import CompetitionHeaderCard from "@/components/competition/organizer/CompetitionHeaderCard";
import TimelineStepper from "@/components/competition/organizer/TimelineStepper";
import TimelineActionCards from "@/components/competition/organizer/TimelineActionCards";

export default function OrganizerTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = params.competitionId as string;

  const [competition, setCompetition] = useState<any>(null);
  const [groupedStages, setGroupedStages] = useState<any[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Data agregat untuk Cards
  const [totalEntries, setTotalEntries] = useState(0);
  const [qualifiedParticipants, setQualifiedParticipants] = useState(0);

  useEffect(() => {
    const fetchTimelineData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Competition
        const { data: compData } = await supabase
          .from("competitions")
          .select("*")
          .eq("competition_id", competitionId)
          .single();
        setCompetition(compData);

        // 2. Fetch Stages & Timelines
        const { data: stagesData } = await supabase
          .from("stages")
          .select(`*, stage_timelines(*)`)
          .eq("competition_id", competitionId)
          .order("stage_order", { ascending: true });

        // 3. Fetch Jumlah Pendaftar (Entries)
        const { count: entriesCount } = await supabase
          .from("entries")
          .select("*", { count: "exact", head: true })
          .eq("competition_id", competitionId);
        setTotalEntries(entriesCount || 0);

        if (stagesData) {
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

          const groups: any[] = [];
          let currentBabakIndex = -1;
          let babakCount = 0;

          stagesData.forEach((stage: any) => {
            if (stage.stage_type === 'registration') {
              babakCount = 1;
              groups.push({
                title: "I",
                stageName: 'Pendaftaran',
                stageIds: [stage.stage_id],
                timelines: [...(stage.stage_timelines || [])],
                capacity: stage.max_qualified,
                isFinal: false,
                startDate: stage.start_date,
                babakStartDate: stage.end_date,
                endDate: stage.end_date,
                isRegistrationOnly: true
              });
              currentBabakIndex = 0;
            } else {
              if (currentBabakIndex >= 0 && groups[currentBabakIndex].isRegistrationOnly) {
                groups[currentBabakIndex].stageName = stage.stage_name;
                groups[currentBabakIndex].stageIds.push(stage.stage_id);
                groups[currentBabakIndex].timelines.push(...(stage.stage_timelines || []));
                groups[currentBabakIndex].capacity = stage.max_qualified;
                groups[currentBabakIndex].isFinal = stage.stage_type === 'final';
                groups[currentBabakIndex].endDate = stage.end_date;
                groups[currentBabakIndex].isRegistrationOnly = false;
              } else {
                babakCount++;
                groups.push({
                  title: romanize(babakCount),
                  stageName: stage.stage_name,
                  stageIds: [stage.stage_id],
                  timelines: [...(stage.stage_timelines || [])],
                  capacity: stage.max_qualified,
                  isFinal: stage.stage_type === 'final',
                  startDate: stage.start_date,
                  babakStartDate: stage.start_date,
                  endDate: stage.end_date,
                  isRegistrationOnly: false
                });
                currentBabakIndex = groups.length - 1;
              }
            }
          });

          // Tandai Babak Final jika ini item terakhir dan tidak ada yang berstatus final
          if (groups.length > 0 && !groups.some(g => g.isFinal)) {
            groups[groups.length - 1].isFinal = true;
          }

          setGroupedStages(groups);

          // Tentukan tab aktif berdasarkan tanggal sekarang
          const now = new Date();
          let foundActive = 0;
          for (let i = 0; i < groups.length; i++) {
            if (now >= new Date(groups[i].startDate)) {
              foundActive = i;
            }
          }
          setActiveTabIndex(foundActive);
        }
      } catch (error) {
        console.error("Gagal memuat timeline", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, [competitionId]);

  // Fetch Qualified Participants untuk babak yang sedang aktif (Berguna untuk Final)
  useEffect(() => {
    const activeGroup = groupedStages[activeTabIndex];
    if (activeGroup && activeGroup.isFinal) {
      const fetchQualified = async () => {
        const { count } = await supabase
          .from("stage_participants")
          .select("*", { count: "exact", head: true })
          .in("stage_id", activeGroup.stageIds)
          .eq("qualification_status", "qualified");
        setQualifiedParticipants(count || 0);
      };
      fetchQualified();
    }
  }, [activeTabIndex, groupedStages]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-5 border-primary border-t-transparent"></div>
      </div>
    );
  }
  if (!competition || groupedStages.length === 0) return <div>Data Timeline Kosong.</div>;

  const activeGroup = groupedStages[activeTabIndex];
  const today = new Date();

  // Cari timeline yang sedang berjalan hari ini di babak tersebut
  let currentActiveTimelineType = null;
  if (activeGroup?.timelines) {
    const activeTl = activeGroup.timelines.find((t: any) => {
      const s = new Date(t.start_date).getTime();
      const e = new Date(t.end_date).getTime();
      const n = today.getTime();
      return n >= s && n <= e;
    });
    if (activeTl) currentActiveTimelineType = activeTl.timeline_type;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Tombol Kembali & Selector Babak */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary">
          <ChevronLeft className="text-xl" />
          Kembali ke event
        </button>

        {/* Tab Selector */}
        {groupedStages.length > 1 ? (
          <div className="flex gap-4 items-center">
            {groupedStages.map((group, idx) => {
              const startDate = new Date(group.startDate);
              const isLocked = today < startDate;

              return (
                <button
                  key={idx}
                  onClick={() => !isLocked && setActiveTabIndex(idx)}
                  disabled={isLocked}
                  className={`text-sm font-bold pb-1 transition-all ${activeTabIndex === idx
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : isLocked
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  Babak {group.title} {group.isFinal ? "- Final" : ""}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-sm font-bold text-gray-700">Babak {groupedStages[0].title} {groupedStages[0].isFinal ? "- Final" : ""}</div>
        )}
      </div>

      {/* Header Info */}
      <CompetitionHeaderCard
        competitionId={competition.competition_id}
      />

      {/* Konten Timeline Kiri dan Cards Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
        <TimelineStepper
          group={activeGroup}
          competitionName={competition.competition_name}
        />

        <TimelineActionCards
          group={activeGroup}
          competition={competition}
          totalEntries={totalEntries}
          qualifiedParticipants={qualifiedParticipants}
        />
      </div>
    </div>
  );
}