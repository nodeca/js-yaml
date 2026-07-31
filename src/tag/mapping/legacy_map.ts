import { defineMappingTag } from '../../tag.ts'
import { isPlainObject } from '../../common/object.ts'

type StringMapping = Record<string, unknown>

// Coerce a constructed key into the string identity a `{}` representation uses.
// Returns null for a nested array key (an array element that is itself an
// array), which would otherwise blow up exponentially when stringified via
// aliases.
function normalizeKey (key: unknown): string | null {
  if (Array.isArray(key)) {
    const array = Array.prototype.slice.call(key) as unknown[]

    for (let index = 0; index < array.length; index++) {
      if (Array.isArray(array[index])) return null

      if (typeof array[index] === 'object' &&
          Object.prototype.toString.call(array[index]) === '[object Object]') {
        array[index] = '[object Object]'
      }
    }

    return String(array)
  }

  if (typeof key === 'object' &&
      Object.prototype.toString.call(key) === '[object Object]') {
    return '[object Object]'
  }

  return String(key)
}

const legacyMapTag = defineMappingTag('tag:yaml.org,2002:map', {
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
    const normalizedKey = normalizeKey(key)
    if (normalizedKey === null) return 'nested arrays are not supported inside keys'
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
    const normalizedKey = normalizeKey(key)
    return normalizedKey !== null && Object.prototype.hasOwnProperty.call(container, normalizedKey)
  },
  keys: (container) => Object.keys(container),
  get: (container, key) => {
    const normalizedKey = String(key)
    // key is from `keys()` only. Strong check is not needed, but leave for sure.
    if (!Object.prototype.hasOwnProperty.call(container, normalizedKey)) return null
    return container[normalizedKey]
  }
})

export { legacyMapTag, isPlainObject, type StringMapping }
