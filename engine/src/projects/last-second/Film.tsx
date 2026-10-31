import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Captions, eio, eout, keys, lerp, ramp, rnd, ShotDef, Shots, Sfx, Soundtrack, VH, VW, clamp01, blinkAt } from "./kit";
import { CHUNKS, VOICE_END, WORDS } from "./words";

// "Last Second" (16:9, 15 s). A black stick figure in a white void walls itself in against a neon-red countdown;
// the floor shatters, shadows claw at the walls, the light goes out, it drops its weapon, turns to us, and the frame freezes.
// Storyline from the creator (2026-10-31). Art direction follows the brief, not the house look: a solid black stick figure
// on a white void, the neon-red clock as the only colour and the only light that survives the dark.
// Narration: Piper TTS (en_US-ryan-high), placed line by line on the beats (no ElevenLabs in this environment), muxed at frame 0.
// Key frames: "Fifteen seconds" f16–40 · "panic" f67 · "build" f84 · "Wall… after wall" f104–130 · "floor breaks" f160–178 ·
// "clock speeds up" f202–227 · "dark pushes in" f233–263 · "If your own walls" f302–328 · "right now" f358–372 ·
// "what would you spend" f377–394 · "last second" f400–420 (freeze f409, clock hits 0) · "defending?" f420–432.

export const FILM_FRAMES = 450;
const FREEZE = 409;

// sound design (composition frames)
const tickFrames = (() => { const out: number[] = []; let prev = Math.ceil(clockVal(0)); for (let f = 1; f <= FREEZE; f++) { const v = Math.ceil(clockVal(f) - 1e-6); if (v !== prev) out.push(f); prev = v; } return out; })();
function clockVal(f: number) {
  if (f <= 200) return lerp(15, 10.5, f / 200);
  const u = clamp01((f - 200) / (FREEZE - 200));
  return Math.max(0, 10.5 - (5 * u + 5.5 * u * u));
}
const SFX: Sfx[] = [
  ...tickFrames.map((t): Sfx => [t, "synth_tick", t < 200 ? 0.32 : 0.4]),
  [55, "synth_whoosh", 0.18], [84, "synth_scribble", 0.32], [100, "synth_scribble", 0.3], [116, "synth_scribble", 0.3], [132, "synth_scribble", 0.28],
  [166, "synth_shatter", 0.75], [200, "synth_whoosh", 0.2], [228, "synth_rumble", 0.55],
  [266, "synth_impact", 0.55], [282, "synth_impact", 0.5], [296, "synth_impact", 0.55], [310, "synth_impact", 0.45], [320, "synth_impact", 0.45],
  [330, "synth_whoosh", 0.2], [349, "synth_clatter", 0.5], [FREEZE, "synth_freeze", 0.8],
];

// ---------- palette + layout ----------
const VOID = "#f3f2ee", INK = "#0c0c0f", RED = "#ff2b3d", RED_OFF = "#3a1015", BODY = "#1c1c22";
const GY = 1100;           // ground line
const FX = 1180;           // figure x
const CLX = 2170;          // clock x
const FS = 1.0;           // figure scale
const DOME_CY = GY + 40;

