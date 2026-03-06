-- Supabase trigger: auto-create public.users row when a user signs up
-- NOTE: SET search_path is REQUIRED so the supabase_auth_admin role
--       can resolve "users" → "public.users" when the trigger fires.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop old trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
