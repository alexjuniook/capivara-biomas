export class AudioAmbience {
  constructor(){this.context=null;this.master=null;this.enabled=false;this.nodes=[];}
  start(){
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass)return false;
    if(!this.context){
      this.context=new AudioContextClass();
      this.master=this.context.createGain();this.master.gain.value=.12;this.master.connect(this.context.destination);
      const makeTone=(frequency,type,gain,detune=0)=>{
        const osc=this.context.createOscillator(),volume=this.context.createGain();
        osc.type=type;osc.frequency.value=frequency;osc.detune.value=detune;volume.gain.value=gain;
        osc.connect(volume);volume.connect(this.master);osc.start();this.nodes.push(osc,volume);
      };
      makeTone(174,'sine',.18);makeTone(261.6,'sine',.055,4);
      const buffer=this.context.createBuffer(1,this.context.sampleRate*2,this.context.sampleRate);
      const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.12;
      const noise=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),noiseGain=this.context.createGain();
      noise.buffer=buffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=850;noiseGain.gain.value=.12;
      noise.connect(filter);filter.connect(noiseGain);noiseGain.connect(this.master);noise.start();this.nodes.push(noise,filter,noiseGain);
    }
    this.context.resume();this.enabled=true;this.master.gain.setTargetAtTime(.12,this.context.currentTime,.15);return true;
  }
  toggle(){if(this.enabled){this.enabled=false;if(this.master)this.master.gain.setTargetAtTime(0,this.context.currentTime,.12);return false;}return this.start();}
  dispose(){if(this.context)this.context.close();this.nodes=[];this.context=null;this.enabled=false;}
}
