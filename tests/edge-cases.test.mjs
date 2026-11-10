import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_DESIGN,validateDesign,samplePath,fitToPaper,exportSVG,serializeProject,deserializeProject} from "../src/engine.js";
import {rationalApprox,rotorClosure,trochoidPoint,harmonographPoint} from "../src/curve-families.js";
import {makeVariations} from "../src/variations.js";
const d=()=>({...DEFAULT_DESIGN});
test("reject NaN, infinity, missing and string dimensions",()=>{
 for(const bad of [NaN,Infinity,-Infinity,undefined,"210"]){const x=d();x.paperWidthMm=bad;assert.throws(()=>validateDesign(x),RangeError);}
});
test("reject negative radii, nonpositive nib and paper, invalid margin",()=>{
 for(const [key,value] of [["radiusA",-1],["nibMm",0],["paperHeightMm",0],["marginMm",106],["cycles",0],["speedB",201]]){const x=d();x[key]=value;assert.throws(()=>validateDesign(x),RangeError);}
});
test("reject unsafe sampling bounds",()=>{
 for(const maxSegments of [0,1,-1,NaN,1.5,200001])assert.throws(()=>samplePath(d(),{maxSegments}),RangeError);
 for(const maxStepMm of [0,-1,NaN,Infinity])assert.throws(()=>samplePath(d(),{maxStepMm}),RangeError);
});
test("zero radii and speeds still yield finite points",()=>{
 const x={...d(),radiusA:0,radiusB:0,speedA:0,speedB:0};
 const p=fitToPaper(samplePath(x,{maxSegments:600}),x);
 assert.ok(p.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)));
});
test("thin paper with large nib is rejected by fit",()=>{
 const x={...d(),paperWidthMm:50,paperHeightMm:50,marginMm:24,nibMm:4};
 assert.throws(()=>fitToPaper(samplePath(x,{maxSegments:600}),x),RangeError);
});
test("XML title is escaped and invalid stroke color not injected",()=>{
 const x={...d(),color:'" onload="alert(1)'};
 const s=exportSVG(x,{title:'<bad & "title">',maxSegments:700});
 assert.ok(s.includes("&lt;bad &amp; &quot;title&quot;&gt;"));
 assert.ok(s.includes('stroke="#000000"'));
 assert.ok(!s.includes("onload="));
});
test("unsupported saved-project version rejected",()=>{
 const p=JSON.parse(serializeProject(d()));p.schemaVersion=999;
 assert.throws(()=>deserializeProject(JSON.stringify(p)));
});
test("variations reproducible and lock respected",()=>{
 const a=makeVariations(d(),{seed:123,strength:0.8,locks:{radiusA:true}});
 const b=makeVariations(d(),{seed:123,strength:0.8,locks:{radiusA:true}});
 assert.deepEqual(a,b);assert.equal(a.length,9);assert.ok(a.every(v=>v.design.radiusA===d().radiusA));
});
test("invalid variation strength rejected",()=>{
 for(const strength of [-1,2,NaN,Infinity])assert.throws(()=>makeVariations(d(),{strength}),RangeError);
});
test("rational closure reports irrational frequency ratio unclosed",()=>{
 assert.equal(rotorClosure(1,Math.SQRT2).closed,false);
 assert.equal(rotorClosure(0,0).turns,0);
 assert.equal(rationalApprox(0.5).denominator,2);
});
test("trochoid and harmonograph reject impossible inputs",()=>{
 assert.throws(()=>trochoidPoint({fixedRadius:0,rollingRadius:2,penOffset:1},0),RangeError);
 assert.throws(()=>harmonographPoint({dampingX:-1},1),RangeError);
});
