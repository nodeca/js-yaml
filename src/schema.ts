import {
  NOT_RESOLVED,
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

/** @category Schemas */
class Schema {
  readonly tags: readonly TagDefinition[]
  /** @internal */
  readonly implicitScalarTags: readonly ScalarTagDefinition[]

  /**
   * Dispatch implicit scalar resolvers by `source.charAt(0)`. Each bucket holds
   * the resolvers that may match that key, in schema order; a key absent from
   * the map uses
   * {@link Schema.implicitScalarAnyFirstChar}
   * (resolvers that declared no first-char constraint, so they apply to any
   * first character).
   */
  private readonly implicitScalarByFirstChar: ReadonlyMap<string, readonly ScalarTagDefinition[]>
  private readonly implicitScalarAnyFirstChar: readonly ScalarTagDefinition[]

  /**
   * The default scalar tag (`!!str`), resolved once so the composer's fallback
   * for unresolved plain scalars avoids a keyed lookup per scalar.
   *
   * @internal
   */
  readonly defaultScalarTag: ScalarTagDefinition

  /**
   * The default container tags (`!!seq` / `!!map`), used by the dumper: when a
   * value is identified by its default tag, the tag is implicit and not
   * printed. Undefined if the schema does not define them (then such values
   * can't be dumped).
   *
   * @internal
   */
  readonly defaultSequenceTag: SequenceTagDefinition | undefined
  /** @internal */
  readonly defaultMappingTag: MappingTagDefinition | undefined
  private readonly exact: TagDefinitionMap
  private readonly prefix: TagDefinitionListMap

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

  /** @internal */
  lookupScalarTag (tagName: string): ScalarTagDefinition | undefined {
    const exactTag = this.exact.scalar[tagName]
    if (exactTag) return exactTag

    for (const tag of this.prefix.scalar) {
      if (tagName.startsWith(tag.tagName)) return tag
    }

    return undefined
  }

  /** @internal */
  lookupSequenceTag (tagName: string): SequenceTagDefinition | undefined {
    const exactTag = this.exact.sequence[tagName]
    if (exactTag) return exactTag

    for (const tag of this.prefix.sequence) {
      if (tagName.startsWith(tag.tagName)) return tag
    }

    return undefined
  }

  /** @internal */
  lookupMappingTag (tagName: string): MappingTagDefinition | undefined {
    const exactTag = this.exact.mapping[tagName]
    if (exactTag) return exactTag

    for (const tag of this.prefix.mapping) {
      if (tagName.startsWith(tag.tagName)) return tag
    }

    return undefined
  }

  /** @internal */
  resolveImplicitScalarTag (source: string): { value: unknown, tag: ScalarTagDefinition } {
    const candidates = this.implicitScalarByFirstChar.get(source.charAt(0)) ??
      this.implicitScalarAnyFirstChar

    for (const tag of candidates) {
      const value = tag.resolve(source, false, tag.tagName)
      if (value !== NOT_RESOLVED) return { value, tag }
    }

    const tag = this.defaultScalarTag
    return { value: tag.resolve(source, false, tag.tagName), tag }
  }

  /**
   * Creates a new schema with the specified tags added. If a tag already
   * exists, it is replaced by the specified tag.
   *
   * @example
   * Create a new schema based on {@link CORE_SCHEMA}, with {@link mergeTag}
   * added:
   *
   * ```javascript
   * import { CORE_SCHEMA, mergeTag } from 'js-yaml'
   *
   * const schema = CORE_SCHEMA.withTags(mergeTag)
   * ```
   *
   * @example
   * Create a new schema based on {@link CORE_SCHEMA}, with {@link mapTag}
   * replaced by {@link realMapTag}:
   *
   * ```javascript
   * import { CORE_SCHEMA, realMapTag } from 'js-yaml'
   *
   * const schema = CORE_SCHEMA.withTags(realMapTag)
   * ```
   */
  withTags (...tags: Array<TagDefinition | readonly TagDefinition[]>): Schema {
    let flatTags: TagDefinition[] = []
    for (const tag of tags) flatTags = flatTags.concat(tag)

    return new Schema([...this.tags, ...flatTags])
  }
}

/** @category Schemas */
const FAILSAFE_SCHEMA = new Schema([
  strTag,
  seqTag,
  mapTag
])

/** @category Schemas */
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
 * try {
 *   load(data, { schema: CORE_SCHEMA.withTags(mergeTag) })
 * } catch (e) {
 *   console.error(e)
 * }
 * ```
 *
 * @category Schemas
 */
const CORE_SCHEMA = new Schema([
  ...FAILSAFE_SCHEMA.tags,
  nullCoreTag,
  boolCoreTag,
  intCoreTag,
  floatCoreTag
])

/** @category Schemas */
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

/**
 * The dumper schema for maximum compatibility. It combines all supported type
 * variants from YAML 1.1 and YAML 1.2 so strings matching any of them are
 * quoted. This makes the generated YAML more compatible with other parsers.
 *
 * The schema is based on YAML 1.1, but extends `!!int` and `!!float` to accept
 * both YAML 1.1 and Core Schema forms, since Core Schema supports some forms
 * that YAML 1.1 does not.
 *
 * @category Schemas
 */
const DUMP_SCHEMA = YAML11_SCHEMA.withTags(
  {
    ...intYaml11Tag,
    resolve: (source, isExplicit, tagName) => {
      const result = intYaml11Tag.resolve(source, isExplicit, tagName)
      return result === NOT_RESOLVED ? intCoreTag.resolve(source, isExplicit, tagName) : result
    }
  },
  {
    ...floatYaml11Tag,
    resolve: (source, isExplicit, tagName) => {
      const result = floatYaml11Tag.resolve(source, isExplicit, tagName)
      return result === NOT_RESOLVED ? floatCoreTag.resolve(source, isExplicit, tagName) : result
    }
  }
)

export {
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  YAML11_SCHEMA,
  DUMP_SCHEMA
}
