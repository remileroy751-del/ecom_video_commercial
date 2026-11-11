# EcomVideoStudio — v2.0.0 (version commerciale)
Logiciel desktop de montage vidéo pour Windows 10+ (Electron + FFmpeg).

## Version commerciale v2.0.0 — licence & activation
- **Essai gratuit de 14 jours** à partir de la première ouverture (date enregistrée sur le serveur avec l'identifiant anonyme de l'ordinateur : désinstaller puis réinstaller ne remet pas l'essai à zéro). Au 15ᵉ jour, un message demande de se connecter à internet et de saisir une clé.
- **Clés de 30 jours** (format `AJYC 58AS 8UJV`), à usage unique, liées à l'ordinateur qui les active ; si une licence court encore, les 30 jours de la nouvelle clé s'ajoutent à la suite. Boutique : voir `src/renderer.js` (constante `LINKS`).
- **Après expiration** (essai ou clé) : l'**export de vidéos** et le **Mode IA** sont bloqués avec un message clair, le lien d'achat et les liens de la communauté WhatsApp. Le reste du logiciel fonctionne (y compris hors ligne).
- **Hors ligne** : une licence active fonctionne jusqu'à 7 jours sans vérification en ligne ; ensuite une connexion internet est demandée. Un recul de l'horloge de l'ordinateur est détecté.
- **Pays obligatoire** à la première ouverture ; statistiques anonymes (pays, identifiant haché, version) envoyées à Supabase toutes les 2 minutes.
- **Liens WhatsApp** (chaîne + groupe) en bas du logiciel.
- Serveur : `ecom-supabase-schema.sql` + `ecom-admin.html` (livrés séparément, ne pas les mettre dans le dépôt de l'application). Paramètres Supabase : `src/license-config.js`.
- La compilation GitHub ne publie plus d'installateur en Release publique : récupérez-le dans l'onglet Actions → Artifacts. **Gardez le dépôt en privé.**

## Compilation GitHub
La compilation (workflow `.github/workflows/build-windows.yml`) réessaie automatiquement en cas d'erreur réseau temporaire (ex. erreur 504 au téléchargement d'Electron), utilise un cache des binaires Electron et un miroir de secours. Si elle échoue quand même, cliquez sur « Re-run failed jobs » dans l'onglet Actions.

## Nouveautés v1.10.0 / What's new
- **Aimant de la piste principale (V1)**, comme dans CapCut : quand on coupe une vidéo en deux et qu'on supprime la partie de gauche, la partie restante se colle automatiquement au début ; plus généralement, les photos et vidéos de V1 se collent à gauche sans laisser de trou (après suppression, déplacement, rognage ou ajout). **Activé par défaut** ; le bouton **🧲 Aimant** (juste après « ＋ Ajouter piste audio ») l'active ou le désactive, et ce réglage est enregistré avec le projet. Les textes, stickers et légendes ne sont jamais déplacés par l'aimant.
- **Ctrl+A** sélectionne tous les clips du montage (toutes les pistes). **Ctrl + clic** ajoute ou retire un clip de la sélection (sélection multiple). Glisser l'un des clips sélectionnés déplace tout le groupe d'un seul bloc ; **Suppr** supprime toute la sélection ; **K** coupe tous les clips sélectionnés situés sous la tête de lecture ; Ctrl+Z annule. Clic dans le vide = tout désélectionner.
- **Mode IA : script jusqu'à 1000 caractères** (au lieu de 900).
- **Mode IA : « Nommer votre vidéo »** — à l'étape 5, après « Créer la vidéo », une fenêtre propose un nom par défaut (modifiable) : **Valider** (ou Entrée) lance le montage automatique, **Annuler** revient en arrière. La vidéo est enregistrée sous ce nom dans `Vidéos\EcomVideoStudio\Exports` (jamais d'écrasement : « nom (2).mp4 » si le nom existe déjà) et le projet porte le même nom.

