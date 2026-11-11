// Animations des stickers : mêmes formules pour l'aperçu (JS) et pour l'export (expressions FFmpeg).
(function (root) {
  const PI = Math.PI;
  const IN = 0.4, OUT = 0.25; // apparition « pop » puis disparition
  const LOOPS = {
    none:   { label: "Aucune boucle" },
    pulse:  { label: "Pulsation",   s: "1+0.08*sin(2*PI*1.6*t)",           f: t => ({ s: 1 + 0.08 * Math.sin(2 * PI * 1.6 * t) }) },
    beat:   { label: "Battement",   s: "1+0.14*pow(abs(sin(PI*1.8*t)),6)", f: t => ({ s: 1 + 0.14 * Math.pow(Math.abs(Math.sin(PI * 1.8 * t)), 6) }) },
    tap:    { label: "Clic",        s: "1-0.14*pow(abs(sin(PI*1.2*t)),4)", f: t => ({ s: 1 - 0.14 * Math.pow(Math.abs(Math.sin(PI * 1.2 * t)), 4) }) },
    bounce: { label: "Rebond",      dy: "-0.05*abs(sin(PI*1.6*t))",        f: t => ({ dy: -0.05 * Math.abs(Math.sin(PI * 1.6 * t)) }) },
    wiggle: { label: "Balancement", rot: "0.22*sin(2*PI*2*t)",             f: t => ({ rot: 0.22 * Math.sin(2 * PI * 2 * t) }) },
    shake:  { label: "Tremblement", dx: "0.018*sin(2*PI*6*t)",             f: t => ({ dx: 0.018 * Math.sin(2 * PI * 6 * t) }) },
    spin:   { label: "Rotation",    rot: "2*PI*t/3",                       f: t => ({ rot: 2 * PI * t / 3 }) },
    float:  { label: "Flottement",  dy: "0.02*sin(2*PI*0.8*t)",            f: t => ({ dy: 0.02 * Math.sin(2 * PI * 0.8 * t) }) },
    slideR: { label: "Va à droite", dx: "0.04*abs(sin(PI*1.4*t))",         f: t => ({ dx: 0.04 * Math.abs(Math.sin(PI * 1.4 * t)) }) },
    slideL: { label: "Va à gauche", dx: "-0.04*abs(sin(PI*1.4*t))",        f: t => ({ dx: -0.04 * Math.abs(Math.sin(PI * 1.4 * t)) }) },
    slideD: { label: "Va en bas",   dy: "0.04*abs(sin(PI*1.4*t))",         f: t => ({ dy: 0.04 * Math.abs(Math.sin(PI * 1.4 * t)) }) },
    slideU: { label: "Va en haut",  dy: "-0.04*abs(sin(PI*1.4*t))",        f: t => ({ dy: -0.04 * Math.abs(Math.sin(PI * 1.4 * t)) }) }
  };
  const ease = x => { x = Math.min(x, 1); const y = x - 1; return 1 + 2.70158 * y * y * y + 1.70158 * y * y; };

  // Valeurs à l'instant local t (secondes depuis le début du clip) pour un clip de durée D.
  function at(loop, t, D, noEnv) {
    const L = LOOPS[loop] || LOOPS.none;
    const r = Object.assign({ s: 1, dx: 0, dy: 0, rot: 0 }, L.f ? L.f(t) : {});
    if (!noEnv) r.s *= ease(t / IN) * Math.min(1, Math.max(0, (D - t) / OUT));
    return r;
  }
  // Expressions FFmpeg équivalentes (variable « t » = temps local du clip).
  function exprs(loop, D, noEnv) {
    const L = LOOPS[loop] || LOOPS.none;
    const X = "(min(t/" + IN + ",1)-1)";
    const env = "(1+2.70158*" + X + "*" + X + "*" + X + "+1.70158*" + X + "*" + X + ")*min(1,max(0,(" + D.toFixed(3) + "-t)/" + OUT + "))";
    return { s: noEnv ? "(" + (L.s || "1") + ")" : "(" + env + ")*(" + (L.s || "1") + ")", dx: L.dx || "0", dy: L.dy || "0", rot: L.rot || "0" };
  }
  const api = { LOOPS, at, exprs, IN, OUT };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.EcomAnim = api;
})(typeof window !== "undefined" ? window : this);
