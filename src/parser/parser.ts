import {
  EVENT_ID,
  SCALAR_STYLE,
  COLLECTION_STYLE,
  CHOMPING_MODE,
  type Event,
  type ScalarStyle,
  type CollectionStyle,
  type ChompingMode,
  type DocumentDirective,
  type TagHandlers
} from './events.ts'
import { YAMLException } from '../common/exception.ts'

const NO_RANGE = -1
const HAS_OWN = Object.prototype.hasOwnProperty

const CONTEXT_FLOW_IN = 1
const CONTEXT_FLOW_OUT = 2
const CONTEXT_BLOCK_IN = 3
const CONTEXT_BLOCK_OUT = 4

// eslint-disable-next-line no-control-regex
const PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/
// eslint-disable-next-line no-useless-escape
const PATTERN_FLOW_INDICATORS = /[,\[\]{}]/
// YAML 1.2.2, [91] c-tag-handle.
// eslint-disable-next-line no-useless-escape
const PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/
// YAML 1.2.2, [39] ns-uri-char.
// eslint-disable-next-line no-useless-escape
const NS_URI_CHAR = String.raw`(?:%[0-9A-Fa-f]{2}|[0-9A-Za-z\-#;/?:@&=+$,_.!~*'()\[\]])`
// YAML 1.2.2, [40] ns-tag-char = ns-uri-char - "!" - c-flow-indicator.
// eslint-disable-next-line no-useless-escape
const NS_TAG_CHAR = String.raw`(?:%[0-9A-Fa-f]{2}|[0-9A-Za-z\-#;/?:@&=+$.~*'()_])`
const PATTERN_TAG_URI = new RegExp(`^(?:${NS_URI_CHAR})*$`)
// YAML 1.2.2, [99] c-ns-shorthand-tag suffix part.
const PATTERN_TAG_SUFFIX = new RegExp(`^(?:${NS_TAG_CHAR})+$`)
// YAML 1.2.2, [93] ns-tag-prefix.
const PATTERN_TAG_PREFIX = new RegExp(`^(?:!(?:${NS_URI_CHAR})*|${NS_TAG_CHAR}(?:${NS_URI_CHAR})*)$`)

type NodeContext =
  typeof CONTEXT_FLOW_IN | typeof CONTEXT_FLOW_OUT |
  typeof CONTEXT_BLOCK_IN | typeof CONTEXT_BLOCK_OUT

interface NodeProperties {
  anchorStart: number
  anchorEnd: number
  tagStart: number
  tagEnd: number
}

interface ParserSnapshot {
  position: number
  line: number
  lineStart: number
  lineIndent: number
  firstTabInLine: number
  eventsLength: number
}

/** @category Events */
interface ParserOptions {
  /**
   * File path used in error messages.
   *
   * @defaultValue `null`
   */
  filename?: string

  /**
   * Maximum nesting depth for collections. Aliases are not taken into account.
   *
   * @defaultValue `100`
   */
  maxDepth?: number
}

const DEFAULT_PARSER_OPTIONS: Required<ParserOptions> = {
  filename: '',
  maxDepth: 100
}

interface ParserState extends Required<ParserOptions> {
  input: string
  length: number
  position: number
  line: number
  lineStart: number
  lineIndent: number
  firstTabInLine: number
  depth: number
  directives: DocumentDirective[]
  tagHandlers: TagHandlers
  events: Event[]
}

function addDocumentEvent (
  state: ParserState,
  explicitStart: boolean,
  explicitEnd: boolean
) {
  state.events.push({
    type: EVENT_ID.DOCUMENT,
    explicitStart,
    explicitEnd,
    directives: state.directives
  })
}

function addSequenceEvent (
  state: ParserState,
  start: number,
  anchorStart: number,
  anchorEnd: number,
  tagStart: number,
  tagEnd: number,
  style: CollectionStyle
) {
  state.events.push({
    type: EVENT_ID.SEQUENCE,
    start,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style
  })
}

function addMappingEvent (
  state: ParserState,
  start: number,
  anchorStart: number,
  anchorEnd: number,
  tagStart: number,
  tagEnd: number,
  style: CollectionStyle
) {
  state.events.push({
    type: EVENT_ID.MAPPING,
    start,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style
  })
}

function insertFlowPairMappingEvent (state: ParserState, snapshot: ParserSnapshot) {
  state.events.splice(snapshot.eventsLength, 0, {
    type: EVENT_ID.MAPPING,
    start: snapshot.position,
    anchorStart: NO_RANGE,
    anchorEnd: NO_RANGE,
    tagStart: NO_RANGE,
    tagEnd: NO_RANGE,
    style: COLLECTION_STYLE.FLOW
  })
}

function addScalarEvent (
  state: ParserState,
  valueStart: number,
  valueEnd: number,
  anchorStart: number,
  anchorEnd: number,
  tagStart: number,
  tagEnd: number,
  style: ScalarStyle,
  chomping: ChompingMode = CHOMPING_MODE.CLIP,
  indent = -1,
  fast = false
) {
  state.events.push({
    type: EVENT_ID.SCALAR,
    valueStart,
    valueEnd,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style,
    chomping,
    indent,
    fast
  })
}

function addAliasEvent (
  state: ParserState,
  anchorStart: number,
  anchorEnd: number
) {
  state.events.push({
    type: EVENT_ID.ALIAS,
    anchorStart,
    anchorEnd
  })
}

function addPopEvent (state: ParserState) {
  state.events.push({ type: EVENT_ID.POP })
}

function addEmptyScalarEvent (state: ParserState) {
  addScalarEvent(
    state,
    NO_RANGE,
    NO_RANGE,
    NO_RANGE,
    NO_RANGE,
    NO_RANGE,
    NO_RANGE,
    SCALAR_STYLE.PLAIN
  )
}

