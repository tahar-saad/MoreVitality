# More Vitality — TODO Espace personnel (élève + coach)

> ✅ **Reprise (2026-10-07) :** la refonte du site public (retour Maxime du 6 octobre) est bouclée —
> cette todo-list (espace perso élève/coach) reprend. Les deux demandes en plus de ce retour sont
> faites : le questionnaire de profil conditionnel (section 1 ci-dessous) et les notifications de
> messages non lus (badge nav + pastille par séance, cf. decisions.md #20).
>
> ✅ **Police du site (2026-10-07) :** Gotham (police du logo) reçue via un lien s'est révélée piratée
> — refusée et supprimée. Montserrat (gratuite) appliquée partout en attendant une éventuelle licence
> Gotham officielle (cf. decisions.md #21).
>
> ✅ **Déployé pour test (2026-10-07) :** build mis en ligne sur Cloudflare (URL de test, pas la prod
> OVH) pour que Tahar et Maxime puissent tester sur le vrai site.

## ✅ Rôles, routage et dashboard coach — testés en vrai (2026-10-07)

Compte coach de Maxime créé, connexion testée : un compte coach atterrit bien sur `/coach` avec la
liste des élèves (`CoachDashboard.jsx`), un compte élève normal atterrit sur `/espace`. Plusieurs
élèves de test apparaissent déjà dans la liste (y compris des inscriptions de test sans profil rempli
— badges "Profil à examiner" / "Profil pas encore rempli" fonctionnels).

**✅ Amélioration faite (2026-10-07) :** repli sur l'email quand le nom n'est pas renseigné (au lieu de
"Sans nom"), plus 4 badges de statut (Pas encore rempli / À examiner / Package à définir / Séance à
programmer) avec filtres cliquables en haut de la liste.

## 👉 Prochaine étape : les langues du site (cf. section ouverte plus bas)

**Ma progression (section 3) reportée en V2 (2026-10-20, décision Tahar)**, comme Témoignages et
Parrainage — même logique de priorisation. La table `progress_notes` existe déjà en base (note libre
+ date + `is_milestone` prévu) mais rien ne l'affiche ; à reprendre si une V2 se fait.

Ce fichier liste, page par page, ce qu'il reste à concevoir et construire pour que l'espace
personnel (élève ET coach) soit réellement fonctionnel — pas juste des cartes "à venir" comme
maintenant. Rien n'est codé pour l'instant : tu valides/ajustes chaque partie, on implémente ensuite.

Format de chaque section : **Constat** (où on en est) → **Ce qu'il faut** (fonctionnellement) →
**Données** (schéma à ajouter/modifier) → **Proposition(s)** (idées, à valider ou écarter).

---

## ✅ 0. Rôles et routage coach/élève — FAIT

`AuthContext` récupère maintenant `profiles.role`. Nouvelle route `/coach` (protégée par
`CoachRoute`), `ProtectedRoute` redirige un coach qui atterrit sur `/espace` vers `/coach`
automatiquement. Le lien "Mon espace" dans la nav pointe vers le bon endroit selon le rôle.
`CoachDashboard.jsx` liste les élèves (nom, objectif si rempli, badge "Profil à examiner").

**Pour tester :** aucun compte n'est coach par défaut. Passer un compte en coach se fait à la main,
une fois, dans Supabase Studio → Table Editor → `profiles` → changer `role` de `student` à `coach`.

## 0bis. Constat général (repris) : il manque un pan entier — l'espace coach

Aujourd'hui, `/espace` affiche la même page (`EspaceEleve.jsx`) peu importe qui se connecte. Il n'y a
**aucune interface pour Maxime**. Or, quasiment tout ce qu'un élève doit voir (séances, progression,
commentaires) est **écrit par Maxime** — sans espace coach, rien de tout ça ne peut exister en pratique.

**Ce qu'il faut :** router selon `profiles.role` — un élève voit l'espace élève, Maxime voit un espace
coach distinct (liste de ses élèves, et pour chacun : profil, séances, progression, groupe).

C'est le préalable à tout le reste ci-dessous — je le détaille en section 6, mais il faudra probablement
le construire **en premier**, avant même de finaliser le détail des séances/progression.

---

## ✅ 1. Le questionnaire de profil — fait, avec logique conditionnelle (2026-10-07)

**Statut (2026-10-07) :** `ProfileQuestionnaire.jsx` + table `student_profile` existent depuis un moment
(wizard mobile, une question à la fois) ; la section ci-dessous décrit l'état d'origine (conservée pour
l'historique). Ajouté aujourd'hui, suite au retour de Maxime (feedback 06 October.md, point 8) : une
1re question "Quel type d'accompagnement recherchez-vous ?" (Coaching sportif / Coaching running / Je
ne sais pas encore), qui détermine les questions suivantes — objectifs spécifiques par branche,
sous-étape "course" si running + "Préparer une course", question de format uniquement pour le sportif,
branche "indécis" qui saute direct aux questions communes. `ProfileQuestionnaire.jsx` passé en
vouvoiement à cette occasion (decisions.md #17) — `EspaceEleve.jsx`/`Sessions.jsx`/`CoachSessions.jsx`
restent en tutoiement, à traiter ensemble séparément. Nouvelles colonnes en base : `type_accompagnement`,
`course_distance`, `course_nom`, `course_date`, `course_deja_participe` (migration dans `schema.sql`,
exécutée). Fiche élève côté coach (`CoachStudentDetail.jsx`) affiche ces nouvelles réponses.

**À faire ensuite :** tester en vrai avec un compte élève de test (les 3 branches), puis vérifier
l'affichage côté fiche élève coach.

---

### Historique (état avant le 2026-10-07)

**Constat :** décidé avec Maxime que le questionnaire arrive *après* l'inscription, dans l'espace
personnel — mais aucune table, aucun formulaire n'existe pour l'instant. `profiles` n'a que
`full_name` et `role`.

**Ce qu'il faut :**
- Un formulaire (multi-étapes ou une seule page, à trancher) demandant : niveau sportif actuel,
  objectif, contraintes de temps/disponibilités, blessures/limitations éventuelles, préférence
  individuel/duo/groupe, préférence présentiel/en ligne.
- Rempli une fois par l'élève après inscription (mais modifiable ensuite s'il change d'avis).
- Maxime le consulte dans sa fiche élève et lui assigne un package "à la main" (pas d'automatisation,
  décision déjà actée).

**Données — nouvelle table `student_profile`** (une ligne par élève) :
`student_id, niveau, objectif, contraintes_temps, blessures, format_prefere (individuel/duo/groupe),
lieu_prefere (presentiel/en_ligne), rempli_le, vu_par_coach (bool),
package_mode (coaching_running/coaching_sante — assigné par Maxime),
package_format (solo/duo/groupe — assigné par Maxime)`

**Proposition :** tant que l'élève n'a pas rempli son questionnaire, un bandeau apparaît en haut de
son espace ("Complète ton profil pour que Maxime puisse te proposer le bon accompagnement") — incite
sans bloquer l'accès au reste.

---

## ✅ 2. Mes séances + Mon agenda — fait (fusionnées, avec commentaires et notifications)

**Statut (2026-10-07) :** construit depuis un moment, prolongé aujourd'hui avec les notifications de
messages non lus (decisions.md #20). Séances récurrentes, statuts (à venir/faite/annulée), fil de
commentaires élève↔coach, tout fonctionne et a été testé en vrai cette session. La section ci-dessous
décrit la proposition d'origine (gardée pour l'historique).

---

### Historique (état avant construction)

**Constat :** actuellement deux cartes séparées ("Mes séances" / "Mon agenda") mais **une seule table**
`sessions` derrière (avec une date). Séparer les deux visuellement pour deux vues différentes d'une
même donnée a du sens ; les traiter comme deux fonctionnalités distinctes à construire séparément n'en
a pas.

**Proposition :** une seule fonctionnalité "Séances", avec deux onglets/filtres : **à venir** (= ce
qu'on appelait l'agenda) et **passées** (= l'historique). Simplifie le code, évite la confusion.

**Ce qu'il faut, en plus :**
- Maxime doit pouvoir **créer** une séance pour un élève (date, contenu prévu) et la marquer
  **faite/annulée** après coup.
- Ta question sur les commentaires : chaque séance doit avoir un **fil de commentaires**, où l'élève
  ET Maxime peuvent écrire (ex. élève : "jambes lourdes aujourd'hui" / Maxime : "on lève le pied la
  semaine prochaine"). Le champ `notes` actuel dans `sessions` est trop limité (un seul champ, un seul
  auteur) — je propose de le remplacer par une vraie table de commentaires.

**Données :**
- `sessions` : garder `content` (ce qui est/était prévu), supprimer le champ `notes` isolé.
- Nouvelle table `session_comments` : `session_id, author_id, body, created_at` — plusieurs
  commentaires possibles, de n'importe quel auteur (élève ou coach).

**Proposition :** un bandeau "Ta prochaine séance : jeudi 25/09" en haut de l'espace élève, pour que
l'info la plus utile saute aux yeux sans avoir à cliquer.

---

## ⏸️ 3. Ma progression — reporté en V2 (2026-10-20, décision Tahar)

**Constat :** table `progress_notes` déjà présente (note libre + date), mais rien ne l'affiche encore,
et rien ne la relie à l'objectif du questionnaire.

**Ce qu'il faut :**
- Afficher l'objectif de l'élève (issu de `student_profile`) bien en évidence en haut de la page.
- En dessous, le fil chronologique des `progress_notes` écrites par Maxime (le plus récent en premier).
- Maxime doit pouvoir en ajouter une nouvelle depuis sa fiche élève.

**Propositions :**
- Un compteur simple et honnête, sans complexifier : *"12 séances réalisées depuis le début"* — motive
  sans nécessiter de graphique ou de métriques compliquées à calculer.
- Un système de **jalon** optionnel : Maxime peut marquer une note de progression comme "jalon"
  (ex. *"Premier 5 km réussi !"*), affiché avec un visuel un peu différent (mis en avant) — donne un
  vrai sentiment d'accomplissement sans construire un système de stats élaboré. Facile à ajouter
  (un simple booléen `is_milestone` sur `progress_notes`), facile à ignorer si tu ne veux pas.

---

## 4. Mes partenaires — ⏸️ mis de côté pour l'instant (2026-09-26)

**Constat :** les tables existent déjà (`training_groups`, `training_group_members`), l'UI n'est pas
construite. **Décision du 2026-09-26 : on met cette fonctionnalité de côté pour l'instant** (pas
seulement la messagerie déjà écartée — la fonctionnalité "partenaires" elle-même, y compris en lecture
seule). Retirée de l'ordre de construction ci-dessous ; à reprendre plus tard si ça redevient prioritaire.

---

## ⏸️ 5. Témoignages — reporté en V2 (2026-10-07, décision Tahar)

Nice-to-have, pas prioritaire pour la V1 — reste décrit ci-dessous pour mémoire, à reprendre si ça
redevient pertinent. Cohérent avec le fait que Maxime lui-même n'a pas cité "Témoignages" dans la
structure de site qu'il a décrite dans son retour du 6 octobre (cf. cahier des charges §6).

### Détail (ancienne proposition, pour quand on la reprendra)

**Constat :** rien n'existe. La page publique Témoignages n'a que des textes d'exemple.

**Ce qu'il faut, proposition de flux complet :**
1. Dans son espace personnel, l'élève a un bouton **"Partager mon expérience"**.
2. Formulaire simple : texte libre (situation de départ → objectif → évolution, comme prévu dans le
   brief), éventuellement une note/étoiles, éventuellement une photo.
3. **Ça ne s'affiche pas tout de suite publiquement** — ça part dans une file de modération. Un
   témoignage public non relu, ça peut être n'importe quoi (mauvais texte, contenu inapproprié, ou
   même une fausse note) : Maxime doit valider avant publication.
4. Maxime, dans son espace coach, voit les témoignages "en attente", peut les **approuver** ou
   **rejeter**.
5. La page publique Témoignages n'affiche que les témoignages **approuvés**.

**Données — nouvelle table `testimonials` :**
`student_id, text, rating (optionnel), photo_url (optionnel), status (pending/approved/rejected),
created_at, approved_at`

**Proposition (idée, pas obligatoire) :** après qu'un jalon de progression est atteint, suggérer
gentiment à l'élève de partager son expérience — augmente les chances d'avoir du vrai contenu, sans
forcer personne.

---

## 6. Espace Coach (Maxime) — ✅ routage, liste des élèves et fiche élève faits et testés

**Ce qui est fait :**
- ✅ Après connexion, si `profiles.role === 'coach'` → redirection vers `/coach` (testé en vrai,
  2026-10-07).
- ✅ **Liste des élèves**, avec badge "profil à examiner" / "profil pas encore rempli" (testé en vrai
  avec plusieurs comptes de test) — amélioration de la lisibilité notée en standby plus haut.
- ✅ **Fiche élève** (`/coach/eleves/:id`, 2026-09-26) — construite :
  - le questionnaire de profil rempli (niveau, objectif, format préféré, disponibilités, blessures) ;
  - package assigné (Mode + Format, deux listes déroulantes, comme décidé) ;
  - ses prochaines séances + possibilité de l'ajouter à une séance existante qui a encore de la place
    (dans les 60 prochains jours) ;
  - ouvrir la fiche marque automatiquement le profil comme "vu" (lève le badge côté liste des élèves).
  - *Pas encore fait ici :* sa progression (ajouter une note, marquer un jalon) — viendra avec la
    section 3 ; son groupe de partenaires — fonctionnalité mise de côté (section 4).
- **File de modération des témoignages** (approuver/rejeter) — pas encore construite.

---

## ⏸️ 7. Parrainage — reporté en V2 (2026-10-07, décision Tahar)

Nice-to-have, pas prioritaire pour la V1. **Point d'attention :** la décision #13 dans `decisions.md`
indique ce programme comme "validé par Maxime" pour la V1/VMP — ce report est un choix de
priorisation de Tahar, pas (encore) rediscuté avec Maxime. À lui mentionner à l'occasion. La colonne
`referred_by` existe déjà sur `student_profile` (inoffensive, non utilisée) — pas besoin de migration
pour la retirer, elle ne gêne rien en l'état.

**Proposition technique pour plus tard (2026-10-07) :** pas de récompense automatisée, juste besoin de
**tracer qui a recommandé qui**, via un lien de parrainage unique par élève (ex.
`morevitality.be/connexion?mode=inscription&ref=<id>`, affiché quelque part dans l'espace élève). Pas
besoin d'une table séparée.

**⚠️ `referred_by` est au mauvais endroit :** il est sur `student_profile`, qui n'existe que si/quand
l'élève remplit son questionnaire — souvent bien après l'inscription, parfois jamais. Le parrainage se
capture au moment de l'inscription, où seule `profiles` existe déjà (créée par le trigger
`handle_new_user`). Le bon réflexe : ajouter `referred_by` sur `profiles` plutôt, et le faire passer
par les métadonnées du signup (`supabase.auth.signUp({ options: { data: { referred_by } } })`) comme
`full_name` déjà aujourd'hui — même mécanisme, pas besoin d'inventer autre chose. Pour les inscriptions
Google/Facebook (redirection externe), passer par le `localStorage` le temps de l'aller-retour OAuth.
Côté coach : afficher "Parrainé par : [nom]" sur la fiche élève une fois ça en place.

---

## Proposition d'ordre de construction

1. ✅ **Rôles et routage coach/élève** (section 0/6) — fait et testé.
2. ✅ **Questionnaire de profil** (section 1) — fait, logique conditionnelle ajoutée le 2026-10-07.
3. ✅ **Séances + commentaires** (section 2) — fait.

*(Partenaires — section 4, Progression — section 3, Témoignages — section 5, et Parrainage —
section 7 — retirés de cet ordre, reportés en V2, cf. sections correspondantes ci-dessus.)*

**Reste pour le V1 (2026-10-20) :** police définitive (Gotham si licence Adobe valide, sinon
Montserrat reste), publication sur le domaine Combell, nettoyage de la base de test avant mise en
ligne réelle, message d'erreur technique dans `Login.jsx`.

**Langues (FR/NL/EN) — reportées en V2 (2026-10-20, décision Tahar/Maxime).** Le cahier des charges
notait une "piste à valider" ; la Belgique étant officiellement bilingue FR/NL, le besoin est réel,
mais traduire (même juste les pages publiques) est un vrai chantier de contenu à part entière — pas
fait pour le lancement du V1. À reprendre en priorité pour une V2.

---

## Questions ouvertes pour toi (à trancher avant ou pendant qu'on code)

- ~~Le package assigné par Maxime~~ ✅ **Tranché :** deux listes déroulantes — **Mode** (Coaching
  Running / Coaching Santé) et **Format** (Solo / Duo / Groupe). Champ(s) ajoutés à `student_profile`
  (ex. `package_mode`, `package_format`).
  - *Idée notée pour plus tard (V2, pas construite maintenant) :* Maxime pourrait un jour gérer
    lui-même ses forfaits/abonnements depuis son espace admin (créer/modifier ses propres offres,
    plutôt que ces valeurs codées en dur). Pas nécessaire pour la V1.
- ~~Les séances : qui les crée~~ ✅ **Tranché :** uniquement Maxime, via son espace coach. Pas de
  proposition de créneau côté élève.
  - ~~*Idée notée pour plus tard (V2)*~~ ✅ **Finalement construit dès la V1 (2026-09-26)** : option
    "Répéter cette séance" à la création (chaque semaine / toutes les 2 semaines / chaque mois,
    nombre d'occurrences ou date de fin) — génère des séances indépendantes (pas une série liée),
    chacune modifiable/annulable séparément ensuite.
- ~~Le questionnaire : une page ou un wizard~~ ✅ **Tranché :** wizard mobile, une question à la fois,
  format QCM (boutons à choix plutôt que champs texte libres quand c'est possible — niveau, objectif,
  format préféré, lieu préféré en QCM ; blessures/limitations en "oui/non" + texte libre seulement si
  "oui"), avec une barre de progression.
- ✅ **Tranché (2026-09-26, décision Tahar) :** option "Peu importe" ajoutée à la question "Tu préfères
  t'entraîner comment ?" du questionnaire — un élève peut vouloir mixer solo et groupe selon les
  semaines. Migration appliquée (`student_profile.format_prefere` accepte maintenant aussi
  `peu_importe`). À mentionner à Maxime pour info, pas bloquant.

## 💡 Idées notées en vrac (2026-09-26, pas encore tranchées ni construites)

- **Photo de profil pour l'élève** — permettre à l'élève d'ajouter une photo (avatar), visible par
  Maxime dans la liste des élèves et sa fiche. Demande d'utiliser Supabase Storage (déjà prévu dans la
  stack, pas encore utilisé) — à dimensionner plus tard (formats acceptés, taille max, recadrage ou pas).
- **Voir son propre profil côté élève** — aujourd'hui, une fois le questionnaire rempli, l'élève n'a
  nulle part où relire ce qu'il a répondu (niveau, objectif, disponibilités...) dans son espace
  personnel, à part rouvrir tout le wizard d'édition. Prévoir un endroit simple pour consulter (et
  modifier si besoin) ses réponses.

---

## ✅ Toutes les questions ouvertes sont tranchées — on passe à l'implémentation, dans l'ordre déjà proposé plus haut.
