// The whole place as one three.js scene: sky, clouds, the painted town (build.ts) around a square, and in the middle
// of the square a cutaway kid's bedroom (no ceiling, open on two sides, so the sun lights it and the crane can rise
// out of it): planks, wallpaper, window, bed, desk, monitor with a live Canvas2D screen, PC tower, desk lamp, ruler,
// router shelf and a wall clock. update(id, f, camera) poses everything for shot `id` at frame f.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import { Batch, boxGeo, V, lam, buildTown, Kit, Ray } from "./build";
import { ctex, rep, planksHD, cobbleHD, grassHD, cloudHD, rng } from "./paint";
import { Pen } from "./toon";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone, twoTone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import {
  FPS, D0, FY, SHOTS, camAt, ShotDef, screenAt, Screen, SCREEN, DESK, TOWER, LAMP, BULB, RULER, ROUTER, CLOCK, W, clamp01, smooth,
} from "./story";

// ---------------- assets ----------------
const KENNEY = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
  "plant_bush", "hedge", "flower_redA", "flower_yellowA", "flower_purpleA", "lantern", "cart", "stall-red", "stall-green", "stall-bench",
  "banner-red", "banner-green", "windmill"];
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) {
    const loader = new GLTFLoader();
    kitP = Promise.all(KENNEY.map((n) => loader.loadAsync(staticFile(`bridge/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit);
  }
  return kitP;
};

// ---------------- painted textures for the room ----------------
const wallpaper = () => ctex("wallpaper", 512, 512, (g, r) => {
  g.fillStyle = "#86bfb4"; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(x, 0, 22, 512); }
  for (let y = 16; y < 512; y += 64) for (let x = 43; x < 512; x += 64) {
    g.fillStyle = "rgba(255,246,220,0.55)"; g.beginPath(); g.arc(x + (y % 128 ? 0 : 32) - 32, y, 5, 0, 7); g.fill();
  }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(30,60,60,${0.03 * r()})`; g.fillRect(r() * 512, r() * 512, 3, 3); }
});
const rugTex = () => ctex("rug", 512, 512, (g) => {
  const c = [["#e0a64b", 250], ["#c9573f", 215], ["#e0a64b", 190], ["#f2dfb5", 150], ["#5b8fb8", 128], ["#f2dfb5", 92], ["#c9573f", 60]] as const;
  for (const [col, rr] of c) { g.fillStyle = col; g.beginPath(); g.arc(256, 256, rr, 0, 7); g.fill(); }
});
const posterTex = () => ctex("poster", 360, 480, (g) => {
  const p = new Pen(g);
  g.fillStyle = "#24325e"; g.fillRect(0, 0, 360, 480);
  for (let i = 0; i < 40; i++) p.dot((i * 97) % 360, (i * 61) % 480, 2 + (i % 3), "#f5ecd0");
  p.ell(255, 120, 46, 46, "#f2c14e", 6);
  p.poly([[180, 70], [215, 160], [215, 330], [145, 330], [145, 160]], "#f1ece0", 7);
  p.ell(180, 200, 22, 22, "#5b8fb8", 6);
  p.poly([[145, 270], [105, 340], [145, 330]], "#d9483b", 6); p.poly([[215, 270], [255, 340], [215, 330]], "#d9483b", 6);
  p.poly([[155, 334], [205, 334], [180, 420]], "#f29a3a", 5); p.poly([[166, 334], [194, 334], [180, 385]], "#ffe08a", 0);
  g.lineWidth = 14; g.strokeStyle = "#e9dcc0"; g.strokeRect(7, 7, 346, 466);
});
const clockTex = () => ctex("wallclock", 256, 256, (g) => {
  const p = new Pen(g);
  p.ell(128, 128, 122, 122, "#d9483b", 0); p.ell(128, 128, 104, 104, "#fbf6ea", 6);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.stroke([[128 + Math.sin(a) * 82, 128 - Math.cos(a) * 82], [128 + Math.sin(a) * 94, 128 - Math.cos(a) * 94]], i % 3 ? 4 : 8); }
});
const bedTex = () => ctex("blanket", 512, 512, (g) => {
  g.fillStyle = "#4f78b8"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#6a91cc"; for (let x = 0; x < 512; x += 128) g.fillRect(x, 0, 64, 512);
  g.fillStyle = "#e6c35c"; for (let y = 0; y < 512; y += 128) g.fillRect(0, y + 58, 512, 12);
});

// ---------------- the screen: a live Canvas2D page (unlit) ----------------
const SW = 1024, SH = 768;
const box = (p: Pen, cx: number, cy: number, s: number) => {
  p.poly([[cx - 90 * s, cy - 40 * s], [cx + 90 * s, cy - 40 * s], [cx + 90 * s, cy + 80 * s], [cx - 90 * s, cy + 80 * s]], "#d9a25a", 8);
  p.poly([[cx - 90 * s, cy - 40 * s], [cx - 50 * s, cy - 90 * s], [cx + 130 * s, cy - 90 * s], [cx + 90 * s, cy - 40 * s]], "#e8bb78", 8);
  p.stroke([[cx - 20 * s, cy - 40 * s], [cx - 20 * s, cy + 80 * s]], 8, "#9c6a33");
  p.poly([[cx - 20 * s, cy - 6 * s], [cx + 25 * s, cy + 40 * s], [cx - 65 * s, cy + 40 * s]], "#2a3f7a", 0); // down arrow
  p.poly([[cx - 35 * s, cy - 40 * s], [cx - 5 * s, cy - 40 * s], [cx - 5 * s, cy], [cx - 35 * s, cy]], "#2a3f7a", 0);
};
const pad = (p: Pen, cx: number, cy: number, s: number) => {
  p.poly([[cx - 140 * s, cy - 40 * s], [cx + 140 * s, cy - 40 * s], [cx + 170 * s, cy + 70 * s], [cx + 90 * s, cy + 80 * s], [cx + 50 * s, cy + 30 * s],
    [cx - 50 * s, cy + 30 * s], [cx - 90 * s, cy + 80 * s], [cx - 170 * s, cy + 70 * s]], "#e94f6a", 8);
  p.stroke([[cx - 100 * s, cy], [cx - 50 * s, cy]], 16, "#fff4d6"); p.stroke([[cx - 75 * s, cy - 25 * s], [cx - 75 * s, cy + 25 * s]], 16, "#fff4d6");
  for (const [dx, dy, c] of [[70, -15, "#ffe066"], [105, 10, "#7be0a8"]] as const) p.ell(cx + dx * s, cy + dy * s, 16 * s, 16 * s, c, 5);
};
const wifi = (p: Pen, cx: number, cy: number, s: number) => {
  for (const r of [150, 105, 60]) p.arc(cx, cy + 60 * s, r * s, r * s, -135, -45, 26 * s, "#8fd3ff");
  p.dot(cx, cy + 60 * s, 18 * s, "#8fd3ff");
};
const snail = (p: Pen, x: number, y: number) => {
  p.poly([[x - 70, y + 22], [x + 40, y + 22], [x + 62, y - 6], [x + 52, y - 12], [x + 36, y + 6], [x - 60, y + 8]], "#b9e07a", 6);
  p.ell(x - 18, y - 16, 36, 34, "#e2a24c", 6); p.arc(x - 18, y - 16, 18, 17, 0, 300, 6);
  p.stroke([[x + 50, y - 8], [x + 58, y - 38]], 5); p.stroke([[x + 58, y - 6], [x + 72, y - 32]], 5);
  p.dot(x + 58, y - 40, 7); p.dot(x + 72, y - 34, 7);
};
const rocket = (p: Pen, x: number, y: number) => {
  p.poly([[x - 90, y - 12], [x - 140, y], [x - 90, y + 12]], "#ffd25a", 0);
  p.poly([[x - 60, y - 30], [x + 40, y - 30], [x + 80, y], [x + 40, y + 30], [x - 60, y + 30]], "#f1ece0", 6);
  p.poly([[x - 60, y - 30], [x - 85, y - 52], [x - 40, y - 30]], "#d9483b", 6); p.poly([[x - 60, y + 30], [x - 85, y + 52], [x - 40, y + 30]], "#d9483b", 6);
  p.ell(x + 15, y, 14, 14, "#5b8fb8", 5);
  for (let i = 0; i < 4; i++) p.stroke([[x - 190 - i * 40, y - 40 + i * 26], [x - 120 - i * 40, y - 40 + i * 26]], 7, "rgba(255,255,255,0.6)");
};
const drawScreen = (g: CanvasRenderingContext2D, s: Screen) => {
  const p = new Pen(g);
  const bg = g.createLinearGradient(0, 0, 0, SH); bg.addColorStop(0, "#22336a"); bg.addColorStop(1, "#14204a");
  g.fillStyle = bg; g.fillRect(0, 0, SW, SH);
  g.fillStyle = "rgba(255,255,255,0.05)"; for (let x = 0; x < SW; x += 64) g.fillRect(x, 0, 2, SH); for (let y = 0; y < SH; y += 64) g.fillRect(0, y, SW, 2);
  if (s.kind === "download") {
    if (s.icon === "box") box(p, SW / 2, 270, 1.3); else if (s.icon === "game") pad(p, SW / 2, 290, 1.25); else wifi(p, SW / 2, 230, 1.15);
    const x0 = 140, x1 = SW - 140, y = 520, fx = x0 + (x1 - x0) * clamp01(s.p);
    g.fillStyle = "#0c1330"; g.beginPath(); g.roundRect(x0 - 14, y - 40, x1 - x0 + 28, 80, 40); g.fill();
    const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, "#47d6ff"); gr.addColorStop(1, "#7cf29a");
    g.fillStyle = gr; g.beginPath(); g.roundRect(x0, y - 26, Math.max(52, fx - x0), 52, 26); g.fill();
    if (s.pace === "snail") snail(p, Math.max(x0 + 40, fx) + 20, y - 72);
    if (s.pace === "rocket" && s.done < 1) rocket(p, Math.min(fx, x1 - 80), y - 100);
    if (s.done > 0) { const k = smooth(s.done * 1.6); p.ell(SW / 2, 650, 50 * k, 50 * k, "#7cf29a", 0); p.line([[SW / 2 - 24 * k, 650], [SW / 2 - 6 * k, 670], [SW / 2 + 26 * k, 630]], "#0c1330", 12 * k, false); }
  } else if (s.kind === "ok") {
    const k = 0.3 + 0.7 * smooth(s.k * 1.3);
    p.ell(SW / 2, SH / 2, 210 * k, 210 * k, "#7cf29a", 0);
    p.stroke([[SW / 2 - 100 * k, SH / 2], [SW / 2 - 25 * k, SH / 2 + 80 * k], [SW / 2 + 115 * k, SH / 2 - 85 * k]], 46 * k, "#0c1330");
  } else if (s.kind === "chip") {
    const cx = SW / 2, cy = SH / 2, d = 40 + 300 * s.d;
    for (let i = -3; i <= 3; i++) for (const sg of [-1, 1]) { p.stroke([[cx + i * 30, cy + sg * 120], [cx + i * 30, cy + sg * 150]], 10, "#c9b26b"); p.stroke([[cx + sg * 120, cy + i * 30], [cx + sg * 150, cy + i * 30]], 10, "#c9b26b"); }
    p.poly([[cx - 120, cy - 120], [cx + 120, cy - 120], [cx + 120, cy + 120], [cx - 120, cy + 120]], "#2c3346", 8);
    p.poly([[cx - 60, cy - 60], [cx + 60, cy - 60], [cx + 60, cy + 60], [cx - 60, cy + 60]], "#5ad2ff", 6);
    for (const sg of [-1, 1]) {
      const mx = cx + sg * (150 + d) + (sg < 0 ? -60 : 0);
      p.poly([[mx, cy - 150], [mx + 60, cy - 150], [mx + 60, cy + 150], [mx, cy + 150]], "#3aa66a", 7);
      for (let k = 0; k < 4; k++) p.poly([[mx + 12, cy - 128 + k * 72], [mx + 48, cy - 128 + k * 72], [mx + 48, cy - 76 + k * 72], [mx + 12, cy - 76 + k * 72]], "#1d2433", 0);
      if (s.d < 0.25) for (let k = -2; k <= 2; k++) p.stroke([[cx + sg * 150, cy + k * 45], [cx + sg * (150 + d), cy + k * 45]], 9, "#ffe066");
    }
  } else if (s.kind === "gauge") {
    const cx = SW / 2, cy = 520, R = 300;
    const zones: [number, number, string][] = [[0, 0.5, "#7cf29a"], [0.5, 0.8, "#ffd25a"], [0.8, 1, "#ff6b5a"]];
    for (const [a0, a1, c] of zones) p.arc(cx, cy, R, R, -180 + 180 * a0, -180 + 180 * a1, 56, c);
    const a = Math.PI * (1 - clamp01(s.v));
    p.line([[cx, cy], [cx + Math.cos(a) * (R - 40), cy - Math.sin(a) * (R - 40)]], "#f1ece0", 18);
    p.ell(cx, cy, 36, 36, "#f1ece0", 7);
    // the chip below the needle hub
    p.poly([[cx - 70, cy + 70], [cx + 70, cy + 70], [cx + 70, cy + 200], [cx - 70, cy + 200]], "#2c3346", 7);
    p.poly([[cx - 34, cy + 102], [cx + 34, cy + 102], [cx + 34, cy + 168], [cx - 34, cy + 168]], s.v > 0.85 ? "#ff8a5a" : "#5ad2ff", 5);
  }
};
const screenKey = (s: Screen) => JSON.stringify(s, (_k, v) => (typeof v === "number" ? Math.round(v * 200) / 200 : v));