function emptyProperties (): NodeProperties {
  return {
    anchorStart: NO_RANGE,
    anchorEnd: NO_RANGE,
    tagStart: NO_RANGE,
    tagEnd: NO_RANGE
  }
}

function snapshotState (state: ParserState): ParserSnapshot {
  return {
    position: state.position,
    line: state.line,
    lineStart: state.lineStart,
    lineIndent: state.lineIndent,
    firstTabInLine: state.firstTabInLine,
    eventsLength: state.events.length
  }
}

function restoreState (state: ParserState, snapshot: ParserSnapshot) {
  state.position = snapshot.position
  state.line = snapshot.line
  state.lineStart = snapshot.lineStart
  state.lineIndent = snapshot.lineIndent
  state.firstTabInLine = snapshot.firstTabInLine
  state.events.length = snapshot.eventsLength
}

function throwError (state: ParserState, message: string): never {
  YAMLException.throwAt(state.input.slice(0, state.length), state.position, message, state.filename)
}

function isEol (c: number) {
  return c === 0x0A/* LF */ || c === 0x0D/* CR */
}

function isWhiteSpace (c: number) {
  return c === 0x09/* Tab */ || c === 0x20/* Space */
}

function isWsOrEol (c: number) {
  return isWhiteSpace(c) || isEol(c)
}

function isWsOrEolOrEnd (c: number) {
  return c === 0 || isWsOrEol(c)
}

function isFlowIndicator (c: number) {
  return c === 0x2C/* , */ ||
         c === 0x5B/* [ */ ||
         c === 0x5D/* ] */ ||
         c === 0x7B/* { */ ||
         c === 0x7D/* } */
}

function fromDecimalCode (c: number) {
  return c >= 0x30/* 0 */ && c <= 0x39/* 9 */ ? c - 0x30 : -1
}

function fromHexCode (c: number) {
  if (c >= 0x30/* 0 */ && c <= 0x39/* 9 */) return c - 0x30
  const lc = c | 0x20
  if (lc >= 0x61/* a */ && lc <= 0x66/* f */) return lc - 0x61 + 10
  return -1
}

function escapedHexLen (c: number) {
  if (c === 0x78/* x */) return 2
  if (c === 0x75/* u */) return 4
  if (c === 0x55/* U */) return 8
  return 0
}

function isSimpleEscape (c: number) {
  return c === 0x30/* 0 */ ||
         c === 0x61/* a */ ||
         c === 0x62/* b */ ||
         c === 0x74/* t */ ||
         c === 0x09/* Tab */ ||
         c === 0x6E/* n */ ||
         c === 0x76/* v */ ||
         c === 0x66/* f */ ||
         c === 0x72/* r */ ||
         c === 0x65/* e */ ||
         c === 0x20/* Space */ ||
         c === 0x22/* " */ ||
         c === 0x2F/* / */ ||
         c === 0x5C/* \ */ ||
         c === 0x4E/* N */ ||
         c === 0x5F/* _ */ ||
         c === 0x4C/* L */ ||
         c === 0x50/* P */
}

// Precondition: state.position points at LF or CR.
function consumeLineBreak (state: ParserState) {
  const ch = state.input.charCodeAt(state.position)

  if (ch === 0x0A/* LF */) {
    state.position++
  } else {
    state.position++
    if (state.input.charCodeAt(state.position) === 0x0A/* LF */) state.position++
  }

  state.line++
  state.lineStart = state.position
  state.lineIndent = 0
  state.firstTabInLine = -1
}

function skipSeparationSpace (state: ParserState, allowComments: boolean) {
  let lineBreaks = 0
  let ch = state.input.charCodeAt(state.position)
  let hasSeparation = state.position === state.lineStart ||
    isWsOrEol(state.input.charCodeAt(state.position - 1))

  while (ch !== 0) {
    while (isWhiteSpace(ch)) {
      hasSeparation = true
      if (ch === 0x09/* Tab */ && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position
      }
      ch = state.input.charCodeAt(++state.position)
    }

    if (allowComments && hasSeparation && ch === 0x23/* # */) {
      do { ch = state.input.charCodeAt(++state.position) }
      while (!isEol(ch) && ch !== 0)
    }

    if (!isEol(ch)) break

    consumeLineBreak(state)
    lineBreaks++
    hasSeparation = true
    ch = state.input.charCodeAt(state.position)

    while (ch === 0x20/* Space */) {
      state.lineIndent++
      ch = state.input.charCodeAt(++state.position)
    }
  }

  return lineBreaks
}

function testDocumentSeparator (state: ParserState, position = state.position) {
  const ch = state.input.charCodeAt(position)

  if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
      ch === state.input.charCodeAt(position + 1) &&
      ch === state.input.charCodeAt(position + 2)) {
    const following = state.input.charCodeAt(position + 3)
    return following === 0 || isWsOrEol(following)
  }

  return false
}

function skipByteOrderMark (state: ParserState) {
  if (state.position === state.lineStart &&
      state.input.charCodeAt(state.position) === 0xFEFF) {
    state.position++
    state.lineStart = state.position
  }
}

function testDocumentBoundary (state: ParserState) {
  if (state.position !== state.lineStart) return false

  // Fast path: most document boundaries do not have a BOM.
  if (testDocumentSeparator(state)) return true
  if (state.input.charCodeAt(state.position) !== 0xFEFF) return false

  // BOM-prefixed boundaries are rare, so snapshot/restore overhead is negligible.
  const snapshot = snapshotState(state)

  skipByteOrderMark(state)
  skipSeparationSpace(state, true)

  const ch = state.input.charCodeAt(state.position)
  const result = state.position === state.lineStart &&
    (ch === 0x25/* % */ || (ch === 0x2D/* - */ && testDocumentSeparator(state)))

  restoreState(state, snapshot)
  return result
}

