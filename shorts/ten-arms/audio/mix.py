"""Original score + synthesized SFX for the ten-arms short (WhatIfyTV). No voice yet: the VO goes on top later.
usage: python mix.py <words.json> <out_dir> -> music.wav, sfx.wav, music_sfx.wav (48 kHz stereo, exact film length)
Every SFX is placed from words.json, the same timings the film uses, so new timings re-sync the sound."""
import sys, os, numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt

SR = 48000
import json
WORDS = json.load(open(sys.argv[1]))
DUR = round((WORDS[-1]['e'] + 1.3) * 30) / 30
N = int(SR * DUR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def env(n, a=0.005, d=0.2, s=0.0, hold=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    rel = np.exp(-np.maximum(0, t - a - hold) / max(d, 1e-4))
    return e * (s + (1 - s) * rel)
def lp(x, f, o=2): return sosfilt(butter(o, f / (SR / 2), "low", output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f / (SR / 2), "high", output="sos"), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos"), x)
def place(buf, x, t0, g=1.0):
    i = int(t0 * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i: i + len(x)] += g * x
def tone(f, dur, wave="sine", ph=0.0):
    t = np.arange(int(dur * SR)) / SR
    if callable(f): p = 2 * np.pi * np.cumsum(f(t)) / SR
    else: p = 2 * np.pi * f * t
    p = p + ph
    if wave == "sine": return np.sin(p)
    if wave == "tri": return 2 / np.pi * np.arcsin(np.sin(p))
    if wave == "square": return np.sign(np.sin(p)) * 0.6
    if wave == "saw": return 2 * ((p / (2 * np.pi)) % 1) - 1
def midi(m): return 440 * 2 ** ((m - 69) / 12)


def L(l, k=0): return [w for w in WORDS if w["line"] == l][k]["s"]
B = dict(ten=L(0, 6), tez=L(1, 6), crash=L(2, 9), kyun=L(3), two=L(4, 11), tenHands=L(5, 2), hukum=L(6, 4), chai=L(7, 2), phone=L(7, 6),
         brush=L(7, 9), chaos=L(8, 2), kya=L(8, 9), muscles=L(9, 5), energy=L(10, 5), bhookh=L(10, 9), raat=L(11), karwat=L(12, 6),
         octo=L(13, 4), neurons=L(14, 8), soch=L(15, 4), brains=L(16, 10), sub=L(17, 6), whatify=L(18, 5))
# ---------------- music: 112 BPM, C - G - Am - F, pad + pluck arpeggio + soft drums ----------------
BPM = 118; beat = 60 / BPM; bar = 4 * beat
CH = [[50, 53, 57, 62, 65], [46, 50, 53, 58, 62], [48, 52, 55, 60, 64], [45, 49, 52, 57, 61]]  # Dm - Bb - C - A
music = np.zeros(N)
nbars = int(DUR / bar) + 1
for b in range(nbars):
    t0 = b * bar
    ch = CH[b % 4]
    # pad (detuned triangles, slow attack)
    pad = sum(tone(midi(m) * d, bar, "tri") for m in ch[1:4] for d in (0.997, 1.003)) / 6
    place(music, lp(pad, 1800) * env(len(pad), 0.25, 9, 0.6) * 0.16, t0)
    # bass on beats 1 and 3
    for k in (0, 2):
        bs = tone(midi(ch[0] - 12), beat * 1.8, "tri")
        place(music, lp(bs, 400) * env(len(bs), 0.01, 0.5) * 0.35, t0 + k * beat)
    # pluck arpeggio in eighths
    arp = [ch[2], ch[3], ch[4], ch[3], ch[2] + 12, ch[3], ch[4], ch[3]]
    for k, m in enumerate(arp):
        pl = tone(midi(m + 12), 0.3, "square") * env(int(0.3 * SR), 0.002, 0.09)
        place(music, lp(pl, 3500) * 0.07, t0 + k * beat / 2)
    # drums: kick 1 & 3, snare-ish clap 2 & 4, hats on eighths (start after the hook)
    if t0 >= 3.3:
        for k in range(4):
            if k % 2 == 0:
                kk = tone(lambda t: 50 + 120 * np.exp(-t * 30), 0.25) * env(int(0.25 * SR), 0.001, 0.12)
                place(music, kk * 0.5, t0 + k * beat)
            else:
                cl = bp(rng.standard_normal(int(0.18 * SR)), 900, 4000) * env(int(0.18 * SR), 0.001, 0.05)
                place(music, cl * 0.2, t0 + k * beat)
        for k in range(8):
            hh = hp(rng.standard_normal(int(0.05 * SR)), 7000) * env(int(0.05 * SR), 0.001, 0.015)
            place(music, hh * (0.09 if k % 2 else 0.05), t0 + k * beat / 2)
# music drops out for the "Unluckily" beat, back on "And there's"
gate = np.ones(N)
for a, b in [(L(11) - 0.1, L(13) - 0.1)]:  # quieter through the night beat
    i, j = int(a * SR), int(b * SR)
    gate[i:j] = 0.25
music *= lp(gate, 8)
music *= np.minimum(1, t_all / 0.3) * np.clip((DUR - t_all) / 1.2, 0, 1)

# ---------------- SFX ----------------
sfx = np.zeros(N)
def whoosh(dur=0.6, f0=300, f1=4000, g=1.0):
    n = int(dur * SR); x = rng.standard_normal(n); out = np.zeros(n); seg = 512
    for i in range(0, n, seg):
        u = i / n; fc = f0 * (f1 / f0) ** u
        out[i:i + seg] = bp(x[i:i + seg + 256], fc * 0.7, min(fc * 1.4, SR / 2 - 100))[: len(out[i:i + seg])]
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 * g
def ding(f=1568, dur=1.0, g=1.0):
    x = tone(f, dur) + 0.5 * tone(f * 2.01, dur) + 0.25 * tone(f * 3.03, dur)
    return x * env(len(x), 0.002, 0.35) * g / 1.7
def zap(dur=0.25):
    x = tone(lambda t: 2400 * np.exp(-t * 14) + 200, dur, "square")
    return lp(x, 6000) * env(len(x), 0.001, 0.08)
def blip(f=1200): x = tone(f, 0.08); return x * env(len(x), 0.001, 0.025)
def click(): x = hp(rng.standard_normal(int(0.03 * SR)), 2000); return x * env(len(x), 0.0005, 0.004)
def thud(): x = tone(lambda t: 40 + 90 * np.exp(-t * 25), 0.35) + 0.3 * lp(rng.standard_normal(int(0.35 * SR)), 300); return x * env(int(0.35 * SR), 0.001, 0.09)
def pop(): x = tone(lambda t: 300 + 900 * np.exp(-t * 40), 0.12); return x * env(len(x), 0.001, 0.04)
def chime_up():
    out = np.zeros(int(0.9 * SR))
    for k, m in enumerate([72, 76, 79, 84]):
        d = ding(midi(m), 0.6, 0.6); i = int(k * 0.09 * SR); out[i:i + len(d)] += d[: len(out) - i]
    return out
def wah():
    out = np.zeros(int(1.6 * SR))
    for k, (m, d) in enumerate([(55, 0.32), (54, 0.32), (53, 0.32), (52, 0.65)]):
        x = tone(lambda t, m=m, k=k: midi(m) * (1 + (0.02 * np.sin(2 * np.pi * 6 * t) if k == 3 else 0)), d, "saw")
        x = lp(x, 900) * env(len(x), 0.02, d * 0.7, 0.4)
        i = int(k * 0.32 * SR); out[i:i + len(x)] += x[: len(out) - i]
    return out * 0.6
def sweep(dur, f0, f1):
    x = tone(lambda t: f0 * (f1 / f0) ** (t / dur), dur)
    return x * np.minimum(1, np.arange(len(x)) / (0.02 * SR)) * np.exp(-np.maximum(0, np.arange(len(x)) / SR - dur + 0.1) * 20)
def alarm():
    out = np.zeros(int(0.7 * SR))
    for k in range(3):
        x = tone(1320, 0.12, "square") * env(int(0.12 * SR), 0.002, 0.05); i = int(k * 0.2 * SR); out[i:i + len(x)] += lp(x, 5000)
    return out
def modem():
    out = np.zeros(int(1.4 * SR)); i = 0
    for f, d in [(1200, 0.18), (2100, 0.12), (980, 0.22), (1650, 0.1), (2400, 0.16), (1300, 0.3)]:
        x = tone(f, d, "square") * 0.5 + 0.2 * rng.standard_normal(int(d * SR)); x = bp(x, 400, 3000) * env(len(x), 0.005, d, 0.7)
        out[i:i + len(x)] += x[: len(out) - i]; i += len(x)
    return out
def scratch():
    n = int(0.35 * SR); x = bp(rng.standard_normal(n), 800, 3000)
    return x * np.abs(np.sin(np.linspace(0, 3 * np.pi, n))) * env(n, 0.005, 0.2)

def boing():
    x = tone(lambda t: 180 + 140 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 4), 0.45, "tri"); return lp(x, 2500) * env(len(x), 0.003, 0.18)
def crash_fx():
    n = int(0.9 * SR); x = lp(rng.standard_normal(n), 5000) * env(n, 0.001, 0.25)
    for f in (420, 690, 1130): x += 0.3 * tone(f * (1 + 0.01 * rng.standard_normal()), 0.9) * env(n, 0.001, 0.3)
    return x * 0.8
def glitch():
    out = np.zeros(int(0.5 * SR))
    for k in range(7):
        b = tone(400 + 1600 * rng.random(), 0.04, "square") * 0.5; i = int(k * 0.065 * SR); out[i:i + len(b)] += b
    return lp(out, 6000)
def sip(): n = int(0.35 * SR); x = bp(rng.standard_normal(n), 2500, 7000) * np.sin(np.linspace(0, np.pi, n)) ** 2; return x * 0.6
def splash(): n = int(0.6 * SR); x = bp(rng.standard_normal(n), 600, 5000) * env(n, 0.002, 0.15); return x
def growl():
    x = tone(lambda t: 70 + 25 * np.sin(2 * np.pi * 3 * t), 1.0, "saw") * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * np.arange(int(SR)) / SR))
    return lp(x, 300) * env(int(SR), 0.08, 0.6, 0.3)
