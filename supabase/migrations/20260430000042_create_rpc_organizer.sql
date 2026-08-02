CREATE OR REPLACE FUNCTION public.register_organizer(
  o_org_name VARCHAR,
  o_org_desc TEXT,
  o_pic_name VARCHAR,
  o_pic_phone VARCHAR,
  o_addr TEXT,
  o_web VARCHAR
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
  IF o_org_name IS NULL OR TRIM(o_org_name) = '' THEN
    RAISE EXCEPTION 'Nama organisasi tidak boleh kosong';
  END IF;

  IF o_pic_name IS NULL OR TRIM(o_pic_name) = '' THEN
    RAISE EXCEPTION 'Nama PIC tidak boleh kosong';
  END IF;

  IF o_pic_phone IS NULL OR TRIM(o_pic_phone) = '' THEN
    RAISE EXCEPTION 'Nomor telepon PIC tidak boleh kosong';
  END IF;

  -- Insert ke tabel organizers
  INSERT INTO public.organizers (
    profile_id,
    organization_name,
    organization_description,
    pic_name,
    pic_phone,
    address,
    website 
  )
  VALUES (
    auth.uid(),
    o_org_name,
    o_org_desc,
    o_pic_name,
    o_pic_phone,
    o_addr,
    o_web 
  );
END;
$$;