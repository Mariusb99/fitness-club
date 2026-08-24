/**
 * Ecran afișat instant de Next.js în timp ce pagina către care ai navigat
 * își încarcă datele pe server (Suspense automat pentru orice rută din
 * grupul „(app)"). Fără acest fișier, ecranul rămâne complet înghețat cât
 * timp serverul așteaptă răspunsul de la Supabase — ceea ce se simte ca o
 * aplicație blocată, chiar dacă durata reală nu s-a schimbat. Cu el, feedback-ul
 * vizual apare imediat, iar pagina se înlocuiește singură când e gata.
 */
export default function AppLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent"
        role="status"
        aria-label="Se încarcă"
      />
      <p className="text-sm text-text-muted">Se încarcă...</p>
    </div>
  );
}