// ---------- the black stick figure ----------
type Arm = { a: number; b?: number };
const seg = (sx: number, sy: number, a: number, len: number, bend = 0) => {
  const r1 = (a * Math.PI) / 180, r2 = ((a + bend) * Math.PI) / 180;
  const ex = sx + Math.sin(r1) * len * 0.5, ey = sy + Math.cos(r1) * len * 0.5;
  const hx = ex + Math.sin(r2) * len * 0.5, hy = ey + Math.cos(r2) * len * 0.5;
  return { d: `M ${sx},${sy} L ${ex},${ey} L ${hx},${hy}`, hx, hy, ang: a + bend };
};
const Stick: React.FC<{ x: number; y: number; s: number; crouch?: number; lean?: number; armR: Arm; armL: Arm; look?: [number, number]; turn?: number; blink?: number; pen?: boolean; headTilt?: number }> = (p) => {
  const c = p.crouch ?? 0, turn = p.turn ?? 0, [lx, ly] = p.look ?? [0, 0], bl = p.blink ?? 1;
  const hipY = -190 + 60 * c, shY = hipY - 140, headY = shY - 80;
  const W = 15;
  const legs = [-1, 1].map((k) => {
    const fx = k * (30 + 46 * c), hx = k * 8;
    const kx = (hx + fx) / 2 + 26 * c, ky = hipY / 2;
    return <path key={k} d={`M ${hx},${hipY} L ${kx},${ky} L ${fx},-8`} stroke={INK} strokeWidth={W} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  });
  const R = seg(0, shY + 10, p.armR.a, 172, p.armR.b ?? 0);
  const L = seg(0, shY + 10, p.armL.a, 172, p.armL.b ?? 0);
  const eyeY = headY - 6 + ly;
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
      <ellipse cx={0} cy={0} rx={90} ry={12} fill="#000" opacity={0.16} />
      {legs}
      {[-1, 1].map((k) => <ellipse key={k} cx={k * (30 + 46 * c) + 12} cy={-6} rx={24} ry={10} fill={INK} />)}
      <g transform={`rotate(${p.lean ?? 0} 0 ${hipY})`}>
        <path d={L.d} stroke={INK} strokeWidth={W} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={L.hx} cy={L.hy} r={14} fill={INK} />
        <path d={`M 0,${hipY} L 0,${shY}`} stroke={INK} strokeWidth={W + 3} strokeLinecap="round" />
        <g transform={`rotate(${p.headTilt ?? 0} 0 ${shY})`}>
          <circle cx={0} cy={headY} r={60} fill={INK} />
          {/* eyes: overlapping in profile, separating as it turns to camera */}
          {[lerp(27, 21, turn), lerp(27, -21, turn)].map((ex, k) => (
            <ellipse key={k} cx={ex + lx * (1 - turn)} cy={eyeY} rx={lerp(6, 8, turn)} ry={Math.max(1.2, lerp(8, 10, turn) * bl)} fill="#ffffff" />
          ))}
        </g>
        <path d={R.d} stroke={INK} strokeWidth={W} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {p.pen && <Pen x={R.hx} y={R.hy} ang={R.ang} />}
        <circle cx={R.hx} cy={R.hy} r={14} fill={INK} />
      </g>
    </g>
  );
};
// the "weapon": a long ink pen, held along the forearm
const Pen: React.FC<{ x: number; y: number; ang: number }> = ({ x, y, ang }) => (
  <g transform={`translate(${x} ${y}) rotate(${-ang})`}>
    <path d="M -6,-30 L 6,-30 L 6,110 L 0,140 L -6,110 Z" fill={INK} />
    <path d="M -1,-22 L -1,100" stroke="#ffffff" strokeWidth={2.5} opacity={0.55} />
  </g>
);

