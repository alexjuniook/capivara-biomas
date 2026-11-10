import * as THREE from 'three';
import { CameraDirector } from './camera/CameraDirector.js';
import { AmbientLife } from './world/AmbientLife.js';
import { CompanionSystem } from './characters/CompanionSystem.js';
import { GlacialPortal } from './world/GlacialPortal.js';
import { buildGlacialBiome } from './world/GlacialBiome.js';
import { buildCerradoBiome } from './world/CerradoBiome.js';
import { ProgressStore } from './systems/ProgressStore.js';
import { GlacialWildlife } from './characters/GlacialWildlife.js';
import { GlacialMammoths } from './characters/GlacialMammoths.js';
import { CerradoWildlife } from './characters/CerradoWildlife.js';
import { AudioAmbience } from './systems/AudioAmbience.js';
import { WorldVisuals } from './world/WorldVisuals.js';
import { WorldAtmosphere } from './world/WorldAtmosphere.js';
import { GameSettings, QUALITY } from './systems/GameSettings.js';
import { AdventureJournal } from './systems/AdventureJournal.js';

const viewport = document.querySelector('#viewport');
const loading = document.querySelector('#loading');
const welcome = document.querySelector('#message');
const errorBox = document.querySelector('#error');
const fruitCount = document.querySelector('#fruitCount');
const missionText = document.querySelector('#missionText');
const heartsText = document.querySelector('#hearts');

let renderer, scene, camera, director, player, clock, ambientLife, companions, portal, wildlife, glacialMammoths, cerradoWildlife, worldVisuals, atmosphere;
const audioAmbience = new AudioAmbience();
let glacialMode = false, cerradoMode = false, snowParticles = null, snowDummy = null, snowPositions = [], glacialBiome = null, iceCrystals = [], glacialCrystals = 0, savedGlacialCrystals = [], savedMammothRescued = false, cerradoBiome = null, cerradoSeeds = [], cerradoSeedCount = 0, savedCerradoSeeds = [], savedAnteaterHelped = false, anteaterHelped = false, savedCerradoAnimals = [], cerradoGate = null;
const progressStore = new ProgressStore();
const journal = new AdventureJournal();
const settingsStore = new GameSettings();
const gameSettings = settingsStore.load();
let paused = false, fpsFrames = 0, fpsElapsed = 0, fpsLast = performance.now(), adaptiveElapsed = 0, smoothedFrameMs = 16.7, currentPixelRatio = 1;
let started = false, collected = 0, lives = 3, cerradoCelebrated = false;
const keys = { forward:0, right:0, jump:false, run:false };
const solids = [];
const fruits = [];
const obstacles = [];
const up = new THREE.Vector3(0,1,0);
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
const playerVelocity = new THREE.Vector3();
let verticalVelocity = 0, grounded = true, jumpWasDown = false;
let walkTime = 0, footstepTimer = 0, footstepDust = null, footstepDummy = null, footstepLife = [];