function skipUntilLineEnd (state: ParserState) {
  let ch = state.input.charCodeAt(state.position)

  while (ch !== 0 && !isEol(ch)) {
    ch = state.input.charCodeAt(++state.position)
  }
}

function checkPrintable (state: ParserState, start: number, end: number) {
  if (PATTERN_NON_PRINTABLE.test(state.input.slice(start, end))) {
    throwError(state, 'the stream contains non-printable characters')
  }
}

function readTagProperty (state: ParserState, props: NodeProperties, inFlow: boolean) {
  if (state.input.charCodeAt(state.position) !== 0x21/* ! */) return false
  if (props.tagStart !== NO_RANGE) throwError(state, 'duplication of a tag property')

  const start = state.position
  let isVerbatim = false
  let isNamed = false
  let tagHandle = '!'
  let ch = state.input.charCodeAt(++state.position)

  if (ch === 0x3C/* < */) {
    isVerbatim = true
    ch = state.input.charCodeAt(++state.position)
  } else if (ch === 0x21/* ! */) {
    isNamed = true
    tagHandle = '!!'
    ch = state.input.charCodeAt(++state.position)
  }

  let suffixStart = state.position
  let tagName

  if (isVerbatim) {
    while (ch !== 0 && ch !== 0x3E/* > */) ch = state.input.charCodeAt(++state.position)
    if (ch !== 0x3E/* > */) throwError(state, 'unexpected end of the stream within a verbatim tag')
    tagName = state.input.slice(suffixStart, state.position)
    state.position++
  } else {
    while (ch !== 0 && !isWsOrEol(ch) && !(inFlow && isFlowIndicator(ch))) {
      if (ch === 0x21/* ! */) {
        if (!isNamed) {
          tagHandle = state.input.slice(suffixStart - 1, state.position + 1)
          if (!PATTERN_TAG_HANDLE.test(tagHandle)) throwError(state, 'named tag handle cannot contain such characters')
          isNamed = true
          suffixStart = state.position + 1
        } else {
          throwError(state, 'tag suffix cannot contain exclamation marks')
        }
      }

      ch = state.input.charCodeAt(++state.position)
    }

    tagName = state.input.slice(suffixStart, state.position)
    if (PATTERN_FLOW_INDICATORS.test(tagName)) throwError(state, 'tag suffix cannot contain flow indicator characters')
  }

  if (tagName && !(isVerbatim ? PATTERN_TAG_URI.test(tagName) : PATTERN_TAG_SUFFIX.test(tagName))) {
    throwError(state, `tag name cannot contain such characters: ${tagName}`)
  }
  try {
    decodeURIComponent(tagName)
  } catch {
    throwError(state, `tag name is malformed: ${tagName}`)
  }

  if (!isVerbatim && tagHandle !== '!' && tagHandle !== '!!' && !HAS_OWN.call(state.tagHandlers, tagHandle)) {
    throwError(state, `undeclared tag handle "${tagHandle}"`)
  }

  props.tagStart = start
  props.tagEnd = state.position
  return true
}

function readAnchorProperty (state: ParserState, props: NodeProperties) {
  if (state.input.charCodeAt(state.position) !== 0x26/* & */) return false
  if (props.anchorStart !== NO_RANGE) throwError(state, 'duplication of an anchor property')

  state.position++
  const start = state.position

  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position)) && !isFlowIndicator(state.input.charCodeAt(state.position))) {
    state.position++
  }

  if (state.position === start) throwError(state, 'name of an anchor node must contain at least one character')

  props.anchorStart = start
  props.anchorEnd = state.position
  return true
}

function readAlias (state: ParserState, props: NodeProperties) {
  if (state.input.charCodeAt(state.position) !== 0x2A/* * */) return false
  if (props.anchorStart !== NO_RANGE || props.tagStart !== NO_RANGE) {
    throwError(state, 'alias node should not have any properties')
  }

  state.position++
  const start = state.position

  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position)) && !isFlowIndicator(state.input.charCodeAt(state.position))) {
    state.position++
  }

  if (state.position === start) throwError(state, 'name of an alias node must contain at least one character')

  addAliasEvent(state, start, state.position)
  return true
}

function readFlowScalarBreak (state: ParserState, nodeIndent: number) {
  skipSeparationSpace(state, false)

  if (state.lineIndent < nodeIndent) {
    throwError(state, 'deficient indentation')
  }
}

function readSingleQuotedScalar (state: ParserState, nodeIndent: number, props: NodeProperties) {
  if (state.input.charCodeAt(state.position) !== 0x27/* ' */) return false

  state.position++
  const start = state.position
  // A single-quoted scalar is sliceable verbatim when it has no '' escape pairs
  // and no folded line breaks (see getScalarValue fast path).
  let simple = true

  while (state.input.charCodeAt(state.position) !== 0) {
    const ch = state.input.charCodeAt(state.position)

    if (ch === 0x27/* ' */) {
      if (state.input.charCodeAt(state.position + 1) === 0x27/* ' */) {
        simple = false
        state.position += 2
        continue
      }

      const end = state.position
      state.position++
      addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.SINGLE_QUOTED, CHOMPING_MODE.CLIP, -1, simple)
      return true
    }

    if (isEol(ch)) {
      simple = false
      readFlowScalarBreak(state, nodeIndent)
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a single quoted scalar')
    } else if (ch !== 0x09/* Tab */ && ch < 0x20) {
      throwError(state, 'expected valid JSON character')
    } else {
      state.position++
    }
  }

  throwError(state, 'unexpected end of the stream within a single quoted scalar')
}

