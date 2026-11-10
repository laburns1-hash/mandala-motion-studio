# Mathematical reference programme

These references guide our independent mathematical implementations. The exact texts, page references and reproduction rights must be checked before copying any diagrams, code or prose.

## 1. Ivan Moscovich — The Pendulum-Harmonograph: A Drawing Machine
Candidate PDF: https://s3.amazonaws.com/arena-attachments/2503772/81b5cff1dcc7836a9878f340ec7930ed.pdf
Relevant concepts: superposition of oscillations, amplitude, phase, period ratios, damping and physical drawing apparatus.
Implementation: `harmonographPoint()` in `src/curve-families.js`.
Review status: bibliographic identification and PDF contents require independent verification. We have **not** imported text or code from this PDF.

## 2. Spirograph with PSTricks — PracTeX Journal, 2008 issue 1
Candidate issue PDF: https://tug.org/pracjourn/2008-1/wholeissue/wholeissue.pdf
Relevant concepts: epi/hypotrochoid parametrization, rolling circle radius, pen offset and closure.
Implementation: `trochoidPoint()`, `trochoidClosure()`.
Review status: article's exact authorship/pages and any licence on its example code require verification. The equations implemented are standard mathematical identities, independently written.

## 3. W. F. Stanley — A Descriptive Treatise on Mathematical Drawing Instruments (1868)
Digitized scan: https://commons.wikimedia.org/wiki/File:A_Descriptive_Treatise_on_Mathematical_Drawing_Instruments_-_Third_Edition_(IA_StanleyMathDrawingInstruments1868).pdf
Relevant concepts: instrument geometry, pivots, joints, scales, construction and physical feasibility.
Implementation: future mechanically constrained editor. Current `pointAt()` is rotating-vector mathematics, **not** a mechanically verified linkage.
Review status: historical reference. Exact diagrams and chapters to be indexed after reading.

## Geometry provenance
- Dual-rotor vector sum: `src/engine.js`
- Rolling-circle families: `src/curve-families.js`
- Damped Lissajous/harmonograph family: `src/curve-families.js`
- Rational frequency approximation and closure: `src/curve-families.js`

## Next research work
Read and index the three works; record precise page citations for formulas and diagrams, distinguish mathematical results from hardware design, and add parameter-boundary tests. Do not claim the current app mechanically reproduces a device until its linkage is specified and verified.
