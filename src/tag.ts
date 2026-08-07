/**
 * Returned by a scalar resolver when the source does not match its tag.
 *
 * @category Tags
 */
const NOT_RESOLVED: unique symbol = Symbol('NOT_RESOLVED')

/**
 * Constructed value of the YAML merge key (`<<`).
 *
 * @category Tags
 */
const MERGE_KEY: unique symbol = Symbol('MERGE_KEY')

/**
 * Options for {@link defineScalarTag}.
 *
 * @category Tags
 */
interface ScalarTagOptions<Result> {
  /**
   * Whether this tag participates in resolving plain scalars without an
   * explicit tag. Default: `false`.
   */
  implicit?: boolean

  /**
   * Whether explicit tag names are matched by prefix instead of exact equality.
   * Default: `false`.
   */
  matchByTagPrefix?: boolean

  /**
   * Set of `source.charAt(0)` keys for which `resolve` may succeed (a superset
   * of what it really matches). A key is either a single character or '' (empty
   * source). `null` means "no constraint, always try". Used by the composer to
   * dispatch implicit scalars by first character without running every resolver.
   */
  implicitFirstChars?: readonly string[] | null

  /**
   * Construct a value from scalar text, or return {@link NOT_RESOLVED} when it
   * is invalid for this tag. `isExplicit` is true for an explicit tag and
   * `tagName` is the actual matched name.
   */
  resolve: (source: string, isExplicit: boolean, tagName: string) => Result | typeof NOT_RESOLVED

  /**
   * Selects this tag for a JavaScript value when dumping. Use `() => false`
   * for load-only tags.
   */
  identify: (data: any) => boolean

  /**
   * A scalar's printed form is text, so `represent` always yields a string.
   * The factory supplies a `String(data)` default when a tag omits it.
   */
  represent?: (data: any) => string

  /** Return the tag name to emit for a prefix-matching tag. Defaults to `tagName`. */
  representTagName?: (data: any) => string
}

/**
 * Normalized scalar tag returned by {@link defineScalarTag}.
 *
 * @category Tags
 */
interface ScalarTagDefinition<Result = unknown> extends Required<ScalarTagOptions<Result>> {
  /** Tag name used for schema lookup. */
  tagName: string

  /** YAML node kind handled by this tag. */
  nodeKind: 'scalar'
}

/**
 * Options for {@link defineSequenceTag}.
 *
 * @category Tags
 */
interface SequenceTagOptions<Carrier, Result = Carrier> {
  /**
   * Whether explicit tag names are matched by prefix instead of exact equality.
   * Default: `false`.
   */
  matchByTagPrefix?: boolean

  /** Create the carrier used while constructing a sequence. */
  create: (tagName: string) => Carrier

  /** Add an item to the carrier. Return a non-empty error message to reject it. */
  addItem: (carrier: Carrier, item: unknown, index: number) => void | string

  /** Convert the completed carrier to the result. Defaults to the identity function. */
  finalize?: (carrier: Carrier) => Result

  /**
   * Selects this tag for a JavaScript value when dumping. Use `() => false`
   * for load-only tags.
   */
  identify: (data: any) => boolean

  /** Return the array-like contents to dump. Defaults to the identity function. */
  represent?: (data: any) => ArrayLike<unknown>

  /** Return the tag name to emit for a prefix-matching tag. Defaults to `tagName`. */
  representTagName?: (data: any) => string
}

/**
 * Normalized sequence tag returned by {@link defineSequenceTag}.
 *
 * @category Tags
 */
interface SequenceTagDefinition<Carrier = unknown, Result = Carrier> extends Required<SequenceTagOptions<Carrier, Result>> {
  /** Tag name used for schema lookup. */
  tagName: string

  /** YAML node kind handled by this tag. */
  nodeKind: 'sequence'

  /** Sequence tags do not participate in implicit scalar resolution. */
  implicit: false

  /** Whether the carrier is also the final result (`finalize` was omitted). */
  carrierIsResult: boolean
}

/**
 * Options for {@link defineMappingTag}.
 *
 * @category Tags
 */
interface MappingTagOptions<Carrier, Result = Carrier> {
  /**
   * Whether explicit tag names are matched by prefix instead of exact equality.
   * Default: `false`.
   */
  matchByTagPrefix?: boolean

  /** Create the carrier used while constructing a mapping. */
  create: (tagName: string) => Carrier

