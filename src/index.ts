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
  SCALAR_STYLE_PLAIN,
  SCALAR_STYLE_SINGLE_QUOTED,
  SCALAR_STYLE_DOUBLE_QUOTED,
  SCALAR_STYLE_LITERAL_BLOCK,
  SCALAR_STYLE_FOLDED_BLOCK,
  COLLECTION_STYLE_BLOCK,
  COLLECTION_STYLE_FLOW,
  CHOMPING_CLIP,
  CHOMPING_STRIP,
  CHOMPING_KEEP,
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
