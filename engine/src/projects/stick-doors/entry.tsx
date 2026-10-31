import React from "react";
import { registerRoot } from "remotion";
import { StickDoorsRoot } from "./index";
// Standalone entry so this film renders even while another project breaks the main bundle.
registerRoot(() => <StickDoorsRoot />);
