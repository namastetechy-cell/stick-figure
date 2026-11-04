import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
import soundfile as sf, numpy as np
from scipy.signal import resample_poly
a, sr = sf.read(sys.argv[1], dtype="float32")
a = resample_poly(a, 16000, sr).astype(np.float32)
segs, _ = m.transcribe(a, word_timestamps=True, beam_size=5)
w = [{"w": x.word.strip(), "s": round(x.start, 3), "e": round(x.end, 3)} for s in segs for x in s.words]
json.dump(w, open(sys.argv[2], "w"), indent=0); print(len(w))
for x in w: print(f'{x["s"]:6.2f} {x["e"]:6.2f} {x["w"]}')
