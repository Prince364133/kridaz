// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/shared/components"),
      "@hooks": path.resolve(__dirname, "./src/shared/hooks"),
      "@utils": path.resolve(__dirname, "./src/shared/utils"),
      "@layouts": path.resolve(__dirname, "./src/shared/layouts"),
      "@services": path.resolve(__dirname, "./src/shared/services"),
      "@redux": path.resolve(__dirname, "./src/redux"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@context": path.resolve(__dirname, "./src/context"),
      "@user/components": path.resolve(__dirname, "./src/shared/components"),
      "@user/pages": path.resolve(__dirname, "./src/pages"),
      "@user/layouts": path.resolve(__dirname, "./src/shared/layouts"),
      "@user/hooks": path.resolve(__dirname, "./src/shared/hooks"),
      "@user/utils": path.resolve(__dirname, "./src/shared/utils"),
      "@user/services": path.resolve(__dirname, "./src/shared/services"),
      "@user": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:6001",
        changeOrigin: true,
      },
      "/r2-reels": {
        target: "https://pub-cc243bd179ab45ee94097baeca380dd4.r2.dev",
        changeOrigin: true,
        secure: false, // Avoid SSL issues in dev proxy
        ws: true,      // Support websockets if needed
        rewrite: (path) => path.replace(/^\/r2-reels/, ""),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
});
