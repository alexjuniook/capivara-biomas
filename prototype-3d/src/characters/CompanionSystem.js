import * as THREE from 'three';

function mat(color, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}
function blob(parent, geometry, color, position, scale = [1,1,1]) {
  const mesh = new THREE.Mesh(geometry, mat(color));
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export class CompanionSystem {
  constructor({ scene, player, onTalk = () => {} }) {
    this.scene = scene;
    this.player = player;
    this.onTalk = onTalk;
    this.items = [];
    this.#addSloth();
    this.#addSabertooth();
    this.#addMammoth();
  }

  #addSloth() {
    const root = new THREE.Group();
    blob(root, new THREE.SphereGeometry(0.55, 14, 12), '#8a684b', [0,0.75,0], [0.85,1.1,0.75]);
    blob(root, new THREE.SphereGeometry(0.38, 14, 12), '#b28a63', [0.42,1.25,0], [1,0.9,0.9]);
    for (const side of [-1,1]) {
      blob(root, new THREE.SphereGeometry(0.09,10,8), '#211b16', [0.68,1.36,side*0.25]);
      blob(root, new THREE.ConeGeometry(0.09,0.24,6), '#e4d0a8', [0.28,0.35,side*0.25], [1,1,1]);
    }
    this.#register(root, 'Tico', 'Preguiça', 'Tico: “Eu pensei em um plano excelente... só preciso de uma pausa para terminar de pensar.”', new THREE.Vector3(-3,0,-15), true);
  }

  #addSabertooth() {
    const root = new THREE.Group();
    blob(root, new THREE.SphereGeometry(0.62,14,12), '#c47a42', [0,0.72,0], [1.2,0.72,0.72]);
    blob(root, new THREE.SphereGeometry(0.43,14,12), '#d69a5c', [0.52,1.12,0], [0.95,0.95,0.88]);
    for (const side of [-1,1]) {
      blob(root, new THREE.SphereGeometry(0.085,10,8), '#201811', [0.82,1.2,side*0.27]);
      blob(root, new THREE.ConeGeometry(0.07,0.32,8), '#fff0d4', [0.72,0.82,side*0.23], [1,1,1]);
    }
    for (const x of [-0.42,0.42]) for (const z of [-0.32,0.32])
      blob(root, new THREE.CylinderGeometry(0.09,0.1,0.42,8), '#a96538', [x,0.25,z]);
    this.#register(root, 'Brasa', 'Felino-dentes-de-sabre', 'Brasa: “Eu não estou perdido. Estou explorando uma rota alternativa bem... inesperada!”', new THREE.Vector3(3,0,-34), false);
  }

  #addMammoth() {
    const root = new THREE.Group();
    blob(root, new THREE.SphereGeometry(0.8,14,12), '#7b7469', [0,1.05,0], [1.2,1.05,0.9]);
    blob(root, new THREE.SphereGeometry(0.52,14,12), '#898176', [0.62,1.65,0], [0.9,0.95,0.85]);
    blob(root, new THREE.CylinderGeometry(0.16,0.21,0.72,10), '#898176', [1,1.15,0], [1,1,1]);
    for (const side of [-1,1]) {
      const tusk = blob(root, new THREE.ConeGeometry(0.12,0.72,10), '#f0dfb7', [0.9,0.92,side*0.42]);
      tusk.rotation.z = -0.45;
      blob(root, new THREE.SphereGeometry(0.1,10,8), '#211d19', [0.86,1.78,side*0.32]);
      blob(root, new THREE.CylinderGeometry(0.18,0.2,0.62,8), '#70695f', [-0.35,0.38,side*0.48]);
    }
    this.#register(root, 'Bento', 'Mamute jovem', 'Bento: “Minha família deixou pegadas perto do gelo. Acho que a passagem está logo adiante!”', new THREE.Vector3(-2,0,-56), false);
  }

  #register(mesh, name, species, dialogue, position, follows) {
    mesh.position.copy(position);
    this.scene.add(mesh);
    this.items.push({ mesh, name, species, dialogue, follows, phase: Math.random()*6, home: position.clone(), talked: false });
  }

  update(dt) {
    for (const item of this.items) {
      item.phase += dt;
      item.mesh.position.y = Math.sin(item.phase*2)*0.035;
      if (item.follows) {
        const desired = this.player.position.clone().add(new THREE.Vector3(-2,0,2.5));
        if (item.mesh.position.distanceTo(desired) > 3.4) {
          const direction = desired.sub(item.mesh.position);
          direction.y = 0;
          item.mesh.position.addScaledVector(direction.normalize(), Math.min(dt*2.2, direction.length()));
        }
      }
    }
  }

  interact() {
    let nearest = null, distance = 3.2;
    for (const item of this.items) {
      const d = item.mesh.position.distanceTo(this.player.position);
      if (d < distance) { nearest = item; distance = d; }
    }
    if (!nearest) return false;
    nearest.talked = true;
    this.onTalk(nearest);
    return true;
  }

  get talkedNames() {
    return this.items.filter(item => item.talked).map(item => item.name);
  }
}
