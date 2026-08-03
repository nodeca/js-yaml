import {
  type MappingTagDefinition,
  type ScalarTagDefinition,
  type SequenceTagDefinition,
  type TagDefinition
} from './tag.ts'
import { strTag } from './tag/scalar/str.ts'
import { nullCoreTag } from './tag/scalar/null_core.ts'
import { nullJsonTag } from './tag/scalar/null_json.ts'
import { nullYaml11Tag } from './tag/scalar/null_yaml11.ts'
import { boolCoreTag } from './tag/scalar/bool_core.ts'
import { boolJsonTag } from './tag/scalar/bool_json.ts'
import { boolYaml11Tag } from './tag/scalar/bool_yaml11.ts'
import { intCoreTag } from './tag/scalar/int_core.ts'
import { intJsonTag } from './tag/scalar/int_json.ts'
import { intYaml11Tag } from './tag/scalar/int_yaml11.ts'
import { floatCoreTag } from './tag/scalar/float_core.ts'
import { floatJsonTag } from './tag/scalar/float_json.ts'
import { floatYaml11Tag } from './tag/scalar/float_yaml11.ts'
import { mergeTag } from './tag/scalar/merge.ts'
import { binaryTag } from './tag/scalar/binary.ts'
import { timestampTag } from './tag/scalar/timestamp.ts'
import { seqTag } from './tag/sequence/seq.ts'
import { omapTag } from './tag/sequence/omap.ts'
import { pairsTag } from './tag/sequence/pairs.ts'
import { mapTag } from './tag/mapping/map.ts'
import { setTag } from './tag/mapping/set.ts'

interface TagDefinitionMap {
  scalar: Record<string, ScalarTagDefinition>
  sequence: Record<string, SequenceTagDefinition>
  mapping: Record<string, MappingTagDefinition>
}

interface TagDefinitionListMap {
  scalar: ScalarTagDefinition[]
  sequence: SequenceTagDefinition[]
  mapping: MappingTagDefinition[]
}

function createTagDefinitionMap (): TagDefinitionMap {
  return {
    scalar: Object.create(null),
    sequence: Object.create(null),
    mapping: Object.create(null)
  }
}

function createTagDefinitionListMap (): TagDefinitionListMap {
  return {
    scalar: [],
    sequence: [],
    mapping: []
  }
}

function compileTags (tags: readonly TagDefinition[]) {
  const result: TagDefinition[] = []

  for (const tag of tags) {
    let index = result.length

    for (let previousIndex = 0; previousIndex < result.length; previousIndex++) {
      const previous = result[previousIndex]

      if (previous.nodeKind === tag.nodeKind &&
          previous.tagName === tag.tagName &&
          previous.matchByTagPrefix === tag.matchByTagPrefix) {
        index = previousIndex
        break
      }
    }

    result[index] = tag
  }

  return result
}

/** @category Schema */
class Schema {
  readonly tags: readonly TagDefinition[]
  readonly implicitScalarTags: readonly ScalarTagDefinition[]

  /**
   * Dispatch implicit scalar resolvers by `source.charAt(0)`. Each bucket holds
   * the resolvers that may match that key, in schema order; a key absent from
   * the map uses
   * {@link Schema.implicitScalarAnyFirstChar}
   * (resolvers that declared no first-char constraint, so they apply to any
   * first character).
   */
  readonly implicitScalarByFirstChar: ReadonlyMap<string, readonly ScalarTagDefinition[]>
  readonly implicitScalarAnyFirstChar: readonly ScalarTagDefinition[]

  /**
   * The default scalar tag (`!!str`), resolved once so the composer's fallback
   * for unresolved plain scalars avoids a keyed lookup per scalar.
   */
  readonly defaultScalarTag: ScalarTagDefinition

  /**
   * The default container tags (`!!seq` / `!!map`), used by the dumper: when a
   * value is identified by its default tag, the tag is implicit and not
   * printed. Undefined if the schema does not define them (then such values
   * can't be dumped).
   */
  readonly defaultSequenceTag: SequenceTagDefinition | undefined
  readonly defaultMappingTag: MappingTagDefinition | undefined
  readonly exact: TagDefinitionMap
  readonly prefix: TagDefinitionListMap

