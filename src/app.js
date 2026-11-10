import {DEFAULT_DESIGN,samplePath,fitToPaper,pathData,exportSVG,serializeProject,deserializeProject} from "./engine.js";
import {makeVariations} from "./variations.js";
import {mountArmature} from "./armature.js";
import {rotorClosure} from "./curve-families.js";
let design={...DEFAULT_DESIGN},history=[],variants=[],selected=-1,seed=1;
let refreshArmature=()=>{};
const $=id=>document.getElementById(id);
const fields=[
["radiusA","Rotor A radius (mm)",0,100,1],["radiusB","Rotor B radius (mm)",0,100,1],
["speedA","Rotor A speed",-30,30,0.05],["speedB","Rotor B speed",-30,30,0.05],
["phaseA","Rotor A phase (rad)",-6.28,6.28,0.05],["phaseB","Rotor B phase (rad)",-6.28,6.28,0.05],
["cycles","Exposure cycles",0.1,20,0.1]
];
const physical=[
["paperWidthMm","Paper width (mm)",50,1200,1],["paperHeightMm","Paper height (mm)",50,1200,1],
["marginMm","Margin (mm)",0,100,1],["nibMm","Nib diameter (mm)",0.05,10,0.05]
];
function addControls(target,list){
  for(const [key,label,min,max,step] of list){
    const wrap=document.createElement("div"),l=document.createElement("label"),input=document.createElement("input");
    l.htmlFor=key;l.textContent=label;input.id=key;input.type="number";input.min=min;input.max=max;input.step=step;
    input.value=design[key];input.addEventListener("change",()=>{
      const next=Number(input.value);const old=design[key];design[key]=next;
      try{render()}catch(e){design[key]=old;input.value=old;alert(e.message);}
    });wrap.append(l,input);target.append(wrap);
  }
}
addControls($("controls"),fields);addControls($("paper"),physical);
function updateInputs(){for(const [key] of [...fields,...physical]) $(key).value=design[key];}
function makeSVG(d,thumb=false){
  const points=fitToPaper(samplePath(d,{maxStepMm:thumb?0.5:0.18,maxSegments:thumb?2200:30000}),d);
  const s=document.createElementNS("http://www.w3.org/2000/svg","svg");
  s.setAttribute("viewBox",`0 0 ${d.paperWidthMm} ${d.paperHeightMm}`);
  s.setAttribute("preserveAspectRatio","xMidYMid meet");
  const path=document.createElementNS("http://www.w3.org/2000/svg","path");
  path.setAttribute("d",pathData(points,2));path.setAttribute("fill","none");path.setAttribute("stroke",d.color);
  path.setAttribute("stroke-width",d.nibMm);path.setAttribute("stroke-linejoin","round");
  s.append(path);return s;
}
function render(){
  const svg=makeSVG(design);$("canvas").replaceChildren(...svg.childNodes);
  $("canvas").setAttribute("viewBox",svg.getAttribute("viewBox"));
  $("back").disabled=!history.length;
  refreshArmature();
  const closure=rotorClosure(design.speedA,design.speedB);
  $("status").textContent="Mechanical feasibility: unverified. Rotor closure: "+(closure.closed?(closure.turns===0?"stationary":"approximately "+Number(closure.turns.toFixed(5))+" exposure cycles"):"not certified within rational tolerance")+".";
}
function renderVariations(){
  const root=$("variants");root.replaceChildren();
  variants.forEach((v,i)=>{
    const btn=document.createElement("button");btn.className="variant"+(selected===i?" selected":"");
    const preview=makeSVG(v.design,true);btn.append(preview,document.createTextNode("Variation "+(i+1)));
    btn.addEventListener("click",()=>{selected=i;$("refine").disabled=false;renderVariations();});
    root.append(btn);
  });
}
function generate(){selected=-1;$("refine").disabled=true;variants=makeVariations(design,{seed:seed++,strength:Number($("strength").value)/100});renderVariations();}
$("strength").addEventListener("input",()=>{$("strengthValue").textContent=$("strength").value+"%";});
$("generate").addEventListener("click",generate);
$("refine").addEventListener("click",()=>{
  if(selected<0)return;
  history.push({...design});design={...variants[selected].design};
  updateInputs();refreshArmature=mountArmature($("armature"),()=>design,patch=>{
  const next={...design,...patch};
  try{design=next;updateInputs();render();}catch(e){console.warn("Armature update rejected",e);}
});
render();generate();
});
$("back").addEventListener("click",()=>{if(!history.length)return;design=history.pop();updateInputs();render();generate();});
function download(name,content,type){
  const url=URL.createObjectURL(new Blob([content],{type}));
  const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
$("save").addEventListener("click",()=>download("design.mandala",serializeProject(design,history),"application/json"));
$("svg").addEventListener("click",()=>{try{download("mandala.svg",exportSVG(design,{maxSegments:60000}),"image/svg+xml");}catch(e){alert(e.message);}});
$("open").addEventListener("click",()=>$("file").click());
$("file").addEventListener("change",async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{const p=deserializeProject(await file.text());design={...p.design};history=Array.isArray(p.history)?p.history:[];updateInputs();render();generate();}
  catch(err){alert("Could not open project: "+err.message);}
  e.target.value="";
});
render();generate();
