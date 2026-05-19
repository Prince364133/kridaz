const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SourceBranch = "origin/sunny";
const RepoRoot = __dirname;

console.log("================================================================");
console.log("  Sunny UI Injection Script");
console.log(`  Source: ${SourceBranch}`);
console.log(`  Target: version3 modular structure`);
console.log("================================================================");

// Mapping: [source path in branch] -> [target path in version3]
const fileMap = {
    // Pages
    "client/user/src/user/pages/Home.jsx": "client/user/src/pages/Home.jsx",
    "client/user/src/user/pages/Profile.jsx": "client/user/src/features/profile/pages/Profile.jsx",
    "client/user/src/user/pages/JoinGames.jsx": "client/user/src/features/games/pages/JoinGames.jsx",

    // Turf Feature
    "client/user/src/user/components/turf/TurfDetails.jsx": "client/user/src/features/turf/components/TurfDetails.jsx",
    "client/user/src/user/components/turf/Turf.jsx": "client/user/src/features/turf/components/Turf.jsx",
    "client/user/src/user/components/turf/TurfCard.jsx": "client/user/src/features/turf/components/TurfCard.jsx",
    "client/user/src/user/components/turf/TurfBookingHistory.jsx": "client/user/src/features/turf/components/TurfBookingHistory.jsx",
    "client/user/src/user/components/turf/BookingPass.jsx": "client/user/src/features/turf/components/BookingPass.jsx",
    "client/user/src/user/pages/checkout/CheckoutPage.jsx": "client/user/src/features/turf/pages/CheckoutPage.jsx",

    // Business / Landing Pages
    "client/user/src/user/pages/business/VenueOwnerLanding.jsx": "client/user/src/features/business/pages/VenueOwnerLanding.jsx",
    "client/user/src/user/pages/business/CoachLanding.jsx": "client/user/src/features/business/pages/CoachLanding.jsx",
    "client/user/src/user/pages/business/ScorerLanding.jsx": "client/user/src/features/business/pages/ScorerLanding.jsx",
    "client/user/src/user/pages/business/StreamerLanding.jsx": "client/user/src/features/business/pages/StreamerLanding.jsx",
    "client/user/src/user/pages/business/UmpireLanding.jsx": "client/user/src/features/business/pages/UmpireLanding.jsx",
    "client/user/src/user/pages/business/BusinessRegistration.jsx": "client/user/src/features/business/pages/BusinessRegistration.jsx",

    // Modals
    "client/user/src/user/components/modals/EditProfileModal.jsx": "client/user/src/shared/components/modals/EditProfileModal.jsx"
};

// Alias fix patterns
const aliasFixes = [
    { pattern: /from "\.\.\/components\//g, replace: 'from "@components/' },
    { pattern: /from "\.\.\/hooks\//g, replace: 'from "@hooks/' },
    { pattern: /from "\.\.\/redux\//g, replace: 'from "@redux/' },
    { pattern: /from "\.\.\/pages\//g, replace: 'from "@pages/' },
    { pattern: /from '\.\.\/components\//g, replace: "from '@components/" },
    { pattern: /from '\.\.\/hooks\//g, replace: "from '@hooks/" },
    { pattern: /from '\.\.\/redux\//g, replace: "from '@redux/" },
    { pattern: /from '\.\.\/pages\//g, replace: "from '@pages/" }
];

let injected = 0;
let failed = 0;
const changesReport = [];

// Fetch latest from origin
try {
    console.log("\nFetching latest origin status...");
    execSync('git fetch origin');
} catch (e) {
    console.warn("WARNING: git fetch origin failed. Proceeding with local origin state.");
}

Object.entries(fileMap).forEach(([srcPath, destRel]) => {
    const destPath = path.join(RepoRoot, destRel);

    console.log(`\nProcessing: ${srcPath}`);

    try {
        // Extract content from remote branch using git show
        const contentBuffer = execSync(`git show ${SourceBranch}:${srcPath}`, { stdio: ['pipe', 'pipe', 'ignore'] });
        let content = contentBuffer.toString('utf8');

        // Apply alias fixes to imports
        aliasFixes.forEach(fix => {
            content = content.replace(fix.pattern, fix.replace);
        });

        // Ensure target directory exists
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
            console.log(`  [DIR+] Created: ${destDir}`);
        }

        // Write file contents
        fs.writeFileSync(destPath, content, 'utf8');
        console.log(`  [OK]   -> ${destRel}`);
        changesReport.push(`Injected: ${srcPath} -> ${destRel}`);
        injected++;
    } catch (e) {
        console.error(`  [MISS] File not found or extraction failed: ${srcPath}`);
        failed++;
    }
});

// Save injection report summary
fs.writeFileSync(path.join(RepoRoot, 'sunny-injection-summary.txt'), changesReport.join('\n'), 'utf8');

console.log("\n================================================================");
console.log("  INJECTION SUMMARY");
console.log(`  Successfully Injected: ${injected} files`);
console.log(`  Failed / Skipped:      ${failed} files`);
console.log("  Wrote details to:      sunny-injection-summary.txt");
console.log("================================================================");
