# stick-figure

Workspace for making stick-figure story videos with the
[`stick-figure-shorts`](https://github.com/deenukhan/stick-figure-shorts) Claude Code skill
(Remotion + ElevenLabs, every frame drawn in code).

## Layout
| Path | What |
|---|---|
| `.claude/skills/stick-figure-shorts/` | The skill (vendored from upstream commit `82f0521`). Claude Code loads it automatically in this repo. |
| `engine/` | Remotion project that all films render from. `engine/src/projects/<slug>/` holds a film's code, `engine/public/projects/<slug>/` its narration and assets. |
| `engine/src/projects/stick-doors/` | The "Three Doors" template film, ready to copy |
| `engine/public/projects/stick-sound-library/` | Shared sound library (ambience beds; SFX and music get added here) |

## Requirements
Node 18+, ffmpeg, Python 3, and for narration either the ElevenLabs connector or `ELEVENLABS_API_KEY`.
Optional: `pip install faster-whisper` for word timings from an existing voice file.

```bash
cd engine && npm install
```

## Make a film
Ask Claude: *"Use the stick-figure-shorts skill. Make a 30-second 16:9 story about …"*

By hand:
```bash
S=.claude/skills/stick-figure-shorts/scripts
bash $S/new_film.sh my-film engine                     # scaffold engine/src/projects/my-film
cd engine && npx remotion studio src/projects/my-film/entry.tsx   # preview
cd .. && bash $S/render.sh engine my-film out/my-film_v1.mp4 --scale=0.75
```

See `.claude/skills/stick-figure-shorts/SETUP.md` for licences (ElevenLabs free plan has no commercial licence; Remotion is free for teams of up to 3).
