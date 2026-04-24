-- Status enum for alerts
create type public.alert_status as enum ('new', 'acknowledged', 'resolved');

-- Issue type enum (mirrors the SOS form)
create type public.alert_issue_type as enum ('injury', 'lost', 'wildlife', 'weather', 'medical', 'other');

create table public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reporter_name text,
  reporter_phone text,
  trail_id text,
  trail_name text,
  issue_type public.alert_issue_type not null default 'other',
  description text,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  status public.alert_status not null default 'new',
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index emergency_alerts_status_created_idx
  on public.emergency_alerts (status, created_at desc);
create index emergency_alerts_user_idx
  on public.emergency_alerts (user_id);

alter table public.emergency_alerts enable row level security;

-- Users can create their own alerts
create policy "Users can create their own alerts"
on public.emergency_alerts
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can see their own alerts
create policy "Users can view their own alerts"
on public.emergency_alerts
for select
to authenticated
using (auth.uid() = user_id);

-- Admins can see everything
create policy "Admins can view all alerts"
on public.emergency_alerts
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Admins can update (acknowledge / resolve)
create policy "Admins can update alerts"
on public.emergency_alerts
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Admins can delete
create policy "Admins can delete alerts"
on public.emergency_alerts
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Touch updated_at
create trigger emergency_alerts_touch_updated_at
before update on public.emergency_alerts
for each row execute function public.touch_updated_at();

-- Enable realtime so the admin portal updates instantly
alter table public.emergency_alerts replica identity full;
alter publication supabase_realtime add table public.emergency_alerts;