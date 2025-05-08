import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Load environment variables
  envPrefix: 'VITE_',
  // Define default environment variables
  define: {
    'process.env': {
      VITE_API_BASE_URL: JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:3000'),
      VITE_API_TIMEOUT: JSON.stringify(process.env.VITE_API_TIMEOUT || '30000'),
      VITE_ENABLE_REAL_TIME_UPDATES: JSON.stringify(process.env.VITE_ENABLE_REAL_TIME_UPDATES || 'true'),
      VITE_ENABLE_NOTIFICATIONS: JSON.stringify(process.env.VITE_ENABLE_NOTIFICATIONS || 'true'),
      VITE_DEFAULT_TIMEZONE: JSON.stringify(process.env.VITE_DEFAULT_TIMEZONE || 'UTC'),
      VITE_MAX_TEMPERATURE_THRESHOLD: JSON.stringify(process.env.VITE_MAX_TEMPERATURE_THRESHOLD || '30'),
      VITE_MIN_TEMPERATURE_THRESHOLD: JSON.stringify(process.env.VITE_MIN_TEMPERATURE_THRESHOLD || '2'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
