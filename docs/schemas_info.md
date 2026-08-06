---
title: Schemas info
category: Schemas
---

# Schemas

Schemas were introduced in YAML 1.2 as a convenient way to define a set of
tags.

YAML 1.2 Schemas:

- {@link CORE_SCHEMA} (default)
- {@link JSON_SCHEMA}
- {@link FAILSAFE_SCHEMA}

Additional Schemas:

- {@link YAML11_SCHEMA} — YAML 1.1 did not define schemas;
  this convenience schema provides the corresponding set of tags.

You will usually use one of the preferred schemas above and customize it with
{@link Schema.withTags | Schema.withTags()}.
