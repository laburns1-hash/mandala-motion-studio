import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_FIVE_BAR,solveFiveBar,advanceFiveBar} from "../src/five-bar.js";
test("accepted motion keeps both couplers attached to one pen",()=>{
 const d=DEFAULT_FIVE_BAR;
 const move=advanceFiveBar(d,d.angleA,d.angleB,d.angleA+.08,d.angleB-.08);
 assert.equal(move.accepted,true);
 const p=move.pose.pen;
 assert.ok(Math.abs(Math.hypot(p.x-move.pose.elbowA.x,p.y-move.pose.elbowA.y)-d.couplerA)<1e-7);
 assert.ok(Math.abs(Math.hypot(p.x-move.pose.elbowB.x,p.y-move.pose.elbowB.y)-d.couplerB)<1e-7);
});
test("impossible target is blocked before disconnected pose",()=>{
 const d={...DEFAULT_FIVE_BAR,baseSeparation:180,crankA:30,crankB:30,couplerA:65,couplerB:65,angleA:0,angleB:Math.PI};
 const start=solveFiveBar(d,d.angleA,d.angleB);
 assert.equal(start.reachable,true);
 const move=advanceFiveBar(d,d.angleA,d.angleB,Math.PI,0);
 assert.equal(move.blocked,true);
 assert.equal(move.pose.reachable,true);
});
test("invalid start is rejected",()=>{
 const d={...DEFAULT_FIVE_BAR,baseSeparation:1000,couplerA:10,couplerB:10};
 const m=advanceFiveBar(d,0,0,1,1);
 assert.equal(m.reason,"invalid-start");
});
test("nonfinite motion inputs rejected",()=>{
 assert.throws(()=>advanceFiveBar(DEFAULT_FIVE_BAR,0,0,Infinity,0),RangeError);
});
