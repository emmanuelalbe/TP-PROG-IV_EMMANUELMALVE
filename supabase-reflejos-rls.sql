alter table public.partidas_reflejos enable row level security;

drop policy if exists "reflejos_insert_propias" on public.partidas_reflejos;
drop policy if exists "reflejos_select_ranking" on public.partidas_reflejos;

create policy "reflejos_insert_propias"
  on public.partidas_reflejos
  for insert
  to authenticated
  with check (auth.uid() = usuario_id);

create policy "reflejos_select_ranking"
  on public.partidas_reflejos
  for select
  to authenticated
  using (true);

grant usage on schema public to authenticated;
grant select, insert on table public.partidas_reflejos to authenticated;
