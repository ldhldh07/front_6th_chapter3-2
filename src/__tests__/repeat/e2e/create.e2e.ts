import { test, expect } from '@playwright/test';

test.describe('E2E - 기본 + 반복 아이콘', () => {
  test('앱이 로드되고 기본 UI가 보인다', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=일정 추가').first()).toBeVisible();
    await expect(page.locator('text=검색').first()).toBeVisible();
  });

  test('반복 일정 저장 시 캘린더 셀에 아이콘이 보인다', async ({ page }) => {
    await page.goto('/');

    await page.locator('text=일정 추가').first().click();
    await page.fill('input[id="title"]', '반복 회의');
    const todayStr = (() => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    })();
    await page.fill('input[id="date"]', todayStr);
    await page.fill('input[id="start-time"]', '09:00');
    await page.fill('input[id="end-time"]', '10:00');

    await page.locator('[aria-labelledby="category-label"]').click();
    await page.getByRole('option', { name: /업무/ }).click();

    await page.locator('text=반복 일정').click();
    await page.getByRole('combobox', { name: '반복 유형' }).click();
    await page.getByRole('option', { name: '매일' }).click();

    await page.getByTestId('event-submit-button').click();

    const overlapDialog = page.getByRole('dialog', { name: '일정 겹침 경고' });
    if (await overlapDialog.isVisible().catch(() => false)) {
      await overlapDialog.getByRole('button', { name: '계속 진행' }).click();
    }

    await expect(page.getByText('일정이 추가되었습니다.')).toBeVisible();

    await expect(page.getByLabel('반복 일정 아이콘').first()).toBeVisible();
  });
});
