import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_FIVE_BAR} from "../src/five-bar.js";
import {analyzeFiveBarSymmetry,FIVE_BAR_PRESETS} from "../src/five-bar-symmetry.js";
test("presets remain valid and each returns a meaningful analysis",()=>{
 for(const preset of FIVE_BAR_PRESETS){
  const result=analyzeFiveBarSymmetry(preset.settings,{segments:320});
  assert.ok(["approximately-rotational","asymmetric-or-incomplete","insufficient-path","degenerate"].includes(result.classification));
  assert.ok(result.coverage>=0&&result.coverage<=1);
  assert.ok(result.unreachable>=0);
 }
});
test("symmetry scores are bounded and sorted",()=>{
 const r=analyzeFiveBarSymmetry(DEFAULT_FIVE_BAR,{segments:400});
 for(const f of r.folds)assert.ok(f.match>=0&&f.match<=1);
 for(let i=1;i<r.folds.length;i++)assert.ok(r.folds[i-1].match>=r.folds[i].match);
});
test("symmetry analysis rejects invalid folds and tolerance",()=>{
 assert.throws(()=>analyzeFiveBarSymmetry(DEFAULT_FIVE_BAR,{folds:[1]}),RangeError);
 assert.throws(()=>analyzeFiveBarSymmetry(DEFAULT_FIVE_BAR,{tolerance:0}),RangeError);
});
