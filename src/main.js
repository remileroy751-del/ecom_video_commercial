const { app, BrowserWindow, ipcMain, dialog, safeStorage, Menu, shell } = require("electron");
const path = require("path"), fs = require("fs"), os = require("os"), crypto = require("crypto");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static").replace("app.asar", "app.asar.unpacked");
const { buildExportArgs, buildTranscribeArgs, buildAss, resolutionFor } = require("./ffgraph");

// Garde le processus graphique actif même après un incident (sinon Chromium bascule en rendu logiciel et l'aperçu vidéo reste noir)
try { app.commandLine.appendSwitch("disable-gpu-process-crash-limit"); app.disableDomainBlockingFor3DAPIs(); } catch (e) {}
let win, crashed = false;
function createWindow() {
  win = new BrowserWindow({
    width: 1500, height: 930, minWidth: 1100, minHeight: 700, backgroundColor: "#090b10",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
    title: "EcomVideoStudio"
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "index.html"));
  // Si la page d'interface plante, on la recharge et l'interface rouvre automatiquement le projet en cours
  win.webContents.on("render-process-gone", (_, d) => {
    if (d && d.reason === "clean-exit") return;
    crashed = true; setTimeout(() => { try { win && !win.isDestroyed() && win.webContents.reload(); } catch (e) {} }, 400);
  });
}
// Si le processus graphique redémarre, l'interface réinitialise l'aperçu vidéo
app.on("child-process-gone", (_, d) => { if (d && d.type === "GPU") setTimeout(() => send("preview-reset", "gpu"), 600); });
ipcMain.handle("consume-crash", () => { const c = crashed; crashed = false; return c; });
// ---------- Dossier de travail (Vidéos\\EcomVideoStudio : Projets + Exports), créé automatiquement ----------
function baseDir() {
  let v; try { v = app.getPath("videos"); } catch (e) { v = path.join(app.getPath("home"), "Videos"); }
  return path.join(v, "EcomVideoStudio");
}
const projDir = () => path.join(baseDir(), "Projets"), exportDir = () => path.join(baseDir(), "Exports");
function ensureFolders() { [baseDir(), projDir(), exportDir()].forEach(d => { try { fs.mkdirSync(d, { recursive: true }); } catch (e) {} }); }
app.whenReady().then(() => { Menu.setApplicationMenu(null); ensureFolders(); createWindow(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

const send = (ch, d) => { try { win && win.webContents.send(ch, d); } catch (e) {} };

// ---------- FFmpeg ----------
const ERR_RE = /(error|invalid|failed|cannot|unable|no such|not found|too many|does not|not supported|unsupported|permission|denied|matches no streams|out of memory|allocate)/i;
function runFF(args, opts = {}) {
  return new Promise(resolve => {
    let tail = "", full = "", rest = "";
    const errs = [];
    let p;
    try { p = spawn(ffmpegPath, args, { cwd: opts.cwd, windowsHide: true }); }
    catch (e) { return resolve({ code: -1, stderr: String(e.message), errs: [String(e.message)], full: String(e.message) }); }
    p.stderr.on("data", d => {
      const s = String(d); tail = (tail + s).slice(-6000); full = (full + s).slice(-200000);
      rest += s; const lines = rest.split(/[\r\n]+/); rest = lines.pop();
      lines.forEach(l => { if (ERR_RE.test(l) && !/^\[(libx264|aac)/.test(l) && errs.indexOf(l) < 0) { errs.push(l.trim().slice(0, 300)); if (errs.length > 40) errs.shift(); } });
      if (opts.onData) opts.onData(s);
    });
    p.on("error", e => resolve({ code: -1, stderr: e.message, errs: [e.message], full: e.message }));
    p.on("close", code => resolve({ code, stderr: tail, errs, full }));
  });
}

function probe(file) {
  return runFF(["-hide_banner", "-i", file]).then(r => {
    const s = r.stderr;
    const d = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(s);
    const duration = d ? (+d[1]) * 3600 + (+d[2]) * 60 + parseFloat(d[3]) : 0;
    const hasVideo = /Stream #.*Video:/.test(s);
    const hasAudio = /Stream #.*Audio:/.test(s);
    const sz = /Video:.*?(\d{2,5})x(\d{2,5})/.exec(s);
    const rot = /rotation of (-?\d+(?:\.\d+)?) degrees/.exec(s);
    let width = sz ? +sz[1] : 0, height = sz ? +sz[2] : 0;
    if (rot && Math.abs(Math.round(+rot[1])) % 180 === 90) { const t = width; width = height; height = t; } // vidéos de téléphone pivotées
    return { duration, hasVideo, hasAudio, width, height };
  });
}

// ---------- Projets / fichiers ----------
const EXT = { video: ["mp4", "mov", "mkv", "avi", "webm", "m4v", "wmv", "flv", "mpeg", "mpg", "3gp"], image: ["jpg", "jpeg", "png", "webp", "bmp", "gif"], audio: ["mp3", "mpeg", "mpga", "mp2", "mpg", "wav", "aac", "m4a", "ogg", "opus", "flac", "wma"] };
ipcMain.handle("open-media", async (_, kind) => {
  if (kind === "audio" || kind === "visual") {
    const filters = [{ name: M("media"), extensions: kind === "audio" ? EXT.audio : EXT.video.concat(EXT.image) }];
    if (kind === "audio") filters.push({ name: M("allFiles"), extensions: ["*"] });
    const r = await dialog.showOpenDialog(win, { properties: kind === "visual" ? ["openFile", "multiSelections"] : ["openFile"], filters });
    return r.canceled ? [] : r.filePaths;
  }
  const r = await dialog.showOpenDialog(win, {
    properties: ["openFile", "multiSelections"],
    filters: [{ name: M("media"), extensions: ["mp4", "mov", "mkv", "avi", "webm", "m4v", "wmv", "flv", "mpeg", "mpg", "3gp", "jpg", "jpeg", "png", "webp", "bmp", "gif"].concat(EXT.audio) }, { name: M("allFiles"), extensions: ["*"] }]
  });
  return r.canceled ? [] : r.filePaths;
});
ipcMain.handle("probe", (_, f) => probe(f));
// Proxys d'aperçu (540p, image clé toutes les 15 images) : lecture fluide et déplacement instantané dans les vidéos lourdes
let proxyChain = Promise.resolve();
async function makeProxy(file) {
  const st = fs.statSync(file);
  const h = crypto.createHash("sha1").update(file + "|" + st.size + "|" + st.mtimeMs).digest("hex").slice(0, 16);
  const dir = path.join(app.getPath("userData"), "proxies"), out = path.join(dir, h + ".mp4");
  if (fs.existsSync(out) && fs.statSync(out).size > 1000) return out;
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, h + ".part.mp4");
  const r = await runFF(["-y", "-hide_banner", "-i", file, "-vf", "scale=w='if(gt(iw,ih),-2,540)':h='if(gt(iw,ih),540,-2)'", "-c:v", "libx264", "-preset", "veryfast", "-crf", "27",
    "-g", "15", "-keyint_min", "15", "-sc_threshold", "0", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", tmp]);
  if (r.code !== 0) { try { fs.unlinkSync(tmp); } catch (e) {} return ""; }
  fs.renameSync(tmp, out); return out;
}
async function makeAudioProxy(file) {
  const st = fs.statSync(file);
  const h = crypto.createHash("sha1").update(file + "|" + st.size + "|" + st.mtimeMs + "|a").digest("hex").slice(0, 16);
  const dir = path.join(app.getPath("userData"), "proxies"), out = path.join(dir, h + ".mp3");
  if (fs.existsSync(out) && fs.statSync(out).size > 1000) return out;
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, h + ".part.mp3");
  const r = await runFF(["-y", "-hide_banner", "-i", file, "-vn", "-map", "0:a:0", "-c:a", "libmp3lame", "-b:a", "160k", "-ar", "44100", "-f", "mp3", tmp]);
  if (r.code !== 0) { try { fs.unlinkSync(tmp); } catch (e) {} return ""; }
  fs.renameSync(tmp, out); return out;
}
ipcMain.handle("make-audio-proxy", (_, file) => { proxyChain = proxyChain.then(() => makeAudioProxy(file)).catch(() => ""); return proxyChain; });
ipcMain.handle("files-exist", (_, list) => (Array.isArray(list) ? list : []).map(f => { try { return fs.existsSync(f); } catch (e) { return false; } }));
ipcMain.handle("make-proxy", (_, file) => { proxyChain = proxyChain.then(() => makeProxy(file)).catch(() => ""); return proxyChain; });
ipcMain.handle("sticker-dir", () => path.join(__dirname, "stickers"));
ipcMain.handle("fx-dir", () => path.join(__dirname, "effects"));
ipcMain.handle("thumb", (_, file, dur) => new Promise(resolve => {
  const chunks = [];
  const ss = Math.max(0, Math.min(0.5, (dur || 1) / 2));
  let p;
  try { p = spawn(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-ss", String(ss), "-i", file, "-frames:v", "1", "-vf", "scale=-2:72", "-f", "image2pipe", "-vcodec", "mjpeg", "-q:v", "6", "pipe:1"], { windowsHide: true }); }
  catch (e) { return resolve(""); }
  p.stdout.on("data", d => chunks.push(d));
  p.on("error", () => resolve(""));
  p.on("close", () => { const b = Buffer.concat(chunks); resolve(b.length ? "data:image/jpeg;base64," + b.toString("base64") : ""); });
}));
const pid = id => String(id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60);
function writeAtomic(f, data) { const t = f + ".tmp"; fs.writeFileSync(t, data); fs.renameSync(t, f); }
function writeProject(id, meta, json) {
  id = pid(id); if (!id) return false;
  ensureFolders();
  writeAtomic(path.join(projDir(), id + ".ecomproj"), json);
  writeAtomic(path.join(projDir(), id + ".meta"), JSON.stringify(Object.assign({}, meta, { id })));
  return true;
}
ipcMain.handle("proj-list", () => {
  ensureFolders();
  const out = [];
  try { fs.readdirSync(projDir()).filter(f => f.endsWith(".meta")).forEach(f => { try { out.push(JSON.parse(fs.readFileSync(path.join(projDir(), f), "utf8"))); } catch (e) {} }); } catch (e) {}
  return out.sort((a, b) => (b.updated || 0) - (a.updated || 0));
});
ipcMain.handle("proj-load", (_, id) => { try { return fs.readFileSync(path.join(projDir(), pid(id) + ".ecomproj"), "utf8"); } catch (e) { return null; } });
ipcMain.handle("proj-save", (_, id, meta, json) => { try { return writeProject(id, meta, json); } catch (e) { return false; } });
ipcMain.on("proj-save-sync", (e, id, meta, json) => { try { e.returnValue = writeProject(id, meta, json); } catch (err) { e.returnValue = false; } });
ipcMain.handle("proj-delete", (_, id) => { id = pid(id); ["ecomproj", "meta"].forEach(x => { try { fs.unlinkSync(path.join(projDir(), id + "." + x)); } catch (e) {} }); return true; });
ipcMain.handle("proj-dir", () => { ensureFolders(); return baseDir(); });
ipcMain.handle("open-folder", () => { ensureFolders(); shell.openPath(baseDir()); return true; });
ipcMain.handle("save-project", async (_, data) => {
  const r = await dialog.showSaveDialog(win, { title: M("saveProject"), defaultPath: path.join(projDir(), "EcomVideoStudio-project.json"), filters: [{ name: M("project"), extensions: ["json"] }] });
  if (r.canceled) return null;
  fs.writeFileSync(r.filePath, JSON.stringify(data, null, 2));
  return r.filePath;
});
ipcMain.handle("load-project", async () => {
  const r = await dialog.showOpenDialog(win, { defaultPath: projDir(), properties: ["openFile"], filters: [{ name: M("project"), extensions: ["ecomproj", "json"] }] });
  if (r.canceled) return null;
  try { return JSON.parse(fs.readFileSync(r.filePaths[0], "utf8")); } catch (e) { return null; }
});
ipcMain.handle("pick-export-path", async (_, name) => {
  const r = await dialog.showSaveDialog(win, { title: M("exportVideo"), defaultPath: path.join(exportDir(), name || "EcomVideoStudio-export.mp4"), filters: [{ name: M("videoMp4"), extensions: ["mp4"] }] });
  return r.canceled ? null : r.filePath;
});

// ---------- Export ----------
function prepareSubs(tmp, caps, res) {
  fs.writeFileSync(path.join(tmp, "subs.ass"), buildAss(caps, res.w, res.h), "utf8");
  const fonts = path.join(process.env.WINDIR || "C:\\Windows", "Fonts");
  for (const f of ["arialbd.ttf", "arial.ttf"]) {
    try { if (fs.existsSync(path.join(fonts, f))) fs.copyFileSync(path.join(fonts, f), path.join(tmp, f)); } catch (e) {}
  }
}
const logsDir = () => path.join(app.getPath("userData"), "logs");
function saveLog(name, text) {
  try {
    fs.mkdirSync(logsDir(), { recursive: true });
    const f = path.join(logsDir(), name); fs.writeFileSync(f, text, "utf8");
    fs.readdirSync(logsDir()).filter(x => /^export-\d+\.log$/.test(x)).sort().slice(0, -15).forEach(x => { try { fs.unlinkSync(path.join(logsDir(), x)); } catch (e) {} });
    return f;
  } catch (e) { return ""; }
}
ipcMain.handle("open-logs", () => { try { fs.mkdirSync(logsDir(), { recursive: true }); shell.openPath(logsDir()); } catch (e) {} return true; });
// Message d'erreur lisible : cause probable + vraies lignes d'erreur FFmpeg (la fin du journal ne contient que des statistiques)
function explainFF(r) {
  const txt = (r.errs || []).join("\n") + "\n" + (r.stderr || "");
  let hint = "";
  if (/too many packets buffered|muxing queue/i.test(txt)) hint = M("hQueue");
  else if (/cannot allocate memory|out of memory|0xC0000005/i.test(txt)) hint = M("hMem");
  else if (/permission denied|access is denied|being used by another/i.test(txt)) hint = M("hPerm");
  else if (/no such file|error opening input|could not open/i.test(txt)) hint = M("hFile");
  else if (/invalid data found|moov atom not found|corrupt/i.test(txt)) hint = M("hCorrupt");
  const lines = (r.errs || []).slice(-6).join("\n");
  return (hint ? hint + "\n\n" : "") + (lines || (r.stderr || "").slice(-500) || "FFmpeg");
}
const lic = require("./license");
ipcMain.handle("license-state", () => lic.evaluate());
ipcMain.handle("license-ping", (_, country) => lic.ping(country));
ipcMain.handle("license-activate", (_, key) => lic.activate(key));
ipcMain.handle("set-country", (_, c) => lic.setCountry(c));
ipcMain.handle("open-external", (_, url) => {   // uniquement WhatsApp et la boutique Chariow
  try { const u = new URL(String(url)); if (u.protocol === "https:" && /(^|\.)(whatsapp\.com|mychariow\.shop|chariow\.com)$/.test(u.hostname)) shell.openExternal(u.toString()); } catch (e) {}
  return true;
});
ipcMain.handle("export-video", async (_, o) => {
  if (!lic.evaluate().pro) return { ok: false, license: true, error: M("licenseNeeded") };
  const res = resolutionFor(o.ratio, o.resolution);
  const unpack = p => String(p).replace(/app\.asar(?!\.unpacked)/, "app.asar.unpacked");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ecomvs-"));
  try {
    o.video = (o.video || []).map((c, i) => {
      const n = { ...c, path: c.path ? unpack(c.path) : c.path };
      if (c.type === "text" && c.img) { // texte : image PNG générée par l'interface
        const f = path.join(tmp, "text" + i + ".png");
        fs.writeFileSync(f, Buffer.from(String(c.img).replace(/^data:image\/png;base64,/, ""), "base64"));
        n.path = f; delete n.img;
      }
      return n;
    });
    o.fxDir = unpack(path.join(__dirname, "effects"));
    // Fichiers sources introuvables (déplacés / supprimés) : message clair au lieu d'un échec FFmpeg
    const srcFiles = [...new Set(o.video.filter(c => c.type !== "text" && c.path).map(c => c.path).concat((o.audio || []).map(a => a.path)).filter(Boolean))];
    const gone = srcFiles.filter(f => { try { return !fs.existsSync(f); } catch (e) { return true; } });
    if (gone.length) return { ok: false, error: M("missing") + "\n" + gone.slice(0, 6).map(f => " • " + f).join("\n") + (gone.length > 6 ? "\n…" : "") };
    // Durées réelles des fichiers : un clip qui démarre après la fin réelle du fichier ferait échouer l'export
    const real = new Map();
    for (const f of srcFiles) { try { real.set(f, (await probe(f)).duration || 0); } catch (e) { real.set(f, 0); } }
    o.video.forEach(c => {
      if (c.type !== "video" || !c.path) return;
      const d = real.get(c.path) || 0; if (d <= 0) return;
      c.mediaDur = d;
      if ((c.inPoint || 0) > d - 0.1) c.inPoint = Math.max(0, d - 0.1);
    });
    (o.audio || []).forEach(a => { const d = real.get(a.path) || 0; if (d > 0 && (a.inPoint || 0) > d - 0.05) a.inPoint = Math.max(0, d - 0.05); });
    const caps = (o.captions || []).filter(c => c.text && c.end > c.start);
    let burn = caps.length > 0;
    if (burn) prepareSubs(tmp, caps, res);
    o.writeGraph = g => { fs.writeFileSync(path.join(tmp, "filter.txt"), g, "utf8"); return "filter.txt"; };
    const run = async () => {
      let r = await runFF(buildExportArgs(o, res, burn, o.output), { cwd: tmp, onData: s => send("export-progress", s) });
      if (r.code !== 0 && !o.graphFlag && /filter_complex_script/.test(r.stderr)) { o.graphFlag = "-/filter_complex"; r = await runFF(buildExportArgs(o, res, burn, o.output), { cwd: tmp, onData: s => send("export-progress", s) }); }
      return r;
    };
    let r = await run(), warning;
    // Repli progressif : si le moteur vidéo embarqué refuse une fonction, on réessaie sans elle
    const steps = [
      { when: () => !o.light, apply: () => { o.light = true; o.tolerant = true; }, retry: "retryLight", warn: "warnLight" },
      { when: () => burn, apply: () => { burn = false; }, retry: "retryCaps", warn: "warnCaps" },
      { when: () => o.video.some(c => c.type === "sticker" || c.type === "text"), apply: () => { o.video = o.video.map(c => ({ ...c, noAnim: true })); }, retry: "retryStk", warn: "warnStk" },
      { when: () => o.video.some(c => c.fx && c.fx.length), apply: () => { o.video = o.video.map(c => ({ ...c, noFx: true })); }, retry: "retryFx", warn: "warnFx" },
      { when: () => o.video.some(c => c.trans), apply: () => { o.video = o.video.map(c => ({ ...c, noTrans: true })); }, retry: "retryTr", warn: "warnTr" }
    ];
    for (const st of steps) {
      if (r.code === 0) break;
      if (!st.when()) continue;
      send("export-progress", M(st.retry));
      st.apply(); r = await run();
      if (r.code === 0) warning = M(st.warn);
    }
    if (r.code === 0) return { ok: true, output: o.output, warning };
    const logFile = saveLog("export-" + Date.now() + ".log", "EcomVideoStudio — journal d'export\r\n" + new Date().toISOString() + "\r\nSortie : " + o.output + "\r\n\r\n" + (r.full || r.stderr || ""));
    return { ok: false, error: explainFF(r) + (logFile ? "\n\n" + M("logSaved") + " " + logFile : "") };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
  }
});

// ---------- Langue (français / anglais) ----------
const MSG = {
  fr: { media: "Médias", project: "Projet EcomVideoStudio", saveProject: "Enregistrer le projet", exportVideo: "Exporter la vidéo", videoMp4: "Vidéo MP4",
    noKey: "Aucune clé API enregistrée pour cette plateforme. Renseignez-la dans le panneau Légendes.", prep: "Préparation de l'audio…", noSound: "Aucun son à transcrire.",
    prepFail: "Préparation audio impossible : ", transcribing: "Transcription en ligne… ({i}/{n})", offline: "Impossible de joindre le service de transcription. Vérifiez votre connexion internet.",
    badKey: "Clé API refusée. Vérifiez la clé enregistrée. ", err: "Erreur {code} : ", badJson: "Réponse inattendue du service de transcription.",
    retryCaps: "\nLes légendes n'ont pas pu être incrustées, nouvel essai sans légendes…\n", warnCaps: "Export terminé, mais sans les légendes incrustées (moteur vidéo incompatible).",
    retryStk: "\nAnimation des stickers non supportée, nouvel essai avec des stickers fixes…\n", warnStk: "Export terminé, mais les stickers sont fixes (animation non supportée par le moteur vidéo).",
    noWinVoice: "Aucune voix Windows disponible pour cette langue. Choisissez les voix IA (Gemini) ou installez une voix dans les paramètres Windows (Heure et langue > Voix).", ttsFail: "Échec de la synthèse vocale :",
    retryFx: "\nUn effet n'est pas supporté par le moteur vidéo, nouvel essai sans effets…\n", warnFx: "Export terminé, mais sans les effets (non supportés par le moteur vidéo).",
    retryTr: "\nUne transition n'est pas supportée par le moteur vidéo, nouvel essai sans transitions…\n", warnTr: "Export terminé, mais sans les transitions (non supportées par le moteur vidéo).",
    retryLight: "\nPremier essai interrompu : nouvel essai en mode sécurisé (tous les éléments conservés)…\n", warnLight: "Export terminé en mode sécurisé (aucun élément retiré).",
    missing: "Des fichiers du montage sont introuvables (déplacés ou supprimés). Remettez-les à leur place ou retirez-les du projet :", logSaved: "Journal complet :", allFiles: "Tous les fichiers", licenseNeeded: "Licence requise : votre essai gratuit ou votre clé a expiré (ou une vérification en ligne est nécessaire).",
    hQueue: "L'encodage a mis trop de temps à démarrer (projet lourd). Réessayez ; en 720p ou 480p c'est plus rapide.", hMem: "Mémoire insuffisante pour cet export. Fermez d'autres programmes ou choisissez 720p / 480p.",
    hPerm: "Impossible d'écrire le fichier de sortie. Fermez la vidéo si elle est ouverte dans un lecteur, ou choisissez un autre dossier.", hFile: "Un fichier source est illisible ou introuvable.", hCorrupt: "Un fichier source semble corrompu ou incomplet." },
  en: { media: "Media", project: "EcomVideoStudio project", saveProject: "Save project", exportVideo: "Export video", videoMp4: "MP4 video",
    noKey: "No API key saved for this provider. Enter it in the Captions panel.", prep: "Preparing audio…", noSound: "No sound to transcribe.",
    prepFail: "Audio preparation failed: ", transcribing: "Online transcription… ({i}/{n})", offline: "Cannot reach the transcription service. Check your internet connection.",
    badKey: "API key rejected. Check the saved key. ", err: "Error {code}: ", badJson: "Unexpected response from the transcription service.",
    retryCaps: "\nCaptions could not be burned in, retrying without captions…\n", warnCaps: "Export finished, but without burned-in captions (incompatible video engine).",
    retryStk: "\nSticker animation not supported, retrying with static stickers…\n", warnStk: "Export finished, but stickers are static (animation not supported by the video engine).",
    noWinVoice: "No Windows voice available for this language. Choose the AI voices (Gemini) or install a voice in Windows settings (Time & language > Speech).", ttsFail: "Speech synthesis failed:",
    retryFx: "\nAn effect is not supported by the video engine, retrying without effects…\n", warnFx: "Export finished, but without effects (not supported by the video engine).",
    retryTr: "\nA transition is not supported by the video engine, retrying without transitions…\n", warnTr: "Export finished, but without transitions (not supported by the video engine).",
    retryLight: "\nFirst attempt interrupted: retrying in safe mode (nothing removed)…\n", warnLight: "Export finished in safe mode (nothing removed).",
    missing: "Some files used in the project cannot be found (moved or deleted). Put them back or remove them from the project:", logSaved: "Full log:", allFiles: "All files", licenseNeeded: "License required: your free trial or key has expired (or an online check is needed).",
    hQueue: "Encoding took too long to start (heavy project). Try again; 720p or 480p is faster.", hMem: "Not enough memory for this export. Close other programs or choose 720p / 480p.",
    hPerm: "Cannot write the output file. Close the video if it is open in a player, or choose another folder.", hFile: "A source file is unreadable or missing.", hCorrupt: "A source file looks corrupted or incomplete." }
};
let LANG = "fr";
const M = (k, p) => { let s = (MSG[LANG] || MSG.fr)[k] || MSG.fr[k] || k; if (p) Object.keys(p).forEach(n => { s = s.replace("{" + n + "}", p[n]); }); return s; };
function installerLang() {
  try { // fichier écrit par l'installateur (identifiant de langue Windows choisi au setup)
    const f = path.join(path.dirname(process.execPath), "language.txt");
    if (fs.existsSync(f)) { const id = parseInt(String(fs.readFileSync(f, "utf8")).trim(), 10); if (id) return (id & 0xff) === 12 ? "fr" : "en"; }
  } catch (e) {}
  return "";
}
ipcMain.handle("get-lang", () => {
  const j = readSettings();
  LANG = j.lang || installerLang() || ((app.getLocale() || "fr").toLowerCase().startsWith("fr") ? "fr" : "en");
  return LANG;
});
ipcMain.handle("set-lang", (_, l) => { LANG = l === "en" ? "en" : "fr"; const j = readSettings(); j.lang = LANG; writeSettings(j); return LANG; });

// ---------- Réglages (clés API chiffrées si possible, une par plateforme) ----------
const settingsFile = () => path.join(app.getPath("userData"), "settings.json");
function readSettings() { try { return JSON.parse(fs.readFileSync(settingsFile(), "utf8")); } catch (e) { return {}; } }
function writeSettings(j) { fs.mkdirSync(path.dirname(settingsFile()), { recursive: true }); fs.writeFileSync(settingsFile(), JSON.stringify(j)); }
function decodeKey(rec) {
  if (!rec || !rec.key) return "";
  if (rec.enc) { try { return safeStorage.decryptString(Buffer.from(rec.key, "base64")); } catch (e) { return ""; } }
  return rec.key;
}
function encodeKey(k) { return safeStorage.isEncryptionAvailable() ? { enc: true, key: safeStorage.encryptString(k).toString("base64") } : { key: k }; }

// Plateformes de transcription : 3 gratuites (Groq, Google Gemini, Mistral) et 2 payantes (OpenAI, Deepgram)
const PROVIDERS = {
  groq: { kind: "openai", url: "https://api.groq.com/openai/v1/audio/transcriptions", model: "whisper-large-v3-turbo" },
  gemini: { kind: "gemini", model: "gemini-2.5-flash", seg: 300 },
  mistral: { kind: "mistral", url: "https://api.mistral.ai/v1/audio/transcriptions", model: "voxtral-mini-latest" },
  openai: { kind: "openai", url: "https://api.openai.com/v1/audio/transcriptions", model: "whisper-1" },
  deepgram: { kind: "deepgram", url: "https://api.deepgram.com/v1/listen", model: "nova-3" }
};
function loadSettings() {
  const j = readSettings(), keys = {};
  if (j.keys) Object.keys(j.keys).forEach(k => { keys[k] = decodeKey(j.keys[k]); });
  else if (j.key && j.provider) keys[j.provider] = decodeKey({ enc: j.enc, key: j.key });
  return { provider: PROVIDERS[j.provider] ? j.provider : "groq", keys, lang: j.lang };
}
function saveSettings(provider, key) {
  const j = readSettings();
  const keys = j.keys || (j.key && j.provider ? { [j.provider]: { enc: j.enc, key: j.key } } : {});
  if (key && key.trim()) keys[provider] = encodeKey(key.trim());
  writeSettings({ provider: PROVIDERS[provider] ? provider : "groq", keys, lang: j.lang });
}
ipcMain.handle("get-settings", () => {
  const s = loadSettings(), has = {};
  Object.keys(PROVIDERS).forEach(k => { has[k] = !!s.keys[k]; });
  return { provider: s.provider, has };
});
ipcMain.handle("set-settings", (_, o) => { saveSettings(o.provider, o.key); return true; });

// ---------- Légendes automatiques ----------
async function httpJson(url, opts) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 300000);
  let res;
  try { res = await fetch(url, Object.assign({ signal: ctrl.signal }, opts)); }
  catch (e) { throw new Error(M("offline")); }
  finally { clearTimeout(timer); }
  if (!res.ok) {
    let msg = "";
    try { const j = await res.json(); msg = (j.error && (j.error.message || j.error)) || j.message || j.err_msg || JSON.stringify(j); } catch (e) {}
    if (res.status === 401 || res.status === 403) msg = M("badKey") + msg;
    throw new Error(M("err", { code: res.status }) + (typeof msg === "string" ? msg : JSON.stringify(msg)));
  }
  try { return await res.json(); } catch (e) { throw new Error(M("badJson")); }
}
const toSec = v => { if (typeof v === "number") return v; const m = String(v || "").split(":").map(parseFloat); return m.reduce((a, x) => a * 60 + (x || 0), 0); };

async function callProvider(id, key, file, language, offset) {
  const P = PROVIDERS[id];
  const buf = fs.readFileSync(file);
  let words = [], segments = [];
  if (P.kind === "openai" || P.kind === "mistral") {
    const fd = new FormData();
    fd.append("file", new Blob([buf], { type: "audio/mpeg" }), "audio.mp3");
    fd.append("model", P.model);
    if (P.kind === "openai") {
      fd.append("response_format", "verbose_json"); fd.append("temperature", "0");
      fd.append("timestamp_granularities[]", "word"); fd.append("timestamp_granularities[]", "segment");
      if (language && language !== "auto") fd.append("language", language);
    } else fd.append("timestamp_granularities[]", "segment"); // Mistral : horodatage et langue sont incompatibles
    const j = await httpJson(P.url, { method: "POST", headers: { Authorization: "Bearer " + key }, body: fd });
    const segs = (j.segments || []).filter(s => !(s.no_speech_prob > 0.6));
    const inSeg = t => !(j.segments || []).length || segs.some(s => t >= s.start - 0.1 && t <= s.end + 0.1);
    words = (j.words || []).filter(w => inSeg((w.start + w.end) / 2)).map(w => ({ word: String(w.word).trim(), start: w.start + offset, end: w.end + offset }));
    segments = segs.map(s => ({ start: s.start + offset, end: s.end + offset, text: String(s.text).trim() }));
  } else if (P.kind === "deepgram") {
    const q = new URLSearchParams({ model: P.model, smart_format: "true", punctuate: "true" });
    if (language && language !== "auto") q.set("language", language); else q.set("detect_language", "true");
    const j = await httpJson(P.url + "?" + q.toString(), { method: "POST", headers: { Authorization: "Token " + key, "Content-Type": "audio/mpeg" }, body: buf });
    const alt = j.results && j.results.channels && j.results.channels[0] && j.results.channels[0].alternatives && j.results.channels[0].alternatives[0];
    words = ((alt && alt.words) || []).map(w => ({ word: String(w.punctuated_word || w.word).trim(), start: w.start + offset, end: w.end + offset }));
  } else if (P.kind === "gemini") {
    const names = { fr: "French", en: "English", pt: "Portuguese", es: "Spanish" };
    const lang = names[language] ? `The speech is in ${names[language]}. ` : "";
    const prompt = `Transcribe the speech in this audio. ${lang}Return a JSON array of subtitle segments. Each item has "start" and "end" (seconds, decimal, counted from the beginning of this audio file) and "text" (what is said). Make each segment one short sentence or phrase (at most about 7 seconds). Ignore music and noise. If there is no speech, return [].`;
    const body = JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: "audio/mp3", data: buf.toString("base64") } }, { text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "OBJECT", properties: { start: { type: "NUMBER" }, end: { type: "NUMBER" }, text: { type: "STRING" } }, required: ["start", "end", "text"] } } }
    });
    const call = model => httpJson(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body });
    let j;
    try { j = await call(P.model); } catch (e) { if (/\b404\b/.test(e.message)) j = await call("gemini-flash-latest"); else throw e; }
    let txt = (((j.candidates || [])[0] || {}).content || {}).parts;
    txt = txt && txt.map(p => p.text || "").join("");
    let arr = [];
    try { arr = JSON.parse(String(txt || "[]").replace(/^```json|```$/g, "").trim()); } catch (e) { throw new Error(M("badJson")); }
    segments = (Array.isArray(arr) ? arr : []).filter(x => x && x.text).map(x => ({ start: toSec(x.start) + offset, end: Math.max(toSec(x.end), toSec(x.start) + 0.3) + offset, text: String(x.text).trim() }));
  }
  return { words, segments };
}
ipcMain.handle("transcribe", async (_, o) => {
  const cfg = loadSettings();
  const id = PROVIDERS[o.provider] ? o.provider : cfg.provider;
  const key = cfg.keys[id];
  if (!key) return { ok: false, error: M("noKey") };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ecomvs-tr-"));
  try {
    send("caption-progress", M("prep"));
    const seg = PROVIDERS[id].seg || 600;
    const args = buildTranscribeArgs(o.sources, o.total, path.join(tmp, "chunk%03d.mp3"), seg);
    if (!args) return { ok: false, error: M("noSound") };
    const r = await runFF(args);
    if (r.code !== 0) return { ok: false, error: M("prepFail") + r.stderr.slice(-400) };
    const chunks = fs.readdirSync(tmp).filter(f => /^chunk\d+\.mp3$/.test(f)).sort();
    let words = [], segments = [];
    for (let i = 0; i < chunks.length; i++) {
      send("caption-progress", M("transcribing", { i: i + 1, n: chunks.length }));
      const part = await callProvider(id, key, path.join(tmp, chunks[i]), o.language, i * seg);
      words = words.concat(part.words); segments = segments.concat(part.segments);
    }
    return { ok: true, words, segments };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
  }
});


