import { defineSequenceTag } from '../../tag.ts'

type Pair = [unknown, unknown]

/**
 * Provided only for YAML 1.1 compatibility and supported by the loader only.
 * JavaScript has no dedicated class to represent this type, so it cannot be
 * identified and dumped.
 *
 * ```yaml
 * !!pairs
 *   - one: 1
 *   - two: 2
 * ```
 *
 * is loaded as
 *
 * ```javascript
 * [
 *   ['one', 1],
 *   ['two', 2]
 * ]
 * ```
 *
 * @category Tags
 */
const pairsTag = defineSequenceTag('tag:yaml.org,2002:pairs', {
  create: () => [] as Pair[],
  addItem: (container, item) => {
    if (item instanceof Map) {
      if (item.size !== 1) return 'cannot resolve a pairs item'

      container.push(item.entries().next().value!)
      return ''
    }

    if (Object.prototype.toString.call(item) !== '[object Object]') {
      return 'cannot resolve a pairs item'
    }

    const object = item as Record<string, unknown>
    const keys = Object.keys(object)

    if (keys.length !== 1) return 'cannot resolve a pairs item'

    container.push([keys[0], object[keys[0]]] satisfies Pair)
    return ''
  }
})

export { pairsTag }
