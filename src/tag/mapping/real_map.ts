import { defineMappingTag } from '../../tag.ts'
import { isPlainObject } from '../../common/object.ts'

type RealMapping = Map<unknown, unknown>

// A mapping represented as a real `Map`: keys keep their constructed type,
// nothing is stringified. Drop-in replacement for the default `!!map` tag
// (same tag name) — `CORE_SCHEMA.withTags(realMapTag)`.
/** @category Tags */
const realMapTag = defineMappingTag('tag:yaml.org,2002:map', {
  create: () => new Map<unknown, unknown>(),
  addPair: (container: RealMapping, key, value) => {
    container.set(key, value)
    return ''
  },
  has: (container: RealMapping, key) => container.has(key),
  keys: (container: RealMapping) => container.keys(),
  get: (container: RealMapping, key) => container.get(key),
  // Dump side: handle both a real `Map` and a plain object, so this tag fully
  // replaces the default map representation when dumping too.
  identify: (data) => data instanceof Map || isPlainObject(data),
  // Dump side: the canonical mapping form is a `Map`. A real `Map` passes
  // through untouched (keys keep their type); a plain object is wrapped
  // shallowly. Lossless — nothing is stringified.
  represent: (data) => {
    if (data instanceof Map) return data
    const map = new Map<unknown, unknown>()
    const obj = data as Record<string, unknown>
    for (const key of Object.keys(obj)) map.set(key, obj[key])
    return map
  }
})

export { realMapTag }
