# Muscle Atlas

Clickable front and back body map. Pick a muscle group to see what it does and how to train it: step-by-step technique, intensity, level, sets × reps, form cues, common mistakes and links to form videos.

Live: https://saler-luka.github.io/muscle-atlas/

Static site, no build step: `index.html` + data files (`data-en.js`, `data-extra.js`, `data-hr.js`, `data-parts.js`). English and Croatian (EN/HR switch).

Each group can be narrowed to an individual muscle (e.g. Glutes → gluteus maximus, medius, minimus), either by tapping it on the figure or from the chips on the sheet. `data-parts.js` defines those muscles and ranks which exercises target each one. Deep links per group or muscle, e.g. `#glutes` or `#glutes/med`.
