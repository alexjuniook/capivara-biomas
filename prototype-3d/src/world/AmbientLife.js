import * as THREE from 'three';

/**
 * Lightweight ambient simulation for the Amazon chapter.
 * Uses instanced rain and low-poly wildlife to stay friendly to mobile GPUs.
 */
export class AmbientLife {
  constructor({ scene, sun, hemisphere, quality = 1 }) {
    this.scene = scene;
    this.sun = sun;
    this.hemisphere = hemisphere;
    this.elapsed = 0;
    this.quality = THREE.MathUtils.clamp(quality, 0.35, 1);
    this.rainEnabled = false;
    this.rainTimer = 0;
    this.dayLength = 240;
    this.birds = [];
    this.butterflies = [];
    this.rainCount = Math.round(quality > 0.7 ? 180 : 70);
    this.rainDummy = new THREE.Object3D();
    this.rain = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.34, 4),
      new THREE.MeshBasicMaterial({ color: '#b8e9f2', transparent: true, opacity: 0.48 }),
      this.rainCount
    );
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    this.scene.add(this.rain);
    this.rainPositions = Array.from({ length: this.rainCount }, () => new THREE.Vector3(
      (Math.random() - 0.5) * 34, Math.random() * 18 + 2, -Math.random() * 85
    ));
    this.#createBirds();
    this.#createButterflies();
  }

  #createBirds() {
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#e5a64d', roughness: 0.9 });
    const wingMat = new THREE.MeshStandardMaterial({ color: '#344d3c', roughness: 1 });
    for (let i = 0; i < 5; i++) {
      const bird = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), bodyMat);
      body.scale.set(1.5, 0.75, 0.8);
      bird.add(body);
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.18), wingMat);
        wing.position.set(0, 0.08, side * 0.18);
        wing.rotation.y = side * 0.35;
        bird.add(wing);
      }
      bird.position.set(-10 + i * 5, 8 + Math.random() * 5, -12 - i * 13);
      this.scene.add(bird);
      this.birds.push({ mesh: bird, phase: Math.random() * Math.PI * 2, speed: 0.45 + Math.random() * 0.35 });
    }
  }

  #createButterflies() {
    const colors = ['#f2d16d', '#e58cba', '#75c9bf', '#f3a66b'];
    const wingGeometry = new THREE.PlaneGeometry(0.16, 0.12);
    for (let i = 0; i < Math.round(9 * this.quality); i++) {
      const group = new THREE.Group();
      const material = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide });
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(wingGeometry, material);
        wing.position.x = side * 0.08;
        wing.rotation.y = side * 0.2;
        group.add(wing);
      }
      group.position.set((Math.random() - 0.5) * 15, 0.7 + Math.random() * 2, -Math.random() * 70);
      this.scene.add(group);
      this.butterflies.push({ mesh: group, phase: Math.random() * 6, origin: group.position.clone() });
    }
  }

  setRain(enabled) {
    this.rainEnabled = Boolean(enabled);
    this.rain.visible = this.rainEnabled;
  }

  update(dt, focus = null) {
    this.elapsed += dt;
    const phase = (this.elapsed % this.dayLength) / this.dayLength;
    const daylight = 0.5 + 0.5 * Math.cos((phase - 0.25) * Math.PI * 2);
    const warm = THREE.MathUtils.clamp(daylight, 0.08, 1);
    const sunAngle = phase * Math.PI * 2;
    this.sun.position.set(Math.cos(sunAngle) * 24, Math.max(3, Math.sin(sunAngle) * 30), 12);
    this.sun.intensity = 0.45 + warm * 2.6;
    this.sun.color.setRGB(1, 0.72 + warm * 0.22, 0.48 + warm * 0.42);
    this.hemisphere.intensity = 0.45 + warm * 1.55;
    this.scene.background.setRGB(0.035 + warm * 0.48, 0.08 + warm * 0.68, 0.11 + warm * 0.72);
    this.scene.fog.color.copy(this.scene.background);
    this.scene.fog.density = 0.009 + (1 - warm) * 0.004;

    for (const bird of this.birds) {
      bird.phase += dt * bird.speed;
      bird.mesh.position.x += Math.sin(bird.phase * 0.35) * dt * 0.6;
      bird.mesh.position.y += Math.sin(bird.phase * 2.2) * dt * 0.35;
      bird.mesh.rotation.z = Math.sin(bird.phase * 2.2) * 0.12;
      bird.mesh.rotation.y = Math.sin(bird.phase * 0.35) * 0.22;
    }
    for (const butterfly of this.butterflies) {
      butterfly.phase += dt * 2.4;
      butterfly.mesh.position.set(
        butterfly.origin.x + Math.sin(butterfly.phase) * 0.8,
        butterfly.origin.y + Math.sin(butterfly.phase * 2) * 0.32,
        butterfly.origin.z + Math.cos(butterfly.phase * 0.7) * 0.65
      );
      butterfly.mesh.rotation.y = Math.sin(butterfly.phase) * 0.6;
    }

    // A gentle rain shower every so often; no extra draw calls per raindrop.
    this.rainTimer += dt;
    if (this.rainTimer > 95) {
      this.rainTimer = 0;
      this.setRain(!this.rainEnabled);
    }
    if (this.rainEnabled) {
      const center = focus?.position ?? new THREE.Vector3();
      for (let i = 0; i < this.rainCount; i++) {
        const p = this.rainPositions[i];
        p.y -= dt * 15;
        p.x -= dt * 2.1;
        if (p.y < 0) {
          p.set(center.x + (Math.random() - 0.5) * 30, 12 + Math.random() * 8, center.z - Math.random() * 40);
        }
        this.rainDummy.position.copy(p);
        this.rainDummy.rotation.z = -0.13;
        this.rainDummy.updateMatrix();
        this.rain.setMatrixAt(i, this.rainDummy.matrix);
      }
      this.rain.instanceMatrix.needsUpdate = true;
    }
  }

  dispose() {
    this.scene.remove(this.rain);
    this.rain.geometry.dispose();
    this.rain.material.dispose();
    for (const item of [...this.birds, ...this.butterflies]) this.scene.remove(item.mesh);
  }
}
