import { SCALAR_STYLE, type ScalarStyle } from '../parser/events.ts'
import { type Node, type ScalarNode } from './nodes.ts'
import { type PresenterOptions } from './presenter.ts'
import { MIN_SCALAR_CONTENT_WIDTH } from './styler_defaults.ts'

interface ScalarLayout {
  readonly node: Readonly<ScalarNode>
  readonly parent: Readonly<Node> | null
  readonly level: number
  readonly isKey: boolean
  readonly flowOnly: boolean
  readonly shiftOfParent: number
  readonly shiftOfContent: number
  readonly shiftOfFirstLine: number
  readonly presenterOptions: Readonly<Required<PresenterOptions>>
  allowedStylesMask: number
  style: ScalarStyle
}

function setBit (mask: number, bit: number): number { return mask | (1 << bit) }

// YAML 1.2.2 character productions.
// https://yaml.org/spec/1.2.2/#51-character-set
const SRC_C_PRINTABLE = '[\\x09\\x0A\\x0D\\x20-\\x7E\\x85\\xA0-\\uD7FF\\uE000-\\uFFFD\\u{10000}-\\u{10FFFF}]'
const SRC_B_CHAR = '[\\n\\r]'
const SRC_C_BYTE_ORDER_MARK = '\\uFEFF'
const SRC_S_WHITE = '[ \\t]'
const SRC_NB_CHAR = `(?:(?!(?:${SRC_B_CHAR}|${SRC_C_BYTE_ORDER_MARK}))${SRC_C_PRINTABLE})`
const SRC_NS_CHAR = `(?:(?!${SRC_S_WHITE})${SRC_NB_CHAR})`

// YAML 1.2.2 [2] nb-json.
const SRC_NB_JSON = '[\\x09\\x20-\\uD7FF\\uE000-\\uFFFF\\u{10000}-\\u{10FFFF}]'

// YAML 1.2.2 indicator productions.
// https://yaml.org/spec/1.2.2/#54-indicator-characters
const SRC_C_INDICATOR = '[-?:,\\[\\]{}#&*!|>\'"%@`]'
const SRC_C_FLOW_INDICATOR = '[,\\[\\]{}]'

// YAML 1.2.2 [127]-[129] ns-plain-safe(c).
// https://yaml.org/spec/1.2.2/#733-plain-style
const SRC_NS_PLAIN_SAFE_FLOW_OUT = SRC_NS_CHAR
const SRC_NS_PLAIN_SAFE_FLOW_IN = `(?:(?!${SRC_C_FLOW_INDICATOR})${SRC_NS_CHAR})`

// YAML 1.2.2 [126] ns-plain-first(c).
const SRC_NS_PLAIN_FIRST_FLOW_OUT =
  `(?:(?:(?!${SRC_C_INDICATOR})${SRC_NS_CHAR})|[?:-](?=${SRC_NS_PLAIN_SAFE_FLOW_OUT}))`
const SRC_NS_PLAIN_FIRST_FLOW_IN =
  `(?:(?:(?!${SRC_C_INDICATOR})${SRC_NS_CHAR})|[?:-](?=${SRC_NS_PLAIN_SAFE_FLOW_IN}))`

// YAML 1.2.2 [130] ns-plain-char(c).
// The production itself requires lookbehind, so these regexps require ES2018 lookbehind support.
// const SRC_NS_PLAIN_CHAR_FLOW_OUT =
//   `(?:(?:(?![:#])${SRC_NS_PLAIN_SAFE_FLOW_OUT})|(?<=${SRC_NS_CHAR})#|:(?=${SRC_NS_PLAIN_SAFE_FLOW_OUT}))`
// const SRC_NS_PLAIN_CHAR_FLOW_IN =
//   `(?:(?:(?![:#])${SRC_NS_PLAIN_SAFE_FLOW_IN})|(?<=${SRC_NS_CHAR})#|:(?=${SRC_NS_PLAIN_SAFE_FLOW_IN}))`

