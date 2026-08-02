/** @category other */
const EVENT_DOCUMENT = 1
/** @category other */
const EVENT_SEQUENCE = 2
/** @category other */
const EVENT_MAPPING = 3
/** @category other */
const EVENT_SCALAR = 4
/** @category other */
const EVENT_ALIAS = 5
/** @category other */
const EVENT_POP = 6

type EventType =
  typeof EVENT_DOCUMENT | typeof EVENT_SEQUENCE | typeof EVENT_MAPPING |
  typeof EVENT_SCALAR | typeof EVENT_ALIAS | typeof EVENT_POP

/** @category Nodes */
const SCALAR_STYLE_PLAIN = 1
/** @category Nodes */
const SCALAR_STYLE_SINGLE_QUOTED = 2
/** @category Nodes */
const SCALAR_STYLE_DOUBLE_QUOTED = 3
/** @category Nodes */
const SCALAR_STYLE_LITERAL_BLOCK = 4
/** @category Nodes */
const SCALAR_STYLE_FOLDED_BLOCK = 5

type ScalarStyle =
  typeof SCALAR_STYLE_PLAIN | typeof SCALAR_STYLE_SINGLE_QUOTED |
  typeof SCALAR_STYLE_DOUBLE_QUOTED | typeof SCALAR_STYLE_LITERAL_BLOCK |
  typeof SCALAR_STYLE_FOLDED_BLOCK

/** @category Nodes */
const COLLECTION_STYLE_BLOCK = 1
/** @category Nodes */
const COLLECTION_STYLE_FLOW = 2

type CollectionStyle =
  typeof COLLECTION_STYLE_BLOCK | typeof COLLECTION_STYLE_FLOW

/** @category Nodes */
const CHOMPING_CLIP = 1
/** @category Nodes */
const CHOMPING_STRIP = 2
/** @category Nodes */
const CHOMPING_KEEP = 3

type Chomping =
  typeof CHOMPING_CLIP | typeof CHOMPING_STRIP | typeof CHOMPING_KEEP

/** @category other */
type DocumentDirective =
  { kind: 'yaml', version: string } |
  { kind: 'tag', handle: string, prefix: string }

type TagHandlers = Record<string, string>

/** @category Events */
interface DocumentEvent {
  type: typeof EVENT_DOCUMENT
  explicitStart: boolean
  explicitEnd: boolean
  directives: DocumentDirective[]
}

/** @category Events */
interface SequenceEvent {
  type: typeof EVENT_SEQUENCE
  start: number
  anchorStart: number
  anchorEnd: number
  tagStart: number
  tagEnd: number
  style: CollectionStyle
}

/** @category Events */
interface MappingEvent {
  type: typeof EVENT_MAPPING
  start: number
  anchorStart: number
  anchorEnd: number
  tagStart: number
  tagEnd: number
  style: CollectionStyle
}

/** @category Events */
interface ScalarEvent {
  type: typeof EVENT_SCALAR
  valueStart: number
  valueEnd: number
  anchorStart: number
  anchorEnd: number
  tagStart: number
  tagEnd: number
  style: ScalarStyle
  chomping: Chomping
  indent: number
  fast: boolean
}

/** @category Events */
interface AliasEvent {
  type: typeof EVENT_ALIAS
  anchorStart: number
  anchorEnd: number
}

/** @category Events */
interface PopEvent {
  type: typeof EVENT_POP
}

/** @category Events */
type Event =
  DocumentEvent |
  SequenceEvent |
  MappingEvent |
  ScalarEvent |
  AliasEvent |
  PopEvent

export {
  EVENT_DOCUMENT,
  EVENT_SEQUENCE,
  EVENT_MAPPING,
  EVENT_SCALAR,
  EVENT_ALIAS,
  EVENT_POP,

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

  type EventType,
  type ScalarStyle,
  type CollectionStyle,

  type Chomping,
  type DocumentDirective,
  type TagHandlers,
  type DocumentEvent,
  type SequenceEvent,
  type MappingEvent,
  type ScalarEvent,
  type AliasEvent,
  type PopEvent,
  type Event
}