function readDoubleQuotedScalar (state: ParserState, nodeIndent: number, props: NodeProperties) {
  if (state.input.charCodeAt(state.position) !== 0x22/* " */) return false

  state.position++
  const start = state.position
  // A double-quoted scalar is sliceable verbatim when it has no \ escapes and
  // no folded line breaks (see getScalarValue fast path).
  let simple = true

  while (state.input.charCodeAt(state.position) !== 0) {
    const ch = state.input.charCodeAt(state.position)

    if (ch === 0x22/* " */) {
      const end = state.position
      state.position++
      addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.DOUBLE_QUOTED, CHOMPING_MODE.CLIP, -1, simple)
      return true
    }

    if (ch === 0x5C/* \ */) {
      simple = false
      const escaped = state.input.charCodeAt(++state.position)

      if (isEol(escaped)) {
        readFlowScalarBreak(state, nodeIndent)
      } else if (isSimpleEscape(escaped)) {
        state.position++
      } else {
        let hexLength = escapedHexLen(escaped)

        if (hexLength === 0) throwError(state, 'unknown escape sequence')

        while (hexLength-- > 0) {
          state.position++
          if (fromHexCode(state.input.charCodeAt(state.position)) < 0) {
            throwError(state, 'expected hexadecimal character')
          }
        }
        state.position++
      }
    } else if (isEol(ch)) {
      simple = false
      readFlowScalarBreak(state, nodeIndent)
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a double quoted scalar')
    } else if (ch !== 0x09/* Tab */ && ch < 0x20) {
      throwError(state, 'expected valid JSON character')
    } else {
      state.position++
    }
  }

  throwError(state, 'unexpected end of the stream within a double quoted scalar')
}

function readBlockScalar (state: ParserState, parentIndent: number, props: NodeProperties) {
  const ch = state.input.charCodeAt(state.position)
  let chomping: ChompingMode = CHOMPING_MODE.CLIP
  let indent = -1
  let detectedIndent = false

  if (ch !== 0x7C/* | */ && ch !== 0x3E/* > */) return false

  const style = ch === 0x7C/* | */ ? SCALAR_STYLE.LITERAL_BLOCK : SCALAR_STYLE.FOLDED_BLOCK
  state.position++

  while (state.input.charCodeAt(state.position) !== 0) {
    const current = state.input.charCodeAt(state.position)
    const digit = fromDecimalCode(current)

    if (current === 0x2B/* + */ || current === 0x2D/* - */) {
      if (chomping !== CHOMPING_MODE.CLIP) throwError(state, 'repeat of a chomping mode identifier')
      chomping = current === 0x2B/* + */ ? CHOMPING_MODE.KEEP : CHOMPING_MODE.STRIP
      state.position++
    } else if (digit >= 0) {
      if (digit === 0) {
        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one')
      }
      if (detectedIndent) throwError(state, 'repeat of an indentation width identifier')
      indent = parentIndent + digit - 1
      detectedIndent = true
      state.position++
    } else {
      break
    }
  }

  let hadWhitespace = false
  while (isWhiteSpace(state.input.charCodeAt(state.position))) {
    hadWhitespace = true
    state.position++
  }
  if (hadWhitespace && state.input.charCodeAt(state.position) === 0x23/* # */) skipUntilLineEnd(state)

  if (isEol(state.input.charCodeAt(state.position))) {
    consumeLineBreak(state)
  } else if (state.input.charCodeAt(state.position) !== 0) {
    throwError(state, 'a line break is expected')
  }

  let contentIndent = detectedIndent ? indent : -1
  let maxLeadingIndent = 0
  const valueStart = state.position
  let valueEnd = state.position

  while (state.input.charCodeAt(state.position) !== 0) {
    const linePosition = state.position
    let column = 0

    while (state.input.charCodeAt(linePosition + column) === 0x20/* Space */) column++

    const first = state.input.charCodeAt(linePosition + column)
    if (first === 0) {
      // End of input acts as a line terminator, but there is no line break to
      // include here. A final all-spaces line still counts: when the block has a
      // content indent, the spaces beyond it are real content; in a wholly blank
      // block (contentIndent < 0) the spaces form a blank line that chomping must
      // see, exactly as it would if the line ended with a break. Capture the line
      // in both cases; otherwise the block ends at the start of this empty line.
      if (contentIndent >= 0) {
        if (column > contentIndent) valueEnd = linePosition + column
      } else if (column > 0) {
        valueEnd = linePosition + column
      }
      break
    }
    if (testDocumentBoundary(state)) break

    if (!detectedIndent && contentIndent === -1 && isEol(first)) {
      maxLeadingIndent = Math.max(maxLeadingIndent, column)
    }

    if (!detectedIndent && contentIndent === -1 && !isEol(first)) {
      if (first === 0x09/* Tab */ && column < parentIndent) {
        state.position = linePosition + column
        throwError(state, 'tab characters must not be used in indentation')
      }
      if (column < maxLeadingIndent) {
        state.position = linePosition + column
        throwError(state, 'bad indentation of a mapping entry')
      }
    }

    if (contentIndent === -1 && first !== 0 && !isEol(first) && column < parentIndent) {
      state.lineIndent = column
      state.position = linePosition + column
      break
    }

    if (!detectedIndent && first !== 0 && !isEol(first) && contentIndent === -1) {
      contentIndent = column
    }

    const requiredIndent = contentIndent === -1 ? parentIndent + 1 : contentIndent
    if (first !== 0 && !isEol(first) && column < requiredIndent) {
      state.lineIndent = column
      state.position = linePosition + column
      break
    }

    skipUntilLineEnd(state)
    valueEnd = state.position
    if (isEol(state.input.charCodeAt(state.position))) {
      consumeLineBreak(state)
      // Include the line break in the range so trailing blank lines are
      // preserved. This is what lets cook tell apart an empty `|+` (range "",
      // value "") from a `|+` with one blank line (range "\n", value "\n").
      // De-indent and chomping are applied later in getScalarValue.
      valueEnd = state.position
    }
  }

  checkPrintable(state, valueStart, valueEnd)
  addScalarEvent(
    state,
    valueStart,
    valueEnd,
    props.anchorStart,
    props.anchorEnd,
    props.tagStart,
    props.tagEnd,
    style,
    chomping,
    contentIndent
  )
  return true
}

