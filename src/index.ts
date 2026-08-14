export {
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  YAML11_SCHEMA,
  DUMP_SCHEMA
} from './schema.ts'

export {
  NOT_RESOLVED,
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
} from './tag.ts'

export { strTag } from './tag/scalar/str.ts'
export { nullCoreTag } from './tag/scalar/null_core.ts'
export { nullJsonTag } from './tag/scalar/null_json.ts'
export { nullYaml11Tag } from './tag/scalar/null_yaml11.ts'
export { boolCoreTag } from './tag/scalar/bool_core.ts'
export { boolJsonTag } from './tag/scalar/bool_json.ts'
export { boolYaml11Tag } from './tag/scalar/bool_yaml11.ts'
export { intCoreTag } from './tag/scalar/int_core.ts'
export { intJsonTag } from './tag/scalar/int_json.ts'
export { intYaml11Tag } from './tag/scalar/int_yaml11.ts'
export { floatCoreTag } from './tag/scalar/float_core.ts'
export { floatJsonTag } from './tag/scalar/float_json.ts'
export { floatYaml11Tag } from './tag/scalar/float_yaml11.ts'
export { mergeTag } from './tag/scalar/merge.ts'
export { binaryTag } from './tag/scalar/binary.ts'
export { timestampTag } from './tag/scalar/timestamp.ts'

export { seqTag } from './tag/sequence/seq.ts'
export { omapTag } from './tag/sequence/omap.ts'
export { pairsTag } from './tag/sequence/pairs.ts'

export { mapTag } from './tag/mapping/map.ts'
export { realMapTag } from './tag/mapping/real_map.ts'
export { legacyMapTag } from './tag/mapping/legacy_map.ts'
export { setTag } from './tag/mapping/set.ts'

export { load, loadAll, type LoadOptions } from './load.ts'
export { dump, type DumpOptions } from './dump.ts'
export { YAMLException } from './common/exception.ts'

export {
  EVENT_ID,
  SCALAR_STYLE,
  COLLECTION_STYLE,
  CHOMPING_MODE,
  type EventId,
  type ScalarStyle,
  type CollectionStyle,
  type ChompingMode,

  type DocumentDirective,
  type DocumentEvent,
  type SequenceEvent,
  type MappingEvent,
  type ScalarEvent,
  type AliasEvent,
  type PopEvent,
  type Event
} from './parser/events.ts'

export {
  parseEvents,
  type ParserOptions
} from './parser/parser.ts'

export { getScalarValue } from './parser/parser_scalar.ts'

export {
  constructFromEvents,
  type ConstructorOptions
} from './parser/constructor.ts'

export { eventsToAst, type FromEventsOptions } from './ast/from_events.ts'
export { jsToAst, type FromJsOptions } from './ast/from_js.ts'
export { present, type PresenterOptions } from './ast/presenter.ts'

export {
  visit,
  VISIT_BREAK,
  VISIT_SKIP,
  type Visitor,
  type VisitContext
} from './ast/visit.ts'

export {
  Style,
  type Node,
  type Document,
  type NodeBase,
  type ScalarNode,
  type SequenceNode,
  type MappingNode,
  type AliasNode
} from './ast/nodes.ts'

// Deprecated compatibility exports

import { EVENT_ID, SCALAR_STYLE, COLLECTION_STYLE, CHOMPING_MODE } from './parser/events.ts'

/** @deprecated Use `EVENT_ID.DOCUMENT` instead. @internal */
export const EVENT_DOCUMENT = EVENT_ID.DOCUMENT
/** @deprecated Use `EVENT_ID.SEQUENCE` instead. @internal */
export const EVENT_SEQUENCE = EVENT_ID.SEQUENCE
/** @deprecated Use `EVENT_ID.MAPPING` instead. @internal */
export const EVENT_MAPPING = EVENT_ID.MAPPING
/** @deprecated Use `EVENT_ID.SCALAR` instead. @internal */
export const EVENT_SCALAR = EVENT_ID.SCALAR
/** @deprecated Use `EVENT_ID.ALIAS` instead. @internal */
export const EVENT_ALIAS = EVENT_ID.ALIAS
/** @deprecated Use `EVENT_ID.POP` instead. @internal */
export const EVENT_POP = EVENT_ID.POP
/** @deprecated Use `SCALAR_STYLE.PLAIN` instead. @internal */
export const SCALAR_STYLE_PLAIN = SCALAR_STYLE.PLAIN
/** @deprecated Use `SCALAR_STYLE.SINGLE_QUOTED` instead. @internal */
export const SCALAR_STYLE_SINGLE_QUOTED = SCALAR_STYLE.SINGLE_QUOTED
/** @deprecated Use `SCALAR_STYLE.DOUBLE_QUOTED` instead. @internal */
export const SCALAR_STYLE_DOUBLE_QUOTED = SCALAR_STYLE.DOUBLE_QUOTED
/** @deprecated Use `SCALAR_STYLE.LITERAL_BLOCK` instead. @internal */
export const SCALAR_STYLE_LITERAL_BLOCK = SCALAR_STYLE.LITERAL_BLOCK
/** @deprecated Use `SCALAR_STYLE.FOLDED_BLOCK` instead. @internal */
export const SCALAR_STYLE_FOLDED_BLOCK = SCALAR_STYLE.FOLDED_BLOCK
/** @deprecated Use `COLLECTION_STYLE.BLOCK` instead. @internal */
export const COLLECTION_STYLE_BLOCK = COLLECTION_STYLE.BLOCK
/** @deprecated Use `COLLECTION_STYLE.FLOW` instead. @internal */
export const COLLECTION_STYLE_FLOW = COLLECTION_STYLE.FLOW
/** @deprecated Use `CHOMPING_MODE.CLIP` instead. @internal */
export const CHOMPING_CLIP = CHOMPING_MODE.CLIP
/** @deprecated Use `CHOMPING_MODE.STRIP` instead. @internal */
export const CHOMPING_STRIP = CHOMPING_MODE.STRIP
/** @deprecated Use `CHOMPING_MODE.KEEP` instead. @internal */
export const CHOMPING_KEEP = CHOMPING_MODE.KEEP
