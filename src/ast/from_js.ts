// JS value graph → AST. Knows tags (`identify` / `represent`). A single
// identity-`Map` walk handles dedup: a repeat occurrence of an object (including
// a cycle) becomes an `alias`, and the first occurrence gets an `anchor`.

import { YAMLException } from '../common/exception.ts'
import { type Schema } from '../schema.ts'
import { type TagDefinition } from '../tag.ts'
import { tagNameShort } from '../common/tagname.ts'
import {
  Style,
  type Document,
  type Node,
  type ScalarNode,
  type SequenceNode,
  type MappingNode
} from './nodes.ts'

/** @category AST */
interface FromJsOptions {
  /** Inlines duplicate objects instead of converting them into references. */
  noRefs?: boolean

  /**
   * Skips unrepresentable values instead of throwing. Invalid mapping pairs
   * and sequence items are skipped; `undefined` sequence items become `null`.
   */
  skipInvalid?: boolean
}

// A match candidate. `implicitTag` means the tag is not printed (implicit
// scalars and the default str/seq/map tags).
interface RepresentType {
  tag: TagDefinition
  implicitTag: boolean
}

// Returned by `build` when no tag matched.
const INVALID = Symbol('INVALID')

interface FromJsState {
  representTypes: RepresentType[]
  noRefs: boolean
  skipInvalid: boolean

  // Already-built collection values → their node, for anchor/alias dedup.
  refs: Map<unknown, Node>
  refCounter: number
}

function buildRepresentTypes (schema: Schema): RepresentType[] {
  const defaultTags = new Set<TagDefinition>([
    schema.defaultScalarTag,
    schema.defaultSequenceTag,
    schema.defaultMappingTag
  ].filter((t): t is TagDefinition => t !== undefined))

  // Default container/str tags go last so a more specific tag identifying the
  // same JS value (e.g. a custom tag on a plain object) wins.
  const implicitScalars = schema.implicitScalarTags
  const explicitTags = schema.tags.filter(t =>
    !(t.nodeKind === 'scalar' && t.implicit) && !defaultTags.has(t))
  const defaultTagsLast = schema.tags.filter(t => defaultTags.has(t))

  return [
    ...implicitScalars.map(tag => ({ tag, implicitTag: true })),
    ...explicitTags.map(tag => ({ tag, implicitTag: false })),
    ...defaultTagsLast.map(tag => ({ tag, implicitTag: true }))
  ]
}

// First tag whose `identify` accepts `object`.
function matchTag (state: FromJsState, object: unknown): { tag: TagDefinition, tagName: string, implicitTag: boolean } | null {
  for (let index = 0, length = state.representTypes.length; index < length; index += 1) {
    const { tag, implicitTag } = state.representTypes[index]

    if (tag.identify(object)) {
      let tagName: string
      if (tag.matchByTagPrefix) {
        tagName = tag.representTagName(object)
      } else {
        tagName = tag.tagName
      }
      return { tag, tagName, implicitTag }
    }
  }

  return null
}

// Build a node for `object`, or INVALID when no tag matches. `undefined` never
// throws (caller decides: null in a sequence, skip in a mapping, '' at root);
// any other unrepresentable value throws unless `skipInvalid`.
function build (state: FromJsState, object: unknown): Node | typeof INVALID {
  if (!state.noRefs && object !== null && typeof object === 'object') {
    const existing = state.refs.get(object)
    if (existing) {
      if (existing.anchor === undefined) existing.anchor = `ref_${state.refCounter++}`
      return { kind: 'alias', tag: '', style: new Style(), anchor: existing.anchor }
    }
  }

  const matched = matchTag(state, object)

  if (!matched) {
    if (object === undefined) return INVALID
    if (state.skipInvalid) return INVALID
    throw new YAMLException(`unacceptable kind of an object to dump ${Object.prototype.toString.call(object)}`)
  }

  const { tag, tagName, implicitTag } = matched
  const nodeTagName = implicitTag ? tagName : tagNameShort(tagName)

  if (tag.nodeKind === 'scalar') {
    const style = new Style()
    style.tagged = !implicitTag
    const node: ScalarNode = {
      kind: 'scalar',
      tag: nodeTagName,
      style,
      value: tag.represent(object)
    }
    return node
  }

  if (tag.nodeKind === 'sequence') {
    const container = tag.represent(object)
    const style = new Style()
    style.tagged = !implicitTag
    const node: SequenceNode = { kind: 'sequence', tag: nodeTagName, style, items: [] }
    if (!state.noRefs) state.refs.set(object, node)

    for (let index = 0, length = container.length; index < length; index += 1) {
      let item = build(state, container[index])
      // An invalid element becomes null; a still-invalid null then skips/throws.
      if (item === INVALID && container[index] === undefined) item = build(state, null)
      if (item === INVALID) continue
      node.items.push(item)
    }
    return node
  }

  // mapping — the canonical form is always a `Map`.
  const map = tag.represent(object)
  const style = new Style()
  style.tagged = !implicitTag
  const node: MappingNode = { kind: 'mapping', tag: nodeTagName, style, items: [] }
  if (!state.noRefs) state.refs.set(object, node)

  for (const [objectKey, objectValue] of map) {
    const key = build(state, objectKey)
    if (key === INVALID) continue // invalid key skips the pair
    const value = build(state, objectValue)
    if (value === INVALID) continue // invalid value skips the pair
    node.items.push({ key, value })
  }
  return node
}

/**
 * Convert JS object to AST. A JS value is one YAML document. An unrepresentable
 * root becomes an empty document, which the presenter renders as an empty
 * string.
 *
 * @category AST
 */
function jsToAst (input: unknown, schema: Schema, options: FromJsOptions = {}): Document[] {
  const state: FromJsState = {
    representTypes: buildRepresentTypes(schema),
    noRefs: options.noRefs ?? false,
    skipInvalid: options.skipInvalid ?? false,
    refs: new Map(),
    refCounter: 0
  }

  const root = build(state, input)
  return [{ contents: root === INVALID ? null : root, directives: [] }]
}

export {
  jsToAst,
  type FromJsOptions
}
