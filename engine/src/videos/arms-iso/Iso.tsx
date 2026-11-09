// "Agar ek din ke liye aapke 10 haath ho jaayein?" (WhatIfyTV), isometric 2D version: the bedroom as an isometric
// diorama in SVG, the characters as canvas drawings (same toon kit as the 3D film), a 2D camera that zooms and glides
// between beats, and the same word timings, captions and sound as the 3D version (../arms/story.ts, ../arms/words.ts).
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, getInputProps, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Pen, bodyFront, octopus, fxStars, fxSplash, FrontOpts, ManyArm } from "../arms/toon";
import { SHOTS, B, wt, TOTAL, FLASH_AT, FPS, screenAt, nightAt, clamp01, smooth } from "../arms/story";
import { WORDS } from "../arms/words";
import { drawScreen, SW, SH } from "./screens";
import { RAJ, poseAt, ORDER, lidAt, q, LEAD } from "./pose";

export const ISO_FRAMES = TOTAL;

// ---------------- isometric projection (metres -> world px) ----------------
const S = 130, C = Math.cos(Math.PI / 6), OX = 540, OY = 700;
type P3 = [number, number, number];
const iso = (x: number, y: number, z: number): [number, number] => [OX + (x - y) * C * S, OY + (x + y) * 0.5 * S - z * S];
const pts = (ps: P3[]) => ps.map((p) => iso(...p).map((v) => v.toFixed(1)).join(",")).join(" ");
const INK = "#1d1622";
const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, "0");
  return "#" + f(r) + f(g) + f(b);
};
const Poly: React.FC<{ p: P3[]; fill: string; sw?: number; op?: number }> = ({ p, fill, sw = 3, op }) =>
  <polygon points={pts(p)} fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" opacity={op} />;
