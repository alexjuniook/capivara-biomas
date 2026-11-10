import * as THREE from 'three';

const material = color => new THREE.MeshStandardMaterial({color, roughness:.94});
function mesh(parent, geometry, mat, pos, scale=[1,1,1]) {
  const part=new THREE.Mesh(geometry,mat);part.position.set(...pos);part.scale.set(...scale);
  part.castShadow=true;part.receiveShadow=true;parent.add(part);return part;
}
function makeGuara(scene,x,z){
  const root=new THREE.Group(),rust=material('#a94f2d'),black=material('#292522'),cream=material('#d8c4a0');
  mesh(root,new THREE.SphereGeometry(.58,12,10),rust,[0,1.05,0],[.72,1.35,.62]);
  mesh(root,new THREE.SphereGeometry(.34,12,10),rust,[.42,2.05,0],[.78,1.2,.72]);
  mesh(root,new THREE.ConeGeometry(.16,.55,8),rust,[.72,2.25,0],[.8,1,.8]).rotation.z=-.9;
  mesh(root,new THREE.SphereGeometry(.13,10,8),black,[.68,1.88,0],[1.3,.7,.8]);
  mesh(root,new THREE.SphereGeometry(.12,10,8),black,[-.62,1.15,0],[.65,.65,.65]);
  for(const px of [-.34,.32])for(const pz of [-.32,.32])mesh(root,new THREE.CylinderGeometry(.07,.09,.9,7),black,[px,.48,pz]);
  root.position.set(x,0,z);scene.add(root);return root;
}
function makeSeriema(scene,x,z){
  const root=new THREE.Group(),feather=material('#bdad88'),leg=material('#a94e35'),beak=material('#d6a33c');
  mesh(root,new THREE.SphereGeometry(.38,12,10),feather,[0,1.05,0],[.9,1.25,.75]);
  mesh(root,new THREE.SphereGeometry(.22,10,8),feather,[.28,1.65,0],[.9,1.1,.8]);
  mesh(root,new THREE.ConeGeometry(.11,.48,7),beak,[.53,1.58,0],[.8,1,.8]).rotation.z=-Math.PI/2;
  mesh(root,new THREE.ConeGeometry(.045,.45,5),feather,[.26,1.98,0],[1,1,.8]);
  for(const px of [-.18,.18])mesh(root,new THREE.CylinderGeometry(.035,.05,.75,6),leg,[px,.38,0]);
  root.position.set(x,0,z);scene.add(root);return root;
}
function makeArmadillo(scene,x,z){
  const root=new THREE.Group(),shell=material('#776a55'),hide=material('#b49c78'),dark=material('#554638');
  mesh(root,new THREE.SphereGeometry(.56,12,10),shell,[0,.72,0],[1.15,.82,.8]);
  mesh(root,new THREE.SphereGeometry(.27,10,8),hide,[.58,.58,0],[1.2,.7,.65]);
  mesh(root,new THREE.ConeGeometry(.12,.55,8),dark,[.86,.48,0],[.7,1,.7]).rotation.z=-Math.PI/2;
  for(const px of [-.42,.38])for(const pz of [-.38,.38])mesh(root,new THREE.CylinderGeometry(.09,.1,.35,7),dark,[px,.24,pz]);
  // Armor bands make the animal readable even at mobile render scale.
  for(let i=-1;i<=1;i++){const band=mesh(root,new THREE.TorusGeometry(.39,.035,5,14),hide,[i*.2,.75,0],[1,.9,1]);band.rotation.z=Math.PI/2;}
  root.position.set(x,0,z);scene.add(root);return root;
}

export class CerradoWildlife {
  constructor({scene,player,onObserve=()=>{}}){
    this.scene=scene;this.player=player;this.onObserve=onObserve;this.elapsed=0;this.animals=[];
    this.#add('Lobo-guará','Chico',makeGuara(scene,7,-34),{radius:11,speed:1.15});
    this.#add('Seriema','Seri',makeSeriema(scene,-7,-23),{radius:8,speed:1.65});
    this.#add('Tatu-canastra','Tuca',makeArmadillo(scene,5,-61),{radius:6,speed:.65});
  }
  #add(species,name,root,config){this.animals.push({species,name,root,home:root.position.clone(),phase:Math.random()*6,observed:false,...config});}
  update(dt){
    this.elapsed+=dt;
    for(const animal of this.animals){
      animal.phase+=dt;
      const p=animal.root.position;
      const targetX=animal.home.x+Math.sin(animal.phase*.32)*animal.radius*.42;
      const targetZ=animal.home.z+Math.cos(animal.phase*.27)*animal.radius*.42;
      const dx=targetX-p.x,dz=targetZ-p.z,d=Math.hypot(dx,dz);
      if(d>.08){p.x+=dx/d*animal.speed*dt;p.z+=dz/d*animal.speed*dt;animal.root.rotation.y=Math.atan2(-dz,dx);}
      p.y=Math.abs(Math.sin(animal.phase*3))*.025;
      if(animal.species==='Seriema')animal.root.rotation.z=Math.sin(animal.phase*2)*.025;
      if(animal.species==='Lobo-guará')animal.root.rotation.z=Math.sin(animal.phase*1.4)*.018;
    }
  }
  interact(){
    let nearest=null,best=3.5;
    for(const animal of this.animals){const d=animal.root.position.distanceTo(this.player.position);if(d<best){best=d;nearest=animal;}}
    if(!nearest)return false;
    if(nearest.observed){this.onObserve({animal:nearest,repeat:true});return true;}
    nearest.observed=true;this.onObserve({animal:nearest,repeat:false});return true;
  }
  get observedNames(){return this.animals.filter(a=>a.observed).map(a=>a.name);}
  restore(names=[]){const set=new Set(names);for(const animal of this.animals)animal.observed=set.has(animal.name);}
  dispose(){\n    const geometries=new Set(),materials=new Set();\n    for(const animal of this.animals){this.scene.remove(animal.root);animal.root.traverse(child=>{if(child.geometry)geometries.add(child.geometry);if(child.material)materials.add(child.material);});}\n    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.animals=[];\n  }
}
