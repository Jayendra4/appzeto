const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  const content = await page.evaluate(() => {
    const mobileContainer = document.querySelector('[class*="mobileContainer"]');
    if (!mobileContainer) return 'NO_MOBILE_CONTAINER';
    
    const taskCards = mobileContainer.querySelectorAll('[class*="taskCard"]');
    const droppable = mobileContainer.querySelector('[class*="droppableZone"]');
    const emptyState = mobileContainer.querySelector('[class*="emptyState"]');
    
    return {
      mobileContainerHTML: mobileContainer.outerHTML,
      numCards: taskCards.length,
      hasDroppable: !!droppable,
      hasEmptyState: !!emptyState,
      droppableHTML: droppable ? droppable.outerHTML : null
    };
  });
  
  console.log(JSON.stringify(content, null, 2));
  await browser.close();
})();
