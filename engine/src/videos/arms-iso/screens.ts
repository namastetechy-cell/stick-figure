// Monitor pages for the ten-arms story (Canvas2D), shared with the 3D version's drawings.
import { Pen } from "../arms/toon";
import { Screen, clamp01, smooth } from "../arms/story";
export const SW = 1024, SH = 768;
const brainIcon = (p: Pen, cx: number, cy: number, s: number, col = "#f4a6b8") => {
  p.ell(cx - 70 * s, cy, 95 * s, 80 * s, col, 7); p.ell(cx + 70 * s, cy, 95 * s, 80 * s, col, 7);
  p.stroke([[cx, cy - 75 * s], [cx, cy + 75 * s]], 6);
  for (const [x, y, r] of [[-90, -20, 30], [-50, 30, 26], [60, -25, 32], [95, 25, 24]] as const) p.arc(cx + x * s, cy + y * s, r * s, r * 0.7 * s, 200, 340, 5);
};
const handIcon = (p: Pen, x: number, y: number, s: number, col = "#ffd9b0") => {
  p.poly([[x - 30 * s, y + 40 * s], [x + 30 * s, y + 40 * s], [x + 34 * s, y - 10 * s], [x - 34 * s, y - 10 * s]], col, 5);
  for (let i = 0; i < 4; i++) p.poly([[x - 32 * s + i * 17 * s, y - 10 * s], [x - 20 * s + i * 17 * s, y - 10 * s], [x - 20 * s + i * 17 * s, y - 48 * s], [x - 32 * s + i * 17 * s, y - 48 * s]], col, 4);
  p.poly([[x + 34 * s, y + 10 * s], [x + 54 * s, y - 14 * s], [x + 44 * s, y - 24 * s], [x + 28 * s, y - 4 * s]], col, 4);
};
export const drawScreen = (g: CanvasRenderingContext2D, s: Screen) => {
  const p = new Pen(g);
  const bg = g.createLinearGradient(0, 0, 0, SH); bg.addColorStop(0, "#22336a"); bg.addColorStop(1, "#14204a");
  g.fillStyle = bg; g.fillRect(0, 0, SW, SH);
  g.fillStyle = "rgba(255,255,255,0.05)"; for (let x = 0; x < SW; x += 64) g.fillRect(x, 0, 2, SH); for (let y = 0; y < SH; y += 64) g.fillRect(0, y, SW, 2);
  if (s.kind === "todo") {
    for (let i = 0; i < 8; i++) {
      const y = 110 + i * 72, done = i < s.n;
      p.poly([[200, y - 26], [252, y - 26], [252, y + 26], [200, y + 26]], done ? "#7cf29a" : "#0c1330", 5);
      if (done) p.line([[210, y], [224, y + 14], [244, y - 14]], "#0c1330", 9, false);
      g.fillStyle = done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.75)"; g.beginPath(); g.roundRect(290, y - 12, 380 + (i * 97) % 200, 24, 12); g.fill();
    }
  } else if (s.kind === "crash") {
    g.fillStyle = `rgba(200,40,50,${0.25 + 0.35 * s.k})`; g.fillRect(0, 0, SW, SH);
    brainIcon(p, SW / 2, SH / 2 - 20, 1.6 * (0.8 + 0.2 * s.k));
    p.line([[SW / 2 - 20, 160], [SW / 2 + 40, 300], [SW / 2 - 30, 420], [SW / 2 + 30, 560]], "#1d1020", 14, false);
    p.ell(SW - 150, 140, 70 * s.k, 70 * s.k, "#ff4d5a", 7);
    p.stroke([[SW - 180, 110], [SW - 120, 170]], 14 * s.k, "#ffffff"); p.stroke([[SW - 120, 110], [SW - 180, 170]], 14 * s.k, "#ffffff");
  } else if (s.kind === "brain") {
    if (s.over > 0) { g.fillStyle = `rgba(220,50,60,${0.35 * s.over * (0.6 + 0.4 * Math.sin(s.hands * 2))})`; g.fillRect(0, 0, SW, SH); }
    brainIcon(p, SW / 2, 250, 1.5);
    // the brain's control slots: two sockets under the brain, wired to it
    for (const x of [SW / 2 - 140, SW / 2 + 140]) { p.stroke([[SW / 2, 370], [x, 470]], 8, "#ffe066"); p.poly([[x - 70, 470], [x + 70, 470], [x + 70, 650], [x - 70, 650]], "#0c1330", 6); }
    for (let i = 0; i < s.hands; i++) {
      const inSlot = i < 2, x = inSlot ? SW / 2 + (i ? 140 : -140) : 90 + ((i - 2) * 123) % (SW - 160), y = inSlot ? 570 : 520 + ((i * 53) % 3) * 70 - 40;
      handIcon(p, x, y, inSlot ? 1.2 : 0.9, inSlot ? "#ffd9b0" : "#ff9e9e");
    }
    if (s.hot > 0 && s.hands === 2) for (const x of [SW / 2 - 140, SW / 2 + 140]) p.ell(x, 560, 100 * s.hot, 100 * s.hot, null, 6);
  } else if (s.kind === "battery") {
    const x0 = 270, y0 = 230, w = 440, h = 230;
    p.poly([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], "#0c1330", 12);
    p.poly([[x0 + w, y0 + 70], [x0 + w + 40, y0 + 70], [x0 + w + 40, y0 + h - 70], [x0 + w, y0 + h - 70]], "#f1ece0", 8);
    const fill = (w - 40) * s.v, col = s.v < 0.25 ? "#ff5a5a" : s.v < 0.5 ? "#ffd25a" : "#7cf29a";
    p.poly([[x0 + 20, y0 + 20], [x0 + 20 + fill, y0 + 20], [x0 + 20 + fill, y0 + h - 20], [x0 + 20, y0 + h - 20]], col, 0);
    if (s.food > 0) { // an empty plate with a fork: hungry again
      const k = smooth(s.food * 1.5);
      p.ell(SW / 2, 610, 150 * k, 50 * k, "#f1ece0", 7); p.ell(SW / 2, 605, 95 * k, 30 * k, "#d9d2c0", 4);
      p.stroke([[SW / 2 + 190 * k, 560], [SW / 2 + 190 * k, 660]], 10, "#c9ccd2");
    }
  } else if (s.kind === "sleep") {
    g.fillStyle = "#070b1c"; g.fillRect(0, 0, SW, SH);
    p.ell(SW / 2, SH / 2, 90, 90, "#c9d4ff", 0); p.ell(SW / 2 + 40, SH / 2 - 25, 80, 80, "#070b1c", 0);
  } else if (s.kind === "octo") {
    // octopus diagram: a small brain in the head, most of the dots down the arms
    const cx = SW / 2, cy = 270;
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * (0.08 + (0.84 * i) / 7), pts: [number, number][] = [];
      for (let j = 0; j <= 10; j++) { const u = j / 10; pts.push([cx + Math.cos(a) * 380 * u * (i % 2 ? 1 : 0.9) + Math.sin(u * 6 + s.t * 3 + i) * 14, cy + 120 + Math.sin(a) * 300 * u]); }
      p.line(pts, "#ec7a5c", 26);
      for (let j = 2; j <= 10; j += 2) p.dot(pts[j][0], pts[j][1], 6 + 6 * s.glow, s.glow > 0 ? "#fff27a" : "#ffd7c9");
    }
    p.ell(cx, cy, 160, 170, "#ec7a5c", 8);
    p.ell(cx, cy - 20, 60, 45, "#f4a6b8", 5);
    for (const sx of [-1, 1]) { p.ell(cx + sx * 60, cy + 70, 26, 30, "#ffffff", 5); p.dot(cx + sx * 60 + 4, cy + 76, 12); }
  } else if (s.kind === "sub") {
    // a channel page: banner, round avatar, the big red subscribe button with a bell; a pointer clicks it
    g.fillStyle = "#2f4a8f"; g.fillRect(0, 0, SW, 200);
    p.ell(170, 330, 95, 95, "#f2b437", 7); p.ell(170, 330, 40, 40, "#ec7a5c", 0);
    for (let i = 0; i < 2; i++) { g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.roundRect(300, 290 + i * 50, 380 - i * 140, 24, 12); g.fill(); }
    const bx = 300, by = 470, bw = 420, bh = 130, k = s.done;
    g.fillStyle = k > 0 ? "#5d6476" : "#e5322d"; g.beginPath(); g.roundRect(bx, by, bw, bh, 65); g.fill();
    g.lineWidth = 8; g.strokeStyle = "#120d18"; g.stroke();
    if (k > 0) p.line([[bx + 160, by + 66], [bx + 195, by + 98], [bx + 262, by + 36]], "#ffffff", 16, false);
    else p.poly([[bx + 175, by + 35], [bx + 265, by + 65], [bx + 175, by + 95]], "#ffffff", 0);
    // bell (rings after the click)
    const bxl = 840, byl = 535, sw = k > 0 ? 0.35 * Math.sin(s.t * 30) * (1 - Math.min(1, k * 0.2)) : 0;
    g.save(); g.translate(bxl, byl - 40); g.rotate(sw); g.translate(-bxl, -(byl - 40));
    p.poly([[bxl - 45, byl + 30], [bxl + 45, byl + 30], [bxl + 35, byl - 10], [bxl + 25, byl - 45], [bxl, byl - 55], [bxl - 25, byl - 45], [bxl - 35, byl - 10]], "#ffe066", 6);
    p.dot(bxl, byl + 40, 12, "#ffe066"); g.restore();
    // pointer hand glides in and clicks
    const px = 900 - 330 * s.ptr, py = 760 - 200 * s.ptr + (k > 0 && k < 1 ? 10 : 0);
    handIcon(p, px, py, 1.0, "#ffffff");
  }
};
