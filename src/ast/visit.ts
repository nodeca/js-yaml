// Depth-first AST traversal. Mirrors the `kind` walk of the presenter and the
// `from_*` builders, but stays read-oriented: nodes are plain objects, so a
// visitor mutates them in place. Control signals let it prune or stop the walk.

import {
  type Node,
  type Document
} from './nodes.ts'

// Returned by a visitor to control the walk; anything else (incl. `undefined`)
// descends as usual.
/** @category other */
const VISIT_BREAK = Symbol('visit:break') // stop the whole traversal
/** @category other */
const VISIT_SKIP = Symbol('visit:skip')   // don't descend into this node's children

/** @inline */
type VisitControl = typeof VISIT_BREAK | typeof VISIT_SKIP | undefined | void

/**
 * Traversal-derived position of the current node. Kept off the node itself: a
 * node may sit in several places (alias/dedup reuse), so depth/role belong to
 * the walk, not the node. {@link VisitContext.parent} `kind` +
 * {@link VisitContext.isKey} pin the exact slot.
 *
 * @category AST
 */
interface VisitContext {
  /** 0 = document content root */
  depth: number

  /** Enclosing sequence/mapping, null at the root */
  parent: Node | null

  /** Node sits in a mapping key position */
  isKey: boolean
}

/** @category AST */
type Visitor = (node: Node, ctx: VisitContext) => VisitControl

// Returns `true` once `VISIT_BREAK` was seen, so callers can unwind the walk.
function visitNode (node: Node, visitor: Visitor, ctx: VisitContext): boolean {
  const control = visitor(node, ctx)
  if (control === VISIT_BREAK) return true
  if (control === VISIT_SKIP) return false

  const depth = ctx.depth + 1

  switch (node.kind) {
    case 'sequence':
      for (const item of node.items) {
        if (visitNode(item, visitor, { depth, parent: node, isKey: false })) return true
      }
      break
    case 'mapping':
      for (const { key, value } of node.items) {
        if (visitNode(key, visitor, { depth, parent: node, isKey: true })) return true
        if (visitNode(value, visitor, { depth, parent: node, isKey: false })) return true
      }
      break
  }

  return false
}

/**
 * Walk every node in the documents, calling {@link Visitor} once per
 * node (pre-order).
 *
 * @category AST
 */
function visit (documents: Document[], visitor: Visitor): void {
  for (const doc of documents) {
    if (doc.contents && visitNode(doc.contents, visitor, { depth: 0, parent: null, isKey: false })) return
  }
}

export {
  visit,
  VISIT_BREAK,
  VISIT_SKIP,
  type Visitor,
  type VisitContext
}
