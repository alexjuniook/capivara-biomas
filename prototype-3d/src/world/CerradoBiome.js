import * as THREE from 'three';

export function buildCerradoBiome(scene, quality = 1) {
  const added = [];
  const mat = (color, roughness = 0.95) => new THREE.MeshStandardMaterial({ color, roughness });
  const add = object => { scene.add(object); added.push(object); return object; };

  const earth = add(new THREE.Mesh(new THREE.PlaneGeometry(180,180), mat('#b58b58')));
  earth.rotation.x = -Math.PI / 2; earth.position.y = 0.055; earth.receiveShadow = true;

  const trail = add(new THREE.Mesh(new THREE.PlaneGeometry(9,100), mat('#d6b77c')));
  trail.rotation.x = -Math.PI / 2; trail.position.set(0,0.075,-28);

  const stream = add(new THREE.Mesh(new THREE.PlaneGeometry(6,90), new THREE.MeshStandardMaterial({color:'#5b9c9b',roughness:.28,transparent:true,opacity:.86})));
  stream.rotation.x = -Math.PI / 2; stream.position.set(13,.09,-28);

  // Chapadas and warm, dry horizon.
  for (let i=0;i<9;i++) {
    const mesa = new THREE.Mesh(new THREE.CylinderGeometry(7+Math.random()*5,9+Math.random()*5,5+Math.random()*5,7), mat(i%2?'#a8794e':'#916b4a'));
    mesa.position.set((i%2?1:-1)*(18+Math.random()*14),2,-20-i*8);
    mesa.scale.x=1.25; add(mesa);
  }

  // Buritis, ipês and scattered shrubs.
  const count = Math.round(quality > .7 ? 30 : 16);
  for (let i=0;i<count;i++) {
    const x=(i%2?1:-1)*(6+Math.random()*13), z=8-Math.random()*78;
    const tree=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.28,4.5,7),mat('#68482f'));
    trunk.position.y=2.25; tree.add(trunk);
    const crown=new THREE.Mesh(new THREE.SphereGeometry(1.25,10,8),mat(i%3===0?'#e4b64c':i%3===1?'#d9a6bf':'#497c43'));
    crown.position.y=4.8; crown.scale.set(1.3,.48,1.15); tree.add(crown);
    tree.position.set(x,0,z); tree.scale.setScalar(.8+Math.random()*.65);
    tree.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    add(tree);
  }
  for(let i=0;i<42;i++){
    const shrub=new THREE.Mesh(new THREE.SphereGeometry(.55+Math.random()*.5,7,6),mat(i%2?'#607d3e':'#8a9b4b'));
    shrub.position.set((Math.random()-.5)*42,.35,8-Math.random()*82);
    shrub.scale.y=.55; add(shrub);
  }

  // A friendly giant anteater marks the local rescue quest.
  const anteater=new THREE.Group();
  const fur=mat('#514338'), cream=mat('#d5c4a0'), dark=mat('#29231e');
  const body=new THREE.Mesh(new THREE.SphereGeometry(.82,16,12),fur);
  body.position.set(0,1,0); body.scale.set(1.35,.85,.72); anteater.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.43,12,10),fur);
  head.position.set(.9,1.35,0); head.scale.set(1.5,.62,.62); anteater.add(head);
  const snout=new THREE.Mesh(new THREE.ConeGeometry(.2,.95,9),dark);
  snout.rotation.z=-Math.PI/2; snout.position.set(1.55,1.15,0); anteater.add(snout);
  const stripe=new THREE.Mesh(new THREE.SphereGeometry(.55,12,10),cream);
  stripe.position.set(-.1,1.22,.53); stripe.scale.set(1.15,.42,.22); anteater.add(stripe);
  for(const x of [-.48,.48]) for(const z of [-.42,.42]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,.65,8),dark);
    leg.position.set(x,.38,z); anteater.add(leg);
  }
  anteater.position.set(-5,0,-48); anteater.rotation.y=Math.PI/2;
  anteater.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  add(anteater);

  // Golden pollen drifts over the vereda without expensive individual meshes.\n  const pollenCount=Math.round(quality>.7?72:28);\n  const pollenGeometry=new THREE.SphereGeometry(.045,5,4);\n  const pollenMaterial=new THREE.MeshBasicMaterial({color:'#f7e2a1',transparent:true,opacity:.72});\n  const pollen=new THREE.InstancedMesh(pollenGeometry,pollenMaterial,pollenCount);\n  const pollenDummy=new THREE.Object3D();\n  const pollenPositions=Array.from({length:pollenCount},()=>new THREE.Vector3((Math.random()-.5)*38,Math.random()*7,8-Math.random()*82));\n  pollen.frustumCulled=false;add(pollen);\n\n  // Five glowing golden seeds form the chapter's exploration objective.
  const seeds=[];
  const seedMat=new THREE.MeshStandardMaterial({color:'#f4d36d',emissive:'#9b6415',emissiveIntensity:.45,metalness:.25,roughness:.28});
  [[-3,-14],[5,-26],[-7,-39],[8,-53],[-2,-68]].forEach(([x,z],index)=>{
    const seed=new THREE.Group();
    const orb=new THREE.Mesh(new THREE.OctahedronGeometry(.55,0),seedMat);
    orb.scale.set(.8,1.4,.8); orb.position.y=1.1; seed.add(orb);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.65,.035,6,20),new THREE.MeshBasicMaterial({color:'#ffe6a1'}));
    ring.rotation.x=Math.PI/2; ring.position.y=.2; seed.add(ring);
    seed.position.set(x,0,z); seed.userData={index,baseY:0,collected:false};
    add(seed); seeds.push(seed);
  });

  return { seeds, anteater, update(dt,focus){\n    const center=focus?.position||new THREE.Vector3();\n    for(let i=0;i<pollenCount;i++){const p=pollenPositions[i];p.y+=dt*(.12+(i%4)*.035);p.x+=Math.sin(performance.now()*.00025+i)*dt*.08;if(p.y>7.5)p.set(center.x+(Math.random()-.5)*34,.3+Math.random()*2,center.z-Math.random()*48);pollenDummy.position.copy(p);pollenDummy.updateMatrix();pollen.setMatrixAt(i,pollenDummy.matrix);}\n    pollen.instanceMatrix.needsUpdate=true;\n  }, dispose(){
    const geometries=new Set(),materials=new Set();
    for(const object of added){scene.remove(object);object.traverse?.(child=>{if(child.geometry)geometries.add(child.geometry);if(child.material){for(const m of (Array.isArray(child.material)?child.material:[child.material]))materials.add(m);}});}
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  } };
}
