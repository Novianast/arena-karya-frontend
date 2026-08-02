CREATE OR REPLACE FUNCTION public.register_judge(
  j_bio TEXT,
  j_speciality TEXT,
  j_institution VARCHAR,
  j_last_education public.judge_last_education_enum,
  j_prefix VARCHAR,
  j_suffix VARCHAR
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- validasi user login
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validasi Data
  IF j_institution IS NULL OR TRIM(j_institution) = '' THEN
    RAISE EXCEPTION 'Institusi tidak boleh kosong';
  END IF;

  IF j_last_education IS NULL THEN
    RAISE EXCEPTION 'Pendidikan terakhir tidak boleh kosong';
  END IF;

  -- Insert ke tabel judges
  INSERT INTO public.judges (
    profile_id,
    bio,
    speciality,
    institution,
    last_education,
    prefix,
    suffix 
  )
  VALUES (
    auth.uid(),
    j_bio,
    j_speciality,
    j_institution,
    j_last_education,
    j_prefix,
    j_suffix 
  );
END;
$$;