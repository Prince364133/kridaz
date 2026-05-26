const fs = require('fs');
const file = 'server/modules/auth/auth.controller.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove testOtp from Responses
content = content.replace(/testOtp: \{ email: emailOtp, phone: phoneOtp \}/g, `...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? { testOtp: { email: emailOtp, phone: phoneOtp } } : {})`);
content = content.replace(/testOtp: \{ phone: phoneOtp \}/g, `...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? { testOtp: { phone: phoneOtp } } : {})`);
content = content.replace(/testOtp: \{ phone: emailOtp \}/g, `...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? { testOtp: { phone: emailOtp } } : {})`);
content = content.replace(/testOtp: \{ email: emailOtp \}/g, `...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? { testOtp: { email: emailOtp } } : {})`);

// 2. Remove Universal OTP Bypass
content = content.replace(/otp === "123456"/g, `(process.env.NODE_ENV === 'test' && otp === "123456")`);

// 3. Remove Fallback JWT Secrets
content = content.replace(/process\.env\.JWT_SECRET \|\| "default_jwt_secret"/g, `process.env.JWT_SECRET`);

// 4. Remove Sensitive Console Logs
content = content.replace(/console\.log\("GOOGLE AUTH REQ BODY:", req\.body\);/g, `// console.log("GOOGLE AUTH REQ BODY:", { ...req.body, credential: "[REDACTED]", password: "[REDACTED]" });`);

// 5. Genericize Error Responses
content = content.replace(/res\.status\(500\)\.json\(\{ success: false, message: err\.message \}\)/g, `res.status(500).json({ success: false, message: "Internal Server Error" })`);
content = content.replace(/message: err\.message \|\| "Internal server error"/g, `message: "Internal server error"`);

fs.writeFileSync(file, content);
console.log('auth.controller.js updated');
