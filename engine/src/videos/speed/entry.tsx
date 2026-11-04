// Entry for "What if your computer moved 10,000 GB a second?" (cartoon-3d-short skill).
import React from "react";
import { Composition, registerRoot } from "remotion";
import { SpeedShort, SPEED_FRAMES } from "./Speed";

const Root: React.FC = () => (
  <Composition id="SpeedShort" component={SpeedShort} durationInFrames={SPEED_FRAMES} fps={30} width={1080} height={1920} />
);
registerRoot(Root);
