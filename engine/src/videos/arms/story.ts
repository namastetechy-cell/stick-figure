// "Agar ek din ke liye aapke 10 haath ho jaayein?" (WhatIfyTV): ~58 s vertical short. Every shot, pose, screen state
// and caption is keyed to the word times in words.ts (generated from shorts/ten-arms/words.json), so re-timing to the
// recorded voice-over only needs a new words.json.
import { WORDS } from "./words";
export const FPS = 30;
export const D0 = 6.0;
export const FY = D0 + 0.12;
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- word times ----------------
const lineWords = (l: number) => WORDS.filter((w) => w[3] === l);
/** start of word k of line l (seconds) */
export const wt = (l: number, k = 0) => lineWords(l)[Math.min(k, lineWords(l).length - 1)][1];
/** end of line l */
export const le = (l: number) => { const w = lineWords(l); return w[w.length - 1][2]; };
const NLINES = Math.max(...WORDS.map((w) => w[3])) + 1;
export const TOTAL = Math.round((le(NLINES - 1) + 1.3) * FPS);
const cut = (l: number) => Math.round((wt(l) - 0.12) * FPS);

// ---------------- the set ----------------
export const MAN: V3 = [1.05, FY, -1.3];
export const MAN_EYES: V3 = [1.05, FY + 1.5, -1.3];
export const OCTO: V3 = [-0.05, FY, -0.55];
export const DESK = { x0: -1.0, x1: 0.62, z0: -2.42, z1: -1.58, top: FY + 0.72 };
export const SCREEN = { x: -0.18, y: FY + 1.12, z: -2.06, w: 0.76, h: 0.57 };
export const TOWER = { x: -1.45, z: -2.08 };
export const LAMP = { x: -0.78, z: -1.86 };
export const BULB: V3 = [-0.58, DESK.top + 0.42, -1.86];
export const RULER = { x: 0.36, z0: -1.66, z1: -1.98 };
export const ROUTER: V3 = [1.92, FY + 1.6, -2.36];
export const CLOCK: V3 = [1.92, FY + 2.22, -2.43];
export const BED_TOP = FY + 0.5;
/** the sleeper's feet on the bed (card origin), lying along z */
export const SLEEP_AT: V3 = [-1.72, BED_TOP + 0.03, 2.2];

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number; man: boolean; octo: boolean; night?: boolean };
const S = (id: number, a: number, b: number, o: Partial<ShotDef> = {}): ShotDef => ({ id, a, b, light: "day", sunAz: 140, sunEl: 52, man: true, octo: false, ...o });
export const SHOTS: ShotDef[] = [
  S(1, 0, cut(1)),                                         // hook: 10 arms pop out
  S(2, cut(1), cut(2)),                                    // 5x faster work
  S(3, cut(2), cut(3)),                                    // brain crash before breakfast
  S(4, cut(3), cut(4)),                                    // Kyun?
  S(5, cut(4), cut(5), { man: false, sunAz: 150 }),        // screen: the brain's map has room for 2 hands
  S(6, cut(5), cut(6), { man: false, sunAz: 150 }),        // screen: 10 hands overflow
  S(7, cut(6), cut(8)),                                    // separate orders: chai, phone, brush
  S(8, cut(8), cut(9)),                                    // chaos
  S(9, cut(9), cut(10), { sunEl: 40 }),                    // more muscles (low hero)
  S(10, cut(10), cut(11)),                                 // more energy, always hungry
  S(11, cut(11), cut(13), { light: "golden", sunAz: 160, sunEl: 30, night: true }), // night: can't sleep
  S(12, cut(13), cut(14), { octo: true }),                 // the octopus
  S(13, cut(14), cut(15), { man: false, sunAz: 150 }),     // screen: neurons in the arms
  S(14, cut(15), cut(16), { octo: true }),                 // each arm thinks a little
  S(15, cut(16), cut(17), { octo: true }),                 // a tiny brain in every hand
  S(16, cut(17), cut(18), { man: false, sunAz: 150 }),     // screen: subscribe
  S(17, cut(18), TOTAL, { light: "golden", sunAz: 150, sunEl: 24, octo: true }), // crane out
];
export const XFADE: Record<number, number> = { 11: 10, 12: 10, 17: 10 };
export const FLASH_AT = cut(1);
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
/** night tint (CSS multiply over the frame) for the bed shot */
export const nightAt = (f: number) => {
  const s = SHOTS[10];
  return clamp01((f - s.a + 5) / 10) * clamp01((s.b + 5 - f) / 10);
};

