import { describe, it } from 'node:test'

import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSONParser } from '@streamparser/json'

import { tagNameFull, tagNameShort } from '../../src/common/tagname.ts'
import {
  load,
  loadAll,
  dump,
  eventsToAst,
  present,
  visit,
  EVENT_ID,
  SCALAR_STYLE_SINGLE_QUOTED,
  SCALAR_STYLE_DOUBLE_QUOTED,
  SCALAR_STYLE_LITERAL_BLOCK,
  SCALAR_STYLE_FOLDED_BLOCK,
  COLLECTION_STYLE_FLOW,
  CORE_SCHEMA,
  strTag,
  seqTag,
  mapTag,
  parseEvents,
  getScalarValue
} from 'js-yaml'

// The yaml-test-suite follows the libyaml convention: a tag outside the core
// schema is constructed by node kind (scalar→str, seq→seq, map→map), and its
// `json` field encodes that fallback value. The core loader instead rejects
// unknown tags, so to validate the suite's `json`/round-trip expectations we
// load with a schema that adds catch-all tags. These match by empty tag prefix,
// so they only fire for tags not already covered by the core schema. This is a
// test-only schema; it does not change how js-yaml loads by default.
const SPEC_SCHEMA = CORE_SCHEMA.withTags(
  { ...strTag, tagName: '', matchByTagPrefix: true },
  { ...seqTag, tagName: '', matchByTagPrefix: true },
  { ...mapTag, tagName: '', matchByTagPrefix: true }
)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const suiteDir = path.join(__dirname, 'yaml-test-suite')
const srcDir = path.join(suiteDir, 'src')

// YAML samples contain markers to visualize whitespace and control characters.
// This function replaces them with the actual characters before parsing.
function unescapeFixtureText (text) {
  return text
    .replaceAll('␣', ' ')
    .replace(/—*»/g, '\t')
    .replaceAll('←', '\r')
    .replaceAll('⇔', '\uFEFF')
    .replaceAll('↵', '')
    .replace(/∎\n$/u, '')
}

function expectedTreeLines (tree) {
  const lines = []

  for (const line of tree.split('\n')) {
    const trimmed = line.trim()

    if (trimmed === '' || trimmed === '+STR' || trimmed === '-STR') continue
    // Significant (e.g. trailing) spaces in scalar values are visualized with ␣.
    lines.push(trimmed.replaceAll('␣', ' '))
  }

  return lines
}

function parseConcatenatedJson (str) {
  const results = []
  const parser = new JSONParser({ separator: '', paths: ['$'] })

  parser.onValue = ({ value }) => results.push(value)
  parser.write(str)

  return results
}

function escapeTreeValue (value) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\t', '\\t')
    .replaceAll('\b', '\\b')
}

function formatRange (input, start, end) {
  return start === -1 ? '' : input.slice(start, end)
}

// Resolve a raw tag (e.g. !foo, !!str, !e!tag%21, !<verbatim>) into its full
// form using the current document's TAG directives, mirroring what the
// yaml-test-suite tree expects. The parser stores raw tag ranges; the directives
// needed to resolve them are carried on the DOCUMENT event.
function formatTag (tag, tagHandlers) {
  if (tag === '') return ''
  if (tag.startsWith('!<') && tag.endsWith('>')) return `<${tag.slice(2, -1)}>`

  return `<${tagNameFull(tag, tagHandlers)}>`
}

function formatProperties (input, event, tagHandlers) {
  const parts = []
  const anchor = formatRange(input, event.anchorStart, event.anchorEnd)
  const tag = formatRange(input, event.tagStart, event.tagEnd)

  if (anchor) parts.push(`&${anchor}`)
  if (tag) parts.push(formatTag(tag, tagHandlers))

  return parts.length > 0 ? `${parts.join(' ')} ` : ''
}

function tagHandlersFromDirectives (directives) {
  const tagHandlers = Object.create(null)
  for (const directive of directives) {
    if (directive.kind === 'tag') tagHandlers[directive.handle] = directive.prefix
  }
  return tagHandlers
}

function scalarStyleMarker (style) {
  if (style === SCALAR_STYLE_SINGLE_QUOTED) return "'"
  if (style === SCALAR_STYLE_DOUBLE_QUOTED) return '"'
  if (style === SCALAR_STYLE_LITERAL_BLOCK) return '|'
  if (style === SCALAR_STYLE_FOLDED_BLOCK) return '>'
  return ':'
}

