// AST → text. Walks the node `kind`; the scalar machinery (style selection,
// quoting, folding) is driven by node text, not by sniffing a JS value.

import { YAMLException } from '../common/exception.ts'
import { tagNameShort } from '../common/tagname.ts'
import { type Schema } from '../schema.ts'
import {
  type Node,
  type Document,
  type ScalarNode,
  type SequenceNode,
  type MappingNode
} from './nodes.ts'

const CHAR_BOM = 0xFEFF
const CHAR_TAB = 0x09 /* Tab */
const CHAR_LINE_FEED = 0x0A /* LF */
const CHAR_CARRIAGE_RETURN = 0x0D /* CR */
const CHAR_SPACE = 0x20 /* Space */
const CHAR_EXCLAMATION = 0x21 /* ! */
const CHAR_DOUBLE_QUOTE = 0x22 /* " */
const CHAR_SHARP = 0x23 /* # */
const CHAR_PERCENT = 0x25 /* % */
const CHAR_AMPERSAND = 0x26 /* & */
const CHAR_SINGLE_QUOTE = 0x27 /* ' */
const CHAR_ASTERISK = 0x2A /* * */
const CHAR_COMMA = 0x2C /* , */
const CHAR_MINUS = 0x2D /* - */
const CHAR_COLON = 0x3A /* : */
const CHAR_EQUALS = 0x3D /* = */
const CHAR_GREATER_THAN = 0x3E /* > */
const CHAR_QUESTION = 0x3F /* ? */
const CHAR_COMMERCIAL_AT = 0x40 /* @ */
const CHAR_LEFT_SQUARE_BRACKET = 0x5B /* [ */
const CHAR_RIGHT_SQUARE_BRACKET = 0x5D /* ] */
const CHAR_GRAVE_ACCENT = 0x60 /* ` */
const CHAR_LEFT_CURLY_BRACKET = 0x7B /* { */
const CHAR_VERTICAL_LINE = 0x7C /* | */
const CHAR_RIGHT_CURLY_BRACKET = 0x7D /* } */

const ESCAPE_SEQUENCES: Record<number, string> = {}

ESCAPE_SEQUENCES[0x00] = '\\0'
ESCAPE_SEQUENCES[0x07] = '\\a'
ESCAPE_SEQUENCES[0x08] = '\\b'
ESCAPE_SEQUENCES[0x09] = '\\t'
ESCAPE_SEQUENCES[0x0A] = '\\n'
ESCAPE_SEQUENCES[0x0B] = '\\v'
ESCAPE_SEQUENCES[0x0C] = '\\f'
ESCAPE_SEQUENCES[0x0D] = '\\r'
ESCAPE_SEQUENCES[0x1B] = '\\e'
ESCAPE_SEQUENCES[0x22] = '\\"'
ESCAPE_SEQUENCES[0x5C] = '\\\\'
ESCAPE_SEQUENCES[0x85] = '\\N'
ESCAPE_SEQUENCES[0xA0] = '\\_'
ESCAPE_SEQUENCES[0x2028] = '\\L'
ESCAPE_SEQUENCES[0x2029] = '\\P'

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
   * Sorts mapping keys when `true`. A function can be provided to define the
   * sort order.
   *
   * @defaultValue `false`
   */
  sortKeys?: boolean | ((a: any, b: any) => number)

  /**
   * Maximum line width. Set to `-1` for unlimited width.
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
   * Quotes flow mapping keys: `{a: 1}` becomes `{"a": 1}`. The key is written
   * as a JSON-like node — double-quoted regardless of {@link quoteStyle},
   * unless the node already carries a quoted style hint — so `:` may follow it
   * directly (see {@link flowSkipColonSpace}).
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
  sortKeys: false,
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

function nodeTagShort (node: Node) {
  return node.style.tagged ? node.tag : tagNameShort(node.tag)
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

function encodeNonPrintable (character: number) {
  // YAML non-printable code points are all in BMP (max FFFF);
  // astral code points are printable and can't come here.
  const string = character.toString(16).toUpperCase()
  const handle = character <= 0xFF ? 'x' : 'u'
  const length = character <= 0xFF ? 2 : 4

  return `\\${handle}${'0'.repeat(length - string.length)}${string}`
}

// Indents every line in a string. Empty lines (\n only) are not indented.
function indentString (string: string, spaces: number) {
  const ind = ' '.repeat(spaces)
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

    if (line.length && line !== '\n') result += ind

    result += line
  }

  return result
}

function generateNextLine (state: PresenterState, level: number) {
  return `\n${' '.repeat(state.indent * level)}`
}

// Indentation/width numbers that govern how a scalar lays out at `level`.
// Scalar-only: collections compute their own indent via `generateNextLine`.
//   indent      - spaces prepended to the scalar's content (block styles)
//   blockIndent - the block indentation indicator digit (`|2` / `>2`); at the
//                 document root (level 0) it is one greater than the spaces we
//                 actually prepend (reader applies it relative to parent n = -1)
//   lineWidth   - fold width at this depth, shrinking monotonically toward
//                 min(state.lineWidth, 40) as indentation deepens; -1 = no limit
function scalarLayout (state: PresenterState, level: number) {
  const indent = state.indent * Math.max(1, level) // no 0-indent scalars
  const blockIndent = level === 0 ? state.indent + 1 : state.indent
  const lineWidth = (state.lineWidth === -1)
    ? -1
    : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent)

  return { indent, blockIndent, lineWidth }
}

// [33] s-white ::= s-space | s-tab
function isWhitespace (c: number) {
  return c === CHAR_SPACE || c === CHAR_TAB
}

// Mirrors parser.testDocumentSeparator(): `---` and `...` are document
// markers when followed by separation whitespace, a line break, or EOF.
function startsWithDocumentSeparator (string: string) {
  const marker = string.charCodeAt(0)

  if ((marker !== CHAR_MINUS && marker !== 0x2E/* . */) ||
      string.charCodeAt(1) !== marker || string.charCodeAt(2) !== marker) return false

  if (string.length === 3) return true

  const following = string.charCodeAt(3)
  return isWhitespace(following) ||
    following === CHAR_CARRIAGE_RETURN || following === CHAR_LINE_FEED
}

