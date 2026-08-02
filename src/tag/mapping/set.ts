import { defineMappingTag } from '../../tag.ts'

/** @category Tags */
const setTag = defineMappingTag('tag:yaml.org,2002:set', {
  create: () => new Set<unknown>(),
  identify: (data) => data instanceof Set,
  represent: (data: Set<unknown>) => {
    const map = new Map<unknown, null>()
    for (const key of data) map.set(key, null)
    return map
  },
  addPair: (container, key, value) => {
    if (value !== null) return 'cannot resolve a set item'
    container.add(key)
    return ''
  },
  has: (container, key) => container.has(key),
  keys: (container) => container.keys(),
  get: () => null
})

export { setTag }
