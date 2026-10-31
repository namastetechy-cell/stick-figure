import React from "react";
import { Composition, Folder } from "remotion";
import { FILM_FRAMES, LastSecondFilm } from "./Film";
// Compositions for project "last-second" (16:9, 15 s). Canvas 2560x1440; render with --scale=0.75 for 1920x1080.

export const LastSecondRoot: React.FC = () => (
  <Folder name="last-second">
    <Composition id="last-second-FILM" component={LastSecondFilm} width={2560} height={1440} fps={30} durationInFrames={FILM_FRAMES} />
  </Folder>
);
