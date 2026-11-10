const KEY='capivara-game-settings-v1';
const DEFAULTS={quality:'auto',showHud:true,showFps:false,cameraMode:'thirdPerson',soundEnabled:false};
export class GameSettings{
  load(){try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return {...DEFAULTS,...value};}catch{return {...DEFAULTS};}}
  save(value){try{localStorage.setItem(KEY,JSON.stringify({...DEFAULTS,...value}));return true;}catch{return false;}}
}
export const QUALITY={
  low:{pixelRatio:.72,shadows:false,shadowSize:512,visuals:.42},
  medium:{pixelRatio:.9,shadows:true,shadowSize:1024,visuals:.68},
  high:{pixelRatio:1.25,shadows:true,shadowSize:2048,visuals:1},
  auto:{pixelRatio:1,shadows:true,shadowSize:1024,visuals:.75}
};
