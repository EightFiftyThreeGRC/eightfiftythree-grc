// @ts-check
const { test, expect } = require('@playwright/test');

function seedSspReviewFixture(reviewerIsSubmitter) {
  return function (isSamePerson) {
    window.state.cisoComplete = true;
    // These assertions are about the open-world dashboard's action cards, so opt
    // out of the guided post-setup journey that `home` otherwise defaults to.
    window.state.homeJourney = { mode: 'open', focus: '', deferred: {} };
    window.state.baseline = 'L';
    window.state.orgName = 'Kraper & Dramer';
    window.state.programOwner = 'David Slang';
    window.state.programOwnerEmail = 'david@test.io';
    window.state.processes = [{
      id: 'proc-is-governance',
      name: 'IS Governance',
      typeKey: 'proc_is_governance',
      category: 'is-governance',
      owner: 'David Slang',
      _builtin: true,
    }];
    window.state.users = [
      { id: 'u-ciso', name: 'David Slang', email: 'david@test.io', role: 'ciso' },
      { id: 'u-approver', name: 'John Miller', email: 'nistcsftool@gmail.com', role: 'approver' },
    ];
    var reviewer = isSamePerson
      ? { reviewerUserId: 'u-ciso', reviewerName: 'David Slang', reviewerEmail: 'david@test.io', reviewerRole: 'ciso' }
      : { reviewerUserId: 'u-approver', reviewerName: 'John Miller', reviewerEmail: 'nistcsftool@gmail.com', reviewerRole: 'approver' };
    window.state.sspSignoffs = window.state.sspSignoffs || {};
    window.state.sspSignoffs['proc-is-governance'] = Object.assign({
      status: 'Submitted',
      signedBy: 'David Slang',
      signedDate: '2026-06-25',
    }, reviewer);
    window.state.controlReviewQueue = [{
      type: 'ssp',
      assetId: 'proc-is-governance',
      assetName: 'IS Governance',
      isProcessSsp: true,
      submittedBy: 'David Slang',
      date: '2026-06-25',
      status: 'Pending',
      reviewerUserId: reviewer.reviewerUserId,
      reviewerName: reviewer.reviewerName,
      reviewerEmail: reviewer.reviewerEmail,
      reviewerRole: reviewer.reviewerRole,
    }];
  };
}

test('Designated reviewer sees Command Center Review SSP action', async function ({ page }) {
  var errors = [];
  page.on('pageerror', function (e) { errors.push(String(e)); });

  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function () {
    return typeof window.state !== 'undefined' && typeof window.hubOpenQueuedSsp === 'function';
  }, { timeout: 15000 });

  await page.evaluate(seedSspReviewFixture(false), false);
  await page.evaluate(function () {
    window.state.currentUserId = 'u-approver';
    if (typeof window.applyRoleView === 'function') window.applyRoleView('u-approver');
    window.showTab('home');
    window.renderHomeTab();
  });

  var btn = page.locator('.hub-action-card').filter({ hasText: 'Review SSP: IS Governance' });
  await expect(btn).toBeVisible({ timeout: 10000 });
  await expect(btn).toHaveAttribute('data-hub-action', 'ssp-review');
  await btn.click();

  await expect(page.locator('#tab-asset')).toHaveClass(/active/);
  await expect(page.locator('#asset-step-1-body')).toContainText(/IS Governance|SSP review|Control attestations/i);
  await expect(page.locator('#asset-step-1-body')).toContainText(/Approve package/i);
  expect(errors).toEqual([]);
});

test('Submitter cannot review own SSP when another reviewer is assigned', async function ({ page }) {
  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function () {
    return typeof window.state !== 'undefined' && typeof window.getNextActions === 'function';
  }, { timeout: 15000 });

  await page.evaluate(seedSspReviewFixture(false), false);
  await page.evaluate(function () {
    window.state.currentUserId = 'u-ciso';
    if (typeof window.applyRoleView === 'function') window.applyRoleView('u-ciso');
    window.showTab('home');
    window.renderHomeTab();
  });

  await expect(page.locator('.hub-action-card').filter({ hasText: 'Review SSP: IS Governance' })).toHaveCount(0);
  await expect(page.locator('.hub-action-card').filter({ hasText: 'SSP awaiting review: IS Governance' })).toBeVisible();

  var canAct = await page.evaluate(function () {
    return window.sspReviewerCanActOnPackage('proc-is-governance');
  });
  expect(canAct).toBe(false);
});

test('Program owner admin mode does not inherit all pending SSP reviews', async function ({ page }) {
  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function () {
    return typeof window.getSspReviewQueueItemsForUser === 'function';
  }, { timeout: 15000 });

  await page.evaluate(seedSspReviewFixture(false), false);
  await page.evaluate(function () {
    window.state.currentUserId = null;
    if (typeof window.applyRoleView === 'function') window.applyRoleView('admin');
  });

  var queueLen = await page.evaluate(function () {
    return window.getSspReviewQueueItemsForUser(null).length;
  });
  expect(queueLen).toBe(0);

  var canAct = await page.evaluate(function () {
    return window.sspReviewerCanActOnPackage('proc-is-governance');
  });
  expect(canAct).toBe(false);
});