// ES2015-compatible alternative without lookbehind: consume each run of hashes
// together with the preceding non-hash ns-plain-char.
const SRC_NS_PLAIN_CHAR_FLOW_OUT =
  `(?:(?:(?![:#])${SRC_NS_PLAIN_SAFE_FLOW_OUT})|:(?=${SRC_NS_PLAIN_SAFE_FLOW_OUT}))#*`
const SRC_NS_PLAIN_CHAR_FLOW_IN =
  `(?:(?:(?![:#])${SRC_NS_PLAIN_SAFE_FLOW_IN})|:(?=${SRC_NS_PLAIN_SAFE_FLOW_IN}))#*`

// YAML 1.2.2 [132] nb-ns-plain-in-line(c).
const SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT = `(?:${SRC_S_WHITE}*${SRC_NS_PLAIN_CHAR_FLOW_OUT})*`
const SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN = `(?:${SRC_S_WHITE}*${SRC_NS_PLAIN_CHAR_FLOW_IN})*`

// YAML 1.2.2 [133] ns-plain-one-line(c).
const SRC_NS_PLAIN_ONE_LINE_FLOW_OUT =
  `${SRC_NS_PLAIN_FIRST_FLOW_OUT}#*${SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT}`
const SRC_NS_PLAIN_ONE_LINE_FLOW_IN =
  `${SRC_NS_PLAIN_FIRST_FLOW_IN}#*${SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN}`
const SRC_NS_PLAIN_ONE_LINE_BLOCK_KEY = SRC_NS_PLAIN_ONE_LINE_FLOW_OUT
const SRC_NS_PLAIN_ONE_LINE_FLOW_KEY = SRC_NS_PLAIN_ONE_LINE_FLOW_IN

// YAML 1.2.2 [134] s-ns-plain-next-line(n,c).
// ScalarNode.value contains the folded value, not the source text: one source
// line break became a space, while k > 1 breaks became k - 1 LF characters.
// The space case is already accepted by [132]; each remaining run of LFs
// therefore represents a transition to the next non-empty content line in [134].
const SRC_S_NS_PLAIN_NEXT_LINE_FLOW_OUT =
  `\\n+${SRC_NS_PLAIN_CHAR_FLOW_OUT}${SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT}`
const SRC_S_NS_PLAIN_NEXT_LINE_FLOW_IN =
  `\\n+${SRC_NS_PLAIN_CHAR_FLOW_IN}${SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN}`

// YAML 1.2.2 [135] ns-plain-multi-line(n,c).
const SRC_NS_PLAIN_MULTI_LINE_FLOW_OUT =
  `${SRC_NS_PLAIN_ONE_LINE_FLOW_OUT}(?:${SRC_S_NS_PLAIN_NEXT_LINE_FLOW_OUT})*`
const SRC_NS_PLAIN_MULTI_LINE_FLOW_IN =
  `${SRC_NS_PLAIN_ONE_LINE_FLOW_IN}(?:${SRC_S_NS_PLAIN_NEXT_LINE_FLOW_IN})*`

// YAML 1.2.2 [131] ns-plain(n,c).
const NS_PLAIN_FLOW_OUT = new RegExp(`^(?:${SRC_NS_PLAIN_MULTI_LINE_FLOW_OUT})$`, 'u')
const NS_PLAIN_FLOW_IN = new RegExp(`^(?:${SRC_NS_PLAIN_MULTI_LINE_FLOW_IN})$`, 'u')
const NS_PLAIN_BLOCK_KEY = new RegExp(`^(?:${SRC_NS_PLAIN_ONE_LINE_BLOCK_KEY})$`, 'u')
const NS_PLAIN_FLOW_KEY = new RegExp(`^(?:${SRC_NS_PLAIN_ONE_LINE_FLOW_KEY})$`, 'u')

// YAML 1.2.2 [118]-[125], projected to ScalarNode.value: doubled quotes
// are already decoded, and flow folding represents content line feeds as LF.
const NB_SINGLE_ONE_LINE = new RegExp(`^(?:${SRC_NB_JSON})*$`, 'u')
const NB_SINGLE_MULTI_LINE = new RegExp(`^(?:${SRC_NB_JSON}|\\n)*$`, 'u')