function actualTreeLines (input) {
  const events = parseEvents(input, {})

  const lines = []
  const stack = []
  let tagHandlers = Object.create(null)

  for (const event of events) {
    if (event.type === EVENT_ID.DOCUMENT) {
      tagHandlers = tagHandlersFromDirectives(event.directives)
      lines.push(event.explicitStart ? '+DOC ---' : '+DOC')
      stack.push(event)
    } else if (event.type === EVENT_ID.SEQUENCE) {
      const style = event.style === COLLECTION_STYLE_FLOW ? ' []' : ''
      const props = formatProperties(input, event, tagHandlers)
      lines.push(`+SEQ${style} ${props}`.replace(/\s+/g, ' ').trimEnd())
      stack.push(event)
    } else if (event.type === EVENT_ID.MAPPING) {
      const style = event.style === COLLECTION_STYLE_FLOW ? ' {}' : ''
      const props = formatProperties(input, event, tagHandlers)
      lines.push(`+MAP${style} ${props}`.replace(/\s+/g, ' ').trimEnd())
      stack.push(event)
    } else if (event.type === EVENT_ID.SCALAR) {
      const props = formatProperties(input, event, tagHandlers)
      const value = escapeTreeValue(getScalarValue(input, event))
      lines.push(`=VAL ${props}${scalarStyleMarker(event.style)}${value}`)
    } else if (event.type === EVENT_ID.ALIAS) {
      lines.push(`=ALI *${formatRange(input, event.anchorStart, event.anchorEnd)}`)
    } else if (event.type === EVENT_ID.POP) {
      const opened = stack.pop()

      if (opened?.type === EVENT_ID.DOCUMENT) {
        lines.push(opened.explicitEnd ? '-DOC ...' : '-DOC')
      } else if (opened?.type === EVENT_ID.SEQUENCE) {
        lines.push('-SEQ')
      } else if (opened?.type === EVENT_ID.MAPPING) {
        lines.push('-MAP')
      }
    }
  }

  return lines
}

// The suite's outer stream markers are inconsistent across generations: ignore
// an optional leading `---` and trailing `...`.
function normalizeDumpMarkers (yaml) {
  const withoutStart = yaml.replace(/^---(?:(?:[ \t]+)(?=\S)|[ \t]*\n)/, '')
  return withoutStart.endsWith('...\n') ? withoutStart.slice(0, -4) : withoutStart
}

function normalizeFixtureDump (sample) {
  let result = sample
  result = unescapeFixtureText(result)
  result = normalizeDumpMarkers(result)
  // Quick hack for a couple of tests using legacy \uXXXX escapes for non-ASCII
  result = result.replace(/\\u([0-9A-Fa-f]{4})/g, (match, hex) => {
    const code = parseInt(hex, 16)
    return code > 0x7E ? String.fromCharCode(code) : match
  })

  return result
}

// `emit` keeps the %YAML/%TAG directives that the presenter doesn't render;
// drop those lines so the rest of the stream can be compared.
function normalizeFixtureEmit (sample) {
  let result = sample
  result = unescapeFixtureText(result)
  result = normalizeDumpMarkers(result)
  // emit can contain directives, drop those.
  result = result.replace(/^%(YAML|TAG)\b.*\n/gm, '')
  return result
}