// Returns true if the character can be printed without escaping.
// From YAML 1.2: "any allowed characters known to be non-printable
// should also be escaped. [However,] This isn’t mandatory"
// Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
function isPrintable (c: number) {
  return (c >= 0x00020 && c <= 0x00007E) ||
    ((c >= 0x000A1 && c <= 0x00D7FF) && c !== 0x2028 && c !== 0x2029) ||
    ((c >= 0x0E000 && c <= 0x00FFFD) && c !== CHAR_BOM) ||
    (c >= 0x10000 && c <= 0x10FFFF)
}

// [34] ns-char ::= nb-char - s-white
// [27] nb-char ::= c-printable - b-char - c-byte-order-mark
// [26] b-char  ::= b-line-feed | b-carriage-return
// Including s-white (for some reason, examples doesn't match specs in this aspect)
// ns-char ::= c-printable - b-line-feed - b-carriage-return - c-byte-order-mark
function isNsCharOrWhitespace (c: number) {
  return isPrintable(c) &&
    c !== CHAR_BOM &&
    // - b-char
    c !== CHAR_CARRIAGE_RETURN &&
    c !== CHAR_LINE_FEED
}

// [127]  ns-plain-safe(c) ::= c = flow-out  ⇒ ns-plain-safe-out
//                             c = flow-in   ⇒ ns-plain-safe-in
//                             c = block-key ⇒ ns-plain-safe-out
//                             c = flow-key  ⇒ ns-plain-safe-in
// [128] ns-plain-safe-out ::= ns-char
// [129]  ns-plain-safe-in ::= ns-char - c-flow-indicator
// [130]  ns-plain-char(c) ::=  ( ns-plain-safe(c) - “:” - “#” )
//                            | ( /* An ns-char preceding */ “#” )
//                            | ( “:” /* Followed by an ns-plain-safe(c) */ )
// `prev` is the previous code point, or -1 when `c` is the first character
// (no preceding character). -1 is not a valid code point, so it can never
// collide with a real one and safely disables the prev-dependent cases below.
function isPlainSafe (c: number, prev: number, inblock: boolean) {
  const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c)
  const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c)
  return (
    (
      // ns-plain-safe
      inblock // c = flow-in
        ? cIsNsCharOrWhitespace
        : cIsNsCharOrWhitespace &&
          // - c-flow-indicator
          c !== CHAR_COMMA &&
          c !== CHAR_LEFT_SQUARE_BRACKET &&
          c !== CHAR_RIGHT_SQUARE_BRACKET &&
          c !== CHAR_LEFT_CURLY_BRACKET &&
          c !== CHAR_RIGHT_CURLY_BRACKET
    ) &&
    // ns-plain-char
    c !== CHAR_SHARP && // false on '#'
    !(prev === CHAR_COLON && !cIsNsChar)
  ) || // false on ': '
  (isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP) || // change to true on '[^ ]#'
  (prev === CHAR_COLON && cIsNsChar &&
    // outside block context a following c-flow-indicator is not ns-plain-safe
    (inblock ||
      (c !== CHAR_COMMA &&
       c !== CHAR_LEFT_SQUARE_BRACKET &&
       c !== CHAR_RIGHT_SQUARE_BRACKET &&
       c !== CHAR_LEFT_CURLY_BRACKET &&
       c !== CHAR_RIGHT_CURLY_BRACKET))) // change to true on ':[^ ]'
}

