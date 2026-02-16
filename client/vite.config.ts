import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      api: fileURLToPath(new URL("./src/api", import.meta.url)),
      components: fileURLToPath(new URL("./src/components", import.meta.url)),
      features: fileURLToPath(new URL("./src/features", import.meta.url)),
      lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
      modules: fileURLToPath(new URL("./src/modules", import.meta.url)),
      store: fileURLToPath(new URL("./src/store", import.meta.url)),
      services: fileURLToPath(new URL("./src/services", import.meta.url))
    }
  },
  server: {
    port: 5173
  }
});
