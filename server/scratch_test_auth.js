import axios from 'axios';
import { prisma } from './config/prisma.js';

const BACKEND_URL = 'http://localhost:6001';

async function runTests() {
  const uniqueId = Date.now();
  const testEmail = `player_${uniqueId}@kridaz.test`;
  const testUsername = `player_${uniqueId}`;
  // Generate a random 10-digit phone number starting with 9
  const testPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const testPassword = 'Password123!';

  console.log(`\n========================================`);
  console.log(`[INTEGRATION TEST] Starting signup and login verification`);
  console.log(`Test Email: ${testEmail}`);
  console.log(`Test Username: ${testUsername}`);
  console.log(`Test Phone: ${testPhone}`);
  console.log(`========================================\n`);

  // STEP 1: Request OTP
  console.log(`[STEP 1] Requesting OTP for ${testEmail}...`);
  let sendOtpResponse;
  try {
    sendOtpResponse = await axios.post(`${BACKEND_URL}/api/user/auth/send-otp`, {
      email: testEmail,
      phone: testPhone
    });
    console.log(`[STEP 1 SUCCESS] Backend response:`, sendOtpResponse.data);
  } catch (error) {
    console.error(`[STEP 1 FAILED] Error sending OTP:`, error.response?.data || error.message);
    throw error;
  }

  // STEP 2: Fetch Email OTP from Database
  console.log(`\n[STEP 2] Fetching OTP from Postgres Database...`);
  let otpRecord;
  // Poll a few times if necessary, although it should be immediate
  for (let i = 0; i < 5; i++) {
    otpRecord = await prisma.oTP.findUnique({
      where: { email: testEmail }
    });
    if (otpRecord) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (!otpRecord) {
    throw new Error(`[STEP 2 FAILED] No OTP record found in DB for email ${testEmail}`);
  }

  console.log(`[STEP 2 SUCCESS] Retrieved from DB:`);
  console.log(`- Email OTP: ${otpRecord.emailOtp}`);
  console.log(`- Phone OTP in DB: ${otpRecord.phoneOtp}`);

  // STEP 3: Register User (Verify using Email OTP from DB, and test bypass phone OTP '123456')
  console.log(`\n[STEP 3] Submitting Registration Form...`);
  console.log(`- Using Email OTP: ${otpRecord.emailOtp}`);
  console.log(`- Using Phone OTP: 123456 (Bypass OTP test)`);

  let registerResponse;
  try {
    registerResponse = await axios.post(`${BACKEND_URL}/api/user/auth/register`, {
      name: 'Integration Test Player',
      username: testUsername,
      email: testEmail,
      phone: testPhone,
      gender: 'Male',
      location: 'Mumbai',
      password: testPassword,
      confirmPassword: testPassword,
      otp: otpRecord.emailOtp,
      phoneOtp: '123456', // Test bypass code!
      sportTypes: ['Cricket']
    });
    console.log(`[STEP 3 SUCCESS] User registered successfully!`);
    console.log(`- User ID: ${registerResponse.data.user?.id}`);
    console.log(`- Role: ${registerResponse.data.role}`);
    console.log(`- Token returned: ${registerResponse.data.token ? 'YES' : 'NO'}`);
  } catch (error) {
    console.error(`[STEP 3 FAILED] Registration failed:`, error.response?.data || error.message);
    throw error;
  }

  // STEP 4: Login direct flow verification (Direct token issuance, no OTP requirements)
  console.log(`\n[STEP 4] Verifying direct Login Flow for ${testEmail}...`);
  let loginResponse;
  try {
    loginResponse = await axios.post(`${BACKEND_URL}/api/user/auth/login-step1`, {
      email: testEmail,
      password: testPassword
    });

    console.log(`[STEP 4 SUCCESS] Login completed!`);
    console.log(`- Response keys:`, Object.keys(loginResponse.data));
    console.log(`- Token present: ${loginResponse.data.token ? 'YES' : 'NO'}`);
    console.log(`- Requires OTP: ${loginResponse.data.requiresOtp ? 'YES' : 'NO'}`);

    if (loginResponse.data.token && !loginResponse.data.requiresOtp) {
      console.log(`\n========================================`);
      console.log(`🎉 [SUCCESS] Direct Login bypass OTP works perfectly!`);
      console.log(`🎉 [SUCCESS] Signup phone test OTP '123456' bypass works perfectly!`);
      console.log(`========================================\n`);
    } else {
      console.warn(`\n[WARNING] Login response does not match direct bypass expectations.`);
    }
  } catch (error) {
    console.error(`[STEP 4 FAILED] Login step failed:`, error.response?.data || error.message);
    throw error;
  }
}

runTests()
  .catch(e => {
    console.error(`\n❌ [TEST SUITE RUNTIME FAILURE]:`, e.message);
    process.exit(1);
  });
