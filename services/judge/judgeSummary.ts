import { supabase } from "@/lib/supabase";

export async function getAssignmentSummary(assignmentId: string | number) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Anda belum login");

  // Ambil Info Assignment
  const { data: assignmentData, error: assignError } = await supabase
    .from("judge_assignments")
    .select(`
      judge_id, stage_id,
      stages (
        stage_name,
        competition_id,
        stage_order,
        competitions ( competition_name, type, status, events (event_name, location, status) ),
        stage_timelines ( timeline_type, meeting_link, location )
      )
    `)
    .eq("assignment_id", assignmentId)
    .single();

  if (assignError || !assignmentData) {
    throw new Error("Gagal mengambil data penugasan atau penugasan tidak ditemukan.");
  }

  const stages: any = assignmentData.stages;

  // Verifikasi undangan sudah diterima
  if (stages?.competition_id) {
    const { data: invData } = await supabase
      .from('judge_invitations')
      .select('status')
      .eq('judge_id', assignmentData.judge_id)
      .eq('competition_id', stages.competition_id)
      .single();

    if (!invData || invData.status !== 'accepted') {
      throw new Error("Anda belum menerima undangan untuk tugas ini.");
    }
  }

  const stageId = assignmentData.stage_id;
  const judgeId = assignmentData.judge_id;
  
  const comp = stages?.competitions;
  const ev = comp?.events;

  // Validasi Draft
  if (comp?.status === 'draft' || ev?.status === 'draft') {
    throw new Error("Lomba ini belum diterbitkan.");
  }

  const typeTimeline = stages?.stage_timelines?.find(
    (t: any) => t.timeline_type === 'submission' || t.timeline_type === 'presentation'
  );

  let evaluationType = 'Belum Ditentukan';
  let taskLocation = ev?.location || 'Online';
  let meetingLink = null;
  let physicalLocation = null;

  if (typeTimeline?.timeline_type === 'submission') {
    evaluationType = 'Karya';
    taskLocation = 'Online';
  } else if (typeTimeline?.timeline_type === 'presentation') {
    evaluationType = 'Presentasi';
    if (typeTimeline.meeting_link) {
      taskLocation = 'Online';
      meetingLink = typeTimeline.meeting_link;
    } else if (typeTimeline.location) {
      taskLocation = typeTimeline.location;
      physicalLocation = typeTimeline.location;
    } else {
      taskLocation = 'Online';
    }
  }

  const headerInfo = {
    eventName: ev?.event_name,
    compName: comp?.competition_name,
    stageName: stages?.stage_name,
    compType: comp?.type,
    evaluationType,
    location: taskLocation,
    meetingLink,
    physicalLocation,
  };

  // Ambil Kriteria
  const { data: criteria, error: critError } = await supabase
    .from("evaluation_criteria")
    .select("*")
    .eq("stage_id", stageId)
    .order("criteria_id", { ascending: true });

  if (critError) throw critError;

  // Ambil Submissions & Scores
  let rawSubmissions: any[] = [];
  const { data: subData, error: subError } = await supabase
    .from("submissions")
    .select(`
      submission_id, file_url, link_url,
      entries ( entry_name, entry_members ( member_id, participants ( profiles ( username ) ) ) ),
      evaluations ( criteria_id, score )
    `)
    .eq("stage_id", stageId);

  if (subError) throw subError;
  rawSubmissions = subData || [];

  // Fallback if presentation and no submissions
  if (rawSubmissions.length === 0) {
    const compId = stages?.competition_id;
    let order = stages?.stage_order - 1;
    let foundSubmissions = false;

    while (order > 0 && !foundSubmissions) {
      const { data: prevStage } = await supabase
        .from('stages')
        .select('stage_id')
        .eq('competition_id', compId)
        .eq('stage_order', order)
        .single();
      
      if (prevStage) {
        const { data: prevSubData } = await supabase
          .from("submissions")
          .select(`
            submission_id, file_url, link_url,
            entries ( entry_name, entry_members ( member_id, participants ( profiles ( username ) ) ) ),
            evaluations ( criteria_id, score )
          `)
          .eq("stage_id", prevStage.stage_id);
          
        if (prevSubData && prevSubData.length > 0) {
          rawSubmissions = prevSubData;
          foundSubmissions = true;
        }
      }
      order--;
    }
  }

  // Ambil Ranks dari SQL View
  const { data: rankData, error: rankError } = await supabase
    .from("judge_submission_ranks")
    .select("*")
    .eq("judge_id", judgeId)
    .eq("stage_id", stageId);

  if (rankError) throw rankError;

  // Map Scores & Ranks
  const scores: Record<number, Record<number, number | string>> = {};
  const ranks: Record<number, { avg_judge: number; judge_rank: number }> = {};

  rawSubmissions.forEach((sub: any) => {
    const myEvals = sub.evaluations || [];
    if (myEvals.length > 0) {
      scores[sub.submission_id] = {};
      myEvals.forEach((ev: any) => {
        scores[sub.submission_id][ev.criteria_id] = ev.score;
      });
    }
  });

  rankData?.forEach((r: any) => {
    ranks[r.submission_id] = { avg_judge: r.avg_judge, judge_rank: r.judge_rank };
  });

  // Sort submissions berdasarkan Rank (1, 2, 3...)
  rawSubmissions.sort((a, b) => {
    const rankA = ranks[a.submission_id]?.judge_rank ?? 9999;
    const rankB = ranks[b.submission_id]?.judge_rank ?? 9999;
    return rankA - rankB;
  });

  return {
    judgeId,
    stageId,
    headerInfo,
    criteria: criteria || [],
    submissions: rawSubmissions,
    scores,
    ranks,
  };
}