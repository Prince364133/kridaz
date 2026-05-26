const fs = require('fs');

// 1. Update scoring.validator.js
let validatorFile = 'server/modules/scoring/scoring.validator.js';
let validatorContent = fs.readFileSync(validatorFile, 'utf8');
validatorContent = validatorContent.replace(
  /bowlerId: z\.string\(\)\.min\(1\)\.optional\(\)\.nullable\(\),/,
  `bowlerId: z.string().min(1).optional().nullable(),\n    wicketKeeperId: z.string().min(1).optional().nullable(),`
);
fs.writeFileSync(validatorFile, validatorContent);

// 2. Update scoring.controller.js
let controllerFile = 'server/modules/scoring/scoring.controller.js';
let controllerContent = fs.readFileSync(controllerFile, 'utf8');
controllerContent = controllerContent.replace(
  /const { scoringId, strikerId, nonStrikerId, bowlerId } = req\.body;/,
  `const { scoringId, strikerId, nonStrikerId, bowlerId, wicketKeeperId } = req.body;`
);
controllerContent = controllerContent.replace(
  /const scoring = await scoringService\.updateActivePlayers\(scoringId, {[\s\n]+strikerId,[\s\n]+nonStrikerId,[\s\n]+bowlerId[\s\n]+}\);/m,
  `const scoring = await scoringService.updateActivePlayers(scoringId, { \n      strikerId, \n      nonStrikerId, \n      bowlerId,\n      wicketKeeperId\n    });`
);
fs.writeFileSync(controllerFile, controllerContent);

// 3. Update scoring.service.js
let serviceFile = 'server/modules/scoring/scoring.service.js';
let serviceContent = fs.readFileSync(serviceFile, 'utf8');
serviceContent = serviceContent.replace(
  /export const updateActivePlayers = async \(scoringId, { strikerId, nonStrikerId, bowlerId }\) => {/,
  `export const updateActivePlayers = async (scoringId, { strikerId, nonStrikerId, bowlerId, wicketKeeperId }) => {`
);

let replaceTarget = `  const updateData = {};
  if (bowlerId) updateData.bowlerId = bowlerId;
  if (strikerId !== undefined) updateData.strikerId = strikerId;
  if (nonStrikerId !== undefined) updateData.nonStrikerId = nonStrikerId;`;

let newContent = `  const updateData = {};
  if (bowlerId) updateData.bowlerId = bowlerId;
  if (strikerId !== undefined) updateData.strikerId = strikerId;
  if (nonStrikerId !== undefined) updateData.nonStrikerId = nonStrikerId;

  if (wicketKeeperId) {
    let existingOfficials = {};
    if (scoring.matchOfficials) {
      existingOfficials = typeof scoring.matchOfficials === 'string' ? JSON.parse(scoring.matchOfficials) : scoring.matchOfficials;
    }
    existingOfficials.wicketKeeperId = wicketKeeperId;
    updateData.matchOfficials = existingOfficials;
  }`;

serviceContent = serviceContent.replace(replaceTarget, newContent);
fs.writeFileSync(serviceFile, serviceContent);

console.log('Backend updated successfully');
