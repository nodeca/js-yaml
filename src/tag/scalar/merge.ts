import { defineScalarTag, NOT_RESOLVED } from '../../tag.ts'

/**
 * Enables merge keys in {@link CORE_SCHEMA} when added with
 * {@link Schema.withTags}.
 *
 * @category Tags
 */
const mergeTag = defineScalarTag('tag:yaml.org,2002:merge', {
  implicit: true,
  // source.charAt(0) over matched implicit inputs: '<' ('<<').
  implicitFirstChars: ['<'],
  // Merge semantics live in the tag, not in the value: the constructor acts on
  // a key tagged `!!merge`, so `<<` anywhere else is just this string.
  resolve: (source, isExplicit) => {
    if (source === '<<' || (isExplicit && source === '')) return '<<'
    return NOT_RESOLVED
  },
  identify: () => false
})

export { mergeTag }