// ---------- the clock: heavy block, neon-red seven-segment digits ----------
const SEGS: Record<string, string> = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abfgcd" };
const Digit: React.FC<{ x: number; y: number; ch: string; on: string; off: string }> = ({ x, y, ch, on, off }) => {
  const w = 88, h = 150, t = 18, hw = t / 2;
  const H = (x0: number, y0: number) => `${x0 + 4},${y0} ${x0 + hw + 4},${y0 - hw} ${x0 + w - hw - 4},${y0 - hw} ${x0 + w - 4},${y0} ${x0 + w - hw - 4},${y0 + hw} ${x0 + hw + 4},${y0 + hw}`;
  const V = (x0: number, y0: number) => `${x0},${y0 + 4} ${x0 + hw},${y0 + hw + 4} ${x0 + hw},${y0 + h / 2 - hw - 4} ${x0},${y0 + h / 2 - 4} ${x0 - hw},${y0 + h / 2 - hw - 4} ${x0 - hw},${y0 + hw + 4}`;
  const S: Record<string, string> = { a: H(0, 0), g: H(0, h / 2), d: H(0, h), f: V(0, 0), e: V(0, h / 2), b: V(w, 0), c: V(w, h / 2) };
  const lit = SEGS[ch] ?? "";
  return <g transform={`translate(${x} ${y}) skewX(-6)`}>{Object.entries(S).map(([k, pts]) => <polygon key={k} points={pts} fill={lit.includes(k) ? on : off} />)}</g>;
};
const clockState = (F: number) => {
  const v = Math.ceil(clockVal(F) - 1e-6);
  const last = [0, ...tickFrames].filter((t) => t <= F).pop() ?? 0;
  const pulse = F >= FREEZE ? 0.6 : Math.exp(-(F - last) / 7);
  return { txt: String(v).padStart(2, "0"), pulse };
};
const ClockDigits: React.FC<{ F: number; glowOnly?: boolean }> = ({ F, glowOnly }) => {
  const { txt, pulse } = clockState(F);
  const k = 1 + 0.035 * pulse;
  const digits = (on: string, off: string) => <g>{txt.split("").map((ch, i) => <Digit key={i} x={-112 + i * 132} y={-165} ch={ch} on={on} off={off} />)}</g>;
  return (
    <g transform={`translate(${CLX} ${GY - 40}) rotate(${clockTilt(F)}) scale(${k})`}>
      <g filter="url(#redGlow)" opacity={0.55 + 0.45 * pulse}>{digits(RED, "none")}</g>
      {!glowOnly && digits("#ff6b78", RED_OFF)}
      {glowOnly && digits("#ff8a94", "none")}
    </g>
  );
};
const clockTilt = (F: number) => keys(F, [[0, 0], [166, 0], [176, 4], [184, 3]]);
const Clock: React.FC<{ F: number }> = ({ F }) => {
  const { pulse } = clockState(F);
  return (
    <g>
      {/* the one motivated light: red spill on the floor */}
      <ellipse cx={CLX} cy={GY + 6} rx={420} ry={60} fill="url(#redPool)" opacity={0.5 + 0.5 * pulse} />
      <g transform={`translate(${CLX} ${GY - 40}) rotate(${clockTilt(F)})`}>
        <rect x={-200} y={-230} width={400} height={250} rx={26} fill={BODY} />
        <rect x={-172} y={-204} width={344} height={198} rx={12} fill="#08080a" />
        <rect x={-200} y={-230} width={400} height={14} rx={7} fill="#2c2c34" />
        <rect x={-170} y={20} width={60} height={20} rx={4} fill={BODY} />
        <rect x={110} y={20} width={60} height={20} rx={4} fill={BODY} />
      </g>
      <ClockDigits F={F} />
    </g>
  );
};