function canStartPlainScalar (state: ParserState, nodeContext: NodeContext) {
  const ch = state.input.charCodeAt(state.position)
  const inFlow = nodeContext === CONTEXT_FLOW_IN

  if (ch === 0 ||
      isWsOrEol(ch) ||
      ch === 0x23/* # */ ||
      ch === 0x26/* & */ ||
      ch === 0x2A/* * */ ||
      ch === 0x21/* ! */ ||
      ch === 0x7C/* | */ ||
      ch === 0x3E/* > */ ||
      ch === 0x27/* ' */ ||
      ch === 0x22/* " */ ||
      ch === 0x25/* % */ ||
      ch === 0x40/* @ */ ||
      ch === 0x60/* ` */ ||
      (inFlow && isFlowIndicator(ch))) {
    return false
  }

  if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
    const following = state.input.charCodeAt(state.position + 1)
    if (isWsOrEolOrEnd(following) || (inFlow && isFlowIndicator(following))) return false
  }

  return true
}

function readPlainScalar (state: ParserState, nodeIndent: number, nodeContext: NodeContext, props: NodeProperties) {
  if (!canStartPlainScalar(state, nodeContext)) return false

  const start = state.position
  let end = state.position
  let ch = state.input.charCodeAt(state.position)
  const inFlow = nodeContext === CONTEXT_FLOW_IN
  // A single-line plain scalar is sliceable verbatim: the parser already trims
  // trailing whitespace from the range, so no folding is needed (see
  // getScalarValue fast path). Folded line breaks make it non-simple.
  let multiline = false

  while (ch !== 0) {
    if (testDocumentBoundary(state)) break

    if (ch === 0x3A/* : */) {
      const following = state.input.charCodeAt(state.position + 1)
      if (isWsOrEolOrEnd(following) || (inFlow && isFlowIndicator(following))) break
    } else if (ch === 0x23/* # */) {
      const preceding = state.input.charCodeAt(state.position - 1)
      if (isWsOrEol(preceding)) break
    } else if (inFlow && isFlowIndicator(ch)) {
      break
    } else if (isEol(ch)) {
      const savedPosition = state.position
      const savedLine = state.line
      const savedLineStart = state.lineStart
      const savedLineIndent = state.lineIndent

      skipSeparationSpace(state, false)

      if (state.lineIndent >= nodeIndent) {
        multiline = true
        ch = state.input.charCodeAt(state.position)
        continue
      }

      state.position = savedPosition
      state.line = savedLine
      state.lineStart = savedLineStart
      state.lineIndent = savedLineIndent
      break
    }

    if (!isWhiteSpace(ch)) end = state.position + 1
    ch = state.input.charCodeAt(++state.position)
  }

  if (end === start) return false

  checkPrintable(state, start, end)
  addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.PLAIN, CHOMPING_MODE.CLIP, -1, !multiline)
  return true
}

function findBlockMappingColon (state: ParserState) {
  let position = state.position
  let flowLevel = 0

  while (position < state.length) {
    const ch = state.input.charCodeAt(position)

    if (isEol(ch)) return -1
    if (ch === 0x23/* # */ && isWsOrEol(state.input.charCodeAt(position - 1))) return -1

    if ((ch === 0x2A/* * */ || ch === 0x26/* & */) && position === state.position) {
      do { position++ }
      while (state.input.charCodeAt(position) !== 0 &&
             !isWsOrEol(state.input.charCodeAt(position)) &&
             !isFlowIndicator(state.input.charCodeAt(position)))
      continue
    }

    if (ch === 0x5B/* [ */ || ch === 0x7B/* { */) {
      flowLevel++
    } else if (ch === 0x5D/* ] */ || ch === 0x7D/* } */) {
      if (flowLevel > 0) flowLevel--
    } else if (flowLevel === 0 && ch === 0x3A/* : */ && isWsOrEol(state.input.charCodeAt(position + 1))) {
      return position
    }

    if ((flowLevel > 0 || position === state.position) &&
        (ch === 0x27/* ' */ || ch === 0x22/* " */)) {
      const quote = ch
      position++

      while (position < state.length && state.input.charCodeAt(position) !== quote) {
        if (state.input.charCodeAt(position) === 0x5C/* \ */ && quote === 0x22/* " */) position++
        position++
      }
    }

    position++
  }

  return -1
}

function skipFlowSeparationSpace (state: ParserState, nodeIndent: number) {
  const startLine = state.line
  skipSeparationSpace(state, true)

  if ((state.line > startLine && state.lineIndent < nodeIndent) ||
      (state.firstTabInLine !== -1 && state.lineIndent < nodeIndent)) {
    throwError(state, 'deficient indentation')
  }
}

