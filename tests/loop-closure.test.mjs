import test from "node:test";
import assert from "node:assert/strict";
import {findLoopClosure} from "../src/loop-closure.js";
test("7:9 motor revolutions close at the shared starting configuration",()=>{
 const result=findLoopClosure(1,-9/7,30);
 assert.equal(result.closed,true);
 assert.equal(result.revolutions,7);
 assert.equal(result.motorBTurns,9);
});
test("13:17 motors close at 13 revolutions",()=>{
 const result=findLoopClosure(1,-17/13,60);
 assert.equal(result.closed,true);
 assert.equal(result.revolutions,13);
});
test("non-commensurate speeds do not falsely close",()=>{
 const result=findLoopClosure(1,Math.SQRT2,30);
 assert.equal(result.closed,false);
});
test("bounded search rejects invalid inputs",()=>{
 assert.throws(()=>findLoopClosure(0,1,30),RangeError);
 assert.throws(()=>findLoopClosure(1,2,0),RangeError);
});