// ---------- the floor, its shattering, the abyss ----------
const ISLAND = [[440, GY], [2440, GY], [2380, GY + 40], [2110, GY + 95], [1800, GY + 120], [1420, GY + 140], [1080, GY + 128], [760, GY + 100], [520, GY + 50]];
const islandBottom = (x: number) => {
  for (let i = 1; i < ISLAND.length - 1; i++) {
    const [x1, y1] = ISLAND[i], [x2, y2] = ISLAND[i + 1];
    const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
    if (x >= lo && x <= hi) return lerp(y1, y2, (x - x1) / (x2 - x1 || 1));
  }
  return GY;
};
type Shard = { pts: [number, number][]; cx: number; cy: number; delay: number; vx: number; spin: number };
const SHARDS: Shard[] = (() => {
  const cw = 170, ch = 120, cols = Math.ceil(VW / cw) + 2, rows = 4;
  const P = (i: number, j: number): [number, number] => [i * cw - cw + (i % (cols - 1) ? (rnd(`sx${i}-${j}`) - 0.5) * 80 : 0), GY + j * ch + (j ? (rnd(`sy${i}-${j}`) - 0.5) * 60 : 0)];
  const out: Shard[] = [];
  for (let i = 0; i < cols - 1; i++) for (let j = 0; j < rows - 1; j++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
    for (const tri of [[a, b, c], [a, c, d]] as [number, number][][]) {
      const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
      if (cx > 460 && cx < 2420 && cy < islandBottom(cx) + 20) continue; // part of the island that stays
      const k = out.length;
      out.push({ pts: tri, cx, cy, delay: Math.abs(cx - FX) / 240 + rnd(`d${k}`) * 4, vx: (cx - FX) / 260 + (rnd(`v${k}`) - 0.5) * 3, spin: (rnd(`r${k}`) - 0.5) * 9 });
    }
  }
  return out;
})();
const CRACKS = Array.from({ length: 9 }, (_, k) => {
  const dir = k % 2 ? 1 : -1, len = 380 + rnd(`cl${k}`) * 900, n = 7;
  const pts: string[] = [`${FX + dir * 20},${GY}`];
  for (let i = 1; i <= n; i++) pts.push(`${FX + dir * (20 + (len * i) / n)},${GY + (i / n) * (30 + rnd(`cy${k}`) * 280) + (rnd(`cj${k}-${i}`) - 0.5) * 50}`);
  return pts.join(" ");
});
const Floor: React.FC<{ F: number }> = ({ F }) => {
  const SH = 168;
  const crack = ramp(F, 156, 168);
  if (F < SH) {
    return (
      <g>
        {crack > 0 && CRACKS.map((pts, k) => <polyline key={k} points={pts} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01(crack * 1.4 - k * 0.04)} />)}
      </g>
    );
  }
  const t = F - SH;
  return (
    <g>
      <rect x={-400} y={GY} width={VW + 800} height={VH} fill={INK} opacity={clamp01(t / 4)} />
      {SHARDS.map((s, k) => {
        const tt = Math.max(0, t - s.delay);
        if (tt > 30) return null;
        const dy = 2.4 * tt * tt * 0.5 + tt * 4, dx = s.vx * tt;
        return <polygon key={k} points={s.pts.map(([x, y]) => `${x},${y}`).join(" ")} fill={VOID} stroke={INK} strokeWidth={4} strokeLinejoin="round" transform={`translate(${dx} ${dy}) rotate(${s.spin * tt * 0.4} ${s.cx} ${s.cy})`} />;
      })}
      <polygon points={ISLAND.map(([x, y]) => `${x},${y}`).join(" ")} fill={VOID} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {/* cracks scarring the island top */}
      <path d={`M ${FX - 340},${GY + 6} l 60,22 l 50,-8 l 70,40 M ${FX + 220},${GY + 6} l 40,30 l 90,4 l 30,46`} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

// ---------- the wall of shields ----------
const NSH = 11;
const shieldAngle = (i: number) => 168 - (i * 156) / (NSH - 1);
const shieldStart = (i: number) => 86 + i * 5.5;
const HITS: [number, number][] = [[266, 2], [282, 8], [296, 5], [310, 1], [320, 9]];
const domeR = (F: number) => keys(F, [[0, 680], [262, 680], [330, 600]]) - HITS.reduce((s, [t]) => s + (F >= t ? 14 * Math.exp(-(F - t) / 5) : 0), 0);
const Shields: React.FC<{ F: number }> = ({ F }) => {
  const R = domeR(F);
  return (
    <g>
      {Array.from({ length: NSH }, (_, i) => {
        const th = shieldAngle(i), rad = (th * Math.PI) / 180;
        const st = shieldStart(i);
        const draw = ramp(F, st, st + 12), inner = ramp(F, st + 8, st + 16), fill = ramp(F, st + 10, st + 18);
        if (draw <= 0) return null;
        // hits: a jolt + a crack
        const hit = HITS.filter(([t, s]) => s === i && F >= t);
        const jolt = hit.reduce((s, [t]) => s + Math.exp(-(F - t) / 4) * Math.sin((F - t) * 1.7) * 7, 0);
        // the collapse: after the figure lets go, the shields drop away one by one
        const fall = ramp(F, 338 + Math.abs(i - 5) * 3, 362 + Math.abs(i - 5) * 3);
        const x = FX + Math.cos(rad) * R, y = DOME_CY - Math.sin(rad) * R + eio(fall) * 420;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${90 - th + jolt + fall * (i < 5 ? -40 : 40)}) scale(1.42)`} opacity={1 - fall}>
            <path d="M -64,-80 L 64,-80 L 64,-8 Q 64,58 0,96 Q -64,58 -64,-8 Z" fill={VOID} fillOpacity={fill} stroke={INK} strokeWidth={8} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
            <path d="M 0,-80 L 0,96 M -64,-26 L 64,-26" fill="none" stroke={INK} strokeWidth={6} pathLength={2} strokeDasharray="2 2" strokeDashoffset={2 - 2 * inner} />
            {hit.length > 0 && <polyline points="-40,-70 -12,-36 -28,-8 6,20 -6,52" fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />}
            {hit.length > 0 && <polyline points="30,-74 18,-50 40,-30" fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />}
          </g>
        );
      })}
    </g>
  );
};

// ---------- the shadows from the abyss ----------
const TENDRILS = Array.from({ length: 12 }, (_, k) => {
  const side = k % 2 ? 1 : -1, j = Math.floor(k / 2);
  return { side, off: 120 + j * 95 + rnd(`tb${k}`) * 60, phi: side > 0 ? 14 + j * 12 : 166 - j * 12, at: 232 + j * 6 + (side > 0 ? 3 : 0), w: 20 + rnd(`tw${k}`) * 14 };
});
const Shadows: React.FC<{ F: number }> = ({ F }) => {
  const R = domeR(F);
  return (
    <g>
      {TENDRILS.map((t, k) => {
        const g = eout(ramp(F, t.at, t.at + 30));
        if (g <= 0) return null;
        const rad = (t.phi * Math.PI) / 180;
        const grow = 1 + 0.7 * ramp(F, 300, 380);
        const reach = R + 70 + Math.sin(F * 0.4 + k) * 12;
        const tx = FX + Math.cos(rad) * reach, ty = DOME_CY - Math.sin(rad) * reach;
        const bx = FX + t.side * (R + t.off), by = VH + 80;
        const ex = lerp(bx, tx, g), ey = lerp(by, ty, g);
        // control point pushed outward so the arm arcs around the outside of the dome
        const mx = lerp(bx, ex, 0.5) + t.side * (160 + Math.sin(F * 0.11 + k) * 40), my = lerp(by, ey, 0.5) + 40;
        const ang = (Math.atan2(ey - my, ex - mx) * 180) / Math.PI;
        const claw = Math.sin(F * 0.6 + k * 1.3) * 12;
        return (
          <g key={k}>
            <path d={`M ${bx},${by} Q ${mx},${my} ${ex},${ey}`} fill="none" stroke={INK} strokeWidth={t.w * 2.6 * grow} strokeLinecap="round" opacity={0.18} filter="url(#soft)" />
            <path d={`M ${bx - t.w},${by} Q ${mx},${my} ${ex},${ey} Q ${mx + t.side * 10},${my + 20} ${bx + t.w},${by} Z`} fill={INK} />
            <path d={`M ${bx},${by} Q ${mx},${my} ${ex},${ey}`} fill="none" stroke={INK} strokeWidth={t.w * 0.9 * grow} strokeLinecap="round" />
            <g transform={`translate(${ex} ${ey}) rotate(${ang}) scale(${0.8 + 0.3 * grow})`}>
              {[-1, 0, 1].map((c) => <path key={c} d={`M 0,${c * 10} Q 34,${c * (20 + claw)} 58,${c * (30 + claw) + 8}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />)}
            </g>
          </g>
        );
      })}
    </g>
  );
};

