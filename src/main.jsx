import React from "react";
import { createRoot } from "react-dom/client";
import Artvelchiv from "./Artvelchiv.jsx";
const pin = import.meta.env.VITE_DEMO_PIN || "ARTVELCHIV";
createRoot(document.getElementById("root")).render(<React.StrictMode><Artvelchiv pin={pin} /></React.StrictMode>);
