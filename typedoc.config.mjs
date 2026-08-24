import { Converter } from 'typedoc'
import condensedThemePlugin from './support/typedoc_condensed_theme/condensed_theme_plugin.mjs'

// Places CHANGELOG.md in Documents without adding TypeDoc frontmatter to it.
function changelogPlugin (app) {
  app.converter.on(Converter.EVENT_CREATE_DOCUMENT, (_context, document) => {
    if (document.name !== 'CHANGELOG') return

    document.frontmatter.category = 'Documents'
  })
}

export default {
  entryPoints: ['src/index.ts'],
  projectDocuments: [
    'docs/safety.md',
    'docs/usage.md',
    'docs/custom_tags.md',
    'docs/scalar_styling.md',
    'docs/migrate_v4_to_v5.md',
    'docs/schemas_info.md',
    'docs/tags_info.md',
    'CHANGELOG.md'
  ],
  plugin: [changelogPlugin, condensedThemePlugin],
  alwaysCreateEntryPointModule: false,
  excludeInternal: true,
  out: 'demo/doc',
  theme: 'condensed',
  includeVersion: true,
  markdownLinkExternal: true,
  sourceLinkExternal: true,
  sourceLinkTemplate: 'https://github.com/nodeca/js-yaml/blob/{gitRevision:short}/{path}#L{line}',
  navigationLinks: {
    GitHub: 'https://github.com/nodeca/js-yaml'
  },
  defaultCategory: 'missed (default)',
  categoryOrder: [
    'Main',
    'Documents',
    'Schemas',
    'Tags',
    'Events',
    'Nodes',
    'AST',
    '*',
    'missed (default)'
  ],
  sort: ['source-order'],
  navigation: {
    includeCategories: true
  }
}
