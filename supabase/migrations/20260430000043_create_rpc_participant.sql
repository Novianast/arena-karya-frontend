CREATE OR REPLACE FUNCTION public.register_participant(
  p_per_addr VARCHAR,
  p_birth_date DATE,
  p_country public.country_enum,
  p_edu_level public.education_level_enum,
  p_school VARCHAR,
  p_prov VARCHAR,
  p_reg VARCHAR,
  p_dist VARCHAR,
  p_addr TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_participant_id INT;
BEGIN
  -- validasi login
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validasi Data
  IF p_birth_date IS NULL THEN
    RAISE EXCEPTION 'Tanggal Lahir tidak boleh kosong';
  END IF;
  
  IF p_country IS NULL THEN
    RAISE EXCEPTION 'Negara Asal tidak boleh kosong';
  END IF;

  IF p_edu_level IS NULL THEN
    RAISE EXCEPTION 'Tingkat Pendidikan tidak boleh kosong';
  END IF;

  IF p_school IS NULL OR TRIM(p_school) = '' THEN
    RAISE EXCEPTION 'Nama Sekolah tidak boleh kosong';
  END IF;

  IF p_prov IS NULL OR TRIM(p_prov) = '' THEN
    RAISE EXCEPTION 'Provinsi tidak boleh kosong';
  END IF;

  IF p_reg IS NULL OR TRIM(p_reg) = '' THEN
    RAISE EXCEPTION 'Kota/Kabupaten tidak boleh kosong';
  END IF;

  IF p_dist IS NULL OR TRIM(p_dist) = '' THEN
    RAISE EXCEPTION 'Kecamatan tidak boleh kosong';
  END IF;

  -- Insert participants
  INSERT INTO public.participants (profile_id, address, birth_date, country)
  VALUES (auth.uid(), p_per_addr, p_birth_date, p_country)
  RETURNING participant_id INTO new_participant_id;

  -- Insert education
  INSERT INTO public.participant_education (
    participant_id,
    education_level,
    institution_name,
    province,
    regency,
    district,
    school_address
  )
  VALUES (
    new_participant_id,
    p_edu_level,
    p_school,
    p_prov,
    p_reg,
    p_dist,
    p_addr
  );
END;
$$;