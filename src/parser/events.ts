/** @category Events */
const EVENT_ID = {
  DOCUMENT: 1,
  SEQUENCE: 2,
  MAPPING: 3,
  SCALAR: 4,
  ALIAS: 5,
  POP: 6
} as const

type EventId = typeof EVENT_ID[keyof typeof EVENT_ID]

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
  type: typeof EVENT_ID.DOCUMENT
  explicitStart: boolean
  explicitEnd: boolean
  directives: DocumentDirective[]
}

/** @category Events */
interface SequenceEvent {
  type: typeof EVENT_ID.SEQUENCE
  start: number
  anchorStart: number
  anchorEnd: number
  tagStart: number
  tagEnd: number
  style: CollectionStyle
}

/** @category Events */
interface MappingEvent {
  type: typeof EVENT_ID.MAPPING
  start: number
  anchorStart: number
  anchorEnd: number
  tagStart: number
  tagEnd: number
  style: CollectionStyle
}

/** @category Events */
interface ScalarEvent {
  type: typeof EVENT_ID.SCALAR
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
  type: typeof EVENT_ID.ALIAS
  anchorStart: number
  anchorEnd: number
}

/** @category Events */
interface PopEvent {
  type: typeof EVENT_ID.POP
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

  type EventId,
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
