import test from 'node:test';
import assert from 'node:assert/strict';
import { ProgressStore } from '../src/systems/ProgressStore.js';

function memoryStorage(){
  const values=new Map();
  return {
    getItem(key){return values.has(key)?values.get(key):null;},
    setItem(key,value){values.set(key,String(value));},
    removeItem(key){values.delete(key);}
  };
}

test('load returns an empty save when storage is empty or invalid',()=>{
  globalThis.localStorage=memoryStorage();
  const store=new ProgressStore('test-save');
  assert.deepEqual(store.load(),{});
  localStorage.setItem('test-save','not-json');
  assert.deepEqual(store.load(),{});
});

test('save and load preserve campaign progress safely',()=>{
  globalThis.localStorage=memoryStorage();
  const store=new ProgressStore('test-save');
  assert.equal(store.save({
    collected:[0,2],talked:['Tico'],portalUnlocked:true,
    glacialMode:true,glacialCrystals:[1,3],mammothRescued:true,
    cerradoMode:true,cerradoSeeds:[0,4],anteaterHelped:true,
    cerradoAnimals:['Chico','Seri','Tuca']
  }),true);
  const saved=store.load();
  assert.equal(saved.schemaVersion,2);
  assert.deepEqual(saved.collected,[0,2]);
  assert.deepEqual(saved.talked,['Tico']);
  assert.equal(saved.portalUnlocked,true);
  assert.deepEqual(saved.glacialCrystals,[1,3]);
  assert.equal(saved.mammothRescued,true);
  assert.deepEqual(saved.cerradoSeeds,[0,4]);
  assert.equal(saved.anteaterHelped,true);
  assert.deepEqual(saved.cerradoAnimals,['Chico','Seri','Tuca']);
});

test('save normalizes invalid collection fields and reset clears the slot',()=>{
  globalThis.localStorage=memoryStorage();
  const store=new ProgressStore('test-save');
  assert.equal(store.save({collected:'invalid',talked:null,portalUnlocked:1}),true);
  const saved=store.load();
  assert.deepEqual(saved.collected,[]);
  assert.deepEqual(saved.talked,[]);
  assert.equal(saved.portalUnlocked,true);
  assert.equal(store.reset(),true);
  assert.deepEqual(store.load(),{});
});
