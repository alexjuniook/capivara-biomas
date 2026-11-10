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
  add(new THREE.CylinderGeometry(.15,.2,.8,10),fur,[.9,1.05,0],[1,1,1]);
  for(const side of [-1,1]){
    const curve=add(new THREE.ConeGeometry(.12,.72,10),tusk,[.83,.9,side*.42]);
    curve.rotation.z=-.55;
    add(new THREE.SphereGeometry(.09,10,8),new THREE.MeshStandardMaterial({color:'#201a16'}),[.78,1.78,side*.3]);
    add(new THREE.SphereGeometry(.3,10,8),fur,[.25,1.75,side*.53],[.65,.8,.35]);
  }
  for(const x of [-.4,.4])for(const z of [-.48,.48])
    add(new THREE.CylinderGeometry(.17,.2,.68,8),fur,[x,.38,z]);
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
    if(this.rescued){
      const target=this.parent.position.clone().add(new THREE.Vector3(-2,0,1.8));
      const delta=target.sub(this.calf.position);delta.y=0;
      if(delta.length()>0.5)this.calf.position.addScaledVector(delta.normalize(),Math.min(dt*2.1,delta.length()));
      this.calf.rotation.y=Math.atan2(-delta.z,delta.x);
    }else{
      this.calf.rotation.y=Math.sin(this.phase*.7)*.18;
    }
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
