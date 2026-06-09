import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [sveltekit()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // @iarna/toml references Node's `global`; alias it to `window` for the browser.
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["monaco-editor"],
  },
});
