const STORAGE_KEY='capivara-survival-v1';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export class SurvivalSystems {
  constructor(storage=globalThis.localStorage){
    this.storage=storage;
    this.state={health:100,hunger:100,hydration:100,temperature:50,wetness:0,oxygen:100,staminaBonus:0,foodBuff:0,waterBuff:0,scareCooldown:0,dodgeCooldown:0,combo:0,comboTimer:0,discoveries:[],inventory:{fruits:0,crystals:0,seeds:0,wood:0},quests:{surviveDay:0,visitWater:false,findShelter:false},inWater:false,weather:'clear',biome:'amazon',lastHint:''};
    this.load();this.hud=globalThis.document?.querySelector('#survivalStatus')||null;this.lastHud=0;
  }
  load(){try{const saved=JSON.parse(this.storage?.getItem(STORAGE_KEY)||'{}');for(const key of ['health','hunger','hydration','temperature','wetness','oxygen','staminaBonus','foodBuff','waterBuff'])if(Number.isFinite(saved[key]))this.state[key]=clamp(saved[key],0,100);if(saved.inventory&&typeof saved.inventory==='object')for(const key of Object.keys(this.state.inventory))if(Number.isFinite(saved.inventory[key]))this.state.inventory[key]=Math.max(0,Math.floor(saved.inventory[key]));if(Array.isArray(saved.discoveries))this.state.discoveries=saved.discoveries.slice(0,100);}catch{}}
  save(){try{this.storage?.setItem(STORAGE_KEY,JSON.stringify({...this.state,updatedAt:Date.now()}));return true;}catch{return false;}}
  update(dt,{moving=false,running=false,weather='clear',biome='amazon',inWater=false}={}){
    const d=clamp(Number(dt)||0,0,.05),s=this.state;s.weather=weather;s.biome=biome;s.inWater=Boolean(inWater);
    s.hunger=clamp(s.hunger-(moving?.12:.055)*d,0,100);s.hydration=clamp(s.hydration-(running?.24:.085)*d,0,100);
    s.temperature=clamp(s.temperature+(biome==='glacial'?-1:biome==='cerrado'?.55:-.08)*d,0,100);
    s.wetness=clamp(s.wetness+(inWater?18:-2.2)*d,0,100);s.oxygen=clamp(s.oxygen+(inWater?-22:35)*d,0,100);
    s.scareCooldown=Math.max(0,s.scareCooldown-d);s.dodgeCooldown=Math.max(0,s.dodgeCooldown-d);s.comboTimer=Math.max(0,s.comboTimer-d);if(!s.comboTimer)s.combo=0;
    s.foodBuff=Math.max(0,s.foodBuff-d);s.waterBuff=Math.max(0,s.waterBuff-d);
    if(s.hunger<15||s.hydration<12||s.temperature<8||s.temperature>94)s.health=clamp(s.health-(8+(s.hydration<12?5:0))*d,0,100);
    if(s.inWater&&s.oxygen<=0)s.health=clamp(s.health-18*d,0,100);
    if(!s.inWater&&s.oxygen<100)s.oxygen=clamp(s.oxygen+35*d,0,100);
    if(s.foodBuff>0)s.health=clamp(s.health+1.8*d,0,100);
    if(!moving)s.health=clamp(s.health+.18*d,0,100);
    if(s.inWater)s.quests.visitWater=true;
    if(survivalDay(s))s.quests.surviveDay++;
  }
  consumeJump(){if(this.state.hunger<5||this.state.hydration<5)return false;this.state.hydration=Math.max(0,this.state.hydration-.15);return true;}
  useScare(){if(this.state.scareCooldown>0||this.state.hydration<3)return false;this.state.scareCooldown=2.2;this.state.hydration=Math.max(0,this.state.hydration-1.5);return true;}
  dodge(){if(this.state.dodgeCooldown>0||this.state.oxygen<10)return false;this.state.dodgeCooldown=1.4;this.state.oxygen=Math.max(0,this.state.oxygen-7);this.state.combo++;this.state.comboTimer=3;return true;}
  addItem(item,count=1){if(!(item in this.state.inventory))return false;this.state.inventory[item]=clamp(this.state.inventory[item]+Math.max(0,Math.floor(count)),0,999);this.save();return true;}
  eat(){if(this.state.inventory.fruits<1)return false;this.state.inventory.fruits--;this.state.hunger=clamp(this.state.hunger+35,0,100);this.state.foodBuff=20;this.state.health=clamp(this.state.health+8,0,100);this.save();return true;}
  drink(){if(this.state.hydration>82)return false;this.state.hydration=clamp(this.state.hydration+38,0,100);this.state.waterBuff=25;this.save();return true;}
  rest(){this.state.health=clamp(this.state.health+24,0,100);this.state.hunger=clamp(this.state.hunger-3,0,100);this.state.hydration=clamp(this.state.hydration-2,0,100);this.save();}
  discover(id){if(!id||this.state.discoveries.includes(id))return false;this.state.discoveries.push(id);this.save();return true;}
  renderHUD(){if(!this.hud)return;const now=performance.now();if(now-this.lastHud<350)return;this.lastHud=now;const s=this.state;this.hud.textContent='VIDA '+Math.ceil(s.health)+'% · FOME '+Math.ceil(s.hunger)+'% · ÁGUA '+Math.ceil(s.hydration)+'% · '+(s.inWater?'NADANDO · AR '+Math.ceil(s.oxygen)+'%':s.biome==='glacial'?'FRIO '+Math.ceil(100-s.temperature)+'%':'EXPLORAÇÃO');this.hud.dataset.danger=String(s.health<30||s.hydration<15||s.oxygen<20);}
}
function survivalDay(s){return s.hunger===0&&s.hydration===0;}
