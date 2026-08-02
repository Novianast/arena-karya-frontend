import { supabase } from "@/lib/supabase";

export async function fetchJudgeData(mode: 'active' | 'history' | 'all' = 'all') {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("User tidak terautentikasi")

  // Dapatkan judge_id berdasarkan profile_id (UUID)
  const { data: judgeData, error: judgeError } = await supabase
    .from('judges')
    .select('judge_id')
    .eq('profile_id', user.id)
    .single();

  if (judgeError || !judgeData) throw new Error("Profil juri tidak ditemukan");
  
  const currentJudgeId = judgeData.judge_id;

  // Fetch undangan baru
  let pendingInvitations = 0;
  if (mode === 'active' || mode === 'all') {
    const { count, error: inviteError } = await supabase
      .from('judge_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('judge_id', currentJudgeId)
      .eq('status', 'pending');
      
    if (!inviteError) pendingInvitations = count || 0;
  }

  // Fetch daftar competition_id yang undangannya diterima
  const { data: acceptedInvs } = await supabase
    .from('judge_invitations')
    .select('competition_id')
    .eq('judge_id', currentJudgeId)
    .eq('status', 'accepted');
  
  const acceptedCompIds = new Set(acceptedInvs?.map(inv => inv.competition_id) || []);

  // Tarik data penugasan menggunakan judge_id
  const { data: assignments, error: assignError } = await supabase
    .from('judge_assignments')
    .select(`
      assignment_id,
      status,
      stages!inner (
        stage_id,
        stage_name,
        status,
        competition_id,
        competitions!inner (
          competition_id,
          competition_name,
          type,
          status,
          event_id,
          events!inner (
            event_id,
            event_name,
            location,
            status
          )
        ),
        stage_timelines (
          timeline_type,
          start_date,
          end_date,
          meeting_link,
          location
        )
      )
    `)
    .eq('judge_id', currentJudgeId);

  if (assignError) throw assignError;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let eventIds = new Set<number>();
  let competitionIds = new Set<number>();
  let activeCount = 0;
  let completedCount = 0;
  const parsedTasks: any[] = [];

  const expiredAssignmentIds: number[] = [];
  const cancelledAssignmentIds: number[] = [];

  assignments?.forEach((row: any) => {
    const stage = row.stages;
    const comp = stage?.competitions;
    const event = comp?.events;

    // Hide tugas jika juri belum menerima undangan untuk lomba ini
    if (!comp?.competition_id || !acceptedCompIds.has(comp.competition_id)) {
      return;
    }

    const judgingTimeline = stage?.stage_timelines?.find(
      (t: any) => t.timeline_type === 'judging'
    );

    const startDate = judgingTimeline ? new Date(judgingTimeline.start_date) : new Date();
    const endDate = judgingTimeline ? new Date(judgingTimeline.end_date) : new Date();
    const taskEndDate = new Date(endDate);
    taskEndDate.setHours(23, 59, 59, 999);

    const parentCancelled = event?.status === 'cancelled' || comp?.status === 'cancelled';

    if (row.status === 'active') {
      if (now > taskEndDate && !parentCancelled) {
        expiredAssignmentIds.push(row.assignment_id);
        row.status = 'completed';
      } else if (parentCancelled) {
        cancelledAssignmentIds.push(row.assignment_id);
        row.status = 'cancelled';
      }
    }

    if (row.status === 'active') activeCount++;
    if (row.status === 'completed') {
      completedCount++;
      if (event?.event_id) eventIds.add(event.event_id);
    }

    // Filter Active vs History
    let isMatch = false;
    if (mode === 'active') {
      isMatch = row.status === 'active';
    } else if (mode === 'history') {
      isMatch = row.status === 'completed' || row.status === 'cancelled';
    } else {
      isMatch = true;
    }

    if (isMatch) {
      const typeTimeline = stage?.stage_timelines?.find(
        (t: any) => t.timeline_type === 'submission' || t.timeline_type === 'presentation'
      );

      let evaluationType = 'Belum Ditentukan';
      let taskLocation = event?.location || 'Online';

      if (typeTimeline?.timeline_type === 'submission') {
        evaluationType = 'Karya';
        taskLocation = 'Online';
      } else if (typeTimeline?.timeline_type === 'presentation') {
        evaluationType = 'Presentasi';
        taskLocation = typeTimeline.meeting_link || typeTimeline.location || 'Online';
      }

      parsedTasks.push({
        id: row.assignment_id,
        eventId: event?.event_id,
        competitionId: comp?.competition_id,
        eventName: event?.event_name || 'Event Tidak Diketahui',
        competitionName: comp?.competition_name || 'Lomba Tidak Diketahui',
        stageName: stage?.stage_name || 'Babak Tidak Diketahui',
        evaluationType,
        startDate,
        endDate: taskEndDate,
        type: comp?.type === 'team' ? 'Tim' : comp?.type === 'individual' ? 'Individu' : comp?.type,
        location: taskLocation,
        statusAssignment: row.status,
        competitionStatus: comp?.status,
        eventStatus: event?.status,
      });
    }
  });

  // UPDATE KE DATABASE JIKA ADA YANG KEDALUWARSA ATAU DIBATALKAN
  if (expiredAssignmentIds.length > 0) {
    supabase
      .from('judge_assignments')
      .update({ status: 'completed' })
      .in('assignment_id', expiredAssignmentIds)
      .then(({ error: updateError }) => {
        if (updateError) {
          console.error("Gagal mengupdate status tugas yang kedaluwarsa ke database:", updateError);
        } else {
          console.log(`Berhasil mengupdate ${expiredAssignmentIds.length} tugas menjadi completed.`);
        }
      });
  }

  if (cancelledAssignmentIds.length > 0) {
    supabase
      .from('judge_assignments')
      .update({ status: 'cancelled' })
      .in('assignment_id', cancelledAssignmentIds)
      .then(({ error: updateError }) => {
        if (updateError) {
          console.error("Gagal mengupdate status tugas yang dibatalkan ke database:", updateError);
        } else {
          console.log(`Berhasil mengupdate ${cancelledAssignmentIds.length} tugas menjadi cancelled.`);
        }
      });
  }

  return {
    tasks: parsedTasks,
    stats: {
      totalEvent: eventIds.size,
      karyaDinilai: completedCount,
      tugasAktif: activeCount,
      undanganBaru: pendingInvitations,
    }
  };
}