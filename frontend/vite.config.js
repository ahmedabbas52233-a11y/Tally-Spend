import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: false,
    // Recharts (~570kB minified) is intentionally isolated into its own
    // chunk and lazy-loaded via React.lazy() in Dashboard.jsx — it's never
    // part of the initial bundle, only fetched once the dashboard actually
    // renders data. Raised from the 500kB default so that confirmed-correct
    // chunk doesn't keep tripping the warning on every build.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          charts: ["recharts"],
        },
      },
    },
  },
});