## Nouveautés v1.9.0 / What's new
- **Raccourcis clavier corrigés** (ils fonctionnent maintenant aussi sur un clavier **AZERTY**, quelle que soit la disposition) : **K** coupe le clip sélectionné à la tête de lecture, exactement comme le bouton « Couper » ; **Ctrl+Z** annule la dernière action (coupure, suppression, déplacement, effet…), plusieurs fois de suite — jusqu'à **100 actions** ; **Ctrl+Y** (ou Ctrl+Maj+Z) rétablit. Les raccourcis refonctionnent aussi juste après avoir modifié un réglage (cliquer ailleurs quitte le champ). **F5** = Actualiser.
- **Bouton Actualiser renforcé** : recrée tous les lecteurs, vérifie que les fichiers existent encore, attend que l'image apparaisse, relance automatiquement un lecteur bloqué et, si besoin, abandonne une copie d'aperçu défectueuse pour lire le fichier original. L'icône tourne pendant l'opération et le bouton ne reste jamais bloqué. Message clair si un fichier est introuvable.
- **Aperçu plus fluide et qui ne « plante » plus** : une erreur sur une piste n'arrête plus les autres, surveillance automatique (lecteur figé ou image noire → réparation automatique, puis actualisation complète en dernier recours), préchargement des clips suivants plus tôt, barre de lecture que l'on peut **faire glisser**, reprise automatique si le processus graphique ou la fenêtre plante (le projet en cours est rouvert), sauvegarde rapide après chaque action.
- **Échecs d'export corrigés** : sur les projets lourds, la première image pouvait mettre plus de 30 s à sortir pendant que le son était déjà encodé, et FFmpeg s'arrêtait (« Conversion failed! »). L'export utilise maintenant une file d'attente élargie, vérifie les fichiers et leurs durées avant de démarrer et, en cas d'incident, **réessaie automatiquement en mode sécurisé sans rien retirer** de votre montage. Le message d'erreur affiche désormais la vraie cause (et un journal complet est enregistré).
- **Mode IA / import audio : format MPEG** en plus du MP3 (voix off et musique) : `.mpeg`, `.mpg`, `.mpga`, `.mp2`, ainsi que `.wma` et `.opus`. Un fichier `.mpeg` qui ne contient que du son est reconnu comme audio ; une copie d'écoute mp3 légère est créée automatiquement (l'export utilise toujours le fichier original). Le montage manuel accepte aussi ces fichiers.

## Nouveautés v1.8.0 / What's new
- **Raccourcis clavier** : **Ctrl+Z** annule jusqu'aux 10 dernières actions (Ctrl+Y ou Ctrl+Maj+Z pour rétablir) ; **K** coupe le clip sélectionné à la tête de lecture (vidéo, audio ou photo).
- **Mode IA** (onglet sous Transitions, et bouton sur la page d'accueil) : crée un short vidéo 9:16 de 90 secondes maximum, étape par étape :
  1. script de 1000 caractères maximum lu par une voix off **féminine ou masculine** (voix Windows hors ligne, ou voix IA naturelles Gemini) — ou voix off enregistrée de 1 min 30 maximum ;
  2. musique de fond choisie sur l'ordinateur (ou aucune), répétée si besoin ;
  3. 4 images ou 4 vidéos au maximum (la première est répétée si la durée est plus courte que la voix off) ;
  4. style (8 modèles) et position des sous-titres ;
  5. « Créer la vidéo » : montage automatique avec transitions, progression de 0 à 100 %, puis « Terminé — Ouvrir le dossier ». La vidéo est enregistrée dans `Vidéos\EcomVideoStudio\Exports` et le projet dans la liste des projets.
- Voix Windows : pour le français, installez une voix française dans les paramètres Windows (Heure et langue > Voix) si elle n'est pas déjà présente ; sinon utilisez les voix IA Gemini (clé gratuite).

## Nouveautés v1.7.0 / What's new
- **Page d'accueil façon CapCut** : un grand bouton **Nouveau projet** en haut, les projets précédents en dessous (un clic pour les rouvrir, corbeille pour les supprimer). Bouton **Accueil** dans l'éditeur.
- **Dossier automatique** `Vidéos\EcomVideoStudio` (sous-dossiers `Projets` et `Exports`), créé au premier lancement qui suit l'installation. Les projets y sont enregistrés ; les exports proposent ce dossier par défaut.
- **Enregistrement automatique toutes les 15 secondes**, avec l'heure affichée en haut du projet ; le nom du projet se modifie directement en haut.
- **Mode clair / sombre** : bouton soleil/lune à côté du choix de langue (choix mémorisé).
- **Bouton Actualiser** (flèches circulaires, en haut) : réinitialise l'aperçu et tous les lecteurs comme si le projet était fermé puis rouvert (utile si l'aperçu devient noir). Reprise automatique en cas d'erreur de lecture et libération des décodeurs inutilisés.
- **Légendes sur 2 lignes** maximum, coupées automatiquement et ajustées pour ne plus déborder du cadre, quel que soit le format.

