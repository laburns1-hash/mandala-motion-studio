import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_FIVE_BAR,validateFiveBar,solveFiveBar,sampleFiveBar} from "../src/five-bar.js";
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,`${a} vs ${b}`);
test("default linkage has reachable initial pose",()=>{
 const s=solveFiveBar(DEFAULT_FIVE_BAR);assert.equal(s.reachable,true);
 near(Math.hypot(s.pen.x-s.elbowA.x,s.pen.y-s.elbowA.y),DEFAULT_FIVE_BAR.couplerA);
 near(Math.hypot(s.pen.x-s.elbowB.x,s.pen.y-s.elbowB.y),DEFAULT_FIVE_BAR.couplerB);
});
test("both solution branches satisfy shared pen constraints",()=>{
 const a=solveFiveBar(DEFAULT_FIVE_BAR,undefined,undefined,1);
 const b=solveFiveBar(DEFAULT_FIVE_BAR,undefined,undefined,-1);
 assert.equal(a.reachable,true);assert.equal(b.reachable,true);
 assert.ok(Math.hypot(a.pen.x-b.pen.x,a.pen.y-b.pen.y)>1);
 for(const s of [a,b]){
  near(Math.hypot(s.pen.x-s.elbowA.x,s.pen.y-s.elbowA.y),DEFAULT_FIVE_BAR.couplerA);
  near(Math.hypot(s.pen.x-s.elbowB.x,s.pen.y-s.elbowB.y),DEFAULT_FIVE_BAR.couplerB);
 }
});
test("impossible separated couplers explicitly rejected",()=>{
 const d={...DEFAULT_FIVE_BAR,baseSeparation:1000,crankA:10,crankB:10,couplerA:10,couplerB:10};
 const s=solveFiveBar(d,0,0);assert.equal(s.reachable,false);assert.equal(s.reason,"too-far");
});
test("one circle strictly inside another rejected",()=>{
 const d={...DEFAULT_FIVE_BAR,baseSeparation:100,crankA:10,crankB:10,couplerA:150,couplerB:10};
 const s=solveFiveBar(d,0,Math.PI);assert.equal(s.reachable,false);assert.equal(s.reason,"one-circle-inside-other");
});
test("invalid lengths, angles, branch rejected",()=>{
 for(const value of [0,-1,NaN,Infinity])assert.throws(()=>validateFiveBar({...DEFAULT_FIVE_BAR,couplerA:value}),RangeError);
 assert.throws(()=>solveFiveBar(DEFAULT_FIVE_BAR,0,0,0),RangeError);
});
test("sampling never bridges unreachable segments",()=>{
 const d={...DEFAULT_FIVE_BAR,baseSeparation:180,crankA:30,crankB:30,couplerA:65,couplerB:65};
 const r=sampleFiveBar(d,{segments:500});assert.equal(r.samples,501);
 assert.ok(r.unreachable>0);
 assert.ok(r.paths.every(p=>p.length>1&&p.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y))));
});
test("reject invalid sampling options",()=>{
 for(const segments of [0,1,1.5,200001])assert.throws(()=>sampleFiveBar(DEFAULT_FIVE_BAR,{segments}),RangeError);
});
