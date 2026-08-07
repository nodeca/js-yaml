import {
  SCALAR_STYLE,
  CHOMPING_MODE,
  type ScalarEvent
} from './events.ts'

const NO_RANGE = -1

// --- character helpers (mirrors src/loader.ts, kept self-contained here) ---

function simpleEscapeSequence (c: number) {
  switch (c) {
    case 0x30/* 0 */: return '\x00'
    case 0x61/* a */: return '\x07'
    case 0x62/* b */: return '\x08'
    case 0x74/* t */: return '\x09'
    case 0x09/* Tab */: return '\x09'
    case 0x6E/* n */: return '\x0A'
    case 0x76/* v */: return '\x0B'
    case 0x66/* f */: return '\x0C'
    case 0x72/* r */: return '\x0D'
    case 0x65/* e */: return '\x1B'
    case 0x20/* Space */: return ' '
    case 0x22/* " */: return '\x22'
    case 0x2F/* / */: return '/'
    case 0x5C/* \ */: return '\x5C'
    case 0x4E/* N */: return '\x85'
    case 0x5F/* _ */: return '\xA0'
    case 0x4C/* L */: return '\u2028'
    case 0x50/* P */: return '\u2029'
    default: return ''
  }
}

const simpleEscapeCheck = new Array(256)
const simpleEscapeMap = new Array(256)
for (let i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0
  simpleEscapeMap[i] = simpleEscapeSequence(i)
}

function charFromCodepoint (c: number) {
  if (c <= 0xFFFF) {
    return String.fromCharCode(c)
  }
  return String.fromCharCode(
    ((c - 0x010000) >> 10) + 0xD800,
    ((c - 0x010000) & 0x03FF) + 0xDC00
  )
}

function fromHexCode (c: number) {
  if (c >= 0x30/* 0 */ && c <= 0x39/* 9 */) return c - 0x30
  const lc = c | 0x20
  // Double-quoted scalar ranges are validated by parser.ts before cooking.
  return lc - 0x61 + 10
}

function escapedHexLen (c: number) {
  if (c === 0x78/* x */) return 2
  if (c === 0x75/* u */) return 4
  // Double-quoted scalar ranges are validated by parser.ts before cooking.
  return 8
}

// --- line folding helpers ---

// Skip a run of line breaks plus the leading whitespace of the following
// lines, returning the number of line breaks consumed and the new position.
function skipFoldedBreaks (input: string, position: number, end: number) {
  let breaks = 0

  while (position < end) {
    const ch = input.charCodeAt(position)

    if (ch === 0x0A/* LF */) {
      breaks++
      position++
    } else if (ch === 0x0D/* CR */) {
      breaks++
      position++
      if (input.charCodeAt(position) === 0x0A/* LF */) position++
    } else if (ch === 0x20/* Space */ || ch === 0x09/* Tab */) {
      position++
    } else {
      break
    }
  }

  return { position, breaks }
}

// Folding of line breaks between content chunks: a single break becomes a
// space, several breaks become (count - 1) newlines.
function foldedBreaks (count: number) {
  if (count === 1) return ' '
  // Called only after skipFoldedBreaks() consumed at least one line break.
  return '\n'.repeat(count - 1)
}

// --- per-style extractors ---

function getPlainValue (input: string, start: number, end: number) {
  let result = ''
  let position = start
  let captureStart = start
  let captureEnd = start

  while (position < end) {
    const ch = input.charCodeAt(position)

    if (ch === 0x0A/* LF */ || ch === 0x0D/* CR */) {
      result += input.slice(captureStart, captureEnd)
      const fold = skipFoldedBreaks(input, position, end)
      result += foldedBreaks(fold.breaks)
      position = captureStart = captureEnd = fold.position
    } else {
      position++
      if (ch !== 0x20/* Space */ && ch !== 0x09/* Tab */) captureEnd = position
    }
  }

  return result + input.slice(captureStart, captureEnd)
}

function getSingleQuotedValue (input: string, start: number, end: number) {
  let result = ''
  let position = start
  let captureStart = start
  let captureEnd = start

  while (position < end) {
    const ch = input.charCodeAt(position)

    if (ch === 0x27/* ' */) {
      // Within the stored range every quote is part of an escaped '' pair.
      result += input.slice(captureStart, position) + "'"
      position += 2
      captureStart = captureEnd = position
    } else if (ch === 0x0A/* LF */ || ch === 0x0D/* CR */) {
      result += input.slice(captureStart, captureEnd)
      const fold = skipFoldedBreaks(input, position, end)
      result += foldedBreaks(fold.breaks)
      position = captureStart = captureEnd = fold.position
    } else {
      position++
      if (ch !== 0x20/* Space */ && ch !== 0x09/* Tab */) captureEnd = position
    }
  }

  // Whitespace right before the closing quote is significant (it is only
  // stripped when followed by a line break).
  return result + input.slice(captureStart, end)
}

