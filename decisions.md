# More Vitality — Décisions de conception (appli)

Ce fichier trace les choix qu'on fait ensemble avant de commencer à coder. On avance point par point, rien n'est implémenté tant qu'une ligne n'est pas passée en ✅.

## ✅ 1. Format du produit

**Décision :** un seul produit — une PWA qui sert à la fois de vitrine publique (Accueil, Coaching Running/Santé, À propos, Témoignages, FAQ, Contact) et d'espace élève une fois connecté.

**Pourquoi :** maintenance solo plus simple (un seul repo, un seul déploiement) ; un coach sportif ne vit pas du SEO (bouche-à-oreille, réseaux sociaux), donc pas besoin d'un site vitrine séparé optimisé référencement ; parcours plus fluide pour le visiteur qui s'inscrit et reste dans la même appli.

## ✅ 2. Plateforme : PWA

**Décision :** PWA plutôt que natif cross-platform ou site web classique.

**Alternatives considérées :**
- **Natif cross-platform (React Native / Flutter)** — meilleure sensation native et présence sur les stores, mais nécessite un compte développeur Apple payant + revue Apple à chaque mise à jour + Google Play — trop lourd pour un petit projet solo sans budget.
- **Site web responsive classique (sans PWA)** — plus simple, mais pas d'icône sur l'écran d'accueil, pas de fonctionnement hors-ligne, ne "fait pas appli".
- **PWA (retenu)** — installable sans passer par les stores, mise à jour instantanée, fonctionne hors-ligne (consulter son programme en courant sans réseau), notifications push disponibles sur Android et iOS (16.4+).

**Piste à garder en tête :** si le projet grossit un jour, une migration vers du natif cross-platform reste possible plus tard.

## ✅ 3. Stack technique (backend / frontend)

**Décision :**
- **Front-end :** React + Vite + Tailwind CSS + Framer Motion, packagé en PWA (`vite-plugin-pwa`).
- **Back-end :** Supabase (Postgres + Auth + Storage managés).

**Pourquoi :** Tahar connaît déjà React (via MS_Planner), donc pas de nouvelle courbe d'apprentissage sur le framework lui-même — Vite/Tailwind/Framer Motion sont nouveaux mais légers à prendre en main. MS_Planner utilisait Create React App (react-scripts) + Material UI + React Bootstrap — CRA est officiellement abandonné depuis 2023, donc Vite est de toute façon la suite logique. Supabase évite de réécrire à la main l'auth/la base qu'il avait fait manuellement sur MS_Planner (Spring Boot), pour un projet solo sans budget.

## ✅ 4. Hébergement / déploiement

**Décision :**
- **Base de données + auth :** Supabase, plan gratuit (500 Mo DB, 1 Go stockage, 50k utilisateurs actifs/mois — largement suffisant). ⚠️ un projet gratuit se met en pause après 1 semaine sans activité (réactivation en un clic).
- **Site / PWA :** Cloudflare Pages (gratuit, sans limite de bande passante, pas de restriction "usage non commercial" contrairement à l'offre gratuite de Vercel — pertinent puisque c'est un vrai petit business).
- **Nom de domaine :** Maxime a déjà `morevitality.be`, acheté chez **Combell** (pas OVH finalement — info confirmée directement par Maxime). Pas indispensable de le connecter tout de suite, on peut utiliser l'URL gratuite de Cloudflare Pages en attendant. Au moment de la mise en ligne définitive : ajouter le domaine dans Cloudflare, récupérer les nameservers fournis, et c'est Maxime qui les renseigne lui-même dans son panneau Combell (jamais besoin de ses identifiants).

**Coût réel :** 0€/mois pour l'appli tant que le volume reste petit, + le prix du domaine OVH si/quand Maxime en veut un.

**Piste annexe (non tranchée) :** donner un compte Claude "de base" à Maxime pour qu'il assure une partie de la maintenance/évolutions du site lui-même plus tard.

## ✅ 5. Méthode de connexion

**Décision :** email/mot de passe classique + **authentification sociale** (social login, basé sur OAuth) via **Google** et **Facebook**.

