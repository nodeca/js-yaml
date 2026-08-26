import {
  EVENT_ID,
  SCALAR_STYLE,
  type Event,
  type TagHandlers,
  type MappingEvent,
  type ScalarEvent,
  type SequenceEvent
} from './events.ts'
import { getScalarValue } from './parser_scalar.ts'
import { CORE_SCHEMA, type Schema } from '../schema.ts'
import {
  NOT_RESOLVED,
  type MappingTagDefinition,
  type ScalarTagDefinition,
  type SequenceTagDefinition
} from '../tag.ts'
import { YAMLException } from '../common/exception.ts'
import { tagNameFull } from '../common/tagname.ts'

const NO_RANGE = -1

const MERGE_TAG_NAME = 'tag:yaml.org,2002:merge'

interface DocumentFrame {
  kind: 'document'
  position: number
  value: unknown
  hasValue: boolean
}

interface SequenceFrame {
  kind: 'sequence'
  position: number
  value: any
  tag: SequenceTagDefinition<any, any>
  anchor: Anchor | null
  index: number
}

interface MappingFrame {
  kind: 'mapping'
  position: number
  value: any
  tag: MappingTagDefinition<any, any>
  anchor: Anchor | null
  key: unknown
  keyPosition: number
  hasKey: boolean
  // The key slot drops its tag, but `<<` is recognized by tag, not by value.
  keyIsMerge: boolean
  // Keys brought in by a merge that an explicit pair is still allowed to
  // override. Lazily allocated: stays null for mappings without `<<`.
  overridable: Set<unknown> | null
}

type Frame = DocumentFrame | SequenceFrame | MappingFrame

type AnyTag = ScalarTagDefinition | SequenceTagDefinition<any, any> | MappingTagDefinition<any, any>

interface ValueAndTag {
  value: unknown
  tag: AnyTag
}

interface Anchor {
  value: unknown
  tag: AnyTag
  isValueFinal: boolean
}

/** @category Events */
interface ConstructorOptions {
  /** Source text referenced by offsets in `events`. */
  source: string
  filename?: string

  /**
   * Schema to use.
   *
   * @defaultValue {@link CORE_SCHEMA}
   */
  schema?: Schema

  /**
   * Enables compatibility with `JSON.parse` behavior. Duplicate keys in a
   * mapping override values instead of throwing an error.
   *
   * @defaultValue `false`
   */
  json?: boolean

  /**
   * Maximum total number of keys processed by merge (`<<`) across one load
   * call. Each member of a merge sequence also counts as one key. Set to `-1`
   * to disable the limit.
   *
   * @defaultValue `10000`
   */
  maxTotalMergeKeys?: number

  /**
   * Maximum number of alias nodes (`*ref`) per document. Set to `0` to reject
   * all aliases, or to `-1` for no limit.
   *
   * @defaultValue `-1`
   */
  maxAliases?: number
}

// `source` is input data, not config — so it has no default here.
const DEFAULT_CONSTRUCTOR_OPTIONS: Required<Omit<ConstructorOptions, 'source'>> = {
  filename: '',
  schema: CORE_SCHEMA,
  json: false,
  maxTotalMergeKeys: 10000,
  maxAliases: -1
}

interface ConstructorState extends Required<ConstructorOptions> {
  events: Event[]
  documents: unknown[]
  eventIndex: number
  position: number
  frames: Frame[]
  anchors: Map<string, Anchor>
  // Mapping tag each sequence element was built with, keyed by the element
  // itself. Needed by `<<` merge, which sees only the finished element values.
  nodeTags: Map<unknown, MappingTagDefinition<any, any>>
  tagHandlers: TagHandlers
  totalMergeKeys: number
  aliasCount: number
}

function eventPosition (event: Event) {
  if ('tagStart' in event && event.tagStart !== NO_RANGE) return event.tagStart
  if ('anchorStart' in event && event.anchorStart !== NO_RANGE) return event.anchorStart
  if ('valueStart' in event && event.valueStart !== NO_RANGE) return event.valueStart
  if ('start' in event) return event.start
  return 0
}

function throwError (state: ConstructorState, message: string): never {
  YAMLException.throwAt(state.source, state.position, message, state.filename)
}

function finalizeCollection (
  state: ConstructorState,
  position: number,
  tag: SequenceTagDefinition<any, any> | MappingTagDefinition<any, any>,
  carrier: unknown
) {
  try {
    return tag.finalize(carrier)
  } catch (error) {
    if (error instanceof YAMLException) throw error
    YAMLException.throwAt(
      state.source,
      position,
      error instanceof Error ? error.message : String(error),
      state.filename
    )
  }
}

