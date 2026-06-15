
CREATE OR REPLACE FUNCTION public.admin_get_hiker_identities(_ids uuid[])
RETURNS TABLE(user_id uuid, email text, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email::text, p.full_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = ANY(_ids)
    AND public.has_role(auth.uid(), 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_hiker_identities(uuid[]) TO authenticated;