**Statut :** Google configuré et testé de bout en bout (Google Cloud Console + Supabase Providers) — fonctionne. Facebook mis de côté temporairement : ça demande un compte Facebook pour créer l'app développeur ET pour tester (l'app reste en mode "Développement" tant qu'elle n'est pas validée par Facebook — seuls les comptes ajoutés comme testeurs/admins peuvent l'utiliser), et Tahar n'a pas de compte Facebook perso. **On le fera quand Maxime sera présent** (il a déjà Facebook, il pourra créer l'app lui-même). Le bouton "Continuer avec Facebook" reste dans l'interface — pas de changement côté code pour l'instant.

**Pourquoi :** Supabase gère nativement Google, Facebook, Apple et une dizaine d'autres fournisseurs — mais **pas Snapchat**, qui n'est pas un fournisseur de connexion standard. Le public de Maxime (adultes reprenant le sport, préparant une course) est bien couvert par Google + Facebook. Apple pourra être ajouté plus tard si l'appli arrive un jour sur l'App Store.

## ✅ 6. Rôles en V1

**Décision :** deux types de comptes dès la V1 — **élèves** (espace personnel : séances passées, progression, agenda, partenaires) et **Maxime en coach/admin**, avec un espace minimal pour alimenter ces données :
- liste de ses élèves ;
- consulter le questionnaire de profil rempli par chaque élève après inscription, pour lui proposer le bon package/service (cf. cahier des charges §8, "Questionnaire de profil") ;
- noter une séance faite (date, contenu, ressenti) ;
- mettre à jour la progression et l'agenda de chacun.

**Pourquoi :** sans un espace coach, personne ne peut alimenter les données que l'élève voit (séances, progression) — l'espace élève resterait une coquille vide. On reste volontairement minimal ici, pas de calendrier drag & drop ni de détection automatique de conflits comme visé sur MS_Planner — juste l'essentiel pour être utilisable au quotidien par un coach non technique.

**Contexte :** pas de système existant à reprendre (Excel, cahier, etc.) — on part de zéro sur la structure des données. Pas de liste d'élèves confirmée pour l'instant ; Tahar les ajoutera si besoin une fois Maxime consulté.

## ✅ 7. Sens de "partenaires" dans l'espace personnel

**Décision :** ce sont les **partenaires d'entraînement** — les autres personnes du même duo/groupe (coaching santé). Pas de messagerie (confirmé, pas juste pour la V1 — écarté tout court pour l'instant).

**Mise à jour (2026-09-26) :** la fonctionnalité "partenaires" elle-même (même en lecture seule) est **mise de côté pour l'instant**, pas juste la messagerie. Retirée de l'ordre de construction courant dans `todo.md` — les tables (`training_groups`/`training_group_members`) restent en base, prêtes, mais on ne construit pas l'UI tant que ce n'est pas redevenu prioritaire.

**Pourquoi :** logique VMP — on se concentre sur ce qui alimente réellement l'espace élève en premier (séances, progression), le reste peut attendre.

## ✅ 8. Langue(s) du site

**Décision (validée par Maxime) :** les 3 langues dès le départ — **FR / EN / NL**.

## ✅ 9. RGPD / mentions légales

**Décision :** à prévoir dès la conception (pas en rustine après coup) — données de santé collectées via le questionnaire de profil = catégorie sensible sous le RGPD, consentement explicite requis. Ce n'est pas vraiment une question à trancher avec Maxime (obligation légale, pas un choix produit) — à implémenter (politique de confidentialité + consentement explicite) avant de collecter de vraies données de santé.

## ✅ 10. Suivi / analytics

**Décision (choix technique de Tahar, pas un point à valider avec Maxime) :** Cloudflare Pages Analytics (gratuit, respectueux de la vie privée, pas de bannière cookie nécessaire) plutôt que Google Analytics.

## ✅ 11. Environnements dev / prod (Supabase)

**Décision :** deux projets Supabase séparés — un pour le développement, un pour la production. Chacun a sa propre base Postgres, son auth et son stockage fichiers, avec sa propre URL et sa propre clé publique ("anon").

- **Variables d'environnement :** gérées via `.env.development` / `.env.production`, chargés automatiquement par Vite selon le mode (dev vs build) — équivalent des profils Spring Boot (dev-create/dev-update/prod) de MS_Planner, mais plus simple puisqu'il n'y a pas de DDL auto-généré à gérer.
- **Évolution du schéma :** pour la V1, on modifie directement dans l'interface Supabase Studio du projet **dev**, on teste, puis on rejoue le même SQL dans le projet **prod** une fois validé. Pas besoin de la CLI Supabase + migrations versionnées tout de suite — un raffinement pour plus tard si le projet grossit ou devient collaboratif.
- **Sécurité (à garder en tête, pas à implémenter maintenant) :** la clé "anon" étant publique, toute la protection des données (un élève ne voit que ses propres séances, Maxime voit tous ses élèves) devra passer par les **Row Level Security policies** de Supabase — l'équivalent déclaratif de ce qu'était Spring Security sur MS_Planner.

