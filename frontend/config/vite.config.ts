import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ No need for @tailwindcss/vite
export default defineConfig({
  plugins: [react()],
});
