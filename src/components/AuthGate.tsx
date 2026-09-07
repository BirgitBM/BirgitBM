"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { Button, Card, Field, inputClass } from "@/components/ui";

// Phase 1 (jetzt): NEXT_PUBLIC_REQUIRE_AUTH=false → kein Login nötig,
// lokale Tests laufen wie bisher direkt gegen die (noch offenen) RLS-Policies.
//
// Phase 2 (vor Vercel-Deployment): NEXT_PUBLIC_REQUIRE_AUTH=true setzen,
// supabase/schema_auth.sql ausführen (restriktive Policies) und einen
// Admin-Nutzer in Supabase Auth anlegen. Ab dann blockiert dieses Gate
// den Zugriff, bis man sich mit E-Mail/Passwort anmeldet.

const authRequired = process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(!authRequired);

  useEffect(() => {
    if (!authRequired) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!authRequired) {
    return <>{children}</>;
  }

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory text-taupe text-sm">
        Prüfe Anmeldung …
      </div>
    );
  }

  if (!session) {
    return <LoginForm />;
  }

  return <>{children}</>;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [ladend, setLadend] = useState(false);

  const anmelden = async (e: FormEvent) => {
    e.preventDefault();
    setFehler(null);
    setLadend(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });
    setLadend(false);
    if (error) setFehler("Anmeldung fehlgeschlagen. E-Mail oder Passwort prüfen.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory px-4">
      <Card className="w-full max-w-sm">
        <div className="font-display text-2xl mb-1">ContentOS</div>
        <p className="text-sm text-taupe mb-6">Bitte mit dem Admin-Konto anmelden.</p>
        <form onSubmit={anmelden} className="space-y-4">
          <Field label="E-Mail">
            <input
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Passwort">
            <input
              type="password"
              required
              className={inputClass}
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
            />
          </Field>
          {fehler && <p className="text-sm text-[var(--red)]">{fehler}</p>}
          <Button type="submit" disabled={ladend} className="w-full">
            {ladend ? "Anmelden …" : "Anmelden"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
