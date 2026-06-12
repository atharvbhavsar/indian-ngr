/**
 * Test script to verify that AOM User Creation Modals are standardized to use SAStaffModal
 * as the source of truth, and that the obsolete custom HTML rendering has been removed.
 */
const fs = require('fs');
const path = require('path');

const useAomStatePath = path.join(__dirname, '../src/hooks/useAomState.jsx');

function runTest() {
  console.log("=================================================");
  console.log("=== AOM MODAL STANDARDIZATION VERIFICATION TEST ===");
  console.log("=================================================\n");

  if (!fs.existsSync(useAomStatePath)) {
    console.error(`Error: useAomState.jsx not found at ${useAomStatePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(useAomStatePath, 'utf8');

  let passed = true;

  // 1. Verify SAStaffModal import
  const hasSaImport = content.includes("import { SAStaffModal }") || content.includes("import {SAStaffModal}");
  if (hasSaImport) {
    console.log("✅ [PASSED] SAStaffModal is imported in useAomState.jsx");
  } else {
    console.error("❌ [FAILED] SAStaffModal import not found in useAomState.jsx");
    passed = false;
  }

  // 2. Verify that old manual modals with custom headers/sections have been replaced
  const oldPmTitle = "ADD NEW OPERATIONAL POINTSMAN";
  const oldSmTitle = "ADD NEW STATION MASTER";
  const oldSsTitle = "ADD NEW STATION SUPERINTENDENT";
  const oldTmTitle = "ADD NEW TRAIN MANAGER";
  const oldTiTitle = "ADD NEW TRAFFIC INSPECTOR";

  const manualTitles = [oldPmTitle, oldSmTitle, oldSsTitle, oldTmTitle, oldTiTitle];
  manualTitles.forEach(title => {
    if (content.includes(title)) {
      console.error(`❌ [FAILED] Found obsolete manual header: "${title}" inside useAomState.jsx`);
      passed = false;
    } else {
      console.log(`✅ [PASSED] Obsolete manual header "${title}" has been successfully removed.`);
    }
  });

  // 3. Verify render*Modal returns SAStaffModal
  const renderers = [
    { name: 'renderPmModal', stateVar: 'pmModal' },
    { name: 'renderSmModal', stateVar: 'smModal' },
    { name: 'renderSsModal', stateVar: 'ssModal' },
    { name: 'renderTmModal', stateVar: 'tmModal' },
    { name: 'renderTiModal', stateVar: 'tiModal' }
  ];

  renderers.forEach(r => {
    const functionStartIdx = content.indexOf(`const ${r.name}`);
    if (functionStartIdx === -1) {
      console.error(`❌ [FAILED] Function ${r.name} not found in useAomState.jsx`);
      passed = false;
      return;
    }
    const functionEndIdx = content.indexOf('};', functionStartIdx + 15);
    const body = content.substring(functionStartIdx, functionEndIdx);
    if (body.includes('<SAStaffModal')) {
      console.log(`✅ [PASSED] ${r.name} returns <SAStaffModal>`);
    } else {
      console.error(`❌ [FAILED] ${r.name} does not return <SAStaffModal>`);
      passed = false;
    }
  });

  // 4. Verify modal data structure uses 'id' instead of hrmsId/employeeId in Add openers
  const openPmAddStr = "openPmAdd";
  const openPmAddIdx = content.indexOf(openPmAddStr);
  if (openPmAddIdx !== -1) {
    const endIdx = content.indexOf('};', openPmAddIdx);
    const pmAddBody = content.substring(openPmAddIdx, endIdx);
    if (pmAddBody.includes('id:') && !pmAddBody.includes('hrmsId:')) {
      console.log("✅ [PASSED] openPmAdd initializes 'id' and does not initialize obsolete 'hrmsId'");
    } else {
      console.error("❌ [FAILED] openPmAdd does not correctly initialize 'id' or still uses 'hrmsId'");
      passed = false;
    }
  } else {
    console.error("❌ [FAILED] openPmAdd function not found in useAomState.jsx");
    passed = false;
  }

  // Final Verdict
  if (passed) {
    console.log("\n>>> SUCCESS: All modal standardization checks passed! <<<");
    process.exit(0);
  } else {
    console.error("\n>>> FAILURE: Some modal standardization checks failed. <<<");
    process.exit(1);
  }
}

runTest();
