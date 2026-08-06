/** @category other */
const NOT_RESOLVED: unique symbol = Symbol('NOT_RESOLVED')
/** @category other */
const MERGE_KEY: unique symbol = Symbol('MERGE_KEY')

type ScalarRepresent = (data: any) => string
type SequenceRepresent = (data: any) => ArrayLike<unknown>
type MappingRepresent = (data: any) => Map<unknown, unknown>

type IdentifyFn = (data: any) => boolean
type RepresentTagNameFn = (data: any) => string

/** @category Tags */
interface ScalarTagOptions<Result> {
  implicit?: boolean
  matchByTagPrefix?: boolean

  /**
   * Set of `source.charAt(0)` keys for which `resolve` may succeed (a superset
   * of what it really matches). A key is either a single character or '' (empty
   * source). `null` means "no constraint, always try". Used by the composer to
   * dispatch implicit scalars by first character without running every resolver.
   */
  implicitFirstChars?: readonly string[] | null

  /**
   * `isExplicit` is true for an explicit tag (`!!tag`), false for implicit plain
   * scalar resolution.
   */
  resolve: (source: string, isExplicit: boolean, tagName: string) => Result | typeof NOT_RESOLVED

  /**
   * Selects this tag for a JavaScript value when dumping. Use `() => false`
   * for load-only tags.
   */
  identify: IdentifyFn

  /**
   * A scalar's printed form is text, so `represent` always yields a string.
   * The factory supplies a `String(data)` default when a tag omits it.
   */
  represent?: ScalarRepresent
  representTagName?: RepresentTagNameFn
}

/** @category Tags */
interface ScalarTagDefinition<Result = unknown> extends Required<ScalarTagOptions<Result>> {
  tagName: string
  nodeKind: 'scalar'
}

/** @category Tags */
interface SequenceTagOptions<Carrier, Result = Carrier> {
  matchByTagPrefix?: boolean
  create: (tagName: string) => Carrier
  addItem: (carrier: Carrier, item: unknown, index: number) => void | string
  finalize?: (carrier: Carrier) => Result

  /**
   * Selects this tag for a JavaScript value when dumping. Use `() => false`
   * for load-only tags.
   */
  identify: IdentifyFn
  represent?: SequenceRepresent
  representTagName?: RepresentTagNameFn
}

/** @category Tags */
interface SequenceTagDefinition<Carrier = unknown, Result = Carrier> extends Required<SequenceTagOptions<Carrier, Result>> {
  tagName: string
  nodeKind: 'sequence'
  implicit: false
  carrierIsResult: boolean
}

/** @category Tags */
interface MappingTagOptions<Carrier, Result = Carrier> {
  matchByTagPrefix?: boolean
  create: (tagName: string) => Carrier

  /**
   * Writes a pair. Returns '' on success, a non-empty error message otherwise
   * (key does not fit the representation, value rejected, ...). Always a string
   * so the hot path never allocates an exception wrapper.
   */
  addPair: (carrier: Carrier, key: unknown, value: unknown) => string

  /**
   * Read side, mirrors `Map` — defining a representation means defining how to
   * read it back. `has` is the hot dedup probe (membership without fetching the
   * value); `keys` and `get` are used only on the cold merge path (`<<`).
   */
  has: (carrier: Carrier, key: unknown) => boolean
  keys: (result: Result) => Iterable<unknown>
  get: (result: Result, key: unknown) => unknown
  finalize?: (carrier: Carrier) => Result

  /**
   * Selects this tag for a JavaScript value when dumping. Use `() => false`
   * for load-only tags.
   */
  identify: IdentifyFn
  represent?: MappingRepresent
  representTagName?: RepresentTagNameFn
}

/** @category Tags */
interface MappingTagDefinition<Carrier = unknown, Result = Carrier> extends Required<MappingTagOptions<Carrier, Result>> {
  tagName: string
  nodeKind: 'mapping'
  implicit: false
  carrierIsResult: boolean
}

/** @category Tags */
type TagDefinition =
  | ScalarTagDefinition<any>
  | SequenceTagDefinition<any, any>
  | MappingTagDefinition<any, any>

/** @category Tags */
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

/** @category Tags */
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

/** @category Tags */
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
  type MappingTagOptions,
  type ScalarRepresent,
  type SequenceRepresent,
  type MappingRepresent
}
