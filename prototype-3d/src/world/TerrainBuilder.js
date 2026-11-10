import * as THREE from 'three';

// Deterministic low-frequency terrain: a walkable corridor stays gentle while
// the biome edges rise into banks, hummocks and distant ridges.
export function terrainHeightAt(x, z, biome = 'amazon') {
  const corridor = THREE.MathUtils.smoothstep(Math.abs(x), 4.2, 10.5);
  const longWave = Math.sin(z * 0.075 + x * 0.11) * 0.42;
  const crossWave = Math.cos(x * 0.19 - z * 0.035) * 0.28;
  const detail = Math.sin(x * 0.43 + z * 0.31) * Math.cos(z * 0.27) * 0.12;
  const scale = biome === 'glacial' ? 1.55 : biome === 'cerrado' ? 1.35 : 1;
  const ridge = biome === 'glacial' ? Math.max(0, Math.sin(z * 0.12 + x * 0.08)) * 0.75 : 0;
  const plateau = biome === 'cerrado' ? Math.max(0, Math.sin(z * 0.09 + x * 0.13)) * 0.48 : 0;
  return corridor * ((longWave + crossWave + detail) * scale + ridge + plateau);
}

export function createTerrain(scene, { biome = 'amazon', quality = 1, materialColor = '#587a43', size = 180 } = {}) {
  const segments = quality > 0.7 ? 112 : 64;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = -positions.getY(i);
    positions.setZ(i, terrainHeightAt(x, z, biome));
  }
  geometry.computeVertexNormals();

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = materialColor;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14500; i++) {
    const shade = 65 + Math.floor(Math.random() * 115);
    const alpha = 0.035 + Math.random() * 0.13;
    ctx.fillStyle = `rgba(${shade},${shade + 12},${Math.max(18, shade - 22)},${alpha})`;
    const s = 1 + Math.random() * 5;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }
  // Broad mottling gives the ground readable variation at gameplay distance.
  for (let i = 0; i < 90; i++) {
    const r = 8 + Math.random() * 34;
    const gradient = ctx.createRadialGradient(Math.random() * 512, Math.random() * 512, 0, 256, 256, r);
    gradient.addColorStop(0, biome === 'glacial' ? 'rgba(255,255,255,.12)' : 'rgba(35,55,24,.10)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(Math.random() * 512, Math.random() * 512, r, 0, Math.PI * 2); ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.anisotropy = 8;
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', map: texture, roughness: biome === 'glacial' ? 0.82 : 0.96 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `terrain-${biome}`;
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return { mesh, dispose() { scene.remove(mesh); geometry.dispose(); material.dispose(); texture.dispose(); } };
}
