# Fitness Club — platformă internă antrenori + administrator

Platformă internă pentru monitorizarea progresului clienților dintr-un program de transformare corporală. Administratorul are acces complet; fiecare antrenor vede și gestionează doar clienții proprii.

Construită cu Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage) + Tailwind CSS 4.

## Ce conține

- Autentificare email + parolă (Supabase Auth); conturile se creează exclusiv din pagina **Utilizatori**, de către administrator.
- Roluri: `admin` (acces total) și `trainer` (doar clienții proprii), impuse atât în UI cât și la nivel de bază de date prin Row Level Security.
- Fișă client: date personale, anamneză, evaluare inițială (greutate, înălțime, IMC, circumferințe), obiective, observații.
- Actualizări lunare: greutate nouă, măsurători noi, grafic de evoluție.
- Fotografii înainte/după: încărcare direct din camera telefonului, stocare privată, comparație vizuală.
- Rapoarte: statistici, clasament evoluție, export PDF (cu diacritice românești) per client și agregat.
- Jurnal de acțiuni (audit trail), filtrabil pe autor — vizibil administratorului.
- Profil antrenor: specializări, bio, certificări și diplome descărcabile (Supabase Storage).
- Optimizată pentru telefon: meniu hamburger, liste sub formă de carduri, formulare împărțite în secțiuni pliabile.

### Gestionarea conturilor (pagina Utilizatori)

Din meniul „⋮" al fiecărui cont, administratorul poate:

- **Edita datele** — nume, email, telefon, rol, fără a șterge și recrea contul.
- **Reseta parola** — generează o parolă temporară afișată o singură dată (și trimisă pe email, dacă e configurat un serviciu de email).
- **Trimite link de resetare** — utilizatorul își alege singur parola nouă.
- **Vedea acțiunile în jurnal** — sare direct în jurnal, filtrat pe acel utilizator.
- **Dezactiva / reactiva contul** — blochează autentificarea, dar păstrează intacte clienții, măsurătorile și istoricul.
- **Șterge contul** definitiv. Un antrenor care are clienți asignați nu poate fi șters — platforma refuză și recomandă dezactivarea, ca să nu rămână clienți fără antrenor.

Lista are căutare după nume/email și filtre după rol și după stare (activ/dezactivat), plus numărul de clienți asignați și data ultimei autentificări pentru fiecare cont.

## Mod demo (fără Supabase conectat)

Fără variabilele de mediu Supabase setate, aplicația rulează automat în **mod demo**: te loghează ca administrator și afișează date exemplu din `src/lib/seed.ts`, ca să poți naviga prin toate ecranele. Un banner roșu în partea de sus a paginii te anunță când ești în acest mod. Nicio scriere (creare client, cont, upload) nu se salvează în mod demo.

```bash
npm install
npm run dev
```

Deschide http://localhost:3000 — te duce direct la `/dashboard`.

## Conectarea la Supabase (date reale)

1. Creează un proiect nou pe [supabase.com](https://supabase.com) (gratuit pentru pornire).
2. În proiectul nou, deschide **SQL Editor** și rulează tot conținutul fișierului `supabase/schema.sql` din acest repo. Acesta creează tabelele, rolurile, politicile de securitate (RLS) — antrenorul vede doar clienții proprii, adminul vede tot — precum și cele trei bucket-uri private de Storage (`client-photos`, `trainer-documents`, `avatars`) împreună cu regulile lor de acces.
3. Copiază `.env.local.example` în `.env.local` și completează:
   - `NEXT_PUBLIC_SUPABASE_URL` și `NEXT_PUBLIC_SUPABASE_ANON_KEY` — din **Project Settings → API**
   - `SUPABASE_SERVICE_ROLE_KEY` — din același loc (folosit STRICT pe server, pentru gestionarea conturilor din pagina Utilizatori — nu îl expune niciodată public)
   - `NEXT_PUBLIC_SITE_URL` — adresa platformei, folosită în linkurile trimise pe email
4. Creează primul cont de administrator direct din Supabase (până creezi restul din UI). Recomandat: folosește un email generic al sălii (nu emailul tău personal), de exemplu `fitnessclub@admin.com` — poți schimba oricând parola sau adăuga alte conturi de admin ulterior, din pagina **Utilizatori**.
   - **Authentication → Users → Add user** — introdu `fitnessclub@admin.com` și o parolă (de ex. `Adminpass123!`, sau alta mai sigură)
   - Apoi în **SQL Editor**, rulează (înlocuiește UUID-ul cu id-ul userului creat, vizibil în lista de utilizatori):
     ```sql
     insert into public.profiles (id, role, full_name, email)
     values ('<uuid-ul-userului>', 'admin', 'Admin Fitness Club', 'fitnessclub@admin.com');
     ```
5. Repornește aplicația (`npm run dev`) — bannerul de „mod demo" dispare și te poți loga cu contul creat. Din pagina **Utilizatori** poți crea acum conturile pentru cei 4 antrenori.

### Invitații și resetări de parolă pe email

Conturile noi se creează implicit prin **invitație pe email**: antrenorul primește un link, își setează singur parola și nu circulă nicio parolă prin mesaje. Pentru asta, în Supabase → **Authentication → URL Configuration** pune adresa platformei la *Site URL* și adaugă `<adresa-platformei>/auth/confirm` la *Redirect URLs*.

Dacă emailurile nu sunt încă configurate, poți alege în formularul de cont nou varianta cu **parolă temporară setată de tine** — funcționează fără niciun serviciu de email.

### Notificări opționale pe email

Pentru notificări de tip „contul tău a fost dezactivat", setează `RESEND_API_KEY` și `EMAIL_FROM` (cont gratuit pe [resend.com](https://resend.com)). Fără ele platforma funcționează normal — pur și simplu nu trimite aceste notificări.

## Deploy pe Netlify

1. Urcă acest cod într-un repo GitHub nou (sub contul tău `Mariusb99`).
2. În Netlify: **Add new site → Import an existing project** → conectează repo-ul.
3. Build command: `npm run build` · Publish directory: `.next` (Netlify detectează automat Next.js).
4. Adaugă în **Site settings → Environment variables** aceleași variabile din `.env.local` (cu `NEXT_PUBLIC_SITE_URL` setat pe domeniul real).
5. Deploy. Domeniul `.ro` se poate lega ulterior din **Domain settings**.

## Structură

- `src/app/(auth)/login` — autentificare; `src/app/(auth)/setare-parola` — setarea parolei după invitație/resetare
- `src/app/auth/confirm` — punctul de aterizare pentru linkurile trimise pe email
- `src/app/(app)/*` — zona protejată (dashboard, clienți, rapoarte, antrenori, utilizatori, jurnal, profil)
- `src/components/layout/*` — sidebar-ul de desktop și meniul hamburger de pe telefon
- `src/lib/data/*` — interogări Supabase (cu fallback pe date demo)
- `src/lib/supabase/*` — clienți Supabase (browser, server, admin) și schema TypeScript
- `src/lib/email.ts` — notificări pe email (opționale)
- `supabase/schema.sql` — schema completă a bazei de date + RLS + bucket-uri și politici de Storage
