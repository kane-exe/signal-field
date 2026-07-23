/* global process */
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const accountId = env.VITE_CLOUDFLARE_ACCOUNT_ID || "";
  const apiToken = env.VITE_CLOUDFLARE_API_TOKEN || "";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/ai": {
          target: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run`,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace("/api/ai", ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("Authorization", `Bearer ${apiToken}`);
              proxyReq.setHeader("Content-Type", "application/json");
            });
          },
        },
      },
    },
  };
});