// YAML 1.2.2 [170]-[182], projected to ScalarNode.value: source line breaks
// are normalized to LF; every other content character must be nb-char.
const BLOCK_SCALAR_CONTENT = new RegExp(`^(?:${SRC_NB_CHAR}|\\n)*$`, 'u')

// YAML 1.2.2 [206] c-forbidden.
// https://yaml.org/spec/1.2.2/#912-document-markers
const C_FORBIDDEN_FIRST_LINE = /^(?:---|\.\.\.)(?=$|[ \t\n\r])/
const C_FORBIDDEN_CONTENT = /^(?:---|\.\.\.)(?=$|[ \t\n\r])/m

function canUsePlain (layout: ScalarLayout): boolean {
  const str = layout.node.value

  // Allow null to be rendered as an empty scalar; its tag is checked below.
  if (str !== '') {
    const nsPlain = layout.isKey
      ? (layout.flowOnly ? NS_PLAIN_FLOW_KEY : NS_PLAIN_BLOCK_KEY)
      : (layout.flowOnly ? NS_PLAIN_FLOW_IN : NS_PLAIN_FLOW_OUT)

    if (!nsPlain.test(str)) return false
    if (layout.shiftOfFirstLine === 0 && C_FORBIDDEN_FIRST_LINE.test(str)) return false

    if (layout.shiftOfContent === 0) {
      const firstLineBreak = str.indexOf('\n')

      if (firstLineBreak !== -1) {
        const content = str.slice(firstLineBreak + 1)

        if (C_FORBIDDEN_CONTENT.test(content)) return false
      }
    }
  }

  // Outside the plain-syntax BNF: preserve the node tag under implicit resolution.
  const resolvedTag = layout.presenterOptions.schema.resolveImplicitScalarTag(str).tag.tagName

  if (!layout.node.tagged && resolvedTag !== layout.node.tag) return false

  // Outside YAML 1.2.2: preserve YAML 1.1 !!value semantics.
  // https://yaml.org/type/value.html
  if (!layout.node.tagged && str === '=' &&
      resolvedTag === layout.presenterOptions.schema.defaultScalarTag.tagName) return false

  return true
}

function canUseSingleQuoted (layout: ScalarLayout): boolean {
  const str = layout.node.value
  const nbSingleText = layout.isKey ? NB_SINGLE_ONE_LINE : NB_SINGLE_MULTI_LINE

  if (!nbSingleText.test(str)) return false

  // [123]-[125] exclude trailing and leading s-white around a folded break;
  // single-quoted style has no escape that could preserve it.
  if (/[ \t]\n|\n[ \t]/.test(str)) return false

  // A decoded LF is rendered through flow folding. At zero continuation
  // indentation, c-forbidden would terminate the quoted scalar.
  if (!layout.isKey && layout.shiftOfContent === 0) {
    const firstLineBreak = str.indexOf('\n')

    if (firstLineBreak !== -1 &&
        C_FORBIDDEN_CONTENT.test(str.slice(firstLineBreak + 1))) return false
  }

  return true
}

function canUseBlock (layout: ScalarLayout): boolean {
  if (layout.flowOnly || !BLOCK_SCALAR_CONTENT.test(layout.node.value)) return false

  const contentIndent = layout.shiftOfContent - layout.shiftOfParent

  if (contentIndent < 1) return false

  // A leading space requires [163] c-indentation-indicator. Its value is 1-9.
  if (contentIndent > 9 && /^\n* /.test(layout.node.value)) return false

  // Block content starts on its own line, so every zero-indented content line
  // is subject to [206] c-forbidden.
  if (layout.shiftOfContent === 0 && C_FORBIDDEN_CONTENT.test(layout.node.value)) return false

  return true
}

