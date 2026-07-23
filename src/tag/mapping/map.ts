import { defineMappingTag } from '../../tag.ts'
import { isPlainObject } from '../../common/object.ts'

type StringMapping = Record<string, unknown>

const mapTag = defineMappingTag('tag:yaml.org,2002:map', {
  create: (): StringMapping => ({}),
  identify: isPlainObject,
  // Dump side: wrap the plain object into the canonical `Map` form the writer
  // walks. Shallow — keys/values stay references to the originals.
  represent: (o: StringMapping) => {
    const map = new Map<string, unknown>()
    for (const key of Object.keys(o)) map.set(key, o[key])
    return map
  },
  addPair: (container, key, value) => {
    if (key !== null && typeof key === 'object') {
      return 'object-based map does not support complex keys'
    }
    const normalizedKey = String(key)
    if (normalizedKey === '__proto__') {
      // Define as an own data property so a literal `__proto__` key stays data
      // and never invokes the prototype setter.
      Object.defineProperty(container, normalizedKey, {
        value, enumerable: true, configurable: true, writable: true
      })
    } else {
      container[normalizedKey] = value
    }
    return ''
  },
  // hasOwn, not `in`: a plain object inherits `toString` and friends.
  has: (container, key) => {
    if (key !== null && typeof key === 'object') return false
    return Object.prototype.hasOwnProperty.call(container, String(key))
  },
  keys: (container) => Object.keys(container),
  get: (container, key) => container[String(key)],
  normalizeKey: (key) => (key !== null && typeof key === 'object' ? key : String(key))
})

export { mapTag, isPlainObject, type StringMapping }
