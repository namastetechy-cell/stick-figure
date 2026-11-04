import sys, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
M = sys.argv[1]; voice = sys.argv[2]; speed = float(sys.argv[3]); out = sys.argv[4]
txt = open(sys.argv[5]).read().split("## Voice-over")[1].strip()
k = Kokoro(f"{M}/kokoro-v1.0.onnx", f"{M}/voices-v1.0.bin")
parts = []
for line in [l for l in txt.splitlines() if l.strip()]:
    a, sr = k.create(line, voice=voice, speed=speed, lang="en-us")
    parts += [a, np.zeros(int(sr * 0.07), dtype=a.dtype)]
a = np.concatenate([np.zeros(int(sr*0.15), dtype=parts[0].dtype)] + parts)
sf.write(out, a, sr); print(out, len(a)/sr, "s")
