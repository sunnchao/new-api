import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBase = env.NEXT_PUBLIC_API_BASE || env.VITE_API_BASE || "http://localhost:3000";

  return {
    plugins: [react()],
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "next/dynamic": fileURLToPath(new URL("./src/lib/vite-next/dynamic.tsx", import.meta.url)),
        "next/image": fileURLToPath(new URL("./src/lib/vite-next/image.tsx", import.meta.url)),
        "next/link": fileURLToPath(new URL("./src/lib/vite-next/link.tsx", import.meta.url)),
        "next/navigation": fileURLToPath(
          new URL("./src/lib/vite-next/navigation.ts", import.meta.url)
        ),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: apiBase,
          changeOrigin: true,
          secure: false,
        },
        "/v1": {
          target: apiBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      proxy: {
        "/api": {
          target: apiBase,
          changeOrigin: true,
          secure: false,
        },
        "/v1": {
          target: apiBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
      "process.env.NEXT_PUBLIC_REALNAME_PROVIDER": JSON.stringify(
        env.NEXT_PUBLIC_REALNAME_PROVIDER || env.VITE_REALNAME_PROVIDER || ""
      ),
    },
  };
});
