import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = 'C:\\Users\\Rudraksh\\projects\\valdraft\\test_screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const TARGET_URL = process.argv[2] || 'http://127.0.0.1:5173';

async function runTest() {
  console.log('🚀 Launching Chrome from:', CHROME_PATH);
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.error(`[Browser PageError]:`, err);
  });

  console.log(`🌐 Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });

  console.log('📸 Taking landing screenshot...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_landing.png') });

  // Verify Landing Page Elements
  const title = await page.$eval('.hero-title', el => el.textContent);
  console.log('✅ Title verified:', title);

  // Click START SOLO MATCH (VS BOT)
  console.log('🖱️ Clicking START SOLO MATCH (VS BOT)...');
  await page.click('.btn-cyan');

  // Wait for Map reveal or draft screen
  console.log('⏳ Waiting for game start & map reveal...');
  await page.waitForSelector('.map-title', { timeout: 10000 });
  const mapName = await page.$eval('.map-title', el => el.textContent);
  console.log('🗺️ Map revealed:', mapName);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_map_reveal.png') });

  // Wait for first bidding round
  console.log('⏳ Waiting for first auction round...');
  await page.waitForSelector('.agent-name', { timeout: 15000 });
  const agentName = await page.$eval('.agent-name', el => el.textContent);
  console.log('🎴 First Agent revealed:', agentName);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_first_agent.png') });

  // Wait up to 3s for turn to be ready
  await new Promise(r => setTimeout(r, 2500));

  // Check if raise button is available
  const canRaise = await page.evaluate(() => {
    const btn = document.querySelector('.btn-raise');
    return btn && !btn.disabled;
  });
  console.log('Turn status: Can user raise now?', canRaise);

  if (canRaise) {
    console.log('💰 Clicking +250 quick bid button...');
    const quickBtns = await page.$$('.quick-btn');
    if (quickBtns.length >= 2) {
      await quickBtns[1].click(); // +250
    }
    await new Promise(r => setTimeout(r, 400));
    
    console.log('🔨 Submitting RAISE BID...');
    await page.click('.btn-raise');
    console.log('✅ Bid submitted!');
  } else {
    console.log('Waiting for Bot turn or our turn...');
  }

  // Monitor the auction over 18 seconds to ensure rounds advance smoothly
  console.log('⏳ Monitoring auction loop across 18 seconds...');
  for (let i = 1; i <= 6; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const status = await page.evaluate(() => {
      const turnPill = document.querySelector('.turn-pill');
      const timer = document.querySelector('.turn-timer');
      const roundTag = document.querySelector('.round-tag');
      const highBid = document.querySelector('.stat-value');
      const leader = document.querySelector('.leader-name');
      const curAgent = document.querySelector('.agent-name');
      return {
        turn: turnPill?.textContent?.trim(),
        time: timer?.textContent?.trim(),
        round: roundTag?.textContent?.trim(),
        agent: curAgent?.textContent?.trim(),
        highBid: highBid?.textContent?.trim(),
        leader: leader?.textContent?.trim()
      };
    });
    console.log(`⏱️ [Checkpoint ${i}] Round: ${status.round} | Agent: ${status.agent} | Turn: ${status.turn} | Time: ${status.time} | HighBid: ${status.highBid} (${status.leader})`);
    
    // If it's our turn, test pressing PASS
    const isOurTurn = await page.evaluate(() => {
      const btn = document.querySelector('.btn-pass');
      return btn && !btn.disabled;
    });

    if (isOurTurn) {
      console.log('👋 It is our turn, testing PASS button...');
      await page.click('.btn-pass');
      console.log('✅ Passed turn!');
    }
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_auction_progress.png') });
  console.log('🎉 Automated browser test successfully completed!');

  await browser.close();
}

runTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
