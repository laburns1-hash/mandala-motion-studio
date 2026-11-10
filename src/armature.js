// Interactive vector armature: drag endpoints to set rotor radius and phase.
// SVG coordinate system is a visual editor, not a claim of mechanical feasibility.
import {pointAt} from "./engine.js";
const NS="http://www.w3.org/2000/svg";
const el=(name,attrs={})=>{const n=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
export function mountArmature(svg,getDesign,onChange){
  svg.setAttribute("viewBox","-110 -110 220 220");
  svg.setAttribute("role","img");
  svg.setAttribute("aria-label","Drag either rotor endpoint to change arm length and initial angle");
  svg.style.touchAction="none";
  let active=null;
  function paint(){
    const d=getDesign();
    svg.replaceChildren();
    svg.append(el("circle",{cx:0,cy:0,r:100,fill:"none",stroke:"#506879","stroke-dasharray":"3 5"}));
    svg.append(el("line",{x1:-105,y1:0,x2:105,y2:0,stroke:"#506879","stroke-opacity":".5"}));
    svg.append(el("line",{x1:0,y1:-105,x2:0,y2:105,stroke:"#506879","stroke-opacity":".5"}));
    const a=pointAt({...d,radiusB:0},0);
    const b={x:a.x+d.radiusB*Math.cos(d.phaseB),y:a.y+d.radiusB*Math.sin(d.phaseB)};
    const max=Math.max(d.radiusA+d.radiusB,1);
    const scale=90/max;
    const ax=a.x*scale,ay=a.y*scale,bx=b.x*scale,by=b.y*scale;
    svg.append(el("line",{x1:0,y1:0,x2:ax,y2:ay,stroke:"#2bbbd2","stroke-width":3,"stroke-linecap":"round"}));
    svg.append(el("line",{x1:ax,y1:ay,x2:bx,y2:by,stroke:"#f2b25f","stroke-width":3,"stroke-linecap":"round"}));
    svg.append(el("circle",{cx:0,cy:0,r:4,fill:"#e9f2fa"}));
    for(const [name,x,y,color] of [["A",ax,ay,"#2bbbd2"],["B",bx,by,"#f2b25f"]]){
      const h=el("circle",{cx:x,cy:y,r:9,fill:color,stroke:"#fff","stroke-width":1.5,tabindex:0,"aria-label":"Drag rotor "+name});
      h.dataset.arm=name;h.style.cursor="grab";svg.append(h);
    }
  }
  function local(event){
    const rect=svg.getBoundingClientRect();
    const x=((event.clientX-rect.left)/rect.width)*220-110;
    const y=((event.clientY-rect.top)/rect.height)*220-110;
    return {x,y};
  }
  function move(e){
    if(!active)return;
    const d=getDesign(),p=local(e),scale=90/Math.max(d.radiusA+d.radiusB,1);
    if(active==="A"){
      const r=Math.hypot(p.x,p.y)/scale;
      onChange({radiusA:Math.min(100,Math.max(0,r)),phaseA:Math.atan2(p.y,p.x)});
    }else{
      const ax=d.radiusA*Math.cos(d.phaseA)*scale,ay=d.radiusA*Math.sin(d.phaseA)*scale;
      const dx=p.x-ax,dy=p.y-ay;
      onChange({radiusB:Math.min(100,Math.max(0,Math.hypot(dx,dy)/scale)),phaseB:Math.atan2(dy,dx)});
    }
    paint();
  }
  svg.addEventListener("pointerdown",e=>{
    const arm=e.target?.dataset?.arm;if(!arm)return;
    active=arm;svg.setPointerCapture(e.pointerId);e.preventDefault();
  });
  svg.addEventListener("pointermove",move);
  svg.addEventListener("pointerup",()=>{active=null;});
  svg.addEventListener("pointercancel",()=>{active=null;});
  paint();
  return paint;
}
