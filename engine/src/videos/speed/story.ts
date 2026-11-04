// "What if your computer moved 10,000 GB a second?": 35 s vertical short. Timeline timed to
// shorts/fast-computer/voice/words.json (frame = seconds x 30). Camera grammar from the bridge short: slow push-ins on
// every hold, smootherstep glides of 18-40 f, cuts on big reframes, flip-sign kicks on impacts.
export const FPS = 30;
export const TOTAL = 1050;
export const D0 = 6.0; // ground height of the town (build.ts)
export const FY = D0 + 0.12; // bedroom floor top
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- the set (world.ts builds it, cast.ts stands the kid in it) ----------------
export const KID_AT: V3 = [1.12, FY, -1.42];
export const KID_EYES: V3 = [1.12, FY + 1.13, -1.42];
export const DESK = { x0: -1.0, x1: 0.62, z0: -2.42, z1: -1.58, top: FY + 0.72 };
export const SCREEN = { x: -0.18, y: FY + 1.12, z: -2.06, w: 0.76, h: 0.57 }; // glowing screen face (4:3)
export const TOWER = { x: -1.45, z: -2.08 };
export const LAMP = { x: -0.78, z: -1.86 };
export const BULB: V3 = [-0.58, DESK.top + 0.42, -1.86];
export const RULER = { x: 0.36, z0: -1.66, z1: -1.98 }; // 32 cm ruler along z; the light pulse runs 30 cm
export const ROUTER: V3 = [1.92, FY + 1.6, -2.36];
export const CLOCK: V3 = [1.92, FY + 2.22, -2.43];

// ---------------- key words (seconds, from words.json) ----------------
export const W = {
  tenK: 1.38, ssd: 3.42, thousand: 5.86, installs: 9.08, faster2: 11.14, blink: 11.68, luckily: 12.18, ready: 13.24,
  unluckily: 13.9, hour: 15.96, and: 16.44, light: 18.32, nano: 18.94, travels: 20.08, cm: 21.02, so: 21.8, memory: 22.66,
  beside: 23.28, like: 24.26, snacks: 24.46, wild: 26.82, move: 29.1, eightK: 29.64, future: 31.44, waiting: 32.7,
};
const F = (s: number) => Math.round(s * FPS);

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number; kid: boolean };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 102, light: "day", kid: true, sunAz: 140, sunEl: 52 },         // hook
  { id: 2, a: 102, b: 176, light: "day", kid: false, sunAz: 150, sunEl: 52 },      // screen: slow SSD bar
  { id: 3, a: 176, b: 222, light: "day", kid: true, sunAz: 140, sunEl: 52 },       // kid: a thousand times faster
  { id: 4, a: 222, b: 334, light: "day", kid: true, sunAz: 140, sunEl: 52 },       // the game installs
  { id: 5, a: 334, b: 365, light: "day", kid: true, sunAz: 140, sunEl: 52 },       // faster than a blink (CU)
  { id: 6, a: 365, b: 414, light: "day", kid: false, sunAz: 150, sunEl: 40 },      // luckily: the PC is ready
  { id: 7, a: 414, b: 493, light: "day", kid: true, sunAz: 140, sunEl: 52 },       // unluckily: Wi-Fi + clock
  { id: 8, a: 493, b: 565, light: "day", kid: false, sunAz: 150, sunEl: 52 },      // light: the lamp
  { id: 9, a: 565, b: 652, light: "day", kid: false, sunAz: 160, sunEl: 60 },      // ruler: 30 cm per nanosecond
  { id: 10, a: 652, b: 726, light: "day", kid: false, sunAz: 150, sunEl: 52 },     // screen: memory beside the chip
  { id: 11, a: 726, b: 800, light: "day", kid: true, sunAz: 140, sunEl: 52 },      // snacks on the desk
  { id: 12, a: 800, b: 845, light: "day", kid: true, sunAz: 140, sunEl: 52 },      // the wild part
  { id: 13, a: 845, b: 940, light: "day", kid: false, sunAz: 150, sunEl: 52 },     // screen: AI chip gauge
  { id: 14, a: 940, b: TOTAL, light: "golden", kid: true, sunAz: 150, sunEl: 24 },  // crane out over the town
];
export const XFADE: Record<number, number> = { 14: 10 };
export const FLASH_AT = 102;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- screen states (what the monitor shows at frame f) ----------------
export type Screen =
  | { kind: "download"; p: number; icon: "box" | "game" | "wifi"; pace: "snail" | "rocket" | "none"; done: number }
  | { kind: "chip"; d: number; hot: number }
  | { kind: "gauge"; v: number }
  | { kind: "ok"; k: number };
