/**
 * Build EightFiftyThree-GRC-demo.mp4 from the current app + demo-video-script narrations.
 * Uses Playwright screenshots, edge-tts (Andrew neural voice), and ffmpeg.
 *
 * Each segment may define multiple weighted scenes so on-screen content matches narration beats.
 *
 * Prerequisites: npm ci, npx playwright install chromium, pip install edge-tts
 * Run: npm run build:demo-video
 */
import { chromium } from '@playwright/test';
import ffmpegPath from 'ffmpeg-static';
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'tools', 'demo-video-build');
const OUT_MP4 = path.join(ROOT, 'assets', 'EightFiftyThree-GRC-demo.mp4');
const PORT = 4173;
const VIEWPORT = { width: 1920, height: 1080 };
const VOICE = 'en-US-AndrewMultilingualNeural';
const TTS_RATE = '-2%';

const SEGMENTS = [
  {
    id: '01-landing',
    narration:
      "This is EightFiftyThree GRC — a free, browser-based tool for running a NIST 800-53 program. No install, no license, no vendor lock-in. Let me walk you through a real program built in it, for a company I'll call XMPL.",
    scenes: [
      {
        weight: 1,
        capture: async (page) => {
          await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
          await page.evaluate(() => window.scrollTo(0, 0));
        },
      },
    ],
  },
  {
    id: '02-command-center',
    narration:
      "This is the Command Center — where the security lead lands after setup: next actions, program posture, and a way into every workspace. Setup itself is a guided wizard — pick a baseline of Low, Moderate, or High, layer in privacy controls, choose your Program Management controls, draft the organization's information security policy, and assign every control family to an owner. The output is a defensible program structure, not a spreadsheet of checkboxes.",
    setup: async (page) => loadXmplDemo(page),
    scenes: [
      {
        weight: 0.32,
        capture: async (page) => {
          await page.evaluate(() => {
            showTab('home');
            if (typeof renderHomeTab === 'function') renderHomeTab();
          });
        },
      },
      {
        weight: 0.28,
        capture: async (page) => {
          await page.evaluate(() => {
            showTab('ciso');
            goToStep('ciso', 2);
          });
        },
      },
      {
        weight: 0.4,
        capture: async (page) => {
          await page.evaluate(() => {
            goToStep('ciso', 7);
          });
        },
      },
    ],
  },
  {
    id: '03-lifecycle',
    narration:
      "Here's what matters most to me — the thread from policy to evidence. Start at a domain policy: it has an owner, a custodian, a review cycle, and the specific controls it governs. Follow one of those controls into the control-implementation workspace, where the control owner records how it's designed — per asset type — with a pointer to the evidence. Now follow that same control into Assets and SSP, where the asset owner attests to it on the actual system and documents the interconnections. One control — traced from written policy, to implementation, to an attested system boundary. That's the RMF lifecycle, kept connected, with an audit trail behind every step.",
    scenes: [
      {
        weight: 0.28,
        capture: async (page) => {
          await page.evaluate(() => {
            showTab('policy');
            if (typeof enterPolicyWizard === 'function') enterPolicyWizard('AC');
            currentStep.policy = 1;
            if (typeof renderPolicyStep1 === 'function') renderPolicyStep1();
          });
        },
      },
      {
        weight: 0.3,
        capture: async (page) => {
          await page.evaluate(() => {
            if (typeof goToControlWorkspace === 'function') goToControlWorkspace();
            state._controlLibraryMode = false;
            goToStep('control', 2);
            state._selectedCtrl = 'AC-2';
            if (typeof selectControlDesignFamily === 'function') selectControlDesignFamily('AC');
            if (typeof renderControlStep === 'function') renderControlStep(2);
          });
        },
      },
      {
        weight: 0.22,
        capture: async (page) => {
          await page.evaluate(() => {
            var a = (state.assets || [])[0];
            if (a) openAssetSspStep(a.id, 2);
          });
        },
      },
      {
        weight: 0.2,
        capture: async (page) => {
          await page.evaluate(() => {
            var a = (state.assets || [])[0];
            if (a) openAssetSspStep(a.id, 3);
          });
        },
      },
    ],
  },
  {
    id: '04-risk-ato',
    narration:
      "Gaps become risks. The Risks and Issues workspace triages signals from those attestations into a risk register and tracks remediation as POA&M-compatible issues. And when it's time to authorize, the Authorizing Official records a real decision right from the dashboard — an ATO, an interim authorization, or a denial — with conditions, an expiry, a residual-risk narrative, and a signature. Separation of duties is enforced: whoever accepts a risk can't be the person who logged it.",
    scenes: [
      {
        weight: 0.42,
        capture: async (page) => {
          await page.evaluate(() => {
            var ciso = (state.users || []).find(function (u) { return u.role === 'ciso'; });
            state.currentUserId = ciso ? ciso.id : null;
            state._riskView = 'triage';
            showTab('risk');
            if (typeof renderRiskTab === 'function') renderRiskTab();
          });
        },
      },
      {
        weight: 0.58,
        capture: async (page) => {
          await page.evaluate(() => {
            showTab('reports');
            if (typeof renderReports === 'function') renderReports();
            var bid = 'ato-b-xmpl-demo';
            var b = (state.authBoundaries || []).find(function (x) { return x.id === bid; });
            if (!b && state.authBoundaries && state.authBoundaries[0]) bid = state.authBoundaries[0].id;
            if (typeof openAtoDecisionModal === 'function') openAtoDecisionModal(bid);
          });
        },
      },
    ],
  },
  {
    id: '05-frameworks',
    narration:
      'One program, many audit lenses. Turn on ISO 27001, SOC 2, or HIPAA, and every control maps across — with coverage updating live as owners mark implementation. Build the program once; report against whichever framework the auditor in front of you cares about.',
    scenes: [
      {
        weight: 0.38,
        capture: async (page) => {
          await page.evaluate(() => {
            state.currentUserId = null;
            closeDemoOverlays();
            if (!state.activeFrameworks) state.activeFrameworks = {};
            if (!state.activeComplianceLaws) state.activeComplianceLaws = {};
            state.activeFrameworks.iso27001 = true;
            state.activeFrameworks.soc2 = true;
            state.activeComplianceLaws.hipaa = true;
            state._frameworkFilter = '';
            showTab('frameworks');
            if (typeof renderFrameworksTab === 'function') renderFrameworksTab();
          });
        },
      },
      {
        weight: 0.62,
        capture: async (page) => {
          await page.evaluate(() => {
            state._frameworkFilter = 'iso27001';
            if (typeof renderFrameworksTab === 'function') renderFrameworksTab();
          });
        },
      },
    ],
  },
  {
    id: '06-thesis',
    narration:
      "And every bit of this is deliberate — zero dependencies, everything runs in your browser, and your entire program exports to a file in one click. Built in the open, on purpose. That's EightFiftyThree GRC.",
    scenes: [
      {
        weight: 0.52,
        capture: async (page) => {
          await page.evaluate(() => {
            closeDemoOverlays();
            state.currentUserId = null;
            showTab('home');
            if (typeof renderHomeTab === 'function') renderHomeTab();
            window.scrollTo(0, 0);
          });
        },
      },
      {
        weight: 0.48,
        capture: async (page) => {
          await page.goto(`http://127.0.0.1:${PORT}/index.html#design`, { waitUntil: 'networkidle' });
          await page.evaluate(() => {
            var el = document.getElementById('design');
            if (el) el.scrollIntoView({ block: 'start' });
          });
        },
      },
    ],
  },
];

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: opts.quiet ? 'pipe' : 'inherit', ...opts });
    let out = '';
    if (opts.quiet && child.stdout) child.stdout.on('data', (d) => { out += d; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

function edgeTts() {
  return ['-m', 'edge_tts'];
}

async function generateAudio(text, outFile) {
  const py = process.platform === 'win32' ? 'python' : 'python3';
  await run(py, [
    ...edgeTts(),
    '--voice', VOICE,
    '--rate', TTS_RATE,
    '--text', text,
    '--write-media', outFile,
  ]);
}

function probeDurationSec(mediaFile) {
  const probe = spawnSync(ffmpegPath, ['-hide_banner', '-i', mediaFile], { encoding: 'utf8' });
  const m = (probe.stderr || '').match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return 18;
  return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseFloat(m[3]);
}

async function makeVideoOnlyClip(framePng, durationSec, outMp4) {
  await run(ffmpegPath, [
    '-y',
    '-loop', '1',
    '-i', framePng,
    '-c:v', 'libx264',
    '-tune', 'stillimage',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-t', String(Math.max(durationSec, 0.5)),
    '-an',
    outMp4,
  ], { quiet: true });
}

async function muxVideoWithAudio(videoMp4, audioMp3, outMp4) {
  await run(ffmpegPath, [
    '-y',
    '-i', videoMp4,
    '-i', audioMp3,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    outMp4,
  ], { quiet: true });
}

async function makeMultiSceneSegmentClip(scenes, audioMp3, outMp4) {
  const totalDur = Math.max(probeDurationSec(audioMp3) + 0.35, 8);
  const totalWeight = scenes.reduce((sum, s) => sum + s.weight, 0);
  const subClips = [];

  for (let i = 0; i < scenes.length; i++) {
    const dur = (scenes[i].weight / totalWeight) * totalDur;
    const subMp4 = path.join(BUILD_DIR, `scene-${path.basename(outMp4, '.mp4')}-${i}.mp4`);
    await makeVideoOnlyClip(scenes[i].frame, dur, subMp4);
    subClips.push(subMp4);
  }

  const videoOnly = path.join(BUILD_DIR, `video-${path.basename(outMp4)}`);
  await concatClips(subClips, videoOnly);
  await muxVideoWithAudio(videoOnly, audioMp3, outMp4);
}

async function concatClips(clips, outFile) {
  const listFile = path.join(BUILD_DIR, `concat-${path.basename(outFile)}.txt`);
  fs.writeFileSync(listFile, clips.map((c) => `file '${c.replace(/\\/g, '/')}'`).join('\n'));
  await run(ffmpegPath, [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-c', 'copy',
    '-movflags', '+faststart',
    outFile,
  ], { quiet: true });
}

async function injectDemoVideoHelpers(page) {
  await page.evaluate(() => {
    window.prepareDemoProgramForVideo = function () {
      state.cisoComplete = true;
      state._phase2SidebarFirstLive = true;

      if (!state.policyStatus) state.policyStatus = {};
      ['AC', 'ISP'].forEach(function (fam) {
        if (!state.policyStatus[fam]) state.policyStatus[fam] = {};
        state.policyStatus[fam].status = 'Approved';
      });

      if (!(state.assets || []).length) {
        state.assets = [{
          id: 'asset-xmpl-demo-1',
          name: 'XMPL Collaboration Suite',
          type: 'saas',
          owner: 'Liam Park',
          ownerEmail: 'liam.park@xmpl.io',
          description: 'Primary collaboration and file sharing platform.',
        }];
      }

      var aid = state.assets[0].id;
      if (!state.sspAttestations) state.sspAttestations = {};
      if (!state.sspAttestations[aid]) state.sspAttestations[aid] = {};
      state.sspAttestations[aid]['AC-2'] = {
        status: 'Does Not Comply',
        notes: 'Legacy shared accounts still in use on three service lines.',
      };

      if (!state.sspInterconnections) state.sspInterconnections = {};
      if (!(state.sspInterconnections[aid] || []).length) {
        state.sspInterconnections[aid] = [
          { id: 1, name: 'XMPL IdP (Azure AD)', direction: 'inbound', dataTypes: 'Auth tokens', fipsValid: true },
          { id: 2, name: 'Customer HRIS export', direction: 'outbound', dataTypes: 'Employee roster', fipsValid: false },
        ];
      }

      if (!state.controlStatus) state.controlStatus = {};
      if (!state.controlStatus['AC-2']) {
        state.controlStatus['AC-2'] = { status: 'In Progress', approach: '', narrative: '', evidence: [], notes: '' };
      }
      if (!(state.controlStatus['AC-2'].evidence || []).length) {
        state.controlStatus['AC-2'].evidence = [{
          assetType: 'saas',
          requirement: 'Review service accounts quarterly and revoke stale access.',
          evidenceNeeded: 'Access review ticket export',
          url: '',
          ref: 'SharePoint: /sites/security/ac-2-reviews',
        }];
      }

      if (typeof seedXmplAtoDemoDataIfMissing === 'function') seedXmplAtoDemoDataIfMissing();

      if (!state.activeFrameworks) state.activeFrameworks = {};
      if (!state.activeComplianceLaws) state.activeComplianceLaws = {};
      state.activeFrameworks.iso27001 = true;
      state.activeFrameworks.soc2 = true;
      state.activeComplianceLaws.hipaa = true;

      if (typeof applySetupFocusMode === 'function') applySetupFocusMode();
      if (typeof applyPostSetupNav === 'function') applyPostSetupNav();
      if (typeof renderSidebarBadges === 'function') renderSidebarBadges();
      if (typeof renderSidebarRiskInventory === 'function') renderSidebarRiskInventory();
      if (typeof renderProgramPhaseBar === 'function') renderProgramPhaseBar();
    };

    window.closeDemoOverlays = function () {
      if (typeof closeAtoDecisionModal === 'function') closeAtoDecisionModal();
      var ov = document.getElementById('atoDecisionOverlay');
      if (ov) ov.remove();
    };

    window.openAssetSspStep = function (assetId, step) {
      showTab('asset');
      state._assetLibraryMode = false;
      state._assetTypeLibraryMode = false;
      state._sspReviewerReadOnly = false;
      state._selectedAssetId = String(assetId);
      state._selectedProcessId = null;
      var listPanel = document.getElementById('asset-list-panel');
      var wizPanel = document.getElementById('asset-wizard-panel');
      if (listPanel) listPanel.style.display = 'none';
      if (wizPanel) wizPanel.style.display = 'flex';
      currentStep.asset = step;
      for (var i = 1; i <= 4; i++) {
        var s = document.getElementById('asset-step-' + i);
        if (s) s.classList.toggle('active', i === step);
      }
      if (typeof renderAssetWizardChrome === 'function') renderAssetWizardChrome();
      if (typeof renderAssetStep === 'function') renderAssetStep(step);
    };
  });
}

async function loadXmplDemo(page) {
  await page.goto(`http://127.0.0.1:${PORT}/app.html`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => typeof applyLoadedState === 'function' && typeof XMPL_DOMAIN_SNAPSHOT !== 'undefined',
    { timeout: 120000 }
  );
  await injectDemoVideoHelpers(page);
  await page.evaluate(() => {
    if (typeof hideCloudSignInGate === 'function') hideCloudSignInGate();
    resetStateToDefaults();
    applyLoadedState(JSON.parse(XMPL_DOMAIN_SNAPSHOT.data));
    if (typeof reapplySessionRoleView === 'function') reapplySessionRoleView();
    state.currentUserId = null;
    Object.keys(currentStep).forEach(function (k) { currentStep[k] = 1; });
    prepareDemoProgramForVideo();
    saveToStorage();
    if (typeof bootAfterStateReady === 'function') bootAfterStateReady();
  });
  await page.waitForTimeout(800);
}

async function startServer() {
  const child = spawn('npx', ['--yes', 'serve', '.', '-p', String(PORT)], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true,
  });
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/index.html`);
      if (res.ok) return child;
    } catch (_) { /* retry */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  child.kill();
  throw new Error('Static server did not start on port ' + PORT);
}

async function main() {
  if (!ffmpegPath) throw new Error('ffmpeg-static binary not found');
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OUT_MP4), { recursive: true });

  console.log('Starting static server…');
  const server = await startServer();

  let browser;
  const segmentMp4s = [];
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.setDefaultTimeout(120000);

    for (const seg of SEGMENTS) {
      console.log('Segment:', seg.id);
      if (seg.setup) await seg.setup(page);

      const sceneFrames = [];
      for (let i = 0; i < seg.scenes.length; i++) {
        const scene = seg.scenes[i];
        await scene.capture(page);
        await page.waitForTimeout(scene.waitMs ?? 550);
        const frame = path.join(BUILD_DIR, `${seg.id}-scene${i}.png`);
        await page.screenshot({ path: frame, fullPage: false });
        sceneFrames.push({ frame, weight: scene.weight });
        console.log(`  Scene ${i + 1}/${seg.scenes.length}`);
      }

      const audio = path.join(BUILD_DIR, `${seg.id}.mp3`);
      const clip = path.join(BUILD_DIR, `${seg.id}.mp4`);
      console.log('  TTS…');
      await generateAudio(seg.narration, audio);
      console.log('  Encode…');
      await makeMultiSceneSegmentClip(sceneFrames, audio, clip);
      segmentMp4s.push(clip);
    }

    console.log('Concatenating…');
    await concatClips(segmentMp4s, OUT_MP4);
    const sizeMb = (fs.statSync(OUT_MP4).size / (1024 * 1024)).toFixed(1);
    console.log(`Done: ${OUT_MP4} (${sizeMb} MB)`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
