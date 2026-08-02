import { defineScalarTag, NOT_RESOLVED } from '../../tag.ts'

const YAML_INTEGER_PATTERN = new RegExp(
  // 0b1010
  '^(?:[-+]?0b[0-1_]+' +
  // 0123
  '|[-+]?0[0-7_]+' +
  // 0x1A
  '|[-+]?0x[0-9a-fA-F_]+' +
  // 1:23
  '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+' +
  // 12345
  '|[-+]?(?:0|[1-9][0-9_]*))$')

function parseYamlInteger (source: string) {
  let value = source.replace(/_/g, '')
  let sign = 1

  if (value[0] === '-' || value[0] === '+') {
    if (value[0] === '-') sign = -1
    value = value.slice(1)
  }

  if (value.startsWith('0b')) return sign * parseInt(value.slice(2), 2)
  if (value.startsWith('0x')) return sign * parseInt(value.slice(2), 16)

  if (value.includes(':')) {
    let result = 0
    for (const part of value.split(':')) result = result * 60 + Number(part)
    return sign * result
  }

  if (value !== '0' && value[0] === '0') return sign * parseInt(value, 8)

  return sign * parseInt(value, 10)
}

function resolveYamlInteger (source: string) {
  if (!YAML_INTEGER_PATTERN.test(source)) return NOT_RESOLVED

  const result = parseYamlInteger(source)
  return Number.isFinite(result) ? result : NOT_RESOLVED
}

/** @category Tags */
const intYaml11Tag = defineScalarTag('tag:yaml.org,2002:int', {
  implicit: true,
  // Superset of source.charAt(0) over all matched inputs: optional sign + decimal digit.
  implicitFirstChars: ['-', '+', ...'0123456789'],
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

export { intYaml11Tag }
