const NOT_RESOLVED: unique symbol = Symbol('NOT_RESOLVED')
const MERGE_KEY: unique symbol = Symbol('MERGE_KEY')

type ScalarRepresent = (data: any) => string
type SequenceRepresent = (data: any) => ArrayLike<unknown>
type MappingRepresent = (data: any) => Map<unknown, unknown>

type IdentifyFn = (data: any) => boolean
type RepresentTagNameFn = (data: any) => string

interface ScalarTagDefinition<Result = unknown> {
  tagName: string
  nodeKind: 'scalar'
  implicit: boolean
  matchByTagPrefix: boolean
  // Set of `source.charAt(0)` keys for which `resolve` may succeed (a superset of
  // what it really matches). A key is either a single character or '' (empty
  // source). `null` means "no constraint, always try". Used by the composer to
  // dispatch implicit scalars by first character without running every resolver.
  implicitFirstChars: readonly string[] | null
  // `isExplicit` is true for an explicit tag (`!!tag`), false for implicit plain
  // scalar resolution.
  resolve: (source: string, isExplicit: boolean, tagName: string) => Result | typeof NOT_RESOLVED
  identify: IdentifyFn | null
  // A scalar's printed form is text, so `represent` always yields a string. The
  // factory supplies a `String(data)` default when a tag omits it.
  represent: ScalarRepresent
  representTagName: RepresentTagNameFn | null
}

interface SequenceTagDefinition<Carrier = unknown, Result = Carrier> {
  tagName: string
  nodeKind: 'sequence'
  implicit: false
  matchByTagPrefix: boolean
  create: (tagName: string) => Carrier
  addItem: (carrier: Carrier, item: unknown, index: number) => void | string
  finalize: (carrier: Carrier) => Result
  carrierIsResult: boolean
  identify: IdentifyFn | null
  represent: SequenceRepresent
  representTagName: RepresentTagNameFn | null
}

interface MappingTagDefinition<Carrier = unknown, Result = Carrier> {
  tagName: string
  nodeKind: 'mapping'
  implicit: false
  matchByTagPrefix: boolean
  create: (tagName: string) => Carrier
  // Writes a pair. Returns '' on success, a non-empty error message otherwise
  // (key does not fit the representation, value rejected, ...). Always a string
  // so the hot path never allocates an exception wrapper.
  addPair: (carrier: Carrier, key: unknown, value: unknown) => string
  // Read side, mirrors `Map` — defining a representation means defining how to
  // read it back. `has` is the hot dedup probe (membership without fetching the
  // value); `keys`/`get` are used only on the cold merge path (`<<`).
  has: (carrier: Carrier, key: unknown) => boolean
  keys: (result: Result) => Iterable<unknown>
  get: (result: Result, key: unknown) => unknown
  // Canonical identity of a key, used when tracking merge-overridable keys.
  // For object-based maps a resolved key (e.g. the number 10) and the string
  // form it is stored under ("10") are the same key, so they must normalize
  // alike; real Map/Set keys are already identity.
  normalizeKey: (key: unknown) => unknown
  finalize: (carrier: Carrier) => Result
  carrierIsResult: boolean
  identify: IdentifyFn | null
  represent: MappingRepresent
  representTagName: RepresentTagNameFn | null
}

type TagDefinition =
  | ScalarTagDefinition<any>
  | SequenceTagDefinition<any, any>
  | MappingTagDefinition<any, any>

interface ScalarTagOptions<Result> {
  implicit?: boolean
  matchByTagPrefix?: boolean
  implicitFirstChars?: readonly string[] | null
  resolve: ScalarTagDefinition<Result>['resolve']
  identify?: ScalarTagDefinition<Result>['identify']
  represent?: ScalarTagDefinition<Result>['represent']
  representTagName?: ScalarTagDefinition<Result>['representTagName']
}

type RepresentOptions<Container, Canonical, Represent> =
  | {
      identify?: null
      represent?: Represent
      representTagName?: RepresentTagNameFn | null
    }
  | (Container extends Canonical
      ? {
          identify?: IdentifyFn | null
          represent?: Represent
          representTagName?: RepresentTagNameFn | null
        }
      : {
          identify: IdentifyFn
          represent: Represent
          representTagName?: RepresentTagNameFn | null
        })

type SequenceTagOptions<Carrier, Result = Carrier> = {
  matchByTagPrefix?: boolean
  create: SequenceTagDefinition<Carrier, Result>['create']
  addItem: SequenceTagDefinition<Carrier, Result>['addItem']
  finalize?: SequenceTagDefinition<Carrier, Result>['finalize']
} & RepresentOptions<Result, ArrayLike<unknown>, SequenceRepresent>

type MappingTagOptions<Carrier, Result = Carrier> = {
  matchByTagPrefix?: boolean
  create: MappingTagDefinition<Carrier, Result>['create']
  addPair: MappingTagDefinition<Carrier, Result>['addPair']
  has: MappingTagDefinition<Carrier, Result>['has']
  keys: MappingTagDefinition<Carrier, Result>['keys']
  get: MappingTagDefinition<Carrier, Result>['get']
  normalizeKey?: MappingTagDefinition<Carrier, Result>['normalizeKey']
  finalize?: MappingTagDefinition<Carrier, Result>['finalize']
} & RepresentOptions<Result, Map<unknown, unknown>, MappingRepresent>

function defineScalarTag<Result> (tagName: string, options: ScalarTagOptions<Result>): ScalarTagDefinition<Result> {
  return {
    tagName,
    nodeKind: 'scalar',
    implicit: options.implicit ?? false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    implicitFirstChars: options.implicitFirstChars ?? null,
    resolve: options.resolve,
    identify: options.identify ?? null,
    represent: options.represent ?? (data => String(data)),
    representTagName: options.representTagName ?? null
  }
}

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
    identify: options.identify ?? null,
    represent: options.represent ?? (data => data as ArrayLike<unknown>),
    representTagName: options.representTagName ?? null
  }
}

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
    normalizeKey: options.normalizeKey ?? (key => key),
    finalize: options.finalize ?? (carrier => carrier as unknown as Result),
    carrierIsResult,
    identify: options.identify ?? null,
    represent: options.represent ?? (data => data as Map<unknown, unknown>),
    representTagName: options.representTagName ?? null
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