function refreshJournal(){
  const list=document.querySelector('#journalList');
  const progress=document.querySelector('#journalProgress');
  if(!list||!progress)return;
  const summary=journal.getSummary();
  progress.textContent=summary.unlocked+'/'+summary.total+' conquistas · '+summary.minutes+' min explorados';
  list.textContent=journal.getAll().map(item=>(item.unlocked?'🏆 ':'🔒 ')+item.title+' — '+item.description+' ('+Math.floor(item.progress)+'/'+item.goal+')').join('\n');
  const button=document.querySelector('#journalBtn');if(button)button.textContent='DIÁRIO '+summary.unlocked+'/'+summary.total;
}
function recordJournal(event,amount=1){
  const unlocked=journal.record(event,amount);
  if(unlocked.length){const first=journal.getAll().find(item=>item.id===unlocked[0]);const toast=document.querySelector('#achievementToast');if(toast&&first){toast.textContent='🏆 Conquista: '+first.title;toast.classList.remove('hidden');setTimeout(()=>toast.classList.add('hidden'),3200);}}
  refreshJournal();
}
function material(color, roughness=0.9, extra={}){
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
    const ear=sphere(root,'orelha',.2,[.58,1.76,side*.43],fur,16);ear.scale.set(.75,1,.55);ears.push(ear);
    const inner=sphere(root,'orelha-interna',.105,[.62,1.79,side*.49],muzzle,12);inner.scale.set(.7,1,.45);
    eyes.push(sphere(root,'olho',.095,[.98,1.42,side*.43],eye,16));
    sphere(root,'brilho',.027,[1.01,1.46,side*.49],material('#fff2d2',.2),10);
  }
  const legs=[],ears=[],eyes=[];
  for(const x of [-.65,.65])for(const z of [-.43,.43]){
    const leg=new THREE.Group();leg.position.set(x,.55,z);root.add(leg);
    const limb=new THREE.Mesh(new THREE.CylinderGeometry(.14,.12,.62,12),fur);limb.position.y=-.23;limb.castShadow=true;leg.add(limb);
    const foot=sphere(leg,'pata',.17,[.04,-.5,0],claw,12);foot.scale.set(1,.65,1.1);
    legs.push(leg);
  }
  root.userData.legs=legs;root.userData.ears=ears;root.userData.eyes=eyes;root.userData.head=head;root.userData.torso=torso;
  const tail=sphere(root,'cauda',.12,[-1.02,.92,0],fur,12);tail.scale.set(1.35,.55,.55);
  for(const side of [-1,1]){const whisker=new THREE.Mesh(new THREE.CylinderGeometry(.012,.008,.42,5),dark);whisker.position.set(1.34,1.03,side*.2);whisker.rotation.z=-.12;whisker.rotation.x=side*.42;root.add(whisker);}
  // Small cheek tufts and subtle fur ridges give the silhouette more character.
  for(let i=0;i<5;i++){const tuft=new THREE.Mesh(new THREE.ConeGeometry(.075,.22,5),furLight);tuft.position.set(.15+i*.18,1.55,-.47);tuft.rotation.z=-.55;root.add(tuft);}
  root.userData.tail=tail;root.userData.nose=nose;root.userData.rootHeight=0;
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
  const preset=QUALITY[gameSettings.quality]||QUALITY.auto;
  scene=new THREE.Scene();scene.background=new THREE.Color('#8ccbd3');scene.fog=new THREE.FogExp2('#a6cbb4',.012);
  worldVisuals=new WorldVisuals(scene,(innerWidth<700?.5:1)*(QUALITY[gameSettings.quality]||QUALITY.auto).visuals);
  const hemisphereLight=new THREE.HemisphereLight('#d8f2ff','#425b36',2.1);scene.add(hemisphereLight);
  const sun=new THREE.DirectionalLight('#fff0cf',3.2);sun.position.set(-18,30,12);sun.castShadow=true;sun.shadow.mapSize.set(preset.shadowSize,preset.shadowSize);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;sun.shadow.bias=-.0002;scene.add(sun);
  atmosphere=new WorldAtmosphere({scene,sun,hemisphere:hemisphereLight,quality:preset.visuals,weatherLabel:document.querySelector('#weatherLabel')});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180,1,1),worldVisuals.createGroundMaterial('#587a43'));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
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
  createFootstepDust();
  ambientLife=new AmbientLife({scene,sun,hemisphere:hemisphereLight,quality:innerWidth<700?.55:1});
  companions=new CompanionSystem({scene,player,onTalk:showCompanionDialogue});
  portal=new GlacialPortal({scene,onEnter:showGlacialInvitation});
}
function setup() {
  const touchDevice=matchMedia('(pointer:coarse)').matches;
  renderer=new THREE.WebGLRenderer({antialias:innerWidth>760&&!touchDevice&&gameSettings.quality!=='low',alpha:false,powerPreference:'high-performance'});
  const preset=QUALITY[gameSettings.quality]||QUALITY.auto;
  currentPixelRatio=Math.min(devicePixelRatio,touchDevice?1.1:1.5)*preset.pixelRatio;
  renderer.setPixelRatio(currentPixelRatio);renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=preset.shadows&&innerWidth>760&&!touchDevice;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  viewport.appendChild(renderer.domElement);
  camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,180);
  createWorld();
  director=new CameraDirector({camera,domElement:renderer.domElement,scene,target:player,collisionObjects:obstacles});
  director.setMode(gameSettings.cameraMode||'thirdPerson');
  document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('selected',b.dataset.camera===(gameSettings.cameraMode||'thirdPerson')));
  restoreProgress();
  journal.visitBiome('amazon');refreshJournal();
  clock=new THREE.Clock();
  window.addEventListener('resize',resize);
  window.addEventListener('pagehide',()=>{audioAmbience.dispose();atmosphere?.dispose();director?.dispose();},{once:true});
  loading.classList.add('hidden');welcome.classList.remove('hidden');
}
function resize(){if(!renderer||!camera)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();const touchDevice=matchMedia('(pointer:coarse)').matches;const preset=QUALITY[gameSettings.quality]||QUALITY.auto;currentPixelRatio=Math.min(devicePixelRatio,touchDevice?1.1:1.5)*preset.pixelRatio;renderer.setPixelRatio(currentPixelRatio);renderer.setSize(innerWidth,innerHeight);}
function setCameraMode(mode){director.setMode(mode);gameSettings.cameraMode=mode;settingsStore.save(gameSettings);document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('selected',b.dataset.camera===mode));}
function bindControls(){
  const settingsPanel=document.querySelector('#settingsPanel');
  const settingsBtn=document.querySelector('#settingsBtn');
  const fpsMeter=document.querySelector('#fpsMeter');
  const fpsValue=document.querySelector('#fpsValue');
  const qualitySelect=document.querySelector('#qualitySelect');
  qualitySelect.value=gameSettings.quality;
  const persistSettings=()=>settingsStore.save(gameSettings);
  const showSettings=visible=>{settingsPanel.classList.toggle('hidden',!visible);settingsBtn.setAttribute('aria-expanded',String(visible));};
  document.querySelector('#journalBtn')?.addEventListener('click',()=>{refreshJournal();document.querySelector('#journalPanel')?.classList.toggle('hidden');});
  document.querySelector('#closeJournalBtn')?.addEventListener('click',()=>document.querySelector('#journalPanel')?.classList.add('hidden'));
  settingsBtn.addEventListener('click',()=>showSettings(settingsPanel.classList.contains('hidden')));
  document.querySelector('#closeSettingsBtn').addEventListener('click',()=>showSettings(false));
  qualitySelect.addEventListener('change',()=>{gameSettings.quality=qualitySelect.value;persistSettings();const preset=QUALITY[gameSettings.quality]||QUALITY.auto;renderer.shadowMap.enabled=preset.shadows&&innerWidth>760&&!matchMedia('(pointer:coarse)').matches;renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer:coarse)').matches?1.1:1.5)*preset.pixelRatio);currentPixelRatio=renderer.getPixelRatio();showDialogue('Gráficos atualizados','A nova qualidade será aplicada ao renderizador. Para reconstruir todos os detalhes do cenário, recarregue o jogo.');});
  document.querySelector('#pauseBtn').addEventListener('click',e=>{paused=!paused;e.currentTarget.textContent=paused?'CONTINUAR':'PAUSAR';clearMovementInput();if(paused)showDialogue('Jogo pausado','A aventura está em pausa. Pressione CONTINUAR nas configurações para voltar.');else document.querySelector('#dialogue').classList.add('hidden');});
  document.querySelector('#hudBtn').addEventListener('click',e=>{gameSettings.showHud=!gameSettings.showHud;document.querySelectorAll('.hud,.mission,.camera-panel,.touch-ui').forEach(el=>el.classList.toggle('hud-hidden',!gameSettings.showHud));e.currentTarget.textContent=gameSettings.showHud?'OCULTAR HUD':'MOSTRAR HUD';persistSettings();});
  document.querySelector('#fpsBtn').addEventListener('click',e=>{gameSettings.showFps=!gameSettings.showFps;fpsMeter.classList.toggle('hidden',!gameSettings.showFps);e.currentTarget.textContent=gameSettings.showFps?'OCULTAR FPS':'MOSTRAR FPS';persistSettings();});
  if(!gameSettings.showHud)document.querySelectorAll('.hud,.mission,.camera-panel,.touch-ui').forEach(el=>el.classList.add('hud-hidden'));
  document.querySelector('#hudBtn').textContent=gameSettings.showHud?'OCULTAR HUD':'MOSTRAR HUD';
  fpsMeter.classList.toggle('hidden',!gameSettings.showFps);
  document.querySelector('#fpsBtn').textContent=gameSettings.showFps?'OCULTAR FPS':'MOSTRAR FPS';
  document.querySelectorAll('[data-camera]').forEach(b=>b.addEventListener('click',()=>setCameraMode(b.dataset.camera)));
  window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='w'||e.key==='ArrowUp')keys.forward=1;if(e.key==='s'||e.key==='ArrowDown')keys.forward=-1;if(e.key==='a'||e.key==='ArrowLeft')keys.right=-1;if(e.key==='d'||e.key==='ArrowRight')keys.right=1;if(e.key==='Shift')keys.run=true;if(e.key===' '&&!e.repeat)keys.jump=true;});
  window.addEventListener('keyup',e=>{if(e.key==='w'||e.key==='ArrowUp'||e.key==='s'||e.key==='ArrowDown')keys.forward=0;if(e.key==='a'||e.key==='ArrowLeft'||e.key==='d'||e.key==='ArrowRight')keys.right=0;if(e.key==='Shift')keys.run=false;if(e.key===' ')keys.jump=false;});
  window.addEventListener('blur',clearMovementInput);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearMovementInput();});
  const stick=document.querySelector('#stick'),area=document.querySelector('.stick-area');let pointer=null;
  area.addEventListener('pointerdown',e=>{pointer=e.pointerId;area.setPointerCapture(pointer);moveStick(e);});
  area.addEventListener('pointermove',e=>{if(pointer===e.pointerId)moveStick(e);});
  const release=e=>{if(pointer!==e.pointerId)return;pointer=null;keys.forward=0;keys.right=0;stick.style.transform='translate(0,0)';};
  area.addEventListener('pointerup',release);area.addEventListener('pointercancel',release);
  function moveStick(e){const r=area.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=36,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max;}stick.style.transform=`translate(${dx}px,${dy}px)`;keys.right=THREE.MathUtils.clamp(dx/max,-1,1);keys.forward=THREE.MathUtils.clamp(-dy/max,-1,1);}
  const jump=document.querySelector('#jumpBtn');jump.addEventListener('pointerdown',e=>{e.preventDefault();keys.jump=true;});['pointerup','pointercancel','pointerleave'].forEach(ev=>jump.addEventListener(ev,()=>keys.jump=false));
  const run=document.querySelector('#runBtn');run.addEventListener('pointerdown',()=>keys.run=true);['pointerup','pointercancel','pointerleave'].forEach(ev=>run.addEventListener(ev,()=>keys.run=false));
  document.querySelector('#startBtn').addEventListener('click',()=>{started=true;welcome.classList.add('hidden');const audioOn=gameSettings.soundEnabled?audioAmbience.start():false;document.querySelector('#audioBtn').textContent=audioOn?'SOM: LIGADO':'SOM: DESLIGADO';});
  document.querySelector('#audioBtn')?.addEventListener('click',()=>{const enabled=audioAmbience.toggle();gameSettings.soundEnabled=enabled;settingsStore.save(gameSettings);document.querySelector('#audioBtn').textContent=enabled?'SOM: LIGADO':'SOM: DESLIGADO';});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&started){paused=!paused;clearMovementInput();document.querySelector('#pauseBtn').textContent=paused?'CONTINUAR':'PAUSAR';if(paused)showDialogue('Jogo pausado','Abra AJUSTES e escolha CONTINUAR para retomar.');else document.querySelector('#dialogue').classList.add('hidden');}if(e.key.toLowerCase()==='e'&&started&&!paused)interact();if(e.key.toLowerCase()==='f'&&started&&!paused)scareWildlife();});
  document.querySelector('#talkBtn')?.addEventListener('click',interact);
  document.querySelector('#scareBtn')?.addEventListener('click',scareWildlife);
  document.querySelector('#enterIceBtn')?.addEventListener('click',enterGlacialChapter);
  document.querySelector('#closeDialogueBtn')?.addEventListener('click',()=>document.querySelector('#dialogue').classList.add('hidden'));
}
function createFootstepDust(){
  const count=14;
  const geometry=new THREE.SphereGeometry(.075,6,5);
  const mat=new THREE.MeshBasicMaterial({color:'#d8c49a',transparent:true,opacity:.32,depthWrite:false});
  footstepDust=new THREE.InstancedMesh(geometry,mat,count);
  footstepDust.frustumCulled=false;footstepDummy=new THREE.Object3D();
  footstepLife=Array(count).fill(0);
  for(let i=0;i<count;i++){footstepDummy.position.set(0,-20,0);footstepDummy.scale.setScalar(0);footstepDummy.updateMatrix();footstepDust.setMatrixAt(i,footstepDummy.matrix);}
  footstepDust.instanceMatrix.needsUpdate=true;scene.add(footstepDust);
}
function updateFootstepDust(dt,moving){
  if(!footstepDust)return;
  footstepTimer-=dt;
  if(moving&&keys.run&&grounded&&footstepTimer<=0){
    footstepTimer=.16;
    let slot=footstepLife.findIndex(life=>life<=0);
    if(slot<0)slot=footstepLife.indexOf(Math.min(...footstepLife));
    footstepLife[slot]=.55;
    footstepDust.userData.positions??=Array.from({length:footstepLife.length},()=>new THREE.Vector3());
    footstepDust.userData.positions[slot].set(player.position.x+(Math.random()-.5)*.45,.08,player.position.z+.25);
  }
  const positions=footstepDust.userData.positions||[];
  for(let i=0;i<footstepLife.length;i++){
    footstepLife[i]=Math.max(0,footstepLife[i]-dt);
    const life=footstepLife[i],p=positions[i]||new THREE.Vector3(0,-20,0);
    if(life>0){p.y+=dt*.28;footstepDummy.position.copy(p);footstepDummy.scale.setScalar((life/.55)*.8);}
    else{footstepDummy.position.set(0,-20,0);footstepDummy.scale.setScalar(0);}
    footstepDummy.updateMatrix();footstepDust.setMatrixAt(i,footstepDummy.matrix);
  }
  footstepDust.instanceMatrix.needsUpdate=true;
}
function updatePlayer(dt){
  const cameraForward=new THREE.Vector3();camera.getWorldDirection(cameraForward);cameraForward.y=0;cameraForward.normalize();
  right.crossVectors(cameraForward,up).normalize();
  move.copy(cameraForward).multiplyScalar(keys.forward).addScaledVector(right,keys.right);
  if(move.lengthSq()>1)move.normalize();
  const speed=keys.run?7.1:4.2;
  const desiredX=move.x*speed,desiredZ=move.z*speed;
  const response=keys.forward||keys.right?12:8;
  playerVelocity.x=THREE.MathUtils.damp(playerVelocity.x,desiredX,response,dt);
  playerVelocity.z=THREE.MathUtils.damp(playerVelocity.z,desiredZ,response,dt);
  player.position.x+=playerVelocity.x*dt;
  player.position.z+=playerVelocity.z*dt;
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
  const breath=Math.sin(walkTime*.45)*.012;
  player.userData.torso.scale.y=.67+breath+(moving?Math.abs(Math.sin(walkTime*2))*.025:0);
  player.userData.head.rotation.z=(moving?Math.sin(walkTime)*.045:0)+Math.sin(performance.now()*.0007)*.012;
  player.userData.head.rotation.x=moving?Math.sin(walkTime*.5)*.025:0;
  player.userData.tail.rotation.z=Math.sin(walkTime*.75)*.16+(moving?.06:0);
  player.userData.legs.forEach((leg,i)=>{leg.rotation.z=moving?Math.sin(walkTime+i*Math.PI)*.035:THREE.MathUtils.damp(leg.rotation.z,0,7,dt);});
  updateFootstepDust(dt,moving);
  player.userData.ears.forEach((ear,i)=>{ear.rotation.z=Math.sin(walkTime*.7+i)*.045+(moving?-.025:0);});
  const blink=Math.pow(Math.max(0,Math.sin(performance.now()*.00115)),70);
  player.userData.eyes.forEach(eye=>{eye.scale.y=1-blink*.88;});
  // Simple physical blockers keep the character out of tree trunks and rocks.
  for(const obstacle of obstacles){const p=new THREE.Vector3();obstacle.getWorldPosition(p);const radius=obstacle.geometry?.parameters?.radius||.6;const dx=player.position.x-p.x,dz=player.position.z-p.z;const min=radius+.7;if(dx*dx+dz*dz<min*min&&Math.abs(player.position.y)<1.2){const d=Math.max(.001,Math.hypot(dx,dz));player.position.x=p.x+dx/d*min;player.position.z=p.z+dz/d*min;}}
}
function saveProgress(){
  progressStore.save({collected:fruits.map((fruit,index)=>fruit.userData.collected?index:null).filter(index=>index!==null),talked:companions?.talkedNames||[],portalUnlocked:portal?.unlocked,glacialMode,glacialCrystals:iceCrystals.length?iceCrystals.filter(c=>c.userData.collected).map(c=>c.userData.index):savedGlacialCrystals,mammothRescued:glacialMammoths?glacialMammoths.rescued:savedMammothRescued,cerradoMode,cerradoSeeds:cerradoSeeds.length?cerradoSeeds.filter(s=>s.userData.collected).map(s=>s.userData.index):savedCerradoSeeds,anteaterHelped,cerradoAnimals:cerradoWildlife?.observedNames||savedCerradoAnimals});
}
function restoreProgress(){
  const saved=progressStore.load();
  savedGlacialCrystals=Array.isArray(saved.glacialCrystals)?saved.glacialCrystals:[];
  savedMammothRescued=Boolean(saved.mammothRescued);
  savedCerradoSeeds=Array.isArray(saved.cerradoSeeds)?saved.cerradoSeeds:[];
  savedAnteaterHelped=Boolean(saved.anteaterHelped);
  savedCerradoAnimals=Array.isArray(saved.cerradoAnimals)?saved.cerradoAnimals:[];
  anteaterHelped=savedAnteaterHelped;
  glacialCrystals=savedGlacialCrystals.length;
  const collectedSet=new Set(Array.isArray(saved.collected)?saved.collected:[]);
  fruits.forEach((fruit,index)=>{if(collectedSet.has(index)){fruit.userData.collected=true;fruit.visible=false;collected++;}});
  fruitCount.textContent=collected;
  companions?.restoreTalked(Array.isArray(saved.talked)?saved.talked:[]);
  if(saved.portalUnlocked||(collected===fruits.length&&companions?.talkedNames.includes('Tico')))portal?.unlock();
  if(collected===fruits.length&&collected>0&&!portal?.unlocked)missionText.textContent='Frutos encontrados! Converse com Tico';
  else if(portal?.unlocked)missionText.textContent='Portal aberto! Encontre a passagem congelada';
  else if(collected>0)missionText.textContent='Continue sua jornada pela floresta';
  if(saved.glacialMode||saved.cerradoMode){portal?.unlock();enterGlacialChapter();if(saved.cerradoMode)enterCerradoChapter();}
}
function clearMovementInput(){keys.forward=0;keys.right=0;keys.jump=false;keys.run=false;playerVelocity.set(0,0,0);}
function showDialogue(title, message, button='CONTINUAR') {
  clearMovementInput();
  const panel=document.querySelector('#dialogue');
  document.querySelector('#dialogueTitle').textContent=title;
  document.querySelector('#dialogueText').textContent=message;
  const closeButton=document.querySelector('#closeDialogueBtn');
  closeButton.textContent=button;
  closeButton.onclick=()=>panel.classList.add('hidden');
  panel.classList.remove('hidden');
}
function showCompanionDialogue(item){
  showDialogue(item.name+' · '+item.species,item.dialogue);
  recordJournal('talk');if(item.name==='Tico'){recordJournal('tico');}if(item.name==='Tico'&&collected===fruits.length){portal?.unlock();recordJournal('portal');missionText.textContent='Portal aberto! Encontre a passagem congelada';}
  saveProgress();
}
function interact(){
  if(document.querySelector('#dialogue')?.classList.contains('hidden')===false)return;
  if(glacialMode&&cerradoGate&&player.position.distanceTo(cerradoGate.position)<4){showDialogue('Portal dourado','O vale foi salvo. Atravesse para conhecer o Cerrado brasileiro.','ATRAVESSAR');document.querySelector('#closeDialogueBtn').onclick=enterCerradoChapter;return;}
  if(glacialMode&&glacialMammoths?.interact())return;
  if(cerradoMode&&cerradoBiome?.anteater.position.distanceTo(player.position)<3.8){
    anteaterHelped=true;savedAnteaterHelped=true;recordJournal('anteater');saveProgress();
    const seen=cerradoWildlife?.observedNames.length||savedCerradoAnimals.length;
    updateCerradoMission();
    if(!(cerradoSeedCount>=5&&seen>=3))showDialogue('Tamanduá-bandeira ajudado!','Você acompanhou o tamanduá até uma área segura. Continue reunindo as sementes douradas e observando os animais do Cerrado.');
    return;
  }
  if(cerradoMode&&cerradoWildlife?.interact())return;
  if(companions?.interact())return;
  if(portal?.unlocked&&player.position.distanceTo(portal.root.position)<4){showGlacialInvitation();return;}
  showDialogue('A floresta está cheia de segredos','Chegue perto de Tico, Brasa ou Bento e pressione E para conversar. No celular, use o botão CONVERSAR.');
}
function showGlacialInvitation(){
  if(!portal?.unlocked){showDialogue('Portal adormecido','A passagem só desperta quando os oito frutos forem encontrados e Tico revelar o caminho.');return;}
  showDialogue('O segredo das três eras','O portal despertou! Do outro lado existe um mundo de gelo, mamutes e novas aventuras. Pressione ENTRAR NA ERA GLACIAL para atravessar.','ENTRAR NA ERA GLACIAL');
  document.querySelector('#closeDialogueBtn').onclick=enterGlacialChapter;
}
function enterGlacialChapter(){
  if(glacialMode)return;
  glacialMode=true;
  journal.visitBiome('glacial');recordJournal('glacial');
  saveProgress();
  document.querySelector('#dialogue').classList.add('hidden');
  document.querySelector('.brand small').textContent='Capítulo 2 · Era Glacial';
  missionText.textContent='Explore a passagem congelada';
  scene.background.set('#b9dce8');
  scene.fog.color.set('#c6e5ed');scene.fog.density=.018;
  scene.traverse(obj=>{if(obj.isMesh&&obj.material?.color&&obj.name!=='fruto'){const color=obj.material.color;if(color.g>.28&&color.r<.5){color.lerp(new THREE.Color('#a9c5c9'),.38);}}});
  glacialBiome=buildGlacialBiome(scene,innerWidth<700?.55:1);
  wildlife=new GlacialWildlife({scene,player,onDamage:takeDamage,onDefeated:()=>showDialogue('Predador afastado!','Você conseguiu espantar o lobo-das-neves. Continue atento: ainda há outro pelo vale.')});
  glacialMammoths=new GlacialMammoths({scene,player,restored:savedMammothRescued,onRescue:()=>{savedMammothRescued=true;recordJournal('mammoth');updateGlacialMission();saveProgress();showDialogue('A família está reunida!','O filhote encontrou sua mãe. Bento reconhece os chamados e agora sabe que não está sozinho neste mundo gelado.');}});

  iceCrystals=glacialBiome.crystals||[];
  iceCrystals.forEach(crystal=>{if(savedGlacialCrystals.includes(crystal.userData.index)){crystal.userData.collected=true;crystal.visible=false;}});
  glacialCrystals=iceCrystals.filter(crystal=>crystal.userData.collected).length;
  document.querySelector('#fruitStat')?.classList.add('hidden');
  document.querySelector('#iceStat')?.classList.remove('hidden');
  document.querySelector('#iceCount').textContent=glacialCrystals;
  updateGlacialMission();
  snowDummy=new THREE.Object3D();
  const snowCount=innerWidth<700?180:420;
  snowParticles=new THREE.InstancedMesh(new THREE.SphereGeometry(.035,5,4),new THREE.MeshBasicMaterial({color:'#f4fbff'}),snowCount);
  snowParticles.frustumCulled=false;scene.add(snowParticles);
  snowPositions=Array.from({length:snowCount},()=>new THREE.Vector3((Math.random()-.5)*35,Math.random()*18,-Math.random()*85));
  portal.root.visible=false;
  showDialogue('Bem-vindo à Era Glacial','A floresta ficou para trás. Esta é a primeira passagem para o novo capítulo. Explore o gelo e procure as pegadas da família de Bento.');
}
function updateCollectibles(dt){
  for(const fruit of fruits){if(fruit.userData.collected)continue;fruit.rotation.y+=dt*1.2;fruit.position.y=fruit.userData.baseY+Math.sin(performance.now()*.002+fruit.position.z)*.12;if(fruit.position.distanceTo(player.position.clone().add(new THREE.Vector3(0,1,0)))<1.45){fruit.userData.collected=true;fruit.visible=false;collected++;recordJournal('fruit');fruitCount.textContent=collected;saveProgress();if(collected===fruits.length){if(companions?.talkedNames.includes('Tico')){portal?.unlock();recordJournal('portal');missionText.textContent='Portal aberto! Encontre a passagem congelada';}else{missionText.textContent='Frutos encontrados! Converse com Tico';}showDialogue('Missão concluída','Você encontrou todos os frutos! Procure Tico para descobrir como atravessar.');}}}
}
function scareWildlife(){
  if(!glacialMode||!wildlife)return;
  if(!wildlife.scare())showDialogue('Sem ameaças por perto','Aproxime-se de um lobo-das-neves e use ASSUSTAR para se defender.');
}
function takeDamage(){
  lives=Math.max(0,lives-1);heartsText.textContent=''.padStart(lives,'♥');
  player.position.set(0,0,5);playerVelocity.set(0,0,0);verticalVelocity=0;
  if(lives===0){lives=3;heartsText.textContent='♥♥♥';showDialogue('Você descansou na cabana','Os companheiros ajudaram a capivara a se recuperar. Suas descobertas continuam salvas.');}
  else showDialogue('Cuidado com as presas!','Um lobo-das-neves alcançou você. Corra, pule ou use ASSUSTAR para se defender.');
}
function updateGlacialMission(){
  if(!glacialMode)return;
  if(glacialCrystals>=5&&glacialMammoths?.rescued){
    recordJournal('iceComplete');
    missionText.textContent='Vale salvo! Portal dourado desbloqueado';
    createCerradoGate();
    return;
  }
  if(!glacialMammoths?.rescued){
    missionText.textContent='Resgate o filhote de mamute · '+(glacialCrystals>=5?'Cristais 5/5':'Cristais '+glacialCrystals+'/5');
  }else{
    missionText.textContent='Encontre os cristais azuis · '+glacialCrystals+'/5';
  }
}
function createCerradoGate(){
  if(cerradoGate)return;
  cerradoGate=new THREE.Group();cerradoGate.position.set(0,0,-74);
  const stone=new THREE.MeshStandardMaterial({color:'#80633c',roughness:.85});
  const glow=new THREE.MeshStandardMaterial({color:'#f3c86b',emissive:'#b9791e',emissiveIntensity:.9,roughness:.25});
  const arch=new THREE.Mesh(new THREE.TorusGeometry(2.15,.3,10,32),stone);arch.position.y=2.6;arch.scale.y=1.25;cerradoGate.add(arch);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.82,.1,8,32),glow);ring.position.y=2.6;ring.scale.y=1.25;cerradoGate.add(ring);
  scene.add(cerradoGate);
}
function enterCerradoChapter(){
  if(cerradoMode)return;
  glacialMode=false;cerradoMode=true;journal.visitBiome('cerrado');
  wildlife?.dispose();wildlife=null;glacialMammoths?.dispose();glacialMammoths=null;cerradoWildlife?.dispose();cerradoWildlife=null;
  if(glacialBiome){glacialBiome.dispose();glacialBiome=null;}
  if(snowParticles){scene.remove(snowParticles);snowParticles.geometry.dispose();snowParticles.material.dispose();snowParticles=null;}
  if(cerradoGate){scene.remove(cerradoGate);cerradoGate.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose();}});cerradoGate=null;}
  scene.background.set('#e9c98d');scene.fog.color.set('#d7b77f');scene.fog.density=.009;
  cerradoBiome=buildCerradoBiome(scene,innerWidth<700?.55:1);
  cerradoWildlife=new CerradoWildlife({scene,player,onObserve:({animal,repeat})=>{savedCerradoAnimals=cerradoWildlife.observedNames;if(!repeat){recordJournal('fauna');if(animal.species==='Lobo-guará')recordJournal('guara');if(animal.species==='Seriema')recordJournal('seriema');if(animal.species==='Tatu-canastra')recordJournal('tatu');}showDialogue(animal.species+' · '+animal.name,repeat?'Você já registrou este encontro. Observe os outros animais para completar o diário da fauna.':animal.species==='Lobo-guará'?'O lobo-guará é um canídeo de pernas longas, típico do Cerrado. Observe sem perseguir e respeite seu espaço.':animal.species==='Seriema'?'A seriema percorre o campo a pé e corre muito rápido. Você registrou mais uma espécie no diário.':'O tatu-canastra é discreto e escava tocas. Você registrou mais uma espécie no diário.');updateCerradoMission();saveProgress();}});
  cerradoWildlife.restore(savedCerradoAnimals);
  cerradoSeeds=cerradoBiome.seeds;
  cerradoSeeds.forEach(seed=>{if(savedCerradoSeeds.includes(seed.userData.index)){seed.userData.collected=true;seed.visible=false;}});
  cerradoSeedCount=cerradoSeeds.filter(seed=>seed.userData.collected).length;
  anteaterHelped=savedAnteaterHelped;
  player.position.set(0,0,5);playerVelocity.set(0,0,0);verticalVelocity=0;
  document.querySelector('.brand small').textContent='Capítulo 3 · Cerrado brasileiro';
  document.querySelector('#iceStat')?.classList.add('hidden');
  document.querySelector('#fruitStat')?.classList.add('hidden');
  showDialogue('A terceira era: o Cerrado','Depois do gelo, a capivara encontra um Brasil de chapadas, veredas e ipês. Encontre cinco sementes douradas e ajude o tamanduá-bandeira.');
  updateCerradoMission();saveProgress();
}
function updateCerradoMission(){
  if(!cerradoMode)return;
  const seen=cerradoWildlife?.observedNames.length||savedCerradoAnimals.length;
  if(cerradoSeedCount>=5&&anteaterHelped&&seen>=3){recordJournal('cerradoComplete');missionText.textContent='Vereda restaurada! Fauna registrada · Capítulo concluído';if(!cerradoCelebrated){cerradoCelebrated=true;showDialogue('O Cerrado floresceu novamente!','Você reuniu as sementes, ajudou o tamanduá-bandeira e registrou o lobo-guará, a seriema e o tatu-canastra. A jornada por estas três eras está concluída!');}}
  else if(cerradoSeedCount<5)missionText.textContent='Sementes douradas '+cerradoSeedCount+'/5 · Fauna '+seen+'/3';
  else if(!anteaterHelped)missionText.textContent='Ajude o tamanduá-bandeira · Sementes 5/5 · Fauna '+seen+'/3';
  else missionText.textContent='Observe lobo-guará, seriema e tatu-canastra · '+seen+'/3';
}
function updateCerradoCollectibles(dt){
  if(!cerradoMode||!cerradoSeeds.length)return;
  for(const seed of cerradoSeeds){if(seed.userData.collected)continue;seed.rotation.y+=dt*.9;seed.position.y=seed.userData.baseY+Math.sin(performance.now()*.002+seed.userData.index)*.13;if(seed.position.distanceTo(player.position.clone().add(new THREE.Vector3(0,1,0)))<1.7){seed.userData.collected=true;seed.visible=false;cerradoSeedCount++;recordJournal('seed');updateCerradoMission();saveProgress();if(cerradoSeedCount===5&&!(anteaterHelped&&(cerradoWildlife?.observedNames.length||savedCerradoAnimals.length)>=3))showDialogue('As sementes douradas reunidas!','A vereda começa a florescer novamente. Falta ajudar o tamanduá-bandeira e registrar a fauna para concluir este capítulo.');}}
}
function updateGlacialCollectibles(dt){
  if(!glacialMode||!iceCrystals.length)return;
  for(const crystal of iceCrystals){
    if(crystal.userData.collected)continue;
    crystal.rotation.y+=dt*0.8;
    crystal.position.y=crystal.userData.baseY+Math.sin(performance.now()*0.002+crystal.userData.index)*0.16;
    if(crystal.position.distanceTo(player.position.clone().add(new THREE.Vector3(0,1,0)))<1.8){
      crystal.userData.collected=true;crystal.visible=false;glacialCrystals++;recordJournal('crystal');
      document.querySelector('#iceCount').textContent=glacialCrystals;
      updateGlacialMission();
      saveProgress();
      if(glacialCrystals===5){if(glacialMammoths?.rescued)showDialogue('O vale foi salvo!','Os cinco cristais foram reunidos e a família de mamutes está segura. Uma antiga luz desperta sob o gelo. Este capítulo está completo!');else showDialogue('Os cristais despertaram!','Você reuniu os cinco cristais. Falta encontrar o filhote perdido e reunir a família de Bento para concluir o vale.');}
    }
  }
}
function animate(){
  requestAnimationFrame(animate);
  const rawDelta=document.hidden||paused?0:Math.min(clock.getDelta(),.05);
  const dt=rawDelta;
  if(rawDelta>0){smoothedFrameMs=smoothedFrameMs*.9+rawDelta*1000*.1;fpsFrames++;fpsElapsed+=rawDelta;adaptiveElapsed+=rawDelta;}
  if(gameSettings.showFps&&fpsElapsed>=.5){fpsValue.textContent=Math.round(fpsFrames/fpsElapsed);fpsFrames=0;fpsElapsed=0;}
  if(gameSettings.quality==='auto'&&adaptiveElapsed>=2&&renderer){adaptiveElapsed=0;const target=smoothedFrameMs>23?.88:smoothedFrameMs<16?1.035:1;const maxRatio=Math.min(devicePixelRatio,matchMedia('(pointer:coarse)').matches?1.1:1.5);const next=THREE.MathUtils.clamp(currentPixelRatio*target,maxRatio*.55,maxRatio);if(Math.abs(next-currentPixelRatio)>.025){currentPixelRatio=next;renderer.setPixelRatio(next);renderer.setSize(innerWidth,innerHeight);}}
  if(started&& !paused){updatePlayer(dt);updateCollectibles(dt);updateGlacialCollectibles(dt);updateCerradoCollectibles(dt);wildlife?.update(dt);glacialMammoths?.update(dt);companions?.update(dt);portal?.update(dt,player);cerradoWildlife?.update(dt);cerradoBiome?.update(dt,player);if(cerradoGate&&glacialMode&&!cerradoGate.userData.prompted&&player.position.distanceTo(cerradoGate.position)<3.4){cerradoGate.userData.prompted=true;showDialogue('Uma nova paisagem espera','O vale está salvo. Pressione E ou ATRAVESSAR para conhecer o Cerrado brasileiro.','ATRAVESSAR');document.querySelector('#closeDialogueBtn').onclick=enterCerradoChapter;}}
  if(started&&!paused&&dt>0){const unlocked=journal.tick(dt,{weather:atmosphere?.weather});if(unlocked.length){const item=journal.getAll().find(entry=>entry.id===unlocked[0]);const toast=document.querySelector('#achievementToast');if(toast&&item){toast.textContent='🏆 Conquista: '+item.title;toast.classList.remove('hidden');setTimeout(()=>toast.classList.add('hidden'),3200);}refreshJournal();}}
  if(ambientLife&&!glacialMode&&!cerradoMode)ambientLife.update(dt,player);
  worldVisuals?.update(dt,player,glacialMode,cerradoMode);
  atmosphere?.update(dt,player,glacialMode?'glacial':cerradoMode?'cerrado':'amazon');
  if(glacialMode&&snowParticles){for(let i=0;i<snowPositions.length;i++){const p=snowPositions[i];p.y-=dt*(1.4+(i%5)*.25);p.x+=Math.sin(performance.now()*.0004+i)*dt*.25;if(p.y<0)p.set(player.position.x+(Math.random()-.5)*34,12+Math.random()*8,player.position.z-Math.random()*45);snowDummy.position.copy(p);snowDummy.updateMatrix();snowParticles.setMatrixAt(i,snowDummy.matrix);}snowParticles.instanceMatrix.needsUpdate=true;}
  director.update(dt);
  renderer.render(scene,camera);
}
function boot(){
  try{setup();bindControls();animate();}
  catch(err){loading.classList.add('hidden');errorBox.classList.remove('hidden');errorBox.textContent='Não foi possível iniciar o 3D neste navegador. '+err.message;console.error(err);}
}
boot();
