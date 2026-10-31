#!/bin/bash
# Synthesised sound library for "Last Second" (no ElevenLabs in this environment): every effect is made with ffmpeg.
# usage: make_sfx.sh <engine-public-dir>/projects/stick-sound-library
set -e
D="$1"; mkdir -p "$D"
g() { ffmpeg -v error -y "$@"; }
# heavy clock tick: bright click + low thump
g -f lavfi -i "aevalsrc='0.7*sin(2*PI*1900*t)*exp(-t*140)+0.9*sin(2*PI*80*t)*exp(-t*22)':d=0.35:s=48000" "$D/synth_tick.mp3"
# pen scribble: band-passed noise, scratchy amplitude
g -f lavfi -i "anoisesrc=d=0.6:c=pink:r=48000:a=0.9" -af "bandpass=f=3200:w=1800,volume='0.6+0.4*sin(2*PI*14*t)':eval=frame,afade=t=in:d=0.04,afade=t=out:st=0.45:d=0.15" "$D/synth_scribble.mp3"
# floor shatter: crackle burst + sub boom
g -f lavfi -i "anoisesrc=d=1.6:c=white:r=48000:a=1" -f lavfi -i "aevalsrc='1.0*sin(2*PI*(46+30*exp(-t*6))*t)*exp(-t*2.6)':d=1.6:s=48000" -filter_complex "[0]highpass=f=1500,volume='exp(-t*4)*(0.6+0.4*gt(sin(2*PI*37*t),0.2))':eval=frame[a];[1]volume=1.1[b];[a][b]amix=inputs=2:normalize=0,alimiter=limit=0.9" "$D/synth_shatter.mp3"
# impact against the shields
g -f lavfi -i "aevalsrc='1.0*sin(2*PI*(55+40*exp(-t*12))*t)*exp(-t*4)':d=1.2:s=48000" -f lavfi -i "anoisesrc=d=1.2:c=brown:r=48000:a=1" -filter_complex "[1]lowpass=f=500,volume='0.8*exp(-t*7)':eval=frame[n];[0][n]amix=inputs=2:normalize=0,alimiter=limit=0.9" "$D/synth_impact.mp3"
# shadows surging: rising brown-noise rumble
g -f lavfi -i "anoisesrc=d=3:c=brown:r=48000:a=1" -af "lowpass=f=300,volume='min(1,t/2.2)':eval=frame,afade=t=out:st=2.6:d=0.4" "$D/synth_rumble.mp3"
# whoosh for cuts
g -f lavfi -i "anoisesrc=d=0.8:c=pink:r=48000:a=0.8" -af "bandpass=f=900:w=700,volume='sin(PI*t/0.8)':eval=frame" "$D/synth_whoosh.mp3"
# the pen dropping: three small clatters
g -f lavfi -i "aevalsrc='(0.8*exp(-t*60)*sin(2*PI*2600*t)+0.5*exp(-(t-0.16)*70)*gt(t,0.16)*sin(2*PI*2300*t)+0.3*exp(-(t-0.27)*80)*gt(t,0.27)*sin(2*PI*2500*t))':d=0.6:s=48000" "$D/synth_clatter.mp3"
# the freeze: deep sub hit with a long tail
g -f lavfi -i "aevalsrc='1.0*sin(2*PI*(38+50*exp(-t*9))*t)*exp(-t*1.1)+0.25*sin(2*PI*220*t)*exp(-t*2)':d=3:s=48000" -af "alimiter=limit=0.9" "$D/synth_freeze.mp3"
# music bed: a low pulsing drone that tightens (15 s)
g -f lavfi -i "aevalsrc='(0.32*sin(2*PI*55*t)+0.22*sin(2*PI*82.4*t)+0.12*sin(2*PI*110.5*t)+0.06*sin(2*PI*164.8*t))*(0.75+0.25*sin(2*PI*(0.8+t*0.12)*t))':d=15:s=48000" -af "afade=t=in:d=1.5,afade=t=out:st=13.5:d=1.5" "$D/music_synth_drone.mp3"
ls "$D"
