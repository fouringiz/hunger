'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
// Tests must not read git history: a rebase or shallow clone makes those revisions unreachable.
const dir=__dirname,offenders=[];
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.cjs'))){
  if(f==='no-git-history.cjs')continue;
  const s=fs.readFileSync(path.join(dir,f),'utf8');
  if(/execFileSync\(\s*['"]git['"]|execSync\(\s*['"`]git\s|spawnSync\(\s*['"]git['"]/.test(s))offenders.push(f);
}
assert.deepEqual(offenders,[],'tests read git history; pin the revision with tools/pin-history-fixture.cjs and use historical() from tests/lib/history.cjs');
console.log('PASS no test reads git history');
