import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { load, dump, YAML11_SCHEMA, YAMLException } from 'js-yaml'

describe('tags', () => {
  it('timestamp', () => {
    const src = `
- 2001-12-15T02:59:43.1Z       # canonical
- 2001-12-14t21:59:43.10-05:00 # valid iso8601
- 2001-12-14 21:59:43.10 -5    # space separated
- 2001-12-15 2:59:43.10        # no time zone (Z)
- 2002-12-14                   # date (00:00:00Z)
- 2002-1-1                     # not a date

# Other
- 2001-12-14 21:59:43.10 -5:30
- 2001-12-14 21:59:43.10 +5:30
- 2001-12-14 21:59:43.00101
- 2001-12-14 21:59:43+1
- 2001-12-14 21:59:43-1:30
- 2005-07-08 17:35:04.517600
`
    const expected = [
      new Date(Date.UTC(2001, 11, 15, 2, 59, 43, 100)),
      new Date(Date.UTC(2001, 11, 15, 2, 59, 43, 100)),
      new Date(Date.UTC(2001, 11, 15, 2, 59, 43, 100)),
      new Date(Date.UTC(2001, 11, 15, 2, 59, 43, 100)),
      new Date(Date.UTC(2002, 11, 14)),
      '2002-1-1',

      new Date(Date.UTC(2001, 11, 15, 3, 29, 43, 100)),
      new Date(Date.UTC(2001, 11, 14, 16, 29, 43, 100)),
      new Date(Date.UTC(2001, 11, 14, 21, 59, 43, 1)),
      new Date(Date.UTC(2001, 11, 14, (21 - 1), 59, 43, 0)),
      new Date(Date.UTC(2001, 11, 14, (21 + 1), (59 + 30), 43, 0)),
      new Date(Date.UTC(2005, 6, 8, 17, 35, 4, 517))
    ]

    assert.deepStrictEqual(load(src, { schema: YAML11_SCHEMA }), expected)
    assert.deepStrictEqual(load(dump(expected, { schema: YAML11_SCHEMA }), { schema: YAML11_SCHEMA }), expected)
  })

  it('Resolving explicit !!timestamp on empty node', () => {
    assert.throws(() => { load('!!timestamp', { schema: YAML11_SCHEMA }) }, YAMLException)
  })

  it('timestamp: years 0-99 are not remapped into the 1900s', () => {
    // Build expected dates without Date.UTC(), whose two-digit-year legacy
    // behaviour is exactly what we are guarding against.
    const utc = (y, mo, d, h = 0, mi = 0, s = 0, ms = 0) => {
      const date = new Date(0)
      date.setUTCFullYear(y, mo, d)
      date.setUTCHours(h, mi, s, ms)
      return date
    }

    // Valid four-digit years below 100 must resolve to the real year, not
    // 1900 + year.
    assert.deepStrictEqual(load('0001-01-01', { schema: YAML11_SCHEMA }), utc(1, 0, 1))
    assert.deepStrictEqual(load('0050-06-15T12:30:00Z', { schema: YAML11_SCHEMA }), utc(50, 5, 15, 12, 30, 0))
    assert.deepStrictEqual(load('0099-12-31', { schema: YAML11_SCHEMA }), utc(99, 11, 31))
    // Leap day valid in the real year (year 4 is a leap year).
    assert.deepStrictEqual(load('0004-02-29', { schema: YAML11_SCHEMA }), utc(4, 1, 29))

    // Invalid calendar dates in the low-year range are still rejected (year 1
    // is not a leap year), i.e. left as a plain string.
    assert.strictEqual(load('0001-02-29', { schema: YAML11_SCHEMA }), '0001-02-29')

    // And such dates survive a dump -> load round-trip.
    const dates = [utc(1, 0, 1), utc(50, 5, 15, 12, 30, 0), utc(99, 11, 31)]
    assert.deepStrictEqual(
      load(dump(dates, { schema: YAML11_SCHEMA }), { schema: YAML11_SCHEMA }),
      dates)
  })

  it('timestamp rejects values normalized by Date', () => {
    const invalid = [
      '2023-99-99',
      '2023-02-30',
      '2023-02-31 00:00:00',
      '2023-01-01 24:00:00',
      '2023-01-01 00:60:00',
      '2023-01-01 00:00:60',
      '2023-01-01 00:00:00 +24',
      '2023-01-01 00:00:00 +1:60'
    ]

    for (const value of invalid) {
      assert.strictEqual(load(value, { schema: YAML11_SCHEMA }), value)
      assert.throws(() => load(`!!timestamp ${value}`, { schema: YAML11_SCHEMA }), /cannot resolve/)
    }
  })
})
