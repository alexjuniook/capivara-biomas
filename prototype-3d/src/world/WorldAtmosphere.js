import * as THREE from 'three';

const PALETTES = {
  amazon: { dawn: ['#e9b78c','#6e8563'], day: ['#8ccbd3','#a6cbb4'], dusk: ['#d98d67','#8b765f'], night: ['#10233a','#263b43'] },
  glacial: { dawn: ['#d7c4bd','#aabac4'], day: ['#b9dce8','#c6e5ed'], dusk: ['#8e9db8','#899cae'], night: ['#101c35','#26364b'] },
  cerrado: { dawn: ['#e9a36c','#b58b5c'], day: ['#e9c98d','#d7b77f'], dusk: ['#d77c50','#9c7955'], night: ['#18233b','#4c4d4a'] }
};

const WEATHER = {
  amazon: ['clear','rain','storm','clear','wind'],
  glacial: ['snow','blizzard','clear','snow'],
  cerrado: ['clear','wind','dust','rain','clear']
};

const hex = value => new THREE.Color(value);
const lerpColor = (a,b,t) => hex(a).lerp(hex(b),t);

export class WorldAtmosphere {
  constructor({scene,sun,hemisphere,quality=1,weatherLabel=null}={}) {
    if(!scene?.isScene || !sun?.isDirectionalLight || !hemisphere?.isHemisphereLight) throw new Error('WorldAtmosphere precisa da cena e das luzes do mundo.');
    this.scene=scene;this.sun=sun;this.hemisphere=hemisphere;this.weatherLabel=weatherLabel;
    this.time=0.32;this.dayLength=300;this.weather='clear';this.weatherTimer=0;this.weatherIndex=0;
    this.wind=0;this.lightning=0;this.flash=0;this.disposed=false;this.clouds=[];
    this.particleCount=Math.max(70,Math.round(260*Math.max(.25,quality)));
    this.dummy=new THREE.Object3D();this.particles=[];
    this.weatherGeometry=new THREE.SphereGeometry(.035,5,4);
    this.weatherMaterial=new THREE.MeshBasicMaterial({color:'#d9f5ff',transparent:true,opacity:.62,depthWrite:false});
    this.weatherMesh=new THREE.InstancedMesh(this.weatherGeometry,this.weatherMaterial,this.particleCount);
    this.weatherMesh.frustumCulled=false;this.scene.add(this.weatherMesh);
    for(let i=0;i<this.particleCount;i++) this.particles.push(new THREE.Vector3((Math.random()-.5)*45,Math.random()*20,(Math.random()-.5)*70));
    for(let i=0;i<7;i++){
      const cloud=new THREE.Group();cloud.position.set((Math.random()-.5)*55,14+Math.random()*5,-10-Math.random()*65);
      const material=new THREE.MeshStandardMaterial({color:'#f2f3e8',roughness:1,transparent:true,opacity:.68});
      for(let j=0;j<4;j++){const puff=new THREE.Mesh(new THREE.SphereGeometry(1.4+Math.random()*1.4,8,6),material);puff.position.set((j-1.5)*1.7,Math.random()*.5,(Math.random()-.5)*1.4);puff.scale.y=.45;cloud.add(puff);}
      this.scene.add(cloud);this.clouds.push(cloud);
    }
    this.setWeather('clear');
  }

  setWeather(weather) {
    if(!['clear','rain','storm','wind','snow','blizzard','dust'].includes(weather)) return false;
    this.weather=weather;this.weatherTimer=0;
    const labels={clear:'Céu limpo',rain:'Chuva',storm:'Tempestade',wind:'Vento forte',snow:'Neve',blizzard:'Nevasca',dust:'Vento seco'};
    if(this.weatherLabel)this.weatherLabel.textContent=labels[weather];
    const visible=weather!=='clear'&&weather!=='wind';
    this.weatherMesh.visible=visible;
    this.weatherMaterial.color.set(weather==='snow'||weather==='blizzard'?'#f4fbff':weather==='dust'?'#c99b5b':'#b8e8f5');
    this.weatherMaterial.opacity=weather==='storm'||weather==='blizzard'?.82:.58;
    return true;
  }

