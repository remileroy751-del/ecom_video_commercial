// Traduction de l'interface (français par défaut, anglais). Les textes d'origine sont en français.
// Le DOM est traduit automatiquement (nœuds texte + attributs title/placeholder/label), y compris les textes générés dynamiquement.
(function (root) {
  const EN = {
    /* --- barre du haut / général --- */
    "Professional Desktop Editor": "Professional Desktop Editor", "＋ Nouveau": "＋ New", "Ouvrir": "Open", "Sauvegarder": "Save", "Exporter": "Export",
    "Médias": "Media", "Texte": "Text", "Stickers": "Stickers", "Légendes": "Captions", "Effets": "Effects", "Transitions": "Transitions", "Paramètres": "Settings",
    "Importer": "Import", "Prêt": "Ready", "Créé par Ecom Academy • Mail : ecom.academy.tg@gmail.com": "Created by Ecom Academy • Mail: ecom.academy.tg@gmail.com", "💬 Chaîne WhatsApp": "💬 WhatsApp Channel", "👥 Groupe WhatsApp": "👥 WhatsApp Group", "🧲 Aimant": "🧲 Magnet", "Nommer votre vidéo": "Name your video", "Donnez un nom à votre vidéo, ou gardez le nom proposé, puis validez pour lancer le montage automatique.": "Give your video a name, or keep the suggested one, then confirm to start the automatic edit.", "✔ Valider": "✔ Confirm", "Annuler": "Cancel", "Langue / Language": "Language / Langue",
    "Créé par Ecom Academy • Mail : ecom.academy.tg@gmail.com": "Created by Ecom Academy • Mail: ecom.academy.tg@gmail.com",
    "Format de la vidéo": "Video format", "Importez des médias puis glissez-les sur la timeline": "Import media, then drag it onto the timeline",
    "✂ Couper": "✂ Split", "🗑 Supprimer": "🗑 Delete", "＋ Ajouter piste audio": "＋ Add audio track",
    "Déposez un son ici pour créer la piste audio {0}": "Drop a sound here to create audio track {0}",
    /* --- export --- */
    "Exporter la vidéo": "Export video", "Choisissez la qualité de sortie.": "Choose the output quality.", "Économique • Web & mobile": "Economy • Web & mobile",
    "HD • Réseaux sociaux": "HD • Social media", "Full HD • Haute qualité": "Full HD • High quality", "Incruster les légendes dans la vidéo": "Burn captions into the video",
    "Fermer": "Close", "Exporter MP4": "Export MP4", "Export en cours…": "Exporting…", "Export en cours… {0}%": "Exporting… {0}%",
    "✔ Export terminé :\n{0}": "✔ Export finished:\n{0}", "❌ Échec de l'export :\n{0}": "❌ Export failed:\n{0}", "Export terminé": "Export finished",
    "Format {0} — 480p : {1} • 720p : {2} • 1080p : {3}": "Format {0} — 480p: {1} • 720p: {2} • 1080p: {3}",
    "Ajoutez des clips à la timeline avant d'exporter.": "Add clips to the timeline before exporting.",
    /* --- médias --- */
    "Tous": "All", "Vidéos": "Videos", "Photos": "Photos", "Audios": "Audio", "Glissez vos fichiers ici": "Drop your files here", "ou cliquez sur « Importer »": "or click “Import”",
    "Importez ici vos vidéos, photos et sons. Glissez un média sur une piste de la timeline (V1 à V3 pour vidéos et photos, A1 à A3 pour les sons), ou double-cliquez pour l'ajouter.":
      "Import your videos, photos and sounds here. Drag a media file onto a timeline track (V1–V3 for videos and photos, A1–A3 for sounds), or double-click to add it.",
    "Ajouter à la timeline": "Add to timeline", "• sans son": "• no sound", "Photo": "Photo", "Audio": "Audio", "Vidéo": "Video", "Sticker": "Sticker",
    "Analyse de {0}…": "Analyzing {0}…", "{0} média(s) importé(s)": "{0} media file(s) imported", "Format non pris en charge : {0}": "Unsupported format: {0}",
    "« {0} » ajouté sur {1}": "“{0}” added on {1}", "Piste audio {0} ajoutée": "Audio track {0} added", "Maximum 3 pistes audio.": "Maximum 3 audio tracks.",
    "Un son se dépose sur une piste audio.": "A sound must be dropped on an audio track.", "Une photo ne peut pas être déposée sur une piste audio.": "A photo cannot be dropped on an audio track.",
    "Cette vidéo n'a pas de son.": "This video has no sound.", "Un sticker se dépose sur une piste vidéo (V1 à V3).": "A sticker must be dropped on a video track (V1–V3).",
    "Un texte se dépose sur une piste vidéo (V1 à V3).": "A text must be dropped on a video track (V1–V3).", "Chargement des stickers… réessayez dans un instant.": "Loading stickers… try again in a moment.",
    "Clip coupé": "Clip split", "Clip supprimé": "Clip deleted", "Sélectionnez un clip à supprimer.": "Select a clip to delete.",
    "Placez la tête de lecture à l'intérieur d'un clip pour le couper.": "Place the playhead inside a clip to split it.",
    /* --- réglages à droite --- */
    "Détails": "Details", "Projet": "Project", "Format :": "Format:", "Qualité max :": "Max quality:", "Durée :": "Duration:", "Clips :": "Clips:", "Durée": "Duration", "Début : {0} • Durée : {1}": "Start: {0} • Duration: {1}",
    "Cliquez sur un clip de la timeline pour afficher ses réglages ici : volume, taille, position, animation…": "Click a clip on the timeline to show its settings here: volume, size, position, animation…",
    "Le format se change sous l'aperçu (9:16, 16:9, 4:5, 1:1).": "The format is changed below the preview (9:16, 16:9, 4:5, 1:1).",
    "Glissez les bords du clip pour le rogner.": "Drag the clip edges to trim it.",
    "Volume": "Volume", "Taille": "Size", "Position X": "Position X", "Position Y": "Position Y", "Image": "Image", "Ajuster": "Fit", "Remplir": "Fill", "Recentrer": "Re-center",
    "Aucun effet. Ouvrez l'onglet Effets et cliquez sur un effet pour l'appliquer à tout ce clip.": "No effect. Open the Effects tab and click an effect to apply it to this whole clip.",
    "Retirer tous les effets": "Remove all effects", "Retirer": "Remove", "Transition d'entrée": "Entry transition",
    "Aucune transition. Ouvrez l'onglet Transitions et cliquez sur une transition.": "No transition. Open the Transitions tab and click a transition.",
    "Placez ce clip juste après un autre clip de la même piste pour ajouter une transition.": "Place this clip right after another clip on the same track to add a transition.",
    "Animation": "Animation", "Mouvement": "Movement", "Apparition et disparition en « pop »": "“Pop” appear and disappear", "Apparition « pop » + mouvement en boucle + disparition.": "“Pop” entrance + looping movement + exit.",
    /* --- texte --- */
    "＋ Ajouter un texte": "＋ Add a text", "Votre texte": "Your text", "Police": "Font", "Gras": "Bold", "Italique": "Italic", "Majuscules": "Uppercase", "Espacement des lettres": "Letter spacing",
    "Couleurs": "Colors", "Couleur": "Color", "Couleur 2": "Color 2", "Dégradé": "Gradient", "Opacité du texte": "Text opacity", "Contour": "Outline", "Épaisseur": "Thickness", "Couleur du contour": "Outline color",
    "Ombre / lueur": "Shadow / glow", "Aucun": "None", "Ombre douce": "Soft shadow", "Ombre portée": "Hard shadow", "Lueur": "Glow", "Intensité": "Intensity", "Fond": "Background",
    "Afficher un fond": "Show a background", "Couleur du fond": "Background color", "Opacité du fond": "Background opacity", "Arrondi": "Roundness",
    "Cliquez sur un style pour l'ajouter à la tête de lecture (3 s), ou glissez-le sur une piste vidéo. Modifiez le texte, la police, les couleurs, le contour, l'ombre et le fond dans le panneau de droite. Glissez le texte dans l'aperçu pour le déplacer, tirez un coin pour l'agrandir.":
      "Click a style to add it at the playhead (3 s), or drag it onto a video track. Edit the text, font, colors, outline, shadow and background in the right panel. Drag the text in the preview to move it, pull a corner to enlarge it.",
    "Classique": "Classic", "Jaune impact": "Impact yellow", "Néon rose": "Pink neon", "Néon bleu": "Blue neon", "Élégant doré": "Golden elegant", "Rétro": "Retro", "Cinéma": "Cinema",
    "Boîte noire": "Black box", "Boîte rouge": "Red box", "Bulle jaune": "Yellow bubble", "Contour seul": "Outline only", "Coucher de soleil": "Sunset", "Bande dessinée": "Comic",
    "Machine à écrire": "Typewriter", "Minimal": "Minimal", "Dégradé violet": "Purple gradient",
    /* --- stickers --- */
    "Cliquez sur un sticker pour l'ajouter à la tête de lecture (3 s, animé), ou glissez-le sur une piste vidéo. Réglez taille, position et animation dans le panneau de droite.":
      "Click a sticker to add it at the playhead (3 s, animated), or drag it onto a video track. Adjust size, position and animation in the right panel.",
    "Flèche droite": "Right arrow", "Flèche retour": "Back arrow", "Flèche bas": "Down arrow", "Flèche haut": "Up arrow", "Cercle rouge": "Red circle", "Clic": "Click", "Doigt à droite": "Finger right",
    "Doigt en bas": "Finger down", "Surpris": "Surprised", "Mort de rire": "Laughing", "Feu": "Fire", "Cœur": "Heart", "Pouce": "Thumbs up", "Cœur brisé": "Broken heart", "Applaudir": "Clap",
    "Cloche": "Bell", "Toucher": "Tap", "Exclamation": "Exclamation", "Étoiles": "Stars", "Valider": "Check", "Refuser": "Cross", "Glisser en haut": "Swipe up", "Curseur": "Cursor",
    /* --- animations --- */
    "Aucune boucle": "No loop", "Pulsation": "Pulse", "Battement": "Heartbeat", "Rebond": "Bounce", "Balancement": "Swing", "Tremblement": "Shake", "Rotation": "Rotation", "Flottement": "Float",
    "Va à droite": "Goes right", "Va à gauche": "Goes left", "Va en bas": "Goes down", "Va en haut": "Goes up",
    /* --- effets --- */
    "Film": "Film", "Ambiance": "Ambience",
    "Noir & blanc": "Black & white", "N&B contrasté": "High-contrast B&W", "Négatif": "Negative", "Sépia": "Sepia", "Chaud": "Warm", "Froid": "Cool", "Heure dorée": "Golden hour", "Nuit": "Night",
    "Violet": "Violet", "Matrix vert": "Matrix green", "Cyberpunk": "Cyberpunk", "Couleurs vives": "Vivid colors", "Désaturé": "Desaturated", "HDR": "HDR", "Lumineux": "Bright", "Dramatique": "Dramatic",
    "Délavé": "Faded", "Poster": "Poster", "Effet film": "Film look", "Bandes cinéma": "Cinema bars", "Vignette": "Vignette", "Vintage": "Vintage", "VHS rétro": "Retro VHS", "Glitch RVB": "RGB glitch",
    "Flou léger": "Light blur", "Flou fort": "Strong blur", "Netteté": "Sharpen", "Miroir": "Mirror", "Retourné": "Flipped", "Zoom pulsé": "Pulse zoom", "Fondu": "Fade", "Flammes": "Flames",
    "Étincelles": "Sparks", "Neige": "Snow", "Pluie": "Rain", "Lumière chaude": "Warm light", "Bokeh": "Bokeh", "Paillettes": "Glitter", "Brume": "Mist", "Confettis": "Confetti",
    "Sélectionnez d'abord un clip vidéo ou photo dans la timeline, puis cliquez sur l'effet.": "First select a video or photo clip on the timeline, then click the effect.",
    "Sélectionnez un clip vidéo ou photo dans la timeline, puis cliquez sur un effet : il s'applique à tout le clip. Recliquez pour le retirer. Jusqu'à 4 effets par clip (dont 2 d'ambiance).":
      "Select a video or photo clip on the timeline, then click an effect: it applies to the whole clip. Click again to remove it. Up to 4 effects per clip (2 ambience effects max).",
    "Effet « {0} » appliqué à « {1} »": "Effect “{0}” applied to “{1}”", "Effet « {0} » retiré": "Effect “{0}” removed",
    "Maximum 4 effets par clip : retirez-en un d'abord.": "Maximum 4 effects per clip: remove one first.", "Maximum 2 effets d'ambiance par clip.": "Maximum 2 ambience effects per clip.",
    /* --- transitions --- */
    "Fondus": "Fades", "Glissements": "Slides", "Formes": "Shapes", "Fondu au noir": "Dip to black", "Flash blanc": "White flash", "Pousser à gauche": "Push left", "Pousser à droite": "Push right",
    "Pousser vers le haut": "Push up", "Pousser vers le bas": "Push down", "Glisser à gauche": "Slide left", "Glisser à droite": "Slide right", "Glisser vers le haut": "Slide up", "Glisser vers le bas": "Slide down",
    "Volet vers la droite": "Wipe right", "Volet vers la gauche": "Wipe left", "Volet vers le bas": "Wipe down", "Iris (cercle)": "Iris (circle)", "Zoom avant": "Zoom in", "Zoom arrière": "Zoom out",
    "Retournement 3D": "3D flip", "Bascule 3D": "3D tilt", "Cube 3D": "3D cube", "Cube 3D vertical": "3D cube (vertical)", "Porte 3D": "3D door",
    "Placez deux clips côte à côte sur la même piste, sélectionnez l'un des deux puis cliquez sur une transition : elle se joue au raccord (la dernière image du premier clip sort pendant que le second entre). Recliquez pour la retirer. Survolez une transition pour voir son animation. Réglez sa durée dans le panneau de droite.":
      "Place two clips side by side on the same track, select one of them, then click a transition: it plays at the cut (the last frame of the first clip leaves while the second enters). Click again to remove it. Hover a transition to preview its animation. Set its duration in the right panel.",
    "Sélectionnez d'abord un clip vidéo ou photo dans la timeline, puis cliquez sur la transition.": "First select a video or photo clip on the timeline, then click the transition.",
    "Placez deux clips côte à côte sur la même piste pour ajouter une transition entre eux.": "Place two clips side by side on the same track to add a transition between them.",
    "Transition « {0} » ajoutée entre « {1} » et « {2} »": "Transition “{0}” added between “{1}” and “{2}”", "Transition « {0} » retirée": "Transition “{0}” removed",
    /* --- légendes --- */
    "Plateforme de transcription": "Transcription provider", "Gratuites": "Free", "Payantes": "Paid", "Gratuit": "Free", "Payant": "Paid", "Enregistrer la clé": "Save key",
    "Collez votre clé API ici": "Paste your API key here", "Clé enregistrée — laisser vide pour la conserver": "Key saved — leave empty to keep it",
    "La clé reste sur cet ordinateur (chiffrée par Windows). Chaque plateforme a sa propre clé.": "The key stays on this computer (encrypted by Windows). Each provider has its own key.",
    "Créez votre clé sur : {0}": "Create your key at: {0}", "— Très rapide, offre gratuite généreuse.": "— Very fast, generous free tier.",
    "— Offre gratuite via Google AI Studio. Horodatage approximatif.": "— Free tier via Google AI Studio. Approximate timestamps.",
    "— Offre gratuite « Experiment ». La langue est détectée automatiquement.": "— Free “Experiment” tier. The language is detected automatically.",
    "— Payant à l'usage, très précis.": "— Pay as you go, very accurate.", "— Payant à l'usage (crédit d'essai offert à l'inscription), très rapide.": "— Pay as you go (trial credit offered at sign-up), very fast.",
    "Langue parlée": "Spoken language", "Détection automatique": "Auto-detect", "Son à transcrire": "Sound to transcribe", "Tout l'audio de la timeline": "All audio on the timeline",
    "Piste audio 1": "Audio track 1", "Piste audio 2": "Audio track 2", "Piste audio 3": "Audio track 3", "Son des vidéos uniquement": "Videos' sound only",
    "✨ Générer les légendes": "✨ Generate captions", "Tout effacer": "Clear all", "{0} légendes": "{0} captions", "{0} légendes générées": "{0} captions generated",
    "Démarrage…": "Starting…", "Réglages enregistrés ✔": "Settings saved ✔", "Aucune clé enregistrée.": "No key saved.", "Aucune parole détectée.": "No speech detected.",
    "✔ Légendes générées. Vous pouvez les corriger ci-dessous.": "✔ Captions generated. You can edit them below.",
    "Aucun son à transcrire : ajoutez une voix off ou une vidéo avec du son sur la timeline.": "No sound to transcribe: add a voice-over or a video with sound to the timeline.",
    "Enregistrez d'abord votre clé API pour cette plateforme (voir ci-dessus).": "First save your API key for this provider (see above).",
    "Remplacer les légendes existantes ?": "Replace the existing captions?", "Supprimer": "Delete",
    /* --- pistes, suppression de médias, lecture --- */
    "Afficher la piste": "Show track", "Masquer la piste": "Hide track", "Activer le son de la piste": "Unmute track", "Couper le son de la piste": "Mute track",
    "Piste {0} masquée": "Track {0} hidden", "Piste {0} affichée": "Track {0} shown", "Son de la piste {0} coupé": "Track {0} muted", "Son de la piste {0} activé": "Track {0} unmuted",
    "Supprimer ce média du projet": "Delete this media from the project", "Supprimer le média": "Delete media", "Ce média se trouve dans le montage. Supprimer ?": "This media is used in the edit. Delete it?",
    "Oui": "Yes", "Non": "No", "Média supprimé": "Media deleted", "Optimisation de la lecture de « {0} »…": "Optimizing playback of “{0}”…", "Lecture optimisée": "Playback optimized",
    /* --- v1.6 : réglages d'image, légendes en clips --- */
    "Réglages de l'image": "Image adjustments", "Contraste": "Contrast", "Luminosité": "Brightness", "Netteté": "Sharpen", "Saturation": "Saturation",
    "Réinitialiser les réglages": "Reset adjustments", "Légende": "Caption", "Appliquer ce style à toutes les légendes": "Apply this style to all captions",
    "Modifiez le texte ci-dessus ; glissez les bords du clip pour ajuster son début et sa fin.": "Edit the text above; drag the clip edges to adjust its start and end.",
    "1. Style des légendes": "1. Caption style", "Position": "Position", "En bas": "Bottom", "Au milieu": "Middle", "En haut": "Top",
    "2. Plateforme de transcription": "2. Transcription provider", "3. Langue et son": "3. Language and sound",
    "Jaune sous-titre": "Yellow subtitle", "BD bleue": "Comic blue", "Doré": "Golden",
    "{0} légendes dans le projet (piste CC)": "{0} captions in the project (CC track)", "Appliquer le style choisi aux légendes existantes": "Apply the chosen style to existing captions",
    "Supprimer toutes les légendes": "Delete all captions", "Légendes supprimées": "Captions deleted",
    "Les légendes sont ajoutées automatiquement à la piste CC de la timeline. Cliquez sur une légende pour modifier son texte, son style ou sa durée.": "Captions are added automatically to the CC track of the timeline. Click a caption to edit its text, style or duration.",
    "Création des légendes… {0}/{1}": "Creating captions… {0}/{1}", "{0} légendes ajoutées au projet": "{0} captions added to the project", "Style appliqué à {0} légendes": "Style applied to {0} captions",
    "✔ Légendes ajoutées à la piste CC. Cliquez sur une légende dans la timeline pour la modifier.": "✔ Captions added to the CC track. Click a caption on the timeline to edit it.",
    "Cette piste est réservée aux textes et aux légendes.": "This track is reserved for texts and captions.",
    /* --- v1.7 : accueil, projets, thème, actualisation --- */
    "Accueil": "Home", "Retour à l'accueil": "Back to home", "Nom du projet": "Project name", "Mode clair / sombre": "Light / dark mode",
    "Actualiser le projet (réaffiche tout l'aperçu)": "Refresh the project (re-displays the whole preview)", "Passer en mode sombre": "Switch to dark mode", "Passer en mode clair": "Switch to light mode",
    "Nouveau projet": "New project", "Commencer un nouveau montage vidéo": "Start a new video edit", "Projets récents": "Recent projects", "Ouvrir un fichier": "Open a file", "Ouvrir le dossier": "Open the folder",
    "Aucun projet pour le moment. Cliquez sur « Nouveau projet » pour commencer.": "No projects yet. Click “New project” to get started.", "Dossier : {0}": "Folder: {0}",
    "Supprimer le projet": "Delete project", "Voulez-vous vraiment supprimer ce projet ? Les vidéos d'origine ne sont pas supprimées.": "Do you really want to delete this project? The original videos are not deleted.",
    "Enregistrement automatique : {0}": "Auto-saved: {0}", "Échec de l'enregistrement du projet.": "Failed to save the project.", "Projet introuvable ou illisible.": "Project not found or unreadable.",
    "Nouveau projet créé": "New project created", "Projet actualisé": "Project refreshed", "Chargement des textes… {0}/{1}": "Loading texts… {0}/{1}",
    "Impossible de lire ce média dans l'aperçu : essayez le bouton Actualiser.": "Cannot play this media in the preview: try the Refresh button.",
    /* --- v1.8 : annulation, Mode IA --- */
    "Rien à annuler": "Nothing to undo", "Rien à rétablir": "Nothing to redo", "Action rétablie": "Action redone",
    "Mode IA": "AI Mode", "Crée des short vidéos automatiques": "Create automatic short videos", "← Retour au montage manuel": "← Back to manual editing",
    "✨ Mode IA — Short vidéo automatique": "✨ AI Mode — Automatic short video", "9:16 • 90 s max": "9:16 • 90 s max", "Précédent": "Previous", "Suivant": "Next", "Suivant →": "Next →", "✨ Créer la vidéo": "✨ Create the video",
    "Voix off": "Voice-over", "Musique": "Music", "Images / vidéos": "Images / videos", "Sous-titres": "Subtitles", "Création": "Creation",
    "Étape 1 — Votre voix off": "Step 1 — Your voice-over", "Écrivez un script (1000 caractères maximum) et choisissez une voix, ou ajoutez votre propre voix off (1 min 30 maximum).": "Write a script (1000 characters maximum) and choose a voice, or add your own voice-over (1 min 30 maximum).",
    "✍️ Écrire un script": "✍️ Write a script", "🎙️ Ajouter ma voix off": "🎙️ Add my voice-over", "Collez ou écrivez ici le texte de votre short vidéo…": "Paste or write the text of your short video here…",
    "Langue de la voix": "Voice language", "👩 Voix féminine": "👩 Female voice", "Voix off féminine": "Female voice-over", "👨 Voix masculine": "👨 Male voice", "Voix off masculine": "Male voice-over", "Moteur de voix": "Voice engine",
    "Voix du logiciel (Windows, hors ligne, gratuit)": "Built-in voices (Windows, offline, free)", "Voix IA naturelles (Gemini, en ligne, gratuit)": "Natural AI voices (Gemini, online, free)",
    "▶ Écouter un extrait": "▶ Listen to a sample", "📂 Choisir un fichier audio…": "📂 Choose an audio file…", "Maximum 1 min 30 : la voix sera coupée à 1:30.": "Maximum 1 min 30: the voice will be cut at 1:30.",
    "Langue parlée": "Spoken language", "Les sous-titres d'une voix enregistrée utilisent la transcription en ligne (clé API de l'onglet Légendes du montage manuel).": "Subtitles for a recorded voice use online transcription (API key from the Captions tab of the manual editor).",
    "Étape 2 — Musique de fond": "Step 2 — Background music", "Choisissez une musique enregistrée sur votre ordinateur, ou aucune musique.": "Choose a music file saved on your computer, or no music.",
    "🚫 Aucune musique": "🚫 No music", "Voix off seule": "Voice-over only", "🎵 Choisir une musique": "🎵 Choose a music", "Depuis cet ordinateur (mp3, wav, m4a…)": "From this computer (mp3, wav, m4a…)", "Depuis cet ordinateur (mp3, mpeg, wav, m4a…)": "From this computer (mp3, mpeg, wav, m4a…)", "Formats : mp3, mpeg, wav, m4a, aac, ogg, flac": "Formats: mp3, mpeg, wav, m4a, aac, ogg, flac",
    "Volume de la musique :": "Music volume:", "Si la musique est plus courte que la vidéo, elle est répétée automatiquement.": "If the music is shorter than the video, it is repeated automatically.",
    "Étape 3 — Images ou vidéos": "Step 3 — Images or videos", "Choisissez 4 images ou 4 vidéos au maximum : le logiciel les assemble automatiquement. Si les vidéos sont plus courtes que la voix off, la première est répétée.": "Choose up to 4 images or 4 videos: the software assembles them automatically. If the videos are shorter than the voice-over, the first one is repeated.",
    "📂 Ajouter des images / vidéos…": "📂 Add images / videos…",
    "Étape 4 — Sous-titres": "Step 4 — Subtitles", "Choisissez le style et la position des légendes automatiques (jusqu'à 2 lignes).": "Choose the style and position of the automatic captions (up to 2 lines).", "Ajouter des sous-titres automatiques": "Add automatic subtitles",
    "Étape 5 — Création de la vidéo": "Step 5 — Creating the video", "Vérifiez le résumé puis lancez la création.": "Check the summary, then start the creation.",
    "Format": "Format", "9:16 (vertical)": "9:16 (vertical)", "Qualité": "Quality", "1080p (Full HD)": "1080p (Full HD)", "720p (plus rapide)": "720p (faster)",
    "Durée maximale : 90 secondes. Le montage se fait tout seul : voix off, images, musique, transitions et sous-titres, puis la vidéo est enregistrée dans le dossier Exports.": "Maximum duration: 90 seconds. The edit is done automatically: voice-over, images, music, transitions and subtitles, then the video is saved in the Exports folder.",
    "Terminé !": "Done!", "📁 Ouvrir le dossier": "📁 Open the folder", "✏️ Ouvrir dans l'éditeur": "✏️ Open in the editor", "➕ Créer une autre vidéo": "➕ Create another video",
    "Création en cours… patientez jusqu'à la fin.": "Creation in progress… please wait until it finishes.",
    "Collez votre clé API Google Gemini ici": "Paste your Google Gemini API key here", "Créez une clé gratuite sur aistudio.google.com/apikey": "Create a free key at aistudio.google.com/apikey",
    /* --- projets --- */
    "Projet enregistré : {0}": "Project saved: {0}", "Projet chargé": "Project loaded", "Projet illisible ou annulé.": "Project unreadable or cancelled.",
    "Créer un nouveau projet ? Les modifications non enregistrées seront perdues.": "Create a new project? Unsaved changes will be lost."
  };
  let lang = "fr";
  const origText = new WeakMap(), origAttr = new WeakMap();
  const pats = [];
  Object.keys(EN).forEach(k => {
    if (k.indexOf("{") < 0) return;
    const re = new RegExp("^" + k.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{\d\}/g, "([\\s\\S]*?)") + "$");
    pats.push([re, EN[k]]);
  });
  function t(s) {
    if (lang === "fr" || !s) return s;
    const m0 = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), lead = m0[1], body = m0[2], trail = m0[3];
    if (!body || !/[A-Za-zÀ-ÿ]{2}/.test(body)) return s;
    if (Object.prototype.hasOwnProperty.call(EN, body)) return lead + EN[body] + trail;
    for (let i = 0; i < pats.length; i++) {
      const m = pats[i][0].exec(body);
      if (m) return lead + pats[i][1].replace(/\{(\d)\}/g, (_, n) => (m[+n + 1] != null ? m[+n + 1] : "")) + trail;
    }
    return s;
  }
  const ATTRS = ["title", "placeholder", "label"];
  function doText(n) {
    const v = n.nodeValue, rec = origText.get(n);
    if (rec && rec.last === v) return;
    const r = t(v);
    if (r !== v) { origText.set(n, { fr: v, last: r }); n.nodeValue = r; }
  }
  function doAttrs(el) {
    ATTRS.forEach(a => {
      if (!el.hasAttribute || !el.hasAttribute(a)) return;
      const v = el.getAttribute(a); let rec = origAttr.get(el); if (!rec) { rec = {}; origAttr.set(el, rec); }
      if (rec[a] && rec[a].last === v) return;
      const r = t(v);
      if (r !== v) { rec[a] = { fr: v, last: r }; el.setAttribute(a, r); }
    });
  }
  function walk(node) {
    if (node.nodeType === 3) { doText(node); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") { doAttrs(node); return; }
    doAttrs(node);
    for (let c = node.firstChild; c; c = c.nextSibling) walk(c);
  }
  function restore(node) {
    if (node.nodeType === 3) { const r = origText.get(node); if (r && node.nodeValue === r.last) node.nodeValue = r.fr; origText.delete(node); return; }
    if (node.nodeType !== 1) return;
    const rec = origAttr.get(node);
    if (rec) { Object.keys(rec).forEach(a => { if (node.getAttribute(a) === rec[a].last) node.setAttribute(a, rec[a].fr); }); origAttr.delete(node); }
    for (let c = node.firstChild; c; c = c.nextSibling) restore(c);
  }
  let obs = null;
  function setLang(l) {
    l = l === "en" ? "en" : "fr";
    if (l === lang && (obs || l === "fr")) { if (l === "en") walk(document.body); return; }
    if (obs) { obs.disconnect(); obs = null; }
    if (lang === "en") restore(document.body);
    lang = l;
    if (lang === "en") {
      walk(document.body);
      obs = new MutationObserver(recs => {
        recs.forEach(r => {
          if (r.type === "characterData") doText(r.target);
          else if (r.type === "attributes") doAttrs(r.target);
          else r.addedNodes.forEach(walk);
        });
      });
      obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    }
  }
  const api = { t, setLang, lang: () => lang, EN };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.EcomI18n = api;
})(typeof window !== "undefined" ? window : this);
