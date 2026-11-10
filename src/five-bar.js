// Five-bar linkage with two fixed motor pivots, two cranks, two couplers, one pen.
// Lengths are millimetres; motor angles are radians. No third-party code.
const EPS=1e-9;
export const DEFAULT_FIVE_BAR=Object.freeze({
  baseSeparation:120, crankA:45, crankB:45, couplerA:100, couplerB:100,
  angleA:2.1, angleB:1.04, speedA:2, speedB:-3, phaseA:0, phaseB:0,
  branch:1, motorAX:-60, motorAY:0, motorBX:60, motorBY:0
});
function positive(x,name){if(typeof x!=="number"||!Number.isFinite(x)||x<=0)throw new RangeError(name+" must be positive");}
export function validateFiveBar(d){
 for(const key of ["baseSeparation","crankA","crankB","couplerA","couplerB"])positive(d[key],key);
 for(const key of ["angleA","angleB","speedA","speedB","phaseA","phaseB","motorAX","motorAY","motorBX","motorBY"])if(typeof d[key]!=="number"||!Number.isFinite(d[key]))throw new RangeError(key+" must be finite");
 if(d.branch!==1&&d.branch!==-1)throw new RangeError("branch must be +1 or -1");
 return d;
}
export function solveFiveBar(d,thetaA=d.angleA,thetaB=d.angleB,branch=d.branch){
 validateFiveBar(d);
 if(!Number.isFinite(thetaA)||!Number.isFinite(thetaB)||![1,-1].includes(branch))throw new RangeError("Invalid joint angles or branch");
 const baseA={x:d.motorAX??-d.baseSeparation/2,y:d.motorAY??0},baseB={x:d.motorBX??d.baseSeparation/2,y:d.motorBY??0};
 const elbowA={x:baseA.x+d.crankA*Math.cos(thetaA),y:baseA.y+d.crankA*Math.sin(thetaA)};
 const elbowB={x:baseB.x+d.crankB*Math.cos(thetaB),y:baseB.y+d.crankB*Math.sin(thetaB)};
 const dx=elbowB.x-elbowA.x,dy=elbowB.y-elbowA.y,distance=Math.hypot(dx,dy);
 const rA=d.couplerA,rB=d.couplerB;
 const geometry={baseA,baseB,elbowA,elbowB,thetaA,thetaB};
 if(distance<EPS)return {reachable:false,reason:Math.abs(rA-rB)<EPS?"coincident-circles":"concentric-no-intersection",...geometry};
 if(distance>rA+rB+EPS)return {reachable:false,reason:"too-far",...geometry};
 if(distance<Math.abs(rA-rB)-EPS)return {reachable:false,reason:"one-circle-inside-other",...geometry};
 const along=(rA*rA-rB*rB+distance*distance)/(2*distance);
 const h2=rA*rA-along*along;
 if(h2 < -EPS*Math.max(1,rA*rA))return {reachable:false,reason:"no-real-intersection",...geometry};
 const h=Math.sqrt(Math.max(0,h2)),ux=dx/distance,uy=dy/distance;
 const midX=elbowA.x+along*ux,midY=elbowA.y+along*uy;
 const pen={x:midX-branch*h*uy,y:midY+branch*h*ux};
 return {reachable:true,pen,branch,singular:h<EPS,...geometry};
}
export function sampleFiveBar(d,{duration=2*Math.PI,segments=2400}={}){
 validateFiveBar(d);
 if(!Number.isFinite(duration)||duration<=0||!Number.isInteger(segments)||segments<2||segments>200000)throw new RangeError("Invalid sampling");
 const paths=[];let current=[],unreachable=0,singular=0;
 for(let i=0;i<=segments;i++){
  const t=duration*i/segments;
  const a=d.angleA+d.phaseA+d.speedA*t,b=d.angleB+d.phaseB+d.speedB*t;
  const result=solveFiveBar(d,a,b);
  if(result.reachable&&!result.singular){current.push(result.pen);}
  else{if(current.length>1)paths.push(current);current=[];if(!result.reachable)unreachable++;else singular++;}
 }
 if(current.length>1)paths.push(current);
 return {paths,unreachable,singular,samples:segments+1};
}

/**
 * Advance both motors together, never accepting a disconnected pen pose.
 * A segment is checked in increments to avoid jumping across an invalid region.
 * Returns the last reachable pose and a blocked flag. This is a kinematic
 * constraint, not a full collision/velocity/torque model.
 */
export function advanceFiveBar(d,fromA,fromB,toA,toB,{maxAngleStep=0.01,clearance=1e-6}={}){
 validateFiveBar(d);
 for(const x of [fromA,fromB,toA,toB,maxAngleStep,clearance])if(!Number.isFinite(x))throw new RangeError("Nonfinite motion parameter");
 if(maxAngleStep<=0||clearance<0)throw new RangeError("Invalid motion limits");
 const valid=s=>s.reachable&&!s.singular&&Math.hypot(s.elbowB.x-s.elbowA.x,s.elbowB.y-s.elbowA.y)>clearance;
 let last=solveFiveBar(d,fromA,fromB);
 if(!valid(last))return {accepted:false,blocked:true,reason:"invalid-start",angleA:fromA,angleB:fromB,pose:last};
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(toA-fromA),Math.abs(toB-fromB))/maxAngleStep));
 if(steps>200000)throw new RangeError("Motion requires too many steps");
 for(let i=1;i<=steps;i++){
  const fraction=i/steps,a=fromA+(toA-fromA)*fraction,b=fromB+(toB-fromB)*fraction;
  const next=solveFiveBar(d,a,b);
  if(!valid(next)){
   return {accepted:false,blocked:true,reason:next.reason??"singularity",angleA:last.thetaA,angleB:last.thetaB,pose:last};
  }
  last=next;
 }
 return {accepted:true,blocked:false,angleA:toA,angleB:toB,pose:last};
}

/** Estimate usable motor separation for a specified motion, without assuming
 * that a wider base is always better. Scores are the proportion of sampled
 * motor poses that remain reachable and nonsingular. */
export function scanMotorSeparation(d,{min=60,max=200,step=5,duration=2*Math.PI,segments=240}={}){
 validateFiveBar(d);
 if(![min,max,step,duration].every(Number.isFinite)||min<=0||max<min||step<=0||duration<=0||!Number.isInteger(segments)||segments<2||segments>20000)throw new RangeError("Invalid separation scan");
 const count=Math.floor((max-min)/step)+1;
 if(count>2000)throw new RangeError("Too many separation candidates");
 const results=[];
 for(let j=0;j<count;j++){
  const separation=min+j*step;
  const mid=((d.motorAX??-d.baseSeparation/2)+(d.motorBX??d.baseSeparation/2))/2;
  const candidate={...d,baseSeparation:separation,motorAX:mid-separation/2,motorBX:mid+separation/2};
  let reachable=0,singular=0;
  for(let i=0;i<=segments;i++){
   const t=duration*i/segments;
   const p=solveFiveBar(candidate,d.angleA+d.phaseA+d.speedA*t,d.angleB+d.phaseB+d.speedB*t);
   if(p.reachable&&!p.singular)reachable++;
   if(p.singular)singular++;
  }
  results.push({separation,coverage:reachable/(segments+1),singular});
 }
 results.sort((a,b)=>b.coverage-a.coverage||a.singular-b.singular||Math.abs(a.separation-d.baseSeparation)-Math.abs(b.separation-d.baseSeparation));
 return {best:results[0],candidates:results};
}
