import { describe, it } from 'node:test'
import { load, YAMLException, YAML11_SCHEMA } from 'js-yaml'

function assertYamlException (fn, pattern) {
  try {
    fn()
  } catch (error) {
    if (!(error instanceof YAMLException)) {
      throw new Error(`expected YAMLException, got ${error.name}`)
    }
    if (pattern && !pattern.test(error.message)) {
      throw new Error(`expected ${error.message} to match ${pattern}`)
    }
    return
  }

  throw new Error('expected YAMLException')
}

function createMergeChain (count) {
  const lines = ['a0: &a0 { k0: 0 }']

  for (let i = 1; i < count; i++) {
    lines.push(`a${i}: &a${i} { <<: *a${i - 1}, k${i}: ${i} }`)
  }

  lines.push(`b: *a${count - 1}`)
  return `${lines.join('\n')}\n`
}

describe('Pathological tests', () => {
  describe('Deep nesting', () => {
    it('throws YAMLException on deep array nesting (not stack overflow error)', () => {
      assertYamlException(() => { load('['.repeat(100000)) },
        /nesting exceeded maxDepth/)
    })

    it('throws YAMLException on deep object nesting (not stack overflow error)', () => {
      assertYamlException(() => { load('{a: '.repeat(100000)) },
        /nesting exceeded maxDepth/)
    })
  })

  describe('Flow collection pairs', () => {
    it('throws YAMLException on nested flow pairs without reparsing keys exponentially', () => {
      assertYamlException(() => {
        load('[ '.repeat(40) + '1' + ' ]: 0'.repeat(40))
      }, /object-based map does not support complex keys/)
    })
  })

  describe('Merge aliases', () => {
    it('throws YAMLException when merge chain exceeds maxTotalMergeKeys', () => {
      assertYamlException(() => {
        load(createMergeChain(100000), { schema: YAML11_SCHEMA })
      }, /merge keys exceeded maxTotalMergeKeys/)
    })
  })
})