function detectAllowedStyles (layout: ScalarLayout): void {
  // [107] Double-quoted style can express arbitrary strings through escape sequences.
  let mask = setBit(0, SCALAR_STYLE.DOUBLE_QUOTED)

  if (canUsePlain(layout)) mask = setBit(mask, SCALAR_STYLE.PLAIN)
  if (canUseSingleQuoted(layout)) mask = setBit(mask, SCALAR_STYLE.SINGLE_QUOTED)

  if (canUseBlock(layout)) {
    mask = setBit(setBit(mask, SCALAR_STYLE.LITERAL_BLOCK), SCALAR_STYLE.FOLDED_BLOCK)
  }

  layout.allowedStylesMask = mask
}

function renderScalar (layout: ScalarLayout): string {
  switch (layout.style) {
    case SCALAR_STYLE.PLAIN:
      return renderPlain(layout)
    case SCALAR_STYLE.SINGLE_QUOTED:
      return renderSingleQuoted(layout)
    case SCALAR_STYLE.LITERAL_BLOCK:
      return renderLiteralBlock(layout)
    case SCALAR_STYLE.FOLDED_BLOCK:
      return renderFoldedBlock(layout)
    case SCALAR_STYLE.DOUBLE_QUOTED:
      return renderDoubleQuoted(layout)
  }
}

function renderPlain (layout: ScalarLayout): string {
  return encodeFlowBreaks(layout.node.value, layout.shiftOfContent)
}

function renderSingleQuoted (layout: ScalarLayout): string {
  const value = encodeFlowBreaks(layout.node.value, layout.shiftOfContent)
  return `'${value.replace(/'/g, "''")}'`
}

function renderLiteralBlock (layout: ScalarLayout): string {
  const value = layout.node.value

  return '|' + blockHeader(value, layout.shiftOfParent, layout.shiftOfContent) +
    dropEndingNewline(indentString(value, layout.shiftOfContent))
}

function renderFoldedBlock (layout: ScalarLayout): string {
  const value = layout.node.value
  const w = layout.presenterOptions.lineWidth
  let availableWidth = Infinity

  if (w !== -1) {
    availableWidth = Math.max(
      Math.min(w, MIN_SCALAR_CONTENT_WIDTH),
      w - layout.shiftOfContent
    )
  }

  return '>' + blockHeader(value, layout.shiftOfParent, layout.shiftOfContent) +
    dropEndingNewline(indentString(
      foldBlockScalar(value, availableWidth),
      layout.shiftOfContent
    ))
}

function renderDoubleQuoted (layout: ScalarLayout): string {
  return `"${escapeString(layout.node.value)}"`
}

// Flow scalars fold line breaks: a run of k source line breaks reparses to k-1
// literal LF characters. Encode each run of p literal LF characters as p+1
// breaks and indent the following content line.
function encodeFlowBreaks (string: string, shiftOfContent: number): string {
  let nextLF = string.indexOf('\n')
  if (nextLF === -1) return string

  const pad = ' '.repeat(shiftOfContent)
  let result = string.slice(0, nextLF)

  const lineRe = /(\n+)([^\n]*)/g
  lineRe.lastIndex = nextLF
  let match

  while ((match = lineRe.exec(string))) {
    const breaks = match[1].length
    const line = match[2]
    result += '\n'.repeat(breaks + 1) + pad + line
  }

  return result
}

// Indents every line in a string. Empty lines (\n only) are not indented.
function indentString (string: string, spaces: number): string {
  const indent = ' '.repeat(spaces)
  let position = 0
  let result = ''
  const length = string.length

  while (position < length) {
    let line
    const next = string.indexOf('\n', position)

    if (next === -1) {
      line = string.slice(position)
      position = length
    } else {
      line = string.slice(position, next + 1)
      position = next + 1
    }

    if (line.length && line !== '\n') result += indent

    result += line
  }

  return result
}

function needIndentIndicator (string: string): boolean {
  return /^\n* /.test(string)
}

