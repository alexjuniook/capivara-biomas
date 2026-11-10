import * as THREE from 'three';

function makeMammoth(scene,scale,furColor,tuskColor){
  const root=new THREE.Group();
  const fur=new THREE.MeshStandardMaterial({color:furColor,roughness:1});
  const tusk=new THREE.MeshStandardMaterial({color:tuskColor,roughness:.55});
  const add=(geometry,material,position,stretch=[1,1,1])=>{
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...position);mesh.scale.set(...stretch);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
  };
  add(new THREE.SphereGeometry(.8,14,12),fur,[0,1,0],[1.2,1,.9]);
  add(new THREE.SphereGeometry(.52,14,12),fur,[.55,1.62,0],[.92,.95,.85]);
  const trunk=add(new THREE.CylinderGeometry(.15,.2,.8,12),fur,[.9,1.05,0],[1,1,1]);
  trunk.rotation.z=-.12;
  const ears=[];
  for(const side of [-1,1]){
    const ear=add(new THREE.SphereGeometry(.34,12,10),fur,[.22,1.58,side*.66],[.62,.92,.28]);
    ear.rotation.z=side*.18;ears.push(ear);
    const curve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(.78,.95,side*.42),
      new THREE.Vector3(1.12,.82,side*.56),
      new THREE.Vector3(1.18,1.16,side*.64),
      new THREE.Vector3(.98,1.3,side*.66)
    ]);
    add(new THREE.TubeGeometry(curve,14,.095,8,false),tusk,[0,0,0]);
    add(new THREE.SphereGeometry(.085,10,8),new THREE.MeshStandardMaterial({color:'#201a16'}),[.78,1.78,side*.3]);
    add(new THREE.SphereGeometry(.3,10,8),fur,[.25,1.75,side*.53],[.65,.8,.35]);
  }
  // A layered shoulder mantle gives the woolly mammoth a less toy-like profile.
  for(let i=0;i<15;i++){
    const tuft=add(new THREE.ConeGeometry(.12,.32,6),fur,[-.58+i*.085,1.68,-.32],[.9,1.1,.9]);
    tuft.rotation.z=-.35;
  }
  const legs=[];
  for(const x of [-.4,.4])for(const z of [-.48,.48]){
    const leg=add(new THREE.CylinderGeometry(.17,.2,.68,8),fur,[x,.38,z]);legs.push(leg);
  }
  root.userData.legs=legs;root.userData.trunk=trunk;root.userData.ears=ears;
  root.scale.setScalar(scale);scene.add(root);return root;
}

export class GlacialMammoths {
  constructor({scene,player,onRescue=()=>{},restored=false}){
    this.scene=scene;this.player=player;this.onRescue=onRescue;this.rescued=restored;
    this.phase=0;
    this.parent=makeMammoth(scene,1.45,'#756f66','#eee0c3');
    this.calf=makeMammoth(scene,.72,'#9a9184','#f4e7ce');
    this.parent.position.set(5,0,-48);
    this.calf.position.set(-3,0,-43);
    this.parent.rotation.y=Math.PI;
    this.calf.rotation.y=-.5;
    if(restored)this.#reunite();
  }
  update(dt){
    this.phase+=dt;
    this.parent.position.y=Math.sin(this.phase*1.3)*.025;
    this.calf.position.y=Math.sin(this.phase*2.1)*.035;
    for(const [index,leg] of this.parent.userData.legs.entries())leg.rotation.x=Math.sin(this.phase*1.25+index*Math.PI*.5)*.035;
    for(const [index,leg] of this.calf.userData.legs.entries())leg.rotation.x=Math.sin(this.phase*1.8+index*Math.PI*.5)*.055;
    this.parent.userData.trunk.rotation.z=-.12+Math.sin(this.phase*.8)*.12;
    this.calf.userData.trunk.rotation.z=-.12+Math.sin(this.phase*1.1)*.16;
    this.parent.userData.ears.forEach((ear,i)=>{ear.rotation.z=(i?1:-1)*(.18+Math.sin(this.phase*.9+i)*.035);});
    this.calf.userData.ears.forEach((ear,i)=>{ear.rotation.z=(i?1:-1)*(.18+Math.sin(this.phase*1.2+i)*.045);});
    if(this.rescued){
      const target=this.parent.position.clone().add(new THREE.Vector3(-2,0,1.8));
      const delta=target.sub(this.calf.position);delta.y=0;
      if(delta.length()>0.5)this.calf.position.addScaledVector(delta.normalize(),Math.min(dt*2.1,delta.length()));
      this.calf.rotation.y=Math.atan2(-delta.z,delta.x);
    }else{
      this.calf.rotation.y=Math.sin(this.phase*.7)*.18;
    }
  }
  dispose(){
    const geometries=new Set(),materials=new Set();
    for(const root of [this.parent,this.calf]){
      this.scene.remove(root);
      root.traverse(child=>{if(child.geometry)geometries.add(child.geometry);if(child.material){for(const material of (Array.isArray(child.material)?child.material:[child.material]))materials.add(material);}});
    }
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
  }
  interact(){
    if(this.rescued)return false;
    if(this.calf.position.distanceTo(this.player.position)>3.2)return false;
    this.rescued=true;this.#reunite();this.onRescue();return true;
  }
  #reunite(){
    this.calf.position.copy(this.parent.position).add(new THREE.Vector3(-2,0,1.8));
  }
}