**Pourquoi :** isoler complètement les tests/erreurs de dev des vraies données de Maxime et de ses élèves, sans ajouter d'outillage lourd (CLI, migrations) disproportionné pour un projet solo en V1.

## ✅ 12. Direction visuelle retenue

**Décision (validée par Maxime en personne) :** couleurs et formes du look **B · Dynamique Sportif**, mais avec la typographie du look **A · Épuré Premium**.

- Palette/formes de B : blocs diagonaux, coins plus arrondis, vert plus affirmé, ombres de carte plus marquées.
- Typographie de A : "Instrument Serif" pour les titres (au lieu de "Bricolage Grotesque"), "Inter" pour le corps de texte (inchangé, commun aux deux).

**Pourquoi :** Maxime voulait le côté énergique/dynamique de B sans perdre le raffinement du serif de A — un hybride assumé plutôt qu'un des 7 looks tel quel.

## ✅ 13. Programme de parrainage

**Décision (validée par Maxime) :** intégré dès la V1/VMP — un élève recommande Maxime à un proche pas encore client.

**Mise à jour (2026-10-07, décision Tahar) :** la construction est reportée en V2 — priorisation
interne, pas (encore) rediscutée avec Maxime. La décision de principe ci-dessus reste actée, c'est
l'ordre de construction qui change — à mentionner à Maxime à l'occasion puisqu'il avait validé un
calendrier V1 pour ça.

