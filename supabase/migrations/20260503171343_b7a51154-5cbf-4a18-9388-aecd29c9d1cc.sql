ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS indemnity_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS indemnity_signature text,
ADD COLUMN IF NOT EXISTS indemnity_full_name text;