import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ No need for @tailwindcss/vite
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
});
