#!/usr/bin/env node
/** Generate minimal CSF demo snapshots and write to js/csf-snapshots.js */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function buildSnapshot(extra) {
  var sel = {};
  var cats = ['GV.OC','GV.RM','GV.RR','GV.PO','GV.OV','GV.SC','ID.AM','ID.RA','ID.IM','PR.AA','PR.AT','PR.DS','PR.PS','PR.IR','DE.CM','DE.AE','RS.MA','RS.AN','RS.CO','RS.MI','RC.RP','RC.CO'];
  cats.forEach(function(c) { sel[c] = true; });
  var gv = {};
  ['GV.PO-01','GV.PO-02','GV.RR-01','GV.RR-02','GV.RM-01','GV.RM-02','GV.OC-01'].forEach(function(id) { gv[id] = true; });
  var base = {
    selectedCategories: sel,
    policyStructure: 'category',
    gvSubcategories: gv,
    categoryMerges: { 'PR.AT': 'PR.AA', 'RC.CO': 'RC.RP' },
    orgName: 'XMPL Co.',
    programOwner: 'Dana Reyes',
    programOwnerTitle: 'Chief Information Security Officer',
    programOwnerEmail: 'dana.reyes@xmpl.io',
    cisoIsISSM: true,
    domainOwners: {
      'PR.AA': { name: 'Kai Nakamura', email: 'kai.nakamura@xmpl.io', role: 'IAM Lead' },
      'GV.PO': { name: 'Dana Reyes', email: 'dana.reyes@xmpl.io', role: 'Chief Information Security Officer' },
      'ID.RA': { name: 'Mira Okonkwo', email: 'mira.okonkwo@xmpl.io', role: 'GRC Lead' },
      'DE.CM': { name: 'Sofia Hernandez', email: 'sofia.hernandez@xmpl.io', role: 'Security Operations Lead' },
      'RS.MA': { name: 'Liam Park', email: 'liam.park@xmpl.io', role: 'Incident Response Lead' }
    },
    policyMerges: { 'PR.AT': 'PR.AA', 'RC.CO': 'RC.RP' },
    policyPriorities: { 'PR.AA': 'now', 'GV.PO': 'now', 'ID.RA': 'soon', 'DE.CM': 'soon' },
    domainCustomNames: { 'PR.AT': 'People & Access (PR.AA+PR.AT)' },
    cisoComplete: false,
    infoSecPolicy: {
      title: 'Cybersecurity Governance Policy',
      requirements: [
        { id: 'GV-REQ-1', text: 'Policy for managing cybersecurity risks is established based on organizational context.', subcategories: ['GV.PO-01'], controls: ['GV.PO-01'] },
        { id: 'GV-REQ-2', text: 'Roles, responsibilities, and authorities related to cybersecurity risk management are established.', subcategories: ['GV.RR-01'], controls: ['GV.RR-01'] }
      ],
      sections: [{ type: 'purpose', title: 'Purpose', content: 'XMPL Co. cybersecurity governance policy.' }],
      roles: [{ name: 'Chief Information Security Officer', responsibilities: ['Maintain Tier 1 governance policy'] }],
      documents: [{ title: 'NIST CSF 2.0', url: 'https://www.nist.gov/cyberframework' }]
    },
    policySelectedControls: null,
    domainPolicies: null,
    controlOwners: {},
    policyStatus: {},
    controlStatus: {},
    users: [
      { id: 'user-1', name: 'Dana Reyes', email: 'dana.reyes@xmpl.io', role: 'ciso', families: ['GV', 'PR.AA'], controls: [], note: 'CISO' }
    ],
    currentUserId: null,
    assets: [],
    processes: [],
    risks: [],
    issues: [],
    auditTrail: [],
    changeLog: [],
    activeFrameworks: {},
    activeComplianceLaws: {}
  };
  return Object.assign(base, extra);
}

var snap1 = buildSnapshot({ cisoComplete: false });
var snap2 = buildSnapshot({
  cisoComplete: true,
  policyStatus: { 'PR.AA': { status: 'Draft', version: '1.0' } },
  policySelectedControls: { 'PR.AA': ['PR.AA-01', 'PR.AA-03', 'PR.AT-01'] }
});

var out = `// js/csf-snapshots.js — CSF demo snapshots (generated)
const XMPL_SNAPSHOT = ${JSON.stringify({
  name: 'XMPL — Governance Policy',
  saved: '2026-07-08T00:00:00.000Z',
  org: 'XMPL Co.',
  data: JSON.stringify(snap1)
}, null, 2)};

const XMPL_DOMAIN_SNAPSHOT = ${JSON.stringify({
  name: 'XMPL — Category Policies',
  saved: '2026-07-08T00:00:00.000Z',
  org: 'XMPL Co.',
  data: JSON.stringify(snap2)
}, null, 2)};
`;

writeFileSync(join(root, 'js', 'csf-snapshots.js'), out);
console.log('Wrote js/csf-snapshots.js');
