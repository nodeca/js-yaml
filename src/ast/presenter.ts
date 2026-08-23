// AST → text. Walks the node `kind`; the scalar machinery (style selection,
// quoting, folding) is driven by node text, not by sniffing a JS value.

import { YAMLException } from '../common/exception.ts'
import { tagNameShort } from '../common/tagname.ts'
import { COLLECTION_STYLE, SCALAR_STYLE } from '../parser/events.ts'
import { type Schema } from '../schema.ts'
import {
  type Node,
  type Document,
  type ScalarNode,
  type SequenceNode,
  type MappingNode
} from './nodes.ts'
import { detectAllowedStyles, renderScalar, type ScalarLayout } from './scalar_styler.ts'
import { scalarStylerDefaults } from './styler_defaults.ts'

const CHAR_LINE_FEED = 0x0A /* LF */
const CHAR_DOUBLE_QUOTE = 0x22 /* " */
const CHAR_SINGLE_QUOTE = 0x27 /* ' */

/** @category AST */
interface PresenterOptions {
  /** Schema used when selecting a safe scalar style. */
  schema: Schema

  /**
   * Indentation width in spaces.
   *
   * @defaultValue `2`
   */
  indent?: number

  /**
   * Does not add an indentation level to array elements when enabled.
   *
   * @defaultValue `false`
   */
  seqNoIndent?: boolean

  /**
   * Allows a nested collection to start on the same line after `-`.
   *
   * @defaultValue `true`
   */
  seqInlineFirst?: boolean

  /**
   * Preferred line width for folding. Unbreakable and more-indented lines may
   * exceed it. Set to `-1` for unlimited width.
   *
   * @defaultValue `80`
   */
  lineWidth?: number

  /**
   * Adds spaces inside flow collection brackets: `{a: 1}` becomes `{ a: 1 }`.
   *
   * @defaultValue `false`
   */
  flowBracketPadding?: boolean

  /**
   * Omits the space after commas in flow collections: `[1, 2]` becomes
   * `[1,2]`.
   *
   * @defaultValue `false`
   */
  flowSkipCommaSpace?: boolean

  /**
   * Omits the space after `:` in flow mappings: `{a: 1}` becomes `{a:1}`.
   *
   * @defaultValue `false`
   */
  flowSkipColonSpace?: boolean

  /**
   * Quotes flow mapping keys: `{a: 1}` becomes `{"a": 1}`.
   *
   * @defaultValue `false`
   */
  quoteFlowKeys?: boolean

  /**
   * Quoting style to use when a string needs quotes.
   *
   * @defaultValue `'single'`
   */
  quoteStyle?: 'single' | 'double'

  /**
   * Quotes all non-key strings using {@link quoteStyle}.
   *
   * @defaultValue `false`
   */
  forceQuotes?: boolean

  /**
   * Prints an explicit tag before an anchor: `&ref_0 !!set` becomes
   * `!!set &ref_0`.
   *
   * @defaultValue `false`
   */
  tagBeforeAnchor?: boolean
}

const DEFAULT_PRESENTER_OPTIONS: Required<Omit<PresenterOptions, 'schema'>> = {
  indent: 2,
  seqNoIndent: false,
  seqInlineFirst: true,
  lineWidth: 80,
  flowBracketPadding: false,
  flowSkipCommaSpace: false,
  flowSkipColonSpace: false,
  quoteFlowKeys: false,
  quoteStyle: 'single',
  forceQuotes: false,
  tagBeforeAnchor: false
}

interface PresenterState extends Required<PresenterOptions> {
  defaultScalarTagName: string
}

function nodeTagShort (node: ScalarNode | SequenceNode | MappingNode) {
  return node.tagged ? node.tag : tagNameShort(node.tag)
}

function createPresenterState (options: PresenterOptions): PresenterState {
  const opts = {
    ...DEFAULT_PRESENTER_OPTIONS,
    ...options
  }

  return {
    ...opts,
    defaultScalarTagName: opts.schema.defaultScalarTag.tagName
  }
}

function generateNextLine (state: PresenterState, level: number) {
  return `\n${' '.repeat(state.indent * level)}`
}

