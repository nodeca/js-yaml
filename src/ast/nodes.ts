// Plain-object discriminated union shared by the dumper (built by `jsToAst`,
// rendered by the presenter) and, later, by load. Behaviour lives in the walkers,
// not on the nodes.

import { type DocumentDirective } from '../parser/events.ts'

/** @category Nodes */
class Style {
  tagged = false
  flow = false
  singleQuoted = false
  doubleQuoted = false
  literal = false
  folded = false
}

/** @category Nodes */
interface NodeBase {
  // YAML tag. Untagged nodes carry the semantic resolved tag; tagged nodes carry
  // the printable/verbatim tag spelling.
  tag: string
  style: Style
  anchor?: string

  // Reserved for the formatting layer; not populated by the dumper yet.
  commentBefore?: string
  comment?: string
  commentAfter?: string
  blankBefore?: number
}

/** @category Nodes */
interface ScalarNode extends NodeBase {
  kind: 'scalar'
  value: string
}

/** @category Nodes */
interface SequenceNode extends NodeBase {
  kind: 'sequence'
  items: Node[]
}

/** @category Nodes */
interface MappingNode extends NodeBase {
  kind: 'mapping'
  items: Array<{ key: Node, value: Node }>
}

/** @category Nodes */
interface AliasNode extends NodeBase {
  kind: 'alias'
  // The anchor name this alias points at (`*name`).
  anchor: string
}

/** @category Nodes */
type Node = ScalarNode | SequenceNode | MappingNode | AliasNode

// The layer above `Node`: each document wraps one content node plus its own
// markers/directives. Not a member of `Node` — the fields differ. Document
// directives are ordered presentation data.
/** @category Nodes */
interface Document {
  contents: Node | null            // null = empty document
  explicitStart?: boolean          // print '---'
  explicitEnd?: boolean            // print '...'
  directives: DocumentDirective[]
}

export {
  Style,

  type Node,
  type Document,
  type NodeBase,
  type ScalarNode,
  type SequenceNode,
  type MappingNode,
  type AliasNode
}
