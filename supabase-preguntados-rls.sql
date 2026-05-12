alter table public.partidas_preguntados enable row level security;

drop policy if exists "preguntados_insert_propias" on public.partidas_preguntados;
drop policy if exists "preguntados_select_ranking" on public.partidas_preguntados;

create policy "preguntados_insert_propias"
  on public.partidas_preguntados
  for insert
  to authenticated
  with check (auth.uid() = usuario_id);

create policy "preguntados_select_ranking"
  on public.partidas_preguntados
  for select
  to authenticated
  using (true);

grant usage on schema public to authenticated;
grant select, insert on table public.partidas_preguntados to authenticated;
