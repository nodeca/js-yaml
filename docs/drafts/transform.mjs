import assert from 'node:assert/strict'
import { dump, visit } from 'js-yaml'

const input = {
  a: [1, 2],
  b: { c: [3, 4] }
}

// Example of AST transformation. Here we force all sequences to flow mode.
// Mappings stay blocks.
const actual = dump(input, {
  transform: documents => {
    visit(documents, node => {
      if (node.kind === 'sequence') node.style.flow = true
    })
  }
})

const expected = `a: [1, 2]
b:
  c: [3, 4]
`

assert.strictEqual(actual, expected)
