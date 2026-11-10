import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSettings, QUALITY } from '../src/systems/GameSettings.js';

function memoryStorage(){
  const data=new Map();
  return {
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key)
  };
}

test('settings start with safe defaults and expose graphics presets',()=>{
  globalThis.localStorage=memoryStorage();
  const settings=new GameSettings();
  assert.equal(settings.load().quality,'auto');
  assert.equal(settings.load().showHud,true);
  assert.equal(QUALITY.low.shadows,false);
  assert.ok(QUALITY.high.pixelRatio>QUALITY.low.pixelRatio);
});

test('settings persist camera, sound, HUD and FPS preferences',()=>{
  globalThis.localStorage=memoryStorage();
  const settings=new GameSettings();
  const value={...settings.load(),quality:'medium',cameraMode:'cinematic',soundEnabled:true,showHud:false,showFps:true};
  assert.equal(settings.save(value),true);
  assert.deepEqual(settings.load(),value);
});

test('invalid settings JSON falls back to defaults',()=>{
  globalThis.localStorage={getItem:()=>'{bad json',setItem:()=>{},removeItem:()=>{}};
  assert.equal(new GameSettings().load().quality,'auto');
});
