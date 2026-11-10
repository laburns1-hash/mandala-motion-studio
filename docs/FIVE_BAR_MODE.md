# Five-bar linkage mode (prototype)

Two fixed pivots at (-baseSeparation/2,0) and (+baseSeparation/2,0). Each motor drives a crank. Each crank terminates at an elbow, which connects to the single pen through a coupler.

## Forward kinematics
Let elbows E_A and E_B be calculated from the crank angles. The pen P is the intersection of two circles centered on E_A and E_B with radii couplerA and couplerB. The two intersection branches represent different assembly configurations.

Distance d = |E_B - E_A|. The along-center distance is a = (rA² - rB² + d²)/(2d); the perpendicular distance is h = sqrt(rA² - a²). The pen lies at E_A + a*u ± h*perp(u), where u is the unit vector between elbows.

## Safety and limitations
- Unreachable poses return an explicit reason, never a fabricated pen coordinate.
- Coincident equal-radius circles are indeterminate, not a unique pen pose.
- Tangency is marked singular and omitted from drawing paths.
- Sampled drawing paths are split across unreachable and singular poses to prevent a false connecting stroke.
- The chosen assembly branch is fixed during sampling. Future physical motion planning must ensure joint continuity, detect near-singular configurations, account for actuator limits and collision clearance.
- This is a planar kinematic model. It does **not** yet establish collision-free hardware or physically achievable motor trajectories.
- Unlike the original mathematical rotor mode, arbitrary independent motor speeds may cause unreachable poses. A real machine must stop, constrain, or replan instead of passing through them.

## Future editor
Display both motors, elbows, couplers and shared pen; drag motor angle handles and choose assembly branch. Provide reachability warnings and a separate constrained drawing preview. Keep the original dual-rotor and harmonograph modes.
