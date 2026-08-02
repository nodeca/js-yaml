import { defineScalarTag, NOT_RESOLVED } from '../../tag.ts'

// YAML 1.2 JSON schema implicit resolution:
// -? ( 0 | [1-9] [0-9]* )
const YAML_INTEGER_IMPLICIT_PATTERN = new RegExp(
  '^-?(?:0|[1-9][0-9]*)$')

// Explicit `!!int` validation is separate from JSON implicit resolution.
const YAML_INTEGER_EXPLICIT_PATTERN = new RegExp(
  // 0b1010
  '^(?:[-+]?0b[0-1]+' +
  // 0o123
  '|[-+]?0o[0-7]+' +
  // 0x1A
  '|[-+]?0x[0-9a-fA-F]+' +
  // 12345
  '|[-+]?[0-9]+)$')

function parseYamlInteger (source: string) {
  let value = source
  let sign = 1

  if (value[0] === '-' || value[0] === '+') {
    if (value[0] === '-') sign = -1
    value = value.slice(1)
  }

  if (value.startsWith('0b')) return sign * parseInt(value.slice(2), 2)
  if (value.startsWith('0o')) return sign * parseInt(value.slice(2), 8)
  if (value.startsWith('0x')) return sign * parseInt(value.slice(2), 16)

  return sign * parseInt(value, 10)
}

function resolveYamlInteger (source: string, isExplicit: boolean) {
  if (isExplicit) {
    if (!YAML_INTEGER_EXPLICIT_PATTERN.test(source)) return NOT_RESOLVED
  } else if (!YAML_INTEGER_IMPLICIT_PATTERN.test(source)) {
    return NOT_RESOLVED
  }

  const result = parseYamlInteger(source)
  return Number.isFinite(result) ? result : NOT_RESOLVED
}

/** @category Tags */
const intJsonTag = defineScalarTag('tag:yaml.org,2002:int', {
  implicit: true,
  // Superset of source.charAt(0) over all matched inputs: optional '-' or digit.
  implicitFirstChars: ['-', ...'0123456789'],
  resolve: resolveYamlInteger,
  identify: (object) =>
    // No ancient boxed numbers support
    Number.isInteger(object) &&
    // Negative zero => !!float
    !Object.is(object, -0) &&
    // Exponential form => !!float, round-trip for !!int 1e21 will be broken
    object.toString(10).indexOf('e') < 0,
  represent: (object: number) => object.toString(10)
})

export { intJsonTag }
