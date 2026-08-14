import { defineScalarTag, NOT_RESOLVED } from '../../tag.ts'

const YAML_DATE_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$')

const YAML_TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])' +
  '-([0-9][0-9]?)' +
  '-([0-9][0-9]?)' +
  '(?:[Tt]|[ \\t]+)' +
  '([0-9][0-9]?)' +
  ':([0-9][0-9])' +
  ':([0-9][0-9])' +
  '(?:\\.([0-9]*))?' +
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' +
  '(?::([0-9][0-9]))?))?$')

function makeUtcDate (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  fraction = 0
) {
  const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction))

  // Date.UTC() treats years 0..99 as 1900..1999. Restore the parsed YAML year
  // before validating calendar normalization, e.g. reject 0001-02-29.
  date.setUTCFullYear(year, month, day)

  return date
}

function resolveYamlTimestamp (source: string) {
  let match = YAML_DATE_REGEXP.exec(source)
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(source)
  if (match === null) return NOT_RESOLVED

  const year = +(match[1])
  const month = +(match[2]) - 1
  const day = +(match[3])

  // Date-only form (`YYYY-MM-DD`) has no time captures.
  if (!match[4]) {
    const date = makeUtcDate(year, month, day)
    // Reject dates that JS would normalize, e.g. 2023-02-29 -> 2023-03-01.
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
      return NOT_RESOLVED
    }
    return date
  }

  const hour = +(match[4])
  const minute = +(match[5])
  const second = +(match[6])
  let fraction = 0

  // Reject times that JS would normalize into the next minute/hour/day.
  if (hour > 23 || minute > 59 || second > 59) return NOT_RESOLVED

  if (match[7]) {
    let value = match[7].slice(0, 3)
    while (value.length < 3) value += '0'
    fraction = +value
  }

  const date = makeUtcDate(year, month, day, hour, minute, second, fraction)

  // Reject invalid calendar dates before applying timezone offset.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
    return NOT_RESOLVED
  }

  if (match[9]) {
    const offsetHour = +(match[10])
    const offsetMinute = +(match[11] || 0)
    // Reject timezone offsets that JS date arithmetic would otherwise accept.
    if (offsetHour > 23 || offsetMinute > 59) return NOT_RESOLVED

    const offset = (offsetHour * 60 + offsetMinute) * 60000
    date.setTime(date.getTime() - (match[9] === '-' ? -offset : offset))
  }

  return date
}

/**
 * The YAML 1.1 `!!timestamp` tag, represented as a JavaScript `Date`.
 *
 * @category Tags
 */
const timestampTag = defineScalarTag('tag:yaml.org,2002:timestamp', {
  implicit: true,
  // Both patterns start with a 4-digit year, so source.charAt(0) is always a digit.
  implicitFirstChars: [...'0123456789'],
  resolve: resolveYamlTimestamp,
  identify: (object) => object instanceof Date,
  represent: (object: Date) => object.toISOString()
})

export { timestampTag }
