// Catalogue des effets vidéo : même rendu pour l'aperçu (CSS/SVG) et pour l'export (FFmpeg).
(function (root) {
  const SEPIA = [0.393, 0.769, 0.189, 0.349, 0.686, 0.168, 0.272, 0.534, 0.131];
  const mixSepia = a => SEPIA.map((v, i) => +(((i % 4 === 0 ? 1 - a : 0) + a * v).toFixed(3)));
  const even = n => Math.max(2, Math.round(n / 2) * 2);
  const eq = (c, s, b) => `eq=contrast=${c}:saturation=${s}${b ? ":brightness=" + b : ""}`;

  // cat : color | film | move | ambient
  // css : filtre CSS d'aperçu • mix : matrice RVB 3x3 (CSS + FFmpeg) • ff : chaîne FFmpeg (bw,bh) => texte
  // deco : vignette / bars • geo : mirror | flip | shake | zoom • fade : fondu • overlay : boucle vidéo (mode écran)
  const L = [
    { id: "bw", name: "Noir & blanc", cat: "color", css: "grayscale(1)", ff: () => "hue=s=0" },
    { id: "bwhi", name: "N&B contrasté", cat: "color", css: "grayscale(1) contrast(1.5)", ff: () => "hue=s=0," + eq(1.5, 1) },
    { id: "neg", name: "Négatif", cat: "color", css: "invert(1)", ff: () => "negate" },
    { id: "sepia", name: "Sépia", cat: "color", mix: SEPIA },
    { id: "warm", name: "Chaud", cat: "color", mix: [1.1, 0, 0, 0, 1, 0, 0, 0, 0.86] },
    { id: "cool", name: "Froid", cat: "color", mix: [0.88, 0, 0, 0, 1, 0, 0, 0, 1.14] },
    { id: "golden", name: "Heure dorée", cat: "color", mix: [1.18, 0.1, 0, 0.04, 1, 0, 0, 0, 0.7] },
    { id: "night", name: "Nuit", cat: "color", css: "brightness(.85)", mix: [0.6, 0, 0.12, 0, 0.78, 0.15, 0, 0, 1.05], ff: () => eq(1, 1, -0.08) },
    { id: "violet", name: "Violet", cat: "color", css: "grayscale(1)", mix: [1, 0, 0, 0, 0.45, 0, 0, 0, 1], pre: "hue=s=0" },
    { id: "matrix", name: "Matrix vert", cat: "color", css: "grayscale(1)", mix: [0.4, 0, 0, 0, 1, 0, 0, 0, 0.4], pre: "hue=s=0" },
    { id: "cyber", name: "Cyberpunk", cat: "color", css: "saturate(1.3)", mix: [1.1, 0, 0.22, 0, 0.8, 0.1, 0.15, 0, 1.2], ff: () => eq(1, 1.3) },
    { id: "pop", name: "Couleurs vives", cat: "color", css: "saturate(1.8)", ff: () => eq(1, 1.8) },
    { id: "muted", name: "Désaturé", cat: "color", css: "saturate(.5)", ff: () => eq(1, 0.5) },
    { id: "hdr", name: "HDR", cat: "color", css: "contrast(1.25) saturate(1.35)", ff: () => eq(1.25, 1.35) },
    { id: "bright", name: "Lumineux", cat: "color", css: "brightness(1.2)", ff: () => eq(1, 1, 0.1) },
    { id: "drama", name: "Dramatique", cat: "color", css: "contrast(1.35) brightness(.88) saturate(.9)", ff: () => eq(1.35, 0.9, -0.06) },
    { id: "faded", name: "Délavé", cat: "color", css: "contrast(.85) brightness(1.08) saturate(.8)", ff: () => eq(0.85, 0.8, 0.07) },
    { id: "poster", name: "Poster", cat: "color", css: "saturate(1.3)", svg: "poster", ff: () => "lutrgb=r='clip(floor(val/51.2)*63.75,0,255)':g='clip(floor(val/51.2)*63.75,0,255)':b='clip(floor(val/51.2)*63.75,0,255)',eq=saturation=1.3" },
    { id: "film", name: "Effet film", cat: "film", css: "contrast(1.15) saturate(.88)", mix: [1.07, 0, -0.03, 0, 1, 0.02, -0.05, 0.02, 1.04], deco: ["vignette", "bars"], ff: () => eq(1.15, 0.88) },
    { id: "bars", name: "Bandes cinéma", cat: "film", deco: ["bars"] },
    { id: "vignette", name: "Vignette", cat: "film", deco: ["vignette"] },
    { id: "vintage", name: "Vintage", cat: "film", css: "contrast(1.1) saturate(.85)", mix: mixSepia(0.45), deco: ["vignette"], ff: () => eq(1.1, 0.85) + ",noise=alls=10:allf=t" },
    { id: "vhs", name: "VHS rétro", cat: "film", css: "saturate(1.25) contrast(1.1)", svg: "vhs", ff: () => "rgbashift=rh=-4:bh=4,noise=alls=14:allf=t," + eq(1.1, 1.25) + ",gblur=sigma=0.8" },
    { id: "glitch", name: "Glitch RVB", cat: "film", svg: "glitch", ff: () => "rgbashift=rh=-10:bh=10:gv=4" },
    { id: "blur", name: "Flou léger", cat: "film", css: "blur(.4cqw)", ff: (bw) => `gblur=sigma=${(bw * 0.004).toFixed(2)}` },
    { id: "blurx", name: "Flou fort", cat: "film", css: "blur(1.2cqw)", ff: (bw) => `gblur=sigma=${(bw * 0.012).toFixed(2)}` },
    { id: "sharp", name: "Netteté", cat: "film", css: "contrast(1.08)", svg: "sharp", ff: () => "unsharp=5:5:1.4:5:5:0.0" },
    { id: "mirror", name: "Miroir", cat: "move", geo: "mirror" },
    { id: "flip", name: "Retourné", cat: "move", geo: "flip" },
    { id: "shake", name: "Tremblement", cat: "move", geo: "shake" },
    { id: "zoom", name: "Zoom pulsé", cat: "move", geo: "zoom" },
    { id: "fade", name: "Fondu", cat: "move", fade: true },
    { id: "fire", name: "Flammes", cat: "ambient", overlay: true },
    { id: "embers", name: "Étincelles", cat: "ambient", overlay: true },
    { id: "snow", name: "Neige", cat: "ambient", overlay: true },
    { id: "rain", name: "Pluie", cat: "ambient", overlay: true },
    { id: "leak", name: "Lumière chaude", cat: "ambient", overlay: true },
    { id: "bokeh", name: "Bokeh", cat: "ambient", overlay: true },
    { id: "glitter", name: "Paillettes", cat: "ambient", overlay: true },
    { id: "smoke", name: "Brume", cat: "ambient", overlay: true },
    { id: "confetti", name: "Confettis", cat: "ambient", overlay: true }
  ];
  const BY = {}; L.forEach(e => { BY[e.id] = e; });
  const CATS = { all: "Tous", color: "Couleur", film: "Film", move: "Mouvement", ambient: "Ambiance" };

  // Réglages d'image du clip : valeurs de -100 à 100 (netteté : 0 à 100)
  function adjVals(a) { a = a || {}; return { F: 1 + (a.brightness || 0) / 100 * 0.5, C: 1 + (a.contrast || 0) / 100 * 0.6, S: 1 + (a.saturation || 0) / 100, sh: a.sharp || 0 }; }
  function adjCss(a) {
    const v = adjVals(a), p = [];
    if (v.F !== 1) p.push(`brightness(${v.F.toFixed(3)})`);
    if (v.C !== 1) p.push(`contrast(${v.C.toFixed(3)})`);
    if (v.S !== 1) p.push(`saturate(${v.S.toFixed(3)})`);
    if (v.sh > 0) p.push(`url(#fxa-sharp${Math.min(20, Math.max(1, Math.round(v.sh / 5)))})`);
    return p.join(" ");
  }
  function adjFf(a) {
    const v = adjVals(a), p = [];
    // un seul filtre « eq » (rapide, sans conversion RVB) : luminosité équivalente aux tons moyens du rendu CSS
    if (v.F !== 1 || v.C !== 1 || v.S !== 1) p.push(`eq=brightness=${(0.5 * (v.F - 1)).toFixed(3)}:contrast=${v.C.toFixed(3)}:saturation=${v.S.toFixed(3)}`);
    if (v.sh > 0) p.push(`unsharp=5:5:${(v.sh / 100 * 1.5).toFixed(2)}:5:5:0`);
    return p;
  }
  const mixCss = m => `${m[0]} ${m[1]} ${m[2]} 0 0 ${m[3]} ${m[4]} ${m[5]} 0 0 ${m[6]} ${m[7]} ${m[8]} 0 0 0 0 0 1 0`;
  const mixFf = m => `colorchannelmixer=rr=${m[0]}:rg=${m[1]}:rb=${m[2]}:gr=${m[3]}:gg=${m[4]}:gb=${m[5]}:br=${m[6]}:bg=${m[7]}:bb=${m[8]}`;
  const zoomF = t => 1 + 0.06 * (1 + Math.sin(2 * Math.PI * 1.2 * t)) / 2;

  // Définitions SVG pour l'aperçu (matrices + filtres spéciaux)
  const SVG_SPECIAL = {
    poster: '<feComponentTransfer><feFuncR type="discrete" tableValues="0 .25 .5 .75 1"/><feFuncG type="discrete" tableValues="0 .25 .5 .75 1"/><feFuncB type="discrete" tableValues="0 .25 .5 .75 1"/></feComponentTransfer>',
    sharp: '<feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" preserveAlpha="true"/>',
    vhs: '<feColorMatrix in="SourceGraphic" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/><feOffset in="r" dx="-3" result="r2"/><feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/><feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/><feOffset in="b" dx="3" result="b2"/><feBlend in="r2" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b2" mode="screen"/>',
    glitch: '<feColorMatrix in="SourceGraphic" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/><feOffset in="r" dx="-8" result="r2"/><feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/><feOffset in="g" dy="3" result="g2"/><feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/><feOffset in="b" dx="8" result="b2"/><feBlend in="r2" in2="g2" mode="screen" result="rg"/><feBlend in="rg" in2="b2" mode="screen"/>'
  };
  function svgDefs() {
    let s = "";
    L.forEach(e => { if (e.mix) s += `<filter id="fxm-${e.id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${mixCss(e.mix)}"/></filter>`; });
    for (let n = 1; n <= 20; n++) { const a = (n / 20 * 0.7).toFixed(3), c = (1 + 4 * a).toFixed(3); s += `<filter id="fxa-sharp${n}" color-interpolation-filters="sRGB"><feConvolveMatrix order="3" kernelMatrix="0 -${a} 0 -${a} ${c} -${a} 0 -${a} 0" preserveAlpha="true"/></filter>`; }
    Object.keys(SVG_SPECIAL).forEach(k => { s += `<filter id="fxs-${k}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">${SVG_SPECIAL[k]}</filter>`; });
    return s;
  }

  // Aperçu : états CSS pour une liste d'effets à l'instant local tl (durée D)
  function preview(ids, tl, D, adj) {
    const r = { css: "", vig: false, bars: false, overlays: [], tf: "", opacity: 1 };
    const css = [adjCss(adj)];
    (ids || []).forEach(id => {
      const e = BY[id]; if (!e) return;
      if (e.css) css.push(e.css);
      if (e.mix) css.push(`url(#fxm-${e.id})`);
      if (e.svg) css.push(`url(#fxs-${e.svg})`);
      if (e.deco) { if (e.deco.indexOf("vignette") >= 0) r.vig = true; if (e.deco.indexOf("bars") >= 0) r.bars = true; }
      if (e.overlay) r.overlays.push(e.id);
      if (e.geo === "mirror") r.tf += "scaleX(-1) ";
      if (e.geo === "flip") r.tf += "scaleY(-1) ";
      if (e.geo === "shake") r.tf += `translate(${(-Math.sin(tl * 38) * 1.296).toFixed(3)}%,${(-Math.cos(tl * 31) * 1.296).toFixed(3)}%) scale(1.08) `;
      if (e.geo === "zoom") r.tf += `scale(${zoomF(tl).toFixed(4)}) `;
      if (e.fade) r.opacity = Math.max(0, Math.min(1, tl / 0.5, (D - tl) / 0.5));
    });
    r.css = css.filter(Boolean).join(" ");
    return r;
  }

  // Export : chaîne de filtres FFmpeg (couleur puis géométrie puis fondu) pour un clip.
  // box = [bw, bh] ; cw/ch = taille du contenu (peut être null) ; D = durée.
  function ffChain(ids, bw, bh, cw, ch, D, opts) {
    const parts = adjFf(opts && opts.adj);
    (ids || []).forEach(id => {
      const e = BY[id]; if (!e || e.overlay || e.geo || e.fade) return;
      if (e.pre) parts.push(e.pre);
      if (e.mix) parts.push(mixFf(e.mix));
      if (e.ff) parts.push(e.ff(bw, bh));
      if (e.deco && e.deco.indexOf("bars") >= 0) parts.push("drawbox=x=0:y=0:w=iw:h=ih*0.1:color=black:t=fill,drawbox=x=0:y=ih*0.9:w=iw:h=ih*0.1:color=black:t=fill");
      if (e.deco && e.deco.indexOf("vignette") >= 0) parts.push("vignette=angle=PI/4.5");
    });
    (ids || []).forEach(id => {
      const e = BY[id]; if (!e || !e.geo) return;
      if (e.geo === "mirror") parts.push("hflip");
      if (e.geo === "flip") parts.push("vflip");
      if ((opts && opts.noGeo) || !cw || !ch) return;
      if (e.geo === "shake") parts.push(`scale=${even(cw * 1.08)}:${even(ch * 1.08)},crop=${cw}:${ch}:x='(iw-ow)/2+sin(t*38)*iw*0.012':y='(ih-oh)/2+cos(t*31)*ih*0.012'`);
      if (e.geo === "zoom") parts.push(`format=rgba,scale=w='${cw}*(1+0.06*(1+sin(2*PI*1.2*t))/2)':h='${ch}*(1+0.06*(1+sin(2*PI*1.2*t))/2)':eval=frame,crop=${cw}:${ch}:x='(iw-ow)/2':y='(ih-oh)/2'`);
    });
    return parts;
  }
  const ffFade = (ids, D) => (ids || []).some(id => BY[id] && BY[id].fade) ? `format=rgba,fade=t=in:st=0:d=0.5:alpha=1,fade=t=out:st=${Math.max(0, D - 0.5).toFixed(3)}:d=0.5:alpha=1` : "";
  const overlaysOf = ids => (ids || []).filter(id => BY[id] && BY[id].overlay);

  const api = { adjCss, adjFf, LIST: L, BY, CATS, svgDefs, preview, ffChain, ffFade, overlaysOf, mixSepia, even };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.EcomFX = api;
})(typeof window !== "undefined" ? window : this);
