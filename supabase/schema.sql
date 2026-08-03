-- ============================================================
-- Fonction de modération corrigée
-- Remplace uniquement la fonction reject_inappropriate_content()
-- Le reste de ton schéma (table, policies, realtime, dedup) ne
-- change pas.
-- ============================================================

-- On garde normalize_for_moderation telle quelle, elle est correcte.

create or replace function reject_inappropriate_content()
returns trigger
language plpgsql
as $$
declare
  banned text[] := array[
    -- Insultes courantes
    'connard','connasse','connarde','encule','enculee',
    'enfoire','enfoiree','salope','salopard','pute','putain',
    'filsdepute','batard','abruti','abrutie','debilemental','attarde','attardee',
    'sousmerde','merdeux','merdeuse','ordure','raclure',
    'niquetamere','niquesamere','vacrever','fermetagueule',
    'tagueule','grosporc','sacamerde',

    -- Haine / discrimination
    'salerace','salearabe','salenoir','salejuif','salemusulman',
    'bougnoule','negro','negre','chinetoque','youpin','feuj',
    'pede','salepd','tapette','gouine','salegitan','salerom',
    'sousrace','raceinferieure'
  ];
  normalized_content text;
  term text;
begin
  normalized_content := normalize_for_moderation(new.content);
  foreach term in array banned loop
    -- '(^|[^a-z])terme($|[^a-z])' aurait été idéal, mais comme
    -- normalize_for_moderation retire déjà TOUS les caractères non
    -- alphabétiques (espaces compris), on ne peut plus détecter de
    -- "frontières de mots" après coup. On utilise donc position(),
    -- mais avec une liste nettoyée (sans espaces internes fautifs,
    -- sans doublons, mots complets uniquement) pour limiter les
    -- faux positifs. Voir note ci-dessous si tu veux une détection
    -- par mot exact plutôt que par sous-chaîne.
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