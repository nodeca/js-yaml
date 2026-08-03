import { defineMappingTag } from '../../tag.ts'
import { isPlainObject } from '../../common/object.ts'

type StringMapping = Record<string, unknown>

/**
 * This is the default mapping implementation. It uses `{}` objects and has only
 * partial functionality due to language limitations. This choice was made
 * because users expect to get JavaScript objects, and it was left unchanged to
 * avoid too many breaking changes in the v5 release.
 *
 * Side effects:
 *
 * - `Object.hasOwn()` checks or `for...of` loops are required for safe use (to
 *   avoid falling through to prototypes).
 * - Only scalar string keys are supported properly.
 * - Other scalar keys, such as `null` and numbers, are converted to strings.
 *   This is historical behaviour, and it can cause side effects such as
 *   problems with `!!merge`.
 *
 * Note that non-string scalar keys may be deprecated in future versions.
 *
 * Ideally, use {@link realMapTag} instead.
 *
 * @category Tags
 */
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
  get: (container, key) => {
    const normalizedKey = String(key)
    // key is from `keys()` only. Strong check is not needed, but leave for sure.
    if (!Object.prototype.hasOwnProperty.call(container, normalizedKey)) return null
    return container[normalizedKey]
  }
})

export { mapTag, isPlainObject, type StringMapping }
