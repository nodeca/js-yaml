import { defineScalarTag, NOT_RESOLVED } from '../../tag.ts'

const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/

function resolveYamlBinary (source: string) {
  // Strip allowed whitespace first, so validation stays a plain base64 check.
  const input = source.replace(/\s/g, '')
  if (input.length % 4 !== 0 || !BASE64_PATTERN.test(input)) return NOT_RESOLVED

  const binary = atob(input)
  const result = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    result[index] = binary.charCodeAt(index)
  }
  return result
}

function representYamlBinary (object: Uint8Array) {
  let binary = ''
  for (let index = 0; index < object.length; index++) {
    binary += String.fromCharCode(object[index])
  }
  return btoa(binary)
}

/** @category Tags */
const binaryTag = defineScalarTag('tag:yaml.org,2002:binary', {
  resolve: resolveYamlBinary,
  identify: (object) => Object.prototype.toString.call(object) === '[object Uint8Array]',
  represent: representYamlBinary
})

export { binaryTag }