## Nouveautés v1.6.0 / What's new
- **Réglages de l'image** (panneau de droite, pour une vidéo ou une photo) : contraste, luminosité, netteté, saturation — visibles en direct et appliqués à l'export.
- **Légendes automatiques ajoutées au projet** : après « Générer les légendes », chaque légende devient un clip texte sur la nouvelle piste **CC** de la timeline (comme CapCut). Cliquez sur une légende pour modifier son texte, son style, sa position ou ses bords ; un bouton applique son style à toutes les légendes.
- **8 styles de légendes** à choisir **avant** de générer (police, couleur, contour, ombre, fond) + position (bas / milieu / haut).
- **Textes** : la taille ne dépend plus de la longueur du texte (changer le texte ne le rétrécit plus). La piste CC accueille les textes, légendes et stickers.
- Export rapide même avec des centaines de légendes.

## Nouveautés v1.5.0 / What's new
- **Pistes V1, V2, V3** : bouton **œil** (masquer / afficher la piste) et bouton **haut-parleur** (couper / activer le son). Les pistes audio A1 à A3 ont aussi leur haut-parleur. Une piste masquée ou muette est aussi ignorée à l'export.
- **Déplacement des clips à la souris** comme dans CapCut : glisser-déposer sur la même piste ou vers une autre, aimantation aux bords des autres clips et à la tête de lecture ; déposer un clip sur un autre l'**insère** avant ou après (les clips suivants sont décalés).
- **Médias** : bouton **corbeille** sur chaque média. Si le média est utilisé dans le montage, un message demande « Ce média se trouve dans le montage. Supprimer ? » (Oui / Non) ; en cas de Oui, il disparaît aussi du montage.
- **Lecture plus fluide** : préchargement du clip suivant (changement de clip sans coupure), synchronisation douce de l'image et du son, copies d'aperçu légères (540p) créées automatiquement pour les vidéos lourdes (l'export utilise toujours les originaux), interface allégée pendant la lecture.

## Nouveautés v1.4.0 / What's new
- **Installateur bilingue** : au lancement du setup, choix de la langue **Français / English**, puis installation. Le logiciel démarre dans la langue choisie ; le bouton **FR | EN** en haut permet d'en changer à tout moment.
- **Export en 480p, 720p ou 1080p** (dans le format 9:16, 16:9, 4:5 ou 1:1 du projet).
- **Onglet Audio supprimé** : l'onglet **Médias** importe vidéos, photos et audios (filtres Tous / Vidéos / Photos / Audios).
- **Transitions (23)** : fondu, fondu au noir, flash blanc, pousser/glisser (4 directions), volets, iris, zooms, rotation et **3D** (retournement, bascule, cube, cube vertical, porte). Deux clips côte à côte sur la même piste, sélection, clic sur la transition ; durée réglable à droite.
- **Textes (16 styles)** : polices, couleurs et effets différents ; ajout par clic ou glisser-déposer ; texte, police, couleurs, dégradé, contour, ombre/lueur, fond, espacement, taille, animation modifiables à droite et déplaçables dans l'aperçu.
- **Flèches ← →** : la tête de lecture avance/recule de 1 seconde (Maj + flèche : 1 image).
- **Légendes automatiques : 5 plateformes** — gratuites : **Groq**, **Google Gemini**, **Mistral Voxtral** ; payantes : **OpenAI**, **Deepgram**. Une clé API par plateforme.

## Nouveautés v1.3.0
- **Logo et icône** du logiciel : lettre E + pellicule rouge 3D (fenêtre, installeur, raccourcis).
- **Pied de page** : « Créé par Ecom Academy • Mail : ecom.academy.tg@gmail.com ».
- **Onglet Effets : 41 effets** (couleur, film, mouvement, ambiance dont flammes, étincelles, neige, pluie, confettis…). Sélectionnez un clip, cliquez sur un effet : il s'applique à tout le clip (jusqu'à 4 par clip). Recliquez pour le retirer.
- **Déplacement direct dans l'aperçu** : cliquez un clip ou un sticker dans l'aperçu, glissez-le pour le déplacer, tirez un coin pour changer sa taille.

