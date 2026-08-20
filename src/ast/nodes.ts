// Plain-object discriminated union shared by the dumper (built by `jsToAst`,
// rendered by the presenter) and, later, by load. Behaviour lives in the walkers,
// not on the nodes.

import {
  type CollectionStyle,
  type DocumentDirective,
  type ScalarStyle
} from '../parser/events.ts'

/** @category Nodes */
interface NodeBase {
  /**
   * YAML tag. Untagged nodes carry the semantic resolved tag; tagged nodes carry
   * the printable/verbatim tag spelling.
   */
  tag: string
  /** Whether to print the node's tag explicitly. */
  tagged: boolean
  anchor?: string

  /** Reserved for the formatting layer; not populated by the dumper yet. */
  commentBefore?: string
  comment?: string
  commentAfter?: string
  blankBefore?: number
}

/** @category Nodes */
interface ScalarNode extends NodeBase {
  kind: 'scalar'
  /** Preferred scalar style; the presenter may fall back when necessary. */
  style: ScalarStyle
  value: string
}

/** @category Nodes */
interface SequenceNode extends NodeBase {
  kind: 'sequence'
  style: CollectionStyle
  items: Node[]
}

/** @category Nodes */
interface MappingNode extends NodeBase {
  kind: 'mapping'
  style: CollectionStyle
  items: Array<{ key: Node, value: Node }>
}

/** @category Nodes */
interface AliasNode {
  kind: 'alias'
  /** The anchor name this alias points at (`*name`). */
  anchor: string
}

/** @category Nodes */
type Node = ScalarNode | SequenceNode | MappingNode | AliasNode

/**
 * The layer above {@link Node}: each document wraps one content node plus its
 * own markers/directives. Not a member of {@link Node} — the fields differ.
 * Document directives are ordered presentation data.
 *
 * @category Nodes
 */
interface Document {
  /** null = empty document */
  contents: Node | null

  /** print '---' */
  explicitStart?: boolean

  /** print '...' */
  explicitEnd?: boolean

  directives: DocumentDirective[]
}

export {
  type Node,
  type Document,
  type NodeBase,
  type ScalarNode,
  type SequenceNode,
  type MappingNode,
  type AliasNode
}
