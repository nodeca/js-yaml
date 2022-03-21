'use strict';

var assert = require('assert');
var child_process = require('child_process');
var truncate = require('lodash.truncate');

function assertPureESM(esmPath, rollupCmd = 'rollup') {
  // verify rollup is able to have non-empty output, when not tree shakable.
  var expected = 'const foo = "bar";\n\nexport { foo };\n';

  assert.strictEqual(
    expected,

    // in normal worse case, may have lines > 1k
    truncate(
      child_process
        .execSync(rollupCmd, {
          stdio: [ 'pipe', 'pipe', 'ignore' ],
          input: `export {} from "${esmPath}"; export const foo = "bar"; `
        })
        .toString(),
      {
        length: 4 * expected.length
      }
    )
  );

  // verify rollup js-yaml has empty output, aka tree shakable.
  assert.strictEqual(
    '\n',
    child_process
      .execSync(rollupCmd, {
        stdio: [ 'pipe', 'pipe', 'ignore' ],
        input: `export {} from "${esmPath}"`
      })
      .toString()
  );
}

it('esm should be purely tree shakable', function () {
  assertPureESM('./dist/js-yaml.mjs');
});
