const DEFAULT_TAG_HANDLERS: Readonly<Record<string, string>> = Object.assign(
  Object.create(null),
  {
    '!': '!',
    '!!': 'tag:yaml.org,2002:'
  }
)

// YAML 1.2.2, [40] ns-tag-char and [39] ns-uri-char, apart from alphanumerics.
const TAG_SUFFIX_CHARS = "-#;/?:@&=+$_.~*'()"
const TAG_URI_CHARS = TAG_SUFFIX_CHARS + '!,[]'
const HEX = '0123456789ABCDEF'

function percentByte (byte: number) {
  return '%' + HEX[byte >> 4] + HEX[byte & 0x0F]
}

function tagPercentEncode (source: string, isSuffix: boolean) {
  const allowed = isSuffix ? TAG_SUFFIX_CHARS : TAG_URI_CHARS
  let result = ''

  for (let index = 0; index < source.length; index++) {
    let ch = source.charCodeAt(index)

    if ((ch >= 0x30 && ch <= 0x39) ||
        (ch >= 0x41 && ch <= 0x5A) ||
        (ch >= 0x61 && ch <= 0x7A) ||
        allowed.includes(source[index])) {
      result += source[index]
      continue
    }

    if (ch >= 0xD800 && ch <= 0xDBFF) {
      ch = 0x10000 + ((ch & 0x3FF) << 10) + (source.charCodeAt(++index) & 0x3FF)
    }

    if (ch < 0x80) {
      result += percentByte(ch)
    } else if (ch < 0x800) {
      result += percentByte(0xC0 | (ch >> 6)) + percentByte(0x80 | (ch & 0x3F))
    } else if (ch < 0x10000) {
      result += percentByte(0xE0 | (ch >> 12)) +
        percentByte(0x80 | ((ch >> 6) & 0x3F)) + percentByte(0x80 | (ch & 0x3F))
    } else {
      result += percentByte(0xF0 | (ch >> 18)) +
        percentByte(0x80 | ((ch >> 12) & 0x3F)) +
        percentByte(0x80 | ((ch >> 6) & 0x3F)) + percentByte(0x80 | (ch & 0x3F))
    }
  }

  return result
}

function tagPercentDecode (source: string) {
  let result = ''
  let index = 0

  // Convert escaped UTF-8 bytes without validating malformed encodings.
  while (index < source.length) {
    if (source.charCodeAt(index) !== 0x25/* % */) {
      result += source[index++]
      continue
    }

    let ch = parseInt(source.slice(index + 1, index + 3), 16)
    index += 3

    if (ch >= 0xC0) {
      let remaining = ch < 0xE0 ? 1 : ch < 0xF0 ? 2 : 3
      ch &= (1 << (6 - remaining)) - 1

      while (remaining-- > 0) {
        ch = (ch << 6) | (parseInt(source.slice(index + 1, index + 3), 16) & 0x3F)
        index += 3
      }
    }

    if (ch < 0x10000) {
      result += String.fromCharCode(ch)
    } else {
      ch -= 0x10000
      result += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF))
    }
  }

  return result
}

function tagNameFull (rawTag: string, tagHandlers?: Readonly<Record<string, string>>) {
  if (rawTag.startsWith('!<') && rawTag.endsWith('>')) {
    return tagPercentDecode(rawTag.slice(2, -1))
  }

  const handleEnd = rawTag.indexOf('!', 1)
  const handle = handleEnd === -1 ? '!' : rawTag.slice(0, handleEnd + 1)
  const prefix = tagHandlers?.[handle] ?? DEFAULT_TAG_HANDLERS[handle] ?? handle

  return tagPercentDecode(prefix) + tagPercentDecode(rawTag.slice(handle.length))
}

function tagNameShort (fullTag: string) {
  let tag = fullTag

  if (tag.charCodeAt(0) === 0x21) {
    tag = tag.slice(1)
    return `!${tagPercentEncode(tag, true)}`
  }

  if (tag.slice(0, 18) === 'tag:yaml.org,2002:') {
    return `!!${tagPercentEncode(tag.slice(18), true)}`
  }

  return `!<${tagPercentEncode(tag, false)}>`
}

export {
  tagNameFull,
  tagNameShort
}
