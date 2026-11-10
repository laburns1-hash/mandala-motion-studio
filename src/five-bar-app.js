import {DEFAULT_FIVE_BAR,solveFiveBar,advanceFiveBar,scanMotorSeparation} from "./five-bar.js";
const $=id=>document.getElementById(id),NS="http://www.w3.org/2000/svg",RAD=Math.PI/180;
let d={...DEFAULT_FIVE_BAR,angleA:120*RAD,angleB:60*RAD,speedB:-2},view="mechanism",playing=false,last=0,raf=0,drag=null,trace=[],blocked=false;
const keys=[["motorAX","Motor A · X",-150,150,5],["motorAY","Motor A · Y",-120,120,5],["motorBX","Motor B · X",-150,150,5],["motorBY","Motor B · Y",-120,120,5],["crankA","Crank A",10,90,1],["crankB","Crank B",10,90,1],["couplerA","Coupler A",40,160,1],["couplerB","Coupler B",40,160,1],["speedA","Motor A speed",-6,6,.05],["speedB","Motor B speed",-6,6,.05],["angleA","Motor A angle",-180,180,1],["angleB","Motor B angle",-180,180,1]];
const node=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;};
const controls=$("controls");
for(const [key,label,min,max,step] of keys){const box=document.createElement("label"),span=document.createElement("span"),input=document.createElement("input");span.textContent=label;input.type="range";input.min=min;input.max=max;input.step=step;input.id=key;box.append(span,input);controls.append(box);}
function current(){return solveFiveBar(d);}
function change(patch){const next={...d,...patch};const pose=solveFiveBar(next);if(!pose.reachable||pose.singular){blocked=true;return false;}d=next;blocked=false;trace=[];draw();return true;}
function updateAngles(a,b){const r=advanceFiveBar(d,d.angleA,d.angleB,a,b,{maxAngleStep:.008});d={...d,angleA:r.angleA,angleB:r.angleB};blocked=r.blocked;return r;}
function draw(){
 for(const [key] of keys){const input=$(key);if(document.activeElement!==input)input.value=key.startsWith("angle")?Math.round(d[key]/RAD):d[key];}
 const p=current(),svg=$("machine");svg.replaceChildren();
 const line=(a,b,c,w)=>svg.append(node("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:c,"stroke-width":w,"stroke-linecap":"round"}));
 const circle=(q,c,r,handle)=>{const e=node("circle",{cx:q.x,cy:q.y,r,fill:c,stroke:"#fff","stroke-width":1.3});if(handle)e.dataset.handle=handle;svg.append(e);};
 if(p.reachable){line(p.baseA,p.elbowA,"#16b5d1",4);line(p.elbowA,p.pen,"#16b5d1",3);line(p.baseB,p.elbowB,"#e2a352",4);line(p.elbowB,p.pen,"#e2a352",3);circle(p.pen,"#f05e77",6);}
 circle(p.baseA,"#16b5d1",5);circle(p.baseB,"#e2a352",5);circle(p.elbowA,"#16b5d1",10,"A");circle(p.elbowB,"#e2a352",10,"B");
 $("machine-panel").hidden=view==="art";$("art-panel").classList.toggle("full",view==="art");
 const paths=trace.length>1?[trace]:[];
 const result=simulate();
 if(view!=="mechanism")paths.push(...result.paths);
 const art=$("art");art.replaceChildren();
 for(const path of paths){if(path.length<2)continue;art.append(node("path",{d:path.map((q,i)=>(i?"L":"M")+q.x.toFixed(3)+" "+q.y.toFixed(3)).join(" "),fill:"none",stroke:"#204d68","stroke-width":.55,"stroke-linejoin":"round","stroke-linecap":"round"}));}
 $("status").textContent=(blocked?"Motion stopped at reachability boundary. ":"Arms connected. ")+
  (view==="live"?"Live pen trace. ":"")+
  "Full planned trajectory: "+Math.round(result.coverage*100)+"% reachable. "+
  (result.complete?"Complete path.":"Incomplete — export disabled.");
 $("export").disabled=!result.complete||view==="live";
 $("fit").disabled=playing;
 return result;
}
function simulate(){
 const duration=2*Math.PI,segments=1200,paths=[];let points=[],count=0,complete=true;
 let a=d.angleA,b=d.angleB;
 const first=solveFiveBar(d,a,b);
 if(!first.reachable||first.singular)return {paths:[],coverage:0,complete:false};
 points.push(first.pen);count++;
 for(let i=1;i<=segments;i++){
  const t=duration*i/segments,na=d.angleA+d.speedA*t,nb=d.angleB+d.speedB*t;
  const step=advanceFiveBar(d,a,b,na,nb,{maxAngleStep:.02});
  if(step.blocked){complete=false;break;}
  a=step.angleA;b=step.angleB;points.push(step.pose.pen);count++;
 }
 if(points.length>1)paths.push(points);
 return {paths,coverage:count/(segments+1),complete};
}
function stop(){playing=false;cancelAnimationFrame(raf);$("play").textContent="Animate";}
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
 if(key==="angleA"||key==="angleB"){updateAngles(key==="angleA"?v*RAD:d.angleA,key==="angleB"?v*RAD:d.angleB);trace=[];draw();}
 else if(!change({[key]:v})){e.target.value=d[key];draw();}
});
$("machine").addEventListener("pointerdown",e=>{const h=e.target.dataset.handle;if(!h)return;stop();drag=h;$("machine").setPointerCapture(e.pointerId);e.preventDefault();});
$("machine").addEventListener("pointermove",e=>{
 if(!drag)return;const svg=$("machine"),point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;
 const matrix=svg.getScreenCTM();if(!matrix)return;const p=point.matrixTransform(matrix.inverse()),base=drag==="A"?-d.baseSeparation/2:d.baseSeparation/2;
 const angle=Math.atan2(p.y-baseY,p.x-base);const old=drag==="A"?d.angleA:d.angleB;
 const delta=Math.atan2(Math.sin(angle-old),Math.cos(angle-old));
 updateAngles(d.angleA+(drag==="A"?delta:0),d.angleB+(drag==="B"?delta:0));trace=[];draw();
});
$("machine").addEventListener("pointerup",()=>drag=null);$("machine").addEventListener("pointercancel",()=>drag=null);
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{view=b.dataset.view;document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x===b));draw();}));
document.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{stop();const settings=b.dataset.preset==="balanced"?{...DEFAULT_FIVE_BAR,angleA:120*RAD,angleB:60*RAD,speedA:2,speedB:-2}:{...DEFAULT_FIVE_BAR,crankA:32,crankB:55,couplerA:110,couplerB:95,angleA:120*RAD,angleB:60*RAD,speedA:2.2,speedB:-3.4};d=settings;trace=[];blocked=false;draw();}));
$("play").addEventListener("click",()=>{if(playing){stop();return;}playing=true;last=0;trace=[];$("play").textContent="Pause";raf=requestAnimationFrame(frame);});
$("branch").addEventListener("click",()=>{stop();d={...d,branch:-d.branch};trace=[];draw();});
$("fit").addEventListener("click",()=>{stop();const scan=scanMotorSeparation(d,{min:60,max:200,step:5,segments:200});const mid=(d.motorAX+d.motorBX)/2;const candidate={...d,baseSeparation:scan.best.separation,motorAX:mid-scan.best.separation/2,motorBX:mid+scan.best.separation/2};if(solveFiveBar(candidate).reachable){d=candidate;trace=[];draw();}});
$("export").addEventListener("click",()=>{
 const result=simulate();if(!result.complete){alert("Incomplete trajectory cannot be exported as a continuous drawing.");return;}
 const pts=result.paths.flat(),minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y));
 const w=210,h=297,margin=12,nib=.5,scale=Math.min((w-2*margin-nib)/Math.max(maxX-minX,1e-9),(h-2*margin-nib)/Math.max(maxY-minY,1e-9));
 const path=pts.map((p,i)=>(i?"L":"M")+(w/2+(p.x-(minX+maxX)/2)*scale).toFixed(3)+" "+(h/2+(p.y-(minY+maxY)/2)*scale).toFixed(3)).join(" ");
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297"><title>Mandala Motion Studio five-bar</title><path d="'+path+'" fill="none" stroke="#204d68" stroke-width="'+nib+'" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));const a=document.createElement("a");a.href=url;a.download="five-bar-art.svg";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
});
draw();