function constructScalar (
  state: ConstructorState,
  event: ScalarEvent
): ValueAndTag {
  const source = getScalarValue(state.source, event)
  const rawTag = event.tagStart === NO_RANGE
    ? ''
    : state.source.slice(event.tagStart, event.tagEnd)
  const strTag = state.schema.defaultScalarTag

  if (rawTag !== '') {
    if (rawTag === '!') return { value: source, tag: strTag }

    const tagName = tagNameFull(rawTag, state.tagHandlers)
    const scalarTag = state.schema.lookupScalarTag(tagName)

    if (scalarTag) {
      const result = scalarTag.resolve(source, true, tagName)

      if (result === NOT_RESOLVED) {
        throwError(state, `cannot resolve a node with !<${tagName}> explicit tag`)
      }

      return { value: result, tag: scalarTag }
    }

    // An empty node carrying a collection tag (e.g. `!!map`, `!!seq`) is emitted
    // by the parser as a scalar event, since there is no collection syntax to key
    // off. Resolve it here by the explicit tag's kind into an empty collection.
    const collectionTagDef =
      state.schema.lookupMappingTag(tagName) ??
      state.schema.lookupSequenceTag(tagName)

    if (collectionTagDef) {
      if (source !== '') {
        throwError(state, `cannot resolve a node with !<${tagName}> explicit tag`)
      }

      const carrier = collectionTagDef.create(tagName)
      const value = collectionTagDef.carrierIsResult
        ? carrier
        : finalizeCollection(state, state.position, collectionTagDef, carrier)
      return { value, tag: collectionTagDef }
    }

    throwError(state, `unknown scalar tag !<${tagName}>`)
  }

  if (event.style === SCALAR_STYLE.PLAIN) {
    return state.schema.resolveImplicitScalarTag(source)
  }

  return { value: strTag.resolve(source, false, strTag.tagName), tag: strTag }
}

function collectionTagName (
  state: ConstructorState,
  event: SequenceEvent | MappingEvent,
  defaultTagName: string
) {
  const rawTag = event.tagStart === NO_RANGE
    ? ''
    : state.source.slice(event.tagStart, event.tagEnd)
  const tagName = rawTag === '' || rawTag === '!'
    ? defaultTagName
    : tagNameFull(rawTag, state.tagHandlers)

  return tagName
}

// A merge source must be a mapping; every mapping tag exposes the read side.
function isMappingTag (tag: AnyTag): tag is MappingTagDefinition<any, any> {
  return tag.nodeKind === 'mapping'
}

function chargeMergeWork (state: ConstructorState) {
  state.totalMergeKeys++

  if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) {
    throwError(state, `merge keys exceeded maxTotalMergeKeys (${state.maxTotalMergeKeys})`)
  }
}

// Fold the keys of one mapping source into the target frame, honoring merge
// precedence: an already-present key (explicit or from an earlier source) wins.
function mergeKeys (state: ConstructorState, frame: MappingFrame, source: unknown, sourceTag: MappingTagDefinition<any, any>) {
  // Count the source mapping itself to bound sequences of empty mappings.
  chargeMergeWork(state)

  for (const sourceKey of sourceTag.keys(source)) {
    chargeMergeWork(state)

    if (frame.tag.has(frame.value, sourceKey)) continue

    const err = frame.tag.addPair(frame.value, sourceKey, sourceTag.get(source, sourceKey))
    if (err) throwError(state, err)

    frame.overridable ??= new Set()
    frame.overridable.add(sourceKey)
  }
}

// The value of a `<<` key: either a mapping (fold its keys) or a sequence of
// mappings (fold each). Sequence elements arrive as bare values, so the tag each
// was built with comes from `nodeTags`; a miss means it is not a mapping (a
// scalar, a nested sequence, or a value some sequence tag synthesized itself).
function mergeSource (state: ConstructorState, frame: MappingFrame, source: unknown, sourceTag: AnyTag) {
  state.position = frame.keyPosition

  if (isMappingTag(sourceTag)) {
    mergeKeys(state, frame, source, sourceTag)
  } else if (sourceTag.nodeKind === 'sequence' && Array.isArray(source)) {
    // The current merge budget is sufficient; this hard cap only further limits
    // the attack vector, so there is no reason to expose it as a public option.
    if (source.length > 100) {
      throwError(state, 'abnormal merge sequence size')
    }

    for (const element of source) {
      const elementTag = state.nodeTags.get(element)
      if (!elementTag) {
        throwError(state, 'cannot merge mappings; the provided source object is unacceptable')
      }
      mergeKeys(state, frame, element, elementTag)
    }
  } else {
    throwError(state, 'cannot merge mappings; the provided source object is unacceptable')
  }
}

function addMappingValue (state: ConstructorState, frame: MappingFrame, key: unknown, value: unknown, tag: AnyTag) {
  state.position = frame.keyPosition

  // `<<` is intercepted before dedup, so a repeated merge key is allowed.
  if (frame.keyIsMerge) {
    mergeSource(state, frame, value, tag)
    return
  }

  if (!state.json && frame.tag.has(frame.value, key) && !frame.overridable?.has(key)) {
    throwError(state, 'duplicated mapping key')
  }

  const err = frame.tag.addPair(frame.value, key, value)
  if (err) throwError(state, err)
  frame.overridable?.delete(key)
}

