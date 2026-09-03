import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { site: resolve(__dirname, "index.html"), app: resolve(__dirname, "app/index.html") } } },
});
