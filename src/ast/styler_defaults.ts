import { SCALAR_STYLE, type ScalarStyle } from '../parser/events.ts'
import { type ScalarLayout } from './scalar_styler.ts'

function hasBit (mask: number, bit: number): boolean { return (mask & (1 << bit)) !== 0 }

// This should eventually be a presenter option, but collection styling,
// especially key layout, must be designed first to decide whether scalar and
// collection width limits should share an option or be configured separately.
const MIN_SCALAR_CONTENT_WIDTH = 40

/**
 * Default scalar styling rules in application order.
 * See [Scalar styling](../../docs/scalar_stying.md) for usage details.
 *
 * @category AST
 */
const DEFAULT_SCALAR_STYLE_RULES = {
  applyQuoteFlowKeysOption,
  doubleQuoteForInvisibles,
  doubleQuoteWhitespaceOnly,
  applyForceQuotesOption,
  tryLongOrMultilineAsBlock,
  quoteInvalidPlain,
  fallbackToDoubleQuoted
} as const

function _preferredQuotedStyle (layout: ScalarLayout): ScalarStyle {
  if (layout.presenterOptions.quoteStyle === 'single' &&
      hasBit(layout.allowedStylesMask, SCALAR_STYLE.SINGLE_QUOTED)) {
    return SCALAR_STYLE.SINGLE_QUOTED
  }

  return SCALAR_STYLE.DOUBLE_QUOTED
}

function applyQuoteFlowKeysOption (layout: ScalarLayout): void {
  if (!layout.presenterOptions.quoteFlowKeys) return

  // quoteFlowKeys applies only to plain scalar keys in flow mappings.
  if (!layout.isKey || !layout.flowOnly || layout.style !== SCALAR_STYLE.PLAIN) return

  layout.style = SCALAR_STYLE.DOUBLE_QUOTED
}

function doubleQuoteForInvisibles (layout: ScalarLayout): void {
  if (layout.style === SCALAR_STYLE.PLAIN &&
      /[\t\x7F-\xA0\u2028\u2029\uFEFF\uFFFE\uFFFF]/.test(layout.node.value)) {
    layout.style = SCALAR_STYLE.DOUBLE_QUOTED
  }
}

function doubleQuoteWhitespaceOnly (layout: ScalarLayout): void {
  // Block styles normally make multiline structure easier to see, but
  // whitespace-only content turns that structure into visually empty lines,
  // so force double quotes for this special case.
  if (layout.style === SCALAR_STYLE.PLAIN && /^\s+$/.test(layout.node.value)) {
    layout.style = SCALAR_STYLE.DOUBLE_QUOTED
  }
}

function applyForceQuotesOption (layout: ScalarLayout): void {
  if (!layout.presenterOptions.forceQuotes) return

  // forceQuotes applies only to plain values, not to mapping keys.
  if (layout.isKey || layout.style !== SCALAR_STYLE.PLAIN) return

  layout.style = layout.node.value.includes('\n')
    ? SCALAR_STYLE.DOUBLE_QUOTED
    : _preferredQuotedStyle(layout)
}

function tryLongOrMultilineAsBlock (layout: ScalarLayout): void {
  if (layout.style !== SCALAR_STYLE.PLAIN || layout.isKey) return

  const value = layout.node.value
  const multiline = value.indexOf('\n') !== -1

  // Literal and folded block style bits are always set together, so checking
  // either one is sufficient.
  if (!hasBit(layout.allowedStylesMask, SCALAR_STYLE.LITERAL_BLOCK)) {
    if (multiline) layout.style = SCALAR_STYLE.DOUBLE_QUOTED
    return
  }

  const w = layout.presenterOptions.lineWidth

  if (w === -1) {
    if (multiline) layout.style = SCALAR_STYLE.LITERAL_BLOCK
    return
  }

  const availableWidth = Math.max(
    Math.min(w, MIN_SCALAR_CONTENT_WIDTH),
    w - layout.shiftOfContent
  )

  let position = 0
  let shouldFold = false

  // Check whether at least one line exceeds the width budget
  // and can be split at a space.
  while (position <= value.length) {
    let lineEnd = value.length

    const nextLineBreak = value.indexOf('\n', position)

    if (nextLineBreak !== -1) lineEnd = nextLineBreak

    const line = value.slice(position, lineEnd)

    if (line.length > availableWidth &&
        line[0] !== ' ' &&
        / [^ \t]/.test(line)) {
      shouldFold = true
    }

    if (nextLineBreak === -1) break
    position = nextLineBreak + 1
  }

  if (shouldFold) {
    layout.style = SCALAR_STYLE.FOLDED_BLOCK
  } else if (multiline) {
    layout.style = SCALAR_STYLE.LITERAL_BLOCK
  }
}

function quoteInvalidPlain (layout: ScalarLayout): void {
  if (layout.style === SCALAR_STYLE.PLAIN &&
      !hasBit(layout.allowedStylesMask, SCALAR_STYLE.PLAIN)) {
    layout.style = _preferredQuotedStyle(layout)
  }
}

function fallbackToDoubleQuoted (layout: ScalarLayout): void {
  if (!hasBit(layout.allowedStylesMask, layout.style)) {
    layout.style = SCALAR_STYLE.DOUBLE_QUOTED
  }
}

export { MIN_SCALAR_CONTENT_WIDTH, DEFAULT_SCALAR_STYLE_RULES }