**Avantage :** pas encore défini (réduction ? séance d'initiation en groupe offerte ? autre ?) — Maxime préfère décider au cas par cas plutôt que fixer une règle automatique dès maintenant.

**Impact technique :** pas besoin d'automatiser une récompense (pas de code promo, pas de crédit de séance auto-appliqué) — l'appli a juste besoin de **tracer qui a recommandé qui** (un lien/code de parrainage suffit), Maxime gère la récompense lui-même au moment venu.

## ✅ 14. Priorité mobile-first sur la navigation

**Décision (insistance de Maxime) :** la majorité des visiteurs arriveront via smartphone — la navigation (menu, liens, boutons) doit être pensée pour le mobile en premier, pas juste "rendue responsive" en second plan. Placement des éléments interactifs pensé pour le pouce (zones facilement atteignables), pas seulement redimensionné depuis un layout desktop.

**Statut :** fait — `src/components/Nav.jsx` a maintenant un vrai menu mobile (bouton burger, panneau animé, actions principales en grandes zones tactiles).

## ✅ 15. Voix et ton du contenu

**Décision (Tahar, 2026-09-26) :** partout où le texte représente "la voix de Maxime" (consignes,
questionnaire, bandeaux, messages, appels à l'action), on écrit à la **première personne** ("je",
"moi") — jamais "Maxime" à la troisième personne. L'élève doit avoir l'impression que Maxime lui
parle directement, pas de lire une fiche produit à propos de lui.

**Tutoiement/vouvoiement :** vouvoiement sur les pages publiques (visiteur pas encore client — ton
plus posé pour un premier contact), tutoiement dans l'espace personnel une fois connecté (la relation
coach/élève est établie, plus proche/directe à l'usage). Convention déjà appliquée dans le formulaire
de contact ("Laissez-moi... je reviendrai vers vous") — à garder cohérente en l'étendant partout.

**Appliqué (2026-09-26) :** corrigé dans `Home.jsx`, `CoachingRunning.jsx`, `Contact.jsx`, `About.jsx`
(mentions "Maxime" à la 3e personne → "moi"/"je"). Les témoignages d'élèves (citations) restent à la
3e personne — c'est leur voix, pas celle de Maxime.

**Pourquoi :** renforce le positionnement "humain, personnalisé" — un vrai coach qui s'adresse
directement à chaque élève, pas une appli générique.

## ✅ 16. Identité visuelle réelle (logo de Maxime)

**Décision (2026-10-07) :** le vrai logo de Maxime (reçu avec son retour du 6 octobre) remplace le
texte "More Vitality" dans la nav/footer — logo complet (dégradé vert→marine) dans la nav, symbole
seul en favicon. Fichiers copiés sans espace dans `public/icons/` (`logo-full.svg`, `logo-mark.svg`).

**Couleurs :** `--color-brand-blue`/`--color-brand-green` alignés sur les couleurs exactes du
dégradé du logo (`#00172d` / `#48b66b`) plutôt que les tokens précédents (`#17385c` / `#279159`),
qui étaient proches mais pas identiques — maintenant qu'on a le vrai logo, tout matche pile.

**Police du logo (Gotham Medium) :** point ouvert au moment de cette décision — tranché depuis,
voir décision #21.

**Pourquoi :** premier retour de contenu réel du client payant — on remplace le placeholder visuel
par l'identité de marque réelle de Maxime.

## ✅ 21. Police du site : Montserrat (remplace Instrument Serif/Inter)

**Contexte :** Tahar avait reçu un fichier Gotham Medium (police du logo de Maxime) par un lien
tiers. Avant intégration, vérification du zip (`readme.html` inclus) : le fichier provenait de
fontsgeek.com, un site de piratage de polices. Gotham est une police payante (Hoefler & Co),
aucune distribution gratuite légitime n'existe. **Refusé d'intégrer le fichier** et supprimé
(copie de travail + zip original dans les téléchargements de Tahar) — Tahar n'était pas au
courant que le lien reçu menait vers une source piratée.

**Décision (2026-10-07) :** en attendant que Maxime tranche sur l'achat d'une licence Gotham
officielle, le site utilise **Montserrat** (police Google Fonts gratuite, caractère géométrique
proche de Gotham) — appliquée partout : titres, menu de navigation, boutons, texte courant.
Remplace à la fois Instrument Serif (titres) et Inter (texte courant) ; tailles et graisses
inchangées.

**Pourquoi :** rendu visuel cohérent avec l'esprit du logo sans attendre une décision d'achat côté
client, et sans risque légal (police piratée).

## ✅ 17. Vouvoiement généralisé (annule une partie de la décision #15)

**Décision (2026-10-07, demande de Maxime) :** vouvoiement partout, sans exception — y compris dans
l'espace personnel une fois connecté. Ça annule la partie tutoiement-en-espace-perso de la décision
#15 ; la partie "première personne / voix de Maxime" de #15 reste inchangée.

**Statut : ✅ fait partout (2026-10-07).** Audit complet du projet (`\btu\b|\bton\b|\bta\b|\btes\b`) :
seules 3 occurrences trouvées hors pages publiques — `EspaceEleve.jsx` (bandeau "Complète ton profil"),
`Login.jsx` (message d'erreur post-inscription) et `CoachSessions.jsx` (indication dans le formulaire
de création de séance, reformulée pour éviter l'adresse directe plutôt que mise en "vous" — c'est une
étiquette de champ, pas la voix de Maxime). `Sessions.jsx` n'en avait en réalité aucune. Plus aucun
tutoiement nulle part dans l'appli.

## ✅ 18. Nouvelle activité : Personnalisation textile

**Décision (2026-10-07, demande de Maxime) :** nouvelle rubrique séparée du coaching (entreprises,
clubs/associations sportives, événements, projets ponctuels, vêtements/textiles personnalisés),
petite page vitrine avec CTA « Vous avez un projet ? Parlons-en » → `/contact`. Pas de photos de
réalisations pour l'instant (Maxime n'en a pas encore fournies).

**Pourquoi :** Maxime développe cette activité en parallèle du coaching, veut la rendre visible sans
la mélanger avec l'offre sportive.

## ✅ 19. Restructuration "Coaching Santé" → "Coaching Sportif" (retour Maxime du 6 oct.)

**Décision (2026-10-07) :** renommage partout "Coaching Santé" → "Coaching Sportif" (connotation trop
médicale pour Maxime) ; éclatement en 4 pages à plat : `/coaching-sportif` (hub, texte commun) +
`/coaching-individuel`, `/coaching-duo`, `/coaching-groupe` (détail par format : pour qui/comment/
séances/où, + quand/tarif pour le format groupe). Localisations remplacées par les vraies adresses
(Centre B2M – Ixelles, Centre ASPIS – Woluwe-Saint-Lambert) avec lien Google Maps.

**Note technique :** la valeur DB `coaching_sante` (contrainte Postgres sur `student_profile`) n'est
pas renommée — seul le libellé affiché change. Pas de migration nécessaire.

