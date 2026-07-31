const DEFAULT_TAG_HANDLERS: Readonly<Record<string, string>> = Object.assign(
  Object.create(null),
  {
    '!': '!',
    '!!': 'tag:yaml.org,2002:'
  }
)

function tagPercentEncode (source: string) {
  return encodeURI(source).replace(/!/g, '%21')
}

function tagNameFull (rawTag: string, tagHandlers?: Readonly<Record<string, string>>) {
  if (rawTag.startsWith('!<') && rawTag.endsWith('>')) {
    return decodeURIComponent(rawTag.slice(2, -1))
  }

  const handleEnd = rawTag.indexOf('!', 1)
  const handle = handleEnd === -1 ? '!' : rawTag.slice(0, handleEnd + 1)
  const prefix = tagHandlers?.[handle] ?? DEFAULT_TAG_HANDLERS[handle] ?? handle

  return decodeURIComponent(prefix) + decodeURIComponent(rawTag.slice(handle.length))
}

function tagNameShort (fullTag: string) {
  let tag = fullTag

  if (tag.charCodeAt(0) === 0x21) {
    tag = tag.slice(1)
    return `!${tagPercentEncode(tag)}`
  }

  if (tag.slice(0, 18) === 'tag:yaml.org,2002:') {
    return `!!${tagPercentEncode(tag.slice(18))}`
  }

  return `!<${tagPercentEncode(tag)}>`
}

export {
  tagNameFull,
  tagNameShort
}
