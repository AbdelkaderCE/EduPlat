import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.REACT_APP_SUPABASE_URL': '"https://cyvftbyjwgludmpnlcop.supabase.co"',
    'process.env.REACT_APP_SUPABASE_ANON_KEY': '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dmZ0Ynlqd2dsdWRtcG5sY29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODIwMzgsImV4cCI6MjA5NTU1ODAzOH0.EjtNIxsJHrJ_Zc4FUcaxb6tgz_yVnE_9NEp6k5gKhNU"',
    'process.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID': '"placeholder-cloudflare-account-id"',
    'process.env.REACT_APP_DEMO_MODE': '"false"',
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