**Pourquoi :** Maxime veut que les 3 formats soient compris sans qu'un visiteur ait besoin de lui
écrire pour comprendre la différence entre eux.

## ✅ 20. Notifications de messages non lus (commentaires de séance)

**Décision (2026-10-07) :** badge compteur (icône bulle) dans le nav, visible dès qu'au moins une
séance a un commentaire non lu. Premier essai (lien direct vers la liste des séances) jugé pas assez
clair à l'usage ("on ne comprend pas où aller") — remplacé le jour même par un petit menu déroulant au
clic sur la bulle, listant chaque séance concernée (nom/date), qui amène **directement** dessus,
déjà dépliée avec le fil de commentaires visible. Ouvrir une séance marque son fil comme lu
automatiquement (pas de bouton "marquer comme lu" séparé). Pas de notifications push PWA pour cette
version — juste le badge dans l'appli.

**Pourquoi :** répond à l'idée notée le 2026-09-26 ("notifications sur les commentaires de séance",
V2) — aujourd'hui tranchée en version "badge in-app", plus simple qu'une notification push et
suffisante puisque Maxime et ses élèves ouvrent déjà l'appli régulièrement.

## 💡 Idées à explorer (non tranchées, évolutions post-VMP)

**Messagerie entre partenaires** — permettre aux partenaires d'entraînement (même duo/groupe) de s'envoyer des messages ou partager des infos entre eux. Techniquement faisable (Supabase gère le temps réel nativement), mais plus lourd qu'un simple "voir ses partenaires" : historique, notifications, et il faudra prévoir au minimum un moyen de signaler/bloquer quelqu'un (des gens qui s'écrivent entre eux, même dans un cadre sportif, ça peut dériver).

**Dimension parrainage** — au-delà du simple partage de lien entre partenaires d'entraînement déjà noté plus bas, un vrai programme de parrainage : un élève existant recommande Maxime à un proche qui n'est pas encore client, avec potentiellement un avantage pour l'un et/ou l'autre (à définir avec Maxime — réduction, séance offerte, etc.). Sert autant l'acquisition de nouveaux clients que la fidélisation des élèves actuels.

**Espace annonces/actualités (V2)** — un espace où Maxime peut publier des infos pour ses élèves (et éventuellement les visiteurs du site) : événements sportifs, changements de cours/horaires, bons de réduction chez un partenaire (ex. un shop de running). Se rapproche de l'idée "notifications pour les élèves", elle aussi prévue pour la V2 plutôt que le VMP — pas encore tranché en détail, à revoir plus tard.


**Synchronisation avec Google Agenda / Apple Calendar / Outlook (2026-09-26)** — permettre à chacun de
retrouver ses séances dans son agenda habituel. Deux approches possibles :
- *Intégration API Google Calendar complète* — synchro bidirectionnelle, mais demande OAuth Google,
  un backend pour gérer/renouveler les tokens, des webhooks à entretenir. Lourd pour un gain marginal
  ici (Maxime gère tout depuis l'appli, pas besoin que l'inverse soit vrai).
- *Flux ICS abonnable (recommandé)* — un lien `.ics` par élève/coach à ajouter une fois dans son
  calendrier ("s'abonner à un calendrier depuis une URL"), qui se rafraîchit tout seul. Aucune clé API,
  aucun backend supplémentaire, marche pareil sur Google/Apple/Outlook. Solution privilégiée si on
  construit ça un jour.

**Toucher "réseaux sociaux" dans l'appli** — Maxime n'est pas forcément très actif personnellement sur les réseaux, mais ça n'empêche pas d'en tirer parti côté produit :
- Flux Instagram intégré sur la page d'accueil / témoignages (affiche automatiquement les derniers posts publics de Maxime, sans effort de sa part une fois configuré).
- Un visuel de partage généré automatiquement pour un élève qui atteint un objectif ("j'ai couru mon premier 10 km") — prêt à poster en story, sans que Maxime ait à créer le visuel lui-même.
- Système de parrainage/invitation : un élève invite un partenaire d'entraînement via un lien partageable (WhatsApp, SMS, réseaux) — à relier à la fonctionnalité "partenaires" ci-dessus.
- Preuve sociale sur le site : nombre d'élèves accompagnés, témoignages avec photo — renforce le côté "confiance" du positionnement de la marque.
