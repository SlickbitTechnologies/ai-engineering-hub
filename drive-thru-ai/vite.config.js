import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['national-tough-ghost.ngrok-free.app'],
    // optionally, you can allow all hosts with:
    // allowedHosts: 'all'
  },
});

