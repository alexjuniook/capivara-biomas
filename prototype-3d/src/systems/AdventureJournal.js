const STORAGE_KEY='capivara-adventure-journal-v1';
const ACHIEVEMENTS=[
  ['first_fruit','Primeiro sabor','Encontre seu primeiro fruto','fruit',1],
  ['fruit_master','Banquete da floresta','Encontre os oito frutos','fruit',8],
  ['first_friend','Novos amigos','Converse pela primeira vez','talk',1],
  ['tico_friend','Segredo revelado','Converse com Tico','tico',1],
  ['portal_open','Entre mundos','Desperte o portal ancestral','portal',1],
  ['ice_arrival','Frio na barriga','Chegue à Era Glacial','glacial',1],
  ['first_crystal','Luz no gelo','Encontre um cristal azul','crystal',1],
  ['crystal_master','Guardião do vale','Reúna os cinco cristais','crystal',5],
  ['mammoth_rescue','Família reunida','Ajude o filhote de mamute','mammoth',1],
  ['ice_complete','Vale protegido','Conclua as missões glaciais','iceComplete',1],
  ['first_seed','Semente de esperança','Encontre uma semente dourada','seed',1],
  ['seed_master','Vereda renascida','Reúna as cinco sementes','seed',5],
  ['anteater_friend','Amigo do tamanduá','Ajude o tamanduá-bandeira','anteater',1],
  ['guara_sighting','Passos do Cerrado','Observe o lobo-guará','guara',1],
  ['seriema_sighting','Corrida elegante','Observe a seriema','seriema',1],
  ['tatu_sighting','Engenheiro da terra','Observe o tatu-canastra','tatu',1],
  ['naturalist','Naturalista','Registre os três animais do Cerrado','fauna',3],
  ['three_eras','Três eras, uma jornada','Visite os três biomas','biomes',3],
  ['storm_watcher','Olhos na tempestade','Presencie uma tempestade','storm',1],
  ['long_journey','Explorador persistente','Explore por vinte minutos','minutes',20]
];

export class AdventureJournal {
  constructor(storage=globalThis.localStorage){
    this.storage=storage;this.counts={};this.unlocked=[];this.minutes=0;this.biomes=[];this.saveTimer=0;
    this.load();
  }
  load(){
    try{
      const saved=JSON.parse(this.storage?.getItem(STORAGE_KEY)||'{}');
      this.counts=saved.counts&&typeof saved.counts==='object'?saved.counts:{};
      this.unlocked=Array.isArray(saved.unlocked)?saved.unlocked.filter(id=>ACHIEVEMENTS.some(item=>item[0]===id)):[];
      this.minutes=Number.isFinite(saved.minutes)?Math.max(0,saved.minutes):0;
      this.biomes=Array.isArray(saved.biomes)?saved.biomes.filter(x=>['amazon','glacial','cerrado'].includes(x)):[];
    }catch{this.counts={};this.unlocked=[];this.minutes=0;this.biomes=[];}
  }
  save(){
    try{this.storage?.setItem(STORAGE_KEY,JSON.stringify({counts:this.counts,unlocked:this.unlocked,minutes:this.minutes,biomes:this.biomes}));return true;}
    catch{return false;}
  }
  record(event,amount=1){
    if(!event)return [];
    this.counts[event]=Math.max(0,Number(this.counts[event])||0)+Math.max(0,Number(amount)||0);
    const unlocked=this.#check();this.save();return unlocked;
  }
  visitBiome(biome){
    if(['amazon','glacial','cerrado'].includes(biome)&&!this.biomes.includes(biome))this.biomes.push(biome);
    this.save();return this.#check();
  }
  tick(dt,{weather='clear'}={}){
    if(Number.isFinite(dt)&&dt>0){this.minutes+=dt/60;this.saveTimer+=dt;}
    if(weather==='storm'&&!this.unlocked.includes('storm_watcher'))this.counts.storm=1;
    const unlocked=this.#check();
    if(this.saveTimer>=10){this.saveTimer=0;this.save();}
    return unlocked;
  }
  #check(){
    const newly=[];
    for(const [id,, ,event,goal] of ACHIEVEMENTS){
      let value=event==='minutes'?this.minutes:event==='biomes'?this.biomes.length:Number(this.counts[event])||0;
      if(value>=goal&&!this.unlocked.includes(id)){this.unlocked.push(id);newly.push(id);}
    }
    if(newly.length)this.save();
    return newly;
  }
  getUnlocked(){return this.getAll().filter(item=>item.unlocked);}
  getAll(){return ACHIEVEMENTS.map(([id,title,description,event,goal])=>({id,title,description,goal,unlocked:this.unlocked.includes(id),progress:Math.min(goal,event==='minutes'?this.minutes:event==='biomes'?this.biomes.length:Number(this.counts[event])||0)}));}
  getSummary(){return {unlocked:this.unlocked.length,total:ACHIEVEMENTS.length,minutes:Math.floor(this.minutes),biomes:[...this.biomes]};}
}
