import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget = env.VITE_BACKEND_TARGET || "http://127.0.0.1:8080";

  return {
    plugins: [react(), tailwindcss(), viteSingleFile()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      proxy: {
        "/api/v1/auth": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/api/v1/health": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/api/v1/metadata/data-sources": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/api/v1/development/scripts": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/api/v1/ai": {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
