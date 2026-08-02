import { defineScalarTag, MERGE_KEY, NOT_RESOLVED } from '../../tag.ts'

/** @category Tags */
const mergeTag = defineScalarTag('tag:yaml.org,2002:merge', {
  implicit: true,
  // source.charAt(0) over matched implicit inputs: '<' ('<<').
  implicitFirstChars: ['<'],
  resolve: (source, isExplicit) => {
    if (source === '<<' || (isExplicit && source === '')) return MERGE_KEY
    return NOT_RESOLVED
  }
})

export { mergeTag }
