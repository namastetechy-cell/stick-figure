# Ten arms short (WhatIfyTV): production notes

- **Film:** `engine/src/videos/arms/`, composition `ArmsShort` (1080x1920, 30 fps, about 58.4 s). It is built on the
  cartoon-3d-short look (ink, lens blur, grade). It reuses the bedroom set from the fast-computer short, plus a
  ten-armed man (`arms` option in `toon.ts` bodyFront) and an octopus (`octopus()` in `toon.ts`).
- **Timing:** there is no VO yet, so `timing.py` estimates word times for a brisk Hinglish read (~3.3 words/s).
  It writes `words.json` and `VO_CUES.md` (record each line inside its window).
- **Re-sync to the real VO:** replace `words.json` with the recorded voice's word times (same words, same order,
  `{w, s, e, line}`). Then run
  `python3 make_words_ts.py words.json ../../engine/src/videos/arms/words.ts` and `python3 audio/mix.py words.json audio/out`.
  The level step below must also be re-run, then re-render. Shots, poses, screens, captions and SFX all follow.
- **Captions:** burned in, grouped from `words.ts` (up to 3 words, active word yellow). Turn them off with
  `--props '{"captions":false}'`.
- **Sound:** `audio/mix.py` synthesizes the score (118 BPM, Dm-Bb-C-A) and all SFX. Levels are set with ffmpeg:
  music -5.2 dB → -26 LUFS, sfx -4.4 dB → -21 LUFS, then amix + limiter → `music_sfx.wav` (about -22 LUFS).
  Add the VO at about -14 LUFS on top.
- **Render:** `npx remotion render src/videos/arms/entry.tsx ArmsShort out.mp4 --codec h264 --crf 17 --gl=angle`
  (GPU). On a GPU-less cloud machine use `--gl=swangle`: about 7 s/frame at 1080p, 2.7 s/frame at 720p.
