---
title: Custom tags
category: Main
---

# Custom tags

## Custom sequence and mapping tags

Use `defineSequenceTag()` when a value is represented by positional items, and
`defineMappingTag()` when it is represented by named fields.

```javascript
import { CORE_SCHEMA, defineMappingTag, defineSequenceTag, dump, load } from 'js-yaml'

class Point {
  constructor (x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z
  }
}

class Space {
  constructor (height = 0, width = 0, points = []) {
    this.height = height; this.width = width; this.points = points
  }
}

const schema = CORE_SCHEMA.withTags(
  defineSequenceTag('!point', {
    create: () => new Point(),
    addItem: (point, value, index) => {
      if (index === 0) point.x = value
      else if (index === 1) point.y = value
      else if (index === 2) point.z = value
      else throw new Error('!point expects exactly 3 items')
    },
    identify: value => value instanceof Point,
    represent: point => [point.x, point.y, point.z]
  }),

  defineMappingTag('!space', {
    create: () => new Space(),
    addPair: (space, key, value) => {
      if (key === 'height') space.height = value
      else if (key === 'width') space.width = value
      else if (key === 'points') space.points = value
      return ''
    },
    has: () => false,
    keys: space => Object.keys(space),
    get: (space, key) => space[key],
    identify: value => value instanceof Space,
    represent: space => new Map([
      ['height', space.height],
      ['width', space.width],
      ['points', space.points]
    ])
  })
)

// Load and dump custom tags.
const source = `
spaces:
  - !space
    height: 1000
    width: 1000
    points:
      - !point [10, 43, 23]
      - !point [165, 0, 50]
`

const value = load(source, { schema })

value.spaces[0] instanceof Space // true
value.spaces[0].points[0] instanceof Point // true

console.log(dump(value, { schema, flowLevel: 3 }))
```

Output:

```yaml
spaces:
  - !space
    height: 1000
    width: 1000
    points: [!point [10, 43, 23], !point [165, 0, 50]]
```

## Immutable custom tags

To produce immutable values, build them in two stages. First, collect their
contents in a mutable carrier. Then use `finalize` to create the actual object
from the completed carrier:

```javascript
import { CORE_SCHEMA, defineSequenceTag, load } from 'js-yaml'

class ImmutablePoint {
  constructor (coordinates) {
    this.coordinates = Object.freeze([...coordinates]); Object.freeze(this)
  }
}

const schema = CORE_SCHEMA.withTags(defineSequenceTag('!point', {
  create: () => [],
  addItem: (carrier, item) => {
    if (typeof item !== 'number') return '!point coordinates must be numbers'
    carrier.push(item)
  },
  finalize: carrier => {
    if (carrier.length !== 2) throw new Error('!point expects exactly 2 coordinates')
    return new ImmutablePoint(carrier)
  },
  identify: value => value instanceof ImmutablePoint,
  represent: point => point.coordinates
}))

const point = load('!point [10, 20]', { schema })

console.log(point)
```

Output:

```text
ImmutablePoint { coordinates: [ 10, 20 ] }
```

## Unknown custom tags

If tag names are not known in advance, set `matchByTagPrefix` on one definition
for each YAML node kind. Use `representTagName` to preserve the matched tag name
when dumping.

```javascript
import { CORE_SCHEMA, defineMappingTag, defineScalarTag, defineSequenceTag, dump, load } from 'js-yaml'

class TaggedValue {
  constructor (tagName, nodeKind, value) {
    this.tagName = tagName; this.nodeKind = nodeKind; this.value = value
  }
}

const schema = CORE_SCHEMA.withTags(
  defineScalarTag('!', {
    matchByTagPrefix: true,
    resolve: (source, _isExplicit, tagName) => new TaggedValue(tagName, 'scalar', source),
    identify: value => value instanceof TaggedValue && value.nodeKind === 'scalar',
    representTagName: value => value.tagName,
    represent: value => value.value
  }),

  defineSequenceTag('!', {
    matchByTagPrefix: true,
    create: tagName => new TaggedValue(tagName, 'sequence', []),
    addItem: (tagged, item) => { tagged.value.push(item) },
    identify: value => value instanceof TaggedValue && value.nodeKind === 'sequence',
    representTagName: value => value.tagName,
    represent: value => value.value
  }),

  defineMappingTag('!', {
    matchByTagPrefix: true,
    create: tagName => new TaggedValue(tagName, 'mapping', new Map()),
    addPair: (tagged, key, value) => {
      tagged.value.set(key, value)
      return ''
    },
    has: (tagged, key) => tagged.value.has(key),
    keys: tagged => tagged.value.keys(),
    get: (tagged, key) => tagged.value.get(key),
    identify: value => value instanceof TaggedValue && value.nodeKind === 'mapping',
    representTagName: value => value.tagName,
    represent: value => value.value
  })
)

// Load and dump arbitrary tags.
const source = `
scalar: !unknown_scalar_tag foo bar
sequence: !unknown_sequence_tag [1, 2, 3]
mapping: !unknown_mapping_tag { foo: 1, bar: 2 }
`

const value = load(source, { schema })

console.log(dump(value, { schema, flowLevel: 1 }))
```

Output:

```yaml
scalar: !unknown_scalar_tag foo bar
sequence: !unknown_sequence_tag [1, 2, 3]
mapping: !unknown_mapping_tag {foo: 1, bar: 2}
```
