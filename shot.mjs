import { chromium } from 'playwright';
import fs from 'node:fs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 430, height: 1400 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

const names = ['阿哲','小满🌹','明明','大鹏🌹','周予安','林青','Kai','陈默🌹','小北','周一','许知远','叶子🌹','Momo','球友14🌹'];
await page.fill('textarea.chain-input', `10月29日 周四 19:00-21:00 羽毛球\n地点：星光羽毛球馆\n` + names.map((n,i)=>`${i+1}. ${n}`).join('\n'));
await page.click('text=识别名单');
await page.waitForTimeout(400);
await page.click('text=下一步：分组');
await page.waitForTimeout(400);
await page.click('button:has-text("生成海报")');
await page.waitForTimeout(2000);

const dataUrl = await page.evaluate(() => document.querySelector('canvas')?.toDataURL('image/png') ?? null);
if (dataUrl) {
  fs.writeFileSync('screenshots/poster-pink.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('已保存');
}
await browser.close();
