// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('EightFiftyThree GRC smoke', function() {

  test('landing page loads and links to app', async function({ page }) {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('NIST 800-53');
    await expect(page.getByRole('link', { name: /Launch app/i }).first()).toBeVisible();
  });

  test('app shell loads with core globals', async function({ page }) {
    await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(function() {
      return typeof window.state !== 'undefined' && typeof window.showTab === 'function';
    }, { timeout: 15000 });
    var tabs = await page.evaluate(function() { return window.TAB_IDS; });
    expect(tabs).toContain('home');
    expect(tabs).toContain('reports');
    expect(tabs).toContain('frameworks');
  });

  test('program setup step renders when invoked', async function({ page }) {
    await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(function() {
      return typeof window.renderCISOStep1 === 'function';
    });
    await page.evaluate(function() { window.renderCISOStep1(); });
    await expect(page.locator('#ciso-step-1-body')).not.toBeEmpty({ timeout: 10000 });
  });

  test('XMPL snapshot loads and command center appears', async function({ page }) {
    await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(function() {
      if (window.state) {
        window.state.cisoComplete = true;
        window.state.baseline = 'L';
        window.state.orgName = 'Test Org';
      }
    });
    await page.evaluate(function() {
      if (typeof window.renderHomeTab === 'function') window.renderHomeTab();
      else if (typeof window.showTab === 'function') window.showTab('home');
    });
    await expect(page.locator('#home-body')).toContainText(/Command Center|Test Org|program/i, { timeout: 10000 });
  });

  test('framework alignment tab shows crosswalk', async function({ page }) {
    await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(function() { return typeof window.renderFrameworksTab === 'function'; });
    await page.evaluate(function() {
      if (window.state) { window.state.baseline = 'L'; window.state.cisoComplete = true; }
      window.renderFrameworksTab();
    });
    await expect(page.locator('#frameworks-body')).toContainText(/ISO 27001|SOC 2|HIPAA/i);
  });

});
