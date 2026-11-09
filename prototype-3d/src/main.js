import * as THREE from 'three';
import { CameraDirector } from './camera/CameraDirector.js';
import { AmbientLife } from './world/AmbientLife.js';
import { CompanionSystem } from './characters/CompanionSystem.js';
import { GlacialPortal } from './world/GlacialPortal.js';

const viewport = document.querySelector('#viewport');
const loading = document.querySelector('#loading');
const welcome = document.querySelector('#message');
const errorBox = document.querySelector('#error');
const fruitCount = document.querySelector('#fruitCount');
const missionText = document.querySelector('#missionText');
const heartsText = document.querySelector('#hearts');

let renderer, scene, camera, director, player, clock, ambientLife, companions, portal;\nlet glacialMode = false;
let started = false, collected = 0, lives = 3;
const keys = { forward:0, right:0, jump:false, run:false };
const solids = [];
const fruits = [];
const obstacles = [];
const up = new THREE.Vector3(0,1,0);
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
let verticalVelocity = 0, grounded = true, jumpWasDown = false;
let walkTime = 0;

function material(color, roughness=0.9, extra={}) {
  return new THREE.MeshStandardMaterial({color, roughness, ...extra});
}
function box(parent, name, size, position, mat, cast=true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.name=name; mesh.position.set(...position); mesh.castShadow=cast; mesh.receiveShadow=true;
  parent.add(mesh); return mesh;
}
function sphere(parent, name, size, position, mat, segments=20) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(size,segments,Math.max(12,segments-4)),mat);
  mesh.name=name; mesh.position.set(...position); mesh.castShadow=true; mesh.receiveShadow=true;
  parent.add(mesh); return mesh;
}
function makeTree(x,z,scale=1,variant=0) {
  const group=new THREE.Group(); group.position.set(x,0,z); group.scale.setScalar(scale); scene.add(group);
  const trunkMat=material(variant?'#59402d':'#67452f');
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28,.48,5.4,9),trunkMat);
  trunk.position.y=2.7; trunk.castShadow=true; trunk.receiveShadow=true; group.add(trunk); obstacles.push(trunk);
  const leafColors=['#286e49','#347e50','#438c56','#205c43'];
  for(let i=0;i<5;i++){
    const crown=sphere(group,'copa',1.8+Math.random()*.7,[((i%2)*2-1)*.85,5.1+Math.floor(i/2)*.7,((i%3)-1)*.7],material(leafColors[(i+variant)%leafColors.length]),16);
    crown.scale.set(1.2,.95,1.1); crown.castShadow=true;
  }
  const vines=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,3.5,6),material('#9a9a4d'));
  vines.position.set(.9,3.5,.4); vines.rotation.z=-.25; group.add(vines);
  return group;
}
function makeRock(x,z,s=1) {
  const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),material('#777d69'));
  rock.position.set(x,s*.62,z); rock.scale.set(1.25,.8,.9); rock.castShadow=true; rock.receiveShadow=true; scene.add(rock); obstacles.push(rock); return rock;
}
function makeFern(x,z,s=1) {
  const g=new THREE.Group();g.position.set(x,.05,z);g.scale.setScalar(s);scene.add(g);
  for(let i=0;i<7;i++){
    const angle=i/7*Math.PI*2;
    const leaf=new THREE.Mesh(new THREE.ConeGeometry(.16,1.35,5),material(i%2?'#397c4c':'#559b55'));
    leaf.position.set(Math.cos(angle)*.42,.55,Math.sin(angle)*.42);leaf.rotation.z=-Math.cos(angle)*.65;leaf.rotation.x=Math.sin(angle)*.55;g.add(leaf);
  }
}
function makeCapybara() {
  const root=new THREE.Group(); root.name='Capivara'; scene.add(root);
  const fur=material('#a86f45'), furLight=material('#c48b5c'), dark=material('#533627'), muzzle=material('#d3a477'), eye=material('#211a16',.35), claw=material('#4d382b');
  const torso=sphere(root,'corpo',1,[0,.88,0],fur,28);torso.scale.set(1.05,.67,.66);
  const rump=sphere(root,'quadril',.68,[-.58,.85,0],fur,24);rump.scale.set(1,.86,.9);
  const head=sphere(root,'cabeca',.62,[.72,1.22,0],furLight,24);head.scale.set(1.05,.92,.88);
  const snout=sphere(root,'focinho',.42,[1.14,1.02,0],muzzle,20);snout.scale.set(1.05,.68,.78);
  const nose=sphere(root,'nariz',.15,[1.48,1.16,0],dark,16);nose.scale.set(1,.72,1);
  for(const side of [-1,1]){
    const ear=sphere(root,'orelha',.2,[.58,1.76,side*.43],fur,16);ear.scale.set(.75,1,.55);
    const inner=sphere(root,'orelha-interna',.105,[.62,1.79,side*.49],muzzle,12);inner.scale.set(.7,1,.45);
    sphere(root,'olho',.095,[.98,1.42,side*.43],eye,16);
    sphere(root,'brilho',.027,[1.01,1.46,side*.49],material('#fff2d2',.2),10);
  }
  const legs=[];
  for(const x of [-.65,.65])for(const z of [-.43,.43]){
    const leg=new THREE.Group();leg.position.set(x,.55,z);root.add(leg);
    const limb=new THREE.Mesh(new THREE.CylinderGeometry(.14,.12,.62,12),fur);limb.position.y=-.23;limb.castShadow=true;leg.add(limb);
    const foot=sphere(leg,'pata',.17,[.04,-.5,0],claw,12);foot.scale.set(1,.65,1.1);
    legs.push(leg);
  }
  root.userData.legs=legs;root.userData.head=head;root.userData.torso=torso;
  root.position.set(0,0,5);root.rotation.y=Math.PI/2;return root;
}
function makeFruit(x,z) {
  const group=new THREE.Group();group.position.set(x,.95,z);scene.add(group);
  const fruit=sphere(group,'fruto',.28,[0,0,0],material('#e5a83c',.35,{emissive:'#5c2c05',emissiveIntensity:.15}),16);
  fruit.scale.set(1,.85,1);
  const leaf=new THREE.Mesh(new THREE.ConeGeometry(.09,.3,6),material('#4b8a45'));leaf.position.set(.13,.24,0);leaf.rotation.z=-.8;group.add(leaf);
  group.userData.baseY=.95;group.userData.collected=false;fruits.push(group);
}
function createWorld() {
  scene=new THREE.Scene();scene.background=new THREE.Color('#8ccbd3');scene.fog=new THREE.FogExp2('#a6cbb4',.012);
  const hemisphereLight=new THREE.HemisphereLight('#d8f2ff','#425b36',2.1);scene.add(hemisphereLight);
  const sun=new THREE.DirectionalLight('#fff0cf',3.2);sun.position.set(-18,30,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;sun.shadow.bias=-.0002;scene.add(sun);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180,1,1),material('#587a43'));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const path=new THREE.Mesh(new THREE.PlaneGeometry(12,100),material('#94784d'));path.rotation.x=-Math.PI/2;path.position.set(0,.012,-20);path.receiveShadow=true;scene.add(path);
  const river=new THREE.Mesh(new THREE.PlaneGeometry(8,100),new THREE.MeshPhysicalMaterial({color:'#318eaa',roughness:.22,metalness:.05,transparent:true,opacity:.86,clearcoat:.8}));river.rotation.x=-Math.PI/2;river.position.set(13,.035,-20);scene.add(river);
  for(let i=0;i<24;i++){
    const z=12-i*3.5;
    makeTree(-8-(i%4)*2.3,z,1.1+(i%3)*.25,i%2);
    makeTree(8+(i%5)*2.1,z-1,.95+(i%4)*.2,(i+1)%2);
  }
  for(let i=0;i<55;i++){
    const x=(Math.random()-.5)*42,z=10-Math.random()*82;
    if(Math.abs(x)<4||Math.abs(x-13)<5)continue;
    makeFern(x,z,.55+Math.random()*.8);
  }
  for(let i=0;i<15;i++)makeRock((Math.random()-.5)*30,4-Math.random()*65,.45+Math.random()*.9);
  // fallen log and roots add readable landmarks to the trail
  const log=new THREE.Mesh(new THREE.CylinderGeometry(.35,.42,7,10),material('#62452e'));log.rotation.z=Math.PI/2;log.position.set(-5,.42,-23);log.castShadow=true;scene.add(log);obstacles.push(log);
  for(let i=0;i<8;i++)makeFruit((i%2?3:-2)+Math.sin(i*1.8)*1.1,-7-i*7.5);
  // distant canopy silhouettes
  for(let i=0;i<14;i++){const c=sphere(scene,'dossel-distante',5,[Math.sin(i*9)*28,10+Math.random()*5,-50-i*3],material(i%2?'#28684c':'#347b53'),12);c.scale.set(1.5,1,1.4);}
  player=makeCapybara();
  ambientLife=new AmbientLife({scene,sun,hemisphere:hemisphereLight,quality:innerWidth<700?.55:1});\n  companions=new CompanionSystem({scene,player,onTalk:showCompanionDialogue});\n  portal=new GlacialPortal({scene,onEnter:showGlacialInvitation});
}
function setup() {
  renderer=new THREE.WebGLRenderer({antialias:innerWidth>700,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=innerWidth>650;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  viewport.appendChild(renderer.domElement);
  camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,180);
  createWorld();
  director=new CameraDirector({camera,domElement:renderer.domElement,scene,target:player,collisionObjects:obstacles});
  director.setMode('thirdPerson');
  clock=new THREE.Clock();
  window.addEventListener('resize',resize);
  loading.classList.add('hidden');welcome.classList.remove('hidden');
}
function resize(){if(!renderer||!camera)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);}
function setCameraMode(mode){director.setMode(mode);document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('selected',b.dataset.camera===mode));}
function bindControls(){
  document.querySelectorAll('[data-camera]').forEach(b=>b.addEventListener('click',()=>setCameraMode(b.dataset.camera)));
  window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='w'||e.key==='ArrowUp')keys.forward=1;if(e.key==='s'||e.key==='ArrowDown')keys.forward=-1;if(e.key==='a'||e.key==='ArrowLeft')keys.right=-1;if(e.key==='d'||e.key==='ArrowRight')keys.right=1;if(e.key==='Shift')keys.run=true;if(e.key===' '&&!e.repeat)keys.jump=true;});
  window.addEventListener('keyup',e=>{if(e.key==='w'||e.key==='ArrowUp'||e.key==='s'||e.key==='ArrowDown')keys.forward=0;if(e.key==='a'||e.key==='ArrowLeft'||e.key==='d'||e.key==='ArrowRight')keys.right=0;if(e.key==='Shift')keys.run=false;if(e.key===' ')keys.jump=false;});
  window.addEventListener('blur',()=>{keys.forward=0;keys.right=0;keys.run=false;keys.jump=false;});
  const stick=document.querySelector('#stick'),area=document.querySelector('.stick-area');let pointer=null;
  area.addEventListener('pointerdown',e=>{pointer=e.pointerId;area.setPointerCapture(pointer);moveStick(e);});
  area.addEventListener('pointermove',e=>{if(pointer===e.pointerId)moveStick(e);});
  const release=e=>{if(pointer!==e.pointerId)return;pointer=null;keys.forward=0;keys.right=0;stick.style.transform='translate(0,0)';};
  area.addEventListener('pointerup',release);area.addEventListener('pointercancel',release);
  function moveStick(e){const r=area.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=36,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max;}stick.style.transform=`translate(${dx}px,${dy}px)`;keys.right=THREE.MathUtils.clamp(dx/max,-1,1);keys.forward=THREE.MathUtils.clamp(-dy/max,-1,1);}
  const jump=document.querySelector('#jumpBtn');jump.addEventListener('pointerdown',e=>{e.preventDefault();keys.jump=true;});['pointerup','pointercancel','pointerleave'].forEach(ev=>jump.addEventListener(ev,()=>keys.jump=false));
  const run=document.querySelector('#runBtn');run.addEventListener('pointerdown',()=>keys.run=true);['pointerup','pointercancel','pointerleave'].forEach(ev=>run.addEventListener(ev,()=>keys.run=false));
  document.querySelector('#startBtn').addEventListener('click',()=>{started=true;welcome.classList.add('hidden');});\n  window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e'&&started)interact();});\n  document.querySelector('#talkBtn')?.addEventListener('click',interact);\n  document.querySelector('#enterIceBtn')?.addEventListener('click',enterGlacialChapter);\n  document.querySelector('#closeDialogueBtn')?.addEventListener('click',()=>document.querySelector('#dialogue').classList.add('hidden'));
}
function updatePlayer(dt){
  const cameraForward=new THREE.Vector3();camera.getWorldDirection(cameraForward);cameraForward.y=0;cameraForward.normalize();
  right.crossVectors(cameraForward,up).normalize();
  move.copy(cameraForward).multiplyScalar(keys.forward).addScaledVector(right,keys.right);
  if(move.lengthSq()>1)move.normalize();
  const speed=keys.run?7.1:4.2;
  const desiredX=move.x*speed,desiredZ=move.z*speed;
  player.position.x=THREE.MathUtils.damp(player.position.x,player.position.x+desiredX*dt,keys.forward||keys.right?10:5,dt);
  player.position.z=THREE.MathUtils.damp(player.position.z,player.position.z+desiredZ*dt,keys.forward||keys.right?10:5,dt);
  player.position.x=THREE.MathUtils.clamp(player.position.x,-10,10);
  player.position.z=THREE.MathUtils.clamp(player.position.z,-78,11);
  if(move.lengthSq()>.02){const angle=Math.atan2(-move.z,move.x);player.rotation.y=THREE.MathUtils.damp(player.rotation.y,angle,10,dt);}
  if(keys.jump&&!jumpWasDown&&grounded){verticalVelocity=7.5;grounded=false;}
  jumpWasDown=keys.jump;
  verticalVelocity-=18*dt;player.position.y+=verticalVelocity*dt;
  if(player.position.y<=0){player.position.y=0;verticalVelocity=0;grounded=true;}
  const moving=move.lengthSq()>.02;
  walkTime+=dt*(keys.run?13:8);
  player.userData.legs.forEach((leg,i)=>{leg.rotation.x=moving?Math.sin(walkTime+i*Math.PI)*.42:THREE.MathUtils.damp(leg.rotation.x,0,8,dt);});
  player.userData.torso.scale.y=1+Math.sin(walkTime*2)*.012*(moving?1:0);
  player.userData.head.rotation.z=moving?Math.sin(walkTime)*.025:0;
  // Simple physical blockers keep the character out of tree trunks and rocks.
  for(const obstacle of obstacles){const p=new THREE.Vector3();obstacle.getWorldPosition(p);const radius=obstacle.geometry?.parameters?.radius||.6;const dx=player.position.x-p.x,dz=player.position.z-p.z;const min=radius+.7;if(dx*dx+dz*dz<min*min&&Math.abs(player.position.y)<1.2){const d=Math.max(.001,Math.hypot(dx,dz));player.position.x=p.x+dx/d*min;player.position.z=p.z+dz/d*min;}}
}
function showDialogue(title, message, button='CONTINUAR') {\n  const panel=document.querySelector('#dialogue');\n  document.querySelector('#dialogueTitle').textContent=title;\n  document.querySelector('#dialogueText').textContent=message;\n  document.querySelector('#closeDialogueBtn').textContent=button;\n  panel.classList.remove('hidden');\n}\nfunction showCompanionDialogue(item){\n  showDialogue(item.name+' · '+item.species,item.dialogue);\n  if(item.name==='Tico'&&collected===fruits.length){portal?.unlock();missionText.textContent='Portal aberto! Encontre a passagem congelada';}\n}\nfunction interact(){\n  if(companions?.interact())return;\n  if(portal?.unlocked&&player.position.distanceTo(portal.root.position)<4){showGlacialInvitation();return;}\n  showDialogue('A floresta está cheia de segredos','Chegue perto de Tico, Brasa ou Bento e pressione E para conversar. No celular, use o botão CONVERSAR.');\n}\nfunction showGlacialInvitation(){\n  if(!portal?.unlocked){showDialogue('Portal adormecido','A passagem só desperta quando os oito frutos forem encontrados e Tico revelar o caminho.');return;}\n  showDialogue('O segredo das duas eras','O portal despertou! Do outro lado existe um mundo de gelo, mamutes e aventuras que ninguém desta floresta conhece. Pressione ENTRAR NA ERA GLACIAL para atravessar.','ENTRAR NA ERA GLACIAL');\n  document.querySelector('#closeDialogueBtn').onclick=enterGlacialChapter;\n}\nfunction enterGlacialChapter(){\n  if(glacialMode)return;\n  glacialMode=true;\n  document.querySelector('#dialogue').classList.add('hidden');\n  document.querySelector('.brand small').textContent='Capítulo 2 · Era Glacial';\n  missionText.textContent='Explore a passagem congelada';\n  scene.background.set('#b9dce8');\n  scene.fog.color.set('#c6e5ed');scene.fog.density=.018;\n  scene.traverse(obj=>{if(obj.isMesh&&obj.material?.color&&obj.name!=='fruto'){const color=obj.material.color;if(color.g>.28&&color.r<.5){color.lerp(new THREE.Color('#a9c5c9'),.38);}}});\n  const snow=new THREE.Mesh(new THREE.PlaneGeometry(180,180),material('#dcebf0'));snow.rotation.x=-Math.PI/2;snow.position.y=.035;scene.add(snow);\n  for(let i=0;i<22;i++){const shard=new THREE.Mesh(new THREE.ConeGeometry(.45+Math.random()*.5,2+Math.random()*3,5),material('#9bd6e6',.3,{metalness:.08,transparent:true,opacity:.88}));shard.position.set((Math.random()-.5)*22,1,-10-Math.random()*65);shard.rotation.z=(Math.random()-.5)*.2;scene.add(shard);}\n  portal.root.visible=false;\n  showDialogue('Bem-vindo à Era Glacial','A floresta ficou para trás. Esta é a primeira passagem para o novo capítulo. Explore o gelo e procure as pegadas da família de Bento.');\n}\nfunction updateCollectibles(dt){
  for(const fruit of fruits){if(fruit.userData.collected)continue;fruit.rotation.y+=dt*1.2;fruit.position.y=fruit.userData.baseY+Math.sin(performance.now()*.002+fruit.position.z)*.12;if(fruit.position.distanceTo(player.position.clone().add(new THREE.Vector3(0,1,0)))<1.45){fruit.userData.collected=true;fruit.visible=false;collected++;fruitCount.textContent=collected;if(collected===fruits.length){if(companions?.talkedNames.includes('Tico')){portal?.unlock();missionText.textContent='Portal aberto! Encontre a passagem congelada';}else{missionText.textContent='Frutos encontrados! Converse com Tico';}showDialogue('Missão concluída','Você encontrou todos os frutos! Procure Tico para descobrir como atravessar.');}}}
}
function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);
  if(started){updatePlayer(dt);updateCollectibles(dt);companions?.update(dt);portal?.update(dt,player);}
  if(ambientLife)ambientLife.update(dt,player);
  director.update(dt);
  renderer.render(scene,camera);
}
function boot(){
  try{setup();bindControls();animate();}
  catch(err){loading.classList.add('hidden');errorBox.classList.remove('hidden');errorBox.textContent='Não foi possível iniciar o 3D neste navegador. '+err.message;console.error(err);}
}
boot();
