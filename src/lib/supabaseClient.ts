import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Wird zur Build-Zeit und beim Start sichtbar, falls .env.local fehlt.
  console.warn(
    "Supabase-Umgebungsvariablen fehlen. Bitte .env.local prüfen (siehe README)."
  );
}

// Platzhalter-Adresse, falls die Umgebungsvariablen fehlen.
//
// Grund: createClient("") wirft sofort einen Fehler und lässt damit den
// gesamten Build abbrechen – mit der wenig hilfreichen Meldung
// "supabaseUrl is required". Mit einer gültigen Platzhalter-Adresse läuft der
// Build durch, und der Fehler erscheint dort, wo er hingehört: als Meldung
// in der Anwendung ("Verbindung zu Supabase fehlgeschlagen"), sobald Daten
// geladen werden sollen.
const PLATZHALTER_URL = "https://platzhalter.supabase.co";

export const supabase = createClient(
  supabaseUrl || PLATZHALTER_URL,
  supabaseKey || "platzhalter-key"
);

// Damit die Oberfläche unterscheiden kann zwischen "nicht eingerichtet"
// und "eingerichtet, aber Abfrage fehlgeschlagen".
export const supabaseKonfiguriert = Boolean(supabaseUrl && supabaseKey);
