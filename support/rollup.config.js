import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from '../package.json';
import { terser } from 'rollup-plugin-terser';

const banner = {
  banner() {
    return `/*! ${pkg.name} ${pkg.version} https://github.com/${pkg.repository} @license ${pkg.license} */`;
  }
}

const plugins = [ nodeResolve(), commonjs(), banner ];

const umd_out_base = { format: 'umd', name: 'jsyaml', exports: 'named' };

export default [
  // es5
  {
    input: 'index.js',
    output: [
      { ...umd_out_base, file: 'dist/js-yaml.js' },
      { ...umd_out_base, file: 'dist/js-yaml.min.js', plugins: [ terser() ] }
    ],
    plugins
  },
  // esm
  {
    input: 'index.js',
    output: [
      { format: 'esm', file: 'dist/js-yaml.mjs' },
    ],
    plugins
  }
];
