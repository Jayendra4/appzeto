const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  const content = await page.evaluate(() => {
    const serializeRect = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom };
    };

    const mobileContainer = document.querySelector('[class*="mobileContainer"]');
    if (!mobileContainer) return 'NO_MOBILE_CONTAINER';
    
    const taskCards = mobileContainer.querySelectorAll('[class*="taskCard"]');
    const droppable = mobileContainer.querySelector('[class*="droppableZone"]');
    
    return {
      mcRect: serializeRect(mobileContainer),
      dropRect: serializeRect(droppable),
      firstCardRect: taskCards.length ? serializeRect(taskCards[0]) : null,
      filterBar: serializeRect(document.querySelector('[class*="filterBar"]')),
      tabBar: serializeRect(document.querySelector('[class*="tabBar"]'))
    };
  });
  
  console.log(JSON.stringify(content, null, 2));
  await browser.close();
})();