function addValue (state: ConstructorState, value: unknown, tag: AnyTag) {
  const frame = state.frames[state.frames.length - 1]!

  if (frame.kind === 'document') {
    frame.value = value
    frame.hasValue = true
  } else if (frame.kind === 'sequence') {
    // Any element may later be folded in by a `<<` merge, which by then has no
    // way to tell what built it.
    if (isMappingTag(tag)) state.nodeTags.set(value, tag)
    const err = frame.tag.addItem(frame.value, value, frame.index++)
    if (err) throwError(state, err)
  } else if (frame.hasKey) {
    const key = frame.key
    frame.key = undefined
    frame.hasKey = false
    addMappingValue(state, frame, key, value, tag)
  } else {
    frame.key = value
    frame.keyPosition = state.position
    frame.hasKey = true
    frame.keyIsMerge = tag.tagName === MERGE_TAG_NAME
  }
}

function storeAnchor (
  state: ConstructorState,
  event: ScalarEvent | SequenceEvent | MappingEvent,
  value: unknown,
  tag: AnyTag,
  isValueFinal: boolean
): Anchor | null {
  if (event.anchorStart !== NO_RANGE) {
    const anchor = {
      value,
      tag,
      isValueFinal
    }
    state.anchors.set(state.source.slice(event.anchorStart, event.anchorEnd), anchor)
    return anchor
  }

  return null
}

/**
 * Constructs JavaScript documents directly from parser events, without an
 * intermediate AST.
 *
 * @category Events
 */
function constructFromEvents (events: Event[], options: ConstructorOptions): unknown[] {
  const state: ConstructorState = {
    ...DEFAULT_CONSTRUCTOR_OPTIONS,
    ...options,
    events,
    documents: [],
    eventIndex: 0,
    position: 0,
    frames: [],
    anchors: new Map(),
    nodeTags: new Map(),
    tagHandlers: Object.create(null),
    totalMergeKeys: 0,
    aliasCount: 0
  }

  while (state.eventIndex < state.events.length) {
    const event = state.events[state.eventIndex++]
    state.position = eventPosition(event)

    switch (event.type) {
      case EVENT_ID.DOCUMENT:
        state.anchors = new Map()
        state.nodeTags = new Map()
        state.aliasCount = 0
        state.tagHandlers = Object.create(null)
        for (const directive of event.directives) {
          if (directive.kind === 'tag') state.tagHandlers[directive.handle] = directive.prefix
        }
        state.frames.push({ kind: 'document', position: state.position, value: undefined, hasValue: false })
        break

      case EVENT_ID.SCALAR: {
        const { value, tag } = constructScalar(state, event)
        storeAnchor(state, event, value, tag, true)
        addValue(state, value, tag)
        break
      }

      case EVENT_ID.SEQUENCE: {
        const tagName = collectionTagName(state, event, 'tag:yaml.org,2002:seq')
        const tag = state.schema.lookupSequenceTag(tagName)
        if (!tag) throwError(state, `unknown sequence tag !<${tagName}>`)

        const value = tag.create(tagName)
        const anchor = storeAnchor(state, event, value, tag, tag.carrierIsResult)

        state.frames.push({
          kind: 'sequence', position: state.position, value, tag, anchor, index: 0
        })
        break
      }

      case EVENT_ID.MAPPING: {
        const tagName = collectionTagName(state, event, 'tag:yaml.org,2002:map')
        const tag = state.schema.lookupMappingTag(tagName)
        if (!tag) throwError(state, `unknown mapping tag !<${tagName}>`)

        const value = tag.create(tagName)
        const anchor = storeAnchor(state, event, value, tag, tag.carrierIsResult)
        state.frames.push({
          kind: 'mapping',
          position: state.position,
          value,
          tag,
          anchor,
          key: undefined,
          keyPosition: state.position,
          hasKey: false,
          keyIsMerge: false,
          overridable: null
        })
        break
      }

      case EVENT_ID.ALIAS: {
        if (state.maxAliases !== -1 && ++state.aliasCount > state.maxAliases) {
          throwError(state, `aliases exceeded maxAliases (${state.maxAliases})`)
        }

        const name = state.source.slice(event.anchorStart, event.anchorEnd)
        const anchor = state.anchors.get(name)
        if (!anchor) {
          throwError(state, `unidentified alias "${name}"`)
        }
        if (!anchor.isValueFinal) {
          throwError(state, `recursive alias "${name}" is not supported for tag ${anchor.tag.tagName} because it uses finalize()`)
        }
        addValue(state, anchor.value, anchor.tag)
        break
      }

      case EVENT_ID.POP: {
        const frame = state.frames.pop()!

        if (frame.kind === 'mapping' && frame.hasKey) {
          state.position = frame.keyPosition
          throwError(state, 'incomplete mapping pair in event stream')
        }

        if (frame.kind === 'document') {
          state.documents.push(frame.value)
        } else {
          const value = frame.tag.carrierIsResult
            ? frame.value
            : finalizeCollection(state, frame.position, frame.tag, frame.value)
          if (frame.anchor) {
            frame.anchor.value = value
            frame.anchor.isValueFinal = true
          }
          addValue(state, value, frame.tag)
        }
        break
      }
    }
  }

  return state.documents
}

export {
  constructFromEvents,
  DEFAULT_CONSTRUCTOR_OPTIONS,
  type ConstructorOptions
}
