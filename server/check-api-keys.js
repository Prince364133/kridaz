import { google } from 'googleapis';
import fs from 'fs';
const key = JSON.parse(fs.readFileSync('./config/firebase-service-account.json', 'utf8'));

const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

async function run() {
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;
    
    console.log("Fetching Identity Toolkit Config...");
    const configRes = await fetch(`https://identitytoolkit.googleapis.com/v2/projects/${key.project_id}/config`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const configData = await configRes.json();
    console.log("Authorized Domains:");
    console.log(JSON.stringify(configData.authorizedDomains, null, 2));

  } catch (err) {
    console.error(err);
  }
}
run();
