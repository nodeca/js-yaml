import neostandard from 'neostandard'

export default [
  ...neostandard({
    env: ['browser', 'node']
  }),
  {
    ignores: [
      'benchmark/extra/**',
      'coverage/**',
      'demo/**',
      'dist/**'
    ]
  },
  {
    rules: {
      'object-shorthand': 'off',
    }
  }
]