// ---------- the figure's acting ----------
const hero = (F: number) => {
  const drawU = ramp(F, 86, 148);
  const drawing = F >= 84 && F < 150;
  const brace = ramp(F, 262, 276), letGo = ramp(F, 336, 358);
  const crouch = keys(F, [[0, 0], [166, 0], [174, 0.42], [200, 0.3], [262, 0.3], [276, 0.6], [336, 0.6], [360, 0.12], [380, 0.12], [396, 0]]);
  const impact = HITS.reduce((s, [t]) => s + (F >= t ? Math.exp(-(F - t) / 5) : 0), 0);
  let armR: Arm, armL: Arm;
  if (F < 72) { armR = { a: 14 }; armL = { a: -10 }; }
  else if (!drawing && F < 150) { const u = eio(ramp(F, 72, 84)); armR = { a: lerp(14, -110, u), b: lerp(0, -10, u) }; armL = { a: lerp(-10, -26, u) }; }
  else if (drawing) { armR = { a: -110 - 140 * eio(drawU) + Math.sin(F * 1.3) * 7, b: -12 }; armL = { a: -26, b: 10 }; }
  else {
    const ready = eio(ramp(F, 150, 160));
    const rest = { r: lerp(110, 96, ready), l: lerp(-26, -40, ready) };
    armR = { a: lerp(rest.r, 168, brace), b: lerp(-30, 6, brace) };
    armL = { a: lerp(rest.l, -172, brace), b: lerp(10, -6, brace) };
    if (letGo > 0) { armR = { a: lerp(armR.a, 10, eio(letGo)), b: lerp(armR.b ?? 0, 0, letGo) }; armL = { a: lerp(armL.a, -10, eio(letGo)), b: 0 }; }
  }
  const lean = -impact * 5 + (F > 166 && F < 190 ? -6 * Math.sin(ramp(F, 166, 190) * Math.PI) : 0);
  const look: [number, number] = F < 62 ? [6, 12] : F < 150 ? [lerp(6, 4, ramp(F, 62, 72)), lerp(12, -2, ramp(F, 62, 72))] : F < 336 ? [4, -6] : F < 380 ? [5, 10] : [0, 0];
  const turn = eio(ramp(F, 380, 396));
  const headTilt = F > 340 && F < 386 ? 8 * ramp(F, 340, 352) * (1 - ramp(F, 380, 386)) : 0;
  return { armR, armL, crouch, lean, look, turn, headTilt, pen: F < 336 };
};
// the dropped pen: falls from the hand, bounces once
const DroppedPen: React.FC<{ F: number }> = ({ F }) => {
  if (F < 336) return null;
  const t = F - 336;
  const y0 = GY - 290, land = GY - 14;
  const fallT = 13;
  const y = t < fallT ? lerp(y0, land, (t / fallT) ** 2) : land - Math.max(0, Math.sin(((t - fallT) / 8) * Math.PI)) * 34 * (t - fallT < 8 ? 1 : 0);
  const rot = t < fallT ? lerp(-20, 85, t / fallT) : 90 + (t - fallT < 8 ? Math.sin(((t - fallT) / 8) * Math.PI) * 12 : 0);
  return <g transform={`translate(${FX + 130 + Math.min(t, 21) * 3} ${y}) rotate(${rot})`}><path d="M -6,-80 L 6,-80 L 6,60 L 0,86 L -6,60 Z" fill={INK} /></g>;
};

