"""Original score + synthesized SFX for the fast-computer short, mixed under the voice.
usage: python mix.py <voice.wav> <out_dir>   -> music.wav, sfx.wav, mix.wav (48 kHz stereo, exactly 35.0 s)
Event times are the voice word times (voice/words.json) used by story.ts."""
import sys, os, numpy as np, soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt

SR = 48000
DUR = 35.0
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

# ---------------- music: 112 BPM, C - G - Am - F, pad + pluck arpeggio + soft drums ----------------
BPM = 112; beat = 60 / BPM; bar = 4 * beat
CH = [[48, 52, 55, 60, 64], [43, 50, 55, 59, 62], [45, 52, 57, 60, 64], [41, 48, 53, 57, 60]]
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
for a, b in [(13.85, 16.4)]:
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

EV = [
    (1.30, whoosh(0.5, 300, 6000), 0.7), (1.78, zap(), 0.35), (1.95, ding(1568), 0.45),
    (3.36, whoosh(0.35, 6000, 400), 0.5),
    (5.84, whoosh(0.3, 500, 3000), 0.35),
    (9.06, zap(), 0.5), (9.12, ding(2093), 0.5),
    (11.62, blip(1800), 0.35), (11.72, blip(1400), 0.3),
    (12.16, chime_up(), 0.45),
    (13.88, wah(), 0.55),
    (15.94, thud(), 0.8), (16.0, whoosh(0.5, 1500, 600), 0.2),
    (18.28, click(), 0.8), (18.32, ding(2637, 1.2), 0.3),
    (18.92, blip(2200), 0.25),
    (20.06, sweep(1.35, 400, 3200) * 0.6, 0.35), (21.42, ding(3136, 0.6), 0.3),
    (22.64, whoosh(0.7, 600, 2500), 0.4), (23.55, click(), 0.8), (23.58, blip(900), 0.4),
    (24.42, pop(), 0.6),
    (26.78, scratch(), 0.5),
    (29.06, sweep(1.1, 200, 1400) * 0.6, 0.35), (30.2, alarm(), 0.3),
    (31.0, whoosh(0.8, 2000, 300), 0.3),
    (32.66, modem(), 0.18),
]
for t0, x, g in EV: place(sfx, x, t0, g)
# the clock racing while the download drags (unluckily .. and there's)
for k, tt in enumerate(np.arange(14.3, 16.4, 0.11)): place(sfx, click(), tt, 0.35 if k % 2 else 0.5)
# licks / munches on the snack
for tt in np.arange(24.9, 26.4, 0.62): place(sfx, bp(rng.standard_normal(int(0.09 * SR)), 1500, 5000) * env(int(0.09 * SR), 0.01, 0.03), tt, 0.18)

# ---------------- mix ----------------
def lufs_rough(x):  # K-weighting approximation: high-shelf-ish pre-filter + RMS gate
    y = hp(x, 60); blk = int(0.4 * SR)
    p = np.array([np.mean(y[i:i + blk] ** 2) for i in range(0, len(y) - blk, blk // 4)]); p = p[p > 1e-7]
    return -0.691 + 10 * np.log10(np.mean(p[10 * np.log10(p) > -70]) + 1e-12)

v, vsr = sf.read(sys.argv[1], dtype="float64")
if v.ndim > 1: v = v.mean(1)
v = resample_poly(v, SR, vsr)
voice = np.zeros(N); voice[: min(N, len(v))] = v[:N]
voice *= 10 ** ((-16 - lufs_rough(voice)) / 20)
# duck the music under the voice (envelope follower, ~8 dB)
ve = lp(np.abs(voice), 6); ve = ve / (ve.max() + 1e-9)
duck = 10 ** (-8 * np.clip(ve * 4, 0, 1) / 20)
music_m = music * 10 ** ((-27 - lufs_rough(music)) / 20) * lp(duck, 4) * 10 ** (3 / 20)  # house rule: music +3 dB
sfx_m = sfx * 10 ** (-6 / 20) * 0.9                                                     # house rule: SFX -6 dB
mix = voice + music_m + sfx_m
mix *= 10 ** ((-14 - lufs_rough(mix)) / 20)
pk = np.max(np.abs(mix))
if pk > 0.89: mix = np.tanh(mix / 0.89 * 1.0) * 0.89  # soft ceiling ~ -1 dBTP
out = sys.argv[2]; os.makedirs(out, exist_ok=True)
st = lambda x: np.stack([x, x], 1).astype(np.float32)
sf.write(f"{out}/music.wav", st(music_m), SR); sf.write(f"{out}/sfx.wav", st(sfx_m), SR); sf.write(f"{out}/mix.wav", st(mix), SR)
print("mix", round(lufs_rough(mix), 1), "LUFS~, peak", round(20 * np.log10(np.max(np.abs(mix))), 2), "dBFS, len", len(mix) / SR)
