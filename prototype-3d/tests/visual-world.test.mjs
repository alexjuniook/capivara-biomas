import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const visuals = readFileSync(new URL('../src/world/WorldVisuals.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('world visuals include the 15-piece procedural art upgrade', () => {
  for (const feature of [
    'sky-gradient', 'createGroundMaterial', '#createSun', '#createClouds',
    '#createGrass', '#createWildflowers', '#createPebbles',
    '#createParticles', '#createWaterDetails'
  ]) assert.ok(visuals.includes(feature), 'missing visual feature: ' + feature);
});

test('visual layer is connected to the game lifecycle', () => {
  assert.ok(main.includes('new WorldVisuals('));
  assert.ok(main.includes('worldVisuals?.update(dt,player,glacialMode,cerradoMode)'));
});

test('capybara has subtle facial and ear animation hooks', () => {
  assert.ok(main.includes('userData.ears'));
  assert.ok(main.includes('userData.eyes'));
  assert.ok(main.includes('const blink='));
});
