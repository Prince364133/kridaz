const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SourceBranch = "origin/abhiram";
const RepoRoot = __dirname;

console.log("================================================================");
console.log("  Abhiram UI Injection Script");
console.log(`  Source: ${SourceBranch}`);
console.log(`  Target: Local modular structure`);
console.log("================================================================");

// File Mapping: [source path in origin/abhiram] -> [target path locally]
const fileMap = {
    "client/user/src/user/components/layout/Navbar.jsx": "client/user/src/shared/components/layout/Navbar.jsx",
    "client/user/src/user/pages/FindProfessionals.jsx": "client/user/src/features/networking/pages/FindProfessionals.jsx",
    "client/user/src/user/pages/HostGame.jsx": "client/user/src/features/games/pages/HostGame.jsx",
    "client/user/src/user/pages/ProfessionalDetails.jsx": "client/user/src/features/networking/pages/ProfessionalDetails.jsx",
    "client/user/src/user/pages/Wallet.jsx": "client/user/src/features/wallet/pages/Wallet.jsx"
};

// Precise Replacements for Relative Imports / Standardisation
const replacements = {
    "client/user/src/shared/components/layout/Navbar.jsx": [
        {
            target: 'import { reelsApi } from "../../../redux/api/reelsApi";',
            replacement: 'import { reelsApi } from "@redux/api/reelsApi";'
        }
    ],
    "client/user/src/features/networking/pages/FindProfessionals.jsx": [
        {
            target: 'import { fetchStates, fetchCities } from "@user/utils/locationService";',
            replacement: 'import { fetchStates, fetchCities } from "@utils/locationService";'
        }
    ],
    "client/user/src/features/games/pages/HostGame.jsx": [
        {
            target: "import SlotPickerPopup from '../components/SlotPickerPopup';",
            replacement: "import SlotPickerPopup from '@components/SlotPickerPopup';"
        },
        {
            target: "import CoinAnimation from '../components/CoinAnimation';",
            replacement: "import CoinAnimation from '@components/CoinAnimation';"
        },
        {
            target: "import { fetchStates, fetchCities } from '../utils/locationService';",
            replacement: "import { fetchStates, fetchCities } from '@utils/locationService';"
        }
    ],
    "client/user/src/features/wallet/pages/Wallet.jsx": [
        {
            target: 'import { loadRazorpay } from "../config/razorpay";',
            replacement: 'import { loadRazorpay } from "@infrastructure/razorpay";'
        }
    ]
};

let injected = 0;
let failed = 0;
const changesReport = [];

Object.entries(fileMap).forEach(([srcPath, destRel]) => {
    const destPath = path.join(RepoRoot, destRel);

    console.log(`\nProcessing: ${srcPath}`);

    try {
        // Extract content from remote branch using git show
        const contentBuffer = execSync(`git show ${SourceBranch}:${srcPath}`, { stdio: ['pipe', 'pipe', 'ignore'] });
        let content = contentBuffer.toString('utf8');

        // Apply specific import replacements if configured
        if (replacements[destRel]) {
            replacements[destRel].forEach(patch => {
                if (content.includes(patch.target)) {
                    content = content.replace(patch.target, patch.replacement);
                    console.log(`  [PATCH] Replaced "${patch.target}" with "${patch.replacement}"`);
                } else {
                    // Fallback to match even if single/double quotes differ slightly
                    const targetNorm = patch.target.replace(/'/g, '"');
                    const contentNorm = content.replace(/'/g, '"');
                    if (contentNorm.includes(targetNorm)) {
                        // Find the equivalent line in the content to replace
                        const lines = content.split('\n');
                        let replacedNorm = false;
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].replace(/'/g, '"').includes(targetNorm)) {
                                console.log(`  [PATCH-NORM] Found matching normalized line: "${lines[i].trim()}"`);
                                lines[i] = patch.replacement;
                                replacedNorm = true;
                                break;
                            }
                        }
                        if (replacedNorm) {
                            content = lines.join('\n');
                        }
                    } else {
                        console.log(`  [SKIP-PATCH] Target import not found: ${patch.target}`);
                    }
                }
            });
        }

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
        console.error(`  [MISS] File not found or extraction failed: ${srcPath}`, e.message);
        failed++;
    }
});

// Save injection report summary
fs.writeFileSync(path.join(RepoRoot, 'abhiram-injection-summary.txt'), changesReport.join('\n'), 'utf8');

console.log("\n================================================================");
console.log("  INJECTION SUMMARY");
console.log(`  Successfully Injected: ${injected} files`);
console.log(`  Failed / Skipped:      ${failed} files`);
console.log("  Wrote details to:      abhiram-injection-summary.txt");
console.log("================================================================");
