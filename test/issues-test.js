require(__dirname + '/helper')
  .suite('Issues', __dirname + '/issues', /^issue-\d+\.js$/)
  .export(module);
