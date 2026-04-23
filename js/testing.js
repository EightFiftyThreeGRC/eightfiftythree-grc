// js/testing.js — control tester tab, test adequacy. Split from app.js (Step 6).
// Globals only; load after assets.js.

// ============================================================
// CONTROL TESTER TAB
// ============================================================
function renderTesterTab() { renderTesterStep(currentStep.tester); }

function renderTesterStep(step) {
  if (step===1) renderTesterStep1();
  if (step===2) renderTesterStep2();
  if (step===3) renderTesterStep3();
  if (step===4) renderTesterStep4();
}

function renderTesterStep1() {
  const body = document.getElementById('tester-step-1-body');
  if (!body) return;
  if (!state.baseline) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">🏛️</div><div class="es-title">CISO Setup Required</div><p>The CISO must complete all program setup steps first, including baseline selection, PM controls, and control assignment.</p></div>`;
    return;
  }
  const controls = getActiveControls();
  const implemented = controls.filter(c=>(state.controlStatus[c.id]||{}).status==='Implemented');
  body.innerHTML = `
    <div class="section-title">Testing Scope</div>
    <div class="section-subtitle">Select controls to include in this test cycle. Best practice is to test implemented controls.</div>
    <div class="summary-box" style="margin-bottom:20px;">
      <h3>Program Overview</h3>
      <div class="summary-kv"><span class="sk">Total Controls in Scope:</span><span class="sv">${controls.length}</span></div>
      <div class="summary-kv"><span class="sk">Implemented:</span><span class="sv">${implemented.length}</span></div>
      <div class="summary-kv"><span class="sk">Previously Tested:</span><span class="sv">${Object.keys(state.controlTestResults).length}</span></div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <strong style="font-size:14px;">Select Controls for Testing</strong>
      <div>
        <button class="btn btn-secondary btn-sm" onclick="selectAllTests(true)">Select All</button>
        <button class="btn btn-secondary btn-sm" onclick="selectAllTests(false)" style="margin-left:6px;">Clear</button>
        <button class="btn btn-secondary btn-sm" onclick="selectImplementedTests()" style="margin-left:6px;">Select Implemented</button>
      </div>
    </div>
    <div class="table-scroll">
      <table class="control-table">
        <thead><tr><th style="width:40px;">✓</th><th style="width:80px;">ID</th><th>Control Name</th><th>Status</th><th>Last Tested</th></tr></thead>
        <tbody id="testScopeTable">
          ${controls.map(c => {
            const cs = state.controlStatus[c.id]||{};
            const tr = state.controlTestResults[c.id]||{};
            return `<tr>
              <td><input type="checkbox" class="test-scope-cb" data-id="${c.id}" ${tr.selected?'checked':''} style="accent-color:var(--teal);"
                onchange="state.controlTestResults['${c.id}']={...(state.controlTestResults['${c.id}']||{}),selected:this.checked}"></td>
              <td><span class="control-id">${c.id}</span></td>
              <td>${c.n}</td>
              <td>${chipHTML(cs.status||'Not Started')}</td>
              <td style="font-size:12px; color:var(--text-muted);">${tr.date||'Never'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function selectAllTests(val) {
  document.querySelectorAll('.test-scope-cb').forEach(cb => {
    cb.checked = val;
    const id = cb.dataset.id;
    if (!state.controlTestResults[id]) state.controlTestResults[id] = {};
    state.controlTestResults[id].selected = val;
  });
}

function selectImplementedTests() {
  document.querySelectorAll('.test-scope-cb').forEach(cb => {
    const id = cb.dataset.id;
    const isImpl = (state.controlStatus[id]||{}).status === 'Implemented';
    cb.checked = isImpl;
    if (!state.controlTestResults[id]) state.controlTestResults[id] = {};
    state.controlTestResults[id].selected = isImpl;
  });
}

function renderTesterStep2() {
  const body = document.getElementById('tester-step-2-body');
  if (!body) return;
  const selected = getActiveControls().filter(c => state.controlTestResults[c.id]?.selected);
  if (!selected.length) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls Selected for Testing</div><p>Return to Step 1 and select at least one control that has been implemented. Only implemented controls should be included in test cycles.</p></div>`;
    return;
  }
  body.innerHTML = `
    <div class="section-title">Test Procedures</div>
    <div class="section-subtitle">${selected.length} controls selected for testing. Review standard test procedures below.</div>
    <div class="controls-list scroll-area">
      ${selected.map(c => `
      <div class="ctrl-row" style="flex-direction:column; align-items:stretch; gap:6px;">
        <div style="display:flex; gap:10px; align-items:center;">
          <span class="cr-id">${c.id}</span>
          <span style="font-weight:600; font-size:13px; flex:1;">${c.n}</span>
        </div>
        <div style="font-size:12px; color:var(--text-muted); background:#f8fafc; padding:8px 10px; border-radius:6px; border:1px solid var(--border);">
          <strong>Test Procedure:</strong> (1) Review policy documentation for ${c.n.toLowerCase()}. (2) Interview responsible personnel. (3) Observe system configuration or logs. (4) Test a sample of records or outputs for compliance.
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <input class="form-input" style="font-size:12px;" placeholder="Tester notes / procedure modifications..." value="${escapeHTML(state.controlTestResults[c.id]?.procedure||'')}"
            oninput="setTestField('${c.id}','procedure',this.value)">
        </div>
      </div>`).join('')}
    </div>`;
}

function setTestField(id, field, value) {
  if (!state.controlTestResults[id]) state.controlTestResults[id] = {};
  state.controlTestResults[id][field] = value;
}

function renderTesterStep3() {
  const body = document.getElementById('tester-step-3-body');
  if (!body) return;
  const selected = getActiveControls().filter(c => state.controlTestResults[c.id]?.selected);
  if (!selected.length) {
    body.innerHTML = `<div class="empty-state"><div class="es-icon">📋</div><div class="es-title">No Controls Selected for Testing</div><p>Return to Step 1 and select the controls you want to test. Record results after reviewing test procedures in Step 2.</p></div>`;
    return;
  }
  body.innerHTML = `
    <div class="section-title">Record Test Results</div>
    <div class="section-subtitle">Enter test results and evidence for each selected control.</div>
    <div class="controls-list scroll-area">
      ${selected.map(c => {
        const tr = state.controlTestResults[c.id]||{};
        return `
        <div class="ctrl-row" style="flex-direction:column; align-items:stretch; gap:8px;">
          <div style="display:flex; gap:10px; align-items:center;">
            <span class="cr-id">${c.id}</span>
            <span style="font-weight:600; flex:1;">${c.n}</span>
            ${chipHTML(tr.result||'—')}
          </div>
          <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px;">
            <div>
              <label class="form-label" style="font-size:11px;">Test Result</label>
              <select class="form-select" style="font-size:12px;" onchange="setTestField('${c.id}','result',this.value)">
                <option ${!tr.result?'selected':''}>— Select —</option>
                <option ${tr.result==='Pass'?'selected':''}>Pass</option>
                <option ${tr.result==='Partial'?'selected':''}>Partial</option>
                <option ${tr.result==='Fail'?'selected':''}>Fail</option>
              </select>
            </div>
            <div>
              <label class="form-label" style="font-size:11px;">Test Date</label>
              <input class="form-input" type="date" style="font-size:12px;" value="${tr.date||new Date().toISOString().slice(0,10)}"
                oninput="setTestField('${c.id}','date',this.value)">
            </div>
            <div>
              <label class="form-label" style="font-size:11px;">Tester Name</label>
              <input class="form-input" style="font-size:12px;" placeholder="Your name" value="${tr.tester||''}"
                oninput="setTestField('${c.id}','tester',this.value)">
            </div>
          </div>
          <div>
            <label class="form-label" style="font-size:11px;">Evidence / Findings</label>
            <input class="form-input" style="font-size:12px;" placeholder="Evidence reference and any findings noted..." value="${tr.findings||''}"
              oninput="setTestField('${c.id}','findings',this.value)">
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function saveTestResults() { goToStep('tester', 4); }

function renderTesterStep4() {
  const body = document.getElementById('tester-step-4-body');
  if (!body) return;
  const selected = getActiveControls().filter(c => state.controlTestResults[c.id]?.selected);
  const passed = selected.filter(c => state.controlTestResults[c.id]?.result==='Pass');
  const failed = selected.filter(c => state.controlTestResults[c.id]?.result==='Fail');
  const partial = selected.filter(c => state.controlTestResults[c.id]?.result==='Partial');
  const untested = selected.filter(c => !state.controlTestResults[c.id]?.result || state.controlTestResults[c.id]?.result==='— Select —');

  body.innerHTML = `
    <div class="section-title">Findings &amp; Test Report</div>
    <div class="section-subtitle">Summary of test results and deficiencies requiring remediation.</div>
    <div class="metrics-grid" style="grid-template-columns:repeat(4,1fr); margin-bottom:20px;">
      <div class="metric-card"><div class="mc-value" style="color:var(--green);">${passed.length}</div><div class="mc-label">Passed</div></div>
      <div class="metric-card"><div class="mc-value" style="color:var(--amber);">${partial.length}</div><div class="mc-label">Partial</div></div>
      <div class="metric-card"><div class="mc-value" style="color:var(--red);">${failed.length}</div><div class="mc-label">Failed</div></div>
      <div class="metric-card"><div class="mc-value" style="color:var(--slate);">${untested.length}</div><div class="mc-label">Not Recorded</div></div>
    </div>
    ${failed.length > 0 ? `
    <div style="margin-bottom:20px;">
      <strong style="font-size:14px; color:var(--red);">⚠️ Failed Controls — Remediation Required</strong>
      <div class="controls-list" style="margin-top:10px;">
        ${failed.map(c => {
          const tr = state.controlTestResults[c.id]||{};
          return `<div class="ctrl-row">
            <span class="cr-id">${c.id}</span>
            <span style="flex:1; font-size:13px;">${c.n}</span>
            <span class="chip chip-red">FAIL</span>
            <span style="font-size:12px; color:var(--text-muted); max-width:200px; text-overflow:ellipsis; overflow:hidden;">${tr.findings||'No details'}</span>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}
    <div class="info-alert" style="background:#f0fdf4; border-color:#bbf7d0;">
      <div class="ia-icon">📄</div>
      <div class="ia-text" style="color:#166534;">Click "Finalize Test Report" to lock in these results. Failed controls will appear as open findings in the Reports dashboard.</div>
    </div>`;
}

function finalizeTestReport() {
  state.testReportFinalized = true;
  state.testReportDate = new Date().toLocaleDateString();
  showToast('✅ Test report finalized! Results are now in the Reports dashboard.');
}

// ============================================================
// TEST ADEQUACY VIEW — Control Testing Frequency & Progress
// ============================================================
function openTestAdequacyView(controlId) {
  const ctrl = CONTROLS.find(c => c.id === controlId);
  if (!ctrl) return;

  // Default test frequencies per family
  const defaultFrequencies = {
    AC: 'Quarterly', AT: 'Annual', AU: 'Monthly', CA: 'Quarterly',
    CM: 'Monthly', CP: 'Annual', IA: 'Monthly', IR: 'Annual',
    MA: 'Quarterly', MP: 'Annual', PE: 'Quarterly', PL: 'Annual',
    PM: 'Annual', PS: 'Annual', PT: 'Annual', RA: 'Annual',
    SA: 'Quarterly', SC: 'Monthly', SI: 'Monthly', SR: 'Annual'
  };

  const freq = defaultFrequencies[ctrl.f] || 'Quarterly';
  const adequacy = state.testAdequacy && state.testAdequacy[controlId] || {
    frequency: freq,
    completedTests: 0,
    requiredTests: 4,
    lastTest: null,
    nextTestDue: null
  };

  const overlay = document.createElement('div');
  overlay.id = 'testAdequacyOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:white;border-radius:12px;padding:32px;width:520px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.25);">
      <h2 style="margin:0 0 24px 0;color:var(--navy);font-size:18px;">${ctrl.id} — Test Adequacy</h2>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
        <div style="border:1px solid var(--border);border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;">Testing Frequency</div>
          <div style="font-size:16px;font-weight:700;color:var(--teal);">${adequacy.frequency}</div>
        </div>
        <div style="border:1px solid var(--border);border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;">Last Test</div>
          <div style="font-size:14px;color:var(--text);">${adequacy.lastTest ? new Date(adequacy.lastTest).toLocaleDateString() : 'Never'}</div>
        </div>
      </div>

      <div style="border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px;">Test Progress (${adequacy.completedTests}/${adequacy.requiredTests})</div>
        <div style="display:grid;grid-template-columns:repeat(${adequacy.requiredTests},1fr);gap:8px;">
          ${Array.from({length: adequacy.requiredTests}, (_, i) => `
            <div style="aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:${i < adequacy.completedTests ? 'var(--green)' : 'var(--border)'};color:${i < adequacy.completedTests ? 'white' : 'var(--text-muted)'};">
              ${i < adequacy.completedTests ? '✓' : (i+1)}
            </div>
          `).join('')}
        </div>
      </div>

      ${adequacy.nextTestDue ? `
      <div style="background:rgba(13,148,136,0.05);border:1px solid rgba(13,148,136,0.2);border-radius:8px;padding:12px;margin-bottom:24px;font-size:13px;color:var(--text);">
        Next test due: <strong>${new Date(adequacy.nextTestDue).toLocaleDateString()}</strong>
      </div>
      ` : ''}

      <div style="display:flex;gap:12px;justify-content:flex-end;">
        <button onclick="document.getElementById('testAdequacyOverlay').remove()" style="padding:10px 20px;border:1px solid var(--border);background:white;border-radius:6px;cursor:pointer;">Close</button>
        <button onclick="recordTestExecution('${controlId}'); document.getElementById('testAdequacyOverlay').remove();" style="padding:10px 20px;background:var(--teal);color:white;border:none;border-radius:6px;cursor:pointer;">Record Test</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', function(e){ if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function recordTestExecution(controlId) {
  if (!state.testAdequacy) state.testAdequacy = {};
  const adequacy = state.testAdequacy[controlId] || {
    frequency: 'Quarterly',
    completedTests: 0,
    requiredTests: 4,
    lastTest: null,
    nextTestDue: null
  };
  adequacy.completedTests = (adequacy.completedTests || 0) + 1;
  adequacy.lastTest = new Date().toISOString();
  // Calculate next test due based on frequency
  const now = new Date();
  const freq = adequacy.frequency;
  let nextDue = new Date(now);
  if (freq.includes('Monthly')) nextDue.setMonth(nextDue.getMonth() + 1);
  else if (freq.includes('Quarterly')) nextDue.setMonth(nextDue.getMonth() + 3);
  else if (freq.includes('Annual')) nextDue.setFullYear(nextDue.getFullYear() + 1);
  adequacy.nextTestDue = nextDue.toISOString();
  state.testAdequacy[controlId] = adequacy;
  markDirty();
  showToast('✅ Test execution recorded for ' + controlId);
}