// ---------------- key beats (seconds) ----------------
export const B = {
  ten: wt(0, 6), tez: wt(1, 6), crash: wt(2, 9), kyun: wt(3), two: wt(4, 11), tenHands: wt(5, 2),
  hukum: wt(6, 4), chai: wt(7, 2), phone: wt(7, 6), brush: wt(7, 9), chaos: wt(8, 2), kya: wt(8, 9),
  muscles: wt(9, 5), energy: wt(10, 5), bhookh: wt(10, 9), raat: wt(11), karwat: wt(12, 6), beech: wt(12, 10),
  octo: wt(13, 4), neurons: wt(14, 8), haathon: wt(14, 10), soch: wt(15, 4), brains: wt(16, 10), sub: wt(17, 6), whatify: wt(18, 5),
};

// ---------------- screen states ----------------
export type Screen =
  | { kind: "todo"; n: number }
  | { kind: "crash"; k: number }
  | { kind: "brain"; hands: number; over: number; hot: number }
  | { kind: "battery"; v: number; food: number }
  | { kind: "sleep" }
  | { kind: "octo"; glow: number; t: number }
  | { kind: "sub"; ptr: number; done: number; t: number };
export const screenAt = (f: number): Screen => {
  const t = f / FPS;
  if (t < B.crash) return { kind: "todo", n: t < B.tez ? 1 : Math.min(8, 1 + Math.floor((t - B.tez) * 6)) };
  if (t < wt(4) - 0.12) return { kind: "crash", k: clamp01((t - B.crash) / 0.3) };
  if (t < wt(5) - 0.12) return { kind: "brain", hands: 2, over: 0, hot: clamp01((t - B.two + 0.1) / 0.3) };
  if (t < wt(10) - 0.12) return { kind: "brain", hands: Math.min(10, 2 + Math.floor(Math.max(0, t - B.tenHands + 0.1) * 24)), over: clamp01((t - B.tenHands) / 0.4), hot: 0 };
  if (t < wt(11) - 0.12) return { kind: "battery", v: Math.max(0.08, 0.7 - 0.62 * clamp01((t - B.energy) / 1.2)), food: clamp01((t - B.bhookh) / 0.3) };
  if (t < wt(13) - 0.12) return { kind: "sleep" };
  if (t < wt(17) - 0.12) return { kind: "octo", glow: clamp01((t - B.neurons + 0.1) / 0.6), t: Math.round(t * 15) / 15 };
  return { kind: "sub", ptr: smooth((t - wt(17, 3)) / 0.7), done: clamp01((t - B.sub) / 0.25), t: Math.round(t * 15) / 15 };
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });
const fr = (s: number) => Math.round(s * FPS);
const a0 = (id: number) => SHOTS[id - 1].a;
const scrLow: V3 = [SCREEN.x, SCREEN.y - 0.2, SCREEN.z];
const man = (dy: number, dx = 0): V3 => [MAN[0] + dx, FY + dy, MAN[2]];

