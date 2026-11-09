import * as THREE from 'three';

export class GlacialPortal {
  constructor({ scene, position = new THREE.Vector3(0,0,-75), onEnter = () => {} }) {
    this.scene = scene;
    this.onEnter = onEnter;
    this.unlocked = false;
    this.entered = false;
    this.elapsed = 0;
    this.root = new THREE.Group();
    this.root.position.copy(position);
    scene.add(this.root);

    const stone = new THREE.MeshStandardMaterial({ color:'#53665c', roughness:1 });
    const ice = new THREE.MeshStandardMaterial({ color:'#8ce7f3', emissive:'#1b9eb7', emissiveIntensity:0.55, metalness:0.12, roughness:0.2 });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.25,0.32,12,36), stone);
    arch.position.y=2.7; arch.scale.set(1,1.3,1); this.root.add(arch);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.9,0.11,10,48), ice);
    ring.position.y=2.7; ring.scale.set(1,1.3,1); this.root.add(ring);
    const field = new THREE.Mesh(new THREE.CircleGeometry(1.83,40), new THREE.MeshBasicMaterial({color:'#4fd5ec',transparent:true,opacity:0.18,side:THREE.DoubleSide}));
    field.position.set(0,2.7,0); this.root.add(field);
    for (let i=0;i<7;i++) {
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.24,0.9+Math.random()*0.8,5),ice);
      crystal.position.set(Math.cos(i/7*Math.PI*2)*2.2,0.5,Math.sin(i/7*Math.PI*2)*0.35);
      crystal.rotation.z=(Math.random()-0.5)*0.5; this.root.add(crystal);
    }
    this.ring=ring; this.field=field;
    this.root.visible=false;
  }

  unlock() { this.unlocked=true; this.root.visible=true; }

  update(dt, player) {
    if (!this.unlocked || this.entered) return;
    this.elapsed += dt;
    this.ring.rotation.z = Math.sin(this.elapsed*1.4)*0.08;
    this.field.material.opacity = 0.13 + (Math.sin(this.elapsed*2.2)+1)*0.07;
    if (player.position.distanceTo(this.root.position.clone().add(new THREE.Vector3(0,0.8,0))) < 2.5) {
      this.entered=true;
      this.onEnter();
    }
  }
}
