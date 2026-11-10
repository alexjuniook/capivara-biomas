import * as THREE from 'three';

export function buildGlacialBiome(scene, quality = 1) {
  const snow = new THREE.MeshStandardMaterial({ color:'#e7f2f5', roughness:0.96 });
  const ice = new THREE.MeshPhysicalMaterial({ color:'#9bd9e8', roughness:0.24, metalness:0.08, clearcoat:0.8, transparent:true, opacity:0.92 });
  const rock = new THREE.MeshStandardMaterial({ color:'#718994', roughness:1 });
  const added = [];

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(180,180), snow);
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0.045;
  floor.receiveShadow = true;
  scene.add(floor); added.push(floor);

  // Frozen lagoon alongside the old river corridor.
  const lake = new THREE.Mesh(new THREE.CircleGeometry(10,48), ice);
  lake.rotation.x = -Math.PI/2;
  lake.scale.set(1.15,1,0.52);
  lake.position.set(13,0.075,-43);
  lake.receiveShadow = true;
  scene.add(lake); added.push(lake);

  // Layered mountain silhouettes create a readable horizon.
  for (let i=0;i<11;i++) {
    const height = 9 + Math.random()*10;
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(5+Math.random()*4,height,7), i%3===0?snow:rock);
    mountain.position.set((i%2?1:-1)*(17+Math.random()*14),height/2-0.2,-24-i*6);
    mountain.rotation.y = Math.random()*Math.PI;
    mountain.castShadow = true;
    scene.add(mountain); added.push(mountain);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.8+Math.random()*2,height*0.43,7),snow);
    cap.position.set(mountain.position.x,mountain.position.y+height*0.28,mountain.position.z);
    cap.rotation.y = mountain.rotation.y;
    scene.add(cap); added.push(cap);
  }

  // Frosted pines: a few clear silhouettes, with low geometry cost.
  const pineCount = Math.round(quality>0.7?24:12);
  for (let i=0;i<pineCount;i++) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.2,1.4,6),rock);
    trunk.position.y=0.7; tree.add(trunk);
    for (let layer=0;layer<3;layer++) {
      const crown = new THREE.Mesh(new THREE.ConeGeometry(1.15-layer*0.18,2.1,7),i%2?snow:ice);
      crown.position.y=1.6+layer*1.15; crown.castShadow=true; tree.add(crown);
    }
    const side = i%2?1:-1;
    tree.position.set(side*(7+Math.random()*11),0,-8-Math.random()*66);
    tree.scale.setScalar(0.8+Math.random()*0.8);
    scene.add(tree); added.push(tree);
  }

  // Tall ice shards mark the route to the next discovery.
  for (let i=0;i<18;i++) {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.3+Math.random()*0.5,1.8+Math.random()*3.2,5),ice);
    shard.position.set((Math.random()-0.5)*26,0.9,-12-Math.random()*66);
    shard.rotation.z=(Math.random()-0.5)*0.18;
    shard.castShadow=true;
    scene.add(shard); added.push(shard);
  }

  const crystals = [];
  const crystalMaterial = new THREE.MeshPhysicalMaterial({color:'#a8f2ff',emissive:'#247f9b',emissiveIntensity:0.75,roughness:0.18,metalness:0.12,transparent:true,opacity:0.96,clearcoat:1});
  const crystalSpots = [[-4,-15],[5,-27],[-7,-39],[8,-53],[-2,-68]];
  crystalSpots.forEach(([x,z],index)=>{
    const group=new THREE.Group();
    const shard=new THREE.Mesh(new THREE.OctahedronGeometry(0.72,0),crystalMaterial);
    shard.scale.set(0.72,1.65,0.72);shard.position.y=1.25;shard.castShadow=true;group.add(shard);
    const glow=new THREE.Mesh(new THREE.TorusGeometry(0.72,0.045,6,24),new THREE.MeshBasicMaterial({color:'#baf7ff'}));
    glow.rotation.x=Math.PI/2;glow.position.y=0.22;group.add(glow);
    group.position.set(x,0,z);group.userData.index=index;group.userData.baseY=0;
    scene.add(group);added.push(group);crystals.push(group);
  });
  return { crystals, dispose() { for (const object of added) scene.remove(object); } };
}