// ---------------- sky helpers ----------------
const discTex = () => ctex("sunDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 58, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

/** every lens position of the film looking at its subject (houses in the way are left out) */
const sightLines = (): Ray[] => {
  const out: Ray[] = [];
  for (const s of SHOTS) for (let f = s.a; f < s.b; f += 3) {
    const c = camAt(s.id, f), o = V(...c.pos), look = V(...c.look);
    const fw = look.clone().sub(o), len = fw.length() + 40;
    fw.normalize();
    out.push({ o, d: fw, len, core: true });
  }
  return out;
};

const quadUp = (x0: number, x1: number, z0: number, z1: number, u: number, v: number, y: number) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(Array(6).fill([0, 1, 0]).flat(), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, u, 0, u, v, 0, 0, u, v, 0, v], 2));
  return g;
};
const glow = (r: number, g: number, b: number) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), toneMapped: true });

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh; private skyMat: THREE.ShaderMaterial;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sunDisc: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();
  private cloudMaps: Record<"day" | "golden", THREE.Texture[]>;
  private clouds: THREE.Mesh[] = [];
  private scrCv: HTMLCanvasElement; private scrTex: THREE.CanvasTexture; private scrKey = "";
  private bulb: THREE.Mesh; private bulbOff: THREE.Material; private bulbOn: THREE.Material;
  private pulse: THREE.Mesh[] = [];
  private towerLed: THREE.Mesh; private ledMat: THREE.MeshBasicMaterial;
  private routerLeds: THREE.Mesh[] = []; private amber: THREE.MeshBasicMaterial;
  private handM: THREE.Mesh; private handH: THREE.Mesh;
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4(); private v = new THREE.Vector3(); private sph = new THREE.Sphere();

  constructor(kit: Kit) {
    const R = this.root;
    // ---- sky + light (as the bridge short) ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(6.0, 4.4, 2.4), fog: false, depthWrite: false }));
    this.sunDisc.frustumCulled = false; this.sunDisc.layers.set(NOINK); R.add(this.sunDisc);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    this.cloudMaps = { day: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud)), golden: [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.golden.cloud)) };
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, d = 620 + (i % 3) * 60;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.cloudMaps.day[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      const w = 130 + (i % 4) * 30;
      m.position.set(Math.cos(a) * d, 120 + (i % 4) * 38, Math.sin(a) * d); m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK); this.clouds.push(m); R.add(m);
    }

    // ---- ground: grass everywhere, a cobbled square around the room ----
    const b = new Batch();
    b.add(quadUp(-900, 900, -900, 900, 450, 450, D0), lam("grassHD", () => ({ map: grassHD() })));
    b.add(quadUp(-22, 22, -24, 24, 11, 12, D0 + 0.012), lam("cobbleHD", () => ({ map: cobbleHD() })));
    b.add(quadUp(-6, 6, -200, 200, 3, 100, D0 + 0.012), lam("cobbleHD", () => ({ map: cobbleHD() })));

    // ---- the bedroom ----
    const floorM = lam("floorPlanks", () => ({ map: rep(planksHD(), 1.5, 1.5) }));
    const paper = lam("wallpaper", () => ({ map: rep(wallpaper(), 3, 1.4) }));
    const trim = lam("trim", () => ({ color: "#f1e7d2" }));
    const wood = lam("deskWood", () => ({ color: "#c98b52" }));
    const woodDark = lam("deskWoodDark", () => ({ color: "#8f5a35" }));
    const slate = lam("plasticSlate", () => ({ color: "#3d4352" }));
    const white = lam("plasticWhite", () => ({ color: "#efe9dc" }));
    const red = lam("lampRed", () => ({ color: "#d9483b" }));
    const steel = twoTone(new THREE.MeshPhongMaterial({ color: "#9aa0aa", specular: "#bbbbbb", shininess: 50 }), 0.2);
    const H = 2.8, X0 = -3, X1 = 3, Z0 = -2.6, Z1 = 2.3;
    b.add(boxGeo(V(X0, D0, Z0), V(X1, FY, Z1), 2), floorM);
    // back wall (z = Z0) and left wall (x = X0) with a window opening, skirting + top trim
    b.add(boxGeo(V(X0, FY, Z0 - 0.16), V(X1, FY + H, Z0), 1), paper);
    const WZ0 = -1.55, WZ1 = 0.35, WY0 = FY + 0.95, WY1 = FY + 2.15;
    b.add(boxGeo(V(X0 - 0.16, FY, Z0 - 0.16), V(X0, FY + H, WZ0), 1), paper);
    b.add(boxGeo(V(X0 - 0.16, FY, WZ1), V(X0, FY + H, Z1), 1), paper);
    b.add(boxGeo(V(X0 - 0.16, FY, WZ0), V(X0, WY0, WZ1), 1), paper);
    b.add(boxGeo(V(X0 - 0.16, WY1, WZ0), V(X0, FY + H, WZ1), 1), paper);
    for (const [a, c] of [[V(X0 - 0.2, WY0 - 0.08, WZ0 - 0.08), V(X0 + 0.06, WY0, WZ1 + 0.08)], [V(X0 - 0.2, WY1, WZ0 - 0.08), V(X0 + 0.06, WY1 + 0.08, WZ1 + 0.08)],
      [V(X0 - 0.2, WY0, WZ0 - 0.08), V(X0 + 0.06, WY1, WZ0)], [V(X0 - 0.2, WY0, WZ1), V(X0 + 0.06, WY1, WZ1 + 0.08)], [V(X0 - 0.2, WY0, (WZ0 + WZ1) / 2 - 0.03), V(X0 + 0.04, WY1, (WZ0 + WZ1) / 2 + 0.03)]] as const)
      b.add(boxGeo(a, c), trim);
    b.add(boxGeo(V(X0, FY, Z0), V(X1, FY + 0.12, Z0 + 0.03)), trim);
    b.add(boxGeo(V(X0, FY, Z0), V(X0 + 0.03, FY + 0.12, Z1)), trim);
    b.add(boxGeo(V(X0 - 0.18, FY + H, Z0 - 0.18), V(X1 + 0.02, FY + H + 0.08, Z0 + 0.02)), trim);
    b.add(boxGeo(V(X0 - 0.18, FY + H, Z0 - 0.18), V(X0 + 0.02, FY + H + 0.08, Z1)), trim);
    // rug
    const rug = new THREE.CircleGeometry(1.1, 40); rug.rotateX(-Math.PI / 2);
    b.add(rug, lam("rug", () => ({ map: rugTex() })), new THREE.Matrix4().makeTranslation(0.6, FY + 0.006, -0.7));
    // bed in the front-left corner
    b.add(boxGeo(V(X0 + 0.03, FY, 0.55), V(X0 + 1.45, FY + 0.32, Z1 - 0.05)), woodDark);
    b.add(boxGeo(V(X0 + 0.05, FY + 0.32, 0.57), V(X0 + 1.43, FY + 0.5, Z1 - 0.07)), lam("blanket", () => ({ map: bedTex() })));
    b.add(boxGeo(V(X0 + 0.25, FY + 0.5, 0.65), V(X0 + 1.2, FY + 0.64, 1.05)), white);
    b.add(boxGeo(V(X0 + 0.03, FY, 0.5), V(X0 + 1.45, FY + 0.85, 0.6)), woodDark);
    // desk
    b.add(boxGeo(V(DESK.x0, DESK.top - 0.05, DESK.z0), V(DESK.x1, DESK.top, DESK.z1)), wood);
    for (const [x, z] of [[DESK.x0 + 0.05, DESK.z0 + 0.05], [DESK.x1 - 0.05, DESK.z0 + 0.05], [DESK.x0 + 0.05, DESK.z1 - 0.05], [DESK.x1 - 0.05, DESK.z1 - 0.05]])
      b.add(boxGeo(V(x - 0.035, FY, z - 0.035), V(x + 0.035, DESK.top - 0.05, z + 0.035)), woodDark);
    // monitor: stand, body, bezel; the screen is its own unlit mesh
    b.add(boxGeo(V(SCREEN.x - 0.14, DESK.top, -2.3), V(SCREEN.x + 0.14, DESK.top + 0.025, -2.08)), slate);
    b.add(boxGeo(V(SCREEN.x - 0.035, DESK.top, -2.26), V(SCREEN.x + 0.035, SCREEN.y - 0.2, -2.2)), slate);
    b.add(boxGeo(V(SCREEN.x - SCREEN.w / 2 - 0.045, SCREEN.y - SCREEN.h / 2 - 0.045, -2.2), V(SCREEN.x + SCREEN.w / 2 + 0.045, SCREEN.y + SCREEN.h / 2 + 0.06, SCREEN.z - 0.01)), slate);
    // keyboard + mouse
    b.add(boxGeo(V(SCREEN.x - 0.24, DESK.top, -1.86), V(SCREEN.x + 0.24, DESK.top + 0.025, -1.7)), white);
    for (let k = 0; k < 3; k++) b.add(boxGeo(V(SCREEN.x - 0.22, DESK.top + 0.025, -1.84 + k * 0.045), V(SCREEN.x + 0.22, DESK.top + 0.032, -1.81 + k * 0.045)), slate);
    b.add(new THREE.SphereGeometry(0.04, 14, 10).scale(0.8, 0.45, 1.1), white, new THREE.Matrix4().makeTranslation(SCREEN.x + 0.34, DESK.top + 0.01, -1.76));
    // ruler (32 cm, along z) with painted marks
    b.add(boxGeo(V(RULER.x - 0.022, DESK.top, RULER.z1 - 0.01), V(RULER.x + 0.022, DESK.top + 0.006, RULER.z0 + 0.01)),
      lam("ruler", () => ({ map: ctex("rulerTex", 64, 512, (g) => { g.fillStyle = "#f3d36b"; g.fillRect(0, 0, 64, 512);
        g.fillStyle = "#3b2a1a"; for (let i = 0; i <= 32; i++) g.fillRect(0, 8 + i * 15, i % 10 === 0 ? 40 : i % 5 === 0 ? 28 : 16, 3); }) })));
    // PC tower on the floor left of the desk
    b.add(boxGeo(V(TOWER.x - 0.13, FY, TOWER.z - 0.3), V(TOWER.x + 0.13, FY + 0.62, TOWER.z + 0.3)), slate);
    b.add(boxGeo(V(TOWER.x - 0.1, FY + 0.38, TOWER.z + 0.3), V(TOWER.x + 0.1, FY + 0.56, TOWER.z + 0.305)), white);
    // desk lamp: base, two arms, shade
    b.add(new THREE.CylinderGeometry(0.08, 0.09, 0.03, 18), red, new THREE.Matrix4().makeTranslation(LAMP.x, DESK.top + 0.015, LAMP.z));
    const arm = (a: THREE.Vector3, c: THREE.Vector3) => {
      const g = new THREE.CylinderGeometry(0.012, 0.012, a.distanceTo(c), 8);
      b.add(g, steel, new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
    };
    arm(V(LAMP.x, DESK.top + 0.03, LAMP.z), V(LAMP.x + 0.06, DESK.top + 0.32, LAMP.z));
    arm(V(LAMP.x + 0.06, DESK.top + 0.32, LAMP.z), V(BULB[0] - 0.05, BULB[1] + 0.1, LAMP.z));
    const shadeG = new THREE.ConeGeometry(0.09, 0.14, 20, 1, true); shadeG.rotateZ(-0.6);
    b.add(shadeG, lam("lampShade", () => ({ color: "#d9483b", side: THREE.DoubleSide })), new THREE.Matrix4().makeTranslation(BULB[0] - 0.01, BULB[1] + 0.05, BULB[2]));
    // router shelf + router + antennas
    b.add(boxGeo(V(ROUTER[0] - 0.32, ROUTER[1] - 0.04, -2.6), V(ROUTER[0] + 0.32, ROUTER[1], -2.32)), wood);
    b.add(boxGeo(V(ROUTER[0] - 0.17, ROUTER[1], -2.5), V(ROUTER[0] + 0.17, ROUTER[1] + 0.05, -2.36)), white);
    for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.008, 0.01, 0.2, 6), slate,
      new THREE.Matrix4().compose(V(ROUTER[0] + s * 0.14, ROUTER[1] + 0.14, -2.47), new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -s * 0.25), V(1, 1, 1)));
    // poster above the desk, clock above the router
    b.add(new THREE.PlaneGeometry(0.54, 0.72), lam("poster", () => ({ map: posterTex() })), new THREE.Matrix4().makeTranslation(-1.85, FY + 1.75, Z0 + 0.005));
    b.add(new THREE.CircleGeometry(0.19, 32), lam("clockFace", () => ({ map: clockTex() })), new THREE.Matrix4().makeTranslation(CLOCK[0], CLOCK[1], CLOCK[2] + 0.01));
    b.build(R);
    buildTown(R, kit, sightLines());

    // ---- dynamic pieces ----
    this.scrCv = document.createElement("canvas"); this.scrCv.width = SW; this.scrCv.height = SH;
    this.scrTex = new THREE.CanvasTexture(this.scrCv); this.scrTex.colorSpace = THREE.SRGBColorSpace; this.scrTex.anisotropy = 8;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), new THREE.MeshBasicMaterial({ map: this.scrTex, color: new THREE.Color(1.25, 1.25, 1.25) }));
    scr.position.set(SCREEN.x, SCREEN.y, SCREEN.z); scr.layers.set(NOINK); R.add(scr);
    this.bulbOff = lam("bulbOff", () => ({ color: "#e9e2cf" }));
    this.bulbOn = glow(7, 5.6, 3.2);
    this.bulb = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10), this.bulbOff); this.bulb.position.set(...BULB); R.add(this.bulb);
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(i ? 0.009 - i * 0.0008 : 0.013, 12, 8), glow(7 - i * 0.6, 6 - i * 0.6, 2.6)); m.layers.set(NOINK);
      m.visible = false; this.pulse.push(m); R.add(m);
    }
    this.ledMat = glow(0.6, 3.2, 4.2);
    this.towerLed = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.01), this.ledMat);
    this.towerLed.position.set(TOWER.x + 0.09, FY + 0.2, TOWER.z + 0.305); this.towerLed.layers.set(NOINK); R.add(this.towerLed);
    this.amber = glow(5, 2.6, 0.4);
    [glow(0.8, 4.5, 1.2), glow(0.8, 4.5, 1.2), this.amber].forEach((mm, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), mm);
      m.position.set(ROUTER[0] - 0.07 + i * 0.07, ROUTER[1] + 0.028, -2.355); m.layers.set(NOINK); this.routerLeds.push(m); R.add(m);
    });
    const hand = (len: number, w: number) => { const g = new THREE.BoxGeometry(w, len, 0.01); g.translate(0, len / 2 - 0.02, 0); return new THREE.Mesh(g, lam("clockHand", () => ({ color: "#241726" }))); };
    this.handM = hand(0.15, 0.016); this.handH = hand(0.1, 0.024);
    for (const h of [this.handM, this.handH]) { h.position.set(CLOCK[0], CLOCK[1], CLOCK[2] + 0.02); R.add(h); }
    R.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !m.layers.isEnabled(NOINK) && m !== this.sky) { m.castShadow = true; m.receiveShadow = true; } });
  }

  /** camera-relative sun, frozen per shot */
  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light];
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);
    // ---- light rig ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    let Rr = THREE.MathUtils.clamp(dist * 1.15 + 4, 5, 95);
    if (s.light === "golden") Rr = Math.max(Rr, 30);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, sun disc, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    this.sunDisc.visible = s.light === "golden";
    if (this.sunDisc.visible) { this.sunDisc.position.copy(cam.position).addScaledVector(sunDir, 900); this.sunDisc.scale.setScalar(2 * 900 * Math.tan(THREE.MathUtils.degToRad(1.7))); }
    for (let i = 0; i < this.clouds.length; i++) {
      const m = this.clouds[i]; m.lookAt(cam.position.x, m.position.y, cam.position.z);
      (m.material as THREE.MeshBasicMaterial).map = this.cloudMaps[s.light][i % 4];
    }
    // ---- props ----
    const st = screenAt(f), key = screenKey(st);
    if (key !== this.scrKey) { drawScreen(this.scrCv.getContext("2d")!, st); this.scrTex.needsUpdate = true; this.scrKey = key; }
    this.bulb.material = t >= W.light - 2 / FPS ? this.bulbOn : this.bulbOff;
    // light pulse: appears on "nanosecond", runs the 30 cm between "travels" and "centimetres"
    const on = t >= W.nano && t < 21.75 && id === 9, u = smooth((t - W.travels) / (W.cm + 0.36 - W.travels));
    this.pulse.forEach((m, i) => {
      const ui = Math.max(0, u - i * 0.035);
      m.visible = on && (i === 0 || (u > 0.02 && u < 0.999 + i * 0.035));
      m.position.set(RULER.x, DESK.top + 0.022, RULER.z0 - 0.01 - 0.30 * ui);
    });
    const ready = clamp01((t - W.luckily) / 0.3) * (t < 14 ? 1 : 0.4);
    this.ledMat.color.setRGB(0.6 + 1.2 * ready, 3.2 + 2 * ready, 4.2 + 2 * ready);
    this.towerLed.scale.y = 1;
    this.amber.color.setRGB(...((Math.floor(t * 2) % 2 ? [5, 2.6, 0.4] : [0.4, 0.25, 0.1]) as [number, number, number]));
    // clock: 4:10 normally; hands spin while the download drags (unluckily .. and)
    const spin = t > W.unluckily && t < W.and ? (t - W.unluckily) : t >= W.and ? W.and - W.unluckily : 0;
    this.handM.rotation.z = -(Math.PI / 3) - spin * Math.PI * 2 * 1.6;
    this.handH.rotation.z = -(Math.PI * 2 * 4.17) / 12 - spin * Math.PI * 2 * 1.6 / 12;
    // ---- cast + effects ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const stg = stage(id, t, { pos: cam.position, right });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of stg.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of stg.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return focus;
  }
}
export { rng };