function blockHeader (string: string, shiftOfParent: number, shiftOfContent: number): string {
  const indentIndicator = needIndentIndicator(string)
    ? String(shiftOfContent - shiftOfParent)
    : ''

  // The string '\n' counts as a trailing empty line.
  const clip = string[string.length - 1] === '\n'
  const keep = clip && (string[string.length - 2] === '\n' || string === '\n')
  const chomp = keep ? '+' : (clip ? '' : '-')

  return `${indentIndicator}${chomp}\n`
}

// The presenter adds its own trailing newline.
function dropEndingNewline (string: string): string {
  return string[string.length - 1] === '\n' ? string.slice(0, -1) : string
}

function isMoreIndented (char: string): boolean {
  return char === ' ' || char === '\t'
}

function foldLine (line: string, width: number): string {
  if (line === '' || isMoreIndented(line[0])) return line

  const breakRe = / [^ \t]/g
  let match
  let start = 0
  let end
  let curr = 0
  let next = 0
  let result = ''

  while ((match = breakRe.exec(line))) {
    next = match.index

    if (next - start > width) {
      end = (curr > start) ? curr : next
      result += `\n${line.slice(start, end)}`
      start = end + 1
    }

    curr = next
  }

  result += '\n'

  if (line.length - start > width && curr > start) {
    result += `${line.slice(start, curr)}\n${line.slice(curr + 1)}`
  } else {
    result += line.slice(start)
  }

  return result.slice(1)
}

function foldBlockScalar (string: string, width: number): string {
  const lineRe = /(\n+)([^\n]*)/g

  let nextLF = string.indexOf('\n')
  if (nextLF === -1) nextLF = string.length
  lineRe.lastIndex = nextLF

  let result = foldLine(string.slice(0, nextLF), width)
  let prevMoreIndented = string[0] === '\n' || isMoreIndented(string[0])
  let moreIndented
  let match

  while ((match = lineRe.exec(string))) {
    const prefix = match[1]
    const line = match[2]

    moreIndented = line !== '' && isMoreIndented(line[0])
    result += prefix +
      ((!prevMoreIndented && !moreIndented && line !== '') ? '\n' : '') +
      foldLine(line, width)
    prevMoreIndented = moreIndented
  }

  return result
}

// Characters escaped in Double-Quoted Style:
//
// - the inverse of YAML 1.2.2 [1] c-printable;
// - TAB, LF and CR, which c-printable includes;
// - NEL, NBSP, LS, PS and BOM, which are escaped to make invisible content
//   visible;
// - double quote and backslash, which must be escaped because they have
//   syntactic meaning.
//
// In Unicode mode, the surrogate range matches unpaired surrogates but does not
// match either code unit of a valid surrogate pair.
// https://yaml.org/spec/1.2.2/#rule-c-printable
const CHARACTERS_TO_ESCAPE =
  /["\\\x00-\x1F\x7F-\xA0\u2028\u2029\uD800-\uDFFF\uFEFF\uFFFE\uFFFF]/gu

function escapeCharacter (character: string): string {
  switch (character) {
    case '\x00': return '\\0'
    case '\x07': return '\\a'
    case '\x08': return '\\b'
    case '\x09': return '\\t'
    case '\x0A': return '\\n'
    case '\x0B': return '\\v'
    case '\x0C': return '\\f'
    case '\x0D': return '\\r'
    case '\x1B': return '\\e'
    case '"': return '\\"'
    case '\\': return '\\\\'
    case '\x85': return '\\N'
    case '\xA0': return '\\_'
    case '\u2028': return '\\L'
    case '\u2029': return '\\P'
  }

  const code = character.charCodeAt(0)
  const hex = code.toString(16).toUpperCase()

  if (code <= 0xFF) return `\\x${'0'.repeat(2 - hex.length)}${hex}`

  return `\\u${'0'.repeat(4 - hex.length)}${hex}`
}

function escapeString (string: string): string {
  return string.replace(CHARACTERS_TO_ESCAPE, escapeCharacter)
}

export {
  detectAllowedStyles,
  renderScalar,
  type ScalarLayout
}
