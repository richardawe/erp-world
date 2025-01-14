import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  define: {
    // Only expose the URL, not the keys
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    // Replace sensitive values with placeholder during build
    'import.meta.env.VITE_SUPABASE_ANON_KEY': '"RUNTIME_ANON_KEY"',
    'import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY': '"RUNTIME_SERVICE_KEY"',
  },
});
