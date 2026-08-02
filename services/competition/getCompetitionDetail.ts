import { supabase } from "@/lib/supabase";

export const getCompetitionDetailData = async (competitionId: string) => {
  // 1. Fetch Data Lomba
  const { data: competition, error: compError } = await supabase
    .from("competitions")
    .select("*")
    .eq("competition_id", competitionId)
    .single();

  if (compError) throw compError;

  // 2. Fetch Tahapan/Stages & Timelines
  const { data: stages, error: stagesError } = await supabase
    .from("stages")
    .select(`
      *,
      stage_timelines (*)
    `)
    .eq("competition_id", competitionId);

  if (stagesError) throw stagesError;

  // 3. Tentukan stage & timeline aktif
  const now = new Date();
  let activeStage = null;
  let activeTimeline = null;

  if (stages) {
    for (const stage of stages) {
      const startDate = new Date(stage.start_date);
      const endDate = new Date(stage.end_date);
      
      if (now >= startDate && now <= endDate) {
        activeStage = stage;
        
        const timelines = stage.stage_timelines || [];
        for (const timeline of timelines) {
          const tlStart = new Date(timeline.start_date);
          const tlEnd = new Date(timeline.end_date);
          if (now >= tlStart && now <= tlEnd) {
            activeTimeline = timeline;
            break;
          }
        }
        break;
      }
    }
  }

  // 4. Hitung jumlah peserta pada stage aktif
  let participantCount = 0;
  if (activeStage) {
    const { count, error: countError } = await supabase
      .from("stage_participants")
      .select("*", { count: "exact", head: true })
      .eq("stage_id", activeStage.stage_id);
      
    if (!countError) participantCount = count || 0;
  }

  // 5. Kalkulasi rentang tanggal
  const allStartDates = stages.map((s: any) => new Date(s.start_date).getTime()).filter((t: any) => !isNaN(t));
  const allEndDates = stages.map((s: any) => new Date(s.end_date).getTime()).filter((t: any) => !isNaN(t));
  
  const minStartDate = allStartDates.length > 0 ? new Date(Math.min(...allStartDates)).toISOString() : null;
  const maxEndDate = allEndDates.length > 0 ? new Date(Math.max(...allEndDates)).toISOString() : null;

  return {
    competition,
    stages: stages || [],
    activeStage,
    activeTimeline,
    participantCount,
    minStartDate,
    maxEndDate
  };
};