function readFlowCollection (state: ParserState, nodeIndent: number, props: NodeProperties) {
  const ch = state.input.charCodeAt(state.position)
  const isMapping = ch === 0x7B/* { */
  const start = state.position
  let readNext = true

  if (ch !== 0x5B/* [ */ && ch !== 0x7B/* { */) return false

  const terminator = isMapping ? 0x7D/* } */ : 0x5D/* ] */

  if (isMapping) {
    addMappingEvent(state, start, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.FLOW)
  } else {
    addSequenceEvent(state, start, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.FLOW)
  }

  state.position++

  while (state.input.charCodeAt(state.position) !== 0) {
    skipFlowSeparationSpace(state, nodeIndent)

    let ch = state.input.charCodeAt(state.position)

    if (ch === terminator) {
      state.position++
      addPopEvent(state)
      return true
    } else if (!readNext) {
      throwError(state, 'missed comma between flow collection entries')
    } else if (ch === 0x2C/* , */) {
      throwError(state, "expected the node content, but found ','")
    }

    let isPair = false
    let isExplicitPair = false

    if (ch === 0x3F/* ? */ && isWsOrEol(state.input.charCodeAt(state.position + 1))) {
      isPair = isExplicitPair = true
      state.position += 1
      skipFlowSeparationSpace(state, nodeIndent)
    }

    const entryLine = state.line
    const entryStart = snapshotState(state)

    const keyWasRead = parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true)
    skipFlowSeparationSpace(state, nodeIndent)

    ch = state.input.charCodeAt(state.position)

    if ((isMapping || isExplicitPair || state.line === entryLine) && ch === 0x3A/* : */) {
      isPair = true
      state.position++
      skipFlowSeparationSpace(state, nodeIndent)
      if (!isMapping) {
        insertFlowPairMappingEvent(state, entryStart)
        if (!keyWasRead) addEmptyScalarEvent(state)
      } else if (!keyWasRead) {
        addEmptyScalarEvent(state)
      }
      if (!parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true)) {
        addEmptyScalarEvent(state)
      }
      skipFlowSeparationSpace(state, nodeIndent)
      if (!isMapping) addPopEvent(state)
    } else if (isMapping && isPair) {
      if (!keyWasRead) addEmptyScalarEvent(state)
      addEmptyScalarEvent(state)
    } else if (isMapping) {
      addEmptyScalarEvent(state)
    } else if (isPair) {
      insertFlowPairMappingEvent(state, entryStart)
      if (!keyWasRead) addEmptyScalarEvent(state)
      addEmptyScalarEvent(state)
      addPopEvent(state)
    }

    ch = state.input.charCodeAt(state.position)

    if (ch === 0x2C/* , */) {
      readNext = true
      state.position++
    } else {
      readNext = false
    }
  }

  throwError(state, 'unexpected end of the stream within a flow collection')
}

function readBlockSequence (state: ParserState, nodeIndent: number, props: NodeProperties) {
  if (state.firstTabInLine !== -1 || state.input.charCodeAt(state.position) !== 0x2D/* - */ || !isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) {
    return false
  }

  addSequenceEvent(state, state.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.BLOCK)

  while (state.input.charCodeAt(state.position) === 0x2D/* - */ && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine
      throwError(state, 'tab characters must not be used in indentation')
    }

    const entryLine = state.line
    state.position++

    const hadBreak = skipSeparationSpace(state, true) > 0
    if (state.firstTabInLine !== -1 &&
        state.input.charCodeAt(state.position) === 0x2D/* - */ &&
        isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) {
      throwError(state, 'bad indentation of a sequence entry')
    }

    if (hadBreak && state.lineIndent <= nodeIndent) {
      addEmptyScalarEvent(state)
    } else {
      parseNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true)
    }

    skipSeparationSpace(state, true)

    if (state.lineIndent < nodeIndent || state.position >= state.length) break
    if (state.lineIndent > nodeIndent) throwError(state, 'bad indentation of a sequence entry')
    if (state.line === entryLine &&
        state.input.charCodeAt(state.position) === 0x2D/* - */ &&
        isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) {
      throwError(state, 'bad indentation of a sequence entry')
    }
  }

  addPopEvent(state)
  return true
}

function readBlockMapping (state: ParserState, nodeIndent: number, flowIndent: number, props: NodeProperties) {
  let atExplicitKey = false
  let detected = false
  let mappingOpened = false
  let pendingExplicitKey = false

  if (state.firstTabInLine !== -1) return false

  let ch = state.input.charCodeAt(state.position)

  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine
      throwError(state, 'tab characters must not be used in indentation')
    }

    const following = state.input.charCodeAt(state.position + 1)
    const entryLine = state.line

    if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && isWsOrEolOrEnd(following)) {
      if (!mappingOpened) {
        addMappingEvent(state, state.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.BLOCK)
        mappingOpened = true
      }

      if (ch === 0x3F/* ? */) {
        if (atExplicitKey) addEmptyScalarEvent(state)
        detected = true
        atExplicitKey = true
      } else if (atExplicitKey) {
        atExplicitKey = false
      } else {
        addEmptyScalarEvent(state)
        detected = true
        atExplicitKey = false
      }

      state.position += 1
      pendingExplicitKey = true
    } else {
      // An explicit key awaiting its value, followed by an implicit key, means
      // the explicit key's value is empty. Emit it now (append-only) so it is
      // ordered before the implicit key node read just below.
      if (atExplicitKey) {
        addEmptyScalarEvent(state)
        atExplicitKey = false
      }

      const beforeKey = snapshotState(state)

      if (!parseNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        break
      }

      if (state.line === entryLine) {
        ch = state.input.charCodeAt(state.position)

        while (isWhiteSpace(ch)) {
          ch = state.input.charCodeAt(++state.position)
        }

        if (ch === 0x3A/* : */) {
          ch = state.input.charCodeAt(++state.position)

          if (!isWsOrEolOrEnd(ch)) {
            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping')
          }

          if (!mappingOpened) {
            restoreState(state, beforeKey)
            addMappingEvent(state, beforeKey.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.BLOCK)
            mappingOpened = true
            // The key, the `:` and the space after it were already validated
            // above, before the rollback. Re-reading the same input cannot
            // fail, so just consume it again without error checks.
            parseNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)

            ch = state.input.charCodeAt(state.position)
            while (isWhiteSpace(ch)) {
              ch = state.input.charCodeAt(++state.position)
            }

            state.position++
          }

          detected = true
          atExplicitKey = false
          pendingExplicitKey = false
        } else if (detected) {
          throwError(state, "expected ':' after a mapping key")
        } else {
          // Not a mapping. If outer properties are pending, roll back so the
          // caller re-reads this node with them attached (events are append-only).
          if (props.anchorStart !== NO_RANGE || props.tagStart !== NO_RANGE) {
            restoreState(state, beforeKey)
            return false
          }
          return true
        }
      } else if (detected) {
        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key')
      } else {
        if (props.anchorStart !== NO_RANGE || props.tagStart !== NO_RANGE) {
          restoreState(state, beforeKey)
          return false
        }
        return true
      }
    }

    if (parseNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, pendingExplicitKey)) {
      pendingExplicitKey = false
    }

    if (!atExplicitKey) {
      if (pendingExplicitKey) {
        addEmptyScalarEvent(state)
        pendingExplicitKey = false
      }
    }

    skipSeparationSpace(state, true)
    ch = state.input.charCodeAt(state.position)

    if ((state.line === entryLine || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, 'bad indentation of a mapping entry')
    } else if (state.lineIndent < nodeIndent) {
      break
    }
  }

  if (!detected) return false
  if (atExplicitKey) addEmptyScalarEvent(state)
  if (mappingOpened) addPopEvent(state)
  return true
}

