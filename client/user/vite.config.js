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

      // Force shared dependencies to resolve from the user portal's node_modules
      // This is critical for Vercel builds where owner/node_modules may not be present
      "lucide-react": path.resolve(__dirname, "node_modules/lucide-react"),
      "recharts": path.resolve(__dirname, "node_modules/recharts"),
      "react-countup": path.resolve(__dirname, "node_modules/react-countup"),
      "react-avatar": path.resolve(__dirname, "node_modules/react-avatar"),
      "date-fns-tz": path.resolve(__dirname, "node_modules/date-fns-tz"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react-router-dom": path.resolve(__dirname, "node_modules/react-router-dom"),
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
