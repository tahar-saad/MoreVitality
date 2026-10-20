-- More Vitality — schéma de départ (V1 / VMP)
-- À exécuter dans Supabase Studio (SQL Editor) du projet DEV d'abord, puis PROD une fois validé.
-- Brouillon de travail : à ajuster au fil du développement, pas figé.

-- Profils : étend auth.users avec le rôle (élève ou coach) et des infos de base.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student', 'coach')),
  created_at timestamptz not null default now()
);

-- Séances passées / à venir d'un élève.
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  coach_id uuid references public.profiles (id),
  date date not null,
  content text,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'done', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Notes de progression, indépendantes des séances individuelles.
create table if not exists public.progress_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

-- Groupes duo/groupe (coaching santé) — relie les élèves qui s'entraînent ensemble.
create table if not exists public.training_groups (
  id uuid primary key default gen_random_uuid(),
  label text,
  created_at timestamptz not null default now()
);

create table if not exists public.training_group_members (
  group_id uuid not null references public.training_groups (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  primary key (group_id, student_id)
);

-- Demandes du formulaire de contact (avant de devenir élève).
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  interest text,
  objective text,
  message text,
  created_at timestamptz not null default now()
);

-- Row Level Security : à activer et détailler avant toute vraie donnée (cf. decisions.md #11).
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.progress_notes enable row level security;
alter table public.training_groups enable row level security;
alter table public.training_group_members enable row level security;
alter table public.contact_requests enable row level security;

-- Exemple de policy à affiner : un élève ne voit que ses propres séances.
create policy "students see own sessions" on public.sessions
  for select using (auth.uid() = student_id);

-- Déclencheur : crée automatiquement une ligne "profiles" à chaque inscription
-- (auth.users et public.profiles sont deux tables séparées — sans ça, profiles resterait vide).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Extension "espace personnel" (cf. todo.md) — questionnaire de profil,
-- commentaires de séance, témoignages modérés, politiques RLS complètes.
-- Bloc à exécuter en une fois, dans une nouvelle query du SQL Editor.
-- ============================================================

-- Questionnaire de profil (rempli par l'élève après inscription) + package assigné par le coach.
create table if not exists public.student_profile (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  niveau text,
  objectif text,
  contraintes_temps text,
  blessures text,
  format_prefere text check (format_prefere in ('individuel', 'duo', 'groupe')),
  lieu_prefere text check (lieu_prefere in ('presentiel', 'en_ligne')),
  package_mode text check (package_mode in ('coaching_running', 'coaching_sante')),
  package_format text check (package_format in ('solo', 'duo', 'groupe')),
  referred_by uuid references public.profiles (id),
  rempli_le timestamptz,
  vu_par_coach boolean not null default false,
  created_at timestamptz not null default now()
);

-- Commentaires sur une séance — élève ET coach peuvent tous les deux écrire dans le même fil.
create table if not exists public.session_comments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

-- Témoignages soumis par les élèves, modérés par le coach avant publication publique.
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  rating int check (rating between 1 and 5),
  photo_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- "notes" sur sessions est remplacé par session_comments (plusieurs auteurs possibles, historique).
alter table public.sessions drop column if exists notes;

-- Jalon optionnel sur une note de progression (mis en avant visuellement côté élève).
alter table public.progress_notes add column if not exists is_milestone boolean not null default false;

-- Fonction utilitaire : vérifie si l'utilisateur connecté est le coach, sans provoquer de
-- récursion RLS (security definer = contourne les policies pour cette seule requête interne).
create or replace function public.is_coach()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'coach'
  );
$$;

alter table public.student_profile enable row level security;
alter table public.session_comments enable row level security;
alter table public.testimonials enable row level security;

-- ---- profiles (aucune policy n'existait encore avant ce bloc — corrigé ici) ----
create policy "own profile readable" on public.profiles
  for select using (auth.uid() = id or public.is_coach());
create policy "own profile editable" on public.profiles
  for update using (auth.uid() = id or public.is_coach());

-- ---- sessions (remplace l'ancienne policy, trop limitée) ----
drop policy if exists "students see own sessions" on public.sessions;

create policy "sessions readable by owner or coach" on public.sessions
  for select using (auth.uid() = student_id or public.is_coach());
create policy "sessions writable by coach" on public.sessions
  for insert with check (public.is_coach());
create policy "sessions updatable by coach" on public.sessions
  for update using (public.is_coach());

-- ---- session_comments ----
create policy "comments readable by session owner or coach" on public.session_comments
  for select using (
    public.is_coach()
    or exists (select 1 from public.sessions s where s.id = session_id and s.student_id = auth.uid())
  );
create policy "comments insertable by session owner or coach" on public.session_comments
  for insert with check (
    author_id = auth.uid()
    and (
      public.is_coach()
      or exists (select 1 from public.sessions s where s.id = session_id and s.student_id = auth.uid())
    )
  );

-- ---- progress_notes ----
create policy "progress readable by owner or coach" on public.progress_notes
  for select using (auth.uid() = student_id or public.is_coach());
create policy "progress writable by coach" on public.progress_notes
  for insert with check (public.is_coach());

-- ---- student_profile ----
create policy "student profile readable by owner or coach" on public.student_profile
  for select using (auth.uid() = student_id or public.is_coach());
create policy "student profile upsertable by owner" on public.student_profile
  for insert with check (auth.uid() = student_id);
create policy "student profile editable by owner or coach" on public.student_profile
  for update using (auth.uid() = student_id or public.is_coach());

-- ---- training_groups / training_group_members ----
create policy "groups readable by members or coach" on public.training_groups
  for select using (
    public.is_coach()
    or exists (select 1 from public.training_group_members m where m.group_id = id and m.student_id = auth.uid())
  );
create policy "groups writable by coach" on public.training_groups
  for all using (public.is_coach());

create policy "group members readable by members or coach" on public.training_group_members
  for select using (public.is_coach() or student_id = auth.uid());
create policy "group members writable by coach" on public.training_group_members
  for all using (public.is_coach());

-- ---- testimonials ----
create policy "testimonials insertable by owner" on public.testimonials
  for insert with check (auth.uid() = student_id);
create policy "testimonials readable by owner, coach, or public if approved" on public.testimonials
  for select using (status = 'approved' or auth.uid() = student_id or public.is_coach());
create policy "testimonials moderated by coach" on public.testimonials
  for update using (public.is_coach());

-- ---- contact_requests ----
create policy "anyone can submit a contact request" on public.contact_requests
  for insert with check (true);
create policy "contact requests readable by coach" on public.contact_requests
  for select using (public.is_coach());

-- ============================================================
-- Migration : une séance peut réunir plusieurs élèves (duo/groupe).
-- `sessions.student_id` supposait un seul élève par séance, ce qui ne correspond pas
-- au cahier des charges (individuel/duo/groupe). À exécuter en une fois.
-- ============================================================

-- Supprime d'abord les anciennes policies qui dépendent de sessions.student_id
-- (sinon Postgres refuse de retirer la colonne plus bas).
drop policy if exists "sessions readable by owner or coach" on public.sessions;
drop policy if exists "comments readable by session owner or coach" on public.session_comments;
drop policy if exists "comments insertable by session owner or coach" on public.session_comments;

create table if not exists public.session_participants (
  session_id uuid not null references public.sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  primary key (session_id, student_id)
);

-- Reprend les séances déjà créées (s'il y en a) avant de retirer l'ancienne colonne.
insert into public.session_participants (session_id, student_id)
select id, student_id from public.sessions where student_id is not null
on conflict do nothing;

alter table public.sessions drop column if exists student_id;

alter table public.session_participants enable row level security;

create policy "session participants readable by participant or coach" on public.session_participants
  for select using (student_id = auth.uid() or public.is_coach());
create policy "session participants writable by coach" on public.session_participants
  for all using (public.is_coach());

create policy "sessions readable by participant or coach" on public.sessions
  for select using (
    public.is_coach()
    or exists (
      select 1 from public.session_participants sp
      where sp.session_id = id and sp.student_id = auth.uid()
    )
  );

create policy "comments readable by session participant or coach" on public.session_comments
  for select using (
    public.is_coach()
    or exists (
      select 1 from public.session_participants sp
      where sp.session_id = session_comments.session_id and sp.student_id = auth.uid()
    )
  );

create policy "comments insertable by session participant or coach" on public.session_comments
  for insert with check (
    author_id = auth.uid()
    and (
      public.is_coach()
      or exists (
        select 1 from public.session_participants sp
        where sp.session_id = session_comments.session_id and sp.student_id = auth.uid()
      )
    )
  );

-- ============================================================
-- Migration : format de la séance (solo/duo/groupe), pour plafonner le nombre
-- d'élèves qu'on peut y assigner (le plafond est appliqué côté appli, pas en base).
-- ============================================================

alter table public.sessions add column if not exists format text not null default 'solo'
  check (format in ('solo', 'duo', 'groupe'));

-- ============================================================
-- Migration : nom, couleur et regroupement de série pour les séances.
-- - label : nom optionnel donné par le coach (ex. "Duo Sophie/Marc"), affiché dans l'agenda.
-- - color : couleur hex choisie par le coach (aide à repérer un groupe/duo dans la vue semaine/mois).
-- - recurrence_group_id : identifiant technique interne (jamais affiché/modifiable dans l'UI),
--   partagé par toutes les séances générées en une fois via "Répéter cette séance".
-- ============================================================

alter table public.sessions add column if not exists label text;
alter table public.sessions add column if not exists color text not null default '#17385c';
alter table public.sessions add column if not exists recurrence_group_id uuid;

-- ============================================================
-- Migration : heure de début/fin de la séance (absente jusqu'ici, seule la date existait).
-- ============================================================

alter table public.sessions add column if not exists start_time time;
alter table public.sessions add column if not exists end_time time;

-- ============================================================
-- Migration : autoriser la suppression de séances par le coach (aucune policy
-- de delete n'existait jusqu'ici sur "sessions" — nécessaire pour "Supprimer" une série).
-- session_participants/session_comments sont déjà en "on delete cascade".
-- ============================================================

create policy "sessions deletable by coach" on public.sessions
  for delete using (public.is_coach());

-- ============================================================
-- Migration : un élève doit voir TOUS les participants d'une séance à laquelle
-- il participe (pas juste sa propre ligne) pour qu'un duo/groupe affiche "Avec X".
-- L'ancienne policy ne laissait voir que sa propre ligne — corrigée ici.
-- Passe par une fonction SECURITY DEFINER (comme is_coach()) pour éviter la
-- récursion infinie d'une policy sur session_participants qui s'interroge elle-même.
-- ============================================================

create or replace function public.is_session_participant(target_session_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.session_participants
    where session_id = target_session_id and student_id = auth.uid()
  );
$$;

drop policy if exists "session participants readable by participant or coach" on public.session_participants;
drop policy if exists "session participants readable by co-participant or coach" on public.session_participants;

create policy "session participants readable by co-participant or coach" on public.session_participants
  for select using (
    public.is_coach()
    or public.is_session_participant(session_id)
  );

-- ============================================================
-- Migration : ajoute "Peu importe" comme réponse possible à la question de format
-- préféré du questionnaire (un élève peut vouloir mixer solo et groupe).
-- ============================================================

alter table public.student_profile drop constraint if exists student_profile_format_prefere_check;
alter table public.student_profile add constraint student_profile_format_prefere_check
  check (format_prefere in ('individuel', 'duo', 'groupe', 'peu_importe'));

-- ============================================================
-- Migration : questionnaire de profil conditionnel (retour Maxime du 6 oct., point 8).
-- Nouvelle 1re question "quel type d'accompagnement ?", qui détermine quelles questions
-- suivantes s'affichent côté élève (cf. ProfileQuestionnaire.jsx). Les 4 champs "course_*"
-- ne sont utilisés que pour la branche running + objectif "Préparer une course".
-- ============================================================

alter table public.student_profile add column if not exists type_accompagnement text
  check (type_accompagnement in ('coaching_sportif', 'coaching_running', 'indecis'));
alter table public.student_profile add column if not exists course_distance text;
alter table public.student_profile add column if not exists course_nom text;
alter table public.student_profile add column if not exists course_date date;
alter table public.student_profile add column if not exists course_deja_participe boolean;

-- ============================================================
-- Migration : expose l'email sur profiles. auth.users n'est pas accessible depuis le
-- client (PostgREST), donc impossible d'afficher l'email côté coach sans le dupliquer
-- ici. Sert de repli d'affichage quand l'élève n'a pas renseigné son nom (inscription
-- email/mot de passe — Google/Facebook renseignent full_name automatiquement, ce
-- formulaire-là non).
-- ============================================================

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;

-- ============================================================
-- Migration : le coach doit pouvoir assigner un package à un élève qui n'a pas encore
-- rempli son questionnaire (aucune ligne student_profile pour lui pour l'instant).
-- L'ancienne policy d'insertion n'autorisait que l'élève lui-même à créer sa propre
-- ligne — ça bloquait silencieusement le upsert fait par CoachStudentDetail.jsx.
-- ============================================================

drop policy if exists "student profile upsertable by owner" on public.student_profile;
create policy "student profile insertable by owner or coach" on public.student_profile
  for insert with check (auth.uid() = student_id or public.is_coach());

-- ============================================================
-- Migration : notifications de messages non lus. Une ligne = "j'ai lu les commentaires
-- de cette séance jusqu'à cet instant". Chacun ne lit/écrit jamais que sa propre ligne,
-- coach compris — pas besoin de distinguer owner/coach dans les policies ici.
-- ============================================================

create table if not exists public.session_reads (
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

alter table public.session_reads enable row level security;

create policy "session reads readable by owner" on public.session_reads
  for select using (user_id = auth.uid());
create policy "session reads insertable by owner" on public.session_reads
  for insert with check (user_id = auth.uid());
create policy "session reads updatable by owner" on public.session_reads
  for update using (user_id = auth.uid());
