import { defineSequenceTag } from '../../tag.ts'
import { isPlainObject } from '../../common/object.ts'

/**
 * Provided only for YAML 1.1 compatibility and supported by the loader only.
 * JavaScript has no dedicated class to represent this type, so it cannot be
 * identified and dumped.
 *
 * ```yaml
 * !!omap
 *   - one: 1
 *   - two: 2
 * ```
 *
 * is loaded as
 *
 * ```javascript
 * [
 *   { one: 1 },
 *   { two: 2 }
 * ]
 * ```
 *
 * @category Tags
 */
const omapTag = defineSequenceTag('tag:yaml.org,2002:omap', {
  create: (): { list: unknown[]; seen: Set<unknown> } => ({ list: [], seen: new Set() }),
  addItem: (carrier, item) => {
    let key: unknown

    if (item instanceof Map) {
      if (item.size !== 1) return 'cannot resolve an ordered map item'
      key = item.keys().next().value
    } else if (isPlainObject(item)) {
      const itemKeys = Object.keys(item as Record<string, unknown>)
      if (itemKeys.length !== 1) return 'cannot resolve an ordered map item'
      key = itemKeys[0]
    } else {
      return 'cannot resolve an ordered map item'
    }

    if (carrier.seen.has(key)) return 'duplicate key in ordered map'
    carrier.seen.add(key)
    carrier.list.push(item)
    return ''
  },
  finalize: (carrier): unknown[] => carrier.list,
  identify: () => false
})

export { omapTag }
