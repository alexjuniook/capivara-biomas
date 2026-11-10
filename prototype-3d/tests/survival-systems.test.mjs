import test from 'node:test';
import assert from 'node:assert/strict';
import { SurvivalSystems } from '../src/systems/SurvivalSystems.js';
function storage(){const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
test('sobrevivência consome fome e água com delta limitado',()=>{const game=new SurvivalSystems(storage());game.update(1,{moving:true,running:true});assert.ok(game.state.hunger<100);assert.ok(game.state.hydration<100);});
test('inventário permite comer e recuperar vida',()=>{const game=new SurvivalSystems(storage());game.state.health=50;game.addItem('fruits');assert.equal(game.eat(),true);assert.ok(game.state.health>50);assert.equal(game.state.inventory.fruits,0);});
test('esquiva e susto têm recarga',()=>{const game=new SurvivalSystems(storage());assert.equal(game.dodge(),true);assert.equal(game.dodge(),false);assert.equal(game.useScare(),true);assert.equal(game.useScare(),false);});
test('mergulho consome oxigênio e recupera fora da água',()=>{const game=new SurvivalSystems(storage());game.update(.05,{inWater:true});assert.ok(game.state.oxygen<100);game.update(.05,{inWater:false});assert.ok(game.state.oxygen>0);});
test('descobertas não duplicam e persistem',()=>{const store=storage(),game=new SurvivalSystems(store);assert.equal(game.discover('pegadas'),true);assert.equal(game.discover('pegadas'),false);const loaded=new SurvivalSystems(store);assert.deepEqual(loaded.state.discoveries,['pegadas']);});
