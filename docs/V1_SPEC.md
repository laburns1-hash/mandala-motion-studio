# Version 1 specification

## Goal
Create a browser-based, local-first generative drawing studio. A user can design a dual-rotor pattern, explore related variations, save and reopen it, and export a physically sized SVG.

## Mathematical model
x(t) = rA*cos(speedA*t + phaseA) + rB*cos(speedB*t + phaseB)
y(t) = rA*sin(speedA*t + phaseA) + rB*sin(speedB*t + phaseB)

This is a mathematical model, **not** proof of physical two-rotor linkage feasibility. Speeds may be fractional and negative. Rendering resolution must not change stored geometry.

## Variation Explorer
Generate nine candidates from a base design with adjustable variation strength. Preserve each parent, provide per-parameter locks, and store lineage and deterministic seeds. Selection must not overwrite ancestors.

## Physical output
Paper width, height, margins, and pen nib diameter are stored in millimetres. Paper scaling must offer retained physical nib width and an optional proportionally scaled nib recommendation. SVG includes physical mm dimensions and viewBox.

## Local-first saving
Versioned .mandala JSON, deterministic generator parameters and lineage. SVG and PNG exports. No login required.

## Acceptance criteria
- A saved project reopens to the same mathematical geometry.
- A4-to-A3 resizing does not change the physical nib width unless explicitly requested.
- A selected variation becomes a new child and its parent remains accessible.
- SVG dimensions match selected paper.
- Fractional and counter-rotating speeds work.
- Mechanical feasibility is labelled unverified until physical hardware constraints are defined.

## Deferred
Hardware plotter control, cloud gallery, hosted sharing links, advanced light-exposure simulation.
