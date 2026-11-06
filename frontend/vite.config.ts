import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// /api проксируется на backend: страница и API на одном адресе, cookie сессии работает без CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://localhost:8080", changeOrigin: false } },
  },
});
