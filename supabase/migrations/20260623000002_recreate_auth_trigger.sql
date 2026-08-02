CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  role_text TEXT;
  role_id_val INT;
BEGIN
  role_text := TRIM(NEW.raw_user_meta_data->>'role');

  -- Hanya berikan role_id sesuai yang direquest. Jangan berikan role 1 (Admin) secara otomatis!
  IF role_text = 'organizer' THEN
    role_id_val := 2;
  ELSIF role_text = 'judge' THEN
    role_id_val := 3;
  ELSIF role_text = 'participant' THEN
    role_id_val := 4;
  ELSE
    RAISE EXCEPTION 'Invalid role: %', role_text;
  END IF;

  INSERT INTO public.profiles (id, role_id, username, phone, created_at)
  VALUES (
    NEW.id,
    role_id_val,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'phone',
    now()
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();