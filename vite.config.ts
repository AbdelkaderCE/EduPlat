import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  console.log('[vite.config] Configuring with real Supabase credentials');
  
  return {
    plugins: [react()],
    define: {
      'process.env.REACT_APP_SUPABASE_URL': '"https://cyvftbyjwgludmpnlcop.supabase.co"',
      'process.env.REACT_APP_SUPABASE_ANON_KEY': '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dmZ0Ynlqd2dsdWRtcG5sY29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODIwMzgsImV4cCI6MjA5NTU1ODAzOH0.EjtNIxsJHrJ_Zc4FUcaxb6tgz_yVnE_9NEp6k5gKhNU"',
      'process.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID': '"placeholder-cloudflare-account-id"',
      'process.env.REACT_APP_DEMO_MODE': '"false"',
    },
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  }
})
