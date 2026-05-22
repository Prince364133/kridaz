async function testAuthFlow() {
  console.log("=== Testing Auth Flow ===");
  try {
    const testEmail = `testuser_${Date.now()}@example.com`;
    
    console.log(`[1] Sending OTP for Signup (Email: ${testEmail})...`);
    let otpResponse = await fetch('http://localhost:5174/api/user/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    
    let otpText = await otpResponse.text();
    let otpData;
    try {
      otpData = JSON.parse(otpText);
    } catch(e) {
      console.error("Failed to parse JSON for OTP:", otpText);
      return;
    }
    console.log("OTP Response:", otpData);
    
    // Check if testOtp was sent
    const otpCode = otpData.testOtp ? otpData.testOtp.email : "123456";
    console.log(`[2] OTP Code obtained: ${otpCode}`);
    
    console.log(`[3] Simulating Registration API...`);
    let registerResponse = await fetch('http://localhost:5174/api/user/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        otp: String(otpCode),
        password: "testpassword123",
        role: "user",
        fullName: "Test User",
        dob: "1990-01-01",
        gender: "Male"
      })
    });
    let registerText = await registerResponse.text();
    let registerData;
    try {
      registerData = JSON.parse(registerText);
    } catch(e) {
      console.error("Failed to parse JSON for Register:", registerText);
      return;
    }
    console.log("Register Response:", registerData);
    
    console.log(`[4] Testing Login Flow (Step 1)...`);
    let loginStep1Response = await fetch('http://localhost:5174/api/user/auth/login-step1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: "testpassword123"
      })
    });
    let loginText = await loginStep1Response.text();
    let loginData;
    try {
      loginData = JSON.parse(loginText);
    } catch(e) {
      console.error("Failed to parse JSON for Login:", loginText);
      return;
    }
    console.log("Login Step 1 Response:", loginData);
    
    if (loginData.token) {
      console.log("✅ Success! Token received. User successfully signed up and logged in.");
    } else if (loginData.requiresOtp) {
      console.log("⚠️ Step 1 requested OTP verification for login, test login-step2 via login route if implemented.");
    } else {
      console.log("❌ Unexpected login response");
    }

  } catch (error) {
    console.error("❌ Test Failed:", error.message);
  }
}

testAuthFlow();