/** box with the three faces this view sees: top, +y (front-left), +x (front-right) */
const Box: React.FC<{ x: [number, number]; y: [number, number]; z: [number, number]; col: string; top?: string; sw?: number }> = ({ x: [x0, x1], y: [y0, y1], z: [z0, z1], col, top, sw = 3 }) => (
  <g>
    <Poly p={[[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]} fill={shade(col, 0.86)} sw={sw} />
    <Poly p={[[x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [x1, y0, z0]]} fill={shade(col, 0.68)} sw={sw} />
    <Poly p={[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]} fill={top ?? shade(col, 1.08)} sw={sw} />
  </g>
);
/** SVG transform that maps local wall coords (u metres along the wall, v metres DOWN from z0) onto a back wall */
const wallM = (wall: "right" | "left", u0: number, z0: number) => {
  const [ex, ey] = wall === "right" ? iso(u0, 0, z0) : iso(0, u0, z0);
  return wall === "right" ? `matrix(${C * S} ${0.5 * S} 0 ${S} ${ex} ${ey})` : `matrix(${-C * S} ${0.5 * S} 0 ${S} ${ex} ${ey})`;
};

// ---------------- the room ----------------
const RX = 4, RY = 4, H = 2.6;
const DESK = { x: [1.0, 2.65] as [number, number], y: [0.05, 0.8] as [number, number], top: 0.75 };
const MON = { x: [1.35, 2.25] as [number, number], y: 0.32, z: [0.86, 1.52] as [number, number] };
const SCR = { x: [1.41, 2.19] as [number, number], z: [0.92, 1.46] as [number, number] };
const MAN: P3 = [2.25, 1.35, 0];
const OCTO: P3 = [1.35, 2.35, 0];
const BEDX: [number, number] = [0.05, 1.05], BEDY: [number, number] = [1.95, 3.9];
const SLEEP: P3 = [0.62, 3.72, 0.5];

const Room: React.FC<{ t: number; night: number; lampOn: boolean }> = ({ t, night, lampOn }) => {
  const planks = [];
  for (let y = 0.3; y < RY; y += 0.3) planks.push(<line key={y} x1={iso(0, y, 0)[0]} y1={iso(0, y, 0)[1]} x2={iso(RX, y, 0)[0]} y2={iso(RX, y, 0)[1]} stroke="#a8693f" strokeWidth={2} />);
  for (let k = 0; k < 40; k++) { const y = 0.15 + (k % 13) * 0.3, x = ((k * 1.37) % 3.4) + 0.2; const [a, b] = [iso(x, y, 0), iso(x, y + 0.3, 0)]; planks.push(<line key={"s" + k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#a8693f" strokeWidth={1.6} />); }
  const stripes = (wall: "right" | "left") => Array.from({ length: 13 }, (_, i) => <rect key={i} x={0.15 + i * 0.3} y={0} width={0.1} height={H} fill="#ffffff" opacity={0.13} />);
  // clock hands race through the night
  const n0 = SHOTS[10].a / FPS, n1 = SHOTS[10].b / FPS, spin = t > n0 ? Math.min(t, n1) - n0 : 0;
  const mA = -Math.PI / 3 + spin * Math.PI * 2 * 1.3, hA = (Math.PI * 2 * 4.17) / 12 + (spin * Math.PI * 2 * 1.3) / 12;
  const blink = Math.floor(t * 2) % 2 === 0;
  return (
    <g>
      {/* floor slab */}
      <Poly p={[[0, RY, 0], [RX, RY, 0], [RX, RY, -0.3], [0, RY, -0.3]]} fill="#b5784a" />
      <Poly p={[[RX, 0, 0], [RX, RY, 0], [RX, RY, -0.3], [RX, 0, -0.3]]} fill="#8f5a37" />
      <Poly p={[[0, 0, 0], [RX, 0, 0], [RX, RY, 0], [0, RY, 0]]} fill="#dda36a" />
      {planks}
      {/* walls: left (x = 0) and right (y = 0) with caps */}
      <Poly p={[[0, 0, 0], [0, RY, 0], [0, RY, H], [0, 0, H]]} fill="#7fb8ad" />
      <g transform={wallM("left", 0, H)}>{stripes("left")}</g>
      <Poly p={[[0, 0, 0], [RX, 0, 0], [RX, 0, H], [0, 0, H]]} fill="#97cdc1" />
      <g transform={wallM("right", 0, H)}>{stripes("right")}</g>
      <Box x={[-0.15, 0]} y={[-0.15, RY]} z={[H, H + 0.08]} col="#efe4cc" sw={2.5} />
      <Box x={[0, RX]} y={[-0.15, 0]} z={[H, H + 0.08]} col="#efe4cc" sw={2.5} />
      <Poly p={[[0, RY, -0.3], [0, RY, H + 0.08], [-0.15, RY, H + 0.08], [-0.15, RY, -0.3]]} fill="#d8ccb2" sw={2.5} />
      <Poly p={[[RX, -0.15, -0.3], [RX, -0.15, H + 0.08], [RX, 0, H + 0.08], [RX, 0, -0.3]]} fill="#bfb399" sw={2.5} />
      {/* skirting */}
      <Poly p={[[0, 0, 0], [0, RY, 0], [0, RY, 0.1], [0, 0, 0.1]]} fill="#f1e7d2" sw={2} />
      <Poly p={[[0, 0, 0], [RX, 0, 0], [RX, 0, 0.1], [0, 0, 0.1]]} fill="#f1e7d2" sw={2} />
      {/* window on the left wall: sky, a hill, a cloud; dark at night */}
      <g transform={wallM("left", 1.25, 2.15)}>
        <rect x={0} y={0} width={1.3} height={1.1} fill={night > 0.5 ? "#1c2350" : "#8fd0f5"} stroke={INK} strokeWidth={0.025} />
        {night > 0.5 ? <circle cx={0.95} cy={0.3} r={0.12} fill="#f4f0c8" /> : <>
          <ellipse cx={0.45} cy={1.1} rx={0.7} ry={0.35} fill="#78b257" />
          <ellipse cx={0.95} cy={0.3} rx={0.22} ry={0.09} fill="#ffffff" />
        </>}
        <rect x={0.62} y={0} width={0.06} height={1.1} fill="#f1e7d2" stroke={INK} strokeWidth={0.015} />
        <rect x={-0.05} y={-0.05} width={1.4} height={1.2} fill="none" stroke="#f1e7d2" strokeWidth={0.08} />
        <rect x={-0.09} y={-0.09} width={1.48} height={1.28} fill="none" stroke={INK} strokeWidth={0.02} />
      </g>
      {/* poster (rocket) and clock on the right wall */}
      <g transform={wallM("right", 0.35, 2.05)}>
        <rect x={0} y={0} width={0.5} height={0.68} fill="#24325e" stroke={INK} strokeWidth={0.02} />
        <circle cx={0.36} cy={0.14} r={0.06} fill="#f2c14e" />
        <path d="M0.25 0.1 L0.31 0.28 L0.31 0.5 L0.19 0.5 L0.19 0.28 Z" fill="#f1ece0" stroke={INK} strokeWidth={0.012} />
        <path d="M0.21 0.5 L0.29 0.5 L0.25 0.62 Z" fill="#f29a3a" />
      </g>
      <g transform={wallM("right", 3.3, 2.15)}>
        <circle cx={0} cy={0} r={0.2} fill="#d9483b" stroke={INK} strokeWidth={0.02} />
        <circle cx={0} cy={0} r={0.16} fill="#fbf6ea" stroke={INK} strokeWidth={0.012} />
        <line x1={0} y1={0} x2={0.13 * Math.sin(mA)} y2={-0.13 * Math.cos(mA)} stroke={INK} strokeWidth={0.018} strokeLinecap="round" />
        <line x1={0} y1={0} x2={0.08 * Math.sin(hA)} y2={-0.08 * Math.cos(hA)} stroke={INK} strokeWidth={0.026} strokeLinecap="round" />
      </g>
      {/* shelf + router */}
      <Box x={[3.0, 3.65]} y={[0, 0.28]} z={[1.5, 1.55]} col="#c98b52" />
      <Box x={[3.1, 3.5]} y={[0.04, 0.22]} z={[1.55, 1.62]} col="#efe9dc" />
      <line x1={iso(3.15, 0.08, 1.62)[0]} y1={iso(3.15, 0.08, 1.62)[1]} x2={iso(3.12, 0.08, 1.85)[0]} y2={iso(3.12, 0.08, 1.85)[1]} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <line x1={iso(3.45, 0.08, 1.62)[0]} y1={iso(3.45, 0.08, 1.62)[1]} x2={iso(3.48, 0.08, 1.85)[0]} y2={iso(3.48, 0.08, 1.85)[1]} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      {[0, 1, 2].map((i) => { const [x, y] = iso(3.2 + i * 0.1, 0.22, 1.585); return <circle key={i} cx={x} cy={y} r={3.2} fill={i < 2 ? "#5be37a" : blink ? "#ffb02e" : "#5a3a10"} />; })}
      {/* rug */}
      {[[1.0, "#e0a64b"], [0.84, "#c9573f"], [0.66, "#f2dfb5"], [0.48, "#5b8fb8"], [0.3, "#f2dfb5"], [0.14, "#c9573f"]].map(([r, col], i) => {
        const [cx, cy] = iso(1.7, 2.25, 0.005);
        return <ellipse key={i} cx={cx} cy={cy} rx={1.2247 * (r as number) * S} ry={0.7071 * (r as number) * S} fill={col as string} stroke={i === 0 ? INK : "none"} strokeWidth={3} />;
      })}
      {/* bed along the left wall */}
      <Box x={BEDX} y={[BEDY[0] - 0.12, BEDY[0]]} z={[0, 0.95]} col="#8f5a35" />
      <Box x={BEDX} y={BEDY} z={[0, 0.3]} col="#8f5a35" />
      <Box x={[BEDX[0] + 0.02, BEDX[1] - 0.02]} y={[BEDY[0] + 0.02, BEDY[1] - 0.02]} z={[0.3, 0.46]} col="#4f78b8" top="#6a91cc" />
      <Box x={[0.2, 0.9]} y={[BEDY[0] + 0.08, BEDY[0] + 0.42]} z={[0.46, 0.58]} col="#f4efe4" />
      {/* desk, PC tower, keyboard, monitor, lamp */}
      <Box x={[2.75, 3.08]} y={[0.12, 0.72]} z={[0, 0.62]} col="#3d4352" />
      <Poly p={[[2.98, 0.72, 0.1], [3.02, 0.72, 0.1], [3.02, 0.72, 0.5], [2.98, 0.72, 0.5]]} fill="#5ad2ff" sw={1.5} />
      {[[DESK.x[0] + 0.05, DESK.y[1] - 0.07], [DESK.x[1] - 0.07, DESK.y[1] - 0.07], [DESK.x[1] - 0.07, DESK.y[0] + 0.03]].map(([x, y], i) =>
        <Box key={i} x={[x, x + 0.06]} y={[y, y + 0.06]} z={[0, DESK.top - 0.05]} col="#8f5a35" />)}
      <Box x={DESK.x} y={DESK.y} z={[DESK.top - 0.05, DESK.top]} col="#c98b52" />
      <Box x={[1.7, 1.9]} y={[0.12, 0.3]} z={[DESK.top, DESK.top + 0.02]} col="#3d4352" />
      <Box x={[1.77, 1.83]} y={[0.17, 0.23]} z={[DESK.top, MON.z[0]]} col="#3d4352" />
      <Box x={MON.x} y={[0.2, MON.y]} z={MON.z} col="#3d4352" />
      <Box x={[1.5, 2.1]} y={[0.48, 0.64]} z={[DESK.top, DESK.top + 0.025]} col="#efe9dc" />
      <Box x={[2.25, 2.33]} y={[0.5, 0.6]} z={[DESK.top, DESK.top + 0.03]} col="#efe9dc" />
      {/* lamp */}
      <ellipse cx={iso(1.15, 0.45, DESK.top)[0]} cy={iso(1.15, 0.45, DESK.top)[1]} rx={14} ry={7} fill="#d9483b" stroke={INK} strokeWidth={3} />
      <polyline points={pts([[1.15, 0.45, DESK.top], [1.2, 0.45, DESK.top + 0.32], [1.32, 0.48, DESK.top + 0.42]])} fill="none" stroke="#7d848c" strokeWidth={5} strokeLinecap="round" />
      <polygon points={pts([[1.25, 0.48, DESK.top + 0.5], [1.45, 0.48, DESK.top + 0.38], [1.36, 0.48, DESK.top + 0.32]])} fill="#d9483b" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {lampOn && <circle cx={iso(1.38, 0.48, DESK.top + 0.36)[0]} cy={iso(1.38, 0.48, DESK.top + 0.36)[1]} r={9} fill="#fff6c8" />}
    </g>
  );
};

// ---------------- canvas pieces (characters, effects, screen) ----------------
/** a canvas drawing anchored at world px (ax, ay) = design point (dx, dy); s = world px per design unit */
const PenCanvas: React.FC<{ w: number; h: number; dx: number; dy: number; ax: number; ay: number; s: number; res: number; draw: (p: Pen) => void; rot?: number; mirror?: boolean; dep: string; op?: number }> =
  ({ w, h, dx, dy, ax, ay, s, res, draw, rot = 0, mirror, dep, op }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    const k = s * res;
    useLayoutEffect(() => {
      const g = ref.current!.getContext("2d")!;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, ref.current!.width, ref.current!.height); g.setTransform(k, 0, 0, k, 0, 0);
      draw(new Pen(g));
    }, [dep, k]);
    return <canvas ref={ref} width={Math.ceil(w * k)} height={Math.ceil(h * k)} style={{ position: "absolute", left: ax - dx * s, top: ay - dy * s, width: w * s, height: h * s, opacity: op,
      transformOrigin: `${dx * s}px ${dy * s}px`, transform: `rotate(${rot}deg) scaleX(${mirror ? -1 : 1})` }} />;
  };
const ScreenCanvas: React.FC<{ f: number }> = ({ f }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = screenAt(f), key = JSON.stringify(st);
  useLayoutEffect(() => { drawScreen(ref.current!.getContext("2d")!, st); }, [key]);
  const [ex, ey] = iso(SCR.x[0], MON.y + 0.002, SCR.z[1]), w = SCR.x[1] - SCR.x[0], h = SCR.z[1] - SCR.z[0];
  const m = `matrix(${(C * S * w) / SW}, ${(0.5 * S * w) / SW}, 0, ${(S * h) / SH}, ${ex}, ${ey})`;
  return <canvas ref={ref} width={SW} height={SH} style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: m, filter: "brightness(1.12)" }} />;
};

// ---------------- camera (2D: a target point in metres, zoom, roll) ----------------
type Cam = { p: P3; z: number; r: number };
type Key = { f: number; dur?: number; cut?: boolean; c: (f: number) => Cam };
const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const fr = (s: number) => Math.round(s * FPS);
const a0 = (id: number) => SHOTS[id - 1].a;
const push = (z: number, f: number, f0: number, rate = 0.0018) => z * Math.exp(rate * Math.max(0, f - f0));
const K = (p: P3, z: number, f0: number, r = 0, rate = 0.0018) => (f: number): Cam => ({ p, z: push(z, f, f0, rate), r });
const MANC: P3 = [MAN[0], MAN[1], 1.0], FACE: P3 = [MAN[0], MAN[1], 1.42], SCRC: P3 = [(SCR.x[0] + SCR.x[1]) / 2, MON.y, 1.12];
const OCTC: P3 = [OCTO[0], OCTO[1], 0.32], BEDC: P3 = [0.55, 2.95, 0.5], ROOM: P3 = [2.0, 2.0, 0.75];
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, c: K(ROOM, 1.08, 0, 0, 0.0012) }, { f: fr(B.ten) - 12, dur: 28, c: K(MANC, 1.9, fr(B.ten), 0.025) }],
  2: [{ f: a0(2), c: K([2.0, 1.0, 1.0], 2.1, a0(2)) }],
  3: [{ f: a0(3), c: K(MANC, 2.2, a0(3)) }, { f: fr(B.crash), cut: true, c: K([MAN[0], MAN[1], 1.1], 2.9, fr(B.crash), -0.035, 0.0025) }],
  4: [{ f: a0(4), c: K(FACE, 4.0, a0(4), 0.03, 0.003) }],
  5: [{ f: a0(5), c: K(SCRC, 7.2, a0(5)) }],
  6: [{ f: a0(6), c: K(SCRC, 7.4, a0(6), 0.025, 0.0025) }],
  7: [{ f: a0(7), c: K([MAN[0], MAN[1], 1.05], 2.2, a0(7)) }, { f: fr(B.chai) - 10, dur: 26, c: K([MAN[0], MAN[1], 1.1], 2.35, fr(B.chai), -0.02) }],
  8: [{ f: a0(8), c: K([MAN[0], MAN[1], 1.1], 2.8, a0(8), 0.035, 0.0025) }, { f: fr(B.kya) - 8, dur: 20, c: K([MAN[0], MAN[1], 1.1], 3.0, fr(B.kya), -0.035) }],
  9: [{ f: a0(9), c: K([MAN[0], MAN[1], 1.4], 2.4, a0(9), 0, 0.0025) }],
  10: [{ f: a0(10), c: K([2.0, 1.0, 1.0], 2.1, a0(10)) }, { f: fr(B.bhookh), cut: true, c: K(FACE, 3.3, fr(B.bhookh), 0.03, 0.0025) }],
  11: [{ f: a0(11), c: K(BEDC, 2.3, a0(11)) }, { f: fr(B.karwat) - 10, dur: 24, c: K(BEDC, 2.9, fr(B.karwat), -0.035) }],
  12: [{ f: a0(12), c: K([1.8, 1.8, 0.8], 1.4, a0(12)) }, { f: fr(B.octo) - 10, dur: 26, c: K([OCTO[0], OCTO[1], 0.45], 2.6, fr(B.octo)) }],
  13: [{ f: a0(13), c: K(SCRC, 7.2, a0(13)) }],
  14: [{ f: a0(14), c: K(OCTC, 4.2, a0(14), 0.025, 0.0025) }],
  15: [{ f: a0(15), c: K([1.95, 1.7, 0.95], 2.1, a0(15)) }],
  16: [{ f: a0(16), c: K(SCRC, 7.2, a0(16), 0, 0.0025) }],
  17: [{ f: a0(17), c: K([2.0, 1.6, 0.95], 1.9, a0(17)) }, { f: a0(17) + 30, dur: TOTAL - a0(17) - 40, c: K(ROOM, 0.92, a0(17) + 30, 0, 0) }],
};
const KICKS: [number, number][] = [[B.ten, 0.6], [B.crash, 1.2], [B.tenHands, 0.6], [B.chaos, 0.7], [B.karwat + 0.2, 0.6], [B.sub, 0.6]];
const kickAt = (t: number) => { let a = 0; for (const [t0, g] of KICKS) { const n = Math.floor((t - t0) * FPS + 1e-6); if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; } return a; };
const camAt = (id: number, f: number): Cam => {
  const keys = CAMS[id];
  let cur = keys[0].c(f);
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    const nx = k.c(f);
    if (k.cut) { cur = nx; continue; }
    const u = glide((f - k.f) / (k.dur ?? 24));
    cur = { p: cur.p.map((v, j) => v + (nx.p[j] - v) * u) as P3, z: Math.exp(Math.log(cur.z) + (Math.log(nx.z) - Math.log(cur.z)) * u), r: cur.r + (nx.r - cur.r) * u };
  }
  return cur;
};
const shotOf = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