function parseNode (
  state: ParserState,
  parentIndent: number,
  nodeContext: NodeContext,
  allowToSeek: boolean,
  allowCompact: boolean,
  allowPropertyMapping = true
): boolean {
  if (state.depth >= state.maxDepth) {
    throwError(state, `nesting exceeded maxDepth (${state.maxDepth})`)
  }

  state.depth++

  let indentStatus = 1
  let atNewLine = false
  let hasContent = false
  let propertyStart: ParserSnapshot | null = null
  const props = emptyProperties()

  let allowBlockScalars = nodeContext === CONTEXT_BLOCK_OUT || nodeContext === CONTEXT_BLOCK_IN
  let allowBlockCollections = allowBlockScalars
  const allowBlockStyles = allowBlockScalars

  if (allowToSeek && skipSeparationSpace(state, true)) {
    atNewLine = true

    if (state.lineIndent > parentIndent) {
      indentStatus = 1
    } else if (state.lineIndent === parentIndent) {
      indentStatus = 0
    } else {
      indentStatus = -1
    }
  }

  if (indentStatus === 1) {
    while (true) {
      const ch = state.input.charCodeAt(state.position)
      const propertyState = snapshotState(state)

      if (atNewLine &&
          indentStatus !== 1 &&
          (ch === 0x21/* ! */ || ch === 0x26/* & */)) {
        break
      }

      if (atNewLine &&
          allowBlockStyles &&
          (props.tagStart !== NO_RANGE || props.anchorStart !== NO_RANGE) &&
          (ch === 0x21/* ! */ || ch === 0x26/* & */)) {
        const fallbackState = snapshotState(state)
        const flowIndent = parentIndent + 1
        const mappingIndent = state.position - state.lineStart

        if (readBlockMapping(state, mappingIndent, flowIndent, props) &&
            state.events[fallbackState.eventsLength]?.type === EVENT_ID.MAPPING) {
          state.depth--
          return true
        }

        restoreState(state, fallbackState)
      }

      if (atNewLine &&
          ((ch === 0x21/* ! */ && props.tagStart !== NO_RANGE) ||
           (ch === 0x26/* & */ && props.anchorStart !== NO_RANGE))) {
        break
      }

      if (!readTagProperty(state, props, nodeContext === CONTEXT_FLOW_IN) && !readAnchorProperty(state, props)) {
        break
      }

      if (propertyStart === null) propertyStart = propertyState

      if (skipSeparationSpace(state, true)) {
        atNewLine = true
        allowBlockCollections = allowBlockStyles

        if (state.lineIndent > parentIndent) {
          indentStatus = 1
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0
        } else {
          indentStatus = -1
        }
      } else {
        allowBlockCollections = false
      }
    }
  }

  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact
  }

  if (indentStatus === 1 || nodeContext === CONTEXT_BLOCK_OUT) {
    const flowIndent = nodeContext === CONTEXT_FLOW_IN || nodeContext === CONTEXT_FLOW_OUT
      ? parentIndent
      : parentIndent + 1
    const blockIndent = state.position - state.lineStart

    if (indentStatus === 1) {
      if ((allowBlockCollections &&
          (readBlockSequence(state, blockIndent, props) ||
           readBlockMapping(state, blockIndent, flowIndent, props))) ||
          readFlowCollection(state, flowIndent, props)) {
        hasContent = true
      } else {
        const ch = state.input.charCodeAt(state.position)

        if (propertyStart !== null && allowPropertyMapping && allowBlockStyles && !allowBlockCollections &&
            ch !== 0x7C/* | */ && ch !== 0x3E/* > */) {
          const fallbackState = snapshotState(state)
          const propertyIndent = propertyStart.position - propertyStart.lineStart

          restoreState(state, propertyStart)

          if (readBlockMapping(state, propertyIndent, flowIndent, emptyProperties()) &&
              state.events[fallbackState.eventsLength]?.type === EVENT_ID.MAPPING) {
            hasContent = true
          } else {
            restoreState(state, fallbackState)
          }
        }

        if (!hasContent &&
            ((allowBlockScalars && readBlockScalar(state, flowIndent, props)) ||
             readSingleQuotedScalar(state, flowIndent, props) ||
             readDoubleQuotedScalar(state, flowIndent, props) ||
             readAlias(state, props) ||
             readPlainScalar(state, flowIndent, nodeContext, props))) {
          hasContent = true
        }
      }
    } else if (indentStatus === 0) {
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent, props)
    }
  }

  allowBlockScalars = allowBlockScalars && !hasContent

  if (!hasContent && (props.anchorStart !== NO_RANGE || props.tagStart !== NO_RANGE || allowBlockScalars)) {
    addScalarEvent(
      state,
      NO_RANGE,
      NO_RANGE,
      props.anchorStart,
      props.anchorEnd,
      props.tagStart,
      props.tagEnd,
      SCALAR_STYLE.PLAIN
    )
    hasContent = true
  }

  state.depth--
  return hasContent || props.anchorStart !== NO_RANGE || props.tagStart !== NO_RANGE
}

