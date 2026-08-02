import { defineScalarTag } from '../../tag.ts'

/** @category Tags */
const strTag = defineScalarTag('tag:yaml.org,2002:str', {
  resolve: (source) => source,
  identify: (data) => typeof data === 'string'
})

export { strTag }
