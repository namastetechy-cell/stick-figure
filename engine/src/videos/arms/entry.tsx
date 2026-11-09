// Entry for "Agar ek din ke liye aapke 10 haath ho jaayein?" (WhatIfyTV, cartoon-3d-short skill).
import React from "react";
import { Composition, registerRoot } from "remotion";
import { ArmsShort, ARMS_FRAMES } from "./Arms";

const Root: React.FC = () => (
  <Composition id="ArmsShort" component={ArmsShort} durationInFrames={ARMS_FRAMES} fps={30} width={1080} height={1920} />
);
registerRoot(Root);