function getDoubleQuotedValue (input: string, start: number, end: number) {
  let result = ''
  let position = start
  let captureStart = start
  let captureEnd = start

  while (position < end) {
    const ch = input.charCodeAt(position)

    if (ch === 0x5C/* \ */) {
      result += input.slice(captureStart, position)
      position++
      const escaped = input.charCodeAt(position)

      if (escaped === 0x0A/* LF */ || escaped === 0x0D/* CR */) {
        // Escaped line break: a line continuation that joins with nothing.
        position = skipFoldedBreaks(input, position, end).position
      } else if (escaped < 256 && simpleEscapeCheck[escaped]) {
        result += simpleEscapeMap[escaped]
        position++
      } else {
        // parser.ts has already rejected unknown escapes and invalid hex digits.
        let hexLength = escapedHexLen(escaped)
        let hexResult = 0

        for (; hexLength > 0; hexLength--) {
          position++
          const digit = fromHexCode(input.charCodeAt(position))
          hexResult = (hexResult << 4) + digit
        }

        result += charFromCodepoint(hexResult)
        position++
      }

      captureStart = captureEnd = position
    } else if (ch === 0x0A/* LF */ || ch === 0x0D/* CR */) {
      result += input.slice(captureStart, captureEnd)
      const fold = skipFoldedBreaks(input, position, end)
      result += foldedBreaks(fold.breaks)
      position = captureStart = captureEnd = fold.position
    } else {
      position++
      if (ch !== 0x20/* Space */ && ch !== 0x09/* Tab */) captureEnd = position
    }
  }

  return result + input.slice(captureStart, end)
}

function getBlockValue (
  input: string,
  start: number,
  end: number,
  indent: number,
  chomping: number,
  folded: boolean
) {
  const textIndent = indent < 0 ? 0 : indent
  // The range starts at column 0 of the first line and includes every line
  // break, including those of trailing blank lines.
  const region = input.slice(start, end).replace(/\r\n?/g, '\n')
  // An empty range is a block with no lines at all (e.g. an empty `|+`) and
  // must stay empty; a naive split would invent a phantom blank line. Otherwise
  // a trailing line break leaves a trailing '' from split() that is not a real
  // line (just the terminator of the last one), so drop it. Interior blank
  // lines are kept.
  const lines = region === ''
    ? []
    : (region.endsWith('\n') ? region.slice(0, -1) : region).split('\n')

  let result = ''
  let didReadContent = false
  let emptyLines = 0
  let atMoreIndented = false

  for (const line of lines) {
    // Whitespace beyond the content indentation is part of the content, so the
    // indentation scan stops at textIndent. A line is empty only when nothing
    // remains after the (capped) indentation.
    // indent < 0 means no content line was detected (a wholly blank block), so
    // every line is an empty line.
    let column = 0
    while (column < textIndent && line.charCodeAt(column) === 0x20/* Space */) column++

    if (indent < 0 || column >= line.length) {
      emptyLines++
      continue
    }

    const content = line.slice(textIndent)
    const first = content.charCodeAt(0)

    if (folded) {
      if (first === 0x20/* Space */ || first === 0x09/* Tab */) {
        // More-indented lines are not folded.
        atMoreIndented = true
        result += '\n'.repeat(didReadContent ? 1 + emptyLines : emptyLines)
      } else if (atMoreIndented) {
        atMoreIndented = false
        result += '\n'.repeat(emptyLines + 1)
      } else if (emptyLines === 0) {
        if (didReadContent) result += ' '
      } else {
        result += '\n'.repeat(emptyLines)
      }
    } else {
      result += '\n'.repeat(didReadContent ? 1 + emptyLines : emptyLines)
    }

    result += content
    didReadContent = true
    emptyLines = 0
  }

  if (chomping === CHOMPING_MODE.KEEP) {
    result += '\n'.repeat(didReadContent ? 1 + emptyLines : emptyLines)
  } else if (chomping !== CHOMPING_MODE.STRIP) {
    if (didReadContent) result += '\n'
  }

  return result
}

/** @category Events */
function getScalarValue (input: string, scalar: ScalarEvent): string {
  if (scalar.valueStart === NO_RANGE) return ''

  const { valueStart, valueEnd } = scalar

  // Fast path: the parser marked this scalar as a verbatim slice of the input
  // (single-line plain / quoted with no escapes or folded breaks), so the
  // per-style char loop below would just reproduce the slice.
  if (scalar.fast) return input.slice(valueStart, valueEnd)

  switch (scalar.style) {
    case SCALAR_STYLE.SINGLE_QUOTED:
      return getSingleQuotedValue(input, valueStart, valueEnd)
    case SCALAR_STYLE.DOUBLE_QUOTED:
      return getDoubleQuotedValue(input, valueStart, valueEnd)
    case SCALAR_STYLE.LITERAL_BLOCK:
      return getBlockValue(input, valueStart, valueEnd, scalar.indent, scalar.chomping, false)
    case SCALAR_STYLE.FOLDED_BLOCK:
      return getBlockValue(input, valueStart, valueEnd, scalar.indent, scalar.chomping, true)
    default:
      return getPlainValue(input, valueStart, valueEnd)
  }
}

export {
  getScalarValue
}
