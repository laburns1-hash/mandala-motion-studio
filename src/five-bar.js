// Five-bar linkage with two fixed motor pivots, two cranks, two couplers, one pen.
// Lengths are millimetres; motor angles are radians. No third-party code.
const EPS=1e-9;
export const DEFAULT_FIVE_BAR=Object.freeze({
  baseSeparation:120, crankA:45, crankB:45, couplerA:100, couplerB:100,
  angleA:2.1, angleB:1.04, speedA:2, speedB:-3, phaseA:0, phaseB:0,
  branch:1
});
function positive(x,name){if(typeof x!=="number"||!Number.isFinite(x)||x<=0)throw new RangeError(name+" must be positive");}
export function validateFiveBar(d){
 for(const key of ["baseSeparation","crankA","crankB","couplerA","couplerB"])positive(d[key],key);
 for(const key of ["angleA","angleB","speedA","speedB","phaseA","phaseB"])if(typeof d[key]!=="number"||!Number.isFinite(d[key]))throw new RangeError(key+" must be finite");
 if(d.branch!==1&&d.branch!==-1)throw new RangeError("branch must be +1 or -1");
 return d;
}
export function solveFiveBar(d,thetaA=d.angleA,thetaB=d.angleB,branch=d.branch){
 validateFiveBar(d);
 if(!Number.isFinite(thetaA)||!Number.isFinite(thetaB)||![1,-1].includes(branch))throw new RangeError("Invalid joint angles or branch");
 const baseA={x:-d.baseSeparation/2,y:0},baseB={x:d.baseSeparation/2,y:0};
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
