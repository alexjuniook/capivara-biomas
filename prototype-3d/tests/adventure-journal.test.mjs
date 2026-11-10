import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureJournal } from '../src/systems/AdventureJournal.js';

function memoryStorage(){
  const values=new Map();
  return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),values};
}

test('journal unlocks fruit, conversation and portal achievements',()=>{
  const journal=new AdventureJournal(memoryStorage());
  assert.equal(journal.record('fruit').length,1);
  assert.ok(journal.record('fruit',7).some(id=>id==='fruit_master'));
  assert.ok(journal.record('talk').includes('first_friend'));
  assert.ok(journal.record('tico').includes('tico_friend'));
  assert.ok(journal.record('portal').includes('portal_open'));
});

test('journal unlocks three-biome and exploration-time achievements',()=>{
  const journal=new AdventureJournal(memoryStorage());
  journal.visitBiome('amazon');journal.visitBiome('glacial');
  assert.ok(journal.visitBiome('cerrado').includes('three_eras'));
  assert.ok(journal.tick(1200).includes('long_journey'));
});

test('journal tracks unique fauna, weather and ignores invalid biomes',()=>{
  const journal=new AdventureJournal(memoryStorage());
  journal.record('fauna',3);
  assert.ok(journal.record('guara').includes('guara_sighting'));
  assert.ok(journal.tick(1,{weather:'storm'}).includes('storm_watcher'));
  journal.visitBiome('unknown');
  assert.deepEqual(journal.getSummary().biomes,[]);
});

test('journal safely restores and persists progress',()=>{
  const storage=memoryStorage();
  const journal=new AdventureJournal(storage);
  journal.record('crystal',5);
  journal.tick(12);
  const restored=new AdventureJournal(storage);
  assert.ok(restored.getUnlocked().some(item=>item.id==='crystal_master'));
  assert.equal(restored.getSummary().minutes,0);
  assert.equal(restored.getSummary().unlocked,2);
});
