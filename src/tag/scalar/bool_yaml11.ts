import { defineScalarTag, NOT_RESOLVED } from '../../tag.ts'

const TRUE_VALUES = ['true', 'True', 'TRUE', 'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON']
const FALSE_VALUES = ['false', 'False', 'FALSE', 'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF']

/** @category Tags */
const boolYaml11Tag = defineScalarTag('tag:yaml.org,2002:bool', {
  implicit: true,
  // Superset of source.charAt(0) over all matched inputs.
  implicitFirstChars: ['y', 'Y', 'n', 'N', 't', 'T', 'f', 'F', 'o', 'O'],
  resolve: (source) => {
    if (TRUE_VALUES.indexOf(source) !== -1) return true
    if (FALSE_VALUES.indexOf(source) !== -1) return false

    return NOT_RESOLVED
  },
  identify: (object) => Object.prototype.toString.call(object) === '[object Boolean]',
  represent: (object) => object ? 'true' : 'false'
})

export { boolYaml11Tag }
