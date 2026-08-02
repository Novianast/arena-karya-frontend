-- Create sekolah table
CREATE TABLE IF NOT EXISTS public.sekolah (
  id                SERIAL PRIMARY KEY,
  npsn              VARCHAR(8) UNIQUE NOT NULL,
  nama              VARCHAR(150) NOT NULL,
  bentuk_pendidikan VARCHAR(20) NOT NULL,
  status_sekolah    VARCHAR(10),
  akreditasi        VARCHAR(5),
  provinsi          VARCHAR(100),
  kabupaten         VARCHAR(100),
  kecamatan         VARCHAR(100),
  alamat_jalan      TEXT,
  bujur             DOUBLE PRECISION,
  lintang           DOUBLE PRECISION,
  kode_pos          VARCHAR(10),
  sekolah_id        UUID,
  path_file         TEXT,
  kode_wilayah      VARCHAR(10), -- Stores Emsifa/github_id for fast filtering (e.g. 1114)
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sekolah ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access
CREATE POLICY "Allow public read access to sekolah"
  ON public.sekolah FOR SELECT
  TO public
  USING (true);

-- Enable pg_trgm extension for fast name search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_sekolah_kode_wilayah ON public.sekolah(kode_wilayah);
CREATE INDEX IF NOT EXISTS idx_sekolah_bentuk_pendidikan ON public.sekolah(bentuk_pendidikan);
CREATE INDEX IF NOT EXISTS idx_sekolah_npsn ON public.sekolah(npsn);
CREATE INDEX IF NOT EXISTS idx_sekolah_nama_trgm ON public.sekolah USING gin (nama gin_trgm_ops);
