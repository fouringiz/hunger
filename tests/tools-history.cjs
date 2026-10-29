'use strict';
// Capture and diagnostic tools read old revisions only through tools/history.cjs, which prefers pinned fixtures and
// gives a clear error instead of a raw git failure when a revision is gone after a rebase-and-merge.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.join(__dirname,'..','tools'),allowed=new Set(['history.cjs','pin-history-fixture.cjs']),offenders=[];
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.cjs'))){
  if(allowed.has(f))continue;
  if(/execFileSync\(\s*['"]git['"]\s*,\s*\[\s*['"]show['"]/.test(fs.readFileSync(path.join(dir,f),'utf8')))offenders.push(f);
}
assert.deepEqual(offenders,[],'tools call git show directly; use readRevision() from tools/history.cjs');
const {readRevision}=require('../tools/history.cjs');
for(const rev of ['194103f','5d8eb5f','6c66c10','ed1b683','62409dc','c01c1b9'])
  assert.ok(readRevision(rev,'prototype/index.html').includes('<script>'),rev+' baseline is pinned and readable without git history');
assert.throws(()=>readRevision('0000000','prototype/index.html'),/--before <rev>/,'a missing revision explains how to proceed');
console.log('PASS tools read old revisions through pinned fixtures with a clear error for missing ones');
