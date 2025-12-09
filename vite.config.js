import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: true,       // Listen on all addresses for mobile testing
        port: 5173,
        // Note: localhost allows camera/GPS without HTTPS
        // For mobile testing, you'll need to use ngrok or similar
        open: true
    },
    build: {
        target: 'es2020',
        minify: 'esbuild',  // Use built-in esbuild minifier
        sourcemap: false
    }
});
