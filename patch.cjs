const fs = require('fs');
let code = fs.readFileSync('src/modules/leads/api/queries.ts', 'utf8');

code = code.replace(
  'await api.patch(/leads/logs//complete);',
  'await api.put(/leads/logs//complete);'
);

code = code.replace(
  'await api.patch(/leads/logs//cancel);',
  'await api.put(/leads/logs//cancel);'
);

fs.writeFileSync('src/modules/leads/api/queries.ts', code);
