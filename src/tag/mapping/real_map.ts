import { defineMappingTag } from '../../tag.ts'
import { isPlainObject } from '../../common/object.ts'

/**
 * Recommended when non-string keys are actually needed. It uses native
 * JavaScript `Map` objects, so keys keep their constructed types instead of
 * being converted to strings.
 *
 * It is not the default to avoid widespread breaking changes in existing
 * projects. `Map` has a different access API and does not pass deep equality
 * checks against `{}`-based fixtures. Alongside the other changes in v5,
 * making it the default was considered too disruptive.
 *
 * If these differences are acceptable for your project, we recommend using
 * {@link realMapTag} to guarantee the absence of problems and side effects.
 *
 * @example
 * Enable {@link realMapTag}:
 *
 * ```javascript
 * import { load, CORE_SCHEMA, realMapTag } from 'js-yaml'
 *
 * try {
 *   load(data, { schema: CORE_SCHEMA.withTags(realMapTag) })
 * } catch (e) {
 *   console.error(e)
 * }
 * ```
 *
 * @category Tags
 */
const realMapTag = defineMappingTag('tag:yaml.org,2002:map', {
  create: () => new Map<unknown, unknown>(),
  addPair: (container: Map<unknown, unknown>, key, value) => {
    container.set(key, value)
    return ''
  },
  has: (container: Map<unknown, unknown>, key) => container.has(key),
  keys: (container: Map<unknown, unknown>) => container.keys(),
  get: (container: Map<unknown, unknown>, key) => container.get(key),
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
