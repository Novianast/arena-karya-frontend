import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const npsn = searchParams.get('npsn');
    const nama = searchParams.get('nama');
    const kode_wilayah = searchParams.get('kode_wilayah');
    const kecamatan = searchParams.get('kecamatan');
    const bentuk_pendidikan = searchParams.get('bentuk_pendidikan');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    let query = supabase.from('sekolah').select('*');

    if (npsn) {
      query = query.eq('npsn', npsn);
    } else {
      if (kode_wilayah) {
        query = query.eq('kode_wilayah', kode_wilayah);
      }
      if (kecamatan) {
        query = query.ilike('kecamatan', `%${kecamatan}%`);
      }
      if (bentuk_pendidikan) {
        query = query.eq('bentuk_pendidikan', bentuk_pendidikan);
      }
      if (nama) {
        query = query.ilike('nama', `%${nama}%`);
      }
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching schools from Supabase:', error);
      return NextResponse.json(
        { success: false, message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    // Format data to match the structure expected by the frontend
    const formattedData = (data || []).map((sch: any) => ({
      id: sch.id,
      npsn: sch.npsn,
      nama: sch.nama,
      bentuk_pendidikan: sch.bentuk_pendidikan,
      status_sekolah: sch.status_sekolah,
      akreditasi: sch.akreditasi,
      provinsi: sch.provinsi,
      kabupaten: sch.kabupaten,
      kecamatan: sch.kecamatan,
      alamat_jalan: sch.alamat_jalan,
      // Nested alamat field for backward compatibility with fetchSchoolByNpsn
      alamat: {
        nama_provinsi: sch.provinsi || '',
        nama_kabupaten: sch.kabupaten || '',
        nama_kecamatan: sch.kecamatan || '',
        jalan: sch.alamat_jalan || ''
      }
    }));

    return NextResponse.json({
      success: true,
      data: formattedData
    });
  } catch (error: any) {
    console.error('Error in sekolah route:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

