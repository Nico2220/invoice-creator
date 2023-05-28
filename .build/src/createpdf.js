const Chromium = require("chrome-aws-lambda");

export async function createAndUploadPdfONS3() {
  let browser;

  try {
    browser = await Chromium.puppeteer.launch({
      args: Chromium.args,
      defaultViewport: Chromium.defaultViewport,
      executablePath: await Chromium.executablePath,
      headless: Chromium.headless,
      ignoreHTTPSErrors: true,
    });

    let page = await browser.newPage();

    await page.goto("https://www.google.com/");

    const result = await page.title();
    return result;
  } catch (error) {
    await browser.close();
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
