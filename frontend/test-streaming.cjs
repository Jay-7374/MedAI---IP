const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/chatbot-dev');

  try {
    await page.waitForSelector('textarea', { timeout: 5000 });
  } catch (e) {
    await page.getByText('New Chat').click();
    await page.waitForSelector('textarea', { timeout: 5000 });
  }

  const prompt = "TEST_STREAM_DELAY";
  await page.fill('textarea', prompt);
  
  console.log("[TEST] Sending prompt:", prompt);
  await page.keyboard.press('Enter');

  const startTime = Date.now();
  let lastText = "";
  
  // Poll the last message bubble text every 200ms
  const interval = setInterval(async () => {
    try {
      const messages = await page.locator('.message-bubble.assistant').allTextContents();
      if (messages.length > 0) {
        const text = messages[messages.length - 1];
        if (text !== lastText) {
          console.log(`[${Date.now() - startTime}ms] UPDATE: "${text.trim()}"`);
          lastText = text;
        }
      }
    } catch(e) {}
  }, 200);

  // Wait 6 seconds to capture all chunks
  await page.waitForTimeout(6000);
  clearInterval(interval);
  console.log("[TEST] Delay test done. Testing Groq test...");

  await page.getByText('New Chat').click();
  await page.waitForSelector('textarea', { timeout: 5000 });

  const realPrompt = "Explain diabetes, its causes, symptoms, diagnosis, treatment, complications, and prevention in detail.";
  await page.fill('textarea', realPrompt);
  
  console.log("[TEST] Sending prompt:", realPrompt);
  await page.keyboard.press('Enter');
  
  const startTime2 = Date.now();
  let lastText2 = "";
  
  // Poll the last message bubble text every 500ms
  const interval2 = setInterval(async () => {
    try {
      const messages = await page.locator('.message-bubble.assistant').allTextContents();
      if (messages.length > 0) {
        const text = messages[messages.length - 1];
        if (text !== lastText2) {
          console.log(`[${Date.now() - startTime2}ms] UPDATE (length): ${text.length}`);
          lastText2 = text;
        }
      }
    } catch(e) {}
  }, 500);

  await page.waitForTimeout(10000);
  clearInterval(interval2);
  
  console.log("[TEST] Done.");
  await browser.close();
})();
