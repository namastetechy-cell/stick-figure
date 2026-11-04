# Fast computer short: production notes

- **Film:** `engine/src/videos/speed/`, composition `SpeedShort` (1080x1920, 30 fps, 1050 frames = 35.0 s), built from the
  cartoon-3d-short bridge template (ink, lens blur, grade and character cards are unchanged; story/world/cast are new).
- **Set:** a cutaway kid's bedroom (no ceiling, open on two sides) in a cobbled square of the painted town.
- **Voice:** Kokoro TTS (open model, `am_michael`, speed 1.3), made by `voice/tts.py` from `SCRIPT.md`. Word times come from
  faster-whisper (`voice/words.py` → `voice/words.json`). All shots, expressions, screen states and SFX are timed to these.
- **Captions:** burned in (`captions.ts`): 1-3 words per card, the active word in yellow, Montserrat Black. They sit at 62 % of
  the frame height, above the Shorts UI. Also exported as `captions.srt`. Render without them using `--props '{"captions":false}'`.
- **Sound:** `audio/mix.py` synthesizes the original score (112 BPM, C-G-Am-F) and every SFX. Music is ducked under the voice,
  music +3 dB and SFX -6 dB (house rule), then loudnorm brings the mix to -14 LUFS.
- **Render (no GPU):** `cd engine && npx remotion render src/videos/speed/entry.tsx SpeedShort ../out/speed/video.mp4 --codec h264 --crf 17 --gl=swangle --concurrency=4`
  then mux: `ffmpeg -i video.mp4 -i mix14.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest final.mp4`.
- **Stills:** `node scripts/stills.mjs src/videos/speed/entry.tsx SpeedShort ../out/speed/x_ 100,400 0.5`
- The Kenney props are optional (not bundled); the town renders without them.
