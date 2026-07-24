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

-- Modération : verrou côté base de données (empêche de contourner le filtre
-- côté client en appelant directement l'API). Liste non exhaustive de mots-clés.
create extension if not exists unaccent;

create or replace function reject_inappropriate_content()
returns trigger
language plpgsql
as $$
declare
  banned text[] := array[
    'connard','connasse','encule','enculee','enfoire','enfoiree','salope','pute',
    'batard','abruti','debile mental','sous-merde','ordure','ntm',
    'nique ta mere','nique sa mere','ta gueule','gros porc',
    'sale race','sale arabe','sale noir','sale juif','sale musulman','bougnoule',
    'negro','negre','chinetoque','youpin','feuj','pede','sale pd','tapette','gouine',
    'sale gitan','sale rom','sous-race','race inferieure',
    'je vais te tuer','je vais te violer','tu merites de mourir','tu devrais mourir',
    'il faut les exterminer','il faut tous les tuer',
    'envoie des nudes','envoie moi des nudes','photo de sexe','viol','pedophile',
    'pedopornographie','je veux te violer','sexe avec un enfant'
  ];
  normalized text;
  term text;
begin
  normalized := lower(unaccent(new.content));
  foreach term in array banned loop
    if normalized like '%' || term || '%' then
      raise exception 'Contenu non autorisé détecté';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists messages_moderation on messages;
create trigger messages_moderation
  before insert on messages
  for each row execute function reject_inappropriate_content();