// Simplified test for values allowed as the first character in plain style.
function isPlainSafeFirst (c: number) {
  // Uses a subset of ns-char - c-indicator
  // where ns-char = nb-char - s-white.
  // No support of ( ( “?” | “:” | “-” ) /* Followed by an ns-plain-safe(c)) */ ) part
  return isPrintable(c) &&
    c !== CHAR_BOM &&
    !isWhitespace(c) && // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    c !== CHAR_MINUS &&
    c !== CHAR_QUESTION &&
    c !== CHAR_COLON &&
    c !== CHAR_COMMA &&
    c !== CHAR_LEFT_SQUARE_BRACKET &&
    c !== CHAR_RIGHT_SQUARE_BRACKET &&
    c !== CHAR_LEFT_CURLY_BRACKET &&
    c !== CHAR_RIGHT_CURLY_BRACKET &&
    // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    c !== CHAR_SHARP &&
    c !== CHAR_AMPERSAND &&
    c !== CHAR_ASTERISK &&
    c !== CHAR_EXCLAMATION &&
    c !== CHAR_VERTICAL_LINE &&
    c !== CHAR_EQUALS &&
    c !== CHAR_GREATER_THAN &&
    c !== CHAR_SINGLE_QUOTE &&
    c !== CHAR_DOUBLE_QUOTE &&
    // | “%” | “@” | “`”)
    c !== CHAR_PERCENT &&
    c !== CHAR_COMMERCIAL_AT &&
    c !== CHAR_GRAVE_ACCENT
}

function isPlainSafeAtStart (string: string, inblock: boolean) {
  const first = codePointAt(string, 0)

  if (isPlainSafeFirst(first)) return true

  if (
    string.length > 1 &&
    (first === CHAR_MINUS || first === CHAR_QUESTION || first === CHAR_COLON)
  ) {
    const second = codePointAt(string, 1)

    // The relaxed isPlainSafe() accepts whitespace inside a scalar, but the
    // indicator exception in ns-plain-first requires an ns-plain-safe
    // *non-space* character. Otherwise `- value` and `? value` start block
    // collections instead of plain scalars.
    return !isWhitespace(second) && isPlainSafe(second, first, inblock)
  }

  return false
}

// Simplified test for values allowed as the last character in plain style.
function isPlainSafeLast (c: number) {
  // just not whitespace or colon, it will be checked to be plain character later
  return !isWhitespace(c) && c !== CHAR_COLON
}

// Same as 'string'.codePointAt(pos), but works in older browsers.
function codePointAt (string: string, pos: number) {
  const first = string.charCodeAt(pos)
  let second

  if (first >= 0xD800 && first <= 0xDBFF && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1)
    if (second >= 0xDC00 && second <= 0xDFFF) {
      // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000
    }
  }
  return first
}

function needIndentIndicator (string: string) {
  const leadingSpaceRe = /^\n* /
  return leadingSpaceRe.test(string)
}

const STYLE_PLAIN = 1
const STYLE_SINGLE = 2
const STYLE_LITERAL = 3
const STYLE_FOLDED = 4
const STYLE_DOUBLE = 5

type ScalarStyleId =
  typeof STYLE_PLAIN |
  typeof STYLE_SINGLE |
  typeof STYLE_LITERAL |
  typeof STYLE_FOLDED |
  typeof STYLE_DOUBLE

