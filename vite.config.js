import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Menaikkan batas warning menjadi 1.5MB karena project memiliki SDK Firebase & Framer Motion
    chunkSizeWarningLimit: 1600, 
    
    // 2. Memecah library besar (node_modules) menjadi file chunk terpisah
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Memisahkan firebase menjadi chunk sendiri
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // Memisahkan framer-motion dan lucide menjadi chunk sendiri
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            return 'vendor'; // sisanya masuk ke vendor utama
          }
        }
      }
    }
  }
})