  /**
   * Writes a pair. Returns '' on success, a non-empty error message otherwise
   * (key does not fit the representation, value rejected, ...). Always a string
   * so the hot path never allocates an exception wrapper.
   */
  addPair: (carrier: Carrier, key: unknown, value: unknown) => string

  /** Return whether the carrier contains a key, for duplicate and merge checks. */
  has: (carrier: Carrier, key: unknown) => boolean

  /** Return the keys of a completed result for YAML merge processing. */
  keys: (result: Result) => Iterable<unknown>

  /** Return a value from a completed result for YAML merge processing. */
  get: (result: Result, key: unknown) => unknown

  /** Convert the completed carrier to the result. Defaults to the identity function. */
  finalize?: (carrier: Carrier) => Result

  /**
   * Selects this tag for a JavaScript value when dumping. Use `() => false`
   * for load-only tags.
   */
  identify: (data: any) => boolean

  /** Return the mapping entries to dump. Defaults to the identity function. */
  represent?: (data: any) => Map<unknown, unknown>

  /** Return the tag name to emit for a prefix-matching tag. Defaults to `tagName`. */
  representTagName?: (data: any) => string
}

/**
 * Normalized mapping tag returned by {@link defineMappingTag}.
 *
 * @category Tags
 */
interface MappingTagDefinition<Carrier = unknown, Result = Carrier> extends Required<MappingTagOptions<Carrier, Result>> {
  /** Tag name used for schema lookup. */
  tagName: string

  /** YAML node kind handled by this tag. */
  nodeKind: 'mapping'

  /** Mapping tags do not participate in implicit scalar resolution. */
  implicit: false

  /** Whether the carrier is also the final result (`finalize` was omitted). */
  carrierIsResult: boolean
}

/**
 * Any normalized tag definition accepted by {@link Schema}.
 *
 * @category Tags
 */
type TagDefinition =
  | ScalarTagDefinition<any>
  | SequenceTagDefinition<any, any>
  | MappingTagDefinition<any, any>

/**
 * Create a normalized scalar tag definition.
 *
 * @category Tags
 */
function defineScalarTag<Result> (tagName: string, options: ScalarTagOptions<Result>): ScalarTagDefinition<Result> {
  return {
    tagName,
    nodeKind: 'scalar',
    implicit: options.implicit ?? false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    implicitFirstChars: options.implicitFirstChars ?? null,
    resolve: options.resolve,
    identify: options.identify,
    represent: options.represent ?? (data => String(data)),
    representTagName: options.representTagName ?? (() => tagName)
  }
}

/**
 * Create a normalized sequence tag definition.
 *
 * @category Tags
 */
function defineSequenceTag<Carrier, Result = Carrier> (tagName: string, options: SequenceTagOptions<Carrier, Result>): SequenceTagDefinition<Carrier, Result> {
  const carrierIsResult = options.finalize === undefined

  return {
    tagName,
    nodeKind: 'sequence',
    implicit: false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    create: options.create,
    addItem: options.addItem,
    finalize: options.finalize ?? (carrier => carrier as unknown as Result),
    carrierIsResult,
    identify: options.identify,
    represent: options.represent ?? (data => data as ArrayLike<unknown>),
    representTagName: options.representTagName ?? (() => tagName)
  }
}

/**
 * Create a normalized mapping tag definition.
 *
 * @category Tags
 */
function defineMappingTag<Carrier, Result = Carrier> (tagName: string, options: MappingTagOptions<Carrier, Result>): MappingTagDefinition<Carrier, Result> {
  const carrierIsResult = options.finalize === undefined

  return {
    tagName,
    nodeKind: 'mapping',
    implicit: false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    create: options.create,
    addPair: options.addPair,
    has: options.has,
    keys: options.keys,
    get: options.get,
    finalize: options.finalize ?? (carrier => carrier as unknown as Result),
    carrierIsResult,
    identify: options.identify,
    represent: options.represent ?? (data => data as Map<unknown, unknown>),
    representTagName: options.representTagName ?? (() => tagName)
  }
}

export {
  NOT_RESOLVED,
  MERGE_KEY,
  defineScalarTag,
  defineSequenceTag,
  defineMappingTag,

  type ScalarTagDefinition,
  type SequenceTagDefinition,
  type MappingTagDefinition,
  type TagDefinition,
  type ScalarTagOptions,
  type SequenceTagOptions,
  type MappingTagOptions
}
