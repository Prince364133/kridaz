const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("Fetching latest origin...");
execSync('git fetch origin');

console.log("Analyzing diff...");
const diffOutput = execSync('git diff origin/main..origin/sunny --name-status client/user/src').toString().trim().split('\n');

const changes = [];

for (const line of diffOutput) {
    if (!line) continue;
    const parts = line.split('\t');
    const status = parts[0].trim();
    
    if (status.startsWith('R')) {
        const oldPath = parts[1].trim();
        const newPath = parts[2].trim();
        
        if (!oldPath.startsWith('client/user/src/')) continue;
        
        console.log(`[RENAME] Updating ${oldPath} from ${newPath}`);
        try {
            const content = execSync(`git show origin/sunny:${newPath}`).toString();
            fs.writeFileSync(oldPath, content);
            changes.push(`Updated ${oldPath}`);
        } catch (e) {
            console.error(`Failed to inject ${oldPath}`);
        }
    } else if (status === 'M') {
        const filePath = parts[1].trim();
        if (filePath.startsWith('client/user/src/')) {
            console.log(`[MODIFIED] Updating ${filePath}`);
            try {
                const content = execSync(`git show origin/sunny:${filePath}`).toString();
                fs.writeFileSync(filePath, content);
                changes.push(`Updated ${filePath}`);
            } catch (e) {
                console.error(`Failed to inject ${filePath}`);
            }
        }
    } else if (status === 'A') {
        const newPath = parts[1].trim();
        if (!newPath.startsWith('client/user/src/user/')) continue;
        
        let targetPath = newPath;
        if (newPath.includes('/components/turf/')) {
             targetPath = newPath.replace('client/user/src/user/components/turf/', 'client/user/src/features/turf/components/');
        } else if (newPath.includes('/pages/checkout/')) {
             targetPath = 'client/user/src/features/turf/pages/CheckoutPage.jsx';
        } else if (newPath.includes('/pages/reels/')) {
             targetPath = newPath.replace('client/user/src/user/pages/reels/', 'client/user/src/features/reels/pages/');
        } else if (newPath.includes('/hooks/use')) {
             targetPath = newPath.replace('client/user/src/user/hooks/', 'client/user/src/shared/hooks/');
        } else if (newPath.includes('/pages/auth/')) {
             targetPath = newPath.replace('client/user/src/user/pages/auth/', 'client/user/src/features/auth/pages/');
        } else if (newPath.includes('/pages/business/')) {
             targetPath = newPath.replace('client/user/src/user/pages/business/', 'client/user/src/features/business/pages/');
        } else if (newPath.includes('/pages/')) {
             targetPath = newPath.replace('client/user/src/user/pages/', 'client/user/src/pages/');
        } else {
             targetPath = newPath.replace('client/user/src/user/', 'client/user/src/');
        }
        
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        console.log(`[ADDED] Creating ${targetPath} from ${newPath}`);
        try {
            const content = execSync(`git show origin/sunny:${newPath}`).toString();
            fs.writeFileSync(targetPath, content);
            changes.push(`Added ${targetPath}`);
        } catch (e) {
            console.error(`Failed to inject ${targetPath}`);
        }
    }
}

fs.writeFileSync('injection-summary.txt', changes.join('\n'));
console.log("Injection complete! Wrote summary to injection-summary.txt");
