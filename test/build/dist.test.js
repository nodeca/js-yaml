'use strict'

const { describe, it } = require('node:test')

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const distDir = path.resolve(__dirname, '../../dist')

const expectedKeys = [
  'CORE_SCHEMA',
  'DEFAULT_SCHEMA',
  'FAILSAFE_SCHEMA',
  'JSON_SCHEMA',
  'Schema',
  'Type',
  'YAMLException',
  'default',
  'dump',
  'load',
  'loadAll',
  'safeDump',
  'safeLoad',
  'safeLoadAll',
  'types'
]

function checkExports (yaml, options) {
  assert.deepStrictEqual(Object.keys(yaml).sort(), expectedKeys.slice().sort())
  assert.strictEqual(yaml.default.load, yaml.load)
  assert.strictEqual(yaml.load('a: 1').a, 1)
  assert.strictEqual(typeof yaml.dump, 'function')
  assert.strictEqual(typeof yaml.types.binary, 'object')

  if (options && options.checkEsModule) {
    assert.strictEqual(yaml.__esModule, true)
  }
}

function loadGlobal (filename) {
  const context = {}

  vm.runInNewContext(fs.readFileSync(path.join(distDir, filename), 'utf8'), context)

  return context.jsyaml
}

function assertEs5Bundle (filename) {
  const code = fs.readFileSync(path.join(distDir, filename), 'utf8')

  assert.doesNotMatch(code, /\bconst\b/)
  assert.doesNotMatch(code, /\blet\b/)
  assert.doesNotMatch(code, /=>/)
  assert.doesNotMatch(code, /\bclass\b/)
  assert.doesNotMatch(code, /`/)
  assert.doesNotMatch(code, /Symbol\.toStringTag/)
}

describe('dist build', function () {
  it('keeps Vite proxy exports in sync with the CommonJS entry', async function () {
    const yaml = require('../../index.js')
    const proxy = await import('../../lib/index_vite_proxy.tmp.mjs')

    assert.deepStrictEqual(Object.keys(proxy).sort(), Object.keys(yaml).concat('default').sort())
    assert.strictEqual(proxy.default, yaml)

    Object.keys(yaml).forEach(function (key) {
      assert.strictEqual(proxy[key], yaml[key])
    })
  })

  it('exports the expected UMD API from js-yaml.js', function () {
    checkExports(require('../../dist/js-yaml.js'), { checkEsModule: true })
  })

  it('exports the expected UMD API from js-yaml.min.js', function () {
    checkExports(require('../../dist/js-yaml.min.js'), { checkEsModule: true })
  })

  it('builds ES5-compatible UMD bundles', function () {
    assertEs5Bundle('js-yaml.js')
    assertEs5Bundle('js-yaml.min.js')
  })

  it('exports the expected ESM API from js-yaml.mjs', async function () {
    checkExports(await import('../../dist/js-yaml.mjs'))
  })

  it('exposes the expected browser global from js-yaml.js', function () {
    checkExports(loadGlobal('js-yaml.js'))
  })

  it('exposes the expected browser global from js-yaml.min.js', function () {
    checkExports(loadGlobal('js-yaml.min.js'))
  })
})
