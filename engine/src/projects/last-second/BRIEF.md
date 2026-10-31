# Last Second (16:9, 15 s)

## Story as sent
White void. A black stick figure stares down at a pulsing neon-red clock counting down from 15.
0–4 s it calmly draws a wall of shields around itself, line by line. 5–10 s the floor shatters, the clock
accelerates, shadows surge from the abyss and claw at the walls; it braces as the walls close in.
11–15 s the dark swallows the light, it drops its weapon, turns to face the viewer, and the frame freezes on its silhouette.
Closing question: "If your own walls started closing in right now, what would you spend your last second defending?"

## Narration (Piper TTS, en_US-ryan-high; placeholder until ElevenLabs is connected)
| at (s) | line |
|---|---|
| 0.50 | Fifteen seconds. |
| 1.90 | You don't panic. You build. |
| 3.40 | Wall... after wall. |
| 5.00 | Then the floor breaks. |
| 6.60 | The clock speeds up. The dark pushes in. |
| 10.25 | If your own walls started closing in right now, |
| 12.55 | what would you spend your last second defending? |
Lines synthesised one by one, placed with ffmpeg `adelay`, normalised to −16 LUFS → `public/projects/last-second/narration.wav` (plays from frame 0).
Word timings: faster-whisper small.en → `words.ts` via `cues.py --lead 0` (first word and "Wall… after wall" hand-corrected).

## Cue table (frames @30 fps)
"Fifteen" 16 · "panic" 67 · "build" 84 (first shield line 86) · "Wall… after wall" 104–130 (11 shields drawn 86–158) ·
cracks 156 · "breaks" 168 (shatter) · "clock speeds up" 202–227 (clock accelerates from f200) · "dark pushes in" 233 (shadows rise 232+) ·
impacts 266/282/296/310/320 · darkness closes 288–376 · drops the pen 336 (lands 349) · shields fall 338–380 ·
turns to camera 380–396 · FREEZE 409 on "second" (clock hits 00) · voice ends 432 · fade 440–450.

## Shots
0–55 wide · 55–100 medium (looks up, raises pen) · 100–150 wide (wall after wall) · 150–200 wide (floor breaks) ·
200–262 clock insert · 262–330 medium (shadows claw, figure braces) · 330–380 wide (light swallowed, lets go) · 380–450 close (turn, freeze).

## Sound
All synthesised with ffmpeg (`make_sfx.sh`): synth_tick on every clock change, synth_scribble while drawing, synth_shatter 166,
synth_rumble 228, synth_impact ×5, synth_clatter 349, synth_freeze 409; music_synth_drone bed; amb_room_tone 0.4. Mix −16 LUFS.

## Art direction note
The brief asks for a black stick figure on a white void, so this film departs from the skill's house look (white heads, dark sets).
The neon-red clock is the only colour and the only light left at the end. No facts used; no on-screen text besides subtitles and the clock digits.
