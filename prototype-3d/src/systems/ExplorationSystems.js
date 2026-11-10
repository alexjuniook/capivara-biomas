export class StaminaSystem {
  constructor({maximum=100,drain=30,recovery=19}={}){this.maximum=maximum;this.value=maximum;this.drain=drain;this.recovery=recovery;this.exhausted=false;}
  update(dt,{running=false,moving=false}={}){
    const delta=Math.min(Math.max(Number(dt)||0,0),.05);
    if(running&&moving&&this.value>0){this.value=Math.max(0,this.value-this.drain*delta);if(this.value===0)this.exhausted=true;}
    else{this.value=Math.min(this.maximum,this.value+this.recovery*delta);if(this.value>22)this.exhausted=false;}
    return {value:this.value,ratio:this.value/this.maximum,canRun:this.value>1&&!this.exhausted,exhausted:this.exhausted};
  }
  reset(){this.value=this.maximum;this.exhausted=false;}
}

const CHECKPOINTS={
  amazon:{name:'Acampamento da Amazônia',position:[0,0,5]},
  glacial:{name:'Abrigo do Vale Glacial',position:[0,0,5]},
  cerrado:{name:'Vereda do Cerrado',position:[0,0,5]}
};
export class CheckpointSystem {
  constructor(storage=globalThis.localStorage){this.storage=storage;this.current='amazon';this.points={...CHECKPOINTS};this.load();}
  load(){try{const data=JSON.parse(this.storage?.getItem('capivara-checkpoints-v1')||'{}');for(const [key,value] of Object.entries(data)){if(CHECKPOINTS[key]&&Array.isArray(value)&&value.length===3&&value.every(Number.isFinite))this.points[key]={name:CHECKPOINTS[key].name,position:value};}}catch{}}
  setBiome(biome){if(CHECKPOINTS[biome])this.current=biome;return this.get();}
  setPosition(position,name){if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite))return false;this.points[this.current]={name:String(name||CHECKPOINTS[this.current].name),position:[...position]};this.save();return true;}
  get(){const point=this.points[this.current]||CHECKPOINTS.amazon;return {biome:this.current,name:point.name,position:[...point.position]};}
  respawn(){return [...this.get().position];}
  save(){try{this.storage?.setItem('capivara-checkpoints-v1',JSON.stringify(Object.fromEntries(Object.entries(this.points).map(([key,value])=>[key,value.position]))));return true;}catch{return false;}}
}

export class ExplorationHUD {
  constructor({canvas,staminaFill,staminaText,compass,mapPanel,saveStatus}={}){
    this.canvas=canvas;this.ctx=canvas?.getContext('2d');this.staminaFill=staminaFill;this.staminaText=staminaText;this.compass=compass;this.mapPanel=mapPanel;this.saveStatus=saveStatus;this.visible=true;this.lastDraw=0;
    this.resize();
    this.resizeHandler=()=>this.resize();globalThis.addEventListener?.('resize',this.resizeHandler);
  }
  resize(){if(!this.canvas)return;const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(globalThis.devicePixelRatio||1,2);this.canvas.width=Math.max(1,Math.round(rect.width*dpr));this.canvas.height=Math.max(1,Math.round(rect.height*dpr));this.ctx?.setTransform(dpr,0,0,dpr,0,0);}
  setStamina(state){if(this.staminaFill)this.staminaFill.style.width=(state.ratio*100).toFixed(1)+'%';if(this.staminaText)this.staminaText.textContent=state.exhausted?'SEM FÔLEGO':Math.ceil(state.value)+'%';}
  setSaveStatus(label,kind='saved'){if(!this.saveStatus)return;this.saveStatus.textContent=label;this.saveStatus.dataset.state=kind;}
  setMapVisible(visible){this.visible=Boolean(visible);this.mapPanel?.classList.toggle('hidden',!this.visible);}
  update({player,camera,points=[],heading=0,biome='amazon',force=false}={}){
    if(!this.ctx||!this.visible||!player)return;
    const now=performance.now();if(!force&&now-this.lastDraw<100)return;this.lastDraw=now;
    const ctx=this.ctx,w=this.canvas.clientWidth,h=this.canvas.clientHeight,cx=w/2,cy=h/2,r=Math.min(w,h)*.43;
    ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(cx,cy);
    ctx.fillStyle='#07170fe8';ctx.strokeStyle='#d7efb077';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.save();ctx.beginPath();ctx.arc(0,0,r-2,0,Math.PI*2);ctx.clip();
    ctx.strokeStyle='#d7efb02a';ctx.lineWidth=1;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r/2,-r);ctx.lineTo(i*r/2,r);ctx.stroke();ctx.beginPath();ctx.moveTo(-r,i*r/2);ctx.lineTo(r,i*r/2);ctx.stroke();}
    const px=THREELESS(player.position.x,-12,12,-r,r),pz=THREELESS(player.position.z,12,-82,-r,r);
    ctx.strokeStyle='#a9d6c0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.stroke();
    for(const point of points){const x=THREELESS(point.x,-12,12,-r,r),y=THREELESS(point.z,12,-82,-r,r);ctx.fillStyle=point.color||'#f4d36f';ctx.beginPath();ctx.arc(x,y,point.size||3.5,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,pz,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#244c38';ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
    ctx.fillStyle='#e9f2d9';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillText('N',0,-r+11);
    ctx.rotate(-heading);ctx.fillStyle='#f2c46b';ctx.beginPath();ctx.moveTo(0,-r+17);ctx.lineTo(-4,-r+25);ctx.lineTo(4,-r+25);ctx.closePath();ctx.fill();
    ctx.restore();
    if(this.compass)this.compass.textContent='BÚSSOLA · '+(biome==='glacial'?'NORTE GELADO':biome==='cerrado'?'VEREDAS':'FLORESTA')+' · '+Math.round(((heading%(Math.PI*2)+Math.PI*2)%(Math.PI*2))*180/Math.PI)+'°';
  }
  dispose(){globalThis.removeEventListener?.('resize',this.resizeHandler);this.ctx=null;}
}
function THREELESS(value,inMin,inMax,outMin,outMax){const t=Math.max(0,Math.min(1,(value-inMin)/(inMax-inMin)));return outMin+t*(outMax-outMin);}