const C1a = (f: number) => dolly([3.3, FY + 1.85, 3.0], [0.3, FY + 1.05, -1.4], pushK(f, 0, 0.0028), { fov: 48 });
const C1b = (f: number) => dolly([2.0, FY + 1.6, 2.0], man(1.12, -0.05), pushK(f, fr(B.ten), 0.0025, 0.007, 30), { fov: 46, roll: 0.035 });
const C2 = (f: number) => dolly([2.45, FY + 1.5, 1.45], [0.62, FY + 0.95, -1.5], pushK(f, a0(2), 0.0028, 0.006, 30), { fov: 46 });
const C3 = (f: number) => dolly([1.85, FY + 1.6, 1.45], man(1.0), pushK(f, a0(3), 0.0025), { fov: 44 });
const C3b = (f: number) => dolly([1.6, FY + 1.55, 0.75], man(1.12), pushK(f, fr(B.crash), 0.002, 0.008, 30), { fov: 42, roll: -0.04 });
const C4 = (f: number) => dolly([1.3, FY + 1.5, 0.35], man(1.2), pushK(f, a0(4), 0.004), { fov: 38, roll: 0.03 });
const C5 = (f: number) => dolly([SCREEN.x + 0.25, SCREEN.y - 0.2, -0.28], scrLow, pushK(f, a0(5), 0.0025, 0.006, 30), { fov: 40 });
const C6 = (f: number) => dolly([SCREEN.x - 0.2, SCREEN.y - 0.2, -0.32], scrLow, pushK(f, a0(6), 0.003, 0.008, 30), { fov: 40, roll: 0.03 });
const C7 = (f: number) => dolly([1.7, FY + 1.4, 2.3], man(1.0, -0.05), pushK(f, a0(7), 0.0022), { fov: 46 });
const C7b = (f: number) => dolly([1.55, FY + 1.45, 1.55], man(1.08, -0.05), pushK(f, fr(B.chai), 0.002), { fov: 46, roll: -0.03 });
const C8 = (f: number) => dolly([1.5, FY + 1.5, 1.15], man(1.12), pushK(f, a0(8), 0.0035), { fov: 44, roll: 0.04 });
const C9 = (f: number) => dolly([1.4, FY + 0.55, 0.75], man(1.3), pushK(f, a0(9), 0.0025, 0.006, 30), { fov: 52 });
const C10 = (f: number) => dolly([2.3, FY + 1.5, 1.5], [0.55, FY + 0.95, -1.55], pushK(f, a0(10), 0.0025), { fov: 46 });
const C10b = (f: number) => dolly([1.55, FY + 1.45, 0.65], man(1.15), pushK(f, fr(B.bhookh), 0.003, 0.007, 30), { fov: 42, roll: 0.035 });
const C11 = (f: number) => dolly([1.3, FY + 2.5, 1.25], [-1.9, BED_TOP - 0.35, 1.4], pushK(f, a0(11), 0.0022), { fov: 50 });
const C11b = (f: number) => dolly([0.45, FY + 2.0, 1.25], [-1.9, BED_TOP - 0.25, 1.4], pushK(f, fr(B.karwat), 0.002, 0.007, 30), { fov: 46, roll: -0.04 });
const C12 = (f: number) => dolly([2.2, FY + 1.45, 2.6], [0.45, FY + 0.85, -0.9], pushK(f, a0(12), 0.0025), { fov: 48 });
const C12b = (f: number) => dolly([1.0, FY + 0.95, 1.6], [OCTO[0], FY + 0.6, OCTO[2]], pushK(f, fr(B.octo), 0.0025, 0.006, 30), { fov: 44 });
const C13 = (f: number) => dolly([SCREEN.x + 0.15, SCREEN.y - 0.2, -0.25], scrLow, pushK(f, a0(13), 0.0025), { fov: 40 });
const C14 = (f: number) => dolly([0.45, FY + 0.95, 1.05], [OCTO[0], FY + 0.42, OCTO[2]], pushK(f, a0(14), 0.003), { fov: 42, roll: 0.03 });
const C15 = (f: number) => dolly([1.75, FY + 1.4, 2.25], man(1.05, -0.1), pushK(f, a0(15), 0.0025, 0.005, 30), { fov: 46 });
const C16 = (f: number) => dolly([SCREEN.x + 0.2, SCREEN.y - 0.2, -0.28], scrLow, pushK(f, a0(16), 0.0025, 0.007, 30), { fov: 40 });
const C17a = (f: number) => dolly([2.0, FY + 1.45, 2.3], [0.5, FY + 0.95, -1.0], pushK(f, a0(17), 0.002), { fov: 46 });
const C17b = (f: number): Shot => {
  const f0 = a0(17) + 30, u = glide((f - f0) / (TOTAL - f0)), a = C17a(f0);
  const P: V3 = [6.4, FY + 5.8, 8.8], L: V3 = [0.0, FY + 0.8, -1.3];
  return { pos: a.pos.map((v, i) => v + (P[i] - v) * u) as V3, look: a.look.map((v, i) => v + (L[i] - v) * u) as V3, fov: 46, roll: 0 };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: C1a }, { f: fr(B.ten) - 12, dur: 28, s: C1b }],
  2: [{ f: a0(2), s: C2 }],
  3: [{ f: a0(3), s: C3 }, { f: fr(B.crash), cut: true, s: C3b }],
  4: [{ f: a0(4), s: C4 }],
  5: [{ f: a0(5), s: C5 }],
  6: [{ f: a0(6), s: C6 }],
  7: [{ f: a0(7), s: C7 }, { f: fr(B.chai) - 10, dur: 26, s: C7b }],
  8: [{ f: a0(8), s: C8 }, { f: fr(B.kya) - 8, dur: 20, s: rolled(C8, -0.04) }],
  9: [{ f: a0(9), s: C9 }],
  10: [{ f: a0(10), s: C10 }, { f: fr(B.bhookh), cut: true, s: C10b }],
  11: [{ f: a0(11), s: C11 }, { f: fr(B.karwat) - 10, dur: 24, s: C11b }],
  12: [{ f: a0(12), s: C12 }, { f: fr(B.octo) - 10, dur: 26, s: C12b }],
  13: [{ f: a0(13), s: C13 }],
  14: [{ f: a0(14), s: C14 }],
  15: [{ f: a0(15), s: C15 }],
  16: [{ f: a0(16), s: C16 }],
  17: [{ f: a0(17) - 6, s: C17a }, { f: a0(17) + 30, cut: true, s: C17b }],
};

