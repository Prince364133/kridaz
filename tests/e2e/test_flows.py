import asyncio
from playwright.async_api import async_playwright
import time

async def run_e2e():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False) # Headless=False to see what's happening
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()

        print("--- [STEP 1] Login as User ---")
        await page.goto("http://localhost:5174/login")
        await page.fill('input[type="email"]', "testuser@gmail.com")
        await page.fill('input[type="password"]', "userpassword")
        await page.click('button:has-text("Continue")')
        
        # Wait for redirect
        await page.wait_for_url("http://localhost:5174/")
        print("Logged in as User.")

        print("--- [STEP 2] Go to Booking History ---")
        await page.goto("http://localhost:5174/history")
        
        # Find the booking in IN_REVIEW_WINDOW
        # We look for "Raise Dispute" button
        print("Waiting for Raise Dispute button...")
        try:
            dispute_btn = page.locator('button:has-text("Raise Dispute")').first
            await dispute_btn.wait_for(state="visible", timeout=10000)
            await dispute_btn.click()
            print("Clicked Raise Dispute.")
        except Exception as e:
            print("Failed to find Raise Dispute button. Is there a booking in IN_REVIEW_WINDOW?")
            await page.screenshot(path="error_history.png")
            await browser.close()
            return

        print("--- [STEP 3] Fill Dispute Modal ---")
        await page.fill('textarea[placeholder*="reason"]', "The turf was not clean and there was no water.")
        # Optional: upload images if needed, but for now just text
        await page.click('button:has-text("Submit Dispute")')
        print("Dispute submitted.")
        
        # Wait for toast or modal close
        await asyncio.sleep(2)

        print("--- [STEP 4] Logout ---")
        await page.goto("http://localhost:5174/profile")
        await page.click('button:has-text("Sign Out")')
        await page.wait_for_url("http://localhost:5174/login")
        print("Logged out.")

        print("--- [STEP 5] Login as Admin ---")
        await page.fill('input[type="email"]', "admin@kridaz.com")
        await page.fill('input[type="password"]', "adminpassword")
        await page.click('button:has-text("Continue")')
        
        # Admin should redirect to /admin
        await page.wait_for_url("**/admin**")
        print("Logged in as Admin.")

        print("--- [STEP 6] Go to Dispute Manager ---")
        await page.goto("http://localhost:5174/admin/disputes")
        
        # Find the dispute
        print("Waiting for Resolve button...")
        resolve_btn = page.locator('button:has-text("Resolve Case")').first
        await resolve_btn.wait_for(state="visible", timeout=10000)
        await resolve_btn.click()
        print("Opening resolution modal.")

        print("--- [STEP 7] Approve Payout ---")
        await page.click('button:has-text("Approve Payout")')
        await page.click('button:has-text("Confirm Resolution")')
        print("Resolution confirmed.")

        await asyncio.sleep(3)
        await page.screenshot(path="final_admin_state.png")
        print("E2E Test Complete.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_e2e())
