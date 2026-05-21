const fs = require('fs');
const path = require('path');

const routerPath = path.join(__dirname, 'client/user/src/app/router.jsx');
let content = fs.readFileSync(routerPath, 'utf8');

// Replace the imports
content = content.replace(
  'const PayoutBanking      = lazy(() => import("@features/venue-owner").then(m => ({ default: m.PayoutBanking })));',
  `const VenueBanking       = lazy(() => import("@features/venue-owner").then(m => ({ default: m.VenueBanking })));
const CoachBanking       = lazy(() => import("@features/coach").then(m => ({ default: m.CoachBanking })));
const UmpireBanking      = lazy(() => import("@features/umpire").then(m => ({ default: m.UmpireBanking })));
const StreamerBanking    = lazy(() => import("@features/streamer").then(m => ({ default: m.StreamerBanking })));
const ScorerBanking      = lazy(() => import("@features/scorer").then(m => ({ default: m.ScorerBanking })));`
);

// We need to replace the route elements carefully based on the path hierarchy.
let updatedCount = 0;

function replaceInBlock(fullText, marker, replacee, replacer) {
  const index = fullText.indexOf(marker);
  if (index === -1) {
    console.log("Marker not found:", marker);
    return fullText;
  }
  const nextBlock = fullText.slice(index);
  const replaceIndex = nextBlock.indexOf(replacee);
  if (replaceIndex === -1) {
    console.log("Replacee not found in block for marker:", marker);
    return fullText;
  }
  
  const absoluteIndex = index + replaceIndex;
  updatedCount++;
  return fullText.slice(0, absoluteIndex) + replacer + fullText.slice(absoluteIndex + replacee.length);
}

// Replace in venue-owner block
content = replaceInBlock(content, 'path: "/venue-owner"', '<S><PayoutBanking /></S>', '<S><VenueBanking /></S>');

// Replace in coach block
content = replaceInBlock(content, 'path: "/coach"', '<S><PayoutBanking /></S>', '<S><CoachBanking /></S>');

// Replace in umpire block
content = replaceInBlock(content, 'path: "/umpire"', '<S><PayoutBanking /></S>', '<S><UmpireBanking /></S>');

// Replace in streamer block
content = replaceInBlock(content, 'path: "/streamer"', '<S><PayoutBanking /></S>', '<S><StreamerBanking /></S>');

// Replace in scorer block
content = replaceInBlock(content, 'path: "/scorer"', '<S><PayoutBanking /></S>', '<S><ScorerBanking /></S>');

fs.writeFileSync(routerPath, content, 'utf8');
console.log('Router updated successfully. Replacements made:', updatedCount);
