import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        // bibliotecas mudam pouco: ficam em arquivos próprios e o navegador guarda entre as atualizações do site
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler|@tanstack)[\\/]/.test(id)) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
})
