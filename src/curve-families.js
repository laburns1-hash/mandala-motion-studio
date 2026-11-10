// Original implementations of standard mathematical curves.
// Reference reading: Moscovich (harmonographs), PracTeX 2008-1 (trochoids),
// Stanley (historical drawing instruments). No book code copied.
export function gcd(a,b){a=Math.abs(Math.trunc(a));b=Math.abs(Math.trunc(b));while(b)[a,b]=[b,a%b];return a;}
export function rationalApprox(value,maxDenominator=128,tolerance=1e-8){
 if(!Number.isFinite(value)||!Number.isInteger(maxDenominator)||maxDenominator<1)throw new RangeError("Invalid rational approximation");
 let best={numerator:Math.round(value),denominator:1,error:Math.abs(value-Math.round(value))};
 for(let d=1;d<=maxDenominator;d++){const n=Math.round(value*d),error=Math.abs(value-n/d);if(error<best.error){best={numerator:n,denominator:d,error};}if(error<=tolerance)break;}
 const g=gcd(best.numerator,best.denominator)||1;
 return {...best,numerator:best.numerator/g,denominator:best.denominator/g,exact:best.error<=tolerance};
}
export function rotorClosure(speedA,speedB,{maxDenominator=128,tolerance=1e-8}={}){
 if(!Number.isFinite(speedA)||!Number.isFinite(speedB))throw new RangeError("Invalid speeds");
 if(speedA===0&&speedB===0)return {closed:true,turns:0,ratio:"stationary",approximate:false};
 if(speedA===0||speedB===0){const w=Math.abs(speedA||speedB);return {closed:true,turns:1/w,ratio:"one stationary",approximate:false};}
 const r=rationalApprox(speedA/speedB,maxDenominator,tolerance);
 return {closed:r.exact,turns:r.exact?Math.abs(r.denominator/speedB):null,ratio:r.numerator+":"+r.denominator,approximate:!r.exact,error:r.error};
}
// For two nonzero signed rotor frequencies, if wA/wB = p/q (reduced),
// common return time T = 2*pi*abs(q/wB), or abs(p/wA).
// 'turns' is T/(2*pi), measured in engine exposure cycles.
export function trochoidPoint({fixedRadius,rollingRadius,penOffset,internal=false,phase=0},t){
 for(const n of [fixedRadius,rollingRadius,penOffset,phase,t])if(!Number.isFinite(n))throw new RangeError("Non-finite trochoid input");
 if(fixedRadius<=0||rollingRadius<=0||penOffset<0)throw new RangeError("Invalid circle geometry");
 const R=fixedRadius,r=rollingRadius,d=penOffset;
 if(internal){
  const k=(R-r)/r;
  return {x:(R-r)*Math.cos(t+phase)+d*Math.cos(k*t+phase),
          y:(R-r)*Math.sin(t+phase)-d*Math.sin(k*t+phase)};
 }
 const k=(R+r)/r;
 return {x:(R+r)*Math.cos(t+phase)-d*Math.cos(k*t+phase),
         y:(R+r)*Math.sin(t+phase)-d*Math.sin(k*t+phase)};
}
export function trochoidClosure(fixedRadius,rollingRadius){
 if(!(fixedRadius>0&&rollingRadius>0))throw new RangeError("Radii must be positive");
 const ratio=rationalApprox(fixedRadius/rollingRadius);
 return {closed:ratio.exact,revolutions:ratio.exact?ratio.denominator:null,ratio:ratio.numerator+":"+ratio.denominator,approximate:!ratio.exact};
}
// Independent damped orthogonal oscillations, expressed in drawing coordinates.
// Frequencies are angular frequencies in radians per unit t.
export function harmonographPoint({ax=40,ay=40,wx=3,wy=2,phaseX=0,phaseY=0,dampingX=0,dampingY=0},t){
 const vals=[ax,ay,wx,wy,phaseX,phaseY,dampingX,dampingY,t];
 if(vals.some(n=>!Number.isFinite(n))||dampingX<0||dampingY<0)throw new RangeError("Invalid harmonograph parameters");
 return {x:ax*Math.exp(-dampingX*t)*Math.sin(wx*t+phaseX),
         y:ay*Math.exp(-dampingY*t)*Math.sin(wy*t+phaseY)};
}
export function sampleCurve(pointFn,duration,segments=4000){
 if(!Number.isFinite(duration)||duration<=0||!Number.isInteger(segments)||segments<2||segments>200000)throw new RangeError("Invalid sampling");
 return Array.from({length:segments+1},(_,i)=>pointFn(duration*i/segments));
}
