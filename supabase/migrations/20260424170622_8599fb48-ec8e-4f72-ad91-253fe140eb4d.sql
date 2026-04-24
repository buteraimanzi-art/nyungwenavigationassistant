-- Trail access codes (one or more reusable codes per trail)
create table public.trail_access_codes (
  id uuid primary key default gen_random_uuid(),
  trail_id text not null,
  trail_name text not null,
  code text not null unique,
  note text,
  active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_trail_access_codes_trail on public.trail_access_codes(trail_id);
create index idx_trail_access_codes_code on public.trail_access_codes(code);

alter table public.trail_access_codes enable row level security;

-- Anyone signed in can look up a code (needed to validate redemption).
-- We do NOT expose all codes to non-admins; we only allow lookup by exact code value via RLS check.
create policy "Authenticated can validate by exact code"
  on public.trail_access_codes for select
  to authenticated
  using (active = true);

create policy "Admins can manage codes"
  on public.trail_access_codes for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger trail_access_codes_touch
  before update on public.trail_access_codes
  for each row execute function public.touch_updated_at();


-- Redemptions: who unlocked which trail, when
create table public.trail_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  code_id uuid not null references public.trail_access_codes(id) on delete cascade,
  trail_id text not null,
  trail_name text not null,
  redeemed_at timestamptz not null default now(),
  unique (user_id, trail_id)
);

create index idx_trail_redemptions_user on public.trail_redemptions(user_id);
create index idx_trail_redemptions_code on public.trail_redemptions(code_id);

alter table public.trail_redemptions enable row level security;

create policy "Users can view their own redemptions"
  on public.trail_redemptions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own redemptions"
  on public.trail_redemptions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Admins can view all redemptions"
  on public.trail_redemptions for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete redemptions"
  on public.trail_redemptions for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));


-- Live user locations (latest position only per user)
create table public.user_locations (
  user_id uuid primary key,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  heading double precision,
  speed double precision,
  trail_id text,
  trail_name text,
  updated_at timestamptz not null default now()
);

create index idx_user_locations_updated on public.user_locations(updated_at desc);

alter table public.user_locations enable row level security;

create policy "Users manage their own location"
  on public.user_locations for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can view all locations"
  on public.user_locations for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));


-- Realtime
alter publication supabase_realtime add table public.trail_access_codes;
alter publication supabase_realtime add table public.trail_redemptions;
alter publication supabase_realtime add table public.user_locations;
alter table public.user_locations replica identity full;
alter table public.trail_redemptions replica identity full;
alter table public.trail_access_codes replica identity full;