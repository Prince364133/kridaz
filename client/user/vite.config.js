import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Specific mappings MUST come before general ones
      "@hooks/owner": path.resolve(__dirname, "../owner/src/hooks/owner"),
      "@hooks/admin": path.resolve(__dirname, "../owner/src/hooks/admin"),
      "@components/owner": path.resolve(__dirname, "../owner/src/components/owner"),
      "@components/admin": path.resolve(__dirname, "../owner/src/components/admin"),
      "@components/layout": path.resolve(__dirname, "../owner/src/components/layout"),
      "@utils/owner": path.resolve(__dirname, "../owner/src/utils/owner"),
      "@redux/owner": path.resolve(__dirname, "../owner/src/redux"),
      
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@redux": path.resolve(__dirname, "./src/redux"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@layouts": path.resolve(__dirname, "./src/layouts"),
      "@owner": path.resolve(__dirname, "../owner/src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
    fs: {
      allow: [
        path.resolve(__dirname, "../../"), // Allow access to the entire monorepo root
      ],
    },
  },
})
