// Find the earliest full configuration return of both motors, not just a
// crossing of the pen's starting point. A full return keeps the assembly
// branch and orientation unchanged.
export function findLoopClosure(speedA,speedB,maxRevolutions=30,tolerance=1e-6){
 if(![speedA,speedB,maxRevolutions,tolerance].every(Number.isFinite)||
    Math.abs(speedA)<1e-9||maxRevolutions<1||maxRevolutions>1000||tolerance<=0)
  throw new RangeError("Invalid loop closure parameters");
 const ratio=Math.abs(speedB/speedA);
 for(let turns=1;turns<=Math.floor(maxRevolutions);turns++){
  const otherTurns=ratio*turns;
  if(Math.abs(otherTurns-Math.round(otherTurns))*2*Math.PI<=tolerance){
   return {closed:true,revolutions:turns,motorBTurns:Math.round(otherTurns),
    duration:2*Math.PI*turns/Math.abs(speedA)};
  }
 }
 return {closed:false,revolutions:Math.floor(maxRevolutions),
  motorBTurns:ratio*Math.floor(maxRevolutions),
  duration:2*Math.PI*Math.floor(maxRevolutions)/Math.abs(speedA)};
}