// Determines which scalar styles are possible and returns the preferred style.
// lineWidth = -1 => no limit.
// Pre-conditions: str.length > 0.
// Post-conditions:
//    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
//    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
//    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
function chooseScalarStyle (state: PresenterState, string: string, layout: ReturnType<typeof scalarLayout>,
  singleLineOnly: boolean, forceQuote: boolean, inblock: boolean): ScalarStyleId {
  const { blockIndent, lineWidth } = layout
  let i
  let char = 0
  let prevChar = -1 // -1 = no previous character yet (see isPlainSafe)
  let hasLineBreak = false
  let hasFoldableLine = false // only checked if shouldTrackWidth
  const shouldTrackWidth = lineWidth !== -1
  let previousLineBreak = -1 // count the first line correctly
  // Document markers are recognized as whole tokens at the start of a line,
  // so character-level plain-scalar checks alone cannot reject them.
  let plain = !startsWithDocumentSeparator(string) &&
    isPlainSafeAtStart(string, inblock) &&
    isPlainSafeLast(codePointAt(string, string.length - 1))

  if (singleLineOnly || forceQuote) {
    // Case: no block styles.
    // Check for disallowed characters to rule out plain and single.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i)
      if (!isPrintable(char)) {
        return STYLE_DOUBLE
      }
      plain = plain && isPlainSafe(char, prevChar, inblock)
      prevChar = char
    }
  } else {
    // Case: block styles permitted.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i)
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true
        // Check if any line can be folded.
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine ||
            // Foldable line = too long, and not more-indented.
            (i - previousLineBreak - 1 > lineWidth &&
             !isMoreIndented(string[previousLineBreak + 1]))
          previousLineBreak = i
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE
      }
      plain = plain && isPlainSafe(char, prevChar, inblock)
      prevChar = char
    }
    // in case the end is missing a \n
    hasFoldableLine = hasFoldableLine || (shouldTrackWidth &&
      (i - previousLineBreak - 1 > lineWidth &&
       !isMoreIndented(string[previousLineBreak + 1])))
  }
  // Although every style can represent \n without escaping, prefer block styles
  // for multiline, since they're more readable and they don't add empty lines.
  // Also prefer folding a super-long line.
  if (!hasLineBreak && !hasFoldableLine) {
    // Syntactic verdict only: whether the bare text round-trips to the node's
    // tag is a semantic check the caller applies (see resolveScalarStyle).
    if (plain && !forceQuote) return STYLE_PLAIN
    return state.quoteStyle === 'double' ? STYLE_DOUBLE : STYLE_SINGLE
  }
  // Edge case: block indentation indicator can only have one digit.
  if (blockIndent > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE
  }
  // At this point we know block styles are valid.
  // Prefer literal style unless we want to fold.
  return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL
}

// Renders `string` in the given numeric style with the given layout.
// NB. We drop the last trailing newline (if any) of a returned block scalar
//  since the dumper adds its own newline. This always works:
//    • No ending newline => unaffected; already using strip "-" chomping.
//    • Ending newline    => removed then restored.
//  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
function renderScalarStyle (string: string, style: ScalarStyleId, layout: ReturnType<typeof scalarLayout>) {
  const { indent, blockIndent, lineWidth } = layout

  switch (style) {
    case STYLE_PLAIN:
      return encodeFlowBreaks(string, indent)
    case STYLE_SINGLE:
      return `'${encodeFlowBreaks(string, indent).replace(/'/g, "''")}'`
    case STYLE_LITERAL:
      return '|' + blockHeader(string, blockIndent) +
        dropEndingNewline(indentString(string, indent))
    case STYLE_FOLDED:
      return '>' + blockHeader(string, blockIndent) +
        dropEndingNewline(indentString(foldBlockScalar(string, lineWidth), indent))
    case STYLE_DOUBLE:
      return `"${escapeString(string)}"`
  }
}

