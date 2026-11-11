// Sécurité de compilation : retire de la configuration NSIS toute option que la version installée d'electron-builder ne connaît pas.
const fs = require("fs");
try {
  const schema = JSON.parse(fs.readFileSync("node_modules/app-builder-lib/scheme.json", "utf8"));
  const props = schema.definitions && schema.definitions.NsisOptions && schema.definitions.NsisOptions.properties;
  if (!props) { console.log("Schéma NSIS introuvable : vérification ignorée"); process.exit(0); }
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const n = pkg.build && pkg.build.nsis;
  if (n) {
    let changed = false;
    Object.keys(n).forEach(k => { if (!(k in props)) { console.log("Option NSIS non supportée retirée :", k); delete n[k]; changed = true; } });
    if (changed) fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
  }
  console.log("Configuration NSIS vérifiée.");
} catch (e) { console.log("Vérification de configuration ignorée :", e.message); }
