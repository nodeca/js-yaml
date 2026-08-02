import { defineScalarTag, NOT_RESOLVED } from '../../tag.ts'

const NULL_VALUES = ['', '~', 'null', 'Null', 'NULL']

/** @category Tags */
const nullCoreTag = defineScalarTag('tag:yaml.org,2002:null', {
  implicit: true,
  // Superset of source.charAt(0) over all matched inputs: '' (empty), '~', 'null'/'Null'/'NULL'.
  implicitFirstChars: ['', '~', 'n', 'N'],
  resolve: (source) => {
    if (NULL_VALUES.indexOf(source) !== -1) return null

    return NOT_RESOLVED
  },
  identify: (object) => object === null,
  represent: () => 'null'
})

export { nullCoreTag }