// Picks the scalar style for `node`: a style hint carried on the node wins,
// otherwise the style chosen by the machinery. Returns a numeric STYLE_*.
function resolveScalarStyle (state: PresenterState, node: ScalarNode,
  layout: ReturnType<typeof scalarLayout>, iskey: boolean, inblock: boolean): ScalarStyleId {
  // Without knowing if keys are implicit/explicit, assume implicit for safety.
  const singleLineOnly = iskey || !inblock

  // Style hints carried on the node take precedence. They were valid in their
  // original context; only a parent change can break them, and only block
  // styles in a single-line context — quoted styles survive any context. A
  // rejected block hint falls through to selection by content below.
  if (node.style.singleQuoted) return STYLE_SINGLE
  if (node.style.doubleQuoted) return STYLE_DOUBLE
  if (!singleLineOnly) {
    if (node.style.literal) return STYLE_LITERAL
    if (node.style.folded) return STYLE_FOLDED
  }

  // `quoteFlowKeys` applies to flow mapping keys (`iskey && !inblock`). The
  // style is forced here rather than by wrapping the rendered text in quotes:
  // escaping then matches the style, quoting is applied once, and a non-default
  // tag is still printed, so the key keeps its value. Double-quoted is the only
  // style that can hold every scalar, so no case has to fall back.
  if (iskey && !inblock && state.quoteFlowKeys) return STYLE_DOUBLE

  const string = node.value

  if (string.length === 0) {
    // An empty scalar is safe when its tag is explicit or resolves back to the
    // node tag (notably, the default null representation). A real empty string
    // does neither and therefore remains quoted.
    if (node.style.tagged || state.schema.resolveImplicitScalarTag(string).tag.tagName === node.tag) return STYLE_PLAIN
    return state.quoteStyle === 'double' ? STYLE_DOUBLE : STYLE_SINGLE
  }

  // v4's forceQuotes deliberately excluded keys. Keys are still quoted when
  // syntax or tag resolution requires it, using quoteStyle as the preference.
  const style = chooseScalarStyle(
    state, string, layout, singleLineOnly, state.forceQuotes && !iskey, inblock)

  // Plain writes no tag, so it round-trips only if the bare text resolves back
  // to the node's tag (or the tag gets printed explicitly). Else downgrade.
  // Downgrade to the preferred quote style here.
  if (style === STYLE_PLAIN && !node.style.tagged &&
      state.schema.resolveImplicitScalarTag(string).tag.tagName !== node.tag) {
    return state.quoteStyle === 'double' ? STYLE_DOUBLE : STYLE_SINGLE
  }
  return style
}

// Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
function blockHeader (string: string, indentPerLevel: number) {
  const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : ''

  // note the special case: the string '\n' counts as a "trailing" empty line.
  const clip = string[string.length - 1] === '\n'
  const keep = clip && (string[string.length - 2] === '\n' || string === '\n')
  const chomp = keep ? '+' : (clip ? '' : '-')

  return `${indentIndicator}${chomp}\n`
}

// Flow scalars (plain, single-quoted) fold line breaks: a run of k source line
// breaks reparses to k-1 literal `\n`. So a single break is just line-wrapping
// (folds back to a space), while a literal `\n` in the value must be emitted as
// a blank line (two breaks). Encode each run of p literal `\n` as p+1 breaks and
// indent the following content line so the continuation isn't read as a new node
// (a bare break would yield invalid "deficient indentation" output).
// `foldBlockScalar` can't be reused here: it treats a leading white space as a
// "more-indented" line and suppresses the doubling, which a flow scalar must not.
function encodeFlowBreaks (string: string, indent: number) {
  let nextLF = string.indexOf('\n')
  if (nextLF === -1) return string

  const pad = ' '.repeat(indent)
  let result = string.slice(0, nextLF) // first line follows the quote, no indent

  const lineRe = /(\n+)([^\n]*)/g
  lineRe.lastIndex = nextLF
  let match
  while ((match = lineRe.exec(string))) {
    const breaks = match[1].length
    const line = match[2]
    // line === '' only at the end (the greedy \n+ leaves no empty line mid-string);
    // pad it so the closing quote carries indent instead of sitting at column 0.
    result += '\n'.repeat(breaks + 1) + pad + line
  }

  return result
}

// Strips one trailing newline from a block scalar: the dumper adds its own,
// so without this a "+" (keep) chomp would gain an extra blank line.
function dropEndingNewline (string: string) {
  return string[string.length - 1] === '\n' ? string.slice(0, -1) : string
}

// A more-indented line is one starting with white space: YAML 1.2.2 [175]
// s-nb-spaced-text, whose [33] s-white is a space *or a tab*. Matches the
// parser's test in getBlockValue().
function isMoreIndented (char: string) {
  return char === ' ' || char === '\t'
}

