// (speed short) Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, swingKid, soldier, townsfolk, OFFICER, KID, PARENT, fxNote, fxBurst, fxSplash, fxStars, fxCreak, fxRing, fxBlob, fxShadow, fxContact, fxPlank, fxDrum,
  Outfit, Expr, FrontOpts, SideOpts, ManyArm, HandProp, octopus,
} from "./toon";
import { FPS, SHOTS, V3, smooth, clamp01, MAN, OCTO, SLEEP_AT, B, wt } from "./story";
import { LIGHTS } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const SOLDIER = [0, 1, 2, 3].map((v) => soldier(v));
const BARE = [0, 1, 2, 3].map((v) => soldier(v, { hat: null }));
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const vOf = (i: number) => (i * 7 + (i >> 2)) % 4;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
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

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};



// ---------------- the man with ten arms + the octopus (ten-arms short) ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const L = LEAD;
const RAJ: Outfit = { jacket: "#f2b437", pants: "#34466e", boots: "#3a2a22", hat: "hair", hair: "#221814", skin: "#c99067" };
const RAJ_WHO: Who = { i: 3, o: RAJ, okey: "raj" };
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
const manDraw = (cam: CamInfo, t: number, out: Stage, at: V3, place: Partial<Place> = {}) => {
  const P = poseAt(t);
  const arms: ManyArm[] = ORDER.slice(0, P.n).map(([side, k]) => {
    const m = P.arms(side, k, t);
    return { side, a: q(m.a, 2), k: q(m.k, 2), prop: m.prop ?? null, brain: m.brain, spill: m.spill };
  });
  const fo: FrontOpts = { mode: "stand", expr: P.expr, look: P.look, blink: P.blink ?? lidAt(t, 3), tilt: q(P.tilt ?? 0, 4), arms };
  const pl = person(cam, RAJ_WHO, at[0], at[1], at[2], { side: false, mirror: false }, fo, {});
  out.places.push({ ...pl, ...place });
  return P;
};
const octoAt = (cam: CamInfo, t: number, out: Stage) => {
  const glow = clamp01((t - B.neurons + 0.1) / 0.6) * (t < wt(17) ? 1 : 0);
  const think = clamp01((t - B.soch + 0.1) / 0.8) * (t < wt(16, 9) ? 1 : 0);
  const expr = t < B.octo + 0.8 ? "wow" : "happy";
  const wave = t > wt(18) ? 0.6 + 0.4 * Math.sin(t * 8) : 0;
  const tq = q(t, 15), lid = lidAt(t, 9);
  const [x, y, z] = OCTO, d = cam.pos.distanceTo(tmp.set(x, y + 0.5, z));
  const [w, h, k] = tier(d * 1.6);
  out.places.push({ key: `octo|${tq}|${q(glow, 10)}|${q(think, 15)}|${expr}|${q(wave, 15)}|${lid}`, x, y, z, scale: 0.55,
    draw: (p) => octopus(p, tq, { glow, think, expr, wave, blink: lid }), size: [w, h, k] });
  blob(out, x, y, z, 1.4);
};
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  if (s.man && id === 11) {
    // lying on the bed along z: feet at SLEEP_AT, head toward -z; "karwat" rolls him onto his side (mirror + lift)
    const turned = t >= B.karwat - L, roll = turned ? -Math.PI / 2 + 0.25 : -Math.PI / 2;
    manDraw(cam, t, out, SLEEP_AT, { roll, yaw: Math.PI / 2, mirror: turned, scale: 0.9 });
  } else if (s.man) {
    const P = manDraw(cam, t, out, MAN);
    blob(out, MAN[0], MAN[1], MAN[2], 1.3);
    if (P.expr === "dazed") {
      const u = q((t * 0.9) % 1, 30);
      out.fx.push({ key: `stars${u}`, cw: 420, ch: 210, draw: (p) => fxStars(p, u), x: MAN[0], y: MAN[1] + 1.85, z: MAN[2] + 0.05, w: 0.7, h: 0.35 });
    }
    // chai splash in the chaos beat
    if (t >= B.kya && t < B.kya + 0.5) {
      const u = q((t - B.kya) / 0.5, 30);
      out.fx.push({ key: `splash${u}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, u), x: MAN[0] + 0.45, y: MAN[1] + 1.0, z: MAN[2] + 0.1, w: 0.9, h: 0.9 });
    }
  }
  if (s.octo) octoAt(cam, t, out);
  return out;
};
export { FPS };
