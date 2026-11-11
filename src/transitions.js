// Transitions entre deux clips : mêmes formules pour l'aperçu (JS) et pour l'export (expressions FFmpeg).
// Modèle : le clip B possède « trans ». Pendant les d premières secondes de B, la dernière image du clip A
// précédent (« fantôme ») sort pendant que B entre. e = progression adoucie (0→1), p = progression linéaire.
(function (root) {
  /* ---------- mini évaluateur d'expressions (syntaxe compatible FFmpeg, sans eval) ---------- */
  const cache = {};
  const FN = {
    sin: Math.sin, cos: Math.cos, abs: Math.abs, min: Math.min, max: Math.max, pow: Math.pow, sqrt: Math.sqrt,
    hypot: Math.hypot, clip: (x, a, b) => Math.min(b, Math.max(a, x)), lt: (a, b) => (a < b ? 1 : 0), gt: (a, b) => (a > b ? 1 : 0)
  };
  function compile(src) {
    if (cache[src]) return cache[src];
    const toks = src.match(/\d*\.?\d+(?:e[+-]?\d+)?|[A-Za-z_]\w*|[-+*\/(),]/g) || [];
    let i = 0;
    function primary() {
      const t = toks[i++];
      if (t === "(") { const n = expr(); i++; return n; }
      if (/^[\d.]/.test(t)) { const v = parseFloat(t); return () => v; }
      if (toks[i] === "(") {
        i++; const args = [];
        if (toks[i] !== ")") { args.push(expr()); while (toks[i] === ",") { i++; args.push(expr()); } }
        i++; const f = FN[t];
        return v => f.apply(null, args.map(a => a(v)));
      }
      if (t === "PI") return () => Math.PI;
      return v => v[t];
    }
    function unary() { if (toks[i] === "-") { i++; const n = unary(); return v => -n(v); } if (toks[i] === "+") { i++; return unary(); } return primary(); }
    function term() { let l = unary(); while (toks[i] === "*" || toks[i] === "/") { const op = toks[i++], r = unary(), a = l; l = op === "*" ? v => a(v) * r(v) : v => a(v) / r(v); } return l; }
    function expr() { let l = term(); while (toks[i] === "+" || toks[i] === "-") { const op = toks[i++], r = term(), a = l; l = op === "+" ? v => a(v) + r(v) : v => a(v) - r(v); } return l; }
    return (cache[src] = expr());
  }
  const ev = (src, vars) => compile(String(src))(vars);

  /* ---------- catalogue ---------- */
  const NEUTRAL = { dx: "0", dy: "0", s: "1", rot: "0" };
  const mk = (id, name, en, cat, spec) => Object.assign({ id, name, en, cat, b: {}, g: {} }, spec);
  const LIST = [
    mk("fade", "Fondu", "Crossfade", "classic", { b: { op: "p" } }),
    mk("dipblack", "Fondu au noir", "Dip to black", "classic", { flash: "black", bAt: 0.5, gUntil: 0.5 }),
    mk("dipwhite", "Flash blanc", "White flash", "classic", { flash: "white", bAt: 0.5, gUntil: 0.5 }),
    mk("pushL", "Pousser à gauche", "Push left", "push", { b: { dx: "1-e" }, g: { dx: "-e" } }),
    mk("pushR", "Pousser à droite", "Push right", "push", { b: { dx: "-(1-e)" }, g: { dx: "e" } }),
    mk("pushU", "Pousser vers le haut", "Push up", "push", { b: { dy: "1-e" }, g: { dy: "-e" } }),
    mk("pushD", "Pousser vers le bas", "Push down", "push", { b: { dy: "-(1-e)" }, g: { dy: "e" } }),
    mk("slideL", "Glisser à gauche", "Slide left", "push", { b: { dx: "1-e" } }),
    mk("slideR", "Glisser à droite", "Slide right", "push", { b: { dx: "-(1-e)" } }),
    mk("slideU", "Glisser vers le haut", "Slide up", "push", { b: { dy: "1-e" } }),
    mk("slideD", "Glisser vers le bas", "Slide down", "push", { b: { dy: "-(1-e)" } }),
    mk("wipeR", "Volet vers la droite", "Wipe right", "shape", { mask: "wipeR" }),
    mk("wipeL", "Volet vers la gauche", "Wipe left", "shape", { mask: "wipeL" }),
    mk("wipeD", "Volet vers le bas", "Wipe down", "shape", { mask: "wipeD" }),
    mk("circle", "Iris (cercle)", "Iris (circle)", "shape", { mask: "circle" }),
    mk("zoomIn", "Zoom avant", "Zoom in", "shape", { b: { s: "0.4+0.6*e", op: "p" } }),
    mk("zoomOut", "Zoom arrière", "Zoom out", "shape", { b: { op: "p" }, g: { s: "1+0.8*e" } }),
    mk("spin", "Rotation", "Spin", "shape", { b: { rot: "(1-e)*PI*0.5", s: "0.3+0.7*e", op: "p" } }),
    mk("flip", "Retournement 3D", "3D flip", "3d", { td: "flip", axis: "y", flipAt: 0.5 }),
    mk("flipV", "Bascule 3D", "3D tilt", "3d", { td: "flip", axis: "x", flipAt: 0.5 }),
    mk("cube", "Cube 3D", "3D cube", "3d", { td: "cube", axis: "y" }),
    mk("cubeV", "Cube 3D vertical", "3D cube (vertical)", "3d", { td: "cube", axis: "x" }),
    mk("door", "Porte 3D", "3D door", "3d", { td: "door", axis: "y", gTop: true })
  ];
  const BY = {}; LIST.forEach(t => { BY[t.id] = t; });
  const CATS = { all: "Tous", classic: "Fondus", push: "Glissements", shape: "Formes", "3d": "3D" };
  const ease = p => p * p * (3 - 2 * p);

  /* ---------- 3D : coins projetés (formules en texte, évaluées en JS pour l'aperçu et envoyées à FFmpeg) ---------- */
  // side : "g" (fantôme) ou "b" (clip entrant). a,b : dimensions du cadre. ua,ub : demi-étendues du plan dont on veut les coins.
  function corners(tr, side, a, b, ua, ub, ccx, ccy) {
    const horiz = tr.axis !== "x";            // axe de rotation vertical (y) = bascule horizontale
    const L = horiz ? a : b;                  // longueur le long de la rotation
    const f = (2.2 * L).toFixed(2);
    let th, ph;
    if (tr.td === "flip") th = side === "g" ? "(-e*PI)" : "((1-e)*PI)";
    if (tr.td === "door") th = "(e*PI/2)";
    if (tr.td === "cube") ph = "(e*PI/2)";
    const out = [];
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
      const u = horiz ? sx * ua : sy * ub, v = horiz ? sy * ub : sx * ua;
      const h = L / 2; let X, Z;
      if (tr.td === "flip") { X = `(${u})*cos${th}`; Z = `(${u})*sin${th}`; }
      else if (tr.td === "door") { if (side === "b") { X = `(${u})`; Z = "0"; } else { X = `((${u})+${h})*cos${th}-${h}`; Z = `((${u})+${h})*sin${th}`; } }
      else if (side === "g") { X = `(${u})*cos${ph}-${h}*sin${ph}`; Z = `-(${u})*sin${ph}-${h}*cos${ph}+${h}`; }
      else { X = `${h}*cos${ph}+(${u})*sin${ph}`; Z = `-${h}*sin${ph}+(${u})*cos${ph}+${h}`; }
      const k = `(${f}/(${f}+(${Z})))`;
      const cx = ccx == null ? a / 2 : ccx, cy = ccy == null ? b / 2 : ccy;
      out.push(horiz ? [`${cx}+(${X})*${k}`, `${cy}+(${v})*${k}`] : [`${cx}+(${v})*${k}`, `${cy}+(${X})*${k}`]);
    });
    return out;
  }
  // Homographie : carré unité [0,w]x[0,h] -> quadrilatère dst (4 coins : HG, HD, BG, BD) ; renvoie un matrix3d CSS
  function matrix3d(w, h, dst) {
    const src = [[0, 0], [w, 0], [0, h], [w, h]];
    const A = [], B = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [X, Y] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]); B.push(X);
      A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]); B.push(Y);
    }
    const n = 8;
    for (let c = 0; c < n; c++) {
      let m = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
      [A[c], A[m]] = [A[m], A[c]]; [B[c], B[m]] = [B[m], B[c]];
      if (Math.abs(A[c][c]) < 1e-9) return "none";
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; B[r] -= f * B[c]; }
    }
    const x = new Array(n);
    for (let r = n - 1; r >= 0; r--) { let s = B[r]; for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]; x[r] = s / A[r][r]; }
    const [a, b, c, d, e, f, g, hh] = x;
    return `matrix3d(${a},${d},0,${g}, ${b},${e},0,${hh}, 0,0,1,0, ${c},${f},0,1)`;
  }

  // État d'une couche (fantôme "g" ou entrant "b") à la progression p (0→1), pour un cadre Fw×Fh.
  function layerState(tr, side, p, Fw, Fh) {
    const e = ease(Math.max(0, Math.min(1, p))), vars = { e, p };
    const L = tr[side] || {}, st = { visible: true, opacity: 1, transform: "", clip: "", z: side === "g" && tr.gTop ? 2 : 1 };
    if (tr.bAt != null && side === "b") st.visible = p >= tr.bAt;
    if (tr.gUntil != null && side === "g") st.visible = p < tr.gUntil;
    if (tr.flipAt != null) st.visible = side === "g" ? p < tr.flipAt : p >= tr.flipAt;
    if (L.op) st.opacity = Math.max(0, Math.min(1, ev(L.op, vars)));
    if (tr.td) {
      if (tr.td === "door" && side === "b") return st;
      const q = corners(tr, side, Fw, Fh, Fw / 2, Fh / 2).map(c => [ev(c[0], vars), ev(c[1], vars)]);
      st.transform = matrix3d(Fw, Fh, q);
      return st;
    }
    const dx = ev(L.dx || NEUTRAL.dx, vars), dy = ev(L.dy || NEUTRAL.dy, vars), s = ev(L.s || NEUTRAL.s, vars), rot = ev(L.rot || NEUTRAL.rot, vars);
    st.transform = `translate(${(dx * 100).toFixed(3)}%,${(dy * 100).toFixed(3)}%) rotate(${rot.toFixed(4)}rad) scale(${Math.max(0.001, s).toFixed(4)})`;
    if (side === "b" && tr.mask) {
      const r = (1 - e) * 100, c = 100 - e * 100; // inset en %
      if (tr.mask === "wipeR") st.clip = `inset(0 ${r.toFixed(2)}% 0 0)`;
      if (tr.mask === "wipeL") st.clip = `inset(0 0 0 ${r.toFixed(2)}%)`;
      if (tr.mask === "wipeD") st.clip = `inset(0 0 ${r.toFixed(2)}% 0)`;
      if (tr.mask === "circle") st.clip = `circle(${(e * 70.8).toFixed(2)}% at 50% 50%)`;
    }
    return st;
  }

  // Substitue p/e (progression) par leurs expressions FFmpeg pour la variable de temps tv et la durée d
  function ffSub(expr, tv, d) {
    const P = `min(1,max(0,(${tv})/${d}))`, E = `((${P})*(${P})*(3-2*(${P})))`;
    return String(expr).replace(/\be\b/g, E).replace(/\bp\b/g, P);
  }
  const api = { LIST, BY, CATS, ease, compile, ev, corners, matrix3d, layerState, ffSub };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.EcomTR = api;
})(typeof window !== "undefined" ? window : this);
