// Styles de texte : le texte est dessiné dans un canvas puis utilisé comme image (aperçu et export identiques).
(function (root) {
  const FONTS = [
    ["Arial", "Arial, 'Helvetica Neue', sans-serif"], ["Arial Black", "'Arial Black', Arial, sans-serif"], ["Impact", "Impact, 'Arial Black', sans-serif"],
    ["Segoe UI", "'Segoe UI', Tahoma, sans-serif"], ["Verdana", "Verdana, Geneva, sans-serif"], ["Tahoma", "Tahoma, Verdana, sans-serif"],
    ["Trebuchet MS", "'Trebuchet MS', Arial, sans-serif"], ["Calibri", "Calibri, 'Segoe UI', sans-serif"], ["Georgia", "Georgia, 'Times New Roman', serif"],
    ["Times New Roman", "'Times New Roman', Times, serif"], ["Comic Sans MS", "'Comic Sans MS', 'Comic Sans', cursive"], ["Courier New", "'Courier New', Courier, monospace"],
    ["Consolas", "Consolas, 'Courier New', monospace"]
  ];
  const FONT_CSS = {}; FONTS.forEach(f => { FONT_CSS[f[0]] = f[1]; });

  const BASE = { font: "Arial", bold: true, italic: false, upper: false, align: "center", color: "#ffffff", grad: false, color2: "#ff7a00", opacity: 100,
    strokeW: 0, strokeColor: "#000000", fx: "none", fxColor: "#000000", fxAmount: 40, bg: false, bgColor: "#000000", bgOpacity: 85, bgRadius: 15, spacing: 0 };
  const P = (id, name, en, text, ts) => ({ id, name, en, text, ts: Object.assign({}, BASE, ts) });
  const PRESETS = [
    P("classic", "Classique", "Classic", "Votre texte", { strokeW: 6 }),
    P("impact", "Jaune impact", "Impact yellow", "Votre texte", { font: "Impact", bold: false, color: "#ffe600", strokeW: 8 }),
    P("neonpink", "Néon rose", "Pink neon", "Votre texte", { font: "Arial Black", color: "#ffd6f5", fx: "glow", fxColor: "#ff2bd6", fxAmount: 70 }),
    P("neoncyan", "Néon bleu", "Blue neon", "Votre texte", { font: "Arial Black", color: "#d6faff", fx: "glow", fxColor: "#00e5ff", fxAmount: 70 }),
    P("elegant", "Élégant doré", "Golden elegant", "Votre texte", { font: "Georgia", italic: true, grad: true, color: "#fff1b8", color2: "#d4a017", fx: "shadow", fxColor: "#000000", fxAmount: 40 }),
    P("retro", "Rétro", "Retro", "Votre texte", { font: "Trebuchet MS", color: "#ffb347", strokeW: 8, strokeColor: "#7a1f00", fx: "hard", fxColor: "#000000", fxAmount: 60 }),
    P("cinema", "Cinéma", "Cinema", "Votre texte", { font: "Times New Roman", bold: false, upper: true, spacing: 14, fx: "shadow", fxAmount: 50 }),
    P("boxblack", "Boîte noire", "Black box", "Votre texte", { bg: true, bgColor: "#000000", bgOpacity: 85, bgRadius: 15 }),
    P("boxred", "Boîte rouge", "Red box", "Votre texte", { font: "Arial Black", bg: true, bgColor: "#e50914", bgOpacity: 100, bgRadius: 10 }),
    P("bubble", "Bulle jaune", "Yellow bubble", "Votre texte", { font: "Comic Sans MS", color: "#1a1a1a", bg: true, bgColor: "#ffe14d", bgOpacity: 100, bgRadius: 50 }),
    P("outline", "Contour seul", "Outline only", "Votre texte", { font: "Arial Black", color: "#ffffff", opacity: 0, strokeW: 7, strokeColor: "#ffffff" }),
    P("sunset", "Coucher de soleil", "Sunset", "Votre texte", { font: "Impact", bold: false, grad: true, color: "#ffb347", color2: "#ff2fa0", strokeW: 5, strokeColor: "#ffffff" }),
    P("comic", "Bande dessinée", "Comic", "Votre texte", { font: "Comic Sans MS", color: "#ffffff", strokeW: 8, strokeColor: "#1b4cff", fx: "hard", fxColor: "#000000", fxAmount: 55 }),
    P("typewriter", "Machine à écrire", "Typewriter", "Votre texte", { font: "Courier New", color: "#39ff14", bg: true, bgColor: "#000000", bgOpacity: 90, bgRadius: 5 }),
    P("minimal", "Minimal", "Minimal", "Votre texte", { font: "Segoe UI", bold: false, spacing: 6, fx: "shadow", fxAmount: 30 }),
    P("violet", "Dégradé violet", "Purple gradient", "Votre texte", { font: "Verdana", grad: true, color: "#d9c2ff", color2: "#6a5cff", strokeW: 5, strokeColor: "#1b0b3a" })
  ];
  const BY = {}; PRESETS.forEach(p => { BY[p.id] = p; });
  // 8 styles proposés pour les légendes automatiques (police, couleur, contour, ombre, fond)
  const CAPTION_STYLES = [
    P("classic", "Classique", "Classic", "Légende", { strokeW: 6 }),
    P("yellow", "Jaune sous-titre", "Yellow subtitle", "Légende", { font: "Impact", bold: false, color: "#ffe600", strokeW: 8 }),
    P("box", "Boîte noire", "Black box", "Légende", { bg: true, bgColor: "#000000", bgOpacity: 78, bgRadius: 14 }),
    P("neon", "Néon bleu", "Blue neon", "Légende", { font: "Arial Black", color: "#d6faff", fx: "glow", fxColor: "#00e5ff", fxAmount: 60 }),
    P("soft", "Ombre douce", "Soft shadow", "Légende", { font: "Segoe UI", fx: "shadow", fxColor: "#000000", fxAmount: 60 }),
    P("red", "Boîte rouge", "Red box", "Légende", { font: "Arial Black", bg: true, bgColor: "#e50914", bgOpacity: 100, bgRadius: 12 }),
    P("comic", "BD bleue", "Comic blue", "Légende", { font: "Comic Sans MS", color: "#ffffff", strokeW: 8, strokeColor: "#1b4cff", fx: "hard", fxColor: "#000000", fxAmount: 50 }),
    P("gold", "Doré", "Golden", "Légende", { font: "Georgia", italic: true, grad: true, color: "#fff1b8", color2: "#d4a017", fx: "shadow", fxColor: "#000000", fxAmount: 50 })
  ];
  const CAPTION_BY = {}; CAPTION_STYLES.forEach(p => { CAPTION_BY[p.id] = p; });

  // Dessine le texte et renvoie { url, w, h } (PNG transparent)
  function render(text, ts, ref) {
    ts = Object.assign({}, BASE, ts || {});
    const FS = ref || 140, lh = FS * 1.2, up = ts.upper ? String(text).toUpperCase() : String(text);
    const lines = up.split("\n"); if (!lines.length) lines.push("");
    const font = `${ts.italic ? "italic " : ""}${ts.bold ? "bold " : ""}${FS}px ${FONT_CSS[ts.font] || ts.font}`;
    const meas = document.createElement("canvas").getContext("2d");
    meas.font = font; if ("letterSpacing" in meas) meas.letterSpacing = (ts.spacing * FS / 100) + "px";
    const widths = lines.map(l => meas.measureText(l || " ").width);
    const tw = Math.max.apply(null, widths), th = lh * lines.length;
    const stroke = ts.strokeW * FS / 60, glow = ts.fx === "glow" ? ts.fxAmount * FS / 100 * 0.8 : 0;
    const sh = ts.fx === "shadow" ? ts.fxAmount * FS / 100 * 0.25 : ts.fx === "hard" ? ts.fxAmount * FS / 100 * 0.18 : 0;
    const pad = ts.bg ? FS * 0.3 : 0, m = Math.ceil(stroke + glow * 1.6 + sh * 3 + 4);
    let W = Math.ceil(tw + 2 * (pad + m)), H = Math.ceil(th + 2 * (pad + m * 0.6) );
    let k = 1; if (Math.max(W, H) > 4000) k = 4000 / Math.max(W, H);
    const cv = document.createElement("canvas"); cv.width = Math.max(2, Math.round(W * k)); cv.height = Math.max(2, Math.round(H * k));
    const ctx = cv.getContext("2d"); ctx.scale(k, k);
    ctx.font = font; ctx.textBaseline = "middle"; if ("letterSpacing" in ctx) ctx.letterSpacing = (ts.spacing * FS / 100) + "px";
    if (ts.bg) {
      const r = Math.min(ts.bgRadius / 100, 0.5) * Math.min(tw + 2 * pad, th + 2 * pad);
      const x = m, y = m * 0.6, w = tw + 2 * pad, h = th + 2 * pad;
      ctx.save(); ctx.globalAlpha = ts.bgOpacity / 100; ctx.fillStyle = ts.bgColor;
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    const grad = (y0, y1) => { if (!ts.grad) return ts.color; const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, ts.color); g.addColorStop(1, ts.color2); return g; };
    lines.forEach((l, i) => {
      const w = widths[i];
      const x = ts.align === "left" ? m + pad : ts.align === "right" ? m + pad + tw - w : m + pad + (tw - w) / 2;
      const y = m * 0.6 + pad + lh * i + lh / 2;
      ctx.textAlign = "left";
      const alpha = ts.opacity / 100;
      const effect = () => {
        if (ts.fx === "shadow") { ctx.shadowColor = ts.fxColor; ctx.shadowBlur = sh * 2; ctx.shadowOffsetX = sh * 0.6; ctx.shadowOffsetY = sh * 0.9; }
        else if (ts.fx === "hard") { ctx.shadowColor = ts.fxColor; ctx.shadowBlur = 0; ctx.shadowOffsetX = sh; ctx.shadowOffsetY = sh; }
        else if (ts.fx === "glow") { ctx.shadowColor = ts.fxColor; ctx.shadowBlur = glow; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
        else ctx.shadowColor = "transparent";
      };
      ctx.lineJoin = "round"; ctx.miterLimit = 2;
      if (stroke > 0) { ctx.save(); effect(); ctx.strokeStyle = ts.strokeColor; ctx.lineWidth = stroke * 2; ctx.strokeText(l, x, y); ctx.restore(); }
      ctx.save();
      if (stroke <= 0 || ts.fx === "glow") effect();
      if (ts.fx === "glow") { for (let g = 0; g < 2; g++) { ctx.globalAlpha = alpha; ctx.fillStyle = grad(y - lh / 2, y + lh / 2); ctx.fillText(l, x, y); } }
      else { ctx.globalAlpha = alpha; ctx.fillStyle = grad(y - lh / 2, y + lh / 2); ctx.fillText(l, x, y); }
      ctx.restore();
    });
    return { url: cv.toDataURL("image/png"), w: cv.width, h: cv.height };
  }
  const api = { FONTS, PRESETS, BY, CAPTION_STYLES, CAPTION_BY, BASE, render };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.EcomText = api;
})(typeof window !== "undefined" ? window : this);
