const fs = require('fs');
const path = require('path');
const testsDir = path.join('c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/server/tests');
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js'));

for (const file of files) {
  const filePath = path.join(testsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('otp:') && (content.includes('/api/user/auth/register') || content.includes('/api/owner/auth/register'))) {
    if (!content.includes('import jwt from "jsonwebtoken"') && !content.includes("import jwt from 'jsonwebtoken'")) {
      content = content.replace(/import request from ['"]supertest['"];/, 'import request from "supertest";\nimport jwt from "jsonwebtoken";');
    }
    
    // Replace the specific properties `otp: ..., phoneOtp: ...` with registrationToken logic.
    content = content.replace(/otp:\s*["'\w]+,?\s*phoneOtp:\s*["'\w]+,?/g, 'registrationToken: jwt.sign({ verifiedEmail: "test@test.com", otpVerified: true }, process.env.JWT_SECRET || "default_jwt_secret", { expiresIn: "30m" }),');
    
    fs.writeFileSync(filePath, content);
    console.log('Updated', file);
  }
}
