// see https://nodejs.org/api/esm.html#esm_import_statements
// Only the “default export” is supported for CommonJS files or packages:

import yaml from './lib/js-yaml.js';

const {
  Type,
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SAFE_SCHEMA,
  DEFAULT_FULL_SCHEMA,
  load,
  loadAll,
  safeLoad,
  safeLoadAll,
  dump,
  safeDump,
  YAMLException,
  MINIMAL_SCHEMA,
  SAFE_SCHEMA,
  DEFAULT_SCHEMA,
  scan,
  parse,
  compose,
  addConstructor,
} = yaml;

export {
  Type,
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SAFE_SCHEMA,
  DEFAULT_FULL_SCHEMA,
  load,
  loadAll,
  safeLoad,
  safeLoadAll,
  dump,
  safeDump,
  YAMLException,
  MINIMAL_SCHEMA,
  SAFE_SCHEMA,
  DEFAULT_SCHEMA,
  scan,
  parse,
  compose,
  addConstructor,
};
