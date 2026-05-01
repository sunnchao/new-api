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
import { defineConfig } from 'vite';
import pkg from '@douyinfe/vite-plugin-semi';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { cloudflareRocketLoaderGuard } from '../src/lib/cloudflareRocketLoaderGuard.js';
const { vitePluginSemi } = pkg;

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    cloudflareRocketLoaderGuard(),
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
    react(),
    vitePluginSemi({
      cssLayer: true,
    }),
  ],
  optimizeDeps: {
    force: true,
    rolldownOptions: {
      loader: {
        '.js': 'jsx',
        '.json': 'json',
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // 提高警告阈值到 1MB
    rollupOptions: {
      output: {
        // 更好的 chunk 拆分策略
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 核心框架 - 保持稳定
            if (['react', 'react-dom', 'react-router-dom', 'scheduler'].some((m) => id.includes(m))) {
              return 'react-core';
            }
            // Semi UI - 单独拆包
            if (['@douyinfe/semi-icons', '@douyinfe/semi-ui'].some((m) => id.includes(m))) {
              return 'semi-ui';
            }
            // 工具库
            if (['axios', 'history', 'marked', 'decimal.js', 'dayjs'].some((m) => id.includes(m))) {
              return 'utils';
            }
            // 图表库 - 单独拆包
            if (['@visactor', 'echarts', 'mermaid', 'cytoscape'].some((m) => id.includes(m))) {
              return 'charts';
            }
            // Markdown 相关
            if (['react-markdown', 'remark-', 'rehype-', 'katex'].some((m) => id.includes(m))) {
              return 'markdown';
            }
            // i18n
            if (['i18next', 'react-i18next'].some((m) => id.includes(m))) {
              return 'i18n';
            }
            // UI 组件
            if (
              ['react-dropzone', 'react-fireworks', 'react-toastify', 'react-turnstile', 'qrcode.react'].some(
                (m) => id.includes(m),
              )
            ) {
              return 'components';
            }
          }
        },
      },
    },
  },
  server: {
    host: true,
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
