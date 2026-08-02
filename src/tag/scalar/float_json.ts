import { defineScalarTag, NOT_RESOLVED } from '../../tag.ts'

// YAML 1.2 JSON schema implicit resolution:
// -? ( 0 | [1-9] [0-9]* ) ( \. [0-9]* )? ( [eE] [-+]? [0-9]+ )?
const YAML_FLOAT_IMPLICIT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  '^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$')

// Explicit `!!float` validation is separate from JSON implicit resolution.
const YAML_FLOAT_EXPLICIT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  '^(?:[-+]?[0-9]+(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?' +
  // .2e4, .2
  '|[-+]?\\.[0-9]+(?:[eE][-+]?[0-9]+)?' +
  // .inf
  '|[-+]?\\.(?:inf|Inf|INF)' +
  // .nan
  '|\\.(?:nan|NaN|NAN))$')

function resolveYamlFloat (source: string, isExplicit: boolean) {
  if (isExplicit) {
    if (!YAML_FLOAT_EXPLICIT_PATTERN.test(source)) return NOT_RESOLVED

    let value = source.toLowerCase()
    const sign = value[0] === '-' ? -1 : 1

    if ('+-'.includes(value[0])) value = value.slice(1)

    if (value === '.inf') return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
    if (value === '.nan') return NaN

    const result = sign * parseFloat(value)
    return Number.isFinite(result) ? result : NOT_RESOLVED
  }

  if (!YAML_FLOAT_IMPLICIT_PATTERN.test(source)) return NOT_RESOLVED

  const result = Number(source)

  if (Number.isFinite(result)) return result
  return NOT_RESOLVED
}

function representYamlFloat (object: number) {
  if (isNaN(object)) return '.nan'
  if (object === Number.POSITIVE_INFINITY) return '.inf'
  if (object === Number.NEGATIVE_INFINITY) return '-.inf'
  if (Object.is(object, -0)) return '-0.0'

  const result = object.toString(10)
  return /^[-+]?[0-9]+e/.test(result) ? result.replace('e', '.e') : result
}

/** @category Tags */
const floatJsonTag = defineScalarTag('tag:yaml.org,2002:float', {
  implicit: true,
  // Superset of source.charAt(0) over all matched inputs: optional '-' or digit.
  implicitFirstChars: ['-', ...'0123456789'],
  resolve: resolveYamlFloat,
  identify: (object) =>
    // No ancient boxed numbers support
    typeof object === 'number' &&
    (
      // We land here all numbers, not handled (declined) by !!int `.identify`
      // The same condition as for !!int, but reversed.

      // Filter out integers...
      !Number.isInteger(object) ||
      // but allow negative zero
      Object.is(object, -0) ||
      // and integers with exponential form
      object.toString(10).indexOf('e') >= 0
    ),
  represent: representYamlFloat
})

export { floatJsonTag }
