# More Vitality

PWA de coaching sportif pour Maxime Verbruggen — site public + espace élève connecté.

Voir `cahier des charges.md` (brief produit) et `decisions.md` (décisions techniques) à la racine du repo.

## Stack

- React + Vite + Tailwind CSS + Framer Motion, en PWA (`vite-plugin-pwa`)
- Supabase (Postgres + Auth + Storage) — deux projets séparés : dev et prod
- Hébergement : Cloudflare Pages · Domaine : OVH

## Démarrer en local

```bash
npm install
cp .env.example .env.development   # renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

## Base de données

Le schéma de départ est dans `supabase/schema.sql`. Pour l'appliquer : coller son contenu dans
Supabase Studio → SQL Editor du projet **dev**, tester, puis rejouer le même SQL dans le projet
**prod** une fois validé (pas de CLI/migrations pour la V1, cf. `decisions.md` #11).

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run preview` — prévisualiser le build localement
