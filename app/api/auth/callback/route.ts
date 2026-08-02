import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const user = data.user
      const roleData = user.user_metadata?.role_data
      const role = user.user_metadata?.role

      if (roleData) {
        // This is a new registration that was just verified
        let rpcError = null;

        if (role === 'organizer') {
          const res = await supabase.rpc('register_organizer', {
            o_org_name: roleData.orgName,
            o_org_desc: roleData.orgDesc,
            o_pic_name: roleData.picName,
            o_pic_phone: roleData.picPhone,
            o_addr: roleData.orgAddress,
            o_web: roleData.website
          })
          rpcError = res.error
        } else if (role === 'judge') {
          const res = await supabase.rpc('register_judge', {
            j_bio: roleData.bio,
            j_speciality: roleData.speciality,
            j_institution: roleData.institution,
            j_last_education: roleData.lastEducation || null,
            j_prefix: roleData.prefix,
            j_suffix: roleData.suffix
          })
          rpcError = res.error
        } else if (role === 'participant') {
          const res = await supabase.rpc('register_participant', {
            p_per_addr: roleData.address,
            p_birth_date: roleData.birthDate || null,
            p_country: roleData.country || null,
            p_edu_level: roleData.educationLevel || null,
            p_school: roleData.schoolName,
            p_prov: roleData.province,
            p_reg: roleData.regency,
            p_dist: roleData.district || 'Tidak Diisi',
            p_addr: roleData.schoolAddress
          })
          rpcError = res.error
        }

        if (rpcError) {
          // If RPC fails, delete the user so they can try registering again
          const admin = createSupabaseAdmin();
          await admin.auth.admin.deleteUser(user.id);
          // Delete session cookie
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/register?error=Gagal menyimpan data profil. Silakan daftar ulang.`)
        }

        // Clean up role_data from user_metadata so it doesn't stay there forever
        const admin = createSupabaseAdmin();
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            role_data: null
          }
        });

        // Redirect to their dashboard
        return NextResponse.redirect(`${origin}/${role}/home`)
      }

      // If no roleData, it's a normal login or password reset
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Invalid verification link`)
}