function scalarLayout (state: PresenterState, node: ScalarNode, parent: Readonly<Node> | null, level: number,
  isKey: boolean, flowOnly: boolean): ScalarLayout {
  const shiftOfParent = level === 0 ? -1 : state.indent * (level - 1)
  const shiftOfContent = state.indent * Math.max(1, level)

  return {
    node,
    parent,
    level,
    isKey,
    flowOnly,
    shiftOfParent,
    shiftOfContent,
    shiftOfFirstLine: level === 0 ? 0 : state.indent * level,
    presenterOptions: state,
    allowedStylesMask: 0,
    style: node.style
  }
}

function writeFlowSequence (state: PresenterState, level: number, node: SequenceNode) {
  let result = ''

  for (let index = 0, length = node.items.length; index < length; index += 1) {
    const item = writeNode(state, level, node.items[index], node, {})
    if (result !== '') result += `,${!state.flowSkipCommaSpace ? ' ' : ''}`
    result += item
  }

  const pad = state.flowBracketPadding && result !== '' ? ' ' : ''
  return `[${pad}${result}${pad}]`
}

function writeBlockSequence (state: PresenterState, level: number, node: SequenceNode, compact: boolean) {
  let result = ''

  for (let index = 0, length = node.items.length; index < length; index += 1) {
    const item = writeNode(state, level + 1, node.items[index], node,
      { block: true, compact: state.seqInlineFirst, isblockseq: true })

    if (!compact || result !== '') {
      result += generateNextLine(state, level)
    }

    // No trailing space when the value renders empty (e.g. null → '').
    if (item === '' || CHAR_LINE_FEED === item.charCodeAt(0)) {
      result += '-'
    } else {
      result += '- '
    }

    result += item
  }

  return result
}

function writeFlowMapping (state: PresenterState, level: number, node: MappingNode) {
  let result = ''

  for (const { key, value } of node.items) {
    let pairBuffer = ''
    if (result !== '') pairBuffer += `,${!state.flowSkipCommaSpace ? ' ' : ''}`

    const keyText = writeNode(state, level, key, node, { iskey: true })
    const explicitPair = keyText.length > 1024

    if (explicitPair) {
      pairBuffer += '? '
    } else if (state.quoteFlowKeys) {
      pairBuffer += '"'
    }

    const valueText = writeNode(state, level, value, node, {})
    // No separating space when the value renders empty (e.g. null → '').
    const sep = state.flowSkipColonSpace || valueText === '' ? '' : ' '

    pairBuffer += `${keyText}${state.quoteFlowKeys && !explicitPair ? '"' : ''}:${sep}${valueText}`

    result += pairBuffer
  }

  const pad = state.flowBracketPadding && result !== '' ? ' ' : ''
  return `{${pad}${result}${pad}}`
}

function writeBlockMapping (state: PresenterState, level: number, node: MappingNode, compact: boolean) {
  let result = ''

  for (let index = 0, length = node.items.length; index < length; index += 1) {
    let pairBuffer = ''

    if (!compact || result !== '') {
      pairBuffer += generateNextLine(state, level)
    }

    const { key, value } = node.items[index]

    // A block key — a block collection (mapping/sequence) or a block scalar
    // (literal/folded) — can't sit on a `key:` line, so it's written with block
    // context and the pair takes the explicit `? key / : value` form. A simple
    // scalar key stays inline (flow-vs-block is invisible there).
    const keyIsBlock =
      ((key.kind === 'mapping' || key.kind === 'sequence') &&
        key.style === COLLECTION_STYLE.BLOCK && key.items.length !== 0) ||
      (key.kind === 'scalar' &&
        (key.style === SCALAR_STYLE.LITERAL_BLOCK || key.style === SCALAR_STYLE.FOLDED_BLOCK))

    // The `?`/`:` indicators shift content right like a `-`, so a block key or
    // value that stays on the indicator line keeps its indentation under
    // seqNoIndent (`isblockseq`). One that drops to its own line (tag/anchor)
    // collapses to the parent indent, so leave the flag off there.
    const keyText = keyIsBlock
      ? writeNode(state, level + 1, key, node,
        { block: true, compact: true, isblockseq: !cannotBeCompact(state, key, level + 1) })
      : writeNode(state, level + 1, key, node, { block: true, compact: true, iskey: true })

    // Block key, over-long key, or multiline scalar key forces explicit form.
    // Multiline isn't a spec requirement — just matches pyyaml's simple-key rule.
    const keyHasLineBreak = key.kind === 'scalar' && key.value.indexOf('\n') !== -1
    const explicitPair = keyIsBlock || keyHasLineBreak || keyText.length > 1024

    if (explicitPair) {
      if (keyText && CHAR_LINE_FEED === keyText.charCodeAt(0)) {
        pairBuffer += '?'
      } else {
        pairBuffer += '? '
      }
    }

    pairBuffer += keyText

    if (explicitPair) {
      pairBuffer += generateNextLine(state, level)
    }

    const valueText = writeNode(state, level + 1, value, node,
      { block: true, compact: explicitPair, isblockseq: explicitPair && !cannotBeCompact(state, value, level + 1) })

    // Keep a space before the colon when the key text ends in a leading
    // property rather than scalar content, so the colon can't be read as part
    // of it. Two cases: an inline alias key (`*b : v`), and an empty scalar key
    // whose whole text is its anchor/tag (`&a :`, `!!str :`) — without the
    // space `&a:` reparses as an anchored value, dropping the null key.
    const keyIsBareProps = key.kind === 'scalar' && key.value === '' &&
      keyText !== '' &&
      keyText.charCodeAt(keyText.length - 1) !== CHAR_SINGLE_QUOTE &&
      keyText.charCodeAt(keyText.length - 1) !== CHAR_DOUBLE_QUOTE
    const keyColonSep = !explicitPair && (key.kind === 'alias' || keyIsBareProps) ? ' ' : ''

    // No trailing space when the value renders empty (e.g. null → '').
    if (valueText === '' || CHAR_LINE_FEED === valueText.charCodeAt(0)) {
      pairBuffer += `${keyColonSep}:`
    } else {
      pairBuffer += `${keyColonSep}: `
    }

    pairBuffer += valueText

    result += pairBuffer
  }

  return result
}

