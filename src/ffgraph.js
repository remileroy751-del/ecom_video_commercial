// Construction des commandes FFmpeg (module sans dépendance Electron, testable seul)
const FPS = 30;
const anim = require('./anim');
const fxlib = require('./effects');
const trlib = require('./transitions');
const path = require('path');

const SIZES = {
  '1080': { '16:9': [1920, 1080], '9:16': [1080, 1920], '4:5': [1080, 1350], '1:1': [1080, 1080] },
  '720': { '16:9': [1280, 720], '9:16': [720, 1280], '4:5': [720, 900], '1:1': [720, 720] },
  '480': { '16:9': [854, 480], '9:16': [480, 854], '4:5': [480, 600], '1:1': [480, 480] }
};
const CRF = { '1080': '20', '720': '22', '480': '26' };
function resolutionFor(ratio, quality) { const t = (SIZES[quality] || SIZES['1080'])[ratio] || SIZES['1080']['16:9']; return { w: t[0], h: t[1] }; }

function num(n, d = 3) { return Number(n).toFixed(d); }
const isStill = t => t === 'image' || t === 'sticker' || t === 'text';

// Ajoute les entrées audio à `args` et renvoie les filtres de mixage.
function audioGraph(sources, total, firstIdx, args) {
  if (!sources || !sources.length) return null;
  const filters = [], labels = [];
  sources.forEach((s, i) => {
    args.push('-ss', num(s.inPoint || 0), '-t', num(s.duration), '-i', s.path);
    const k = firstIdx + i;
    const vol = Math.max(0, Math.min(2, (s.volume == null ? 100 : s.volume) / 100));
    const ms = Math.round((s.start || 0) * 1000);
    let f = `[${k}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=${vol.toFixed(2)}`;
    if (ms > 0) f += `,adelay=${ms}:all=1`;
    f += `,apad=whole_dur=${num(total)}[a${i}]`;
    filters.push(f);
    labels.push(`[a${i}]`);
  });
  const n = sources.length;
  if (n === 1) filters.push(`${labels[0]}alimiter=limit=0.95[aout]`);
  else filters.push(`${labels.join('')}amix=inputs=${n}:duration=longest:dropout_transition=0,volume=${n},alimiter=limit=0.95[aout]`);
  return { filters, label: 'aout' };
}

// Clips à dessiner : tri par piste/temps + « fantômes » (dernière image du clip précédent) pour les transitions.
function prepareClips(o) {
  const list = [...(o.video || [])].sort((a, b) => a.track - b.track || a.start - b.start);
  const out = [];
  list.forEach(c0 => {
    let c = c0;
    const t = c.trans && trlib.BY[c.trans.id];
    if (!c.noTrans && t && (c.type === 'video' || c.type === 'image')) {
      const prev = list.find(a => a !== c && a.track === c.track && (a.type === 'video' || a.type === 'image') && Math.abs(a.start + a.duration - c.start) < 0.12);
      if (prev) {
        const d = Math.max(0.2, Math.min(+c.trans.dur || 0.8, c.duration * 0.9));
        const pin = prev.inPoint || 0;
        out.push(Object.assign({}, prev, { ghost: true, start: c.start, duration: d, inPoint: Math.max(pin, Math.min(pin + prev.duration - 0.07, prev.mediaDur > 0 ? prev.mediaDur - 0.12 : Infinity)), scale: c.scale, x: c.x, y: c.y, trans: null, _tr: t, _d: d }));
        c = Object.assign({}, c, { _tr: t, _d: d });
      }
    }
    out.push(c);
  });
  return out;
}

// Textes simples (sans animation) d'une même piste, non chevauchants : fusionnés en UN seul flux (export rapide avec des centaines de légendes)
function groupSimpleText(list, W, H) {
  const byTrack = {};
  list.forEach(c => {
    if (c.type !== 'text' || c.ghost || (c.anim && c.anim !== 'none') || c.env !== false || c.noAnim) return;
    const k = Math.min(3, Math.max(0.05, (c.scale == null ? 100 : c.scale) / 100)) * Math.min(W, H) / 1080;
    const tw = fxlib.even((c.srcW || 100) * k), th = fxlib.even((c.srcH || 40) * k);
    if (tw > W || th > H) return;
    (byTrack[c.track] = byTrack[c.track] || []).push({ c, tw, th });
  });
  const groups = [];
  Object.keys(byTrack).forEach(t => {
    const arr = byTrack[t].sort((a, b) => a.c.start - b.c.start), seq = [];
    let cursor = -1;
    arr.forEach(it => { if (it.c.start >= cursor - 1e-3) { seq.push(it); cursor = it.c.start + it.c.duration; } });
    if (seq.length >= 6) groups.push(seq);
  });
  return groups;
}