function readDirective (state: ParserState) {
  if (state.lineIndent > 0 || state.input.charCodeAt(state.position) !== 0x25/* % */) return false

  state.position++
  const nameStart = state.position

  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position))) state.position++

  const name = state.input.slice(nameStart, state.position)
  const args: string[] = []

  if (name.length === 0) throwError(state, 'directive name must not be less than one character in length')

  while (state.input.charCodeAt(state.position) !== 0 && !isEol(state.input.charCodeAt(state.position))) {
    while (isWhiteSpace(state.input.charCodeAt(state.position))) state.position++
    if (state.input.charCodeAt(state.position) === 0x23/* # */ || isEol(state.input.charCodeAt(state.position)) || state.input.charCodeAt(state.position) === 0) break

    const start = state.position
    while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position))) state.position++
    args.push(state.input.slice(start, state.position))
  }

  if (isEol(state.input.charCodeAt(state.position))) consumeLineBreak(state)

  if (name === 'YAML') {
    if (state.directives.some(directive => directive.kind === 'yaml')) throwError(state, 'duplication of %YAML directive')
    if (args.length !== 1) throwError(state, 'YAML directive accepts exactly one argument')

    const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0])
    if (match === null) throwError(state, 'ill-formed argument of the YAML directive')
    if (parseInt(match[1], 10) !== 1) throwError(state, 'unacceptable YAML version of the document')

    state.directives.push({ kind: 'yaml', version: args[0] })
  } else if (name === 'TAG') {
    if (args.length !== 2) throwError(state, 'TAG directive accepts exactly two arguments')

    const [handle, prefix] = args
    if (!PATTERN_TAG_HANDLE.test(handle)) throwError(state, 'ill-formed tag handle (first argument) of the TAG directive')
    if (HAS_OWN.call(state.tagHandlers, handle)) throwError(state, `there is a previously declared suffix for "${handle}" tag handle`)
    if (!PATTERN_TAG_PREFIX.test(prefix)) throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive')
    try {
      decodeURIComponent(prefix)
    } catch {
      throwError(state, `tag prefix is malformed: ${prefix}`)
    }

    state.tagHandlers[handle] = prefix
    state.directives.push({ kind: 'tag', handle, prefix })
  }

  return true
}

function readDocument (state: ParserState) {
  state.directives = []
  state.tagHandlers = Object.create(null)
  let hasDirectives = false

  skipSeparationSpace(state, true)

  while (readDirective(state)) {
    hasDirectives = true
    skipSeparationSpace(state, true)
  }

  let explicitStart = false
  let explicitEnd = false
  let allowCompact = true

  if (state.lineIndent === 0 &&
      state.input.charCodeAt(state.position) === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 2) === 0x2D/* - */ &&
      isWsOrEolOrEnd(state.input.charCodeAt(state.position + 3))) {
    explicitStart = true
    const markerLine = state.line
    state.position += 3
    skipSeparationSpace(state, true)
    allowCompact = state.line > markerLine
  } else if (hasDirectives) {
    throwError(state, 'directives end mark is expected')
  }

  const documentEventIndex = state.events.length
  if (!explicitStart &&
      state.position === state.lineStart &&
      state.input.charCodeAt(state.position) === 0x2E/* . */ &&
      testDocumentSeparator(state)) {
    state.position += 3
    skipSeparationSpace(state, true)
    return
  }

  addDocumentEvent(state, explicitStart, false)
  if (!parseNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, allowCompact, allowCompact)) {
    addEmptyScalarEvent(state)
  }
  skipSeparationSpace(state, true)

  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    explicitEnd = state.input.charCodeAt(state.position) === 0x2E/* . */
    if (explicitEnd) {
      const markerLine = state.line
      state.position += 3
      skipSeparationSpace(state, true)
      if (state.line === markerLine && state.position < state.length) {
        throwError(state, 'end of the stream or a document separator is expected')
      }
    }
  }

  const documentEvent = state.events[documentEventIndex]
  if (documentEvent?.type === EVENT_ID.DOCUMENT) documentEvent.explicitEnd = explicitEnd

  addPopEvent(state)

  if (!explicitEnd &&
      state.position < state.length &&
      !testDocumentBoundary(state)) {
    throwError(state, 'end of the stream or a document separator is expected')
  }
}

/**
 * Parses YAML into a flat event stream referencing source text by offsets.
 *
 * @category Events
 */
function parseEvents (input: string, options: ParserOptions): Event[] {
  const length = input.length
  const state: ParserState = {
    ...DEFAULT_PARSER_OPTIONS,
    ...options,
    input: `${input}\0`,
    length,
    position: 0,
    line: 0,
    lineStart: 0,
    lineIndent: 0,
    firstTabInLine: -1,
    depth: 0,
    directives: [],
    tagHandlers: Object.create(null),
    events: []
  }

  const nullpos = input.indexOf('\0')
  if (nullpos !== -1) YAMLException.throwAt(input, nullpos, 'null byte is not allowed in input', state.filename)

  while (state.position < state.length) {
    skipByteOrderMark(state)
    skipSeparationSpace(state, true)
    if (state.position >= state.length) break
    const documentStart = state.position
    readDocument(state)
    if (state.position === documentStart) {
      // Internal progress guard: if readDocument() ever returns without
      // consuming input, stop here instead of looping forever.
      /* c8 ignore next */
      throwError(state, 'can not read a document')
    }
  }

  return state.events
}

export {
  parseEvents,
  DEFAULT_PARSER_OPTIONS,
  type ParserOptions
}
