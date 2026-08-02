import { defineSequenceTag } from '../../tag.ts'
import { isPlainObject } from '../../common/object.ts'

interface OmapCarrier {
  list: unknown[]
  seen: Set<unknown>
}

/** @category Tags */
const omapTag = defineSequenceTag('tag:yaml.org,2002:omap', {
  create: (): OmapCarrier => ({ list: [], seen: new Set() }),
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
  finalize: (carrier): unknown[] => carrier.list
})

export { omapTag }
