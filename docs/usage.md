---
title: Usage examples
category: Main
---

# Usage examples

## Load

Read files explicitly as UTF-8 and pass the filename to `load()` so parse
errors identify the input source:

```javascript
import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'

const filename = 'config.yml'

try {
  const source = readFileSync(filename, 'utf8')
  const config = load(source, { filename })

  console.log(`Starting ${config.service.name} on port ${config.service.port}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
```

For a stream containing several YAML documents, use `loadAll()`:

```javascript
import { loadAll } from 'js-yaml'

const documents = loadAll(`
---
name: api
port: 8080
---
name: worker
concurrency: 4
`)

console.log(documents)
```

Unlike `load()`, `loadAll()` accepts empty and multi-document streams. It
returns an array; an empty stream produces an empty array.

### Schema customization

The most frequent cases are:

- enabling merge keys;
- replacing the default object maps with native `Map` instances.

Here is how to do that:

```javascript
import { CORE_SCHEMA, mergeTag, realMapTag } from 'js-yaml'

const schema = CORE_SCHEMA.withTags(mergeTag, realMapTag)
```

## Dump

`dump()` returns a YAML string with a trailing newline:

```javascript
import { dump } from 'js-yaml'

const config = {
  service: { name: 'api', ports: [8080, 8081] },
  logging: { level: 'info' }
}

const output = dump(config, { lineWidth: 100 })

console.log(output)
```

Unsupported values, such as functions, cause an exception by default. Use
`skipInvalid: true` only when silently dropping those values is intentional.

## CLI

The CLI is intentionally minimal, with no plans to extend its feature set.

```shell
npx js-yaml -h
```
