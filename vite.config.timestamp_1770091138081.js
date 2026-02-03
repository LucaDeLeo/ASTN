// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
var vite_config_default = defineConfig({
  server: {
    port: 3e3
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({
      projects: ["./tsconfig.json"]
    }),
    tanstackStart(),
    nitro({
      preset: "vercel"
    }),
    viteReact({
      babel: {
        plugins: ["babel-plugin-react-compiler"]
      }
    })
  ]
});
export {
  vite_config_default as default
};
