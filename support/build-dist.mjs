import { rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { transformAsync } from '@babel/core'
import presetEnv from '@babel/preset-env'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import { build } from 'vite'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')
const root = process.cwd().replace(/\\/g, '/')

const banner = `/*! ${pkg.name} ${pkg.version} https://github.com/${pkg.repository} @license ${pkg.license} */`

const commonRollupOptions = {
  external: [],
  plugins: [
    commonjs()
  ]
}

const babelEs5Plugin = {
  name: 'js-yaml-babel-es5',
  enforce: 'pre',
  async transform (code, id) {
    const filename = id.split('?')[0].replace(/\\/g, '/')

    if (filename !== root + '/index.js' && !filename.startsWith(root + '/lib/')) {
      return null
    }

    const result = await transformAsync(code, {
      babelrc: false,
      configFile: false,
      filename,
      sourceMaps: true,
      sourceType: 'unambiguous',
      presets: [
        [presetEnv, {
          modules: false,
          targets: {
            ie: '11'
          }
        }]
      ]
    })

    return {
      code: result.code,
      map: result.map
    }
  }
}

const common = {
  configFile: false,
  logLevel: 'info',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    sourcemap: true,
    target: 'es2015'
  }
}

await rm('dist', { recursive: true, force: true })

await build({
  ...common,
  plugins: [
    babelEs5Plugin
  ],
  build: {
    ...common.build,
    lib: {
      entry: 'lib/index_vite_proxy.tmp.mjs',
      name: 'jsyaml',
      formats: ['umd'],
      fileName: () => 'js-yaml.js'
    },
    rollupOptions: {
      ...commonRollupOptions,
      output: {
        banner,
        generatedCode: 'es5',
        plugins: [
          terser({
            ecma: 5,
            compress: false,
            mangle: false,
            format: {
              beautify: true,
              comments: /^!/
            }
          })
        ]
      }
    }
  }
})

await build({
  ...common,
  plugins: [
    babelEs5Plugin
  ],
  build: {
    ...common.build,
    lib: {
      entry: 'lib/index_vite_proxy.tmp.mjs',
      name: 'jsyaml',
      formats: ['umd'],
      fileName: () => 'js-yaml.min.js'
    },
    rollupOptions: {
      ...commonRollupOptions,
      output: {
        banner,
        generatedCode: 'es5',
        plugins: [
          terser({
            ecma: 5,
            compress: true,
            mangle: true,
            format: {
              comments: /^!/
            }
          })
        ]
      }
    }
  }
})

await build({
  ...common,
  build: {
    ...common.build,
    lib: {
      entry: 'lib/index_vite_proxy.tmp.mjs',
      formats: ['es'],
      fileName: () => 'js-yaml.mjs'
    },
    rollupOptions: {
      ...commonRollupOptions,
      output: {
        banner
      }
    }
  }
})
