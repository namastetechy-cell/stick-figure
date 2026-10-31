import React from "react";
import { registerRoot } from "remotion";
import { LastSecondRoot } from "./index";
// Standalone entry so this film renders even while another project breaks the main bundle.
registerRoot(() => <LastSecondRoot />);