def snore():
    n = int(1.4 * SR); x = lp(rng.standard_normal(n), 500) * (0.5 + 0.5 * np.sin(np.linspace(0, np.pi, n))) ** 2
    return x * (0.6 + 0.4 * tone(32, 1.4, "saw"))
def squish(): n = int(0.4 * SR); x = lp(rng.standard_normal(n), 1200) * env(n, 0.01, 0.12); return x + 0.4 * tone(lambda t: 300 - 200 * t, 0.4) * env(n, 0.01, 0.1)
def bubble(f=900): x = tone(lambda t: f + 1200 * t * 8, 0.09); return x * env(len(x), 0.002, 0.03)
def bell(): return ding(1760, 1.2) + 0.6 * ding(2349, 1.2)

EV = [
    (B["ten"] - 0.05, whoosh(0.4, 400, 5000), 0.5),
    (L(1) - 0.12, whoosh(0.35, 6000, 400), 0.45),
    (B["crash"], crash_fx(), 0.6), (B["crash"] + 0.05, glitch(), 0.3),
    (B["kyun"] - 0.05, boing(), 0.5),
    (B["two"] - 0.05, ding(1318), 0.35), (B["two"] + 0.2, ding(1318), 0.3),
    (B["tenHands"], alarm(), 0.3),
    (B["chai"], sip(), 0.6), (B["phone"], blip(1600), 0.4), (B["phone"] + 0.1, blip(2000), 0.35), (B["brush"], pop(), 0.6),
    (B["chaos"], whoosh(0.3, 3000, 800), 0.4), (B["kya"], splash(), 0.6), (B["kya"] + 0.05, crash_fx(), 0.25),
    (B["muscles"] - 0.05, chime_up(), 0.4),
    (B["energy"], sweep(0.9, 1200, 200) * 0.6, 0.3), (B["bhookh"], growl(), 0.7),
    (B["raat"] - 0.1, whoosh(0.9, 2000, 300), 0.3), (B["raat"] + 0.6, snore(), 0.35),
    (B["karwat"] + 0.15, squish(), 0.7), (B["karwat"] + 0.2, thud(), 0.6),
    (B["octo"] - 0.1, whoosh(0.4, 500, 3000), 0.35), (B["octo"] + 0.05, pop(), 0.5),
    (B["neurons"], chime_up(), 0.35),
    (B["brains"], pop(), 0.5),
    (B["sub"], click(), 0.9), (B["sub"] + 0.05, ding(2093), 0.4), (B["sub"] + 0.15, bell(), 0.35),
    (L(18) - 0.15, whoosh(0.8, 2000, 300), 0.3), (B["whatify"], chime_up(), 0.4),
]
for t0, x, g in EV: place(sfx, x, t0, g)
# arms popping out one pair at a time
for k in range(4): place(sfx, pop(), B["ten"] + 0.09 * (k + 1), 0.45)
# typing flurry for "5 guna tez kaam"
for tt in np.arange(B["tez"] - 0.2, L(2) - 0.2, 0.07): place(sfx, click(), tt + 0.02 * rng.random(), 0.25)
# each separate order: a little tick per arm
for k, tt in enumerate(np.arange(B["hukum"], L(7) - 0.1, 0.17)): place(sfx, blip(700 + 90 * (k % 5)), tt, 0.18)
# munching
for tt in np.arange(B["energy"] - 1.0, B["bhookh"] - 0.1, 0.33): place(sfx, bp(rng.standard_normal(int(0.08 * SR)), 1500, 5000) * env(int(0.08 * SR), 0.005, 0.03), tt, 0.25)
# the clock racing through the night
for k, tt in enumerate(np.arange(B["raat"] + 0.3, L(13) - 0.2, 0.12)): place(sfx, click(), tt, 0.18 if k % 2 else 0.26)
# thought bubbles popping over each octopus arm
for k in range(8): place(sfx, bubble(800 + 120 * k), B["soch"] + 0.05 + 0.08 * k, 0.25)
# tiny brains popping over each hand
for k in range(10): place(sfx, bubble(1000 + 80 * k), B["brains"] + 0.05 + 0.05 * k, 0.18)

