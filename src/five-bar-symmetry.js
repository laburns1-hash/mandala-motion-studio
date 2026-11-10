// Five-bar symmetry and motion analysis. Works on actual solved pen paths.
import {sampleFiveBar,validateFiveBar} from "./five-bar.js";
function centroid(points){let x=0,y=0;for(const p of points){x+=p.x;y+=p.y;}return {x:x/points.length,y:y/points.length};}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
export function analyzeFiveBarSymmetry(d,{segments=1600,folds=[2,3,4,5,6,8,10,12],tolerance=0.035}={}){
 validateFiveBar(d);
 if(!Number.isFinite(tolerance)||tolerance<=0||tolerance>=1)throw new RangeError("Invalid tolerance");
 const result=sampleFiveBar(d,{segments});
 const points=result.paths.flat();
 if(points.length<30)return {classification:"insufficient-path",folds:[],coverage:points.length/result.samples,unreachable:result.unreachable,singular:result.singular};
 const center=centroid(points),radius=Math.max(...points.map(p=>dist(p,center)));
 if(radius<1e-9)return {classification:"degenerate",folds:[],coverage:points.length/result.samples,unreachable:result.unreachable,singular:result.singular};
 // Approximate Hausdorff-style nearest-neighbour test using a spatial hash.
 const cell=Math.max(radius*tolerance,1e-6),grid=new Map();
 const key=(x,y)=>x+","+y;
 for(const p of points){const ix=Math.floor(p.x/cell),iy=Math.floor(p.y/cell),k=key(ix,iy);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(p);}
 const scores=[];
 for(const n of folds){
  if(!Number.isInteger(n)||n<2||n>36)throw new RangeError("folds must be integers 2..36");
  const angle=2*Math.PI/n,cs=Math.cos(angle),sn=Math.sin(angle);
  let hits=0;
  for(const p of points){
   const x=p.x-center.x,y=p.y-center.y,rx=center.x+x*cs-y*sn,ry=center.y+x*sn+y*cs;
   const ix=Math.floor(rx/cell),iy=Math.floor(ry/cell);
   let found=false;
   for(let dx=-1;dx<=1&&!found;dx++)for(let dy=-1;dy<=1&&!found;dy++){
    for(const q of grid.get(key(ix+dx,iy+dy))??[]){if(Math.hypot(q.x-rx,q.y-ry)<=cell){found=true;break;}}
   }
   if(found)hits++;
  }
  scores.push({fold:n,match:hits/points.length});
 }
 scores.sort((a,b)=>b.match-a.match);
 return {classification:scores[0].match>=0.9?"approximately-rotational":"asymmetric-or-incomplete",folds:scores,coverage:points.length/result.samples,unreachable:result.unreachable,singular:result.singular};
}
export const FIVE_BAR_PRESETS=Object.freeze([
 {id:"balanced",name:"Balanced arms",description:"Matched arm lengths with counter-rotating drives; candidate for symmetric paths",settings:{baseSeparation:120,crankA:45,crankB:45,couplerA:100,couplerB:100,angleA:2.1,angleB:1.04,speedA:2,speedB:-2,phaseA:0,phaseB:0,branch:1}},
 {id:"offset",name:"Offset arms",description:"Unequal crank and coupler lengths for asymmetric exploration",settings:{baseSeparation:120,crankA:32,crankB:52,couplerA:110,couplerB:95,angleA:2.1,angleB:1.04,speedA:2,speedB:-3,phaseA:0,phaseB:0,branch:1}},
 {id:"slow-drift",name:"Slow drift",description:"Close but unequal speeds, producing slowly changing relationships",settings:{baseSeparation:120,crankA:45,crankB:45,couplerA:100,couplerB:100,angleA:2.1,angleB:1.04,speedA:2,speedB:-2.07,phaseA:0,phaseB:0,branch:1}}
]);
