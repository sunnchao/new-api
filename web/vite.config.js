/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import react from '@vitejs/plugin-react';
import { defineConfig, transformWithOxc } from 'vite';
import pkg from '@douyinfe/vite-plugin-semi';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
const { vitePluginSemi } = pkg;

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    codeInspectorPlugin({
      bundler: 'vite',
    }),
    (() => {
      let outDir = 'dist';
      return {
        name: 'manifest-version-hash',
        apply: 'build',
        configResolved(config) {
          outDir = config.build.outDir;
        },
        writeBundle() {
          const manifestPath = path.resolve(__dirname, 'public/manifest.json');
          if (!fs.existsSync(manifestPath)) {
            return;
          }
          let manifestData = {};
          try {
            const rawManifest = fs.readFileSync(manifestPath, 'utf-8');
            manifestData = JSON.parse(rawManifest);
          } catch (error) {
            manifestData = {};
          }
          const versionHash = crypto
            .createHash('sha256')
            .update(`${Date.now()}-${Math.random()}`)
            .digest('hex')
            .slice(0, 12);
          const outputManifest = {
            ...manifestData,
            version: versionHash,
          };
          const outputPath = path.resolve(outDir || 'dist', 'manifest.json');
          fs.writeFileSync(outputPath, JSON.stringify(outputManifest, null, 2));
        },
      };
    })(),
    {
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!/src\/.*\.js$/.test(id)) {
          return null;
        }

        // Use the exposed transform from vite, instead of directly
        // transforming with esbuild
        return transformWithOxc(code, id, {
          lang: 'jsx',
          jsx: { runtime: 'automatic' },
        });
      },
    },
    react(),
    vitePluginSemi({
      cssLayer: true,
    }),
  ],
  optimizeDeps: {
    force: true,
    include: ['sse.js'],
    rolldownOptions: {
      input: {
        '.js': 'jsx',
        '.json': 'json',
      },
    },
  },
  build: {
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
    rolldownOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'EVAL' || warning.code === 'COMMONJS_VARIABLE_IN_ESM') return;
        warn(warning);
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-core';
          }
          if (id.includes('node_modules/@douyinfe/semi-icons') || id.includes('node_modules/@douyinfe/semi-ui')) {
            return 'semi-ui';
          }
          if (id.includes('node_modules/mermaid') || id.includes('node_modules/cytoscape')) {
            return 'mermaid';
          }
          if (id.includes('node_modules/@visactor/')) {
            return 'visactor';
          }
          if (id.includes('node_modules/katex')) {
            return 'katex';
          }
          if (id.includes('node_modules/lottie-web') || id.includes('node_modules/react-fireworks')) {
            return 'lottie';
          }
          if (id.includes('node_modules/@lobehub/')) {
            return 'lobehub';
          }
          if (id.includes('node_modules/axios') || id.includes('node_modules/history') || id.includes('node_modules/marked')) {
            return 'tools';
          }
          if (
            id.includes('node_modules/react-dropzone') ||
            id.includes('node_modules/react-telegram-login') ||
            id.includes('node_modules/react-toastify') ||
            id.includes('node_modules/react-turnstile')
          ) {
            return 'react-components';
          }
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next') || id.includes('node_modules/i18next-browser-languagedetector')) {
            return 'i18n';
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/mj': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/pg': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
