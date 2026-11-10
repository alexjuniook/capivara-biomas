import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../src/world/WorldAtmosphere.js',import.meta.url),'utf8');

test('atmosphere defines weather profiles for all three biomes',()=>{
  for(const biome of ['amazon','glacial','cerrado']) assert.match(source,new RegExp(biome+': \\['));
});

test('weather transitions are restricted to supported states',()=>{
  for(const weather of ['clear','rain','storm','wind','snow','blizzard','dust']) assert.ok(source.includes("'"+weather+"'"));
  assert.match(source,/if\(!\['clear','rain','storm','wind','snow','blizzard','dust'\]\.includes\(weather\)\) return false/);
});

test('atmosphere clamps frame delta and disposes GPU resources',()=>{
  assert.match(source,/Math\.min\(Math\.max\(dt,0\),\.05\)/);
  assert.match(source,/this\.weatherGeometry\.dispose\(\)/);
  assert.match(source,/this\.weatherMaterial\.dispose\(\)/);
  assert.match(source,/child\.geometry\?\.dispose\(\)/);
});

test('atmosphere supports day-night lighting and storm flashes',()=>{
  assert.match(source,/this\.time=\(this\.time\+delta\/this\.dayLength\)%1/);
  assert.match(source,/this\.flash\*30/);
  assert.match(source,/this\.sun\.intensity=/);
});
