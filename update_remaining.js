const fs = require('fs');

// 1. admin.middleware.js
let adminMwFile = 'server/middleware/jwt/admin.middleware.js';
if (fs.existsSync(adminMwFile)) {
    let content = fs.readFileSync(adminMwFile, 'utf8');
    content = content.replace(/console\.warn\(\"Admin Access Denied\. Token Role:\", role, \"Full Payload:\", decoded\);/g, `console.warn("Admin Access Denied. Token Role:", role);`);
    content = content.replace(/error: error\.message/g, `error: "Invalid or expired token"`);
    fs.writeFileSync(adminMwFile, content);
    console.log('admin.middleware.js updated');
}

// 2. nuke_and_seed_admin.js
let seedFile = 'server/scripts/nuke_and_seed_admin.js';
if (fs.existsSync(seedFile)) {
    let content = fs.readFileSync(seedFile, 'utf8');
    content = content.replace(/const password = \"3641333\";/g, `const password = process.env.ADMIN_SEED_PASSWORD || crypto.randomBytes(8).toString('hex'); // Fallback to random if env not set`);
    content = content.replace(/console\.log\(\`Password: \$\{password\}\`\);/g, `// console.log(\`Password: \${password}\`); // Removed for security`);
    // Need to make sure crypto is imported if not already. Let's just use a static string if env is missing since it's a script, or we can just require crypto.
    if (!content.includes('import crypto') && !content.includes('require("crypto")')) {
        content = "import crypto from 'crypto';\n" + content;
    }
    fs.writeFileSync(seedFile, content);
    console.log('nuke_and_seed_admin.js updated');
}

// 3. SignUp.jsx
let signUpFile = 'client/user/src/features/auth/pages/SignUp.jsx';
if (fs.existsSync(signUpFile)) {
    let content = fs.readFileSync(signUpFile, 'utf8');
    content = content.replace(/console\.log\(\"GOOGLE RESPONSE:\", googleResponse\);/g, `// console.log("GOOGLE RESPONSE received");`);
    content = content.replace(/console\.log\(\"SENDING PAYLOAD:\", payload\);/g, `// console.log("SENDING PAYLOAD");`);
    fs.writeFileSync(signUpFile, content);
    console.log('SignUp.jsx updated');
}

// 4. Navbar.jsx
let navFile = 'client/user/src/shared/components/layout/Navbar.jsx';
if (fs.existsSync(navFile)) {
    let content = fs.readFileSync(navFile, 'utf8');
    content = content.replace(/console\.log\(\"Navbar Auth State:\", \{ isLoggedIn, role, userRole: user\?\.role \}\);/g, `// Auth state log removed`);
    fs.writeFileSync(navFile, content);
    console.log('Navbar.jsx updated');
}
