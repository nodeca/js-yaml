import {
  EVENT_ALIAS,
  EVENT_DOCUMENT,
  EVENT_MAPPING,
  EVENT_POP,
  EVENT_SCALAR,
  EVENT_SEQUENCE,
  SCALAR_STYLE_PLAIN,
  type Event,
  type TagHandlers,
  type MappingEvent,
  type ScalarEvent,
  type SequenceEvent
} from './events.ts'
import { getScalarValue } from './parser_scalar.ts'
import { CORE_SCHEMA, type Schema } from '../schema.ts'
import {
  MERGE_KEY,
  NOT_RESOLVED,
  type MappingTagDefinition,
  type ScalarTagDefinition,
  type SequenceTagDefinition
} from '../tag.ts'
import { YAMLException, throwErrorAt } from '../common/exception.ts'
import { tagNameFull } from '../common/tagname.ts'

const NO_RANGE = -1

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
  // True when this sequence is the source list of a `<<` merge (`<<: [...]`).
  // Each element is validated as a mapping on arrival; the materialized list is
  // then delivered to the target mapping, which folds the elements in.
  merge: boolean
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

interface ConstructorOptions {
  source: string
  filename?: string
  schema?: Schema
  json?: boolean
  maxTotalMergeKeys?: number
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
  throwErrorAt(state.source, state.position, message, state.filename)
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
    throwErrorAt(
      state.source,
      position,
      error instanceof Error ? error.message : String(error),
      state.filename
    )
  }
}

function lookupTag<T extends ScalarTagDefinition | SequenceTagDefinition | MappingTagDefinition> (
  exact: Record<string, T>,
  prefix: readonly T[],
  tagName: string
): T | undefined {
  const exactTag = exact[tagName]
  if (exactTag) return exactTag

  for (const tag of prefix) {
    if (tagName.startsWith(tag.tagName)) return tag
  }

  return undefined
}

function findExplicitTag<T extends ScalarTagDefinition | SequenceTagDefinition | MappingTagDefinition> (
  state: ConstructorState,
  exact: Record<string, T>,
  prefix: readonly T[],
  tagName: string,
  nodeKind: T['nodeKind']
) {
  const tag = lookupTag(exact, prefix, tagName)
  if (tag) return tag

  throwError(state, `unknown ${nodeKind} tag !<${tagName}>`)
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
    const scalarTag = lookupTag(state.schema.exact.scalar, state.schema.prefix.scalar, tagName)

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
      lookupTag(state.schema.exact.mapping, state.schema.prefix.mapping, tagName) ??
      lookupTag(state.schema.exact.sequence, state.schema.prefix.sequence, tagName)

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

  if (event.style === SCALAR_STYLE_PLAIN) {
    // charAt(0) (not source[0]) yields '' for an empty source, which is the key
    // the null tag declares; source[0] would be undefined and miss that bucket.
    const candidates = state.schema.implicitScalarByFirstChar.get(source.charAt(0)) ??
      state.schema.implicitScalarAnyFirstChar
    for (const tag of candidates) {
      const result = tag.resolve(source, false, tag.tagName)
      if (result !== NOT_RESOLVED) return { value: result, tag }
    }
  }

  return { value: strTag.resolve(source, false, strTag.tagName), tag: strTag }
}

function collectionTag<Tag extends SequenceTagDefinition | MappingTagDefinition> (
  state: ConstructorState,
  event: SequenceEvent | MappingEvent,
  exact: Record<string, Tag>,
  prefix: readonly Tag[],
  defaultTagName: string,
  nodeKind: Tag['nodeKind']
) {
  const rawTag = event.tagStart === NO_RANGE
    ? ''
    : state.source.slice(event.tagStart, event.tagEnd)
  const tagName = rawTag === '' || rawTag === '!'
    ? defaultTagName
    : tagNameFull(rawTag, state.tagHandlers)

  return {
    tagName,
    tag: findExplicitTag(state, exact, prefix, tagName, nodeKind)
  }
}

// A merge source must be a mapping; every mapping tag exposes the read side.
function isMappingTag (tag: AnyTag): tag is MappingTagDefinition<any, any> {
  return tag.nodeKind === 'mapping'
}

