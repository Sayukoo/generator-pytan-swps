const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs').promises;

(async () => {
  const server = http.createServer(async (req, res) => {
    const filePath = path.join(__dirname, req.url);
    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200);
      res.end(data);
    } catch (err) {
      res.writeHead(404);
      res.end('File not found');
    }
  }).listen();

  const { port } = server.address();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  let failed = 0;
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('QUnit.done')) {
      const match = text.match(/QUnit.done\((.*)\)/);
      if (match) {
        const details = JSON.parse(match[1]);
        failed = details.failed;
        console.log(`Total: ${details.total}, Failed: ${details.failed}, Passed: ${details.passed}, Runtime: ${details.runtime}`);
      }
    } else {
      console.log(text);
    }
  });

  await page.goto(`http://localhost:${port}/tests/test-runner.html`);

  await page.evaluate(() => {
    return new Promise(resolve => {
      QUnit.done(details => {
        console.log(`QUnit.done(${JSON.stringify(details)})`);
        resolve();
      });
    });
  });

  await browser.close();
  server.close();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