export const screenAt = (f: number): Screen => {
  const t = f / FPS;
  if (f < 102) { // hook: crawling, then the rocket on "ten thousand"
    const z = smooth((t - W.tenK - 0.05) / 0.35);
    return { kind: "download", icon: "box", pace: z > 0 ? "rocket" : "snail", p: 0.08 + 0.04 * clamp01(t / 1.4) + 0.88 * z, done: clamp01((t - W.tenK - 0.4) / 0.5) };
  }
  if (f < 222) return { kind: "download", icon: "box", pace: "snail", p: 0.03 + 0.06 * clamp01((t - 3.4) / 4), done: 0 };
  if (f < 365) { // the game: 15 ms is under one frame, so the bar is empty, then full
    const full = t >= W.installs;
    return { kind: "download", icon: "game", pace: full ? "rocket" : "none", p: full ? 1 : 0, done: clamp01((t - W.installs) / 0.3) };
  }
  if (f < 414) return { kind: "ok", k: clamp01((t - W.luckily) / 0.4) };
  if (f < 652) return { kind: "download", icon: "wifi", pace: "snail", p: 0.02 + 0.03 * clamp01((t - 13.8) / 22), done: 0 };
  if (f < 726) return { kind: "chip", d: 1 - smooth((t - W.memory) / 0.9), hot: 0 };
  if (f < 940) return { kind: "gauge", v: 0.08 + 0.86 * easeOut((t - W.move + 0.05) / 1.1) };
  return { kind: "download", icon: "wifi", pace: "snail", p: 0.05 + 0.03 * clamp01((t - 31.3) / 4), done: 0 };
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

const scr: V3 = [SCREEN.x, SCREEN.y, SCREEN.z];
const kidFace = (dx = 0): V3 => [KID_EYES[0] + dx, KID_EYES[1] - 0.02, KID_EYES[2]];
/** look point below the face/screen so the subject sits in the upper half, clear of the captions */
const kidLow = (dx = 0): V3 => [KID_EYES[0] + dx, KID_EYES[1] - 0.3, KID_EYES[2]];
const scrLow: V3 = [SCREEN.x, SCREEN.y - 0.2, SCREEN.z];
// 1 hook: wide 3/4 of the room, glide closer on "ten thousand gigabytes"
const S1a = (f: number) => dolly([2.9, FY + 1.75, 2.6], [0.05, FY + 0.95, -1.8], pushK(f, 0, 0.0028), { fov: 46 });
const S1b = (f: number) => dolly([2.05, FY + 1.35, 0.85], [0.55, FY + 0.95, -1.75], pushK(f, 52, 0.0025, 0.006, 30), { fov: 42, roll: 0.035 });
// 2 screen insert (slow bar)
const S2 = (f: number) => dolly([SCREEN.x + 0.25, SCREEN.y - 0.2, -0.28], scrLow, pushK(f, 102, 0.0028), { fov: 40 });
// 3 kid MS shock (roll on "faster")
const S3 = (f: number) => dolly([1.75, FY + 1.2, 0.75], kidLow(-0.05), pushK(f, 176, 0.0025, 0.006, 30), { fov: 38 });
// 4 desk + kid, punch on "installs"
const S4a = (f: number) => dolly([2.05, FY + 1.42, 1.25], [0.35, FY + 1.0, -1.8], pushK(f, 222, 0.0025), { fov: 42 });
const S4b = (f: number) => dolly([1.55, FY + 1.3, 0.35], [0.4, FY + 0.95, -1.85], pushK(f, 270, 0.002, 0.007, 30), { fov: 40, roll: -0.035 });
// 5 kid CU blink
const S5 = (f: number) => dolly([1.4, FY + 1.12, 0.05], kidLow(), pushK(f, 334, 0.003), { fov: 36 });
// 6 low hero of the PC tower
const S6 = (f: number) => dolly([-0.35, FY + 0.32, -0.25], [TOWER.x, FY + 0.6, TOWER.z], pushK(f, 365, 0.0025, 0.006, 30), { fov: 46, roll: 0.03 });
// 7 router + clock + slumped kid
const S7a = (f: number) => dolly([0.55, FY + 1.5, 1.15], [1.6, FY + 1.45, -2.2], pushK(f, 414, 0.0025), { fov: 46 });
const S7b = (f: number) => dolly([0.55, FY + 1.25, 1.35], [1.5, FY + 1.05, -2.2], pushK(f, 470, 0.0025), { fov: 52, roll: 0.03 });
// 8 the desk lamp switches on at "light"
const S8 = (f: number) => dolly([-0.05, FY + 1.18, -0.55], [-0.72, DESK.top + 0.3, -1.9], pushK(f, 493, 0.0025, 0.007, 30), { fov: 40 });
// 9 ruler from above: the pulse runs away from the lens (up the frame)
const S9 = (f: number) => dolly([RULER.x + 0.02, DESK.top + 0.5, -1.36], [RULER.x, DESK.top, -1.84], pushK(f, 565, 0.0022), { fov: 44 });
// 10 screen insert (chip)
const S10 = (f: number) => dolly([SCREEN.x - 0.2, SCREEN.y - 0.2, -0.3], scrLow, pushK(f, 652, 0.0028, 0.005, 30), { fov: 40, roll: -0.02 });
// 11 kid with the snack
const S11 = (f: number) => dolly([1.85, FY + 1.15, 0.55], kidLow(-0.1), pushK(f, 726, 0.0025), { fov: 38 });
// 12 kid CU "the wild part"
const S12 = (f: number) => dolly([1.35, FY + 1.12, 0.0], kidLow(), pushK(f, 800, 0.003, 0.007, 30), { fov: 36, roll: 0.04 });
// 13 screen insert (gauge)
const S13 = (f: number) => dolly([SCREEN.x + 0.15, SCREEN.y - 0.2, -0.25], scrLow, pushK(f, 845, 0.0025, 0.006, 30), { fov: 40 });
// 14 golden: start on desk + kid, then crane up and out over the town
const S14a = (f: number) => dolly([1.95, FY + 1.4, 1.2], [0.3, FY + 1.0, -1.8], pushK(f, 935, 0.002), { fov: 42 });
const S14b = (f: number): Shot => {
  const u = glide((f - 975) / 75);
  const a = S14a(975);
  const P: V3 = [6.2, FY + 5.6, 8.8], L: V3 = [-0.2, FY + 0.7, -1.6];
  return { pos: a.pos.map((v, i) => v + (P[i] - v) * u) as V3, look: a.look.map((v, i) => v + (L[i] - v) * u) as V3, fov: 42 + 4 * u, roll: 0 };
};

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 38, dur: 32, s: S1b }],
  2: [{ f: 102, s: S2 }],
  3: [{ f: 176, s: S3 }, { f: 196, dur: 20, s: rolled(S3, 0.04) }],
  4: [{ f: 222, s: S4a }, { f: 268, dur: 22, s: S4b }],
  5: [{ f: 334, s: S5 }],
  6: [{ f: 365, s: S6 }],
  7: [{ f: 414, s: S7a }, { f: 468, dur: 26, s: S7b }],
  8: [{ f: 493, s: S8 }],
  9: [{ f: 565, s: S9 }],
  10: [{ f: 652, s: S10 }],
  11: [{ f: 726, s: S11 }, { f: 760, dur: 24, s: rolled(S11, -0.035) }],
  12: [{ f: 800, s: S12 }],
  13: [{ f: 845, s: S13 }],
  14: [{ f: 935, s: S14a }, { f: 975, cut: true, s: S14b }],
};