describe('yaml-test-suite parser tree', () => {
  if (!fs.existsSync(srcDir)) {
    throw new Error('Missing yaml-test-suite fixtures. Run npm run spec:get first.')
  }

  for (const file of fs.readdirSync(srcDir).sort()) {
    if (path.extname(file) !== '.yaml') continue

    const id = path.basename(file, '.yaml')
    const fixtureFile = path.join(srcDir, file)
    const fixtures = load(fs.readFileSync(fixtureFile, 'utf8'), { filename: fixtureFile })

    for (let index = 1; index < fixtures.length; index++) {
      const current = fixtures[index]
      fixtures[index] = Object.assign({}, fixtures[index - 1], current)

      if (!Object.hasOwn(current, 'fail')) delete fixtures[index].fail
    }

    // A `skip: true` on the first document means the whole file is excluded from
    // the suite; keep one visible marker so it isn't dropped silently.
    if (fixtures[0]?.skip) {
      describe(id, () => {
        it(id, { skip: 'suite marks file skip' }, () => {})
      })
      continue
    }

    fixtures.forEach((fixture, index) => {
      const suffix = fixtures.length > 1 ? `/${String(index).padStart(2, '0')}` : ''
      const hasTree = typeof fixture.tree === 'string'
      const hasJson = typeof fixture.json === 'string'
      const hasDump = typeof fixture.dump === 'string'
      const hasEmit = typeof fixture.emit === 'string'

      // Annotate the title with the checks this fixture actually runs. The full
      // tree+json+round-trip set carries no suffix; reduced sets list their
      // active checks by name. `(tree, json)` (no round-trip) uniquely marks a
      // fail fixture, since a non-fail fixture with `json` always round-trips.
      let checks
      if (fixture.fail) checks = ['tree', 'json']
      else if (!hasTree && !hasJson) checks = ['usable']
      else if (!hasJson) checks = ['tree']
      else checks = ['tree', 'json', 'round-trip']
      const annotation = checks.length === 3 ? '' : ` (${checks.join(', ')})`

      const title = `${id}${suffix} ${fixture.name || id}${annotation}`

      describe(title, () => {
        if (fixture.fail) {
          it(`${id} tree`, () => {
            const input = unescapeFixtureText(fixture.yaml)

            assert.throws(() => actualTreeLines(input))
          })

          it(`${id} json`, () => {
            const input = unescapeFixtureText(fixture.yaml)

            assert.throws(() => loadAll(input))
          })
          return
        }

        // After inheritance a non-fail fixture must carry at least a `tree`
        // (usually also a `json`). Neither present means nothing to assert,
        // which signals a broken merge or an unexpected suite shape — fail loud.
        if (!hasTree && !hasJson) {
          it(`${id} usable`, () => {
            assert.fail('fixture has no usable expectation after merge')
          })
          return
        }

        it(`${id} tree`, () => {
          const input = unescapeFixtureText(fixture.yaml)

          assert.deepStrictEqual(actualTreeLines(input), expectedTreeLines(fixture.tree))
        })

        // `json`/`round-trip` need the suite's JSON expectation; `dump` below
        // does not — it parses YAML and compares to the `dump` field directly,
        // so it must not sit behind this gate.
        if (hasJson) {
          it(`${id} json`, () => {
            const input = unescapeFixtureText(fixture.yaml)
            const result = loadAll(input, { schema: SPEC_SCHEMA })
            const expected = parseConcatenatedJson(unescapeFixtureText(fixture.json))

            assert.deepStrictEqual(result, expected)
          })

          it(`${id} round-trip`, () => {
            const input = unescapeFixtureText(fixture.yaml)
            const docs = loadAll(input, { schema: SPEC_SCHEMA })

            // dump() emits a single document without a `---` marker, so join
            // multi-document fixtures with explicit markers before reloading.
            const dumped = docs.map(doc => `---\n${dump(doc)}`).join('')

            assert.deepStrictEqual(loadAll(dumped, { schema: SPEC_SCHEMA }), docs)
          })
        }

        // Some fixture style diverge, and difficult to use
        const divergedFixtures = [
          // null vs empty scalar
          '4ABK', 'DK95',
          // missing block scalar indent indicator
          '4QFQ', 'K858', 'R4YG',
        ]

        if (hasDump || hasEmit) {
          // Dump straight from the parsed events (styles/tags/anchors preserved)
          // and compare byte-for-byte to the suite's canonical `dump`.
          it(`${id} dump`, { skip: divergedFixtures.includes(id) }, () => {
            const input = unescapeFixtureText(fixture.yaml)
            const events = parseEvents(input, {})

            const opts = { schema: SPEC_SCHEMA, seqNoIndent: true }
            const documents = eventsToAst(events, { ...opts, source: input })

            // Our AST stays faithful to the input, but the suite's `dump`
            // samples follow fixed canonical-dump conventions. Bend the AST to
            // match those samples before presenting; the presenter and
            // `from_events` stay faithful, this lives test-side.

            // Samples carry no %YAML/%TAG directives — tags are expanded inline.
            for (const doc of documents) {
              const tagHandlers = tagHandlersFromDirectives(doc.directives)

              visit([doc], (node) => {
                if (node.style.tagged && node.tag !== '!') node.tag = tagNameShort(tagNameFull(node.tag, tagHandlers))
              })

              doc.directives = []
            }

            // Samples always render collections as block; only empty `{}`/`[]`
            // stay flow (they have no block form).
            visit(documents, (node) => {
              if (node.kind === 'sequence' || node.kind === 'mapping') {
                node.style.flow = false
              }
            })

            // Samples never present scalar values as block/plain, so fall back
            // to the quoting they use.
            visit(documents, (node) => {
              if (node.kind !== 'scalar') return

              const { style, value } = node

              const isPlain = !style.singleQuoted && !style.doubleQuoted &&
                !style.literal && !style.folded

              const unsafeBlock = /^ +$/m.test(value) || /^ +\t/m.test(value) ||
                (style.folded && value.includes('\t'))

              if ((style.literal || style.folded) && (unsafeBlock || value === '')) {
                style.literal = false
                style.folded = false
                style.doubleQuoted = true
              } else if (isPlain && (value.includes('\n') || value.startsWith('---'))) {
                style.singleQuoted = true
              }
            })

            // Samples double-quote any scalar with non-ASCII chars.
            visit(documents, (node) => {
              if (node.kind === 'scalar' && /[\u0080-\uffff]/.test(node.value)) {
                node.style.singleQuoted = false
                node.style.literal = false
                node.style.folded = false
                node.style.doubleQuoted = true
              }
            })

            const out = normalizeDumpMarkers(present(documents, opts))

            const emitOk = hasEmit && out === normalizeFixtureEmit(fixture.emit)
            const dumpOk = hasDump && out === normalizeFixtureDump(fixture.dump)

            // The suite carries two reference renderings: `dump` (canonical) and
            // an optional `emit`. They were assembled across generations and a
            // handful disagree; accept our faithful output if it matches either,
            // otherwise assert against `dump` for a readable diff.
            if (!emitOk && !dumpOk) {
              if (hasDump) {
                assert.strictEqual(out, normalizeFixtureDump(fixture.dump))
              } else {
                assert.strictEqual(out, normalizeFixtureEmit(fixture.emit))
              }
            }
          })
        }
      })
    })
  }
})
