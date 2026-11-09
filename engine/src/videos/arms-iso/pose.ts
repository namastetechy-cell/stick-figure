// Poses for the ten-armed man (same beats as the 3D version), canvas-only.
import { Expr, ManyArm, HandProp, Outfit } from "../arms/toon";
import { FPS, B, wt } from "../arms/story";
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const SWAPS: Record<number, number[]> = {};
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const L = LEAD;
const RAJ: Outfit = { jacket: "#f2b437", pants: "#34466e", boots: "#3a2a22", hat: "hair", hair: "#221814", skin: "#c99067" };
/** base fan per side (degrees from hanging down) and elbow bends; index 0 is the "original" arm */
const FAN = [8, 42, 78, 114, 150], BEND = [8, 28, 32, 26, 18];
type Pose = { expr: Expr; look: number; n: number; arms: (side: -1 | 1, k: number, t: number) => Partial<ManyArm> & { a: number; k: number }; tilt?: number; blink?: number };
const wig = (t: number, k: number, side: number, amp: number, fq: number) => amp * Math.sin(t * fq + k * 1.7 + (side > 0 ? 0.9 : 0));
const fan = (amp = 6, fq = 3) => (side: -1 | 1, k: number, t: number) => ({ a: FAN[k] + wig(t, k, side, amp, fq), k: BEND[k] });
const poseAt = (t: number): Pose => {
  // hook: two arms, then the other eight pop out on "10"
  if (t < wt(1) - L) {
    const n = t < B.ten - L ? 2 : Math.min(10, 2 + 2 * Math.floor((t - B.ten + L) / 0.09 + 1));
    return { expr: t < B.ten - L ? "smile" : t < B.ten + 0.6 ? "shock" : "grin", look: 0, n, arms: fan(t < B.ten ? 2 : 10, 5) };
  }
  // "5 guna tez": busy, every arm flapping
  if (t < wt(2) - L) return { expr: t < B.tez - L ? "grin" : "laugh", look: 0, n: 10, arms: (s, k, tt) => ({ a: FAN[k] + wig(tt, k, s, 22, 16), k: BEND[k] + 20, prop: k === 2 && s > 0 ? "mouse" : null }) };
  // crash before breakfast: arms droop, dizzy
  if (t < wt(3) - L) {
    const cr = t >= B.crash - L;
    return { expr: cr ? "dazed" : "grin", look: 0, n: 10, arms: cr ? (s, k, tt) => ({ a: 6 + k * 9 + wig(tt, k, s, 3, 2), k: 6 }) : fan(14, 10), tilt: cr ? 4 * Math.sin(t * 3) : 0 };
  }
  if (t < wt(5) + 1.3) return { expr: "nervous", look: 1, n: 10, arms: (s, k, tt) => ({ a: 8 + k * 14 + wig(tt, k, s, 4, 2), k: 10 }), tilt: -3 };
  // separate orders: one arm at a time jerks up; then chai, phone, brush land in hands on their words
  if (t < wt(8) - L) {
    const ord = t < wt(7) - L;
    const props: Record<string, HandProp> = {};
    if (t >= B.chai - L) props["1_2"] = "chai";
    if (t >= B.phone - L) props["-1_2"] = "phone";
    if (t >= B.brush - L) props["1_3"] = "brush";
    return { expr: ord ? "stern" : "smile", look: ord ? -1 : 0, n: 10, arms: (s, k, tt) => {
      const active = ord && Math.floor(tt * 6) % 10 === (s > 0 ? k : k + 5);
      const held = props[`${s}_${k}`];
      return { a: held ? 100 + wig(tt, k, s, 4, 3) : FAN[k] + (active ? 40 : 0) + wig(tt, k, s, 3, 3), k: held ? 70 : BEND[k], prop: held ?? null };
    } };
  }
  // chaos: the brush goes into the chai, the phone to the ear upside down, everything spills
  if (t < wt(9) - L) {
    const late = t >= B.kya - L;
    return { expr: late ? "dazed" : "pained", look: 0, n: 10, tilt: 3 * Math.sin(t * 5), arms: (s, k, tt) => {
      const h: HandProp = s > 0 && k === 2 ? "chai" : s > 0 && k === 1 ? "brush" : s < 0 && k === 2 ? "phone" : s < 0 && k === 3 ? "chai" : s > 0 && k === 4 ? "snack" : null;
      return { a: FAN[k] + wig(tt, k, s, 28, 13), k: BEND[k] + 25 * Math.sin(tt * 9 + k), prop: h, spill: h === "chai" && late };
    } };
  }
  // more muscles: everything up, flexing
  if (t < wt(10) - L) return { expr: "grin", look: 0, n: 10, arms: (s, k, tt) => ({ a: 120 + k * 12 + wig(tt, k, s, 6, 6), k: -70 - 10 * Math.sin(tt * 6 + k) }) };
  // energy -> always hungry: snacks in every hand, then the empty stomach
  if (t < wt(11) - L) {
    const hungry = t >= B.bhookh - L;
    return { expr: hungry ? "pained" : (t * 1.8) % 1 < 0.5 ? "lick" : "grin", look: 0, n: 10, arms: (s, k, tt) => ({ a: hungry ? 10 + k * 8 : 70 + k * 18 + wig(tt, k, s, 10, 7), k: hungry ? 8 : 40, prop: hungry ? null : "snack" }) };
  }
  // night: lying on the bed (stage() rolls the card), arms everywhere
  if (t < wt(13) - L) {
    const turned = t >= B.karwat - L;
    return { expr: turned ? "pained" : "neutral", look: 0, n: 10, blink: turned ? 0 : 1, arms: (s, k, tt) => ({ a: 30 + k * 30 + wig(tt, k, s, turned ? 12 : 3, turned ? 9 : 1.5), k: 40 }) };
  }
  // octopus beats: the man watches, then wears a tiny brain over every hand
  if (t < wt(16) - L) return { expr: t < B.octo + 1.0 ? "shock" : "smile", look: -1, n: 10, arms: fan(5, 3) };
  if (t < wt(17) - L) return { expr: t < B.brains - L ? "smile" : "grin", look: 0, n: 10, arms: (s, k, tt) => ({ ...fan(6, 3)(s, k, tt), a: 60 + k * 22 + wig(tt, k, s, 5, 3), k: 20, brain: tt >= B.brains - L }) };
  // ending: wave with all ten
  return { expr: "laugh", look: 0, n: 10, arms: (s, k, tt) => ({ a: 110 + k * 14 + wig(tt, k, s, 18, 9), k: -20 }) };
};
const ORDER: [(-1 | 1), number][] = [[-1, 0], [1, 0], [-1, 1], [1, 1], [-1, 2], [1, 2], [-1, 3], [1, 3], [-1, 4], [1, 4]];

export { RAJ, poseAt, ORDER, lidAt, q, LEAD };