// Couche animée d'une transition (fantôme "g" ou clip entrant "b") : renvoie { label, ox, oy }
function transLayer(fc, label, T, side, d, g, tag) {
  const L = T[side] || {};
  const has = k => L[k] && L[k] !== '0' && L[k] !== '1';
  let ox = `(W-w)/2+(${g.dx})`, oy = `(H-h)/2+(${g.dy})`;
  let chain = '';
  if (T.td && !(T.td === 'door' && side === 'b')) {
    const m = Math.round(Math.max(g.bw, g.bh) * 0.3), PW = g.bw + 2 * m, PH = g.bh + 2 * m;
    const q = trlib.corners(T, side, g.bw, g.bh, g.bw / 2 + m, g.bh / 2 + m, PW / 2, PH / 2).map(c => c.map(x => trlib.ffSub(x, 'in/' + FPS, num(d))));
    chain = `format=rgba,pad=${g.bw}:${g.bh}:(ow-iw)/2:(oh-ih)/2:color=0x00000000,pad=${PW}:${PH}:${m}:${m}:color=0x00000000,format=gbrap,` +
      `perspective=x0='${q[0][0]}':y0='${q[0][1]}':x1='${q[1][0]}':y1='${q[1][1]}':x2='${q[2][0]}':y2='${q[2][1]}':x3='${q[3][0]}':y3='${q[3][1]}':sense=destination:eval=frame,format=rgba`;
  } else {
    const parts = [];
    const hasS = L.s && L.s !== '1', hasRot = L.rot && L.rot !== '0';
    if (hasS || hasRot || L.op || T.mask) parts.push('format=rgba');
    if (hasRot) parts.push(`rotate=a='${trlib.ffSub(L.rot, 't', num(d))}':c=none:ow='hypot(iw,ih)':oh='hypot(iw,ih)'`);
    if (hasS) { const S = trlib.ffSub(L.s, 't', num(d)); parts.push(`scale=w='max(2,iw*(${S}))':h='max(2,ih*(${S}))':eval=frame`); }
    if (L.op === 'p') parts.push(`fade=t=in:st=0:d=${num(d)}:alpha=1`);
    chain = parts.join(',');
    const lt = e => trlib.ffSub(e, 't', num(d));
    if (has('dx')) ox += `+(${lt(L.dx).replace(/\bt\b/g, '(t-' + g.startStr + ')')})*${g.bw}`;
    if (has('dy')) oy += `+(${lt(L.dy).replace(/\bt\b/g, '(t-' + g.startStr + ')')})*${g.bh}`;
  }
  let cur = label;
  if (chain) { fc.push(`[${cur}]${chain}[${tag}a]`); cur = `${tag}a`; }
  if (side === 'b' && T.mask) {
    const mw = 160, mh = Math.max(8, Math.round(160 * (g.ch || g.bh) / (g.cw || g.bw)));
    const E = trlib.ffSub('e', 'T', num(d));
    const expr = { wipeR: `255*lte(X/W,${E})`, wipeL: `255*gte(X/W,1-(${E}))`, wipeD: `255*lte(Y/H,${E})`,
      circle: `255*lte(hypot(X/W-0.5,(Y/H-0.5)*H/W)/hypot(0.5,0.5*H/W),${E})` }[T.mask];
    fc.push(`nullsrc=s=${mw}x${mh}:r=${FPS}:d=${num(d)},format=gray,geq=lum='${expr.replace(/lte\(/g, 'lte(').replace(/gte\(/g, 'gte(')}',scale=${g.cw || g.bw}:${g.ch || g.bh}[${tag}k]`);
    fc.push(`[${cur}][${tag}k]alphamerge[${tag}m]`);
    cur = `${tag}m`;
  }
  return { label: cur, ox, oy };
}

