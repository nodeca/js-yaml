import { DUMP_SCHEMA, type Schema } from './schema.ts'
import { COLLECTION_STYLE } from './parser/events.ts'
import { jsToAst } from './ast/from_js.ts'
import { visit, VISIT_SKIP } from './ast/visit.ts'
import { type Document } from './ast/nodes.ts'
import {
  DEFAULT_PRESENTER_OPTIONS,
  present,
  type PresenterOptions
} from './ast/presenter.ts'
import { pick } from './common/object.ts'

/** @category Main */
interface DumpOptions extends Omit<PresenterOptions, 'schema'> {
  /**
   * Schema to use.
   *
   * @defaultValue {@link DUMP_SCHEMA}
   */
  schema?: Schema

  /**
   * Skips invalid types instead of throwing. Invalid mapping pairs and sequence
   * items are skipped; `undefined` sequence items are serialized as `null`.
   *
   * @defaultValue `false`
   */
  skipInvalid?: boolean

  /**
   * Inlines duplicate objects instead of converting them into references.
   *
   * @defaultValue `false`
   */
  noRefs?: boolean

  /**
   * Nesting level at which collections switch from block to flow style. Set to
   * `-1` to never switch automatically.
   *
   * @defaultValue `-1`
   */
  flowLevel?: number

  /** Mutates the generated AST before it is rendered. */
  transform?: (documents: Document[]) => void
}

const DEFAULT_DUMP_OPTIONS: Required<DumpOptions> = {
  ...DEFAULT_PRESENTER_OPTIONS,
  schema: DUMP_SCHEMA,
  skipInvalid: false,
  noRefs: false,
  flowLevel: -1,
  transform: () => {}
}

// Options that need the JS value (tags, format, dedup) go to `jsToAst`; purely
// presentational ones go to `present`.
/**
 * Serializes JS object as a YAML document. By default it can dump every
 * supported YAML type, so it throws an exception if you try to dump regexps or
 * functions. However, you can disable exceptions by setting the
 * {@link DumpOptions.skipInvalid} option to `true`.
 *
 * @category Main
 */
function dump (input: any, options: DumpOptions = {}) {
  const opts = { ...DEFAULT_DUMP_OPTIONS, ...options }

  const documents = jsToAst(input, opts.schema, {
    noRefs: opts.noRefs,
    skipInvalid: opts.skipInvalid
  })

  // flowLevel: every node at this depth switches to flow; the presenter forces
  // everything below into flow too, so the walk stops there.
  if (opts.flowLevel >= 0) {
    visit(documents, (node, ctx) => {
      if (ctx.depth < opts.flowLevel) return
      if (node.kind === 'sequence' || node.kind === 'mapping') {
        node.style = COLLECTION_STYLE.FLOW
      }
      return VISIT_SKIP
    })
  }

  opts.transform(documents)

  const PRESENTER_OPT_KEYS = Object.keys(DEFAULT_PRESENTER_OPTIONS) as
    (keyof typeof DEFAULT_PRESENTER_OPTIONS)[]

  return present(documents, { ...pick(opts, PRESENTER_OPT_KEYS), schema: opts.schema })
}

export {
  dump,

  type DumpOptions
}