// ---------------- one shot (the whole diorama through the 2D camera) ----------------
const View: React.FC<{ id: number; f: number }> = ({ id, f }) => {
  const t = f / FPS, s = SHOTS[id - 1], cam = camAt(id, f), kick = kickAt(t);
  const [tx, ty] = iso(...cam.p), night = id === 11 ? 1 : 0;
  const res = Math.min(4, Math.max(1, cam.z * 1.15));
  const sMan = (2.16 * S) / 1000; // world px per design unit (1000 units = 2.16 m)
  // the man
  const P = poseAt(t);
  const arms: ManyArm[] = ORDER.slice(0, P.n).map(([side, k]) => { const m = P.arms(side, k, t); return { side, a: q(m.a, 2), k: q(m.k, 2), prop: m.prop ?? null, brain: m.brain, spill: m.spill }; });
  const fo: FrontOpts = { mode: "stand", expr: P.expr, look: P.look, blink: P.blink ?? lidAt(t, 3), tilt: q(P.tilt ?? 0, 4), arms, light: -2.1, seed: 4 };
  const manKey = JSON.stringify(fo);
  const [mx, my] = iso(...MAN);
  const sleeping = id === 11, turned = sleeping && t >= B.karwat - LEAD;
  const [sx, sy] = iso(...SLEEP);
  // the octopus
  const showOcto = s.octo;
  const glow = clamp01((t - B.neurons + 0.1) / 0.6) * (t < wt(17) ? 1 : 0), think = clamp01((t - B.soch + 0.1) / 0.8) * (t < wt(16, 9) ? 1 : 0);
  const oexpr = t < B.octo + 0.8 ? "wow" : "happy", owave = t > wt(18) ? 0.6 + 0.4 * Math.sin(t * 8) : 0, otq = q(t, 15), olid = lidAt(t, 9);
  const [ox, oy] = iso(...OCTO);
  const dazed = s.man && !sleeping && P.expr === "dazed";
  const shadow = (x: number, y: number, rx: number) => <ellipse cx={x} cy={y} rx={rx} ry={rx * 0.42} fill="#2a1f3a" opacity={0.28} />;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0",
        transform: `translate(${540 + kick * 5}px, ${820 + kick * 2}px) rotate(${cam.r}rad) scale(${cam.z}) translate(${-tx}px, ${-ty}px)` }}>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Room t={t} night={night} lampOn={sleeping} />
          {s.man && !sleeping && shadow(mx, my, 62)}
          {showOcto && shadow(ox, oy, 48)}
        </svg>
        <ScreenCanvas f={f} />
        {showOcto && <PenCanvas w={600} h={1000} dx={300} dy={975} ax={ox} ay={oy} s={sMan * 0.55} res={res} dep={`${otq}|${glow}|${think}|${oexpr}|${owave}|${olid}`}
          draw={(p) => octopus(p, otq, { glow, think, expr: oexpr, wave: owave, blink: olid })} />}
        {s.man && !sleeping && <PenCanvas w={600} h={1000} dx={300} dy={975} ax={mx} ay={my} s={sMan} res={res} dep={manKey} draw={(p) => bodyFront(p, RAJ, fo)} />}
        {sleeping && <PenCanvas w={600} h={1000} dx={300} dy={975} ax={sx} ay={sy} s={sMan * 0.92} res={res} dep={manKey + turned} rot={60 + (turned ? -12 : 0)} mirror={turned} draw={(p) => bodyFront(p, RAJ, fo)} />}
        {dazed && <PenCanvas w={420} h={210} dx={210} dy={105} ax={mx} ay={my - 1.9 * S} s={0.42} res={res} dep={`st${q((t * 0.9) % 1, 30)}`} draw={(p) => fxStars(p, q((t * 0.9) % 1, 30))} />}
        {s.man && !sleeping && t >= B.kya && t < B.kya + 0.5 && <PenCanvas w={800} h={800} dx={400} dy={400} ax={mx + 60} ay={my - 1.05 * S} s={0.16} res={res} dep={`sp${q((t - B.kya) / 0.5, 30)}`} draw={(p) => fxSplash(p, q((t - B.kya) / 0.5, 30))} />}
        {sleeping && <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          <circle cx={iso(1.38, 0.48, DESK.top + 0.36)[0]} cy={iso(1.38, 0.48, DESK.top + 0.36)[1]} r={160} fill="url(#lampGlow)" />
          <defs><radialGradient id="lampGlow"><stop offset="0" stopColor="#ffd98a" stopOpacity={0.55} /><stop offset="1" stopColor="#ffd98a" stopOpacity={0} /></radialGradient></defs>
        </svg>}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- captions (same as the 3D film) ----------------
