-- À exécuter dans l'éditeur SQL du dashboard Supabase (SQL Editor -> New query).

create table if not exists messages (
  id bigint generated always as identity primary key,
  content text not null,
  tags text[] not null default '{}',
  alias text not null,
  created_at timestamptz not null default now(),
  heart_count int not null default 0,
  fire_count int not null default 0,
  hug_count int not null default 0,
  comments_count int not null default 0
);

alter table messages enable row level security;

-- App 100% anonyme, sans compte : tout visiteur (clé anon) peut lire et publier.
create policy "Anyone can read messages"
  on messages for select
  using (true);

create policy "Anyone can post messages"
  on messages for insert
  with check (true);

-- Incrémente/décrémente un compteur de réaction de façon atomique.
create or replace function toggle_reaction(message_id bigint, reaction text, delta int)
returns void
language plpgsql
security definer
as $$
begin
  if reaction = 'heart' then
    update messages set heart_count = greatest(0, heart_count + delta) where id = message_id;
  elsif reaction = 'fire' then
    update messages set fire_count = greatest(0, fire_count + delta) where id = message_id;
  elsif reaction = 'hug' then
    update messages set hug_count = greatest(0, hug_count + delta) where id = message_id;
  else
    raise exception 'unknown reaction type: %', reaction;
  end if;
end;
$$;

grant execute on function toggle_reaction(bigint, text, int) to anon, authenticated;

-- Realtime : permet à l'app de recevoir les nouveaux messages en direct.
alter publication supabase_realtime add table messages;
