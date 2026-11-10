import * as THREE from 'three';

const makeMat = color => new THREE.MeshStandardMaterial({color,roughness:0.92});
function part(parent,geometry,color,position,scale=[1,1,1]){
  const mesh=new THREE.Mesh(geometry,makeMat(color));
  mesh.position.set(...position);mesh.scale.set(...scale);
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

export class GlacialWildlife {
  constructor({scene,player,onDamage=()=>{},onDefeated=()=>{}}){
    this.scene=scene;this.player=player;this.onDamage=onDamage;this.onDefeated=onDefeated;
    this.enemies=[];this.attackCooldown=0;this.invulnerable=0;this.scareCooldown=0;
    this.#spawnWolf(-5,-31);this.#spawnWolf(6,-61);
  }
  #spawnWolf(x,z){
    const root=new THREE.Group();
    part(root,new THREE.SphereGeometry(0.62,12,10),'#657783',[0,0.72,0],[1.35,0.72,0.72]);
    part(root,new THREE.SphereGeometry(0.38,12,10),'#8496a0',[0.53,1.05,0],[1,0.9,0.86]);
    part(root,new THREE.ConeGeometry(0.16,0.38,6),'#53636e',[0.38,1.43,-0.24],[1,1,0.7]);
    part(root,new THREE.ConeGeometry(0.16,0.38,6),'#53636e',[0.38,1.43,0.24],[1,1,0.7]);
    part(root,new THREE.SphereGeometry(0.075,8,8),'#f4d66b',[0.78,1.12,-0.24]);
    part(root,new THREE.SphereGeometry(0.075,8,8),'#f4d66b',[0.78,1.12,0.24]);
    part(root,new THREE.ConeGeometry(0.11,0.26,7),'#e9e5df',[0.82,0.82,0]);
    for(const px of [-0.38,0.38])for(const pz of [-0.38,0.38])
      part(root,new THREE.CylinderGeometry(0.09,0.11,0.48,7),'#53636e',[px,0.25,pz]);
    root.position.set(x,0,z);scene.add(root);
    this.enemies.push({root,hits:0,phase:Math.random()*6,attackWait:0,alive:true,home:new THREE.Vector3(x,0,z)});
  }
  update(dt){
    this.attackCooldown=Math.max(0,this.attackCooldown-dt);
    this.scareCooldown=Math.max(0,this.scareCooldown-dt);
    this.invulnerable=Math.max(0,this.invulnerable-dt);
    for(const enemy of this.enemies){
      if(!enemy.alive)continue;
      enemy.phase+=dt;enemy.attackWait=Math.max(0,enemy.attackWait-dt);
      const dx=this.player.position.x-enemy.root.position.x;
      const dz=this.player.position.z-enemy.root.position.z;
      const distance=Math.hypot(dx,dz);
      const hunting=distance<13;
      if(hunting&&distance>1.45){
        const speed=distance<4?2.3:1.45;
        enemy.root.position.x+=dx/distance*speed*dt;
        enemy.root.position.z+=dz/distance*speed*dt;
        enemy.root.rotation.y=Math.atan2(-dz,dx);
      }else if(!hunting){
        enemy.root.position.x=enemy.home.x+Math.sin(enemy.phase*0.45)*1.8;
        enemy.root.position.z=enemy.home.z+Math.cos(enemy.phase*0.45)*1.8;
      }
      const stride=Math.sin(enemy.phase*8+(enemy.root.position.distanceTo(enemy.home)<2?0:1));\n      enemy.root.userData.legs?.forEach((leg,index)=>{leg.rotation.z=stride*(index%2===0?1:-1)*0.22;});\n      enemy.root.position.y=Math.abs(Math.sin(enemy.phase*7))*0.045;
      if(distance<1.55&&enemy.attackWait<=0&&this.invulnerable<=0){
        enemy.attackWait=1.25;this.invulnerable=1.6;this.onDamage();
      }
    }
  }
  dispose(){ for(const enemy of this.enemies)this.scene.remove(enemy.root); this.enemies=[]; }
  scare(){
    if(this.scareCooldown>0)return false;
    this.scareCooldown=0.65;
    let target=null,best=4.8;
    for(const enemy of this.enemies){
      if(!enemy.alive)continue;
      const d=enemy.root.position.distanceTo(this.player.position);
      if(d<best){best=d;target=enemy;}
    }
    if(!target)return false;
    target.hits++;
    target.root.scale.setScalar(target.hits>=2?0.01:0.82);
    if(target.hits>=2){
      target.alive=false;this.scene.remove(target.root);this.onDefeated();
    }
    return true;
  }
}
