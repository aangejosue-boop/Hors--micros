import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants — copie .env.example vers .env et renseigne tes identifiants Supabase. L'app tourne en mode dégradé (aucune donnée ne sera chargée ou publiée)."
  );
}

// Une URL factice valide évite que createClient() ne lève une exception au
// chargement du module quand les variables d'env ne sont pas encore définies.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

export interface MessageRow {
  id: number;
  content: string;
  tags: string[];
  alias: string;
  created_at: string;
  heart_count: number;
  fire_count: number;
  hug_count: number;
  comments_count: number;
}