# ---------------- mix (no voice: music sits as a bed for the VO to go on top) ----------------
def lufs_rough(x):
    y = hp(x, 60); blk = int(0.4 * SR)
    p = np.array([np.mean(y[i:i + blk] ** 2) for i in range(0, len(y) - blk, blk // 4)]); p = p[p > 1e-7]
    return -0.691 + 10 * np.log10(np.mean(p[10 * np.log10(p) > -70]) + 1e-12)
music_m = music * 10 ** ((-24 - lufs_rough(music)) / 20)   # a bed ~10 dB under a typical -14 LUFS voice
sfx_m = sfx * 10 ** ((-22 - lufs_rough(sfx)) / 20)
mix = music_m + sfx_m
pk = np.max(np.abs(mix))
if pk > 0.89: mix *= 0.89 / pk
out = sys.argv[2]; os.makedirs(out, exist_ok=True)
st = lambda x: np.stack([x, x], 1).astype(np.float32)
sf.write(f"{out}/music.wav", st(music_m), SR); sf.write(f"{out}/sfx.wav", st(sfx_m), SR); sf.write(f"{out}/music_sfx.wav", st(mix), SR)
print("len", len(mix) / SR, "s; peak", round(20 * np.log10(np.max(np.abs(mix))), 2), "dBFS")
