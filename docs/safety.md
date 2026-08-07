---
title: Safety
category: Main
---

# Safety notes for untrusted input

The YAML spec by design allows compact documents that produce objects which are
expensive to materialize. Guard against this when the input is untrusted.

### 1. Limit input size

Limit the input size to the smallest acceptable value.

### 2. Catch all exceptions

`load()` throws on malformed input. Always wrap it in `try/catch` and treat any
error as a rejected document.

### 3. Traverse with a node limit before materializing

Aliases let a tiny document expand into a huge object graph (the "billion
laughs" pattern) and can even create circular references. It stays cheap until
you fully walk it (`JSON.stringify`, deep clone, recursive validation), so do a
cheap pass first that counts every element and bails out past a limit.

The walk is a flat loop over a manual stack — no recursion, so deep documents
can't overflow the call stack. Counting happens as each element is discovered,
so the stack never grows past the limit:

```js
// plain `{}` or `Object.create(null)`, but not Date / Uint8Array / etc.
function isContainer(o) {
  if (Array.isArray(o)) return true
  if (!o || typeof o !== 'object') return false
  const proto = Object.getPrototypeOf(o)
  return proto === Object.prototype || proto === null
}

function guardNodeCount(root, limit) {
  let count = 0
  const stack = [ root ]

  while (stack.length) {
    const node = stack.pop()

    for (const key in node) {
      if (++count > limit) throw new Error('Too many nodes')
      const value = node[key]
      if (isContainer(value)) stack.push(value)
    }
  }
}

try {
  const data = yaml.load(input)
  guardNodeCount(data, 100000)
  const json = JSON.stringify(data)
} catch (e) {
  console.error(e)
}
```

Note: aliases that point to the same node are counted every time they appear
(matching the real materialization cost), and a cyclic document keeps producing
elements until it hits the limit — both are rejected as intended.
