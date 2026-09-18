const { test, expect } = require('@playwright/test');

const base = 'http://127.0.0.1:4173';

test('landing CTAs start the local onboarding flow', async ({ page }) => {
  await page.goto(`${base}/`);
  const starts = page.locator('a[href="register.html"]');
  expect(await starts.count()).toBeGreaterThanOrEqual(4);
  await expect(starts.first()).toContainText('馬上開始');
  await expect(page.getByText('註冊即送 200 點 簡訊點數')).toBeVisible();
  await expect(page.locator('.promo')).toHaveCount(0);
  const sectionOrder = await page.locator('.related-section, .faq-section').evaluateAll((sections) => sections.map((section) => section.className));
  expect(sectionOrder).toEqual(['related-section', 'faq-section']);
  expect((await page.locator('.faq-answer').first().textContent()).length).toBeGreaterThan(40);
  await page.locator('.faq-item').first().locator('summary').click();
  await expect(page.locator('.faq-answer').first()).toBeVisible();
});

test('email registration validates and advances', async ({ page }) => {
  await page.goto(`${base}/register.html`);
  await expect(page.locator('.eyebrow')).toHaveCount(0);
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(page.locator('#name-error')).not.toBeEmpty();
  await page.locator('#name').fill('測試使用者');
  await page.locator('#email').fill('tester@example.com');
  await page.locator('#password').fill('password123');
  await page.locator('#password-confirmation').fill('password123');
  await page.locator('#terms').check();
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await expect(page).toHaveURL(/kyc\.html$/);
});

test('KYC upload flow advances', async ({ page }) => {
  await page.goto(`${base}/kyc.html`);
  await expect(page.locator('.eyebrow')).toHaveCount(0);
  await expect(page.locator('.aside')).toHaveCount(0);
  await expect(page.locator('.flow-layout > .form-shell')).toBeVisible();
  await page.locator('#real-name').fill('測試使用者');
  await page.locator('#phone').fill('0912345678');
  const image = { name: 'id.png', mimeType: 'image/png', buffer: Buffer.from('test') };
  for (const id of ['#id-front', '#id-back', '#second-front', '#second-back']) await page.locator(id).setInputFiles(image);
  await page.getByRole('button', { name: /下一步/ }).click();
  await expect(page).toHaveURL(/whitelist\.html$/);
});

test('domain choice and application flow complete', async ({ page }) => {
  await page.goto(`${base}/whitelist.html`);
  await expect(page.locator('.eyebrow')).toHaveCount(0);
  await expect(page.getByText('NCC 規範－發送簡訊，需要有自己的品牌網域')).toBeVisible();
  await page.locator('label[for="domain-buy-choice"]').click();
  await expect(page.locator('#domain-buy')).toBeVisible();
  await expect(page.locator('#domain-buy')).toContainText('總價值超過 $2,500');
  await page.locator('#sms-domain').fill('go.example.com');
  await page.locator('#brand-names').fill('Example, Example 品牌');
  await page.locator('#tax-id').fill('12345678');
  await page.locator('#company-name').fill('測試股份有限公司');
  await page.locator('#company-address').fill('台北市信義區測試路 1 號');
  await page.locator('#business-item').fill('資訊服務業');
  await page.locator('#owner-name').fill('測試負責人');
  await page.locator('#registration-pdf').setInputFiles({ name: 'registration.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-test') });
  await page.locator('#truthful').check();
  await page.getByRole('button', { name: /完成申請/ }).click();
  await expect(page).toHaveURL(/success\.html$/);
  await expect(page.getByRole('heading', { name: '申請已成功送出' })).toBeVisible();
});

for (const width of [320, 768, 1440]) {
  test(`all flow pages fit ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['index.html', 'register.html', 'kyc.html', 'whitelist.html', 'success.html']) {
      await page.goto(`${base}/${path}`);
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(hasOverflow, `${path} overflows at ${width}px`).toBe(false);
    }
  });
}
