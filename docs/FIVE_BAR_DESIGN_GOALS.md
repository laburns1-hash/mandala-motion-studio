# Five-bar is the primary mechanism

The application retains the original dual-rotor, trochoid and harmonograph curve families as additional creative tools. The five-bar linkage is the primary mechanical design mode.

## Two complementary drawing goals

**Symmetry:** matched or deliberately coordinated motor motion and geometries can yield repeatable, sometimes rotationally symmetric pen paths. Symmetry must be assessed on the solved pen trajectory, not inferred from integer motor ratios alone.

**Free motion:** independent motor speeds, unequal lengths, phase offsets and modulation can yield complex and asymmetric designs. A physically impossible pose must be flagged and must not be connected to other reachable segments by an artificial line.

## Initial analysis

`src/five-bar-symmetry.js` estimates rotational symmetry of sampled pen points, returning per-fold match scores and path coverage. It is an approximate geometric indicator, not a proof of symmetry. Scores can be misleading for sparse, overlapping or incomplete paths. Future improvements: arc-length resampling, full-cycle closure analysis, collision detection, reflection symmetry, branch continuity, singularity clearance, physical motor velocity/acceleration limits and numerical property tests.

Presets are exploratory starting configurations, **not** guaranteed symmetric or collision-free.