// ---------- Mode IA : voix off (synthèse vocale), détection des silences, chemins ----------
const voicesDir = () => path.join(baseDir(), "Voix");
ipcMain.handle("next-export-path", (_, prefix, name) => {
  ensureFolders();
  // nom choisi par l'utilisateur (fenêtre « Nommer votre vidéo ») : caractères interdits retirés, jamais d'écrasement d'un fichier existant
  let clean = String(name || "").replace(/\.mp4$/i, "").replace(/[<>:"\/\\|?*\x00-\x1f]/g, "").replace(/\s+/g, " ").trim().replace(/[. ]+$/, "").slice(0, 80);
  if (/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(clean)) clean = "_" + clean;
  if (clean) { let f = path.join(exportDir(), clean + ".mp4"), n = 2; while (fs.existsSync(f)) f = path.join(exportDir(), `${clean} (${n++}).mp4`); return f; }
  const d = new Date(), p2 = n => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
  return path.join(exportDir(), `${String(prefix || "Export").replace(/[^A-Za-z0-9_-]/g, "")}-${stamp}.mp4`);
});
ipcMain.handle("reveal-file", (_, f) => { try { if (f && fs.existsSync(f)) shell.showItemInFolder(f); else shell.openPath(exportDir()); } catch (e) {} return true; });

// Silences d'un fichier audio (sert à caler les sous-titres sur la voix)
ipcMain.handle("detect-silence", async (_, file) => {
  let txt = "";
  await runFF(["-hide_banner", "-i", file, "-af", "silencedetect=noise=-32dB:d=0.18", "-f", "null", "-"], { onData: s => { txt += s; } });
  const sil = [], re = /silence_start: (-?[\d.]+)|silence_end: ([\d.]+)/g; let m, cur = null;
  while ((m = re.exec(txt))) { if (m[1] !== undefined) cur = { start: Math.max(0, parseFloat(m[1])), end: null }; else if (cur) { cur.end = parseFloat(m[2]); sil.push(cur); cur = null; } }
  if (cur) { const d = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(txt); cur.end = d ? (+d[1]) * 3600 + (+d[2]) * 60 + parseFloat(d[3]) : cur.start; sil.push(cur); }
  const d = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(txt);
  return { silences: sil, duration: d ? (+d[1]) * 3600 + (+d[2]) * 60 + parseFloat(d[3]) : 0 };
});

// Voix Windows (hors ligne) : System.Speech via PowerShell
function psRun(scriptBody, args) {
  return new Promise(resolve => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ecomvs-ps-")), f = path.join(tmp, "s.ps1");
    fs.writeFileSync(f, scriptBody, "utf8");
    let out = "", err = "", p;
    try { p = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", f, ...args], { windowsHide: true }); }
    catch (e) { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (x) {} return resolve({ code: -1, out: "", err: String(e.message) }); }
    p.stdout.on("data", d => { out += d; }); p.stderr.on("data", d => { err += d; });
    p.on("error", e => resolve({ code: -1, out, err: e.message }));
    p.on("close", code => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} resolve({ code, out, err }); });
  });
}
const PS_LIST = `Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$v = @($s.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { [pscustomobject]@{ name = $_.VoiceInfo.Name; culture = $_.VoiceInfo.Culture.Name; gender = $_.VoiceInfo.Gender.ToString() } })
$s.Dispose()
ConvertTo-Json -InputObject $v -Compress`;
const PS_SPEAK = `param([string]$TextFile,[string]$Out,[string]$Lang,[string]$Gender)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$all = @($s.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo })
if ($all.Count -eq 0) { throw 'NOVOICE' }
$inLang = @($all | Where-Object { $_.Culture.Name.ToLower().StartsWith($Lang) })
if ($inLang.Count -gt 0) { $pool = $inLang } else { $pool = $all }
if ($Gender -eq 'male') { $g = 'Male' } else { $g = 'Female' }
$match = @($pool | Where-Object { $_.Gender.ToString() -eq $g })
$pitch = 'medium'
if ($match.Count -gt 0) { $v = $match[0] } else { $v = $pool[0]; if ($g -eq 'Male') { $pitch = 'x-low' } else { $pitch = 'high' } }
$text = [System.IO.File]::ReadAllText($TextFile, [System.Text.Encoding]::UTF8)
$esc = [System.Security.SecurityElement]::Escape($text)
$culture = $v.Culture.Name
$vname = $v.Name.Replace("'", '')
$ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='$culture'><voice name='$vname'><prosody pitch='$pitch'>$esc</prosody></voice></speak>"
$s.SetOutputToWaveFile($Out)
$s.SpeakSsml($ssml)
$s.Dispose()
Write-Output ('VOICE=' + $v.Name + '|' + $culture + '|' + $v.Gender + '|' + ($inLang.Count -gt 0))`;
ipcMain.handle("tts-voices", async () => {
  if (process.platform !== "win32") return { ok: false, voices: [] };
  const r = await psRun(PS_LIST, []);
  try { let v = JSON.parse(r.out.trim() || "[]"); if (!Array.isArray(v)) v = [v]; return { ok: true, voices: v }; } catch (e) { return { ok: false, voices: [], error: r.err.slice(0, 300) }; }
});
async function geminiSpeak(text, gender, outWav) {
  const key = loadSettings().keys.gemini;
  if (!key) throw new Error(M("noKey"));
  const body = JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: gender === "male" ? "Puck" : "Kore" } } } } });
  const j = await httpJson("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent", { method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body });
  const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
  const part = parts.find(p => p.inlineData || p.inline_data), data = part && (part.inlineData || part.inline_data).data;
  if (!data) throw new Error(M("badJson"));
  const raw = outWav + ".pcm"; fs.writeFileSync(raw, Buffer.from(data, "base64"));
  const r = await runFF(["-y", "-hide_banner", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", raw, outWav]);
  try { fs.unlinkSync(raw); } catch (e) {}
  if (r.code !== 0) throw new Error("FFmpeg: " + r.stderr.slice(-200));
}
// o : { text, lang: "fr"|"en", gender: "female"|"male", engine: "sapi"|"gemini", preview }
ipcMain.handle("tts-synth", async (_, o) => {
  if (!lic.evaluate().pro) return { ok: false, license: true, error: M("licenseNeeded") };
  const text = String(o.text || "").replace(/\s+/g, " ").trim().slice(0, o.preview ? 160 : 1000);
  if (!text) return { ok: false, error: "Texte vide." };
  const gender = o.gender === "male" ? "male" : "female", lang = o.lang === "en" ? "en" : "fr";
  let outDir = o.preview ? os.tmpdir() : voicesDir();
  try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}
  const out = path.join(outDir, `${o.preview ? "ecomvs-apercu" : "voix"}-${Date.now()}.wav`);
  try {
    let info = "";
    if (o.engine === "gemini") { await geminiSpeak(text, gender, out); info = gender === "male" ? "Puck" : "Kore"; }
    else {
      if (process.platform !== "win32") return { ok: false, error: M("noWinVoice") };
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ecomvs-tts-")), tf = path.join(tmp, "t.txt");
      fs.writeFileSync(tf, text, "utf8");
      const r = await psRun(PS_SPEAK, ["-TextFile", tf, "-Out", out, "-Lang", lang, "-Gender", gender]);
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
      if (r.code !== 0 || !fs.existsSync(out)) return { ok: false, error: /NOVOICE/.test(r.err + r.out) ? M("noWinVoice") : (M("ttsFail") + " " + (r.err || r.out || "").slice(0, 300)) };
      info = (/VOICE=(.*)/.exec(r.out) || [])[1] || "";
    }
    const pr = await probe(out);
    return { ok: true, path: out, duration: pr.duration, voice: info };
  } catch (e) { return { ok: false, error: e.message }; }
});
