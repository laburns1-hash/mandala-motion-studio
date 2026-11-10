// Mandala Motion Studio — original dual-rotor geometry engine.
// Geometry is expressed in millimetres; no external runtime dependencies.
export const ENGINE_VERSION = "0.1.0";
export const DEFAULT_DESIGN = Object.freeze({
  radiusA: 36, radiusB: 22, speedA: 5, speedB: -8,
  phaseA: 0, phaseB: 0, cycles: 1, nibMm: 0.3,
  paperWidthMm: 210, paperHeightMm: 297, marginMm: 12,
  color: "#23617b"
});
const finite = (n, name) => {
  if (typeof n !== "number" || !Number.isFinite(n)) throw new RangeError(name + " must be a finite number");
  return n;
};
export function validateDesign(d) {
  for (const k of ["radiusA","radiusB","speedA","speedB","phaseA","phaseB","cycles","nibMm","paperWidthMm","paperHeightMm","marginMm"]) finite(d[k],k);
  if (d.radiusA < 0 || d.radiusB < 0 || d.cycles <= 0 || d.cycles > 100 ||
      d.nibMm <= 0 || d.paperWidthMm <= 0 || d.paperHeightMm <= 0 ||
      d.marginMm < 0 || d.marginMm * 2 >= Math.min(d.paperWidthMm,d.paperHeightMm)) {
    throw new RangeError("Invalid geometry or physical paper parameters");
  }
  if (Math.max(Math.abs(d.speedA),Math.abs(d.speedB)) > 200) throw new RangeError("Rotor speed out of supported range");
  return d;
}
export function pointAt(d,t) {
  return {
    x: d.radiusA*Math.cos(d.speedA*t+d.phaseA)+d.radiusB*Math.cos(d.speedB*t+d.phaseB),
    y: d.radiusA*Math.sin(d.speedA*t+d.phaseA)+d.radiusB*Math.sin(d.speedB*t+d.phaseB)
  };
}
export function samplePath(d, options={}) {
  validateDesign(d);
  const maxStepMm = options.maxStepMm ?? 0.16;
  if (!(maxStepMm > 0) || !Number.isFinite(maxStepMm)) throw new RangeError("maxStepMm must be positive");
  const duration=2*Math.PI*d.cycles;
  const maxVelocity=Math.abs(d.radiusA*d.speedA)+Math.abs(d.radiusB*d.speedB);
  const estimated=Math.ceil(duration*Math.max(maxVelocity,1)/maxStepMm);
  const maxSegments=options.maxSegments ?? 150000;
  if(!Number.isInteger(maxSegments)||maxSegments<2||maxSegments>200000) throw new RangeError("maxSegments must be an integer between 2 and 200000");
  const count=Math.min(maxSegments,Math.max(512,estimated));
  const points=new Array(count+1);
  for(let i=0;i<=count;i++) points[i]=pointAt(d,duration*i/count);
  return points;
}
export function fitToPaper(points,d) {
  validateDesign(d);
  if (!points.length) throw new RangeError("Cannot fit an empty path");
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const p of points) {minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
  const availableW=d.paperWidthMm-2*d.marginMm-d.nibMm;
  const availableH=d.paperHeightMm-2*d.marginMm-d.nibMm;
  if(availableW<=0||availableH<=0) throw new RangeError("Nib exceeds drawable area");
  const scale=Math.min(availableW/Math.max(maxX-minX,1e-9),availableH/Math.max(maxY-minY,1e-9));
  const midX=(minX+maxX)/2,midY=(minY+maxY)/2;
  return points.map(p=>({x:d.paperWidthMm/2+(p.x-midX)*scale,y:d.paperHeightMm/2+(p.y-midY)*scale}));
}
export function pathData(points,decimals=3) {
  return points.map((p,i)=>(i?"L":"M")+p.x.toFixed(decimals)+" "+p.y.toFixed(decimals)).join(" ");
}
const xmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
export function exportSVG(d,options={}) {
  const points=fitToPaper(samplePath(d,options),d);
  const color=/^#[0-9a-fA-F]{6}$/.test(d.color) ? d.color : "#000000";
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+d.paperWidthMm+'mm" height="'+d.paperHeightMm+'mm" viewBox="0 0 '+d.paperWidthMm+' '+d.paperHeightMm+'"><title>'+xmlEscape(options.title??"Mandala Motion Studio")+'</title><path d="'+pathData(points)+'" fill="none" stroke="'+color+'" stroke-width="'+d.nibMm+'" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
export function recommendNib(originalNibMm,originalPaper,newPaper) {
  const scale=Math.min(newPaper.width/originalPaper.width,newPaper.height/originalPaper.height);
  return {scale,retainMm:originalNibMm,proportionalMm:originalNibMm*scale};
}
export function serializeProject(design,history=[]) {
  validateDesign(design);
  return JSON.stringify({format:"mandala-motion-project",schemaVersion:1,engineVersion:ENGINE_VERSION,design,history},null,2);
}
export function deserializeProject(json) {
  const data=JSON.parse(json);
  if(data.format!=="mandala-motion-project"||data.schemaVersion!==1) throw new Error("Unsupported project format");
  validateDesign(data.design);
  return data;
}
