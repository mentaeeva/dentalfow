-- DentaFlow static GitHub Pages demo backend.
-- This open demo policy is for fictional/sample data only. It is NOT safe for patient data.
create table if not exists public.dentaflow_state (
  id text primary key check (id = 'shared'),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.dentaflow_state enable row level security;
grant select, insert, update on public.dentaflow_state to anon, authenticated;
drop policy if exists "demo state readable" on public.dentaflow_state;
create policy "demo state readable" on public.dentaflow_state for select to anon, authenticated using (true);
drop policy if exists "demo state insertable" on public.dentaflow_state;
create policy "demo state insertable" on public.dentaflow_state for insert to anon, authenticated with check (id = 'shared');
drop policy if exists "demo state updatable" on public.dentaflow_state;
create policy "demo state updatable" on public.dentaflow_state for update to anon, authenticated using (id = 'shared') with check (id = 'shared');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dentaflow-files', 'dentaflow-files', true, 52428800,
  array['model/stl','application/octet-stream','application/zip','model/obj','image/jpeg','image/png','image/webp','application/pdf','application/dicom'])
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "demo files readable" on storage.objects;
create policy "demo files readable" on storage.objects for select to anon, authenticated using (bucket_id = 'dentaflow-files');
drop policy if exists "demo files uploadable" on storage.objects;
create policy "demo files uploadable" on storage.objects for insert to anon, authenticated with check (bucket_id = 'dentaflow-files');
drop policy if exists "demo files removable" on storage.objects;
create policy "demo files removable" on storage.objects for delete to anon, authenticated using (bucket_id = 'dentaflow-files');

-- Enable cross-device live refresh for the single shared demo state.
do $$ begin
  alter publication supabase_realtime add table public.dentaflow_state;
exception when duplicate_object then null;
end $$;
