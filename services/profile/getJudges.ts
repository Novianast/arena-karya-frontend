import { supabase } from '@/lib/supabase';

export async function getJudgesByStageIds(stageIds: number[]) {
  if (!stageIds || stageIds.length === 0) return [];

  try {
    // 1. Fetch judge assignments and judges
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from("judge_assignments")
      .select(`
        judge_id,
        judges (
          profile_id,
          institution
        )
      `)
      .in("stage_id", stageIds)
      .eq("status", "active");

    if (assignmentsError) throw assignmentsError;
    if (!assignmentsData || assignmentsData.length === 0) return [];

    // 2. Extract profile IDs
    const profileIds: string[] = [];
    assignmentsData.forEach((assignment: any) => {
      const pId = assignment.judges?.profile_id;
      if (pId && !profileIds.includes(pId)) {
        profileIds.push(pId);
      }
    });

    // 3. Fetch from public_profiles
    const profilesMap: Record<string, any> = {};
    if (profileIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("public_profiles")
        .select("id, username, profile_image")
        .in("id", profileIds);

      if (profilesError) throw profilesError;
      
      profilesData?.forEach((profile) => {
        profilesMap[profile.id] = profile;
      });
    }

    // 4. Map the results
    const mappedJudges = assignmentsData.map((assignment: any) => {
      const pId = assignment.judges?.profile_id;
      const profileInfo = pId ? profilesMap[pId] : null;

      return {
        judge_id: assignment.judge_id,
        judges: {
          institution: assignment.judges?.institution,
          profiles: profileInfo ? {
            username: profileInfo.username,
            profile_image: profileInfo.profile_image
          } : null
        }
      };
    });

    return mappedJudges;

  } catch (error) {
    console.error("Error in getJudgesByStageIds:", error);
    throw error;
  }
}

export async function getAllSystemJudges() {
    const { data, error } = await supabase
        .from("judges")
        .select(`
            judge_id,
            institution,
            prefix,
            suffix,
            profile_id,
            public_profiles (
                id,
                username,
                profile_image,
                role_id
            )
        `);
    if (error) throw error;
    
    return data.map((j: any) => {
        const profileObj = Array.isArray(j.public_profiles) ? j.public_profiles[0] : j.public_profiles;
        return {
            judge_id: j.judge_id,
            institution: j.institution || "-",
            prefix: j.prefix || "",
            suffix: j.suffix || "",
            profile_id: j.profile_id,
            public_profiles: {
                username: profileObj ? profileObj.username : "",
                profile_image: profileObj ? profileObj.profile_image : null
            }
        };
    });
}

export async function getJudgeInvitationsByCompetition(competitionId: number) {
    const { data, error } = await supabase
        .from("judge_invitations")
        .select(`
            *,
            judges (
                judge_id,
                institution,
                prefix,
                suffix,
                public_profiles (
                    username,
                    profile_image
                )
            )
        `)
        .eq("competition_id", competitionId);

    if (error) throw error;
    return data;
}

export async function getJudgeAssignmentsByStages(stageIds: number[]) {
    if (!stageIds || stageIds.length === 0) return [];
    const { data, error } = await supabase
        .from("judge_assignments")
        .select(`
            *,
            judges (
                judge_id,
                institution,
                prefix,
                suffix,
                public_profiles (
                    username,
                    profile_image
                )
            )
        `)
        .in("stage_id", stageIds);

    if (error) throw error;
    return data;
}
