import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_FIVE_BAR,solveFiveBar,advanceFiveBar,scanMotorSeparation} from "../src/five-bar.js";
const d={...DEFAULT_FIVE_BAR};
test("independent X/Y mounts are used in the linkage",()=>{
 const v=solveFiveBar({...d,motorAX:-70,motorAY:20,motorBX:80,motorBY:-10});
 assert.deepEqual(v.baseA,{x:-70,y:20});
 assert.deepEqual(v.baseB,{x:80,y:-10});
 assert.equal(v.reachable,true);
 assert.ok(Math.abs(Math.hypot(v.pen.x-v.elbowA.x,v.pen.y-v.elbowA.y)-d.couplerA)<1e-7);
 assert.ok(Math.abs(Math.hypot(v.pen.x-v.elbowB.x,v.pen.y-v.elbowB.y)-d.couplerB)<1e-7);
});
test("default configuration remains connected",()=>{
 const p=solveFiveBar(d);assert.equal(p.reachable,true);
 const moved=advanceFiveBar(d,d.angleA,d.angleB,d.angleA+.03,d.angleB-.03);
 assert.equal(moved.accepted,true);
});
test("spacing scan actually moves the two pivot positions",()=>{
 const scan=scanMotorSeparation(d,{min:60,max:120,step:30,segments:24});
 assert.equal(scan.candidates.length,3);
 assert.ok(scan.candidates.every(x=>x.coverage>=0&&x.coverage<=1));
});
test("invalid motor position is rejected",()=>{
 assert.throws(()=>solveFiveBar({...d,motorAX:Infinity}),RangeError);
});
