// Licence EcomVideoStudio : essai gratuit 14 jours, clés de 30 jours, vérification Supabase, protection horloge / hors ligne.
const { app } = require("electron");
const fs = require("fs"), path = require("path"), os = require("os"), crypto = require("crypto");
const { execFileSync } = require("child_process");
const C = require("./license-config");

const DAY = 864e5, SALT = "ecomvs-2026|Ecom_Academy|";
let deviceCache = "", memo = null;

// Identifiant anonyme de l'ordinateur (haché) : le même après désinstallation / réinstallation
function deviceHash() {
  if (deviceCache) return deviceCache;
  let raw = "";
  try {
    if (process.platform === "win32") {
      const out = execFileSync("reg", ["query", "HKLM\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid"], { windowsHide: true, timeout: 6000 }).toString();
      const m = out.match(/MachineGuid\s+REG_SZ\s+(\S+)/i); if (m) raw = m[1];
    } else raw = fs.readFileSync("/etc/machine-id", "utf8").trim();
  } catch (e) {}
  if (!raw) {
    try { raw = os.hostname() + "|" + (os.cpus()[0] || {}).model + "|" + Object.values(os.networkInterfaces()).flat().filter(n => n && !n.internal && n.mac && n.mac !== "00:00:00:00:00:00").map(n => n.mac).sort().join(","); } catch (e) { raw = os.hostname(); }
  }
  deviceCache = crypto.createHash("sha256").update("ecomvs|" + raw).digest("hex");
  return deviceCache;
}

const file = () => path.join(app.getPath("userData"), "license.dat");
const sign = s => crypto.createHmac("sha256", SALT + deviceHash()).update(s).digest("hex");
function load() {
  if (memo) return memo;
  let D = null, tampered = false;
  try {
    const j = JSON.parse(fs.readFileSync(file(), "utf8"));
    if (j && j.d && j.s === sign(j.d)) D = JSON.parse(j.d); else tampered = true;
  } catch (e) { /* fichier absent : première ouverture */ }
  if (!D) { D = { first_local: Date.now(), last_seen: 0, country: "", srv: null, skew: 0, checked: 0 }; }
  if (tampered) D.tampered = true;
  memo = D; return D;
}
function save() {
  try { const d = JSON.stringify(memo); fs.writeFileSync(file(), JSON.stringify({ d, s: sign(d) })); } catch (e) {}
}

const tnow = D => Date.now() + (D.skew || 0);

// État courant, calculé localement (instantané, fonctionne hors ligne)
function evaluate() {
  const D = load(), now = tnow(D);
  let verify = !!D.tampered;
  if (D.last_seen && now < D.last_seen - 10 * 60e3) verify = true;      // horloge reculée
  else if (now > (D.last_seen || 0)) { D.last_seen = now; save(); }
  const trialEnd = D.srv ? D.srv.trial_end : D.first_local + C.TRIAL_DAYS * DAY;
  const lic = D.srv ? D.srv.lic : null;
  let state;
  if (lic && lic > now) state = "licensed";
  else if (now < trialEnd) state = "trial";
  else state = lic ? "license_expired" : "trial_over";
  if (state === "licensed" && D.checked && now - D.checked > C.OFFLINE_GRACE_DAYS * DAY) verify = true;   // licence non revérifiée depuis trop longtemps
  const end = state === "licensed" ? lic : trialEnd;
  return {
    state: verify && (state === "licensed" || state === "trial") ? "verify" : state,
    pro: !verify && (state === "licensed" || state === "trial"),
    underlying: state, verify,
    daysLeft: Math.max(0, Math.ceil((end - now) / DAY)),
    licenseEnd: lic || null, trialEnd,
    country: D.country || "", needCountry: !D.country,
    lastCheck: D.checked || 0
  };
}

function applyServer(D, d) {
  const srvNow = Date.parse(d.now), local = Date.now();
  D.srv = { first_seen: Date.parse(d.first_seen), trial_end: Date.parse(d.trial_end), lic: d.license_expires_at ? Date.parse(d.license_expires_at) : null };
  D.skew = Math.abs(srvNow - local) > 120000 ? srvNow - local : 0;
  D.checked = srvNow; D.last_seen = srvNow; delete D.tampered;
  save();
}

async function rpc(fn, body) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(C.SUPABASE_URL + "/rest/v1/rpc/" + fn, { method: "POST", headers: { apikey: C.SUPABASE_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
    const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch (e) {}
    if (!r.ok) return { ok: false, net: false, error: (j && (j.message || j.error)) || "HTTP " + r.status };
    return { ok: true, data: j };
  } catch (e) { return { ok: false, net: true, error: String(e && e.message || e) }; }
  finally { clearTimeout(t); }
}

async function ping(country) {
  const D = load();
  if (country && /^[A-Za-z]{2}$/.test(country)) { D.country = country.toUpperCase(); save(); }
  const r = await rpc("app_ping", { p_device: deviceHash(), p_country: D.country || null, p_version: app.getVersion(), p_local_first: new Date(D.first_local).toISOString() });
  const online = r.ok && r.data && r.data.ok === true;
  if (online) applyServer(D, r.data);
  return Object.assign(evaluate(), { online });
}

async function activate(key) {
  const D = load();
  const r = await rpc("app_activate", { p_device: deviceHash(), p_key: String(key || "") });
  if (!r.ok) return Object.assign(evaluate(), { ok: false, error: r.net ? "network" : "server" });
  if (!r.data || r.data.ok !== true) return Object.assign(evaluate(), { ok: false, error: (r.data && r.data.error) || "server" });
  applyServer(D, r.data);
  return Object.assign(evaluate(), { ok: true });
}

function setCountry(c) { const D = load(); if (/^[A-Za-z]{2}$/.test(String(c || ""))) { D.country = String(c).toUpperCase(); save(); } return evaluate(); }

module.exports = { evaluate, ping, activate, setCountry, deviceHash };
