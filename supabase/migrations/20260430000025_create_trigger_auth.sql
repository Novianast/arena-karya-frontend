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
  role_text := NEW.raw_user_meta_data->>'role';

  IF role_text = 'organizer' THEN
    role_id_val := 2;
  ELSIF role_text = 'judge' THEN
    role_id_val := 3;
  ELSIF role_text = 'participant' THEN
    role_id_val := 4;
  ELSE
    role_id_val := 1; 
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