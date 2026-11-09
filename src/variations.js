import {validateDesign} from "./engine.js";
// Deterministic PRNG: repeatable variations for the same seed and base.
export function seededRandom(seed) {
  let s=seed>>>0;
  return ()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export function makeVariations(base,{seed=1,strength=0.2,locks={}}={}) {
  validateDesign(base);
  if(!Number.isFinite(strength)||strength<0||strength>1) throw new RangeError("strength must be 0..1");
  const random=seededRandom(seed);
  const fields=["radiusA","radiusB","speedA","speedB","phaseA","phaseB"];
  return Array.from({length:9},(_,index)=>{
    const design={...base};
    for(const key of fields) {
      const delta=(random()*2-1)*strength;
      if(locks[key]) continue;
      if(key.startsWith("radius")) design[key]=Math.max(0,base[key]*(1+delta));
      else if(key.startsWith("speed")) design[key]=base[key]+delta*3;
      else design[key]=base[key]+delta*Math.PI;
    }
    return {id:"v-"+seed+"-"+index,parentId:null,design};
  });
}
export function branch(parent,variation,id) {
  return {id,parentId:parent.id,design:{...variation.design},createdFrom:variation.id};
}
