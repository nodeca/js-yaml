/** @category Events */
const EVENT_ID = {
  DOCUMENT: 1,
  SEQUENCE: 2,
  MAPPING: 3,
  SCALAR: 4,
  ALIAS: 5,
  POP: 6
} as const

/** @category Events */
type EventId = typeof EVENT_ID[keyof typeof EVENT_ID]

/** @category Nodes */
const SCALAR_STYLE = {
  PLAIN: 1,
  SINGLE_QUOTED: 2,
  DOUBLE_QUOTED: 3,
  LITERAL_BLOCK: 4,
  FOLDED_BLOCK: 5
} as const

/** @category Nodes */
type ScalarStyle = typeof SCALAR_STYLE[keyof typeof SCALAR_STYLE]

/** @category Nodes */
const COLLECTION_STYLE = {
  BLOCK: 1,
  FLOW: 2
} as const

/** @category Nodes */
type CollectionStyle = typeof COLLECTION_STYLE[keyof typeof COLLECTION_STYLE]

/** @category Nodes */
const CHOMPING_MODE = {
  CLIP: 1,
  STRIP: 2,
  KEEP: 3
} as const

/** @category Nodes */
type ChompingMode = typeof CHOMPING_MODE[keyof typeof CHOMPING_MODE]

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
  chomping: ChompingMode
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
  SCALAR_STYLE,
  COLLECTION_STYLE,
  CHOMPING_MODE,

  type EventId,
  type ScalarStyle,
  type CollectionStyle,
  type ChompingMode,

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
