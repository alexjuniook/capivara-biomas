import * as THREE from 'three';

export class WorldVisuals {
  constructor(scene, quality = 1) {
    this.scene = scene;
    this.quality = quality;
    this.time = 0;
    this.effects = [];
    this.sky = this.#createSky();
    this.sun = this.#createSun();
    this.clouds = this.#createClouds();
    this.grass = this.#createGrass();
    this.wildflowers = this.#createWildflowers();
    this.pebbles = this.#createPebbles();
    this.dust = this.#createParticles();
    this.water = this.#createWaterDetails();
    this.fireflies = this.#createFireflies();
  }

  createGroundMaterial(color = '#587a43') {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4200; i++) {
      const shade = Math.floor(65 + Math.random() * 90);
      ctx.fillStyle = 'rgba(' + shade + ',' + (shade + 18) + ',' + Math.max(20, shade - 25) + ',' + (0.05 + Math.random() * 0.14) + ')';
      const size = 1 + Math.random() * 4;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, size, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(9, 9);
    texture.anisotropy = 4;
    return new THREE.MeshStandardMaterial({ color: '#ffffff', map: texture, roughness: 1 });
  }

  #createSky() {
    const geometry = new THREE.SphereGeometry(150, 24, 16);
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { topColor: { value: new THREE.Color('#347fa0') }, horizonColor: { value: new THREE.Color('#d8e9d2') }, offset: { value: 18 }, exponent: { value: 0.72 } },
      vertexShader: 'varying vec3 vWorldPosition; void main(){ vec4 worldPosition=modelMatrix*vec4(position,1.0); vWorldPosition=worldPosition.xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 topColor; uniform vec3 horizonColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main(){ float h=normalize(vWorldPosition+vec3(0.0,offset,0.0)).y; float f=max(pow(max(h,0.0),exponent),0.0); gl_FragColor=vec4(mix(horizonColor,topColor,f),1.0); }'
    });
    const sky = new THREE.Mesh(geometry, material);
    sky.name = 'sky-gradient';
    this.scene.add(sky);
    return sky;
  }

  #createSun() {
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(2.1, 20, 16), new THREE.MeshBasicMaterial({ color: '#fff1c2' }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(3.8, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0.12, depthWrite: false }));
    group.add(core, halo);
    group.position.set(-34, 38, -48);
    this.scene.add(group);
    return group;
  }

  #createClouds() {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.58, depthWrite: false });
    const count = this.quality > 0.7 ? 8 : 4;
    for (let i = 0; i < count; i++) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.7 + (j % 2) * 0.5, 9, 7), material);
        puff.position.set((j - 1.5) * 1.5, Math.sin(j) * 0.25, Math.cos(j * 2) * 0.45);
        puff.scale.y = 0.48;
        cloud.add(puff);
      }
      cloud.position.set((i - count / 2) * 13, 22 + (i % 3) * 2, -28 - (i % 4) * 18);
      cloud.userData.speed = 0.12 + (i % 3) * 0.035;
      group.add(cloud);
    }
    this.scene.add(group);
    return group;
  }

  #createGrass() {
    const count = Math.round(this.quality > 0.7 ? 1250 : 420);
    const geometry = new THREE.ConeGeometry(0.055, 0.48, 3);
    geometry.translate(0, 0.24, 0);
    const material = new THREE.MeshStandardMaterial({ color: '#78a65b', roughness: 1, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 44;
      const z = 12 - Math.random() * 88;
      dummy.position.set(x, 0, z);
      dummy.rotation.set((Math.random() - 0.5) * 0.12, Math.random() * Math.PI, (Math.random() - 0.5) * 0.18);
      const scale = 0.45 + Math.random() * 1.15;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color().setHSL(0.23 + Math.random() * 0.08, 0.28 + Math.random() * 0.25, 0.28 + Math.random() * 0.18));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  #createWildflowers() {
    const count = Math.round(this.quality > 0.7 ? 160 : 55);
    const geometry = new THREE.SphereGeometry(0.095, 6, 5);
    const material = new THREE.MeshBasicMaterial({ color: '#f5d88a' });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set((Math.random() - 0.5) * 34, 0.22, 8 - Math.random() * 80);
      dummy.scale.set(1, 0.55, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(mesh);
    return mesh;
  }

  #createPebbles() {
    const count = Math.round(this.quality > 0.7 ? 95 : 35);
    const geometry = new THREE.DodecahedronGeometry(0.18, 0);
    const material = new THREE.MeshStandardMaterial({ color: '#8d927b', roughness: 1 });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set((Math.random() - 0.5) * 32, 0.12, 8 - Math.random() * 78);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.scale.set(0.7 + Math.random(), 0.35 + Math.random() * 0.4, 0.7 + Math.random());
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(mesh);
    return mesh;
  }

  #createParticles() {
    const count = Math.round(this.quality > 0.7 ? 100 : 35);
    const geometry = new THREE.SphereGeometry(0.035, 5, 4);
    const material = new THREE.MeshBasicMaterial({ color: '#fff0bd', transparent: true, opacity: 0.58 });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const positions = Array.from({ length: count }, () => new THREE.Vector3((Math.random() - 0.5) * 36, Math.random() * 9, 8 - Math.random() * 80));
    const dummy = new THREE.Object3D();
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    return { mesh, positions, dummy };
  }

  #createFireflies() {
    const count=Math.max(10,Math.round(28*this.quality));
    const geometry=new THREE.SphereGeometry(.045,6,5);
    const material=new THREE.MeshBasicMaterial({color:'#e8ff9a',transparent:true,opacity:0,depthWrite:false});
    const mesh=new THREE.InstancedMesh(geometry,material,count);
    const dummy=new THREE.Object3D();
    const positions=[];
    for(let i=0;i<count;i++){
      positions.push(new THREE.Vector3((Math.random()-.5)*34,.6+Math.random()*5,-Math.random()*78));
      dummy.position.copy(positions[i]);dummy.scale.setScalar(.8+Math.random()*.8);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;this.scene.add(mesh);
    return {mesh,positions,dummy};
  }

  #createWaterDetails() {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: '#b5e7df', transparent: true, opacity: 0.22, side: THREE.DoubleSide });
    for (let i = 0; i < 12; i++) {
      const ripple = new THREE.Mesh(new THREE.TorusGeometry(0.25 + (i % 3) * 0.12, 0.018, 5, 20), material);
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.set(13 + Math.sin(i * 2) * 2.5, 0.055 + (i % 3) * 0.002, 8 - i * 6.5);
      ripple.userData.phase = i * 0.7;
      group.add(ripple);
    }
    this.scene.add(group);
    return group;
  }

  update(dt, focus, glacial = false, cerrado = false) {
    this.time += dt;
    const dayPhase=(this.time%240)/240;
    const daylight=.5+.5*Math.cos((dayPhase-.25)*Math.PI*2);
    this.fireflies.mesh.material.opacity=THREE.MathUtils.clamp((.42-daylight)*1.8,0,.72);
    this.fireflies.mesh.visible=!glacial;
    for(let i=0;i<this.fireflies.positions.length;i++){
      const p=this.fireflies.positions[i];
      p.y+=Math.sin(this.time*1.8+i)*dt*.12;
      p.x+=Math.sin(this.time*.65+i*2)*dt*.09;
      this.fireflies.dummy.position.copy(p);
      this.fireflies.dummy.scale.setScalar(.65+(.5+.5*Math.sin(this.time*5+i*3))*.65);
      this.fireflies.dummy.updateMatrix();this.fireflies.mesh.setMatrixAt(i,this.fireflies.dummy.matrix);
    }
    this.fireflies.mesh.instanceMatrix.needsUpdate=true;
    this.clouds.children.forEach(cloud => {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 70) cloud.position.x = -70;
    });
    const particle = this.dust;
    for (let i = 0; i < particle.positions.length; i++) {
      const p = particle.positions[i];
      p.y += dt * (0.12 + (i % 5) * 0.025);
      p.x += Math.sin(this.time * 0.5 + i) * dt * 0.08;
      if (p.y > 9) p.set((focus?.position.x || 0) + (Math.random() - 0.5) * 34, 0.3, (focus?.position.z || 0) - Math.random() * 50);
      particle.dummy.position.copy(p);
      particle.dummy.scale.setScalar(glacial ? 0.35 : cerrado ? 0.75 : 1);
      particle.dummy.updateMatrix();
      particle.mesh.setMatrixAt(i, particle.dummy.matrix);
    }
    particle.mesh.instanceMatrix.needsUpdate = true;
    this.water.children.forEach((ripple, i) => {
      ripple.scale.setScalar(0.65 + (Math.sin(this.time * 1.2 + ripple.userData.phase) + 1) * 0.42);
      ripple.material.opacity = glacial ? 0.04 : cerrado ? 0.1 : 0.22;
    });
    this.sun.visible = !glacial;
    this.clouds.visible = !glacial;
    this.grass.visible = !glacial;
    this.wildflowers.visible = !glacial;
    this.pebbles.visible = !glacial;
    this.dust.mesh.visible = !glacial;
  }

  dispose() {
    this.scene.traverse(object => {
      if (object.name === 'sky-gradient') {
        object.geometry.dispose();
        object.material.dispose();
      }
    });
    for (const object of [this.sun, this.clouds, this.grass, this.wildflowers, this.pebbles, this.dust.mesh, this.water, this.fireflies.mesh]) {
      this.scene.remove(object);
      object.traverse?.(child => { child.geometry?.dispose(); if (child.material) { for (const material of (Array.isArray(child.material) ? child.material : [child.material])) material.dispose(); } });
    }
  }
}
