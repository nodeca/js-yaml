'use strict'

const pairKeyNodeByMapping = new WeakMap()
const mappingsWithMultipleKeys = new WeakSet()

function setPairKeyNode (mapping, keyNode) {
  if (mappingsWithMultipleKeys.has(mapping)) return

  pairKeyNodeByMapping.set(mapping, keyNode)
}

function getPairKeyNode (mapping) {
  return pairKeyNodeByMapping.get(mapping)
}

function hasPairKeyNode (mapping) {
  return pairKeyNodeByMapping.has(mapping)
}

function markMappingWithMultipleKeys (mapping) {
  pairKeyNodeByMapping.delete(mapping)
  mappingsWithMultipleKeys.add(mapping)
}

module.exports.set = setPairKeyNode
module.exports.get = getPairKeyNode
module.exports.has = hasPairKeyNode
module.exports.markMultiple = markMappingWithMultipleKeys