const fontFamily = "MontserratBlack";
loadFont({ family: fontFamily, url: staticFile("fonts/Montserrat-900.woff2"), weight: "900" });
type Cap = { a: number; b: number; w: [string, number, number][] };
const CAPS: Cap[] = (() => {
  const groups: [string, number, number][][] = [];
  let cur: [string, number, number][] = [];
  WORDS.forEach(([w, s, e, line], i) => {
    cur.push([w.replace(/"/g, ""), s, e]);
    const txt = cur.map((x) => x[0]).join(" "), next = WORDS[i + 1];
    if (/[.,?!:]$/.test(w) || cur.length >= 3 || txt.length > 14 || !next || next[3] !== line) { groups.push(cur); cur = []; }
  });
  return groups.map((g, i) => { const nx = groups[i + 1]; return { a: g[0][1], b: Math.min(nx ? nx[0][1] : 1e9, g[g.length - 1][2] + 0.45), w: g }; });
})();
const Captions: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS, c = CAPS.find((x) => t >= x.a - 0.02 && t < x.b);
  if (!c) return null;
  const k = Math.min(1, (t - c.a + 0.02) / 0.12), pop = 0.86 + 0.14 * (1 - (1 - k) ** 3);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: "64%", left: "8%", width: "84%", textAlign: "center", fontFamily, fontWeight: 900, fontSize: 92, lineHeight: 1.08,
        letterSpacing: -1, transform: `scale(${pop})`, textTransform: "uppercase" }}>
        {c.w.map(([w, s], i) => {
          const on = t >= s - 0.03, now = on && (i === c.w.length - 1 || t < c.w[i + 1][1] - 0.03);
          return <span key={i} style={{ color: now ? "#ffe14d" : "#ffffff", WebkitTextStroke: "14px #120d18", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(18,13,24,0.55)",
            marginRight: i < c.w.length - 1 ? "0.26em" : 0, display: "inline-block" }}>{w}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

export const IsoShort: React.FC = () => {
  const f = useCurrentFrame();
  const capsOn = (getInputProps() as { captions?: boolean }).captions !== false;
  const s = shotOf(f);
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;
  const golden = s.light === "golden" && !s.night ? clamp01((f - s.a) / 12) : 0;
  const fadeOut = Math.max(0, (f - (TOTAL - 12)) / 12);
  // quick dip between shots: the previous shot fades into the next over 6 frames
  const prev = SHOTS[s.id - 2], dip = prev && f - s.a < 5 ? 1 - (f - s.a + 1) / 6 : 0;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #c8ece6 0%, #8cc9c6 55%, #5e9fae 100%)" }}>
      <View id={s.id} f={f} />
      {dip > 0 && <AbsoluteFill style={{ opacity: dip }}><View id={prev.id} f={f} /></AbsoluteFill>}
      {nightAt(f) > 0 && <AbsoluteFill style={{ background: "#2d3a78", mixBlendMode: "multiply", opacity: 0.6 * nightAt(f) }} />}
      {golden > 0 && <AbsoluteFill style={{ background: "#ffb36b", mixBlendMode: "multiply", opacity: 0.22 * golden }} />}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {capsOn && <Captions f={f} />}
      {fadeOut > 0 && <AbsoluteFill style={{ background: "#000", opacity: fadeOut }} />}
    </AbsoluteFill>
  );
};
