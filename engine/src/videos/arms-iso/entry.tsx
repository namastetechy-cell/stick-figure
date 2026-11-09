// Entry for the isometric 2D version of "Agar ek din ke liye aapke 10 haath ho jaayein?" (WhatIfyTV).
import React from "react";
import { Composition, registerRoot } from "remotion";
import { IsoShort, ISO_FRAMES } from "./Iso";

const Root: React.FC = () => (
  <Composition id="IsoShort" component={IsoShort} durationInFrames={ISO_FRAMES} fps={30} width={1080} height={1920} />
);
registerRoot(Root);
