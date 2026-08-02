import { defineScalarTag, NOT_RESOLVED } from '../../tag.ts'

const TRUE_VALUES = ['true', 'True', 'TRUE']
const FALSE_VALUES = ['false', 'False', 'FALSE']

/** @category Tags */
const boolCoreTag = defineScalarTag('tag:yaml.org,2002:bool', {
  implicit: true,
  // Superset of source.charAt(0) over all matched inputs: true/True/TRUE, false/False/FALSE.
  implicitFirstChars: ['t', 'T', 'f', 'F'],
  resolve: (source) => {
    if (TRUE_VALUES.indexOf(source) !== -1) return true
    if (FALSE_VALUES.indexOf(source) !== -1) return false

    return NOT_RESOLVED
  },
  identify: (object) => Object.prototype.toString.call(object) === '[object Boolean]',
  represent: (object) => object ? 'true' : 'false'
})

export { boolCoreTag }