// Where a node sits relative to its parent — drives layout/style decisions.
// All flags default to false (the flow-context, non-key, non-compact case).
interface NodeContext {
  block?: boolean      // block context (vs flow); propagates downward
  compact?: boolean    // may start on the current line (no leading newline)
  iskey?: boolean      // node is a mapping key
  isblockseq?: boolean // content follows an indicator (`-`, or `?`/`:` in an
                       // explicit pair) that already shifted it right; keeps
                       // its indentation under seqNoIndent
}

// A node can't sit compact on its parent's indicator (`-`/`?`/`:`) line when it
// carries leading props (tag/anchor) that would collide with the indicator, or
// when the indent step is too narrow for the 2-char indicator. Such a node drops
// to its own line; a block collection that does so also collapses its seqNoIndent
// indentation back to the parent.
function cannotBeCompact (state: PresenterState, node: Node, level: number) {
  if (node.kind === 'alias') return true
  return node.tagged || node.anchor !== undefined || (state.indent < 2 && level > 0)
}

function writeNode (state: PresenterState, level: number, node: Node,
  parent: Readonly<Node> | null, ctx: NodeContext): string {
  if (node.kind === 'alias') return `*${node.anchor}`

  const { block = false, iskey = false, isblockseq = false } = ctx
  let compact = ctx.compact ?? false

  const hasAnchor = node.anchor !== undefined

  if (cannotBeCompact(state, node, level)) {
    compact = false
  }

  let body: string
  let shouldPrintTag = node.tagged
  const useBlockCollection = block &&
    (node.kind === 'mapping' || node.kind === 'sequence') &&
    node.style === COLLECTION_STYLE.BLOCK && node.items.length !== 0

  if (node.kind === 'mapping') {
    if (useBlockCollection) {
      body = writeBlockMapping(state, level, node, compact)
    } else {
      body = writeFlowMapping(state, level, node)
    }
  } else if (node.kind === 'sequence') {
    if (useBlockCollection) {
      if (state.seqNoIndent && !isblockseq && level > 0) {
        body = writeBlockSequence(state, level - 1, node, compact)
      } else {
        body = writeBlockSequence(state, level, node, compact)
      }
    } else {
      body = writeFlowSequence(state, level, node)
    }
  } else {
    const layout = scalarLayout(state, node, parent, level, iskey, !block)

    detectAllowedStyles(layout)
    for (const rule of scalarStylerDefaults) rule(layout)

    body = renderScalar(layout)
    shouldPrintTag = node.tagged ||
      (layout.style !== SCALAR_STYLE.PLAIN && node.tag !== state.defaultScalarTagName)
  }

  // An indicator plus its mandatory separator occupies 2 columns. For wider
  // indentation, pad a compact block collection so its first item starts at
  // the same column as the following items.
  if (useBlockCollection && compact && level > 0 && state.indent > 2) {
    body = `${' '.repeat(state.indent - 2)}${body}`
  }

  if (shouldPrintTag || hasAnchor) {
    const props: string[] = []
    const tag = shouldPrintTag ? nodeTagShort(node) : null
    const anchor = hasAnchor ? `&${node.anchor}` : null

    if (state.tagBeforeAnchor) {
      if (tag !== null) props.push(tag)
      if (anchor !== null) props.push(anchor)
    } else {
      if (anchor !== null) props.push(anchor)
      if (tag !== null) props.push(tag)
    }

    // No separator when the body is empty (e.g. `&anchor` on a null node) or
    // already starts on its own line.
    const sep = body === '' || body.charCodeAt(0) === CHAR_LINE_FEED ? '' : ' '
    body = `${props.join(' ')}${sep}${body}`
  }

  return body
}

