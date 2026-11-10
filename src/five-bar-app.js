import {DEFAULT_FIVE_BAR,solveFiveBar,advanceFiveBar,scanMotorSeparation} from "./five-bar.js";
import {findLoopClosure} from "./loop-closure.js";
const $=id=>document.getElementById(id),NS="http://www.w3.org/2000/svg",RAD=Math.PI/180;
let d={...DEFAULT_FIVE_BAR,motorAX:-60,motorAY:0,motorBX:60,motorBY:0,crankA:30,crankB:36,couplerA:110,couplerB:110,angleA:120*RAD,angleB:60*RAD,speedA:1,speedB:-9/7},view="mechanism",playing=false,last=0,raf=0,drag=null,trace=[],blocked=false,simulationCache=null,revolutions=30,closeLoop=true;
const keys=[["motorAX","Motor A · X",-150,150,5],["motorAY","Motor A · Y",-120,120,5],["motorBX","Motor B · X",-150,150,5],["motorBY","Motor B · Y",-120,120,5],["crankA","Crank A",10,90,1],["crankB","Crank B",10,90,1],["couplerA","Coupler A",40,160,1],["couplerB","Coupler B",40,160,1],["speedA","Motor A speed",-6,6,.05],["speedB","Motor B speed",-6,6,.05],["angleA","Motor A angle",-180,180,1],["angleB","Motor B angle",-180,180,1]];
const node=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;};
const controls=$("controls");
for(const [key,label,min,max,step] of keys){const box=document.createElement("label"),span=document.createElement("span"),input=document.createElement("input");span.textContent=label;input.type="range";input.min=min;input.max=max;input.step=step;input.id=key;box.append(span,input);controls.append(box);}
function current(){return solveFiveBar(d);}
function change(patch){
 const start={...d},end={...d,...patch};
 const distance=Math.max(...Object.keys(patch).map(k=>Math.abs(end[k]-start[k])));
 const steps=Math.max(1,Math.ceil(distance/1));
 let accepted=start,hitLimit=false;
 for(let i=1;i<=steps;i++){
  const t=i/steps,candidate={...start};
  for(const key of Object.keys(patch))candidate[key]=start[key]+(end[key]-start[key])*t;
  const pose=solveFiveBar(candidate);
  if(!pose.reachable||pose.singular){hitLimit=true;break;}
  accepted=candidate;
 }
 d=accepted;blocked=hitLimit;trace=[];simulationCache=null;draw();return !hitLimit;
}
function updateAngles(a,b){const r=advanceFiveBar(d,d.angleA,d.angleB,a,b,{maxAngleStep:.008});d={...d,angleA:r.angleA,angleB:r.angleB};blocked=r.blocked;return r;}
function draw(){
 $("revolution-value").textContent=revolutions;
 $("revolutions").value=revolutions;
 $("close-loop").checked=closeLoop;
 for(const [key] of keys){const input=$(key);if(document.activeElement!==input)input.value=key.startsWith("angle")?Math.round(d[key]/RAD):d[key];}
 const p=current(),svg=$("machine");svg.replaceChildren();
 const line=(a,b,c,w)=>svg.append(node("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:c,"stroke-width":w,"stroke-linecap":"round"}));
 const circle=(q,c,r,handle)=>{
  if(!q)return;
  if(handle){const hit=node("circle",{cx:q.x,cy:q.y,r:24,fill:"transparent","data-handle":handle,style:"cursor:grab;touch-action:none"});svg.append(hit);}
  const e=node("circle",{cx:q.x,cy:q.y,r,fill:c,stroke:"#fff","stroke-width":2,"pointer-events":handle?"none":"auto"});
  svg.append(e);
};
 if(p.reachable){line(p.baseA,p.elbowA,"#16b5d1",4);line(p.elbowA,p.pen,"#16b5d1",3);line(p.baseB,p.elbowB,"#e2a352",4);line(p.elbowB,p.pen,"#e2a352",3);circle(p.pen,"#f05e77",14,"pen");}
 circle(p.baseA,"#16b5d1",13,"originA");circle(p.baseB,"#e2a352",13,"originB");
 circle(p.elbowA,"#16b5d1",12,"A");circle(p.elbowB,"#e2a352",12,"B");
 $("machine-panel").hidden=view==="art";
 $("machine-panel").classList.toggle("full",view==="mechanism");
 $("art-panel").hidden=view==="mechanism";
 $("art-panel").classList.toggle("full",view==="art");
 const paths=[];
 if(view==="live"&&trace.length>1)paths.push(trace);
 const result=view==="art"?simulate():null;
 if(result)paths.push(...result.paths);
 const art=$("art");art.replaceChildren();
 for(const path of paths){if(path.length<2)continue;art.append(node("path",{d:path.map((q,i)=>(i?"L":"M")+q.x.toFixed(3)+" "+q.y.toFixed(3)).join(" "),fill:"none",stroke:"#204d68","stroke-width":.55,"stroke-linejoin":"round","stroke-linecap":"round"}));}
 $("status").textContent=(blocked?"Movement stopped. ":"Linkage connected. ")+
  (view==="art"?"Preview: "+Math.round(result.coverage*100)+"% reachable over "+result.revolutions+" motor A revolutions. "+
    (result.closed&&result.complete?"Returned to start — closed SVG ready.":!result.closed?"Not closed within limit — adjust speed ratio or increase limit.":"Motion blocked — export disabled."):
   view==="live"?"Drawing actual pen trace.":"Drag pivots, elbows, or red pen.");
 $("export").disabled=view==="live"||(result&&(!result.complete||(closeLoop&&!result.closed)));
 $("fit").disabled=playing;
 return result;
}
function simulate(){
 const signature=JSON.stringify([d,revolutions,closeLoop]);
 if(simulationCache&&simulationCache.signature===signature)return simulationCache;
 // Revolutions are counted for motor A; the speed ratio determines how many
 // rotations motor B makes. This enables true multi-loop closed patterns.
 const speed=Math.abs(d.speedA);
 if(speed<.0001)return simulationCache={signature,paths:[],coverage:0,complete:false,closed:false,revolutions:0};
 const loop=findLoopClosure(d.speedA,d.speedB,revolutions);
 const turns=closeLoop?loop.revolutions:revolutions;
 const duration=2*Math.PI*turns/speed;
 const segments=Math.min(9000,Math.max(600,Math.ceil(
  90*turns*Math.max(1,Math.abs(d.speedB/d.speedA)))));
 const paths=[];let points=[],count=0,complete=true;
 let a=d.angleA,b=d.angleB;
 const first=solveFiveBar(d,a,b);
 if(!first.reachable||first.singular)return simulationCache={signature,paths:[],coverage:0,complete:false};
 points.push(first.pen);count++;
 for(let i=1;i<=segments;i++){
  const t=duration*i/segments,na=d.angleA+d.speedA*t,nb=d.angleB+d.speedB*t;
  const step=advanceFiveBar(d,a,b,na,nb,{maxAngleStep:.04});
  if(step.blocked){complete=false;break;}
  a=step.angleA;b=step.angleB;points.push(step.pose.pen);count++;
 }
 if(points.length>1)paths.push(points);
 const endPoint=points.at(-1),startPoint=points[0];
 const returned=Boolean(endPoint&&Math.hypot(endPoint.x-startPoint.x,endPoint.y-startPoint.y)<.001);
 const closed=loop.closed&&returned&&complete;
 return simulationCache={signature,paths,coverage:count/(segments+1),complete,closed,revolutions:turns};
}
function stop(){playing=false;cancelAnimationFrame(raf);$("play").textContent="Animate";last=0;}
function frame(now){
 if(!playing)return;
 if(last){
  const dt=Math.min((now-last)/1000,.05),r=updateAngles(d.angleA+d.speedA*dt*.5,d.angleB+d.speedB*dt*.5);
  if(r.blocked){stop();draw();return;}
  trace.push(r.pose.pen);if(trace.length>20000)trace.shift();
 }
 last=now;draw();raf=requestAnimationFrame(frame);
}
for(const [key] of keys)$(key).addEventListener("input",e=>{
 stop();const v=Number(e.target.value);
 if(key==="angleA"||key==="angleB"){updateAngles(key==="angleA"?v*RAD:d.angleA,key==="angleB"?v*RAD:d.angleB);trace=[];simulationCache=null;draw();}
 else {change({[key]:v});e.target.value=d[key];draw();}
});
// Inverse kinematics for dragging the shared pen: intersect each motor's
// crank circle with the circle of elbow locations around the requested pen.
function elbowAnglesForPen(target,motor,rCrank,rCoupler,currentAngle){
 const dx=target.x-motor.x,dy=target.y-motor.y,dist=Math.hypot(dx,dy);
 if(dist<1e-8||dist>rCrank+rCoupler||dist<Math.abs(rCrank-rCoupler))return [];
 const c=(rCrank*rCrank+dist*dist-rCoupler*rCoupler)/(2*rCrank*dist);
 if(c>1||c< -1)return [];
 const direction=Math.atan2(dy,dx),offset=Math.acos(Math.max(-1,Math.min(1,c)));
 return [direction+offset,direction-offset].map(angle=>currentAngle+Math.atan2(Math.sin(angle-currentAngle),Math.cos(angle-currentAngle)));
}
function dragPen(target){
 const from=solveFiveBar(d);if(!from.reachable)return;
 const travel=Math.hypot(target.x-from.pen.x,target.y-from.pen.y);
 const steps=Math.max(1,Math.ceil(travel/2));
 for(let k=1;k<=steps;k++){
 const aim={x:from.pen.x+(target.x-from.pen.x)*k/steps,y:from.pen.y+(target.y-from.pen.y)*k/steps};
 const aOptions=elbowAnglesForPen(aim,{x:d.motorAX,y:d.motorAY},d.crankA,d.couplerA,d.angleA);
 const bOptions=elbowAnglesForPen(aim,{x:d.motorBX,y:d.motorBY},d.crankB,d.couplerB,d.angleB);
 const candidates=[];
 for(const a of aOptions)for(const b of bOptions){
  const pose=solveFiveBar(d,a,b);
  if(!pose.reachable||pose.singular||Math.hypot(pose.pen.x-aim.x,pose.pen.y-aim.y)>.05)continue;
  candidates.push({a,b,score:Math.hypot(a-d.angleA,b-d.angleB)});
 }
 candidates.sort((a,b)=>a.score-b.score);
 let accepted=false;
 for(const candidate of candidates){
  const step=advanceFiveBar(d,d.angleA,d.angleB,candidate.a,candidate.b,{maxAngleStep:.006});
  if(step.accepted){d={...d,angleA:step.angleA,angleB:step.angleB};blocked=false;accepted=true;break;}
 }
 if(!accepted){blocked=true;return;}
 }
}
// iPad Safari: large physical touch targets, capture on the stable SVG element,
// and use screen-space hit testing instead of relying on tiny SVG circle targets.
const machine=$("machine");
machine.style.touchAction="none";
let activePointer=null,dragOffset={x:0,y:0};
function eventPoint(e){
 const matrix=machine.getScreenCTM();if(!matrix)return null;
 const point=machine.createSVGPoint();point.x=e.clientX;point.y=e.clientY;
 return point.matrixTransform(matrix.inverse());
}
function closestHandle(e){
 const pose=current();if(!pose.reachable)return null;
 const handles=[
  ["pen",pose.pen],["originA",pose.baseA],["originB",pose.baseB],
  ["A",pose.elbowA],["B",pose.elbowB]
 ];
 const matrix=machine.getScreenCTM();if(!matrix)return null;
 let best=null,dist=38;
 for(const [name,p] of handles){
  const pt=machine.createSVGPoint();pt.x=p.x;pt.y=p.y;
  const client=pt.matrixTransform(matrix);
  const delta=Math.hypot(client.x-e.clientX,client.y-e.clientY);
  if(delta<dist){best=name;dist=delta;}
 }
 return best;
}
function startDrag(e){
 if(activePointer!==null)return;
 const h=closestHandle(e);if(!h)return;
 stop();drag=h;activePointer=e.pointerId;
 try{machine.setPointerCapture(e.pointerId);}catch{}
 e.preventDefault();
 $("status").textContent="Dragging "+({originA:"Motor A origin",originB:"Motor B origin",A:"Arm A elbow",B:"Arm B elbow",pen:"shared pen"}[h])+" — move your finger.";
}
function moveDrag(e){
 if(drag===null||activePointer!==e.pointerId)return;
 const p=eventPoint(e);if(!p)return;
 e.preventDefault();
 if(drag==="originA"||drag==="originB"){
  const suffix=drag==="originA"?"A":"B";
  const xKey=suffix==="A"?"motorAX":"motorBX",yKey=suffix==="A"?"motorAY":"motorBY";
  change({[xKey]:Math.max(-150,Math.min(150,p.x)),[yKey]:Math.max(-120,Math.min(120,p.y))});
 }else if(drag==="pen"){
  dragPen(p);
 }else{
  const baseX=drag==="A"?d.motorAX:d.motorBX,baseY=drag==="A"?d.motorAY:d.motorBY;
  const angle=Math.atan2(p.y-baseY,p.x-baseX),old=drag==="A"?d.angleA:d.angleB;
  const delta=Math.atan2(Math.sin(angle-old),Math.cos(angle-old));
  updateAngles(d.angleA+(drag==="A"?delta:0),d.angleB+(drag==="B"?delta:0));
 }
 trace=[];draw();
}
function endDrag(e){
 if(activePointer!==null&&e.pointerId!==activePointer)return;
 drag=null;activePointer=null;simulationCache=null;draw();
}
machine.addEventListener("pointerdown",startDrag,{passive:false});
machine.addEventListener("pointermove",moveDrag,{passive:false});
machine.addEventListener("pointerup",endDrag);
machine.addEventListener("pointercancel",endDrag);
machine.addEventListener("lostpointercapture",endDrag);
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{view=b.dataset.view;document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x===b));draw();}));
const patterns={
 "5-7":{revolutions:5,speedA:1,speedB:-7/5},
 "7-9":{revolutions:7,speedA:1,speedB:-9/7},
 "11-13":{revolutions:11,speedA:1,speedB:-13/11},
 "13-17":{revolutions:13,speedA:1,speedB:-17/13}
};
$("close-loop").addEventListener("change",e=>{stop();closeLoop=e.target.checked;simulationCache=null;draw();});
$("revolutions").addEventListener("input",e=>{
 stop();revolutions=Number(e.target.value);simulationCache=null;draw();
});
document.querySelectorAll("[data-pattern]").forEach(b=>b.addEventListener("click",()=>{
 stop();const p=patterns[b.dataset.pattern];revolutions=p.revolutions;closeLoop=true;
 d={...d,speedA:p.speedA,speedB:p.speedB};trace=[];blocked=false;
 simulationCache=null;view="art";
 document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
 draw();
}));
document.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{stop();const settings=b.dataset.preset==="balanced"?{...DEFAULT_FIVE_BAR,motorAX:-60,motorAY:0,motorBX:60,motorBY:0,crankA:30,crankB:36,couplerA:110,couplerB:110,angleA:120*RAD,angleB:60*RAD,speedA:1,speedB:-9/7}:{...DEFAULT_FIVE_BAR,motorAX:-60,motorAY:0,motorBX:60,motorBY:0,crankA:28,crankB:49,couplerA:115,couplerB:105,angleA:120*RAD,angleB:60*RAD,speedA:1,speedB:-13/11};d=settings;revolutions=30;closeLoop=true;trace=[];blocked=false;simulationCache=null;draw();}));
$("play").addEventListener("click",()=>{if(playing){stop();return;}playing=true;last=0;trace=[];$("play").textContent="Pause";raf=requestAnimationFrame(frame);});
$("branch").addEventListener("click",()=>{stop();d={...d,branch:-d.branch};trace=[];simulationCache=null;draw();});
$("fit").addEventListener("click",()=>{stop();const scan=scanMotorSeparation(d,{min:60,max:200,step:5,segments:200});const mid=(d.motorAX+d.motorBX)/2;const candidate={...d,baseSeparation:scan.best.separation,motorAX:mid-scan.best.separation/2,motorBX:mid+scan.best.separation/2};if(solveFiveBar(candidate).reachable){d=candidate;trace=[];simulationCache=null;draw();}});
$("export").addEventListener("click",()=>{
 const result=simulate();if(!result.complete||(closeLoop&&!result.closed)){alert("The mechanism did not return to its starting configuration. Change the motor speed ratio or increase the revolution limit.");return;}
 const pts=result.paths.flat(),minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y));
 const w=210,h=297,margin=12,nib=.5,scale=Math.min((w-2*margin-nib)/Math.max(maxX-minX,1e-9),(h-2*margin-nib)/Math.max(maxY-minY,1e-9));
 const path=pts.map((p,i)=>(i?"L":"M")+(w/2+(p.x-(minX+maxX)/2)*scale).toFixed(3)+" "+(h/2+(p.y-(minY+maxY)/2)*scale).toFixed(3)).join(" ");
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297"><title>Mandala Motion Studio five-bar</title><path d="'+path+'" fill="none" stroke="#204d68" stroke-width="'+nib+'" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));const a=document.createElement("a");a.href=url;a.download="five-bar-art.svg";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
});
draw();