// ---------- air: dust in the void, ash from the abyss ----------
const Motes: React.FC<{ F: number }> = ({ F }) => (
  <g>
    {Array.from({ length: 46 }, (_, k) => {
      const ash = k % 2 === 1;
      if (ash && F < 170) return null;
      const sp = 0.6 + rnd(`ms${k}`) * 1.2;
      const x = (rnd(`mx${k}`) * (VW + 200) + Math.sin(F * 0.03 + k) * 30) % (VW + 200) - 100;
      const span = VH + 200;
      const y = ash ? ((rnd(`my${k}`) * span - F * sp * 2.2) % span + span) % span - 100 : ((rnd(`my${k}`) * span + F * sp * 0.6) % span) - 100;
      return <circle key={k} cx={x} cy={y} r={ash ? 4 + rnd(`mr${k}`) * 5 : 2.5 + rnd(`mr${k}`) * 3} fill={ash ? "#2a2a30" : "#9b9b96"} opacity={ash ? 0.7 : 0.45} />;
    })}
  </g>
);

// ---------- the dark that swallows the light ----------
const darkR = (F: number) => keys(F, [[0, 3400], [288, 3400], [330, 1300], [376, 300], [409, 290]]);
const LIGHT_CY = (F: number) => keys(F, [[0, 760], [330, 760], [380, 720]]);
const Dark: React.FC<{ F: number }> = ({ F }) => {
  const r = darkR(F) + (F < FREEZE && F > 288 ? Math.sin(F * 2.1) * 10 : 0);
  if (r > 3300) return null;
  const soft = 60;
  return (
    <g>
      <defs>
        <radialGradient id={`dk${F}`} gradientUnits="userSpaceOnUse" cx={FX} cy={LIGHT_CY(F)} r={r + soft}>
          <stop offset={r / (r + soft)} stopColor="#000" stopOpacity={0} />
          <stop offset={1} stopColor="#000" stopOpacity={1} />
        </radialGradient>
      </defs>
      <rect x={-1000} y={-1000} width={VW + 2000} height={VH + 2000} fill={`url(#dk${F})`} />
    </g>
  );
};