// A bare (untagged, unanchored) non-empty block collection: writeNode renders it
// in compact form with its first item on the opening line. That works mid-stream,
// but right after a `---` the first item must drop to the next line. A tag/anchor
// already forces the body onto its own line, so those stay on the `---` line.
function rootStartsOwnLine (node: Node) {
  return (node.kind === 'sequence' || node.kind === 'mapping') &&
    node.style === COLLECTION_STYLE.BLOCK &&
    node.items.length !== 0 &&
    !node.tagged &&
    node.anchor === undefined
}

// A document whose serialization ends with a keep-chomped (`+`) block scalar is
// open-ended: the trailing blank line(s) would otherwise be ambiguous, so it
// needs a `...` terminator. Mirrors the keep test in `blockHeader`.
function isOpenEnded (node: Node) {
  // Descend to the last leaf, always taking the last item of a block collection
  // (a flow collection renders on one line, so it ends the document itself).
  let leaf = node
  while ((leaf.kind === 'sequence' || leaf.kind === 'mapping') &&
    leaf.style === COLLECTION_STYLE.BLOCK && leaf.items.length !== 0) {
    leaf = leaf.kind === 'sequence'
      ? leaf.items[leaf.items.length - 1]
      : leaf.items[leaf.items.length - 1].value
  }

  if (leaf.kind !== 'scalar' ||
      (leaf.style !== SCALAR_STYLE.LITERAL_BLOCK && leaf.style !== SCALAR_STYLE.FOLDED_BLOCK)) return false
  const { value } = leaf
  // Keep chomping: ends in a blank line (`\n\n`) or is a lone `\n`.
  return value.endsWith('\n\n') || value === '\n'
}

function writeDocumentDirectives (doc: Document) {
  let result = ''

  for (const directive of doc.directives) {
    if (directive.kind === 'yaml') {
      result += `%YAML ${directive.version}\n`
      continue
    }

    const { handle, prefix } = directive
    result += `%TAG ${handle} ${prefix}\n`
  }

  return result
}

/**
 * Build YAML from AST.
 *
 * @category AST
 */
function present (documents: Document[], options: PresenterOptions): string {
  const state = createPresenterState(options)
  let result = ''
  let previousEnded = false

  for (let index = 0; index < documents.length; index += 1) {
    const doc = documents[index]
    const directives = writeDocumentDirectives(doc)
    const hasDirectives = directives !== ''
    const marker = doc.explicitStart || hasDirectives || (index > 0 && !previousEnded)

    result += directives

    if (doc.contents === null) {
      if (marker) result += '---\n'
    } else if (marker) {
      const body = writeNode(state, 0, doc.contents, null, { block: true, compact: true })
      // Content shares the `---` line, except: an empty render (no separator at
      // all), a bare block collection (wraps to the next line), or directives
      // forcing `---` onto its own line.
      const sep = body === '' ? '' : (hasDirectives || rootStartsOwnLine(doc.contents) ? '\n' : ' ')
      result += `---${sep}${body}\n`
    } else {
      result += writeNode(state, 0, doc.contents, null, { block: true, compact: true }) + '\n'
    }

    previousEnded = doc.explicitEnd || (doc.contents !== null && isOpenEnded(doc.contents))
    if (previousEnded) {
      result += '...\n'
    }
  }

  return result
}

export {
  DEFAULT_PRESENTER_OPTIONS,
  present,
  type PresenterOptions
}
