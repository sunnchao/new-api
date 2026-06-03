import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import fs from 'fs'
import crypto from 'crypto'
import { defineConfig, loadEnv } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const semiUiDir = path.resolve(
  path.dirname(require.resolve('@douyinfe/semi-ui')),
  '../..',
)
const classicVChartDir = path.dirname(
  require.resolve('@visactor/vchart/package.json'),
)
const classicReactVChartDir = path.dirname(
  require.resolve('@visactor/react-vchart/package.json'),
)
const classicVChartDependencyDir = (packageName) =>
  path.join(classicVChartDir, 'node_modules', packageName)

const classicVChartAliases = {
  '@visactor/react-vchart$': classicReactVChartDir,
  '@visactor/vchart$': classicVChartDir,
  '@visactor/vdataset$': classicVChartDependencyDir('@visactor/vdataset'),
  '@visactor/vrender-components$': classicVChartDependencyDir(
    '@visactor/vrender-components',
  ),
  '@visactor/vrender-core$': classicVChartDependencyDir(
    '@visactor/vrender-core',
  ),
  '@visactor/vrender-kits$': classicVChartDependencyDir(
    '@visactor/vrender-kits',
  ),
  '@visactor/vscale$': classicVChartDependencyDir('@visactor/vscale'),
  '@visactor/vutils$': classicVChartDependencyDir('@visactor/vutils'),
  '@visactor/vutils-extension$': classicVChartDependencyDir(
    '@visactor/vutils-extension',
  ),
}

const manifestVersionHashPlugin = () => ({
  name: 'manifest-version-hash',
  apply: 'build' as const,
  setup(api) {
    api.onAfterBuild(() => {
      const manifestPath = path.resolve(__dirname, 'public/manifest.json')
      if (!fs.existsSync(manifestPath)) {
        return
      }

      let manifestData = {}
      try {
        const rawManifest = fs.readFileSync(manifestPath, 'utf-8')
        manifestData = JSON.parse(rawManifest)
      } catch (error) {
        manifestData = {}
      }

      const versionHash = crypto
        .createHash('sha256')
        .update(`${Date.now()}-${Math.random()}`)
        .digest('hex')
        .slice(0, 12)
      const outputManifest = {
        ...manifestData,
        version: versionHash,
      }

      const { output } = api.getNormalizedConfig()
      const outputRoot = output.distPath.root || 'dist'
      const outputPath = path.resolve(__dirname, outputRoot, 'manifest.json')
      fs.mkdirSync(path.dirname(outputPath), { recursive: true })
      fs.writeFileSync(outputPath, JSON.stringify(outputManifest, null, 2))
    })
  },
})

export default defineConfig(({ envMode }) => {
  const env = loadEnv({ mode: envMode, prefixes: ['VITE_'] })
  const clientServerUrl =
    process.env.VITE_REACT_APP_SERVER_URL ||
    env.rawPublicVars.VITE_REACT_APP_SERVER_URL ||
    ''
  const proxyServerUrl =
    clientServerUrl ||
    'http://localhost:3000'
  const isProd = envMode === 'production'
  const devProxy = Object.fromEntries(
    (['/api', '/mj', '/pg'] as const).map((key) => [
      key,
      { target: proxyServerUrl, changeOrigin: true },
    ]),
  ) as Record<string, { target: string; changeOrigin: boolean }>

  return {
    plugins: [manifestVersionHashPlugin(), pluginReact()],
    source: {
      entry: {
        index: './src/index.jsx',
      },
      define: {
        'import.meta.env.VITE_REACT_APP_SERVER_URL': JSON.stringify(
          clientServerUrl,
        ),
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@douyinfe/semi-ui/dist/css/semi.css': path.resolve(
          semiUiDir,
          'dist/css/semi.css',
        ),
        ...classicVChartAliases,
      },
    },
    html: {
      template: './index.html',
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      proxy: devProxy,
    },
    output: {
      minify: isProd,
      target: 'web',
      distPath: {
        root: 'dist',
      },
    },
    performance: {
      removeConsole: isProd ? ['log'] : false,
      buildCache: {
        cacheDigest: [process.env.VITE_REACT_APP_VERSION],
      },
    },
    tools: {
      rspack: {
        module: {
          rules: [
            {
              test: /src[\\/].*\.js$/,
              type: 'javascript/auto',
              use: [
                {
                  loader: 'builtin:swc-loader',
                  options: {
                    jsc: {
                      parser: {
                        syntax: 'ecmascript',
                        jsx: true,
                      },
                      transform: {
                        react: {
                          runtime: 'automatic',
                          development: !isProd,
                          refresh: !isProd,
                        },
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      },
    },
  }
})
