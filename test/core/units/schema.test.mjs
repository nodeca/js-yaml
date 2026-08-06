import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Schema, defineScalarTag } from 'js-yaml'

describe('schema (coverage)', () => {
  it('rejects an implicit scalar tag that matches by tag prefix', () => {
    const badTag = defineScalarTag('!bad', {
      implicit: true,
      matchByTagPrefix: true,
      resolve: () => 'x',
      identify: () => false
    })

    assert.throws(() => new Schema([badTag]), /Implicit scalar tags cannot match by tag prefix/)
  })

  it('rejects a schema without the default scalar tag (!!str)', () => {
    assert.throws(() => new Schema([]), /schema does not define the default scalar tag/)
  })
})
