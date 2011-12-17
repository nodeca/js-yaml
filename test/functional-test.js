require(__dirname + '/helper')
  .suite('Functional', __dirname + '/functional', /^functional-.+?\.js$/)
  .export(module);