/** impact kicks: offset flips sign every frame, decays over 7 f */
const KICKS: [number, number][] = [[W.tenK + 0.36, 0.6], [W.installs, 1.0], [W.light, 0.5], [W.eightK + 0.1, 0.8]];
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

// ---------------- lens blur (cInf px at 1080 wide; 0 = sharp) ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 38, dur: 32, cInf: 9, focus: () => KID_EYES },
  { f: 102, cInf: 12, focus: () => scr },
  { f: 176, cInf: 13, focus: () => KID_EYES },
  { f: 222, cInf: 7, focus: () => KID_EYES },
  { f: 334, cInf: 15, focus: () => KID_EYES },
  { f: 365, cInf: 12, focus: () => [TOWER.x, FY + 0.6, TOWER.z + 0.3] },
  { f: 414, cInf: 8, focus: () => KID_EYES },
  { f: 493, cInf: 13, focus: () => BULB },
  { f: 565, cInf: 12, focus: () => [RULER.x, DESK.top, -1.82] },
  { f: 652, cInf: 12, focus: () => scr },
  { f: 726, cInf: 12, focus: () => KID_EYES },
  { f: 800, cInf: 15, focus: () => KID_EYES },
  { f: 845, cInf: 12, focus: () => scr },
  { f: 940, cInf: 6, focus: () => KID_EYES },
  { f: 975, dur: 40, cInf: 0 },
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const FOREGROUND: { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number }[] = [];
export { F };
