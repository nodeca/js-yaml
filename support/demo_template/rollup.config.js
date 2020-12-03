import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export default [
  {
    input: 'support/demo_template/demo.js',
    output: { file: 'demo/demo.js', format: 'iife', name: 'demo' },
    plugins: [
      nodePolyfills(),
      nodeResolve(),
      commonjs()
    ]
  }
];