  constructor (tags: readonly TagDefinition[]) {
    const compiledTags = compileTags(tags)
    const implicitScalarTags: ScalarTagDefinition[] = []
    const exact = createTagDefinitionMap()
    const prefix = createTagDefinitionListMap()

    for (const tag of compiledTags) {
      if (tag.nodeKind === 'scalar' && tag.implicit) {
        if (tag.matchByTagPrefix) {
          throw new Error('Implicit scalar tags cannot match by tag prefix')
        }

        implicitScalarTags.push(tag)
      }

      switch (tag.nodeKind) {
        case 'scalar':
          if (tag.matchByTagPrefix) prefix.scalar.push(tag)
          else exact.scalar[tag.tagName] = tag
          break
        case 'sequence':
          if (tag.matchByTagPrefix) prefix.sequence.push(tag)
          else exact.sequence[tag.tagName] = tag
          break
        case 'mapping':
          if (tag.matchByTagPrefix) prefix.mapping.push(tag)
          else exact.mapping[tag.tagName] = tag
          break
      }
    }

    const implicitScalarAnyFirstChar = implicitScalarTags.filter(tag => tag.implicitFirstChars === null)

    const keys = new Set<string>()
    for (const tag of implicitScalarTags) {
      if (tag.implicitFirstChars !== null) {
        for (const key of tag.implicitFirstChars) keys.add(key)
      }
    }

    const implicitScalarByFirstChar = new Map<string, ScalarTagDefinition[]>()
    for (const key of keys) {
      implicitScalarByFirstChar.set(key, implicitScalarTags.filter(tag =>
        tag.implicitFirstChars === null || tag.implicitFirstChars.indexOf(key) !== -1))
    }

    const defaultScalarTag = exact.scalar['tag:yaml.org,2002:str']
    if (!defaultScalarTag) throw new Error('schema does not define the default scalar tag (tag:yaml.org,2002:str)')

    this.tags = compiledTags
    this.implicitScalarTags = implicitScalarTags
    this.implicitScalarByFirstChar = implicitScalarByFirstChar
    this.implicitScalarAnyFirstChar = implicitScalarAnyFirstChar
    this.defaultScalarTag = defaultScalarTag
    this.defaultSequenceTag = exact.sequence['tag:yaml.org,2002:seq']
    this.defaultMappingTag = exact.mapping['tag:yaml.org,2002:map']
    this.exact = exact
    this.prefix = prefix
  }

  withTags (...tags: Array<TagDefinition | readonly TagDefinition[]>): Schema {
    let flatTags: TagDefinition[] = []
    for (const tag of tags) flatTags = flatTags.concat(tag)

    return new Schema([...this.tags, ...flatTags])
  }
}

/** @category Schema */
const FAILSAFE_SCHEMA = new Schema([
  strTag,
  seqTag,
  mapTag
])

/** @category Schema */
const JSON_SCHEMA = new Schema([
  ...FAILSAFE_SCHEMA.tags,
  nullJsonTag,
  boolJsonTag,
  intJsonTag,
  floatJsonTag
])

/**
 * The default schema for the loaders. Note, {@link CORE_SCHEMA} comes
 * without the `!!merge` tag. You can easily enable it if needed.
 *
 * @example
 * Enable {@link mergeTag}:
 *
 * ```javascript
 * import { load, CORE_SCHEMA, mergeTag } from 'js-yaml'
 *
 * load(data, { schema: CORE_SCHEMA.withTags(mergeTag) })
 * ```
 *
 * @category Schema
 */
const CORE_SCHEMA = new Schema([
  ...FAILSAFE_SCHEMA.tags,
  nullCoreTag,
  boolCoreTag,
  intCoreTag,
  floatCoreTag
])

/** @category Schema */
const YAML11_SCHEMA = new Schema([
  ...FAILSAFE_SCHEMA.tags,
  nullYaml11Tag,
  boolYaml11Tag,
  intYaml11Tag,
  floatYaml11Tag,
  timestampTag,
  mergeTag,
  binaryTag,
  omapTag,
  pairsTag,
  setTag
])

export {
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  YAML11_SCHEMA,

  type TagDefinitionMap,
  type TagDefinitionListMap
}
