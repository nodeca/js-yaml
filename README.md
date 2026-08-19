# js-yaml

[![CI](https://github.com/nodeca/js-yaml/actions/workflows/ci.yml/badge.svg)](https://github.com/nodeca/js-yaml/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/js-yaml.svg)](https://www.npmjs.org/package/js-yaml)

> YAML 1.2 parser and serializer for JavaScript.

__[Online demo](https://nodeca.github.io/js-yaml/)__

- Supports the YAML 1.2 and YAML 1.1 specifications.
- Passes the entire [YAML Test Suite](https://github.com/yaml/yaml-test-suite).


### [Documentation >>](https://nodeca.github.io/js-yaml/doc/)


##### Install

```bash
npm install js-yaml
```


##### Usage

```js
import { load } from 'js-yaml'

try {
  const document = load('greeting: hello')
  console.log(document.greeting)
} catch (e) {
  console.error(e)
}
```

```js
import { dump } from 'js-yaml'

const source = dump({ greeting: 'hello' })
console.log(source)
```

[More usage examples](docs/usage.md).
