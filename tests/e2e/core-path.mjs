import { chromium } from 'playwright';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5174/';
const username = process.env.E2E_USERNAME || process.env.DATAGOV_BOOTSTRAP_ADMIN_USERNAME || 'admin';
const password = process.env.E2E_PASSWORD || process.env.DATAGOV_BOOTSTRAP_ADMIN_PASSWORD || 'DataGov@123';
const headless = process.env.E2E_HEADLESS !== 'false';

const browser = await chromium.launch({ headless });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

try {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      console.log(`[browser:${message.type()}] ${message.text()}`);
    }
  });

  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.getByLabel('工号、域账号或邮箱').fill(username);
  await page.getByLabel('安全密码').fill(password);
  await page.getByRole('button', { name: /登录|进入|提交/ }).click();

  await page.getByText('DataGov', { exact: true }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: '数据开发' }).click();
  await page.getByRole('button', { name: '脚本开发', exact: true }).click();
  await page.getByText('脚本开发').first().waitFor({ timeout: 15000 });

  await page.getByLabel('打开 AI 助手').click();
  await page.getByRole('heading', { name: 'DataGov AI Copilot' }).waitFor({ timeout: 15000 });
  await page.getByText(/能力：|方言：/).waitFor({ timeout: 15000 });

  console.log('ok - playwright core path');
} finally {
  await browser.close();
}