  #cycleWeather(biome) {
    const options=WEATHER[biome]||WEATHER.amazon;
    this.weatherIndex=(this.weatherIndex+1)%options.length;
    this.setWeather(options[this.weatherIndex]);
    this.weatherTimer=0;
  }

  update(dt,player,biome='amazon') {
    if(this.disposed)return;
    const delta=Math.min(Math.max(dt,0),.05);
    this.time=(this.time+delta/this.dayLength)%1;
    this.weatherTimer+=delta;
    if(this.weatherTimer>72)this.#cycleWeather(biome);
    const phase=this.time*Math.PI*2-Math.PI/2;
    const daylight=THREE.MathUtils.clamp((Math.sin(phase)+.12)/1.12,0,1);
    const dawn=Math.max(0,1-Math.abs(this.time-.25)*9);
    const dusk=Math.max(0,1-Math.abs(this.time-.75)*9);
    const palette=PALETTES[biome]||PALETTES.amazon;
    const night=lerpColor(palette.night[0],palette.day[0],daylight);
    const groundNight=lerpColor(palette.night[1],palette.day[1],daylight);
    const warm=lerpColor(palette.dawn[0],palette.dusk[0],dusk);
    night.lerp(warm,Math.max(dawn,dusk)*.42);
    groundNight.lerp(lerpColor(palette.dawn[1],palette.dusk[1],dusk),Math.max(dawn,dusk)*.35);
    if(this.scene.background?.isColor)this.scene.background.copy(night);
    if(this.scene.fog?.color)this.scene.fog.color.copy(groundNight);
    this.sun.intensity=(.18+daylight*3.1)*(this.weather==='storm'?.48:1)*(this.weather==='blizzard'?.72:1);
    this.sun.position.set(Math.cos(phase)*32,8+daylight*27,Math.sin(phase)*22);
    this.sun.color.copy(lerpColor('#8ba9d8','#fff0cf',daylight)).lerp(hex('#ffc28a'),Math.max(dawn,dusk)*.35);
    this.hemisphere.intensity=.35+daylight*1.8;
    this.wind=this.weather==='wind'||this.weather==='storm'||this.weather==='blizzard'||this.weather==='dust'?1.7:.35;
    this.clouds.forEach((cloud,index)=>{cloud.position.x+=delta*this.wind*(index%2?1:-1)*.22;if(cloud.position.x>32)cloud.position.x=-32;if(cloud.position.x< -32)cloud.position.x=32;cloud.position.y=14+Math.sin(this.time*12+index)*.4;cloud.visible=this.weather!=='clear'||daylight>.2;});
    const raining=['rain','storm','snow','blizzard','dust'].includes(this.weather);
    this.weatherMesh.visible=raining;
    if(raining){
      const speed=this.weather==='blizzard'?9:this.weather==='snow'?2.1:this.weather==='dust'?4:12;
      for(let i=0;i<this.particles.length;i++){
        const p=this.particles[i];p.y-=delta*speed;p.x+=delta*this.wind*(this.weather==='dust'?2:.5);
        if(p.y<0||p.x>player.position.x+24||p.x<player.position.x-24){p.set(player.position.x+(Math.random()-.5)*42,12+Math.random()*12,player.position.z+(Math.random()-.5)*55);}
        this.dummy.position.copy(p);this.dummy.scale.setScalar(this.weather==='snow'||this.weather==='blizzard'?.8:.55);this.dummy.updateMatrix();this.weatherMesh.setMatrixAt(i,this.dummy.matrix);
      }
      this.weatherMesh.instanceMatrix.needsUpdate=true;
    }
    if(this.weather==='storm'&&Math.random()<delta*.22)this.flash=.16;
    if(this.flash>0){this.flash=Math.max(0,this.flash-delta);this.sun.intensity+=this.flash*30;}
    if(this.weatherLabel){const hour=Math.floor(this.time*24);this.weatherLabel.dataset.time=String(hour).padStart(2,'0')+':00';}
  }

  dispose() {
    if(this.disposed)return;this.disposed=true;
    this.scene.remove(this.weatherMesh);this.weatherGeometry.dispose();this.weatherMaterial.dispose();
    for(const cloud of this.clouds){this.scene.remove(cloud);cloud.traverse(child=>{child.geometry?.dispose();if(child.material)child.material.dispose();});}
    this.clouds.length=0;this.particles.length=0;
  }
}
