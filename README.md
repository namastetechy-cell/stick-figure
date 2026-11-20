# stick-figure

Workspace for making stick-figure story videos with the
[`stick-figure-shorts`](https://github.com/deenukhan/stick-figure-shorts) Claude Code skill
(Remotion + ElevenLabs, every frame drawn in code).

## Layout
| Path | What |
|---|---|
| `.claude/skills/stick-figure-shorts/` | The skill (vendored from upstream commit `82f0521`). Claude Code loads it automatically in this repo. |
| `.claude/skills/cartoon-3d-short/` | 3D cartoon-short skill (vendored from [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) commit `e3b817b`): 2D characters in a three.js world, 9:16, 55-70 s. |
| `.claude/skills/toon2d-shorts/` | 2D cartoon-short skill + CPU engine (toon2d-shorts v1.1.1, Python/skia): round-head ink characters, painted parallax sets, 9:16 1080x1920, 30-70 s, word-synced captions. |
| `engine/src/videos/bridge/` | That skill's "Bridge That Fell for a Song" template (`entry.tsx` → composition `BridgeShort`) |
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

## 3D cartoon shorts (cartoon-3d-short)
Ask Claude: *"Use the cartoon short skill and make a short about …"*

Extra requirements: `pip install numpy scipy pillow` (sound synth and QA scripts).

```bash
cd engine
npx remotion studio src/videos/bridge/entry.tsx                     # preview the template
npx remotion still src/videos/bridge/entry.tsx BridgeShort ../out/frame.png --frame=300 --gl=swangle
```
Use `--gl=swangle` on machines without a GPU (like cloud sessions). The optional Kenney CC0 props
(trees, stalls, banners…) are not bundled: download the Kenney Nature Kit / Fantasy Town Kit from
kenney.nl and put the `.glb` files named in `world.ts` into `engine/public/bridge/kenney/`.
The scene renders without them.

## 2D cartoon shorts (toon2d-shorts)
Ask Claude: *"Use the toon2d-shorts skill and make a Short about …"*. Pure Python, CPU only, no Remotion.

```bash
pip install -r .claude/skills/toon2d-shorts/requirements.txt
# Linux without a desktop also needs the GL libs skia loads: apt-get install -y libegl1 libgl1
T=".claude/skills/toon2d-shorts/t2d.py"
python3 $T doctor                       # must print DOCTOR OK
# project folder (outside the skill): shorts/<slug>/ with voice.wav + script.txt (+ storyboard.json)
python3 $T words  shorts/my-short       # or: silent shorts/my-short --script script.txt --duration 40
python3 $T plan   shorts/my-short
python3 $T render shorts/my-short --workers 4   # repeat until DONE
python3 $T join   shorts/my-short && python3 $T check shorts/my-short
```
See `.claude/skills/toon2d-shorts/SKILL.md` and its `docs/` for the storyboard format, sets and characters.
