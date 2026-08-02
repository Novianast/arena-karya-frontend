const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is missing in .env.local');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('ERROR: No Supabase keys found in .env.local');
  process.exit(1);
}

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('INFO: SUPABASE_SERVICE_ROLE_KEY not found. Falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  console.log('Ensure that write/insert permissions (or appropriate policies) are enabled for the anon role.');
}


// Load kabupaten mapping
console.log('Loading kabupaten mapping...');
const kabupatenPath = path.join(__dirname, '../daftar_kabupaten_resolved.json');
if (!fs.existsSync(kabupatenPath)) {
  console.error(`ERROR: Mapping file not found at ${kabupatenPath}`);
  process.exit(1);
}
const kabupatenData = JSON.parse(fs.readFileSync(kabupatenPath, 'utf8'));

// Map: kemendikbud_kabupaten -> github_id (Emsifa ID)
const kabupatenMap = {};
for (const item of kabupatenData) {
  if (item.kemendikbud_kabupaten && item.github_id) {
    kabupatenMap[item.kemendikbud_kabupaten.toLowerCase().trim()] = item.github_id;
  }
}

// Load schools data
const schoolsPath = path.join(__dirname, '../master_data_sekolah.json');
if (!fs.existsSync(schoolsPath)) {
  console.error(`ERROR: Schools data file not found at ${schoolsPath}`);
  process.exit(1);
}

console.log('Loading master_data_sekolah.json (this may take a few seconds)...');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));
console.log(`Loaded ${schools.length} schools from JSON.`);

// Filter duplicates and resolve Emsifa ID
const importedNpsns = new Set();
const uniqueSchools = [];

for (const school of schools) {
  if (!school.npsn) continue;
  
  const cleanNpsn = school.npsn.trim();
  if (importedNpsns.has(cleanNpsn)) {
    continue; // Skip duplicate NPSN
  }
  importedNpsns.add(cleanNpsn);

  const kabKey = school.kabupaten ? school.kabupaten.toLowerCase().trim() : '';
  const kodeWilayah = kabupatenMap[kabKey] || null;

  uniqueSchools.push({
    npsn: cleanNpsn,
    nama: school.nama,
    bentuk_pendidikan: school.bentuk_pendidikan,
    status_sekolah: school.status_sekolah || null,
    akreditasi: school.akreditasi || null,
    provinsi: school.provinsi || null,
    kabupaten: school.kabupaten || null,
    kecamatan: school.kecamatan || null,
    alamat_jalan: school.alamat_jalan || null,
    bujur: typeof school.bujur === 'number' ? school.bujur : null,
    lintang: typeof school.lintang === 'number' ? school.lintang : null,
    kode_pos: school.kode_pos || null,
    sekolah_id: school.sekolah_id || null,
    path_file: school.path_file || null,
    kode_wilayah: kodeWilayah
  });
}

console.log(`Filtered down to ${uniqueSchools.length} unique schools.`);

const CHUNK_SIZE = 1000;
const total = uniqueSchools.length;

async function importAll() {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  console.log('Starting batch import to Supabase...');

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = uniqueSchools.slice(i, i + CHUNK_SIZE);
    
    let retries = 3;
    while (retries > 0) {
      try {
        const { error } = await supabase.from('sekolah').insert(chunk);
        if (error) throw error;
        break; // Success
      } catch (err) {
        retries--;
        console.error(`Error inserting chunk starting at index ${i}. Retries left: ${retries}. Error:`, err.message || err);
        if (retries === 0) {
          console.error('Import failed. Exiting.');
          process.exit(1);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const progress = Math.min(i + CHUNK_SIZE, total);
    const percent = ((progress / total) * 100).toFixed(2);
    console.log(`[${percent}%] Imported ${progress} / ${total} schools...`);
  }

  console.log('Import completed successfully!');
}

importAll();
