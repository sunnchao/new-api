import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Providers } from "@/app/providers";
import { AppRouter } from "@/lib/vite-router";
import { ViteRouterProvider } from "@/lib/vite-router-context";
import "@/app/globals.css";
import "@/styles/theme-presets.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root was not found");
}

createRoot(root).render(
  <StrictMode>
    <ViteRouterProvider>
      <Providers>
        <AppRouter />
      </Providers>
    </ViteRouterProvider>
  </StrictMode>
);
