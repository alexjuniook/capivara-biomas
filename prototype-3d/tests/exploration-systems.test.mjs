import test from 'node:test';
import assert from 'node:assert/strict';
import {StaminaSystem,CheckpointSystem} from '../src/systems/ExplorationSystems.js';
function storage(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};}
test('stamina drains while running, recovers at rest and prevents exhaustion abuse',()=>{const s=new StaminaSystem({drain:50,recovery:20});const run=s.update(.05,{running:true,moving:true});assert.ok(run.value<100);s.value=1;const empty=s.update(.05,{running:true,moving:true});assert.equal(empty.canRun,false);assert.equal(empty.exhausted,true);s.update(1,{running:false});assert.ok(s.value>1);});
test('checkpoint remembers the last safe point for each biome',()=>{const store=storage(),c=new CheckpointSystem(store);c.setPosition([3,0,-8],'Clareira');assert.deepEqual(c.respawn(),[3,0,-8]);c.setBiome('glacial');assert.deepEqual(c.respawn(),[0,0,5]);const restored=new CheckpointSystem(store);assert.deepEqual(restored.setBiome('amazon').position,[3,0,-8]);});
test('invalid checkpoint data cannot corrupt respawn coordinates',()=>{const c=new CheckpointSystem(storage());assert.equal(c.setPosition([NaN,0,0]),false);assert.deepEqual(c.respawn(),[0,0,5]);});