// Fold the keys of one mapping source into the target frame, honoring merge
// precedence: an already-present key (explicit or from an earlier source) wins.
function mergeKeys (state: ConstructorState, frame: MappingFrame, source: unknown, sourceTag: MappingTagDefinition<any, any>) {
  for (const sourceKey of sourceTag.keys(source)) {
    if (state.maxTotalMergeKeys !== -1 && ++state.totalMergeKeys > state.maxTotalMergeKeys) {
      throwError(state, `merge keys exceeded maxTotalMergeKeys (${state.maxTotalMergeKeys})`)
    }

    if (frame.tag.has(frame.value, sourceKey)) continue

    const err = frame.tag.addPair(frame.value, sourceKey, sourceTag.get(source, sourceKey))
    if (err) throwError(state, err)
    ;(frame.overridable ??= new Set()).add(sourceKey)
  }
}

// The value of a `<<` key: either a mapping (fold its keys) or a sequence of
// mappings (fold each). A merge sequence has already had every element validated
// as a mapping on arrival (see addValue), and its elements were built by the
// target's own mapping tag, so they are read back with it.
function mergeSource (state: ConstructorState, frame: MappingFrame, source: unknown, sourceTag: AnyTag) {
  state.position = frame.keyPosition

  if (isMappingTag(sourceTag)) {
    mergeKeys(state, frame, source, sourceTag)
  } else if (sourceTag.nodeKind === 'sequence' && Array.isArray(source)) {
    for (const element of source) {
      mergeKeys(state, frame, element, frame.tag)
    }
  } else {
    throwError(state, 'cannot merge mappings; the provided source object is unacceptable')
  }
}

function addMappingValue (state: ConstructorState, frame: MappingFrame, key: unknown, value: unknown, tag: AnyTag) {
  state.position = frame.keyPosition

  // `<<` is intercepted before dedup, so a repeated merge key is allowed.
  if (key === MERGE_KEY) {
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
    if (frame.merge) {
      // Element of a `<<: [...]` list: validate it is a mapping, then collect
      // it like any other item for the target to fold in.
      if (!isMappingTag(tag)) {
        throwError(state, 'cannot merge mappings; the provided source object is unacceptable')
      }
    }
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
    tagHandlers: Object.create(null),
    totalMergeKeys: 0,
    aliasCount: 0
  }

  while (state.eventIndex < state.events.length) {
    const event = state.events[state.eventIndex++]
    state.position = eventPosition(event)

    switch (event.type) {
      case EVENT_DOCUMENT:
        state.anchors = new Map()
        state.aliasCount = 0
        state.tagHandlers = Object.create(null)
        for (const directive of event.directives) {
          if (directive.kind === 'tag') state.tagHandlers[directive.handle] = directive.prefix
        }
        state.frames.push({ kind: 'document', position: state.position, value: undefined, hasValue: false })
        break

      case EVENT_SCALAR: {
        const { value, tag } = constructScalar(state, event)
        storeAnchor(state, event, value, tag, true)
        addValue(state, value, tag)
        break
      }

      case EVENT_SEQUENCE: {
        const definition = collectionTag(
          state,
          event,
          state.schema.exact.sequence,
          state.schema.prefix.sequence,
          'tag:yaml.org,2002:seq',
          'sequence'
        )
        const value = definition.tag.create(definition.tagName)
        const anchor = storeAnchor(state, event, value, definition.tag, definition.tag.carrierIsResult)

        // `<<: [...]` — the parent mapping is waiting on a merge key, so this
        // sequence is a list of merge sources: its elements must be mappings.
        // It is still built and delivered as a normal value; the target folds it.
        const parent = state.frames[state.frames.length - 1]
        const merge = parent !== undefined && parent.kind === 'mapping' &&
          parent.hasKey && parent.key === MERGE_KEY

        state.frames.push({
          kind: 'sequence', position: state.position, value, tag: definition.tag, anchor, index: 0, merge
        })
        break
      }

      case EVENT_MAPPING: {
        const definition = collectionTag(
          state,
          event,
          state.schema.exact.mapping,
          state.schema.prefix.mapping,
          'tag:yaml.org,2002:map',
          'mapping'
        )
        const value = definition.tag.create(definition.tagName)
        const anchor = storeAnchor(state, event, value, definition.tag, definition.tag.carrierIsResult)
        state.frames.push({
          kind: 'mapping',
          position: state.position,
          value,
          tag: definition.tag,
          anchor,
          key: undefined,
          keyPosition: state.position,
          hasKey: false,
          overridable: null
        })
        break
      }

      case EVENT_ALIAS: {
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

      case EVENT_POP: {
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