## Nouveautés v1.2.0
- **Format du projet** sous l'aperçu : 9:16, 16:9, 4:5 ou 1:1 (l'aperçu et l'export suivent le format choisi).
- **Panneau de réglages à droite** : volume, taille, position, Ajuster/Remplir, durée et animation du clip sélectionné. L'aperçu est plus compact.
- **Aperçu immédiat** : un média ajouté s'affiche tout de suite dans l'aperçu (la tête de lecture se place sur le clip) et la timeline montre des vignettes.
- **Onglet Stickers** : 30 stickers animés (apparition « pop », mouvement en boucle, disparition) de 3 s, ajoutables par clic ou glisser-déposer sur V1 à V3, réglables et exportés dans la vidéo.

## Nouveautés v1.1.0
- **3 pistes vidéo superposables (V1, V2, V3)** : glissez des vidéos ou des photos depuis l'onglet Médias (ou depuis l'Explorateur Windows) sur une piste. V3 passe au-dessus de V2, qui passe au-dessus de V1.
- **3 pistes audio** : A1 par défaut ; A2 et A3 se créent en glissant un son sur la zone « nouvelle piste » ou avec le bouton **＋ Ajouter piste audio**.
- Réglages par clip : volume, taille, position (incrustation façon CapCut), rognage par les bords, coupe à la tête de lecture, déplacement entre pistes.
- **Légendes automatiques** : bouton « Générer les légendes » (onglet Légendes). Transcription en ligne (Whisper via Groq, clé gratuite, ou OpenAI), légendes éditables, incrustées dans l'export.
- Export MP4 H.264 (480p / 1080p) avec toutes les pistes mixées.

## Légendes : configuration (une seule fois)
1. Créez une clé API gratuite sur https://console.groq.com/keys (ou utilisez une clé OpenAI).
2. Onglet **Légendes** → collez la clé → **Enregistrer la clé**.
3. Choisissez la langue puis **Générer les légendes**.

## GitHub
Déposez tout le contenu à la racine du dépôt, puis poussez sur `main`. Le workflow `.github/workflows/build-windows.yml` compile l'installateur (publication GitHub d'electron-builder désactivée : `--publish never`) et le met dans l'artefact `EcomVideoStudio-Windows` et dans une Release.

## Raccourcis
Espace : lecture/pause • Suppr : supprimer le clip sélectionné • K : couper • Ctrl+A : tout sélectionner • Ctrl+clic : sélection multiple • Ctrl+Z : annuler • Ctrl+Y : rétablir • ← → : déplacer la tête de lecture • F5 : actualiser.

## Développement local
npm install
npm start
npm run dist
