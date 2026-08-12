import makeSnippet, { type SnippetMark } from './snippet.ts'

// YAML error class. http://stackoverflow.com/questions/8458984
//
function formatError (exception: YAMLException, compact?: boolean) {
  let where = ''

  if (!exception.mark) return exception.reason

  if (exception.mark.name) {
    where += `in "${exception.mark.name}" `
  }

  where += `(${exception.mark.line + 1}:${exception.mark.column + 1})`

  if (!compact && exception.mark.snippet) {
    where += `\n\n${exception.mark.snippet}`
  }

  return `${exception.reason} ${where}`
}

/**
 * A YAML error. Unlike an ordinary `Error`, it adds a source snippet showing
 * the location of the problem to the error message, when available.
 *
 * @category Main
 */
class YAMLException extends Error {
  reason: string
  mark?: SnippetMark

  constructor (reason: string, mark?: SnippetMark) {
    super()

    this.name = 'YAMLException'
    this.reason = reason
    this.mark = mark
    this.message = formatError(this, false)

    // Guard for ancient browsers
    if (Error.captureStackTrace) {
      // Include stack trace in error object,
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Returns the formatted error, omitting the source snippet in compact mode.
   */
  toString (compact?: boolean) {
    return `${this.name}: ${formatError(this, compact)}`
  }
}

/**
 * Build a YAMLException with a source snippet and throw it. `source` is the
 * raw input text (no parser sentinel); `position` is an offset into it.
 *
 * @internal
 */
function throwErrorAt (source: string, position: number, message: string, filename = ''): never {
  let line = 0
  let lineStart = 0

  for (let index = 0; index < position; index++) {
    const ch = source.charCodeAt(index)

    if (ch === 0x0A/* LF */) {
      line++
      lineStart = index + 1
    } else if (ch === 0x0D/* CR */) {
      line++
      if (source.charCodeAt(index + 1) === 0x0A/* LF */) index++
      lineStart = index + 1
    }
  }

  const mark: SnippetMark = {
    name: filename,
    buffer: source,
    position,
    line,
    column: position - lineStart
  }

  mark.snippet = makeSnippet(mark)
  throw new YAMLException(message, mark)
}

export { YAMLException, throwErrorAt }
