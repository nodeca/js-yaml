import { YAMLException } from './common/exception.ts'
import { pick } from './common/object.ts'
import {
  constructFromEvents,
  DEFAULT_CONSTRUCTOR_OPTIONS,
  type ConstructorOptions
} from './parser/constructor.ts'
import {
  parseEvents,
  DEFAULT_PARSER_OPTIONS,
  type ParserOptions
} from './parser/parser.ts'

// `source` is supplied by `loadDocuments` itself, not by the public caller.
/** @category Main */
interface LoadOptions extends ParserOptions, Omit<ConstructorOptions, 'source'> {}

/** @inline */
type LoadAllIterator = (document: unknown) => void

const DEFAULT_LOAD_OPTIONS: Required<LoadOptions> = {
  ...DEFAULT_PARSER_OPTIONS,
  ...DEFAULT_CONSTRUCTOR_OPTIONS
}

function loadDocuments (input: string, options: LoadOptions = {}) {
  const opts = { ...DEFAULT_LOAD_OPTIONS, ...options }
  const source = String(input)

  const PARSER_OPT_KEYS = Object.keys(DEFAULT_PARSER_OPTIONS) as
    (keyof typeof DEFAULT_PARSER_OPTIONS)[]
  const CONSTRUCTOR_OPT_KEYS = Object.keys(DEFAULT_CONSTRUCTOR_OPTIONS) as
    (keyof typeof DEFAULT_CONSTRUCTOR_OPTIONS)[]

  const events = parseEvents(source, pick(opts, PARSER_OPT_KEYS))
  return constructFromEvents(events, { ...pick(opts, CONSTRUCTOR_OPT_KEYS), source })
}

/**
 * Same as {@link load}, but understands multi-document sources.
 * Returns an array of documents.
 *
 * @category Main
 */
function loadAll (input: string, options?: LoadOptions): unknown[]

/**
 * @deprecated Iterator is not supported.
 */
function loadAll (input: string, iterator: null, options?: LoadOptions): unknown[]

/**
 * @deprecated Iterator is not supported.
 */
function loadAll (input: string, iterator: LoadAllIterator, options?: LoadOptions): void
function loadAll (
  input: string,
  iteratorOrOptions?: LoadAllIterator | LoadOptions | null,
  options?: LoadOptions
) {
  let iterator: LoadAllIterator | null = null

  if (typeof iteratorOrOptions === 'function') {
    iterator = iteratorOrOptions
  } else if (iteratorOrOptions !== null && typeof iteratorOrOptions === 'object') {
    options = iteratorOrOptions
  }

  const documents = loadDocuments(input, options)

  if (iterator === null) return documents
  for (const document of documents) iterator(document)
}

/**
 * Parses `string` as a single YAML document. Throws {@link YAMLException} on
 * error. This function does not understand multi-document or empty sources; it
 * throws an exception on those.
 *
 * > [!NOTE]
 * > 1. When processing untrusted input, see the
 * >    [security considerations](../docs/safety.md).
 * > 2. All exceptions MUST be caught, not just {@link YAMLException}.
 * > 3. The default {@link CORE_SCHEMA} comes without the `!!merge` tag. You can
 * >    easily enable it if needed.
 * > 4. The default {@link mapTag} is `{}`-object based, with known limitations
 * >    (see description). For full compatibility use {@link realMapTag}
 * >    instead (it uses native JS `Map`).
 *
 * @example
 * Enable {@link mergeTag} and {@link realMapTag}:
 *
 * ```javascript
 * import { load, CORE_SCHEMA, mergeTag, realMapTag } from 'js-yaml'
 *
 * try {
 *   load(data, { schema: CORE_SCHEMA.withTags(mergeTag, realMapTag) })
 * } catch (e) {
 *   console.error(e)
 * }
 * ```
 *
 * @category Main
 */
function load (input: string, options?: LoadOptions) {
  const documents = loadDocuments(input, options)

  if (documents.length === 0) throw new YAMLException('expected a document, but the input is empty')
  if (documents.length === 1) return documents[0]

  throw new YAMLException('expected a single document in the stream, but found more')
}

export {
  load,
  loadAll,
  type LoadOptions
}
