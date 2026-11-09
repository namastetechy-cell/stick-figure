"""Estimated word timings for a natural Hinglish narration (no VO yet): syllables at a steady pace, pauses at punctuation.
Writes words.json [{w, s, e}] and VO_CUES.md (line start/end) for recording to picture.
Replace words.json with real timings (from the recorded VO) and re-render to re-sync everything."""
import json, re
RATE = 6.3       # syllables per second (brisk YouTube Shorts narration, ~3.3 words/s)
SPOKEN = {"10": "das", "5": "paanch", "8": "aath", "2": "do", "WhatIfyTV": "what if ee tee vee", "muscles": "mus sels",
          "neurons": "nyoo rons", "octopus": "ok to pus", "subscribe": "sub skraib", "crash": "krash", "phone": "fon", "brush": "brash"}
def syl(w):
    s = SPOKEN.get(re.sub(r"[^\w]", "", w), re.sub(r"[^\w]", "", w)).lower()
    return max(1, len(re.findall(r"[aeiou]+", s.replace("y", "i") if not re.search(r"[aeiou]", s) else s)))
lines = [l for l in open("SCRIPT.md").read().split("## Voice-over")[1].strip().splitlines() if l.strip()]
t, out, cues = 0.35, [], []
for li, line in enumerate(lines):
    t0 = t
    toks = line.replace('"', "").split()
    for w in toks:
        d = max(0.17, syl(w) / RATE)
        out.append({"w": w, "s": round(t, 3), "e": round(t + d, 3), "line": li})
        t += d + 0.03
        if w[-1] in ",:": t += 0.16
    cues.append((t0, t))
    t += 0.34 if line.endswith("?") or line.endswith("!") else 0.26
json.dump(out, open("words.json", "w"), indent=0)
with open("VO_CUES.md", "w") as f:
    f.write("# VO cue sheet (read each line inside its window; the picture and captions are timed to it)\n\n| # | start | end | line |\n|---|---|---|---|\n")
    for i, ((a, b), l) in enumerate(zip(cues, lines), 1): f.write(f"| {i} | {a:5.2f} s | {b:5.2f} s | {l} |\n")
print("words", len(out), "speech ends", round(out[-1]["e"], 2), "s")
for i, ((a, b), l) in enumerate(zip(cues, lines)): print(f"{i:2} {a:6.2f} {b:6.2f} {l}")
