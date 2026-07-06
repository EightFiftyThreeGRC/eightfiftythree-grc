// @ts-check
const { test, expect } = require('@playwright/test');

test('Command Center Review SSP opens read-only process SSP', async function ({ page }) {
  var errors = [];
  page.on('pageerror', function (e) { errors.push(String(e)); });

  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function () {
    return typeof window.state !== 'undefined' && typeof window.hubOpenQueuedSsp === 'function';
  }, { timeout: 15000 });

  await page.evaluate(function () {
    if (typeof window.hideCloudSignInGate === 'function') window.hideCloudSignInGate();
    window.state.cisoComplete = true;
    window.state.baseline = 'L';
    window.state.orgName = 'Kraper & Dramer';
    window.state.programOwner = 'David Slang';
    window.state.processes = [{
      id: 'proc-is-governance',
      name: 'IS Governance',
      typeKey: 'proc_is_governance',
      category: 'is-governance',
      owner: 'David Slang',
      _builtin: true,
    }];
    window.state.sspSignoffs = window.state.sspSignoffs || {};
    window.state.sspSignoffs['proc-is-governance'] = {
      status: 'Submitted',
      signedBy: 'David Slang',
      signedDate: '2026-06-25',
      reviewerUserId: 'u-ciso',
      reviewerName: 'David Slang',
      reviewerEmail: 'david@test.io',
      reviewerRole: 'ciso',
    };
    window.state.controlReviewQueue = [{
      type: 'ssp',
      assetId: 'proc-is-governance',
      assetName: 'IS Governance',
      isProcessSsp: true,
      submittedBy: 'David Slang',
      date: '2026-06-25',
      status: 'Pending',
      reviewerUserId: 'u-ciso',
      reviewerName: 'David Slang',
      reviewerEmail: 'david@test.io',
      reviewerRole: 'ciso',
    }];
    window.state.users = window.state.users || [];
    if (!window.state.users.find(function (u) { return u.id === 'u-ciso'; })) {
      window.state.users.push({
        id: 'u-ciso',
        name: 'David Slang',
        email: 'david@test.io',
        role: 'ciso',
      });
    }
    window.state.currentUserId = 'u-ciso';
    if (typeof window.applyRoleView === 'function') window.applyRoleView('u-ciso');
    window.showTab('home');
    window.renderHomeTab();
  });

  var btn = page.locator('.hub-action-card').filter({ hasText: 'Review SSP: IS Governance' });
  await expect(btn).toBeVisible({ timeout: 10000 });

  await expect(btn).toHaveAttribute('data-hub-action', 'ssp-review');
  await btn.click();

  await page.waitForTimeout(500);

  var activeTab = await page.evaluate(function () {
    var el = document.querySelector('.tab-panel.active');
    return el ? el.id : null;
  });
  // eslint-disable-next-line no-console
  console.log('activeTab=', activeTab, 'errors=', errors);

  await expect(page.locator('#tab-asset')).toHaveClass(/active/);
  await expect(page.locator('#asset-step-1-body')).toContainText(/IS Governance|SSP review|Control attestations/i);
  expect(errors).toEqual([]);
});
