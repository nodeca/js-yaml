---
title: Scalar styling
category: Documents
---

# Scalar styling

Scalar styling controls how strings are written without changing their values:
plain, quoted, literal (`|`), or folded (`>`).

The presenter provides default rules that choose string styles based on their
content. If those defaults do not suit your needs, customize them with the
`scalarStyleRules` option.

## Example: allow tabs in block scalars

By default, `dump()` writes strings containing tabs with double quotes so the
tabs are visible:

```yaml
text: "first line\n\tindented line\n"
```

Tabs are also valid inside block scalars. If you prefer to allow tabs in block
scalars:

```javascript
import { DEFAULT_SCALAR_STYLE_RULES, SCALAR_STYLE, dump } from 'js-yaml'

const scalarStyleRules = Object.values({
  ...DEFAULT_SCALAR_STYLE_RULES,

  doubleQuoteForInvisibles: layout => {
    if (layout.style === SCALAR_STYLE.PLAIN &&
        // Original regex, but without tab
        /[\x7F-\xA0\u2028\u2029\uFEFF\uFFFE\uFFFF]/.test(layout.node.value)) {
      layout.style = SCALAR_STYLE.DOUBLE_QUOTED
    }
  }
})

console.log(dump({ text: 'first line\n\tindented line\n' }, { scalarStyleRules }))
```

Output (`⇥` marks the tab character):

```yaml
text: |
  first line
  ⇥indented line
```

Loading this YAML restores the original string, including the tab and trailing
line break.
