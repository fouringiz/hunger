const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const canvas = {getContext: () => ({}), style: {}, addEventListener() {}};
const context = vm.createContext({document: {getElementById: () => canvas}, window: {devicePixelRatio: 1}, innerWidth: 960, innerHeight: 540, addEventListener() {}, requestAnimationFrame() {}, performance: {now: () => 0}});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../prototype/index.html'), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1], context);
const rows = vm.runInContext(`
  ['forager','carapacid','leech'].flatMap(type => [false,true].map(mut => {
    reset(); build(SLOTS[2], 'cannon'); const t = S.towers[0];
    if(mut) S.mutations = ['sprinter'];
    const e = makeEnemy(type,5); e.d=480; Object.assign(e,posAt(e.d));
    S.enemies=[e]; S.phase='wave'; S.wave=5;
    const hp=e.hp; fireArc(t,tstats(t),e); const sh=S.shells[0]; t.paused=true;
    for(let i=0;i<40;i++)update(1/60);
    return {type,mutation:mut,damage:hp-e.hp,distanceFromImpact:Math.hypot(e.x-sh.tx,e.y-sh.ty),blastRadius:sh.splash+e.r*.5};
  }))
`, context);
fs.mkdirSync(path.join(__dirname, '../reports/generated'), {recursive: true});
fs.writeFileSync(path.join(__dirname, '../reports/generated/mutation-results.json'), JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify(rows,null,2));
