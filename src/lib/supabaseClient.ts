import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Wird zur Build-Zeit und beim Start sichtbar, falls .env.local fehlt.
  console.warn(
    "Supabase-Umgebungsvariablen fehlen. Bitte .env.local prüfen (siehe README)."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseKey ?? "");