// Note: a long line without a suitable break point will exceed the width limit.
// Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
function foldBlockScalar (string: string, width: number) {
  // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
  // unless they're before or after a more-indented line, or at the very
  // beginning or end, in which case $k$ maps to $k$.
  // Therefore, parse each chunk as newline(s) followed by a content line.
  const lineRe = /(\n+)([^\n]*)/g

  // first line (possibly an empty line)
  let nextLF = string.indexOf('\n')
  if (nextLF === -1) nextLF = string.length
  lineRe.lastIndex = nextLF
  let result = foldLine(string.slice(0, nextLF), width)
  // If we haven't reached the first content line yet, don't add an extra \n.
  let prevMoreIndented = string[0] === '\n' || isMoreIndented(string[0])
  let moreIndented

  // rest of the lines
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

// Greedy line breaking.
// Picks the longest line under the limit each time,
// otherwise settles for the shortest line over the limit.
// NB. More-indented lines *cannot* be folded, as that would add an extra \n.
function foldLine (line: string, width: number) {
  if (line === '' || isMoreIndented(line[0])) return line

  // Since a more-indented line adds a \n, breaks can't be followed by white space.
  const breakRe = / [^ \t]/g // note: the match index will always be <= length-2.
  let match
  // start is an inclusive index. end, curr, and next are exclusive.
  let start = 0
  let end
  let curr = 0
  let next = 0
  let result = ''

  // Invariants: 0 <= start <= length-1.
  //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
  // Inside the loop:
  //   A match implies length >= 2, so curr and next are <= length-2.
  while ((match = breakRe.exec(line))) {
    next = match.index
    // maintain invariant: curr - start <= width
    if (next - start > width) {
      end = (curr > start) ? curr : next // derive end <= length-2
      result += `\n${line.slice(start, end)}`
      // skip the space that was output as \n
      start = end + 1                    // derive start <= length-1
    }
    curr = next
  }

  // By the invariants, start <= length-1, so there is something left over.
  // It is either the whole string or a part starting from non-whitespace.
  result += '\n'
  // Insert a break if the remainder is too long and there is a break available.
  if (line.length - start > width && curr > start) {
    result += `${line.slice(start, curr)}\n${line.slice(curr + 1)}`
  } else {
    result += line.slice(start)
  }

  return result.slice(1) // drop extra \n joiner
}

function escapeString (string: string) {
  let result = ''
  let char = 0

  for (let i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
    char = codePointAt(string, i)
    const escapeSeq = ESCAPE_SEQUENCES[char]

    if (escapeSeq) {
      result += escapeSeq
      continue
    }

    if (isPrintable(char)) {
      result += string[i]
      if (char >= 0x10000) result += string[i + 1]
      continue
    }

    result += encodeNonPrintable(char)
  }

  return result
}

function writeFlowSequence (state: PresenterState, level: number, node: SequenceNode) {
  let result = ''

  for (let index = 0, length = node.items.length; index < length; index += 1) {
    const item = writeNode(state, level, node.items[index], {})
    if (result !== '') result += `,${!state.flowSkipCommaSpace ? ' ' : ''}`
    result += item
  }

  const pad = state.flowBracketPadding && result !== '' ? ' ' : ''
  return `[${pad}${result}${pad}]`
}

function writeBlockSequence (state: PresenterState, level: number, node: SequenceNode, compact: boolean) {
  let result = ''

  for (let index = 0, length = node.items.length; index < length; index += 1) {
    const item = writeNode(state, level + 1, node.items[index],
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
  const items = sortMappingItems(state, node.items)

  for (const { key, value } of items) {
    let pairBuffer = ''
    if (result !== '') pairBuffer += `,${!state.flowSkipCommaSpace ? ' ' : ''}`

    // `quoteFlowKeys` is applied while rendering the key (see
    // resolveScalarStyle), not by wrapping the rendered text.
    const keyText = writeNode(state, level, key, { iskey: true })
    const explicitPair = keyText.length > 1024

    if (explicitPair) pairBuffer += '? '

    const valueText = writeNode(state, level, value, {})
    // No separating space when the value renders empty (e.g. null → '').
    const sep = state.flowSkipColonSpace || valueText === '' ? '' : ' '

    pairBuffer += `${keyText}:${sep}${valueText}`

    result += pairBuffer
  }

  const pad = state.flowBracketPadding && result !== '' ? ' ' : ''
  return `{${pad}${result}${pad}}`
}

// A scalar key sorts by its text; the default sort and a custom comparator both
// see that, matching the original keys-array sort.
function sortKeyValue (key: Node): any {
  return key.kind === 'scalar' ? key.value : key
}

function sortMappingItems (state: PresenterState, items: MappingNode['items']) {
  if (!state.sortKeys) return items

  const copy = items.slice()

  if (state.sortKeys === true) {
    copy.sort((a, b) => {
      const x = sortKeyValue(a.key)
      const y = sortKeyValue(b.key)
      if (x < y) return -1
      if (x > y) return 1
      return 0
    })
  } else {
    const fn = state.sortKeys
    copy.sort((a, b) => fn(sortKeyValue(a.key), sortKeyValue(b.key)))
  }

  return copy
}

function writeBlockMapping (state: PresenterState, level: number, node: MappingNode, compact: boolean) {
  let result = ''
  const items = sortMappingItems(state, node.items)

  for (let index = 0, length = items.length; index < length; index += 1) {
    let pairBuffer = ''

    if (!compact || result !== '') {
      pairBuffer += generateNextLine(state, level)
    }

    const { key, value } = items[index]

    // A block key — a block collection (mapping/sequence) or a block scalar
    // (literal/folded) — can't sit on a `key:` line, so it's written with block
    // context and the pair takes the explicit `? key / : value` form. A simple
    // scalar key stays inline (flow-vs-block is invisible there).
    const keyIsBlock =
      ((key.kind === 'mapping' || key.kind === 'sequence') &&
        !key.style.flow && key.items.length !== 0) ||
      (key.kind === 'scalar' && (key.style.literal || key.style.folded))

    // The `?`/`:` indicators shift content right like a `-`, so a block key or
    // value that stays on the indicator line keeps its indentation under
    // seqNoIndent (`isblockseq`). One that drops to its own line (tag/anchor)
    // collapses to the parent indent, so leave the flag off there.
    const keyText = keyIsBlock
      ? writeNode(state, level + 1, key,
        { block: true, compact: true, isblockseq: !cannotBeCompact(state, key, level + 1) })
      : writeNode(state, level + 1, key, { block: true, compact: true, iskey: true })

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

    const valueText = writeNode(state, level + 1, value,
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
  return node.style.tagged || node.anchor !== undefined || (state.indent < 2 && level > 0)
}

function writeNode (state: PresenterState, level: number, node: Node, ctx: NodeContext): string {
  if (node.kind === 'alias') return `*${node.anchor}`

  const { block = false, iskey = false, isblockseq = false } = ctx
  let compact = ctx.compact ?? false

  const hasAnchor = node.anchor !== undefined

  if (cannotBeCompact(state, node, level)) {
    compact = false
  }

  let body: string
  let shouldPrintTag = node.style.tagged
  const useBlockCollection = block &&
    (node.kind === 'mapping' || node.kind === 'sequence') &&
    !node.style.flow && node.items.length !== 0

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
    const layout = scalarLayout(state, level)
    const style = resolveScalarStyle(state, node, layout, iskey, block)
    body = renderScalarStyle(node.value, style, layout)
    shouldPrintTag = node.style.tagged || (style !== STYLE_PLAIN && node.tag !== state.defaultScalarTagName)
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
    !node.style.flow &&
    node.items.length !== 0 &&
    !node.style.tagged &&
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
    !leaf.style.flow && leaf.items.length !== 0) {
    leaf = leaf.kind === 'sequence'
      ? leaf.items[leaf.items.length - 1]
      : leaf.items[leaf.items.length - 1].value
  }

  if (leaf.kind !== 'scalar' || !(leaf.style.literal || leaf.style.folded)) return false
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
      const body = writeNode(state, 0, doc.contents, { block: true, compact: true })
      // Content shares the `---` line, except: an empty render (no separator at
      // all), a bare block collection (wraps to the next line), or directives
      // forcing `---` onto its own line.
      const sep = body === '' ? '' : (hasDirectives || rootStartsOwnLine(doc.contents) ? '\n' : ' ')
      result += `---${sep}${body}\n`
    } else {
      result += writeNode(state, 0, doc.contents, { block: true, compact: true }) + '\n'
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