const KICKS: [number, number][] = [[B.ten, 0.6], [B.crash, 1.2], [B.tenHands, 0.6], [B.chaos, 0.7], [B.karwat + 0.2, 0.6], [B.sub, 0.6]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(f / FPS);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens blur ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const scr: V3 = [SCREEN.x, SCREEN.y, SCREEN.z];
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: fr(B.ten) - 12, dur: 28, cInf: 8, focus: () => MAN_EYES },
  { f: a0(2), cInf: 5, focus: () => MAN_EYES },
  { f: a0(3), cInf: 8, focus: () => MAN_EYES },
  { f: a0(4), cInf: 14, focus: () => MAN_EYES },
  { f: a0(5), cInf: 12, focus: () => scr },
  { f: a0(7), cInf: 6, focus: () => MAN_EYES },
  { f: a0(8), cInf: 11, focus: () => MAN_EYES },
  { f: a0(9), cInf: 6, focus: () => MAN_EYES },
  { f: a0(10), cInf: 6, focus: () => MAN_EYES },
  { f: a0(11), cInf: 7, focus: () => [-2.25, BED_TOP + 0.2, 1.3] },
  { f: a0(12), cInf: 6, focus: () => [OCTO[0], FY + 0.6, OCTO[2]] },
  { f: a0(13), cInf: 12, focus: () => scr },
  { f: a0(14), cInf: 13, focus: () => [OCTO[0], FY + 0.5, OCTO[2]] },
  { f: a0(15), cInf: 6, focus: () => MAN_EYES },
  { f: a0(16), cInf: 12, focus: () => scr },
  { f: a0(17), cInf: 5, focus: () => MAN_EYES },
  { f: a0(17) + 30, dur: 40, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const FOREGROUND: { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number }[] = [];