// ---------- the whole world at frame F ----------
const World: React.FC<{ F: number }> = ({ F }) => {
  const h = hero(F);
  const shake = HITS.reduce((s, [t]) => s + (F >= t ? Math.exp(-(F - t) / 6) * 16 : 0), 0) + (F >= 168 ? Math.exp(-(F - 168) / 8) * 26 : 0);
  const sx = Math.sin(F * 2.3) * shake + Math.sin(F * 0.05) * 4, sy = Math.cos(F * 2.9) * shake + Math.cos(F * 0.04) * 3;
  return (
    <g transform={`translate(${sx} ${sy})`}>
      <rect x={-600} y={-600} width={VW + 1200} height={VH + 1200} fill={VOID} />
      <rect x={-600} y={-600} width={VW + 1200} height={VH + 1200} fill="url(#voidVig)" />
      <Floor F={F} />
      <Motes F={F} />
      <ellipse cx={FX} cy={GY} rx={420} ry={34} fill="#000" opacity={0.06} />
      <Clock F={F} />
      <Stick x={FX} y={GY} s={FS} crouch={h.crouch} lean={h.lean} armR={h.armR} armL={h.armL} look={h.look} turn={h.turn} pen={h.pen} headTilt={h.headTilt} blink={F < FREEZE ? blinkAt(F, 3) : 1} />
      <DroppedPen F={F} />
      <Shields F={F} />
      <Shadows F={F} />
      <Dark F={F} />
      {/* the clock keeps glowing inside the dark */}
      {F > 300 && <g opacity={ramp(F, 300, 330)}><ClockDigits F={F} glowOnly /></g>}
    </g>
  );
};

const shot = (from: number, to: number, z0: number, z1: number, fx: number, fy: number): ShotDef => ({ from, to, z0, z1, fx, fy, render: (f) => <World F={f + from} /> });
const SHOTS: ShotDef[] = [
  shot(0, 55, 1.0, 1.05, 1600, 860),     // wide: the void, the figure, the clock
  shot(55, 100, 1.45, 1.55, 1560, 820),    // medium: it looks up, doesn't panic, raises the pen
  shot(100, 150, 1.04, 1.1, 1300, 780), // wide: wall after wall
  shot(150, 200, 1.0, 1.06, 1400, 900),  // wide: the floor breaks
  shot(200, 262, 1.8, 1.95, 2100, 1150), // insert: the clock races, the dark comes up behind it
  shot(262, 330, 1.1, 1.2, 1180, 800), // medium: shadows claw, the figure braces, the walls close
  shot(330, 380, 1.0, 1.06, 1180, 820),  // wide: the light is swallowed, it lets go
  shot(380, 450, 1.85, 2.0, 1180, 760),  // close: it turns to us; freeze
];

export const LastSecondFilm: React.FC = () => {
  const f = useCurrentFrame();
  const fz = Math.min(f, FREEZE);
  const fadeIn = 1 - eio(ramp(f, 0, 14));
  const out = ramp(f, FILM_FRAMES - 10, FILM_FRAMES - 1);
  return (
    <AbsoluteFill style={{ backgroundColor: VOID }}>
      <Soundtrack total={FILM_FRAMES} voice={staticFile("projects/last-second/narration.wav")} voiceAt={0} voiceEnd={VOICE_END} music="music_synth_drone" musicLen={FILM_FRAMES} amb="amb_room_tone" ambVol={0.4} sfx={SFX} />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="redGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="16" /></filter>
          <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="20" /></filter>
          <radialGradient id="redPool"><stop offset="0" stopColor={RED} stopOpacity="0.55" /><stop offset="1" stopColor={RED} stopOpacity="0" /></radialGradient>
          <radialGradient id="voidVig" cx="0.5" cy="0.45" r="0.8"><stop offset="0.5" stopColor="#d9d8d2" stopOpacity="0" /><stop offset="1" stopColor="#c9c8c2" stopOpacity="0.7" /></radialGradient>
        </defs>
      </svg>
      <Shots f={fz} shots={SHOTS} />
      <Captions f={f} words={WORDS} chunks={CHUNKS} dark={f < 166} />
      <AbsoluteFill style={{ backgroundColor: VOID, opacity: fadeIn }} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: out }} />
    </AbsoluteFill>
  );
};
