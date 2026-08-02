import { defineScalarTag, NOT_RESOLVED } from '../../tag.ts'

const YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  '^(?:[-+]?(?:(?:[0-9][0-9_]*)?\\.[0-9_]*)(?:[eE][-+][0-9]+)?' +
  // 190:20:30.15
  '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' +
  // .inf
  '|[-+]?\\.(?:inf|Inf|INF)' +
  // .nan
  '|\\.(?:nan|NaN|NAN))$')

const YAML_FLOAT_SPECIAL_PATTERN = new RegExp(
  '^(?:' +
  // .inf
  '[-+]?\\.(?:inf|Inf|INF)' +
  // .nan
  '|\\.(?:nan|NaN|NAN))$')

function resolveYamlFloat (source: string) {
  if (!YAML_FLOAT_PATTERN.test(source)) return NOT_RESOLVED

  let value = source.toLowerCase().replace(/_/g, '')
  const sign = value[0] === '-' ? -1 : 1

  if ('+-'.includes(value[0])) value = value.slice(1)

  if (value === '.inf') return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
  if (value === '.nan') return NaN

  let result = 0

  if (value.includes(':')) {
    for (const part of value.split(':')) result = result * 60 + Number(part)
    result *= sign
  } else {
    result = sign * parseFloat(value)
  }

  if (Number.isFinite(result) || YAML_FLOAT_SPECIAL_PATTERN.test(source)) return result
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
const floatYaml11Tag = defineScalarTag('tag:yaml.org,2002:float', {
  implicit: true,
  // Superset of source.charAt(0) over all matched inputs: optional sign, '.', or digit
  // ('.inf'/'.nan' start with '.').
  implicitFirstChars: ['-', '+', '.', ...'0123456789'],
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

export { floatYaml11Tag }
