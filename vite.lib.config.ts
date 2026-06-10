import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist/package',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    lib: {
      entry: 'src/index.ts',
      name: 'MTPAYWalletKit',
      formats: ['es', 'cjs'],
      cssFileName: 'style',
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs')
    },
    rollupOptions: {
      external: (id) =>
        ['@ant-design/icons', 'antd', 'lucide-react', 'react', 'react-dom', 'react/jsx-runtime', 'viem'].some((dependency) => id === dependency || id.startsWith(`${dependency}/`)),
      output: {
        globals: {
          '@ant-design/icons': 'icons',
          antd: 'antd',
          'lucide-react': 'lucideReact',
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          viem: 'viem'
        }
      }
    },
    sourcemap: true
  }
});
