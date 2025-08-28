import { test, expect } from '@playwright/test';

test.describe('E2E - 단일 일정 삭제', () => {
  test('단일 일정 삭제가 성공하고 화면에서 사라진다', async ({ page }) => {
    await page.goto('/');

    const todayStr = (() => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    })();

    await page.locator('text=일정 추가').first().click();
    const uniqueTitle = `삭제 테스트 ${Math.random().toString(36).slice(2, 7)}`;
    await page.fill('input[id="title"]', uniqueTitle);
    await page.fill('input[id="date"]', todayStr);
    await page.fill('input[id="start-time"]', '09:00');
    await page.fill('input[id="end-time"]', '10:00');
    await page.locator('[aria-labelledby="category-label"]').click();
    await page
      .getByRole('option', { name: /개인|업무/ })
      .first()
      .click();
    await page.getByTestId('event-submit-button').click();

    const overlapDialog = page.getByRole('dialog', { name: '일정 겹침 경고' });
    if (await overlapDialog.isVisible().catch(() => false)) {
      await overlapDialog.getByRole('button', { name: '계속 진행' }).click();
    }
    await expect(page.getByText('일정이 추가되었습니다.')).toBeVisible();

    const beforeCount = await page.locator('button[aria-label^="Delete event"]').count();
    const beforeTitleCount = await page.getByText(uniqueTitle).count();

    const titleNode = page.getByTestId('event-list').getByText(uniqueTitle).first();
    const deleteBtn = titleNode
      .locator('xpath=ancestor::*[contains(@class, "MuiBox-root")][1]')
      .locator('xpath=.//button[starts-with(@aria-label, "Delete event")]');
    await deleteBtn.first().click();

    await expect(page.getByText('일정이 삭제되었습니다.')).toBeVisible();
    const afterTitleCount = await page.getByText(uniqueTitle).count();
    expect(afterTitleCount).toBeLessThan(beforeTitleCount);

    const afterCount = await page.locator('button[aria-label^="Delete event"]').count();
    expect(afterCount).toBe(beforeCount - 1);

    await expect(page.getByLabel('반복 일정 아이콘').first()).toBeVisible();
  });
});