// Commande d'export : fond noir + clips vidéo/photo/sticker/texte superposés (V1 en bas, V3 en haut) + mix audio + légendes.
function buildExportArgs(o, res, burn, output) {
  const W = res.w, H = res.h;
  const total = Math.max(Number(o.total) || 0.1, 0.1);
  const args = ['-y', '-hide_banner', '-f', 'lavfi', '-i', `color=c=black:s=${W}x${H}:r=${FPS}:d=${num(total)}`];
  const fc = [];
  let last = '0:v', idx = 1, uid = 0;
  const overlayLine = (label, ox, oy, start, end) => {
    const n = 'o' + (uid++);
    fc.push(`[${last}][${label}]overlay=x='${ox}':y='${oy}':format=auto:eof_action=pass:enable='between(t,${num(start)},${num(end)})'[${n}]`);
    last = n;
  };
  let pendingGhost = null;
  const prepared = prepareClips(o), groups = groupSimpleText(prepared, W, H), inGroup = new Map();
  groups.forEach(g => g.forEach((it, k) => inGroup.set(it.c, { g, first: k === 0 })));
  const items = [];
  prepared.forEach(c => { const m = inGroup.get(c); if (!m) items.push({ c }); else if (m.first) items.push({ group: m.g }); });
  items.forEach((item, i) => {
    if (item.group) {
      const seq = item.group; let cursor = 0; const labels = [];
      seq.forEach((it, k) => {
        const c = it.c, gap = c.start - cursor, n = Math.max(1, Math.round(c.duration * FPS));
        if (gap > 0.5 / FPS) { fc.push(`color=c=black:s=${W}x${H}:r=${FPS},format=rgba,colorchannelmixer=aa=0,trim=end_frame=${Math.round(gap * FPS)},setpts=N/(${FPS}*TB)[tg${i}g${k}]`); labels.push(`[tg${i}g${k}]`); }
        const myIdx = idx++; args.push('-i', c.path);
        const px = Math.max(0, Math.min(W - it.tw, Math.round(W / 2 + (c.x || 0) / 100 * W - it.tw / 2))), py = Math.max(0, Math.min(H - it.th, Math.round(H / 2 + (c.y || 0) / 100 * H - it.th / 2)));
        fc.push(`[${myIdx}:v]format=rgba,scale=${it.tw}:${it.th},setsar=1,pad=${W}:${H}:${px}:${py}:color=0x00000000,loop=loop=${n - 1}:size=1:start=0,setpts=N/(${FPS}*TB),fps=${FPS}[tg${i}c${k}]`);
        labels.push(`[tg${i}c${k}]`); cursor = c.start + n / FPS;
      });
      fc.push(`${labels.join('')}concat=n=${labels.length}:v=1:a=0,setpts=PTS-STARTPTS[tgs${i}]`);
      overlayLine(`tgs${i}`, '0', '0', seq[0].c.start, cursor);
      return;
    }
    const c = item.c;
    const ghost = !!c.ghost, still = isStill(c.type), ovAnim = c.type === 'sticker' || c.type === 'text';
    const myIdx = idx++;
    if (still) args.push('-loop', '1', '-framerate', String(FPS), '-t', num(c.duration), '-i', c.path);
    else if (ghost) args.push('-ss', num(c.inPoint), '-t', '0.5', '-i', c.path);
    else args.push('-ss', num(c.inPoint || 0), '-t', num(c.duration), '-i', c.path);
    const ovs = (!ghost && !ovAnim && !c.noFx && o.fxDir) ? fxlib.overlaysOf(c.fx) : [];
    const ovIdx = ovs.map(id => { args.push('-stream_loop', '-1', '-t', num(c.duration), '-i', path.join(o.fxDir, `fx_${id}.mp4`)); return idx++; });
    const s = Math.max(0.05, Math.min(3, (c.scale == null ? 100 : c.scale) / 100));
    const bw = Math.max(2, Math.round((W * s) / 2) * 2), bh = Math.max(2, Math.round((H * s) / 2) * 2);
    const dx = Math.round(((c.x || 0) / 100) * W), dy = Math.round(((c.y || 0) / 100) * H);
    const start = num(c.start), end = num(c.start + c.duration);
    let chain = `[${myIdx}:v]fps=${FPS},`;
    if (ghost && !still) chain += `trim=end_frame=1,loop=loop=-1:size=1:start=0,trim=duration=${num(c.duration)},setpts=PTS-STARTPTS,`;
    if (still) chain += 'format=rgba,';
    let ox = `(W-w)/2+(${dx})`, oy = `(H-h)/2+(${dy})`;
    let cw = null, ch = null;
    if (!ovAnim) {
      if (c.fit === 'fill') { cw = bw; ch = bh; }
      else if (c.srcW && c.srcH) { const k = Math.min(bw / c.srcW, bh / c.srcH); cw = fxlib.even(c.srcW * k); ch = fxlib.even(c.srcH * k); }
    }
    if (c.type === 'text') { // texte : taille naturelle (la taille se règle avec « scale », indépendante de la longueur du texte)
      const k = Math.max(0.05, Math.min(3, (c.scale == null ? 100 : c.scale) / 100)) * Math.min(W, H) / 1080;
      chain += `scale=${fxlib.even((c.srcW || 100) * k)}:${fxlib.even((c.srcH || 40) * k)},setsar=1`;
    } else if (c.fit === 'fill' && !ovAnim) chain += `scale=${bw}:${bh}:force_original_aspect_ratio=increase,crop=${bw}:${bh},setsar=1`;
    else if (cw) chain += `scale=${cw}:${ch},setsar=1`;
    else chain += `scale=${bw}:${bh}:force_original_aspect_ratio=decrease,setsar=1`;
    if (!ovAnim && !c.noFx) {
      const parts = fxlib.ffChain(c.fx, bw, bh, cw, ch, c.duration, { noGeo: ghost, adj: c.adj });
      if (parts.length) chain += ',' + parts.join(',');
    }
    if (ovAnim && !c.noAnim) {
      const A = anim.exprs(c.anim || 'none', c.duration, c.env === false);
      if (A.rot !== '0') chain += `,rotate=a='${A.rot}':c=none:ow='hypot(iw,ih)':oh='hypot(iw,ih)'`;
      chain += `,scale=w='max(2,iw*(${A.s}))':h='max(2,ih*(${A.s}))':eval=frame`;
      const lt = e => e.replace(/\bt\b/g, `(t-${start})`);
      if (A.dx !== '0') ox += `+(${lt(A.dx)})*W`;
      if (A.dy !== '0') oy += `+(${lt(A.dy)})*H`;
    }
    const blendPath = ovs.length > 0 && cw;
    if (blendPath) chain += ',format=gbrp';
    let cur = `c${i}`;
    fc.push(`${chain}[${cur}]`);
    if (blendPath) ovs.forEach((id, k) => {
      fc.push(`[${ovIdx[k]}:v]fps=${FPS},scale=${cw}:${ch}:force_original_aspect_ratio=increase,crop=${cw}:${ch},format=gbrp[f${i}_${k}]`);
      fc.push(`[${cur}][f${i}_${k}]blend=all_mode=screen:shortest=1[m${i}_${k}]`);
      cur = `m${i}_${k}`;
    });
    const fade = !ovAnim && !ghost && !c.noFx ? fxlib.ffFade(c.fx, c.duration) : '';
    if (fade) { fc.push(`[${cur}]${fade}[fd${i}]`); cur = `fd${i}`; }

    const geom = { bw, bh, cw, ch, dx, dy, startStr: start };
    if (ghost) {
      // fantôme : image figée du clip précédent, animée selon la transition
      const T = c._tr, d = c._d;
      const L = transLayer(fc, cur, T, 'g', d, geom, `tg${i}`);
      fc.push(`[${L.label}]setpts=PTS-STARTPTS+${start}/TB[gv${i}]`);
      pendingGhost = { label: `gv${i}`, ox: L.ox, oy: L.oy, T, d, start: c.start };
      return;
    }
    if (c._tr && pendingGhost) {
      const T = c._tr, d = c._d, gh = pendingGhost; pendingGhost = null;
      fc.push(`[${cur}]split=2[bi${i}][br${i}]`);
      fc.push(`[bi${i}]trim=duration=${num(d)},setpts=PTS-STARTPTS[bit${i}]`);
      const L = transLayer(fc, `bit${i}`, T, 'b', d, geom, `tb${i}`);
      fc.push(`[${L.label}]setpts=PTS-STARTPTS+${start}/TB[vi${i}]`);
      fc.push(`[br${i}]trim=start=${num(d)},setpts=PTS-STARTPTS+${num(c.start + d)}/TB[vr${i}]`);
      const gEnd = c.start + d * (T.gUntil != null ? T.gUntil : T.flipAt != null ? T.flipAt : 1);
      const bBeg = c.start + d * (T.bAt != null ? T.bAt : T.flipAt != null ? T.flipAt : 0);
      if (!T.gTop) overlayLine(gh.label, gh.ox, gh.oy, c.start, gEnd);
      overlayLine(`vi${i}`, L.ox, L.oy, bBeg, c.start + d);
      if (T.gTop) overlayLine(gh.label, gh.ox, gh.oy, c.start, gEnd);
      overlayLine(`vr${i}`, ox, oy, c.start + d, c.start + c.duration);
      if (T.flash) {
        const col = T.flash === 'white' ? 255 : 0;
        fc.push(`color=c=black:s=64x36:r=${FPS}:d=${num(d)},format=rgba,geq=r=${col}:g=${col}:b=${col}:a='255*(1-abs(2*T/${num(d)}-1))',scale=${W}:${H},setpts=PTS-STARTPTS+${start}/TB[fl${i}]`);
        overlayLine(`fl${i}`, '0', '0', c.start, c.start + d);
      }
      return;
    }
    pendingGhost = null;
    fc.push(`[${cur}]setpts=PTS-STARTPTS+${start}/TB[v${i}]`);
    overlayLine(`v${i}`, ox, oy, c.start, c.start + c.duration);
    if (ovs.length && !blendPath) ovs.forEach((id, k) => { // repli (dimensions inconnues) : superposition par transparence
      const n = `${i}_${k}`;
      fc.push(`[${ovIdx[k]}:v]fps=${FPS},split[fa${n}][fb${n}];[fb${n}]format=gray[fg${n}];[fa${n}][fg${n}]alphamerge,scale=${bw}:${bh}:force_original_aspect_ratio=increase,crop=${bw}:${bh},format=rgba,setpts=PTS-STARTPTS+${start}/TB[fx${n}]`);
      overlayLine(`fx${n}`, `(W-w)/2+(${dx})`, `(H-h)/2+(${dy})`, c.start, c.start + c.duration);
    });
  });
  if (burn) fc.push(`[${last}]subtitles=filename=subs.ass:fontsdir=.,format=yuv420p[vout]`);
  else fc.push(`[${last}]format=yuv420p[vout]`);
  const ag = audioGraph(o.audio, total, idx, args);
  if (ag) fc.push(...ag.filters);
  const graph = fc.join(';');
  if (graph.length > 12000 && o.writeGraph) args.push(o.graphFlag || '-filter_complex_script', o.writeGraph(graph), '-map', '[vout]'); // graphe long : fichier (limite de longueur de commande Windows)
  else args.push('-filter_complex', graph, '-map', '[vout]');
  if (ag) args.push('-map', `[${ag.label}]`, '-c:a', 'aac', '-b:a', '192k');
  // -max_muxing_queue_size : sur les projets lourds, la 1re image vidéo peut mettre longtemps à sortir pendant que l'audio est déjà encodé ;
  // sans cette option FFmpeg s'arrête avec « Too many packets buffered for output stream » (échec d'export aléatoire).
  args.push('-c:v', 'libx264', '-preset', o.light ? 'veryfast' : 'medium', '-crf', CRF[o.resolution] || '20',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-max_muxing_queue_size', '9999', '-movflags', '+faststart', '-t', num(total), output);
  if (o.tolerant) { // mode tolérant : ignore les images corrompues des fichiers sources
    const out = [];
    for (let k = 0; k < args.length; k++) {
      if (args[k] === '-i' && args[k + 1] && !/^color=/.test(String(args[k + 1]))) out.push('-err_detect', 'ignore_err', '-fflags', '+discardcorrupt');
      out.push(args[k]);
    }
    return out;
  }
  return args;
}

// Mix audio (mono 16 kHz) découpé en morceaux pour la transcription.
function buildTranscribeArgs(sources, total, chunkPattern, segSeconds) {
  const args = ['-y', '-hide_banner'];
  const ag = audioGraph(sources, Math.max(Number(total) || 0.1, 0.1), 0, args);
  if (!ag) return null;
  args.push('-filter_complex', ag.filters.join(';'), '-map', `[${ag.label}]`, '-ac', '1', '-ar', '16000',
    '-c:a', 'libmp3lame', '-b:a', '48k', '-f', 'segment', '-segment_time', String(segSeconds || 600), '-reset_timestamps', '1', chunkPattern);
  return args;
}

function assTime(t) {
  const cs = Math.max(0, Math.round(t * 100));
  const h = Math.floor(cs / 360000), m = Math.floor((cs % 360000) / 6000), s = Math.floor((cs % 6000) / 100), c = cs % 100;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

function buildAss(caps, W, H) {
  const size = Math.round(Math.min(W, H) * 0.06), mv = Math.round(H * 0.07), ol = Math.max(2, Math.round(H * 0.004)), mh = Math.round(W * 0.06);
  let s = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 0\nScaledBorderAndShadow: yes\n\n` +
    `[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n` +
    `Style: Default,Arial,${size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,${ol},1,2,${mh},${mh},${mv},1\n\n` +
    `[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  (caps || []).forEach(c => {
    const text = String(c.text || '').replace(/[{}]/g, '').replace(/\r?\n/g, '\\N').trim();
    if (text) s += `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Default,,0,0,0,,${text}\n`;
  });
  return s;
}

module.exports = { resolutionFor, audioGraph, buildExportArgs, buildTranscribeArgs, buildAss, assTime };
