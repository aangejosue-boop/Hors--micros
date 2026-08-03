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
-- côté client, par ex. en appelant directement l'API REST avec la clé anon).
-- Garder cette liste synchronisée avec BANNED_TERMS dans src/lib/moderation.ts.
create extension if not exists unaccent;

-- Normalise comme côté client : minuscules, sans accents, leetspeak courant
-- ramené en lettres, puis on retire tout caractère non alphabétique (espaces,
-- ponctuation, emojis...). Indispensable : sans ça, "c o n n a r d" ou
-- "c.o.n.n.a.r.d" passaient au travers du filtre (comparaison par sous-chaîne
-- exigeant que les lettres se touchent des deux côtés).
create or replace function normalize_for_moderation(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    regexp_replace(
      translate(lower(unaccent(coalesce(input, ''))), '013457@$', 'oieastas'),
      '[^a-z]', '', 'g'
    ),
    '(.)\1{2,}', '\1\1', 'g'
  );
$$;

create or replace function reject_inappropriate_content()
returns trigger
language plpgsql
as $$
declare
  banned text[] := array[
    -- Insultes courantes
    'connard','connasse','connarde','con de','encule','enculee',
    'enfoire','enfoiree','salope','salopard','pute','putain de','fils de pute',
    'batard','abruti','abrutie','debile mental','attarde','attardee',
    'sous-merde','merdeux','merdeuse','ordure','raclure',
    'nique ta mere','nique sa mere','va crever','ferme ta gueule',
    'ta gueule','gros porc','sac a merde',

    -- Haine / discrimination
    'sale race','sale arabe','sale noir','sale juif','sale musulman',
    'bougnoule','negro','negre','chinetoque','youpin','feuj',
    'pede','sale pd','tapette','gouine','sale gitan','sale rom',
    'sous-race','race inferieure','vous etes tous des','retournez dans votre pays',
  ];
  normalized_content text;
  term text;
begin
  normalized_content := normalize_for_moderation(new.content);
  foreach term in array banned loop
    if position(normalize_for_moderation(term) in normalized_content) > 0 then
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

-- Anti-doublon : empêche qu'un même message publié par erreur plusieurs fois
-- de suite (double-clic, mauvaise connexion...) ne se retrouve dupliqué dans
-- la base. Comparaison sur le texte exact, limitée aux publications récentes
-- pour ne pas bloquer pour toujours une phrase qu'un autre visiteur écrirait
-- coïncidemment plus tard.
create or replace function reject_duplicate_content()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from messages
    where content = new.content
      and created_at > now() - interval '24 hours'
  ) then
    raise exception 'Ce message a déjà été publié récemment.';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_dedup on messages;
create trigger messages_dedup
  before insert on messages
  for each row execute function reject_duplicate_content();
