import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

let cachedUniversities: any[] | null = null;

function loadUniversities() {
  if (cachedUniversities) return cachedUniversities;
  
  try {
    const filePath = path.join(process.cwd(), 'master_data_universitas.json');
    if (!fs.existsSync(filePath)) {
      console.error('master_data_universitas.json not found at', filePath);
      return [];
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    cachedUniversities = JSON.parse(fileContent);
    return cachedUniversities || [];
  } catch (error) {
    console.error('Error loading master_data_universitas.json:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nama = searchParams.get('nama') || '';
    const provinsi = searchParams.get('provinsi') || '';
    const kabupaten = searchParams.get('kabupaten') || '';
    const kecamatan = searchParams.get('kecamatan') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const universities = loadUniversities();
    
    let filtered = universities;

    if (provinsi.trim()) {
      const cleanProv = provinsi.toUpperCase().replace(/^PROV\.\s+/i, "").trim();
      filtered = filtered.filter((univ: any) => {
        const uProv = (univ.provinsi_pt || '').toUpperCase().replace(/^PROV\.\s+/i, "").trim();
        return uProv.includes(cleanProv) || cleanProv.includes(uProv);
      });
    }

    if (kabupaten.trim()) {
      const kabUpper = kabupaten.toUpperCase();
      const isInputKota = kabUpper.includes("KOTA");
      const isInputKab = kabUpper.includes("KAB") || kabUpper.includes("KABUPATEN");
      
      const cleanKab = kabUpper.replace(/^(KAB\.|KABUPATEN|KOTA)\s+/i, "").trim();
      filtered = filtered.filter((univ: any) => {
        const uKabUpper = (univ.kab_kota_pt || '').toUpperCase();
        const isTargetKota = uKabUpper.includes("KOTA");
        const isTargetKab = uKabUpper.includes("KAB") || uKabUpper.includes("KABUPATEN");
        
        const uKab = uKabUpper.replace(/^(KAB\.|KABUPATEN|KOTA)\s+/i, "").trim();
        const baseMatches = uKab.includes(cleanKab) || cleanKab.includes(uKab);
        if (!baseMatches) return false;
        
        if (isInputKota && !isTargetKota) return false;
        if (isInputKab && !isTargetKab) return false;
        return true;
      });
    }

    if (kecamatan.trim()) {
      const cleanKec = kecamatan.toUpperCase().replace(/^KEC\.\s+/i, "").trim();
      filtered = filtered.filter((univ: any) => {
        const uKec = (univ.kecamatan_pt || '').toUpperCase().replace(/^KEC\.\s+/i, "").trim();
        return uKec.includes(cleanKec) || cleanKec.includes(uKec);
      });
    }

    if (nama.trim()) {
      const searchTerms = nama.toLowerCase().trim().split(/\s+/);
      filtered = filtered.filter((univ: any) => {
        const namePt = (univ.nama_pt || '').toLowerCase();
        const shortName = (univ.nm_singkat || '').toLowerCase();
        const kodePt = (univ.kode_pt || '').toLowerCase().trim();
        
        // Match all search terms (AND search)
        return searchTerms.every(term => 
          namePt.includes(term) || 
          shortName.includes(term) || 
          kodePt.includes(term)
        );
      });
    }

    // Deduplicate by university name (nama_pt)
    const uniqueMap = new Map();
    for (const univ of filtered) {
      const name = (univ.nama_pt || '').trim();
      if (!name) continue;
      if (!uniqueMap.has(name)) {
        uniqueMap.set(name, univ);
      }
    }
    const uniqueFiltered = Array.from(uniqueMap.values());

    const resultData = uniqueFiltered.slice(0, limit).map((univ: any) => ({
      id: (univ.kode_pt || '').trim() || (univ.id_sp || '').substring(0, 10) || Math.random().toString(),
      nama: (univ.nama_pt || '').trim(),
      nm_singkat: (univ.nm_singkat || '').trim(),
      bentuk_pendidikan: 'college',
      status_sekolah: (univ.status_pt || '').trim(),
      akreditasi: (univ.akreditasi_pt || '').trim(),
      provinsi: (univ.provinsi_pt || '').trim(),
      kabupaten: (univ.kab_kota_pt || '').trim(),
      kecamatan: (univ.kecamatan_pt || '').trim(),
      alamat_jalan: (univ.alamat || '').trim()
    }));

    return NextResponse.json({
      success: true,
      data: resultData
    });
  } catch (error: any) {
    console.error('Error in api/universitas:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
