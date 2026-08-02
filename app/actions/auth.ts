"use server";

import { createSupabaseAdmin } from "@/lib/supabase-server";
import { sendVerificationEmail, sendResetPasswordEmail } from "@/lib/brevo";

export async function registerWithBrevo(formData: any) {
  const supabaseAdmin = createSupabaseAdmin();
  
  const { email, password, role, username, phone, ...roleData } = formData;

  try {
    // 1. Create User in Supabase Auth (but DO NOT confirm email yet)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, 
      user_metadata: {
        role,
        username: username?.trim(),
        phone,
        role_data: roleData // Store all other data temporarily here
      }
    });

    if (createError) {
      if (createError.message.includes("already registered")) {
         return { error: "Email sudah terdaftar. Silakan login atau gunakan email lain." };
      }
      return { error: createError.message };
    }

    if (!userData.user) return { error: "Gagal membuat user" };

    // 2. Generate Verification Link manually
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify`
      }
    });

    if (linkError) {
      // Cleanup the created user if link generation fails
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return { error: linkError.message };
    }

    const verificationLink = linkData.properties?.action_link;
    if (!verificationLink) {
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return { error: "Gagal membuat tautan verifikasi" };
    }

    // 3. Send email using Brevo
    try {
      await sendVerificationEmail(email, verificationLink);
    } catch (brevoError: any) {
      console.error("Brevo Error Details:", brevoError?.response?.body || brevoError);
      // If email sending fails, cleanup user to avoid stranded unverified accounts
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return { error: "Gagal mengirim email verifikasi. Silakan coba lagi nanti." };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan sistem" };
  }
}

export async function resetPasswordWithBrevo(email: string) {
  const supabaseAdmin = createSupabaseAdmin();

  try {
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify?next=/reset-password`
      }
    });

    if (linkError) {
      // Return success anyway to prevent email enumeration attacks, or return error if preferred
      return { error: linkError.message };
    }

    const resetLink = linkData.properties?.action_link;
    if (!resetLink) {
      return { error: "Gagal membuat tautan reset password" };
    }

    try {
      await sendResetPasswordEmail(email, resetLink);
    } catch (brevoError: any) {
      return { error: "Gagal mengirim email pemulihan. Silakan coba lagi nanti." };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan sistem" };
  }
}

export async function resendVerificationWithBrevo(email: string) {
  const supabaseAdmin = createSupabaseAdmin();

  try {
    // Generate magic link that acts as verification + login
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify`
      }
    });

    if (linkError) {
      if (linkError.message.includes("not found")) {
        return { error: "Email belum terdaftar. Silakan daftar terlebih dahulu." };
      }
      return { error: linkError.message };
    }

    const verificationLink = linkData.properties?.action_link;
    if (!verificationLink) {
      return { error: "Gagal membuat tautan verifikasi baru" };
    }

    try {
      await sendVerificationEmail(email, verificationLink);
    } catch (brevoError: any) {
      console.error("Brevo Error Details:", brevoError?.response?.body || brevoError);
      return { error: "Gagal mengirim ulang email verifikasi. Pastikan IP Address Anda telah ditambahkan di Brevo." };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan sistem" };
  }
}

export async function processRegistration() {
  const supabaseAdmin = createSupabaseAdmin();
  const { createSupabaseServerClient } = require("@/lib/supabase-server");
  const supabase = await createSupabaseServerClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "User tidak ditemukan" };
  }

  const roleData = user.user_metadata?.role_data;
  const role = user.user_metadata?.role;

  if (roleData) {
    let rpcError = null;

    if (role === 'organizer') {
      const res = await supabase.rpc('register_organizer', {
        o_org_name: roleData.orgName,
        o_org_desc: roleData.orgDesc,
        o_pic_name: roleData.picName,
        o_pic_phone: roleData.picPhone,
        o_addr: roleData.orgAddress,
        o_web: roleData.website
      });
      rpcError = res.error;
    } else if (role === 'judge') {
      const res = await supabase.rpc('register_judge', {
        j_bio: roleData.bio,
        j_speciality: roleData.speciality,
        j_institution: roleData.institution,
        j_last_education: roleData.lastEducation || null,
        j_prefix: roleData.prefix,
        j_suffix: roleData.suffix
      });
      rpcError = res.error;
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
      });
      rpcError = res.error;
    }

    if (rpcError) {
      // Jika RPC gagal, hapus user supaya mereka bisa daftar ulang
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      await supabase.auth.signOut();
      return { error: "Gagal menyimpan data profil. Silakan daftar ulang." };
    }

    // Bersihkan role_data agar tidak tertinggal
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        role_data: null
      }
    });

    return { success: true, role };
  }

  // Jika tidak ada roleData, berarti login biasa / registrasi sudah selesai
  return { success: true, role };
}


