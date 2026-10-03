// Experimental overlay only. Loaded after the unmodified prototype source.
// Draft schedule: evolve after waves 4 and 8; the next wave inherits the mutation.
const EVOLUTION_EXPERIMENT = {enabled:true, hpMultiplier:1, interval:4};
const originalWaveDef = waveDef;
waveDef = function(n) {
  // Keep the escort and its bounties identical in both experimental conditions.
  return originalWaveDef(n).filter(enemy => enemy.type !== 'coordinator');
};
const originalStartWave = startWave;
startWave = function() { originalStartWave(); S.coordInWave = false; };
const originalMakeEnemy = makeEnemy;
makeEnemy = function(type, n) {
  const enemy = originalMakeEnemy(type, n);
  enemy.hp *= EVOLUTION_EXPERIMENT.hpMultiplier;
  enemy.maxHp *= EVOLUTION_EXPERIMENT.hpMultiplier;
  return enemy;
};
const originalEndWave = endWave;
endWave = function() {
  originalEndWave();
  if (!EVOLUTION_EXPERIMENT.enabled || S.wave >= WAVES || S.wave % EVOLUTION_EXPERIMENT.interval || S.mutations.length >= 2) return;
  let kind = S.dmg.flat >= S.dmg.arc ? 'keratin' : 'sprinter';
  if (S.mutations.includes(kind)) kind = kind === 'keratin' ? 'sprinter' : 'keratin';
  S.mutations.push(kind);
  S.dmg = {flat:0, arc:0};
  S.report = MUT[kind].memo;
  toast('EVOLUTION: ' + MUT[kind].name + ' next wave. Prepare your defense.');
};
