---
title: Tags info
category: Tags
---

# Tags

Tags contain implementations for all supported YAML versions and schemas.
Since tag rules may differ slightly between versions and schemas, a single
YAML tag can have several variants.

Since predefined schemas are available, tags are usually needed only when:

- you need to add {@link mergeTag} or replace {@link mapTag} with
  {@link realMapTag};
- you want to quickly customize an existing tag without defining it from
  scratch.
