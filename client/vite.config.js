import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable websocket proxying
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy] Proxy error:', err);
            console.error('[Vite Proxy] Request URL:', req.url);
            console.error('[Vite Proxy] Make sure the Express server is running on port 5000');
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[Vite Proxy] Proxying request to:', proxyReq.path);
            console.log('[Vite Proxy] Full URL:', proxyReq.getHeader('host') + proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[Vite Proxy] Response status:', proxyRes.statusCode);
          });
        }
      }
    }
  }
})

